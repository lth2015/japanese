# Nihongo Studio Corpus Packs

This folder is the growth engine for the study corpus.

Any AI agent can generate a JSON pack that follows `corpus/schema.json`. Put reviewed packs in `corpus/packs/`, then import them:

```bash
pnpm corpus:import
```

The importer is additive and idempotent:

- New items are inserted into SQLite.
- Existing items with the same pack/item id are updated.
- Nothing is deleted from the learner's accumulated database.

## Workflow

1. Ask Codex, ChatGPT, Claude Code, or another model to follow `corpus/AGENT_GUIDE.md`.
2. Save the JSON response as `corpus/packs/<topic>.json`.
3. Review naturalness, tokens, difficulty, and tags.
4. Set `"reviewStatus": "reviewed"`.
5. Run `pnpm corpus:import`.

For a dry run:

```bash
pnpm corpus:import --dry-run
```

## Content Rules

- Every sentence must include `tokens`; token text must concatenate back to `japanese`.
- Generated sentences should be realistic, short, and reusable as speech chunks.
- Prefer N2-ish workplace and daily situations over textbook grammar drills.
- Use `difficulty` from 1 to 5, where 3 is usable but not automatic.
- Use `frequencyRank` from 1 to 1000 when you can estimate commonness.
- Add tags that match real situations: `meeting`, `1on1`, `slack`, `risk`, `deadline`, `smalltalk`.

See `corpus/examples/workplace-risk-pack.json` for a complete example.
