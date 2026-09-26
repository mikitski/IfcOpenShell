# CLAUDE.md

## IfcOpenShell-TS

An in-progress TypeScript port of `ifcopenshell-python`, orchestrated by an autonomous
dispatch/review/merge loop. Before doing any work on `src/ifcopenshell-ts/` or
`planning/ifcopenshell-ts/`, read:

- `planning/ifcopenshell-ts/00-overview.md` — project charter and doc index.
- `planning/ifcopenshell-ts/60-orchestration-spec.md` — the actual dispatch → review → CI → merge
  → docs-update loop this project runs on, escalation policy, and the publish gate.
- `planning/ifcopenshell-ts/PROGRESS.md` — per-chunk implementation history and current status.
- `TODOS.md` — tracked gaps/blockers, many of them native primitive-layer limitations that affect
  multiple modules.
