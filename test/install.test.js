"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const INSTALLER = path.join(ROOT, "bin", "install.js");
const SKILL_DIR = "react-seo-skills";

const AGENT_PROJECT_PATHS = {
  agents: path.join(".agents", "skills"),
  cursor: path.join(".cursor", "skills"),
  claude: path.join(".claude", "skills"),
  opencode: path.join(".opencode", "skills"),
};

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "react-seo-skills-test-"));
}

function runInstaller(cwd, args) {
  return execFileSync("node", [INSTALLER, ...args], {
    cwd,
    encoding: "utf8",
  });
}

test("detects the Cursor project directory", () => {
  const cwd = makeTempDir();
  try {
    fs.mkdirSync(path.join(cwd, ".cursor"));
    runInstaller(cwd, []);
    const installed = path.join(cwd, AGENT_PROJECT_PATHS.cursor, SKILL_DIR);
    assert.ok(
      fs.existsSync(path.join(installed, "SKILL.md")),
      "SKILL.md exists",
    );
    assert.ok(
      fs.existsSync(path.join(installed, "references", "app-router.md")),
      "reference files copied",
    );
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("detects OpenCode and installs the Vite reference", () => {
  const cwd = makeTempDir();
  try {
    fs.mkdirSync(path.join(cwd, ".opencode"));
    runInstaller(cwd, []);
    const installed = path.join(cwd, AGENT_PROJECT_PATHS.opencode, SKILL_DIR);
    assert.ok(
      fs.existsSync(path.join(installed, "references", "react-vite.md")),
      "Vite reference exists",
    );
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("default (no agent flag) falls back to the shared agents directory", () => {
  const cwd = makeTempDir();
  try {
    runInstaller(cwd, []);
    const rel = AGENT_PROJECT_PATHS.agents;
    const installed = path.join(cwd, rel, SKILL_DIR);
    assert.ok(
      fs.existsSync(path.join(installed, "SKILL.md")),
      `SKILL.md exists at ${rel}`,
    );
    // Ensure the fallback does not create a Cursor installation.
    assert.ok(
      !fs.existsSync(path.join(cwd, AGENT_PROJECT_PATHS.cursor, SKILL_DIR)),
      "should not fall back to Cursor",
    );
    for (const [key, relOther] of Object.entries(AGENT_PROJECT_PATHS)) {
      if (key === "agents" || key === "cursor") continue;
      const other = path.join(cwd, relOther, SKILL_DIR);
      assert.ok(!fs.existsSync(other), `should not install ${key}`);
    }
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("copies the full set of skill files", () => {
  const cwd = makeTempDir();
  try {
    runInstaller(cwd, []);
    const installed = path.join(cwd, AGENT_PROJECT_PATHS.agents, SKILL_DIR);
    const sourceRefs = fs
      .readdirSync(path.join(ROOT, "skill", "references"))
      .sort();
    const installedRefs = fs
      .readdirSync(path.join(installed, "references"))
      .sort();
    assert.deepStrictEqual(installedRefs, sourceRefs);
    assert.ok(
      sourceRefs.includes("react-vite.md"),
      "Vite reference is packaged",
    );
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("skips an existing install without --force", () => {
  const cwd = makeTempDir();
  try {
    runInstaller(cwd, []);
    const out = runInstaller(cwd, []);
    assert.match(out, /Already installed/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("--force overwrites an existing install", () => {
  const cwd = makeTempDir();
  try {
    runInstaller(cwd, []);
    const installed = path.join(cwd, AGENT_PROJECT_PATHS.agents, SKILL_DIR);
    const stray = path.join(installed, "stray.md");
    fs.writeFileSync(stray, "should be removed on force");
    const out = runInstaller(cwd, ["--force"]);
    assert.match(out, /Installed/);
    assert.ok(!fs.existsSync(stray), "stray file removed on force reinstall");
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("--help exits cleanly and prints usage", () => {
  const out = execFileSync("node", [INSTALLER, "--help"], { encoding: "utf8" });
  assert.match(out, /Usage:/);
});

test("--dry-run previews a relative destination without writing files", () => {
  const cwd = makeTempDir();
  try {
    const out = runInstaller(cwd, ["--dry-run"]);
    assert.match(out, /Preview mode/);
    assert.match(out, /Project scope · no files will be written/);
    assert.match(out, /\.agents\/skills\/react-seo-skills/);
    assert.ok(
      !fs.existsSync(path.join(cwd, ".agents")),
      "no files are written",
    );
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
