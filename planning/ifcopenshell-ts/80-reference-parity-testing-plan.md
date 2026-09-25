# IfcOpenShell-TS — Reference-Model Parity Testing Plan

Status: scoped 2026-09-25, at the user's explicit request, after `validate.py`'s port (Phases
EX-3/EX-4/EX-5) closed out the last item on `20-roadmap.md`'s Phase 10 checklist. This is a NEW
testing initiative, not part of the v1 roadmap's own exit criterion — the user's own framing:
"never thought of this as a replacement for any tests we already have." It complements the
existing per-function unit-test suite (which pins hand-authored expected values for synthetic
fixtures) with a different kind of check: does this port agree with real `ifcopenshell-python`
on real, standards-published, production-representative models, across read, write, and mutation.

## 1. Why this is worth doing (and what it doesn't replace)

Every existing test in this port either (a) hand-authors a synthetic fixture and pins an expected
value, or (b) replays one of real Python's own per-function unit tests against a small fixture.
Both are precise but narrow: they exercise one function/one rule/one attribute shape at a time.
Neither exercises the *combination* of thousands of attribute/entity-type/aggregate/select shapes
that occur together in one real file — string escaping, float precision, optional-attribute
omission patterns, deeply nested aggregates, inverse-attribute completeness, schema-version-specific
quirks. A real reference model, read through both implementations and diffed, is a cheap way to
catch exactly that class of bug, and it's also the strongest, most legible "is this port actually
production-ready" signal available before publishing — a real, recognizable file, not a synthetic
one.

This does NOT replace the fine-grained suite. A read-parity mismatch tells you *that* something
differs somewhere in a large file; it doesn't localize the bug the way a per-function test does.
Keep both.

## 2. The reference corpus: buildingSMART's own `Certification-datasets` repo

The user recalled "a standardized reference test IFC model published by BIM something or the
other — the org that owns the IFC standard." Confirmed via `gh api`: buildingSMART International's
own GitHub org publishes exactly this, at `buildingSMART/Certification-datasets` (this is a rename
of what used to be called `Sample-Test-Files` — the old name doesn't resolve, `gh api` redirects to
the current one). License: CC BY 4.0 (confirmed by reading the repo's own `LICENSE` file directly,
not assumed) — attribution required, no other restriction; vendoring these files into this repo is
fine as long as attribution is carried (a README note + the license text, matching how this
project already attributes other real bSI-sourced fixtures elsewhere, e.g. the alignment module's
bSI reference test backfill).

Repo layout, confirmed directly (not assumed) via `gh api repos/buildingSMART/Certification-datasets/contents`:

- Three top-level schema folders matching this port's own 3 supported schemas exactly: `IFC 2.3.0.1
  (IFC 2x3 TC1)`, `IFC 4.0.2.1 (IFC 4 ADD2 TC1)`, `IFC 4.3.2.0 (IFC 4.3 ADD2)`.
- Each has a `Simple-Scene` subfolder with **10 real, domain-specific reference models**:
  `Building-Architecture`, `Building-Hvac`, `Building-Landscaping`, `Building-Structural`,
  `Infra-Bridge`, `Infra-Electrical`, `Infra-Landscaping`, `Infra-Plumbing`, `Infra-Rail`,
  `Infra-Road`. That's **30 real files total** (10 × 3 schemas), sized 70 KB–2.3 MB (confirmed via
  `gh api ... | jq '.[] | .size'`) — real, non-trivial, production-representative models, not toy
  fixtures. These are published by buildingSMART specifically **for certification purposes**,
  i.e. they're meant to be schema-valid and comprehensive within their domain — exactly the
  property this plan wants.
- IFC4's folder additionally has 5 small, single-feature files under `ISO Spec -
  ReferenceView_V1.2` (tessellation/opening/window-specific) — a useful bonus for isolating one
  geometry-adjacent feature at a time, lower priority than the 30 Simple-Scene files.

**Why NOT the express/rules corpus for this purpose**: a certification-grade reference model is,
by construction, schema-valid — it will trigger approximately zero WHERE-rule/`validate()`
violations. It's the wrong input for exercising the rule engine (already covered by the
deliberately-invalid 138-fixture `test_rules.py`/38-fixture `test_validate.py` corpora, see
`70-express-rules-plan.md`). This plan is about the *read/write/mutation* surface, not the
validation surface.

## 3. The architectural decision that resolves the CI-blast-radius question

The user was explicit: local/on-demand is fine; if any of this lands in CI it must be a dedicated,
rarely-triggered workflow, not a tax on every PR (PR CI was just brought down to something
reasonable and shouldn't grow again). There's also a real, already-disclosed environment
constraint to design around: **dispatched background agents run in isolated worktrees with no
network egress and no built Python `ifcopenshell`** — confirmed directly, not assumed, by reading
`tools/bench_python_baseline.py`'s own header comment from Phase 2.5: "this sandbox could not run
this script itself... network egress here is allowlisted and doesn't include pypi.org... no
cmake/full C++ toolchain/working Boost install." By contrast, the orchestrating session's own
local environment (this one) has a real installed `ifcopenshell` (confirmed: `python3 -c "import
ifcopenshell; print(ifcopenshell.version)"` → `0.8.4.post1`) and outbound network access (confirmed
by the `gh api` calls used to scope this very doc).

