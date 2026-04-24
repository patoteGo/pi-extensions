import { execFileSync } from "node:child_process";
import { existsSync, type FSWatcher, readFileSync, statSync, unwatchFile, watch, watchFile } from "node:fs";
import { dirname, join, resolve } from "node:path";

import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

type GitPaths = {
	repoDir: string;
	commonGitDir: string;
	headPath: string;
	indexPath: string;
	refsHeadsPath: string;
	reftableDir: string;
};

type GitHudState = {
	cwd: string;
	isGitRepo: boolean;
	branch: string | null;
	staged: number;
	unstaged: number;
	untracked: number;
	error?: string;
};

const REFRESH_DEBOUNCE_MS = 150;
const WATCH_FILE_INTERVAL_MS = 250;
const SINGLE_LINE_BREAKPOINT = 72;

const STATUS_SYMBOLS = {
	staged: "✚",
	unstaged: "●",
	untracked: "…",
} as const;

function findGitPaths(cwd: string): GitPaths | null {
	let dir = cwd;
	while (true) {
		const gitPath = join(dir, ".git");
		if (existsSync(gitPath)) {
			try {
				const stat = statSync(gitPath);
				if (stat.isFile()) {
					const content = readFileSync(gitPath, "utf8").trim();
					if (!content.startsWith("gitdir: ")) return null;
					const gitDir = resolve(dir, content.slice(8).trim());
					const headPath = join(gitDir, "HEAD");
					if (!existsSync(headPath)) return null;
					const commonDirPath = join(gitDir, "commondir");
					const commonGitDir = existsSync(commonDirPath)
						? resolve(gitDir, readFileSync(commonDirPath, "utf8").trim())
						: gitDir;
					return {
						repoDir: dir,
						commonGitDir,
						headPath,
						indexPath: join(gitDir, "index"),
						refsHeadsPath: join(commonGitDir, "refs", "heads"),
						reftableDir: join(commonGitDir, "reftable"),
					};
				}

				if (stat.isDirectory()) {
					const headPath = join(gitPath, "HEAD");
					if (!existsSync(headPath)) return null;
					return {
						repoDir: dir,
						commonGitDir: gitPath,
						headPath,
						indexPath: join(gitPath, "index"),
						refsHeadsPath: join(gitPath, "refs", "heads"),
						reftableDir: join(gitPath, "reftable"),
					};
				}
			} catch {
				return null;
			}
		}

		const parent = dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

function resolveDetachedBranch(repoDir: string): string {
	try {
		const branch = execFileSync("git", ["--no-optional-locks", "symbolic-ref", "--quiet", "--short", "HEAD"], {
			cwd: repoDir,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		})
			.trim();
		return branch || "detached";
	} catch {
		return "detached";
	}
}

function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

function formatCost(cost: number): string {
	return `$${cost.toFixed(3)}`;
}

function formatContextUsage(ctx: ExtensionContext): { text: string; percent: number } {
	const usage = ctx.getContextUsage();
	const contextWindow = usage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
	const percent = usage?.percent ?? 0;
	const percentText = usage?.percent === null ? "?" : percent.toFixed(1);
	return {
		text: `${percentText}%/${formatTokens(contextWindow)}`,
		percent,
	};
}

function getSessionStats(ctx: ExtensionContext): {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	cost: number;
} {
	let input = 0;
	let output = 0;
	let cacheRead = 0;
	let cacheWrite = 0;
	let cost = 0;

	for (const entry of ctx.sessionManager.getEntries()) {
		if (entry.type === "message" && entry.message.role === "assistant") {
			const message = entry.message as AssistantMessage;
			input += message.usage.input;
			output += message.usage.output;
			cacheRead += message.usage.cacheRead;
			cacheWrite += message.usage.cacheWrite;
			cost += message.usage.cost.total;
		}
	}

	return { input, output, cacheRead, cacheWrite, cost };
}

function getPwdDisplay(cwd: string): string {
	const home = process.env.HOME || process.env.USERPROFILE;
	if (home && cwd.startsWith(home)) {
		return `~${cwd.slice(home.length)}`;
	}
	return cwd;
}

function isRelevantTool(toolName: string): boolean {
	return toolName === "bash" || toolName === "write" || toolName === "edit";
}

export default function gitHudExtension(pi: ExtensionAPI) {
	let currentCwd = process.cwd();
	let currentState: GitHudState = {
		cwd: currentCwd,
		isGitRepo: false,
		branch: null,
		staged: 0,
		unstaged: 0,
		untracked: 0,
	};
	let refreshTimer: NodeJS.Timeout | undefined;
	let refreshInFlight = false;
	let refreshQueued = false;
	let disposed = false;
	let renderFooter: (() => void) | undefined;
	let trackedCtx: ExtensionContext | undefined;
	let gitPaths: GitPaths | null = null;
	let headWatcher: FSWatcher | undefined;
	let refsWatcher: FSWatcher | undefined;
	let reftableWatcher: FSWatcher | undefined;
	let indexWatcher: FSWatcher | undefined;

	function clearWatchers() {
		headWatcher?.close();
		headWatcher = undefined;
		refsWatcher?.close();
		refsWatcher = undefined;
		reftableWatcher?.close();
		reftableWatcher = undefined;
		indexWatcher?.close();
		indexWatcher = undefined;
		if (gitPaths) unwatchFile(gitPaths.indexPath);
	}

	function requestRender() {
		renderFooter?.();
	}

	function setState(next: GitHudState) {
		currentState = next;
		requestRender();
	}

	function watchPath(path: string, onChange: () => void): FSWatcher | undefined {
		if (!existsSync(path)) return undefined;
		try {
			return watch(path, () => onChange());
		} catch {
			return undefined;
		}
	}

	function installGitWatchers(cwd: string) {
		clearWatchers();
		gitPaths = findGitPaths(cwd);
		if (!gitPaths) return;

		headWatcher = watchPath(dirname(gitPaths.headPath), () => scheduleRefresh(trackedCtx));
		refsWatcher = watchPath(gitPaths.refsHeadsPath, () => scheduleRefresh(trackedCtx));
		reftableWatcher = watchPath(gitPaths.reftableDir, () => scheduleRefresh(trackedCtx));
		indexWatcher = watchPath(gitPaths.indexPath, () => scheduleRefresh(trackedCtx));

		if (existsSync(gitPaths.indexPath)) {
			watchFile(gitPaths.indexPath, { interval: WATCH_FILE_INTERVAL_MS }, (current, previous) => {
				if (
					current.mtimeMs !== previous.mtimeMs ||
					current.ctimeMs !== previous.ctimeMs ||
					current.size !== previous.size
				) {
					scheduleRefresh(trackedCtx);
				}
			});
		}
	}

	async function readGitState(ctx: ExtensionContext): Promise<GitHudState> {
		const cwd = ctx.cwd;
		const result = await pi.exec("git", ["status", "--porcelain=2", "--branch"], {
			cwd,
			timeout: 3000,
		});

		if (result.code !== 0) {
			return {
				cwd,
				isGitRepo: false,
				branch: null,
				staged: 0,
				unstaged: 0,
				untracked: 0,
			};
		}

		let branch: string | null = null;
		let staged = 0;
		let unstaged = 0;
		let untracked = 0;

		for (const line of result.stdout.split(/\r?\n/)) {
			if (!line) continue;

			if (line.startsWith("# branch.head ")) {
				const head = line.slice("# branch.head ".length).trim();
				branch = head === "(detached)" ? resolveDetachedBranch(cwd) : head;
				continue;
			}

			if (line.startsWith("? ")) {
				untracked++;
				continue;
			}

			const kind = line[0];
			if (kind !== "1" && kind !== "2" && kind !== "u") continue;

			const xy = line.slice(2, 4);
			const x = xy[0];
			const y = xy[1];
			if (x && x !== ".") staged++;
			if (y && y !== ".") unstaged++;
		}

		return {
			cwd,
			isGitRepo: true,
			branch,
			staged,
			unstaged,
			untracked,
		};
	}

	async function refresh(ctx: ExtensionContext) {
		if (disposed) return;
		if (refreshInFlight) {
			refreshQueued = true;
			return;
		}

		refreshInFlight = true;
		try {
			if (currentCwd !== ctx.cwd) {
				currentCwd = ctx.cwd;
				installGitWatchers(currentCwd);
			}
			setState(await readGitState(ctx));
		} finally {
			refreshInFlight = false;
			if (refreshQueued && !disposed) {
				refreshQueued = false;
				scheduleRefresh(ctx, 0);
			}
		}
	}

	function scheduleRefresh(ctx: ExtensionContext | undefined, delayMs = REFRESH_DEBOUNCE_MS) {
		if (!ctx || disposed) return;
		trackedCtx = ctx;
		if (refreshTimer) clearTimeout(refreshTimer);
		refreshTimer = setTimeout(() => {
			refreshTimer = undefined;
			void refresh(ctx);
		}, delayMs);
	}

	function renderHud(theme: ExtensionContext["ui"]["theme"], compact = false): string {
		if (!currentState.isGitRepo) {
			return theme.fg("warning", compact ? "git: none" : "git: not a repository");
		}

		const pieces: string[] = [theme.fg("accent", ` ${currentState.branch ?? "detached"}`)];
		const sep = theme.fg("dim", " • ");

		if (currentState.staged === 0 && currentState.unstaged === 0 && currentState.untracked === 0) {
			pieces.push(sep, theme.fg("success", "clean"));
			return pieces.join("");
		}

		if (currentState.staged > 0) {
			const text = compact
				? `${STATUS_SYMBOLS.staged}${currentState.staged}`
				: `${STATUS_SYMBOLS.staged} ${currentState.staged} staged`;
			pieces.push(sep, theme.fg("success", text));
		}
		if (currentState.unstaged > 0) {
			const text = compact
				? `${STATUS_SYMBOLS.unstaged}${currentState.unstaged}`
				: `${STATUS_SYMBOLS.unstaged} ${currentState.unstaged} unstaged`;
			pieces.push(sep, theme.fg("warning", text));
		}
		if (currentState.untracked > 0) {
			const text = compact
				? `${STATUS_SYMBOLS.untracked}${currentState.untracked}`
				: `${STATUS_SYMBOLS.untracked} ${currentState.untracked} untracked`;
			pieces.push(sep, theme.fg("error", text));
		}
		if (currentState.error) pieces.push(sep, theme.fg("error", currentState.error));
		return pieces.join("");
	}

	function installFooter(ctx: ExtensionContext) {
		ctx.ui.setFooter((tui, theme) => {
			renderFooter = () => tui.requestRender();
			return {
				dispose() {
					if (renderFooter) renderFooter = undefined;
				},
				invalidate() {},
				render(width: number): string[] {
					const compact = width <= SINGLE_LINE_BREAKPOINT;
					const hud = renderHud(theme, compact);
					const pwd = getPwdDisplay(currentState.cwd);
					const sessionName = ctx.sessionManager.getSessionName();
					const leftTop = theme.fg("dim", sessionName ? `${pwd} • ${sessionName}` : pwd);
					const topPad = " ".repeat(Math.max(1, width - visibleWidth(leftTop) - visibleWidth(hud)));
					const topLine = truncateToWidth(leftTop + topPad + hud, width);

					const stats = getSessionStats(ctx);
					const statsParts: string[] = [];
					if (stats.input) statsParts.push(`↑${formatTokens(stats.input)}`);
					if (stats.output) statsParts.push(`↓${formatTokens(stats.output)}`);
					if (stats.cacheRead) statsParts.push(`R${formatTokens(stats.cacheRead)}`);
					if (stats.cacheWrite) statsParts.push(`W${formatTokens(stats.cacheWrite)}`);
					if (stats.cost || ctx.model) statsParts.push(formatCost(stats.cost));

					const context = formatContextUsage(ctx);
					const contextText =
						context.percent > 90
							? theme.fg("error", context.text)
							: context.percent > 70
								? theme.fg("warning", context.text)
								: theme.fg("dim", context.text);
					statsParts.push(contextText);

					const leftBottom = theme.fg("dim", statsParts.join(" "));
					const modelText = ctx.model?.id ?? "no-model";
					const rightBottom = theme.fg("dim", modelText);
					const bottomPad = " ".repeat(
						Math.max(1, width - visibleWidth(leftBottom) - visibleWidth(rightBottom)),
					);
					const bottomLine = truncateToWidth(leftBottom + bottomPad + rightBottom, width);

					if (compact) {
						return [topLine];
					}

					return [topLine, bottomLine];
				},
			};
		});
	}

	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		trackedCtx = ctx;
		currentCwd = ctx.cwd;
		disposed = false;
		installFooter(ctx);
		installGitWatchers(currentCwd);
		scheduleRefresh(ctx, 0);
	});

	pi.on("tool_result", async (event, ctx) => {
		if (!ctx.hasUI || !isRelevantTool(event.toolName)) return;
		scheduleRefresh(ctx);
	});

	pi.on("turn_end", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		scheduleRefresh(ctx);
	});

	pi.on("session_shutdown", async () => {
		disposed = true;
		if (refreshTimer) clearTimeout(refreshTimer);
		clearWatchers();
	});
}
