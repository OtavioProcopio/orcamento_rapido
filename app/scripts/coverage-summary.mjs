import fs from "node:fs";

const [, , summaryPath] = process.argv;

if (!summaryPath || !fs.existsSync(summaryPath)) {
  console.error("\x1b[1;31mcoverage-summary.json não encontrado.\x1b[0m");
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const total = summary.total ?? {};

const thresholds = {
  statements: Number(process.env.MIN_COVERAGE_STATEMENTS ?? 75),
  branches: Number(process.env.MIN_COVERAGE_BRANCHES ?? 68),
  functions: Number(process.env.MIN_COVERAGE_FUNCTIONS ?? 70),
  lines: Number(process.env.MIN_COVERAGE_LINES ?? 75),
};

const metrics = [
  ["statements", "Statements"],
  ["branches", "Branches"],
  ["functions", "Functions"],
  ["lines", "Lines"],
];

let failed = false;

console.log("\x1b[1;34mResumo global de cobertura\x1b[0m");

for (const [key, label] of metrics) {
  const pct = Number(total[key]?.pct ?? 0);
  const min = thresholds[key];
  const ok = pct >= min;

  if (!ok) {
    failed = true;
  }

  const color = ok ? "\x1b[1;32m" : "\x1b[1;31m";
  const icon = ok ? "✓" : "✗";
  console.log(
    `${color}${icon} ${label.padEnd(10)} ${pct.toFixed(2)}% (meta ${min}%)\x1b[0m`,
  );
}

if (failed) {
  process.exit(1);
}