These two facts together point at a two-tier design — which also happens to be the SAME pattern
this project already uses for the 138 `test_rules.py`/38 `test_validate.py` fixtures (expected
values derived once from a real Python run, baked into the fixture, then verified against with no
live Python needed), just extended from "one violation count" to "a full attribute-level dump":

1. **Golden generation (rare, needs live Python + network — a maintainer/orchestrating-session
   task, not a dispatch or a CI job).** A script reads a reference file via real `ifcopenshell`,
   walks every instance, and emits a normalized JSON dump (format: §4 below). The resulting JSON is
   checked into the repo alongside the `.ifc` fixture, as a golden. This step runs once per
   fixture (or again if the corpus grows, or if a real upstream bug fix ever changes Python's own
   behavior) — never as part of routine test runs.
2. **Verification (cheap, every regular test run — CAN be a normal `npm test`/PR CI step).** TS
   reads the same `.ifc` file, produces the same normalized JSON shape, and diffs it against the
   checked-in golden — pure JSON diff with float tolerance, no Python, no network. This is where
   the "don't blow up CI" concern resolves itself by construction: the expensive part (needing
   live Python) already happened once, offline, and is checked in.

A dispatched chunk agent can therefore build and fully test the TS half (dump function, diff logic,
the verification test file) against PRE-GENERATED goldens without ever needing Python itself — the
same disclosed-gap pattern `bench_python_baseline.py` already established ("a maintainer with a
real ifcopenshell-python install needs to run this... to fill them in"). The orchestrating session
generates the actual golden JSONs directly (this environment has what's needed), the same way it
already independently re-runs real Python end-to-end to verify dispatched chunks' bug claims
throughout this project's history.

**CI decision, matching the user's own explicit direction**: the verification step (chunk 1/2/3's
own test files) is cheap enough to run in normal PR CI with no meaningful cost added — no Python
setup, no network, just JSON diffing against files already in the repo. The golden-regeneration
step does NOT belong in PR CI at all; it's a manual, occasional, orchestrating-session task. If a
recorded/automated regeneration check is ever wanted later, it would be a `workflow_dispatch`-only
workflow (never `pull_request`-triggered) — left as an explicit, deferred, non-blocking option, not
built as part of this plan's initial chunks.

## 4. Normalized dump format

One JSON object per fixture, keyed by STEP id (stable, comparable across both languages):

```json
{
  "#123": { "type": "IfcWall", "attrs": [null, "2O2Fr...", null, "Wall-01", ...] }
}
```

- **Scope: forward attributes only for the first pass.** Matches what `validate()`'s own base
  checks already treat as the primary surface (Phase EX-3). Inverse attributes are a real,
  disclosed stretch item — not built in chunk 1, revisit if a genuine gap shows up.
- **Entity references**: emitted as `"#<id>"` strings, never nested/recursively expanded — keeps
  the dump flat, diffable, and immune to inverse-relationship cycles.
- **Aggregates** (lists/sets, up to the schema's real nesting depth): arrays of the same
  value-shape, recursively.
- **Floats**: compared with a tolerance-based `approxEqual` (the user's own number: ~1e-9), never
  exact equality — Python and V8 can legitimately format/round the same double slightly
  differently without it being a real port bug. Every other value type (strings, ints, bools,
  enums, nulls) compares exact.
- **Selects**: real Python's own `entity_instance.get_argument`/SWIG binding already collapses a
  SELECT to its concretely-resolved underlying value — mirror that (no separate `$type` wrapper
  needed) unless a concrete case is found where disambiguation is actually required; disclose if
  so.

## 5. Chunk breakdown

**Chunk 1 — Read-parity harness + golden generation, all 30 `Simple-Scene` files.**
- Vendor the 30 `.ifc` files into `test/fixtures/reference/<schema>/<name>.ifc` (new directory,
  following this project's existing `test/fixtures/` convention), plus a short attribution note
  (CC BY 4.0, buildingSMART International) and a copy of the license text.
- `tools/reference_dump_python.py` — mirrors `bench_python_baseline.py`'s own precedent exactly
  (usage-documented, disclosed as non-runnable in an isolated dispatch worktree, meant for a
  maintainer/orchestrating-session run). Emits the §4 JSON format for a given `.ifc` path.
- TS equivalent (e.g. `test/referenceParity/dump.ts`) producing the identical JSON shape — this is
  the part a dispatch can build and test fully, since it only needs the already-built native addon.
- Diff/compare logic with `approxEqual` float tolerance, structured for reuse by chunks 2 and 3.
- Orchestrating session runs `reference_dump_python.py` once per fixture, checks in the 30
  resulting golden JSONs.
- New test file(s) under `test/referenceParity/` that dump each fixture via TS and diff against its
  checked-in golden — runs in normal `npm test`/PR CI (cheap, no Python).
- Any real mismatch gets root-caused like every other finding this project makes — a real bug fix,
  or a disclosed, pinned divergence — never a silently-adjusted golden.

**Chunk 2 — Round-trip write-back parity.**
- For each of the 30 fixtures: TS reads it, writes it back out (`IfcFile.write()`), then re-parses
  the newly-written output **via TS's own dump function** (not a second live-Python pass) and diffs
  against the SAME golden checked in for chunk 1. If `dump(reparse(write(read(f))))` matches
  `goldenDump(f)`, the write path round-trips faithfully — without needing Python at verification
  time.
- Optional, occasional, orchestrating-session-only sanity pass (not a permanent test, not CI): once
  in a while, actually reparse a TS-written file with real Python too, to catch the one blind spot
  pure TS-to-TS round-tripping structurally can't see (TS's dump and TS's write sharing the same
  wrong understanding of some value). Document this as a known, accepted limitation of the
  automated version, not silently ignored.

**Chunk 3 — Mutation differential battery.**
- Explicitly acknowledged limitation up front (the user's own point): read/round-trip parity gets
  its coverage "for free" from a certification-grade model's own completeness; mutations have no
  such forcing function. This chunk is deliberately best-effort, not exhaustive — scoped by risk,
  prioritizing the most heavily-used `api.*` entry points first (element add/edit/remove, pset/qto
  add-edit-remove, spatial containment, material/style assignment, aggregation/nesting).
- Design a battery of scripted operation sequences (e.g. "add a wall, assign it a material, add a
  pset with 3 properties, edit one property, remove another") against a mix of blank files and the
  chunk-1 reference files.
- Same golden/verify split as chunk 1: orchestrating session runs each scripted sequence once
  through real Python, checks in the resulting dump as a golden; TS replays the identical sequence
  and diffs against it. Reuses chunk 1's dump/diff engine entirely — the only new work is designing
  and scripting the operation sequences themselves.
- Deliberately excluded from "v1 done" or any completeness claim — this is an ongoing, growable
  battery, not a one-time backfill with a defined end state.

**Not in this plan, noted for later**: tightening the existing 138/38 `test_rules.py`/
`test_validate.py` fixtures from count-only matching to a full live-diff of exact rule
names/messages against real Python (same "diff against a live oracle" philosophy as chunk 3) is a
plausible, low-priority future refinement — mentioned for completeness, not scoped or scheduled
here.

## 6. Open questions for whoever picks up chunk 1

- Exact `test/fixtures/reference/` directory shape (per-schema subfolders vs. flat with
  schema-suffixed filenames) — follow whatever this project's existing `test/fixtures/rules/`
  convention suggests is most consistent.
- Whether to also vendor the 5 small IFC4 `ISO Spec - ReferenceView_V1.2` files in chunk 1 or defer
  them — low cost either way, not a blocker.
- Confirm no reference file trips a currently-known primitive-layer gap (`TODOS.md`) before
  assuming a mismatch is a genuine new finding — check first, same discipline as every other chunk.

**Dispatch checklist:**
- [ ] Chunk 1 — read-parity harness (TS dump/diff engine + Python golden-generation script) +
  orchestrating-session-generated goldens for all 30 `Simple-Scene` fixtures + verification test
  suite.
- [ ] Chunk 2 — round-trip write-back parity, reusing chunk 1's engine.
- [ ] Chunk 3 — mutation differential battery (initial scenario set; explicitly growable later).
