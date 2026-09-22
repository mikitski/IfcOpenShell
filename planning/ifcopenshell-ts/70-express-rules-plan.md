# IfcOpenShell-TS — EXPRESS Derived-Attribute & Validation-Rule Plan

Status: locked in 2026-09-22, project owner decision, after a dedicated two-round investigation
into real `ifcopenshell-python`'s actual architecture (citations throughout). Covers two related
Phase 10 items that were previously single, unscoped rows in `PROGRESS.md`: `Derived-attribute
support (EXPRESS rules)` and the `validate.py` port. This doc supersedes `20-roadmap.md`'s own
stale placeholder text for both (that text guessed at "pre-compile derived-attribute logic... or a
generated TS module" without knowing the real shape of the problem; this doc replaces the guess
with a verified plan).

## 1. What EXPRESS derived attributes and validation rules actually are

EXPRESS (the ISO 10303-11 schema language IFC is defined in) lets a schema declare an attribute as
DERIVED — its value is a formula over other attributes, not something stored directly (STEP text
marks these with a bare `*`). EXPRESS also lets a schema attach WHERE rules — boolean constraints
an instance must satisfy to be schema-valid (e.g. "if X is set, Y must also be set"). Real Python's
`ifcopenshell.validate` module checks both: ordinary type/cardinality validation (always runs) and,
opt-in, full WHERE-rule + derive-formula checking (`--rules`).

## 2. The key architectural decision: port the compiled output, not the compiler

Real Python doesn't hand-write EXPRESS-rule logic. A build-time tool
(`ifcopenshell/express/rule_compiler.py`, 1,057 lines, plus its own EXPRESS parser/AST/codegen)
reads buildingSMART's raw `.exp` schema text and emits plain Python —
`ifcopenshell/express/rules/{IFC2X3,IFC4,IFC4X3}.py`. Those generated files are what real Python
actually ships and runs; the compiler itself is never touched again once its output exists, and
real Python's own runtime rule executor (`rule_executor.py`) never re-invokes it either — it just
loads the already-generated `.py` text.

**Decision: port the already-generated Python output to TS, function by function — do not build a
new EXPRESS→TS compiler, and do not port `rule_compiler.py` either**, even though a real, working
compiler exists as readable Python source (so "port the compiler faithfully" was a real, considered
option, not a straw man). Reasons, in order of weight:

- **Consistency with this port's entire methodology.** Every other module in this project has been
  ported by reading real Python source and porting it faithfully — never by re-deriving from a more
  fundamental spec. A new compiler (or a ported one) would be the first and only exception.
- **The generated Python is already correct and battle-tested**; porting it preserves that
  correctness directly. A new/ported compiler would still need its own correctness verification,
  and the only way to verify it is to diff its output against the existing generated files anyway —
  so it adds a whole new risk layer without removing the need to understand the target artifact.
- **Kind of difficulty, not just size.** Translating ~21,000 lines of already-concrete `if X: assert
  Y` checks and formulas is the same shape of work as every other chunk this project has done.
  Writing or porting a general EXPRESS-language parser/codegen is compiler-engineering, a
  categorically different and higher-risk kind of correctness problem.
- **The raw `.exp` schema text isn't even in this repo** — only the compiled output is. Taking on
  the compiler means taking on sourcing and versioning buildingSMART's schema files as an ongoing
  concern this project doesn't have anywhere else today.
- This exactly mirrors the already-established `src/wrappergen/` pattern in this very port: the
  Clang-based generator is build-time-only and not part of the shipped package; only its output
  (`generated_napi/`) is consumed. Same shape, one level removed.

This can be revisited post-v1 if IFC ever ships a new schema version this port needs to track; it
is out of scope for now.

## 3. Corrected scope (the "35,000 lines" figure overstates the real porting work)

