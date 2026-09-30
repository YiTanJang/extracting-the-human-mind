// Declarative module definitions. A module is data; components/engine renders any module.
// Prompts are copied verbatim from extracting-the-human-mind/extraction/*.md and stored with every answer.

export type Domain = "work" | "relation" | "self" | "general";

export type Answer = string | string[] | number | Record<string, number> | { choice: string; text: string };

export type Stimulus = {
  id: string;
  title?: string;
  body: string;
  /** Fixed domain for this stimulus (skips post-hoc tagging). */
  domain?: Domain;
};

/** What a dynamic prompt/prefill can see: the current unit's answers and its stimulus. */
export type Ctx = { answers: Record<string, Answer>; stimulus?: Stimulus };
export type Text = string | ((ctx: Ctx) => string);

type StepBase = {
  /** Unique within the module. */
  id: string;
  /** Payload field in the raw entry — the raw YAML field name from the module doc. */
  field: string;
  /** Verbatim prompt (a function when it fills in the participant's own earlier words). */
  prompt: Text;
  /** Guidance shown before submitting (UI scaffolding, never a follow-up question). */
  hint?: string;
  /** 마중물 text placed in the input to prevent blank-page freeze. */
  prefill?: Text;
  /** Fields whose earlier answers are pinned above this step. */
  pin?: string[];
  optional?: boolean;
  /** Explicit "I don't know" button that records an empty answer without pressure (e.g. EFT). */
  skipLabel?: string;
};

export type Step =
  | (StepBase & { kind: "text"; typingIndicator?: boolean })
  | (StepBase & { kind: "short_text" })
  /** Timed free writing (Q1 arms): length snapshots are logged as measurement metadata. */
  | (StepBase & { kind: "free_write"; recommendMinutes: number })
  /** Several short free-text entries (e.g. self-written value labels). */
  | (StepBase & { kind: "list"; min: number; max: number; softMin?: number; itemLabel: string })
  /** Distribute `total` points over the answers of an earlier list step. */
  | (StepBase & { kind: "allocation"; from: string; total: number })
  | (StepBase & { kind: "yes_no_text"; yes: string; no: string })
  | (StepBase & { kind: "rating"; min: number; max: number; lowLabel: string; highLabel: string })
  /** Post-hoc domain tag (principles §1-2) — goes to the entry's domain_tag, not the payload. */
  | (StepBase & { kind: "domain_tag"; options: { value: Domain; label: string }[] });

export type ModuleDef = {
  id: string;
  title: string;
  minutes: string;
  intro: string;
  steps: Step[];
  /** Preset stimuli: the steps run once per stimulus, one raw entry each. */
  stimuli?: Stimulus[];
  /** Payload field that records which stimulus an entry answers. */
  stimulusField?: string;
  /** Payload field that records the stimulus text itself (e.g. the sentence stem as `prompt`). */
  stimulusBodyField?: string;
  /** Show the stimulus as the question itself (sentence-completion cards) instead of a card above it. */
  stimulusAsPrompt?: boolean;
  /** Participant-created repeats (e.g. CCRT episodes): at least `min`, then optional more. */
  cards?: { min: number; label: string };
  /** Fixed payload fields added to every entry (e.g. horizon: "5y"). */
  constants?: Record<string, string>;
  /** Reshape the flat {field: answer} payload into the doc's YAML structure. Never adds interpretation. */
  shape?: (payload: Record<string, unknown>, ctx: Ctx) => Record<string, unknown>;
};

export function resolve(text: Text | undefined, ctx: Ctx): string {
  if (text === undefined) return "";
  return typeof text === "function" ? text(ctx) : text;
}
