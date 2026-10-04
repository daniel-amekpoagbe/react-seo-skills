#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const pkg = require("../package.json");

const SKILL_DIR_NAME = "react-seo-skills";
const SOURCE_DIR = path.join(__dirname, "..", "skill");

// --- Terminal UI helpers (zero dependencies) ---------------------------------
const useColor =
  Boolean(process.stdout.isTTY) &&
  !process.env.NO_COLOR &&
  process.env.TERM !== "dumb";

const wrap = (open, close) => (s) =>
  useColor ? `\x1b[${open}m${s}\x1b[${close}m` : String(s);

const c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
};

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const visibleLen = (s) => stripAnsi(s).length;
const pad = (s, width) => s + " ".repeat(Math.max(0, width - visibleLen(s)));

const HERO_WIDTH = 52;

function horizontalLine(char, width) {
  return char.repeat(width);
}

function renderHero(version) {
  const lines = [
    "",
    "  ◆ react-seo-skills",
    "    SEO & GEO skills for AI coding agents",
    "",
    `    v${version}`,
    "",
  ];
  const top = `╭${horizontalLine("─", HERO_WIDTH)}╮`;
  const bottom = `╰${horizontalLine("─", HERO_WIDTH)}╯`;
  const body = lines.map((line) => `│${pad(line, HERO_WIDTH)}│`);
  return [top, ...body, bottom].join("\n");
}

function renderTarget(result, scope, cwd, dryRun) {
  const relativePath = formatTargetPath(result.path, scope, cwd).replace(
    /^\.\//,
    "",
  );
  const location =
    scope === "project"
      ? [`${formatPath(cwd)}/`, `└─ ${relativePath}`]
      : [`└─ ${formatTargetPath(result.path, scope, cwd)}`];
  const status =
    result.status === "installed"
      ? "✓ Installed"
      : result.status === "skipped"
        ? "● Already installed · use --force to replace it"
        : null;

  console.log(`  ${c.bold("Target")}`);
  console.log(`    ${c.bold(result.label)}`);
  if (!dryRun && status) {
    console.log(`    ${c.dim(status)}`);
  }
  for (const line of location) {
    console.log(`    ${c.dim(line)}`);
  }
  console.log();
}

const TARGETS = {
  agents: {
    label: "Agents",
    project: path.join(".agents", "skills"),
    global: path.join(os.homedir(), ".agents", "skills"),
  },
  cursor: {
    label: "Cursor",
    project: path.join(".cursor", "skills"),
    global: path.join(os.homedir(), ".cursor", "skills"),
  },
  claude: {
    label: "Claude Code",
    project: path.join(".claude", "skills"),
    global: path.join(os.homedir(), ".claude", "skills"),
  },
  codex: {
    label: "Codex",
    project: path.join(".agents", "skills"),
    global: path.join(os.homedir(), ".codex", "skills"),
  },
  opencode: {
    label: "OpenCode",
    project: path.join(".opencode", "skills"),
    global: path.join(os.homedir(), ".config", "opencode", "skills"),
  },
};

function detectAgent(cwd) {
  // Check for common agent config directories/presence
  if (fs.existsSync(path.join(cwd, ".cursor"))) return "cursor";
  if (fs.existsSync(path.join(cwd, ".claude"))) return "claude";
  if (fs.existsSync(path.join(cwd, ".opencode"))) return "opencode";
  if (fs.existsSync(path.join(cwd, ".agents"))) return "agents";
  if (fs.existsSync(path.join(cwd, ".codex"))) return "codex";
  // Check environment hints when no project directory identifies an agent.
  if (process.env.CLAUDE_CODE_SESSION || process.env.CLAUDE_CONFIG_DIR)
    return "claude";
  if (process.env.CURSOR_ENV || process.env.CURSOR_AGENT) return "cursor";
  if (process.env.CODEX_HOME) return "codex";
  if (process.env.OPENCODE_CONFIG_DIR) return "opencode";
  return null;
}