| Schema | Total lines | Boilerplate (skip, see below) | Real rule content | `calc_*` (DERIVE) fns | WHERE-rule classes |
|---|---|---|---|---|---|
| IFC2X3 | 8,129 | 3,588 (44%) | 4,541 | 55 | 368 |
| IFC4 | 12,228 | 4,322 (35%) | 7,906 | 62 | 682 |
| IFC4X3 | 14,114 | 5,189 (37%) | 8,925 | 65 | 780 |
| **Total** | **34,471** | **13,099** | **21,372** | **182** | **1,830** |

The "boilerplate" ~38% of every file needs no manual line-by-line porting at all — it's mechanical
and covered by a handful of small, generic, one-time TS helpers instead:
- An inline EXPRESS-runtime shim (~148 lines, byte-identical across all 3 files) — ported once
  (§4, Phase EX-1).
- An `enum_namespace` proxy plus every schema enum re-exported as a lowercase variable — a
  mechanical mapping this port's existing schema-introspection primitives already make unnecessary
  to hand-transcribe.
- Per-schema one-line `IfcXxx(*args, **kwargs)` convenience-constructor wrappers (872 in IFC4X3
  alone) — replaced by this port's own existing `file.createEntity(...)` call sites; not ported.

**Cross-schema overlap** (real signal for sequencing, not just size): IFC4→IFC4X3 share 62/65
`calc_*` names (95%), IFC2X3→IFC4 share 47/55 (85%) — but bodies are NOT mostly identical (only
42%/21% byte-identical respectively). So porting smallest-schema-first and diffing each subsequent
schema's same-named function against the already-ported version is a large, real time-saver, but
every function still needs its own independent verification — this is not "port once, copy-paste
twice."

## 4. Phase order

### Phase EX-0 — resolve the one open primitive question

`validate()`'s own derived-attribute check (and, by the same code pattern, one path inside the rule
executor) needs to distinguish "attribute is `$` (genuinely absent)" from "attribute is `*`
(derived, computed on read)" from "a *subtype* overrides an inherited DERIVE attribute to make it
directly stored instead" — the third case can't be determined from the schema-level `derived()`
declaration alone; real Python uses a distinct `get_feature("use_attribute_value_derived")`/
`attribute_value_derived` mechanism for it. No equivalent was found anywhere in this port's native
bindings or TS layer in a first investigation pass — flagged as **unconfirmed, not yet a confirmed
blocker**. First real chunk: investigate precisely (native binding surface, C++ source, real
behavior against constructed test fixtures) and either (a) find or add the missing primitive, or
(b) confirm the override case is narrow enough to treat as a disclosed, scoped-out edge case
without blocking the rest of this plan. This can run alongside or right after Phase EX-1 — it does
not block it.

### Phase EX-1 — the shared EXPRESS runtime shim

