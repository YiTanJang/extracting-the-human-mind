import { freeDeep, freeOpen } from "./arms";
import { eft, fearedSelf, metaphor, valueAllocation } from "./battery_a";
import { attachmentStoryStem, ccrt, cit, judgmentScenario } from "./battery_b";
import type { ModuleDef } from "./types";

// Screens for every module the API sequence can hand out (src/api/app/battery.py owns the order).
export const MODULES: Record<string, ModuleDef> = Object.fromEntries(
  [freeOpen, freeDeep, metaphor, valueAllocation, judgmentScenario, fearedSelf, eft, ccrt, cit, attachmentStoryStem].map(
    (m) => [m.id, m],
  ),
);
