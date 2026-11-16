// Readies a new git worktree: links the main checkout's env files (git ignores
// them) and installs. T3 Code runs it when it creates a worktree (t3.json),
// with T3CODE_PROJECT_ROOT set to the main checkout; by hand, `bun
// scripts/setup-worktree.ts` finds the main checkout through git.
import { lstatSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";

const ENV_FILES = ["apps/back/.env", "apps/web/.env"];

const worktree = dirname(import.meta.dir);
const main =
	process.env.T3CODE_PROJECT_ROOT ??
	Bun.spawnSync(["git", "worktree", "list", "--porcelain"], { cwd: worktree })
		.stdout.toString()
		.match(/^worktree (.+)$/m)?.[1];

if (main && main !== worktree) {
	for (const file of ENV_FILES) {
		const source = join(main, file);
		if (!lstatSync(source, { throwIfNoEntry: false })?.isFile()) continue;
		const target = join(worktree, file);
		const existing = lstatSync(target, { throwIfNoEntry: false });
		// A real file here is this worktree's own: never replace it.
		if (existing && !existing.isSymbolicLink()) continue;
		if (existing) rmSync(target);
		symlinkSync(source, target);
		console.log(`linked ${file}`);
	}
}

const install = Bun.spawnSync(["bun", "install", "--frozen-lockfile"], {
	cwd: worktree,
	stdout: "inherit",
	stderr: "inherit",
});
process.exit(install.exitCode ?? 1);
