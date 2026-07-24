#!/usr/bin/env node
/**
 * Lint only the LINES this branch touched.
 *
 * The repo carries a large pre-existing baseline (380 errors, 318 of them
 * `@typescript-eslint/no-explicit-any` in src/app/api). Fixing that is its
 * own typing project. This gate exists so the number cannot GROW.
 *
 * A file-level gate is the wrong shape here: renaming one class in a 600-line
 * screen would light up every pre-existing `any` in it and force unrelated
 * fixes. So findings are filtered to lines that actually appear as added or
 * modified in the diff. Touch a bad line, you own it; walk past it, you don't.
 *
 *   npm run lint:changed
 *
 * Uses /usr/bin/git explicitly: the git on PATH in this environment is an
 * Intel-only binary under Rosetta that makes index operations crawl.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const GIT = "/usr/bin/git";
const LINTABLE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

function git(args, fallback = "") {
  try {
    return execFileSync(GIT, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return fallback;
  }
}

function baseRef() {
  for (const ref of ["origin/master", "origin/main", "master", "main"]) {
    const merged = git(["merge-base", ref, "HEAD"]).trim();
    if (merged) return merged;
  }
  return "HEAD";
}

/** Parse `git diff -U0` into { file -> [[start, end], ...] } of new-side lines. */
function hunkRanges(diffArgs, into = new Map()) {
  const out = git(["diff", "-U0", "--diff-filter=ACMR", ...diffArgs]);
  let file = null;
  for (const line of out.split("\n")) {
    if (line.startsWith("+++ ")) {
      const p = line.slice(4).trim();
      file = p === "/dev/null" ? null : p.replace(/^b\//, "");
      continue;
    }
    if (!file || !line.startsWith("@@")) continue;
    const m = /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (!m) continue;
    const start = Number(m[1]);
    const count = m[2] === undefined ? 1 : Number(m[2]);
    if (count === 0) continue; // pure deletion, no new-side lines
    if (!into.has(file)) into.set(file, []);
    into.get(file).push([start, start + count - 1]);
  }
  return into;
}

const base = baseRef();
const ranges = new Map();
if (base !== "HEAD") hunkRanges([`${base}...HEAD`], ranges);
hunkRanges([], ranges); // unstaged
hunkRanges(["--cached"], ranges); // staged

// Untracked files are entirely new — every line counts.
for (const f of git(["ls-files", "--others", "--exclude-standard"]).split("\n")) {
  const p = f.trim();
  if (p && LINTABLE.test(p) && existsSync(p)) ranges.set(p, [[1, Number.MAX_SAFE_INTEGER]]);
}

const files = [...ranges.keys()].filter((f) => LINTABLE.test(f) && existsSync(f));

if (files.length === 0) {
  console.log("lint:changed — no changed lintable files.");
  process.exit(0);
}

let report = [];
try {
  const raw = execFileSync("npx", ["eslint", "-f", "json", ...files], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  });
  report = JSON.parse(raw);
} catch (err) {
  // ESLint exits non-zero when it reports problems; stdout is still the report.
  if (!err.stdout) {
    console.error("lint:changed — eslint failed to run.");
    process.exit(2);
  }
  report = JSON.parse(err.stdout);
}

const cwd = process.cwd() + "/";
let errors = 0;
let warnings = 0;
const lines = [];

for (const file of report) {
  const rel = file.filePath.replace(cwd, "");
  const fileRanges = ranges.get(rel) ?? [];
  const touched = (n) => fileRanges.some(([a, b]) => n >= a && n <= b);

  const hits = file.messages.filter((m) => m.line && touched(m.line));
  if (hits.length === 0) continue;

  lines.push(`\n${rel}`);
  for (const m of hits) {
    if (m.severity === 2) errors++;
    else warnings++;
    const tag = m.severity === 2 ? "error  " : "warning";
    lines.push(
      `  ${String(m.line).padStart(4)}:${String(m.column).padEnd(3)} ${tag} ${m.message.split("\n")[0]}  ${m.ruleId ?? ""}`
    );
  }
}

const scanned = files.length;
if (errors === 0 && warnings === 0) {
  console.log(`lint:changed — ${scanned} file(s) scanned, changed lines clean.`);
  process.exit(0);
}

console.log(lines.join("\n"));
console.log(
  `\n✖ ${errors + warnings} problem(s) on changed lines (${errors} error(s), ${warnings} warning(s)) across ${scanned} file(s) scanned.`
);
process.exit(errors > 0 ? 1 : 0);
