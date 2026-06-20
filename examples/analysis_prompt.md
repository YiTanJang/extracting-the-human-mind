# Analysis Prompt Templates

These prompts are for use in **Analysis Mode** — paste your `raw_store.yaml` contents at the end.

The rule: the LLM reads verbatim data and synthesizes. You never pre-interpret before storing.

---

## Basic analysis (start here)

```
You are analyzing a psychological raw store collected using structured extraction methods
(CCRT, laddering, feared self, triadic elicitation, ESM).

Ground rules:
- Stay close to the verbatim. Do not invent interpretations beyond what the text supports.
- Do not apply external taxonomies (MBTI, Big Five) unless explicitly asked.
- Distinguish between what the person said and what you infer.
- Flag low-confidence inferences explicitly.

Tasks:
1. Identify any recurring pattern across the CCRT entries (wish → other's response → self's response).
2. Check whether the laddering terminal values are consistent with the value_allocation entries.
   Note any divergence between espoused values and actual allocation behavior.
3. If a feared_self entry exists, check whether any raw_response_self in CCRT entries
   resembles the feared state.
4. Summarize in 3–5 sentences. No bullet points — write it as you would tell someone about a person.

Raw store:
[paste raw_store.yaml contents here]
```

---

## Espoused vs. revealed gap

```
Focus only on the gap between stated values and actual behavior in this raw store.

Espoused values come from: laddering terminal values, value_allocation raw_reasoning,
any explicit statements of principle in any raw_* field.

Revealed patterns come from: value_allocation raw_allocation (what they actually did),
CCRT raw_response_self (how they actually reacted), ESM raw_thought under pressure.

For each gap you find: quote the espoused statement, quote the behavioral evidence,
and state how confident you are that this is a real gap vs. context-dependent variation.

Raw store:
[paste raw_store.yaml contents here]
```

---

## Simulation briefing (requires 시뮬레이션 허용 consent)

```
Build a behavioral briefing for simulating this person in conversation.

From the raw store, extract:
1. Core wish pattern (from CCRT): what they tend to want from others
2. Typical response when that wish is not met (raw_response_self patterns)
3. Terminal values (from laddering) that are non-negotiable
4. Feared self: what they avoid and the early warning signs
5. One likely blind spot: something the data suggests they underestimate about themselves

Format: short paragraphs, not bullets. Written as briefing notes for an agent
that will simulate this person's responses in a dialogue.

Do not claim certainty. Use "tends to", "data suggests", "appears to".

Raw store:
[paste raw_store.yaml contents here]
```

---

## Verification prompt (for 검증 모드)

```
You will be shown [N] response sets. Exactly one was written by the target person.
The others are from different individuals.

Target person's raw store (context only — do not use as the answer):
[paste raw_store.yaml here]

Response sets to evaluate:
A: [paste response]
B: [paste response]
C: [paste response]
...

Which response set is most consistent with the target person's patterns?
Explain which specific features of the raw store guided your choice.
State your confidence (low / medium / high) and what would change it.
```

---

## soul.md baseline comparison (incremental validity test)

Use this when you have a `soul.md` — the user's own written self-description — to test whether the raw store adds predictive power beyond what the person says about themselves.

```
You will compare two information sources about the same person:

SOURCE A — soul.md (espoused self-description):
[paste soul.md content here]

SOURCE B — raw_store.yaml (verbatim behavioral data):
[paste raw_store.yaml here]

Tasks:
1. Using SOURCE A only, predict how this person would respond to: [describe a scenario or question].
   State your prediction and confidence.
2. Using SOURCE B only, make the same prediction independently.
   State your prediction and confidence.
3. Compare: where do A and B agree? Where do they diverge?
4. If they diverge on a prediction, which source do you trust more and why?
   Cite specific evidence from each source.

Do not blend the sources in steps 1–2. Keep them strictly separate.
The goal is to measure whether raw behavioral data adds information that self-description misses.
```

> **When to use:** After the user has written a `soul.md` and collected at least 3–5 raw_store entries.
> This is the A4 (incremental validity) check from [검증 모드](검증%20모드.md) §1-3.

---

## Notes on prompt hygiene

- **Don't ask for scores or percentages.** They imply precision that isn't there.
- **Don't ask "what type is this person."** That collapses idiographic data into a nomothetic box.
- **Do ask about patterns, gaps, and predictions** — that's what the raw store is for.
- **Longer context = better.** The more extraction sessions in the raw store, the more the LLM has to work with. A single CCRT entry is a start, not a conclusion.
