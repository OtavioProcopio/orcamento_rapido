import fs from "node:fs";
import path from "node:path";

const color = {
  reset: "\x1b[0m",
  blue: "\x1b[1;34m",
  green: "\x1b[1;32m",
  red: "\x1b[1;31m",
  yellow: "\x1b[1;33m",
};

const readJson = (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const toStatus = (value) => value === "ok";
const icon = (ok) =>
  ok ? `${color.green}✓${color.reset}` : `${color.red}✗${color.reset}`;

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

const summarizeDirectory = (dirPath) => {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return null;
  }

  const summary = {
    files: 0,
    bytes: 0,
  };

  const walk = (currentPath) => {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }

      if (entry.isFile()) {
        summary.files += 1;
        summary.bytes += fs.statSync(entryPath).size;
      }
    }
  };

  walk(dirPath);
  return summary;
};

const lintOk = toStatus(process.env.VALIDATE_LINT_STATUS);
const testOk = toStatus(process.env.VALIDATE_TEST_STATUS);
const coverageOk = toStatus(process.env.VALIDATE_COVERAGE_STATUS);
const buildOk = toStatus(process.env.VALIDATE_BUILD_STATUS);

const coverageSummary = readJson(process.env.VALIDATE_COVERAGE_FILE);
const jestResults = readJson(process.env.VALIDATE_TEST_RESULTS_FILE);
const buildSummary = summarizeDirectory(process.env.VALIDATE_BUILD_DIR);

const totals = coverageSummary?.total ?? {};
const metrics = {
  statements: Number(totals.statements?.pct ?? 0),
  branches: Number(totals.branches?.pct ?? 0),
  functions: Number(totals.functions?.pct ?? 0),
  lines: Number(totals.lines?.pct ?? 0),
};

const thresholds = {
  statements: Number(process.env.MIN_COVERAGE_STATEMENTS ?? 75),
  branches: Number(process.env.MIN_COVERAGE_BRANCHES ?? 68),
  functions: Number(process.env.MIN_COVERAGE_FUNCTIONS ?? 70),
  lines: Number(process.env.MIN_COVERAGE_LINES ?? 75),
};

const testsTotal = Number(jestResults?.numTotalTests ?? 0);
const testsPassed = Number(jestResults?.numPassedTests ?? 0);
const testsFailed = Number(jestResults?.numFailedTests ?? 0);
const suitesTotal = Number(jestResults?.numTotalTestSuites ?? 0);
const suitesPassed = Number(jestResults?.numPassedTestSuites ?? 0);
const suitesFailed = Number(jestResults?.numFailedTestSuites ?? 0);

const overallOk = lintOk && testOk && coverageOk && buildOk;

const stageLine = (label, ok) => `${icon(ok)} ${label.padEnd(10)} ${ok ? "OK" : "FALHOU"}`;

console.log(`${color.blue}Relatório Geral de Validação${color.reset}`);
console.log(
  `Status final: ${overallOk ? `${color.green}APROVADO${color.reset}` : `${color.red}REPROVADO${color.reset}`}`,
);
console.log("");

console.log(`${color.blue}Etapas executadas${color.reset}`);
console.log(stageLine("Lint", lintOk));
console.log(stageLine("Testes", testOk));
console.log(stageLine("Cobertura", coverageOk));
console.log(stageLine("Build", buildOk));
console.log("");

if (jestResults) {
  console.log(`${color.blue}Testes automatizados${color.reset}`);
  console.log(`- Suítes aprovadas: ${suitesPassed}/${suitesTotal}`);
  console.log(`- Suítes com falha: ${suitesFailed}`);
  console.log(`- Testes aprovados: ${testsPassed}/${testsTotal}`);
  console.log(`- Testes com falha: ${testsFailed}`);
  console.log("");
}

if (coverageSummary) {
  console.log(`${color.blue}Cobertura validada${color.reset}`);
  console.log(`- Statements: ${metrics.statements.toFixed(2)}% (meta ${thresholds.statements}%)`);
  console.log(`- Branches: ${metrics.branches.toFixed(2)}% (meta ${thresholds.branches}%)`);
  console.log(`- Functions: ${metrics.functions.toFixed(2)}% (meta ${thresholds.functions}%)`);
  console.log(`- Lines: ${metrics.lines.toFixed(2)}% (meta ${thresholds.lines}%)`);
  console.log("");
}

if (buildSummary) {
  console.log(`${color.blue}Build gerado${color.reset}`);
  console.log(`- Diretório: ${process.env.VALIDATE_BUILD_DIR}`);
  console.log(`- Arquivos gerados: ${buildSummary.files}`);
  console.log(`- Tamanho total: ${formatBytes(buildSummary.bytes)}`);
  console.log("");
}

if (!overallOk) {
  console.log(`${color.yellow}Observação${color.reset}`);
  console.log("- Pelo menos uma etapa obrigatória falhou. Revise os blocos acima.");
  process.exit(1);
}
