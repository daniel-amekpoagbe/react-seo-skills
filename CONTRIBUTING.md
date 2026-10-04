# Contributing to react-seo-skills

Thanks for your interest in improving `react-seo-skills`. This project is an
**agent skill** — a set of Markdown files that teach AI coding agents how to
implement SEO and GEO in Next.js and React with Vite apps —
plus a small zero-dependency installer.

Contributions of all kinds are welcome: content corrections, new stack support,
installer improvements, and documentation.

---

## What lives where

```
bin/install.js          Zero-dependency Node installer (copies skill/ into agent dirs)
skill/SKILL.md          Skill entry point — rules, detection order, audit mode
skill/references/*.md   Deep-dive reference files loaded on demand
test/                   Installer tests (run with `node --test`)
```

The design is intentionally a **thin entry point + linked references**. Keep
`SKILL.md` small; put detail in `references/` and link to it.

---

## Local setup

```bash
git clone https://github.com/daniel-amekpoagbe/react-seo-skills.git
cd react-seo-skills
npm test          # runs the installer test suite (Node 18+, no deps)
```

To try the installer against a throwaway directory:

```bash
node bin/install.js             # auto-detects the agent or uses ./.agents/skills
```

---

## Content style rules

The skill is read by AI agents, so accuracy and consistency matter more than prose.

1. **Be language-aware.** Every code example must exist (or be adaptable) in both
   TypeScript and JavaScript. Follow the rules in `skill/references/language.md`.
2. **Be stack-accurate.** Never mix Next.js APIs into Vite examples or vice versa.
3. **Use absolute URLs** in all metadata, sitemap, and JSON-LD examples
   (`https://example.com/...`).
4. **Validate claims.** If you state a library version or behavior (e.g. a React
   19 behavior), verify it against the published package before submitting.
5. **No marketing fluff.** Write factual, structured content. Lead sections with
   the direct answer.
6. **Keep `SKILL.md` lean.** New detail belongs in a `references/*.md` file that
   `SKILL.md` links to.
7. **Cross-links must resolve.** The link checker in CI will fail on broken
   relative links between skill files.

---

## Adding support for a new stack

New framework support outside Next.js and Vite/React is currently out of scope.
For changes within the supported stacks, follow this checklist:

1. **Create the reference file** `skill/references/<stack>.md` modeled on an
   existing one (`app-router.md` is a good template). Cover, at minimum:
   - Metadata / `<head>` patterns (static + dynamic)
   - Sitemap generation
   - `robots.txt` / robots config
   - JSON-LD injection
   - Validation pointer (`validation.md`)
   - Both TypeScript and JavaScript variants
2. **Register the stack in `SKILL.md`:**
   - Add a detection signal to the **Stack Detection** table.
   - Add a column or row to the **Stack Quick Reference** table.
3. **Update `bin/install.js`** "What was installed" listing if you add a new file.
4. **Update the README** skill-structure tree and the supported-stacks table.
5. **Add a `CHANGELOG.md` entry** under `## [Unreleased]`.
6. **Run `npm test`** and the link checker.

> Keep proposed changes aligned with the supported Next.js and Vite/React stacks.
> Open an issue first for larger changes so we do not duplicate work.

---

## Pull request process

1. Fork and create a branch: `git checkout -b feat/seo-guidance`.
2. Make your change and run `npm test`.
3. Add a `CHANGELOG.md` entry under `## [Unreleased]`.
4. Open a PR using the template. Describe what you verified and against which
   versions.
5. Keep PRs focused — one stack or one topic per PR is much easier to review.

---

## Reporting issues

Use the issue templates:

- **Content correction** — something in the skill is wrong or outdated.
- **New stack request** — you want support for a framework not yet covered.
- **Bug report** — the installer misbehaves.

---

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