function printHelp() {
  const opt = (flag, desc) => `  ${c.cyan(pad(flag, 11))} ${c.dim(desc)}`;
  const ex = (cmd) => `  ${c.dim("$")} ${cmd}`;
  console.log(
    [
      "",
      `${c.bold("react-seo-skills")} ${c.dim("— SEO and AI-search skills for AI coding agents")}`,
      "",
      c.bold("Usage:"),
      `  ${c.dim("$")} npx react-seo-skills [options]`,
      "",
      c.bold("Options:"),
      opt("--global", "Install to user-level skill dirs"),
      opt("--force", "Overwrite an existing installation"),
      opt("--dry-run", "Preview without writing any files"),
      opt("--help", "Show this help message"),
      "",
      c.bold("Examples:"),
      ex("npx react-seo-skills"),
      ex("npx react-seo-skills --global"),
      ex("npx react-seo-skills --force"),
      "",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const options = {
    agents: new Set(),
    global: false,
    force: false,
    help: false,
    dryRun: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--global") {
      options.global = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    console.error(`Unknown option: ${arg}`);
    printHelp();
    process.exit(1);
  }

  if (options.agents.size === 0) {
    const detected = detectAgent(process.cwd());
    if (detected && TARGETS[detected]) {
      options.agents = new Set([detected]);
    } else {
      // Use the shared project-level agents directory when no agent is detected.
      options.agents = new Set(["agents"]);
    }
  }

  return options;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function installTo(baseDir, force, dryRun) {
  const targetDir = path.join(baseDir, SKILL_DIR_NAME);

  if (fs.existsSync(targetDir)) {
    if (!force) {
      return { status: "skipped", path: targetDir };
    }
    if (!dryRun) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  }

  if (dryRun) {
    return { status: "would-install", path: targetDir };
  }

  copyDir(SOURCE_DIR, targetDir);
  return { status: "installed", path: targetDir };
}

function formatPath(targetPath) {
  const home = os.homedir();
  return targetPath.startsWith(home)
    ? `~${targetPath.slice(home.length)}`
    : targetPath;
}

function formatTargetPath(targetPath, scope, cwd) {
  if (scope === "project") {
    const relativePath = path.relative(cwd, targetPath);
    return `./${relativePath}`;
  }
  return formatPath(targetPath);
}

function checkNodeVersion() {
  const major = Number(process.versions.node.split(".")[0]);
  if (Number.isFinite(major) && major < 18) {
    console.error(
      `react-seo-skills requires Node.js 18 or newer. You are running ${process.version}.`,
    );
    process.exit(1);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  checkNodeVersion();

  const scope = options.global ? "global" : "project";
  const cwd = process.cwd();
  const results = [];

  for (const agent of options.agents) {
    const target = TARGETS[agent];
    const baseDir = options.global
      ? target.global
      : path.join(cwd, target.project);

    const result = installTo(baseDir, options.force, options.dryRun);
    results.push({ agent, label: target.label, ...result });
  }

  console.log();
  console.log(renderHero(pkg.version));
  console.log();
  console.log(
    `  ${c.cyan("◇")} ${c.bold(options.dryRun ? "Preview mode" : "Install mode")}`,
  );
  if (options.dryRun) {
    console.log(`    ${c.dim(`Project scope · no files will be written`)}`);
  } else {
    console.log(
      `    ${c.dim(`${scope === "global" ? "Global" : "Project"} scope`)}`,
    );
  }
  console.log();

  for (const result of results) {
    renderTarget(result, scope, cwd, options.dryRun);
  }

  const installed = results.some((result) => result.status === "installed");
  const wouldInstall = results.some((r) => r.status === "would-install");

  if (installed || wouldInstall) {
    const files = [
      ["SKILL.md", "Entry point & audit workflow"],
      ["references/language.md", "JavaScript / TypeScript detection"],
      ["references/keywords.md", "Keyword clustering & validation"],
      ["references/app-router.md", "Next.js App Router"],
      ["references/pages-router.md", "Next.js Pages Router"],
      ["references/react-vite.md", "Vite + React / SPA"],
      ["references/structured-data.md", "Schema.org JSON-LD"],
      ["references/geo.md", "AI visibility & GEO"],
      ["references/validation.md", "Post-implementation checks"],
    ];
    console.log(`  ${c.bold("Skills")} ${c.dim(`· ${files.length} files`)}`);
    console.log();
    console.log(`    ${c.bold(files[0][0])}${c.dim("  ")}${files[0][1]}`);
    console.log(`    ${c.dim("references/")}`);
    files.slice(1).forEach(([name, desc], index) => {
      const branch = index === files.length - 2 ? "└─" : "├─";
      console.log(
        `    ${c.dim(branch)} ${pad(name.replace("references/", ""), 29)}${c.dim(desc)}`,
      );
    });
  }

  const steps = [];
  if (options.agents.has("cursor")) {
    steps.push("✓ Cursor automatically discovers SKILL.md");
  }
  if (options.agents.has("agents")) {
    steps.push("✓ Shared agents directory contains SKILL.md");
  }
  if (options.agents.has("claude")) {
    steps.push("✓ Claude Code automatically discovers .claude/skills");
  }
  if (options.agents.has("codex")) {
    steps.push("✓ Restart Codex so it rescans .agents/skills");
  }
  if (options.agents.has("opencode")) {
    steps.push("✓ OpenCode will pick up .opencode/skills");
  }

  console.log();
  console.log(`  ${c.bold("Next steps")}`);
  for (const step of steps) {
    console.log(`    ${c.dim(step)}`);
  }

  console.log();
  console.log(`  ${c.dim(horizontalLine("─", 50))}`);
  console.log();
  console.log(`  ${c.bold("◆ Created by Daniel Amekpoagbe")}`);
  console.log(`    ${c.dim("amekpoagbe.com")}`);
  console.log();
}

main();
