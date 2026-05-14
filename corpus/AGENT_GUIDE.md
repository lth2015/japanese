# Corpus Generation Guide For AI Agents

You are generating Japanese learning material for Nihongo Studio.

## Learner Profile

- Native language: Chinese
- Target language: Japanese
- Level: strong reading, weak listening/speaking output
- Goal: workplace and daily Japanese that can be spoken naturally
- Training method: sentence chunks move through Stage 2 writing, Stage 2.5 read-aloud, Stage 3 listen-write, Stage 4 quick-fire speaking

## Output Contract

Return only JSON. No markdown fences.

Use this shape:

```json
{
  "packVersion": 1,
  "packId": "meeting-risk-001",
  "title": "Meeting Risk Reporting 001",
  "generatedBy": "codex",
  "generatedAt": "2026-05-14",
  "targetProfile": "Chinese native speaker, N2/N1 reading, weak spoken workplace Japanese",
  "reviewStatus": "draft",
  "sentences": [],
  "dialogues": [],
  "passages": []
}
```

## Sentence Requirements

Each sentence must include:

- `externalId`: stable id within the pack, such as `s001`
- `japanese`: natural Japanese sentence
- `tokens`: furigana token array; concatenating all `text` values must exactly equal `japanese`
- `kana`: full sentence reading, no spaces required
- `chinese`: Chinese meaning
- `category`: one of `rescue`, `progress`, `request`, `apology`, `smalltalk`, `daily`, `grammar`, `custom`
- `register`: one of `敬語`, `丁寧`, `カジュアル`
- `difficulty`: integer 1-5
- `frequencyRank`: integer 1-1000
- `chunkPattern`: optional reusable skeleton
- `tags`: short lowercase situational tags

Good token example:

```json
{
  "japanese": "確認してから共有します。",
  "tokens": [
    { "text": "確認", "kana": "かくにん" },
    { "text": "してから" },
    { "text": "共有", "kana": "きょうゆう" },
    { "text": "します。" }
  ]
}
```

## Quality Bar

- Avoid literal Chinese translation.
- Avoid rare or over-formal expressions unless the tag says `keigo`.
- Keep single sentences short enough to speak in one breath.
- Prefer reusable chunks: progress, risk, apology, clarification, asking for help, soft disagreement.
- Include at least 8 sentences per pack for one focused scenario.
- Include 1 dialogue when the topic naturally has turn-taking.
- Include 1 passage only when a short email, Slack thread, report, or meeting note helps.

## Review Checklist

Before setting `reviewStatus` to `reviewed`, check:

- Japanese sounds like something a real coworker would say.
- Chinese translation is useful, not word-for-word.
- `tokens.map(t => t.text).join("") === japanese`.
- Tags describe the situation, not abstract grammar only.
- Difficulty is not inflated.
