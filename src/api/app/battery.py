"""The fixed participant sequence (architecture/pilot.md — 참가 흐름).

Q1 needs every participant to do the same things in the same order: the free-writing arms
first (so the structured battery cannot prime them), then the battery modules one at a time.
The web app owns each module's screens (src/web/lib/modules); this list owns which modules
exist and their order. Module ids follow the `method` values in each extraction doc's YAML.
"""

# arm (i) pure free self-disclosure, arm (ii) free writing with generic deepening prompts.
ARMS = ["q1_free_open", "q1_free_deep"]

# arm (iii): the structured battery. Grows sprint by sprint; frozen before launch (런칭 게이트).
# Order is a pilot default (pilot.md 「S1 파일럿 기본값」): light warm-up first, emotionally heavy
# modules not back to back (principles §1-0-5), ending on the future-oriented EFT.
BATTERY = [
    "metaphor",
    "attachment_story_stem",
    "value_allocation",
    "judgment_scenario",
    "cit",
    "ccrt",
    "feared_self",
    "eft",
]

SEQUENCE = ARMS + BATTERY


def prerequisite(module: str) -> str | None:
    """The module that must be completed before `module` can be written to, or None."""
    index = SEQUENCE.index(module)
    return SEQUENCE[index - 1] if index > 0 else None