Port the ~148-line inline helper block (`nvl`, `usedin`, `express_getitem`, `express_set`,
`is_indeterminate`/`INDETERMINATE`, `typeof`, etc. — see real source for the full list) as one new
shared TS module. One port suffices for all 3 schemas (confirmed byte-identical between IFC2X3/
IFC4; IFC4X3's differs only cosmetically). `usedin()`'s only external dependency,
`file.get_inverse(inst, allow_duplicate=True, with_attribute_indices=True)`, is **already
implemented in this port** (`file.getInverse`, both params supported) — no new primitive needed
here. Real Python has no standalone test for just this shim (always exercised indirectly through
generated rules); write original hand-rolled coverage exercising each helper directly, matching
this project's established convention for shim-layer code with no dedicated real test.

### Phase EX-2 — DERIVE (`calc_*`) function computation, closing out "Derived-attribute support"

Ports all 182 `calc_*` functions (55 + 62 + 65, with the overlap-aware diffing strategy from §3) and
wires them into `EntityInstance`'s attribute-read path so reading a DERIVED attribute actually
computes and returns the real value — mirroring real Python's `entity_instance.__getattr__`
DERIVE-dispatch mechanism — instead of throwing or returning nothing. **This alone fully resolves
the "Derived-attribute support" `PROGRESS.md` row**, independent of everything in Phase EX-4.
Sequencing: IFC2X3 first (55 functions, establishes the wiring pattern), then IFC4 (62, diff
against IFC2X3's port for the 47 shared names), then IFC4X3 (65, diff against IFC4's port for the
62 shared names). Chunk by function count at this project's own established per-chunk granularity
(roughly 5-15 functions per chunk depending on formula complexity) — expect on the order of
10-15 chunks total across the 3 schemas, not one giant chunk.

### Phase EX-3 — `validate.py`'s own base checks

Ports the ~800 non-`--rules` lines of `validate()` (type/cardinality/`GlobalId`-uniqueness/header
checks). Confirmed to need only already-available primitives (`is_a`, `is_abstract`,
`all_attributes`, `all_inverse_attributes`, `type_of_attribute`, `declaration_by_name`,
`get_attribute_category`) plus the same derived-attribute-override mechanism from Phase EX-0. Can
run before or after Phase EX-2 (no dependency between them beyond EX-0/EX-1); sequenced here mainly
because it's smaller and delivers a real, usable `validate()` (minus `--rules`) sooner. Expect 1-2
chunks.

### Phase EX-4 — WHERE-rule classes + `rule_executor.py` (the large chunk)

The bulk of the effort: 1,830 rule classes/functions across the 3 schemas (~16,831 lines once the
182 already-ported `calc_*` functions from Phase EX-2 are excluded), plus porting
`rule_executor.py` (306 lines) itself. Confirmed **zero geometry-kernel dependencies** anywhere in
a broad cross-section of the rule files — this is a real, load-bearing finding: it means this phase
is not expected to hit the kind of "permanently blocked, disclosed throw" pattern that `api.geometry`/
parts of `api.alignment` did. `rule_executor.py`'s one genuinely Python-specific piece (`_pytest.
assertion` used at runtime for nicer bare-`assert` failure messages) has no TS equivalent and needs
none — design a TS-native violation-collection API instead (return a structured list of violations
from `validate(file, {rules: true})` rather than reproducing real Python's side-effecting
`logger.error()` calls), matching this project's established "adapt an awkward Python-only idiom
into an idiomatic TS shape, disclose the difference" convention (e.g. `Profiler`'s
`[Symbol.dispose]` alias for Python's context-manager protocol).

Sequencing: same smallest-schema-first, diff-against-previous strategy as Phase EX-2 — IFC2X3 (368
classes) → IFC4 (682) → IFC4X3 (780). **Be honest about scale**: at this project's own established
chunk granularity, this phase alone is realistically 40-60+ individual chunks, likely the single
largest work item in this port's history — larger than the entire `api.alignment` module (56/59
files) and its own 4-chunk, ~5,850-line test-fidelity backfill combined. This is expected to be a
long-running, many-cycle effort, not something that finishes in a handful of dispatches. Chunk
count and exact per-chunk grouping (e.g. by entity-name alphabetical range, or by however the real
source file's own class ordering groups related rules) should be decided when Phase EX-4 actually
starts, informed by whatever grouping pattern the real source files turn out to have — not
pre-enumerated exhaustively in this planning doc.

### Phase EX-5 — final integration + test-fidelity backfill

Wire Phase EX-3's base checks and Phase EX-4's rule execution into one unified `validate(file,
{rules?: boolean})` TS entry point matching real Python's own option shape. Port real Python's own
`validate.py`/rule-execution test suite for fidelity verification once the file(s) and their sizes
are confirmed (not yet investigated in detail — do so as part of scoping this phase, following this
project's own established test-fidelity-backfill precedent from `api.alignment`).

## 5. Definition of done for this plan

- `Derived-attribute support (EXPRESS rules)` (`PROGRESS.md`) is ✅ when Phase EX-2 lands completely
  across all 3 schemas.
- `validate.py` port (`PROGRESS.md`) is ✅ when Phases EX-3 through EX-5 land completely.
- Phase EX-0 and EX-1 are prerequisites tracked under whichever of the two rows their own PR lands
  against (EX-1 is closer to the derived-attribute row; EX-0's outcome determines which row(s) it
  actually blocks).
