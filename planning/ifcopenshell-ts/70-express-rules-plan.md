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
| IFC2X3 | 8,129 | 3,588 (44%) | 4,541 | 55 | 365 |
| IFC4 | 12,228 | 4,322 (35%) | 7,906 | 62 | 679 |
| IFC4X3 | 14,057 | ~5,150 (est., not re-counted) | ~8,900 (est.) | **60** | **779** (re-verified against ADD2, 2026-09-23 — see §4 Phase EX-4) |
| **Total** | ~34,414 | ~13,060 | ~21,347 | **177** | **1,823** (re-verified 2026-09-23, corrected from 1,830 — see §4 Phase EX-4) |

**CORRECTION (2026-09-23, found while scoping the first IFC4X3 dispatch chunk):** the original IFC4X3
figures above were computed against `ifcopenshell/express/rules/IFC4X3.py` — the BASE IFC4X3 schema
revision. This port's native core actually registers and implements **`IFC4X3_ADD2`** specifically
(`test/bootstrap.ts`'s own `SCHEMA_IDENTIFIERS` mapping — confirmed directly), a LATER, genuinely
different revision (`ifcopenshell/express/rules/IFC4X3_ADD2.py`, 60 `calc_*` functions, not 65) — ADD2
restructured part of the geometry model, consolidating several base-schema per-subtype DERIVE
functions (`IfcCartesianPoint.Dim`, `IfcPointOnCurve.Dim`, `IfcPointOnSurface.Dim`,
`IfcCompositeCurveSegment.Dim`, `IfcCurveSegment.Dim`, `IfcPointByDistanceExpression.Dim`,
`IfcGradientCurve.RelativeElevation` — 7 total) into 2 new, more abstract supertype formulas instead
(`IfcPoint.Dim`, `IfcSegment.Dim`) that their former per-subtype versions now inherit. **All Phase
EX-2 IFC4X3 work must port against `IFC4X3_ADD2.py`, not the base `IFC4X3.py`** — using the wrong
revision would silently port formulas for entities/attributes this port's own schema doesn't actually
have, or miss the real ones it does. The `calc_*` total (177, not 182) and IFC4X3's own line-count
breakdown above are corrected to match ADD2; the WHERE-rule class count was re-verified against
`IFC4X3_ADD2.py` specifically during Phase EX-4's own scoping (2026-09-23) — see §4 Phase EX-4 for
the corrected, independently-verified 365/679/779 (1,823 total) breakdown.

The "boilerplate" ~38% of every file needs no manual line-by-line porting at all — it's mechanical
and covered by a handful of small, generic, one-time TS helpers instead:
- An inline EXPRESS-runtime shim (~148 lines, byte-identical across all 3 files) — ported once
  (§4, Phase EX-1).
- An `enum_namespace` proxy plus every schema enum re-exported as a lowercase variable — a
  mechanical mapping this port's existing schema-introspection primitives already make unnecessary
  to hand-transcribe.
- Per-schema one-line `IfcXxx(*args, **kwargs)` convenience-constructor wrappers (872 in IFC4X3
  alone) — replaced by this port's own existing `file.createEntity(...)` call sites; not ported.

**Cross-schema overlap** (real signal for sequencing, not just size): IFC4→IFC4X3_ADD2 share 58/60
`calc_*` names (97%, corrected — see the IFC4X3_ADD2 correction above), IFC2X3→IFC4 share 47/55 (85%)
— but bodies are NOT mostly identical (only 42%/21% byte-identical respectively, confirmed by direct
experience across all of Phase EX-2's actual IFC2X3/IFC4 chunks, not just estimated). So porting
smallest-schema-first and diffing each subsequent schema's same-named function against the
already-ported version is a large, real time-saver, but every function still needs its own
independent verification — this is not "port once, copy-paste twice."

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

Ports all 177 `calc_*` functions (55 + 62 + 60, with the overlap-aware diffing strategy from §3 —
corrected 2026-09-23 from an original 182/65 estimate that was computed against the wrong IFC4X3
schema revision, see §3's own correction note) and wires them into `EntityInstance`'s attribute-read
path so reading a DERIVED attribute actually computes and returns the real value — mirroring real
Python's `entity_instance.__getattr__` DERIVE-dispatch mechanism — instead of throwing or returning
nothing. **This alone fully resolves the "Derived-attribute support" `PROGRESS.md` row**, independent
of everything in Phase EX-4. Sequencing: IFC2X3 first (55 functions, establishes the wiring pattern
— **complete**, 4 chunks, PRs #170/#172/#175/#177/#180), then IFC4 (62, diff against IFC2X3's port
for the 47 shared names — **complete**, 4 chunks, PRs #182/#184/#186/#188), then IFC4X3_ADD2 (60,
diff against IFC4's port for the 58 shared names). Chunk by function count at this project's own
established per-chunk granularity (roughly 5-15 functions per chunk depending on formula complexity).

### Phase EX-3 — `validate.py`'s own base checks

**Scoped 2026-09-23** (dedicated investigation, after Phase EX-2 closed): real `validate.py` is 894
lines total, but only 616 non-blank/non-comment lines belong to the portable library surface — the
`__main__`/`argparse`/`LogDetectionHandler` CLI block (~110 lines) is deliberately OUT OF SCOPE,
matching this project's established precedent of never porting Python's own `if __name__ ==
"__main__"` entry points; the TS port exposes `validate()` as a plain library function only.

**Primitive-layer findings** (each investigated directly against real C++/SWIG source and this
port's own native/TS layers, not assumed):

- **`entity.derived()`** (per-attribute-position DERIVE flags) — the native C++ accessor
  (`schema.h`) has no N-API binding, but **no new primitive is needed**: `get_attribute_category`
  (already exposed, already used throughout Phase EX-2) was independently confirmed during Phase
  EX-0 to reproduce the exact same per-position semantics, including subtype overrides. This answers
  the "is this attribute derived in subtype" check `validate()` needs (line 554-565 of real source).
- **`get_feature("use_attribute_value_derived")`/`attribute_value_derived`** (Phase EX-0's own
  flagged open question) — confirmed to be pure SWIG-only glue with zero underlying `ifcparse` C++
  support (`IfcParseWrapper.i:114-145`, a file-static bool + typemap substitution). Its ONLY real use
  is distinguishing a raw `*` from `$` in parsed STEP text for one diagnostic message
  ("Attribute is derived in subtype") — the actual pass/fail LOGIC of that check doesn't need it
  (covered by `get_attribute_category` above). **Decision: deliberately deprioritized for v1** —
  building new C++ + a napi shim reproducing a SWIG typemap trick, purely for one diagnostic
  message's precision, is not worth it relative to everything else this phase needs; disclosed as a
  known, intentional gap rather than silently worked around.
- **`f.header` sub-entity accessors** (`file_description`/`file_name` and their fields:
  `description`, `implementation_level`, `name`, `time_stamp`, `author`, `organization`,
  `preprocessor_version`, `originating_system`, `authorization`) — **a real, confirmed, blocking gap**,
  already disclosed in `file.ts`'s own header comment from an earlier chunk. `file.header(): spf_header`
  exists natively and in TS, but `spf_header`'s own `file_description()`/`file_name()`/`file_schema()`
  sub-accessors (returning ordinary, plain `Header_section_schema::file_description`/`file_name`
  C++ classes with simple getter/setter methods, confirmed directly against `spf_header.h`/
  `Header_section_schema.h` — not opaque SWIG magic) have no N-API binding at all. **This needs new,
  but small and mechanical, wrappergen work** — the underlying C++ classes are ordinary
  getter-based entities, the same shape wrappergen already handles for the entire IFC schema; this is
  scoping/pointing work, not new architecture. Blocks `validate_ifc_header()` specifically.
- **`select_type.select_list()`** — already exists and is well-used. **`entity_type.subtypes()`** —
  native-only, no binding, BUT `util/schema.ts` already has a verified, reusable workaround
  (`subtypesOf`, confirmed to reproduce `entity::subtypes()`'s exact relative ordering by scanning
  `schema_definition.declarations()` and grouping by `.supertype()`) — **no new primitive needed**,
  `get_select_members`'s entity-subtype-walk branch reuses this directly.
- **`enumeration_type.enumeration_items()`** (forward index→name list) — native-only, no binding, and
  `util/attribute.ts`'s existing `getEnumItems` already throws a disclosed error for it. But
  `assert_valid`'s actual need (line 303-304 of real source) is a single-value MEMBERSHIP check
  (`val not in attr_type.enumeration_items()`), not the full list — already-exposed
  `enumeration_type.lookup_enum_offset(value)` (throws iff not a member) answers exactly that
  question without needing the missing bulk accessor at all. **No new primitive needed.**
- **`aggregation_type.type_of_aggregation_string()`** (SET/LIST/BAG/ARRAY keyword, for
  `assert_valid_inverse`'s error-message text only, never for pass/fail logic) — confirmed missing,
  no existing workaround (`util/element.ts`'s own prior chunk already disclosed this same gap and
  conservatively worked around its own, unrelated need). **Decision: disclosed message-format
  simplification** — the inverse-cardinality violation message uses a generic aggregation-kind
  placeholder instead of the exact keyword; the check's actual pass/fail logic is unaffected. Not
  worth new C++ for message cosmetics alone.
- **`ifcopenshell.get_log()` / structured C++ parse-error capture** (`log_internal_cpp_errors`) —
  confirmed genuinely unavailable: this port has no way to even CONSTRUCT a `logger` instance at all
  (no `logger::root()` binding, no factory), let alone one wired to the module-init-time global
  capture stream real Python's SWIG glue sets up. This function only matters when `validate()` is
  given a raw file PATH (not an already-open file) — to attribute low-level C++ parse errors
  (malformed attribute values, schema errors) to specific instances/lines. **Decision: TS `validate()`
  accepts only an already-open `IfcFile`, never a raw path/string** — matching this port's own
  established API convention (every other module operates on an already-open file, never does its
  own file I/O). This makes the entire path-opening branch, `log_internal_cpp_errors`, and the
  schema-error-recovery-via-raw-`.exp`-parsing branch (lines 469-480) N/A by design, not a porting
  gap — a disclosed, deliberate simplification.
- **`is_a`, `is_abstract`, `all_attributes`, `all_inverse_attributes`, `type_of_attribute`,
  `declaration_by_name`, `inverse_attribute.{bound1,bound2,entity_reference,attribute_reference}`,
  `guid.expand`** — all already confirmed present and in active use from prior phases. No new work.

**API design decision (locked here, not deferred to Phase EX-5)**: `validate()` returns a structured
list of violations rather than accepting a Python-style duck-typed `logger` object (`logger.error(...)`,
`logger.set_state(...)`) — matching the design this plan already locked for Phase EX-4's
`rule_executor` port. Building EX-3 with a Python-mimicking logger-object API only to redesign it when
Phase EX-5 unifies EX-3+EX-4 into one entry point would be pure rework; locking the shape once, now,
avoids that. `validate(file, options?)` initially supports base checks only; the `rules` option is
added when Phase EX-4 lands (omitted from the type signature until then, not stubbed as a no-op, to
avoid promising unimplemented behavior).

**Test-fidelity resource already in hand**: real Python's own `test/test_validate.py` (67 lines) is
a simple, fully data-driven parametrized test — glob every `.ifc` file in `test/fixtures/validate/`,
parse its expected result from its filename (`pass-*` → 0 violations, `fail-*`/`fail-expected-N-*` →
1/N violations, via `fixture_generate.py`'s own tiny convention), run `validate()`, assert the count.
**All 38 real fixture files are ALREADY vendored byte-identical into this port's own
`src/ifcopenshell-ts/test/fixtures/validate/`** (confirmed via `diff`) — zero fixture-sourcing work
needed, and a spot-check of the fixture names found none that appear to require `--rules`/WHERE-rule
execution (Phase EX-4), meaning Phase EX-3 can likely close with FULL fixture-based test-fidelity
coverage immediately, not a partial subset deferred to Phase EX-5.

**Revised chunk plan** (corrects the original "expect 1-2 chunks" estimate — the real primitive-layer
findings above, plus the up-front API design decision, make 4 chunks the realistic count; tracked as a
concrete checklist in `PROGRESS.md`'s own `validate.py port` row):

1. **Primitive-fix chunk**: expose `spf_header`'s 3 sub-entity accessors and their own field getters
   to wrappergen/TS (the one real, confirmed, blocking native gap). Small and mechanical.
2. **Core type-checking engine**: `ValidationError`, `format`, `assert_valid` (all 6 type-kind
   branches), `get_select_members`, `assert_valid_inverse`, the `entity_attribute_map` caching
   pattern (mirrors `attributeCache.ts`'s own established shape). The meatiest, most self-contained
   logic; needs no orchestration yet.
3. **Standalone checks**: `validate_guid` (trivial, reuses `guid.ts`), `validate_ifc_header` (needs
   chunk 1's new primitive), `validate_ifc_applications` (uniqueness-dedup pattern, reuses
   already-established `by_type`). Independent of chunk 2's engine.
4. **Main `validate()` orchestrator (closes Phase EX-3)**: wires chunks 2+3 together — per-instance
   loop, file-wide `GlobalId` uniqueness, abstract-entity check, derived-in-subtype check (via
   `get_attribute_category`), forward/inverse per-attribute checks. Ships the TS-native
   `validate(file, options?)` entry point per the locked design above, AND wires up the
   fixture-based test-fidelity suite immediately (not deferred to Phase EX-5), since the fixtures are
   confirmed 100% ready and require no `--rules` support.

### Phase EX-4 — WHERE-rule classes + `rule_executor.py` (the large chunk)

**Scoped 2026-09-23** (dedicated investigation, mirroring the Phase EX-0/EX-3 precedent, after Phase
EX-3 closed). This is the single largest work item in this port's history — but the investigation below
found it more tractable than the original honest-scale estimate feared, and found **zero new native
primitives needed** (unlike Phase EX-3, which needed one primitive-fix chunk before real work could
start, Phase EX-4 can begin porting rules immediately).

**Corrected rule counts** (the original 368/682/780 figures each counted 3 non-rule boilerplate
classes too — `express_set`/`indeterminate_type`/`enum_namespace`, already ported in Phase EX-1 — and
the IFC4X3 figure was never re-verified against `IFC4X3_ADD2.py` specifically until now):

| Schema | `SCOPE='entity'` | `SCOPE='type'` | `SCOPE='file'` | **Total** |
|---|---|---|---|---|
| IFC2X3 | 339 | 24 | 2 | **365** |
| IFC4 | 652 | 25 | 2 | **679** |
| IFC4X3_ADD2 | 752 | 25 | 2 | **779** |
| **Grand total** | | | | **1,823** |

(Corrected from 1,830; independently re-verified via direct `grep -c "SCOPE = '<kind>'"` against all 3
real files, not just the sampling agent's own count.)

**`rule_executor.py`'s real execution model is genuinely richer than "iterate instances, run their own
rules"** — read in full directly, not assumed. Three distinct rule scopes, each with its own dispatch
mechanism real Python's `run()` (lines 70-281) implements:

- **`SCOPE = 'file'`** (2 per schema, byte-identical across all 3): run once each, called as `R()(f)`
  against the whole file. The ONLY genuinely complex tier — both examples use `by_type`/loops/other
  rule-file-local helper functions (e.g. `IfcSameValidPrecision`, `IfcSameAxis2Placement`), not a bare
  `assert`. Everything else (99.7% of all rules) is 2-6 lines: 0-2 local variable extractions then one
  final `assert (...) is not False` — structurally simpler and shorter than Phase EX-2's own `calc_*`
  functions, which had genuine multi-branch dispatchers.
- **`SCOPE = 'type'`** (24-25 per schema): attached to an EXPRESS defined-type name (e.g.
  `IfcBoxAlignment`, `IfcCardinalPointReference`), not an entity — real Python walks the ENTIRE
  instance-value graph of the file (every instance's every non-derived forward attribute, recursively
  into aggregates) looking for any value whose declared type matches, ACCOUNTING FOR THE DEFINED
  TYPE'S OWN SUBTYPE CHAIN (e.g. a rule on `IfcLengthMeasure` also fires for `IfcPositiveLengthMeasure`
  values, since the latter is declared as a type-alias subtype of the former) — built via a `subtypes`
  map real Python constructs by scanning `schema.declarations()` for every `type_declaration` and
  checking whether its own `declared_type()` wraps another type-declaration's name (lines 149-166).
  This port's own `entity_type.subtypes()` workaround (`util/schema.ts`'s `directSubtypesOf`, already
  established for Phase EX-3) is the exact same shape of workaround needed here, just for
  `type_declaration` instead of `entity` — `type_declaration.declared_type()` is already exposed
  (used throughout Phase EX-2/EX-3), so **no new primitive needed**, just a new, analogous schema-scan
  helper.
- **`SCOPE = 'entity'`** (the overwhelming majority: 339/652/752): attached to an entity `TYPE_NAME`,
  run once per matching instance via `f.by_type(TYPE_NAME)` — the straightforward case this phase's
  own name suggested from the start.

**Two global settings toggles real Python's `run()` sets for the duration of rule execution, both
already fully implemented in this port with zero new work needed** (independently verified directly
against `src/settings.ts`/`src/entityInstance.ts`, not assumed from the investigation alone):
`unpack_non_aggregate_inverses` (a single-cardinality inverse attribute unpacks to the bare object
instead of a 1-element array — already implemented as `settings.unpackNonAggregateInverses`, wired
into both `EntityInstance.get()` and its dot-property Proxy handler) and `compare_instances_by_value`
(compiled rules use Python's native `==`/`!=` for EXPRESS's own `=`/`<>` operators, whose semantics on
entity-typed values is deep value equality, not reference identity — already implemented as
`settings.compareInstancesByValue`, consumed by `EntityInstance.equals()`'s already-existing deep
`structurallyEqual` comparison). Phase EX-4's own rule-execution entry point just needs to toggle both
`true` for its duration and restore them after, exactly mirroring real Python's own
`try/finally`-equivalent shape (real source lines 90-97, 280-281) — ported rule bodies use `.get()`
for inverse access and a to-be-established `.equals()`/`.notEquals()` runtime-shim wrapper for `==`/
`<>` against entity-typed values, and get correct semantics automatically.

**`rule_executor.py`'s one genuinely Python-specific piece — pytest's `assertion.rewrite` AST rewriting
(line 117), which turns a bare `assert expr` into one producing a rich, decompiled-looking failure
message via a companion `reverse_compile()` text-reversal hack (lines 11-33) that turns the *compiled
Python source line itself* back into pseudo-EXPRESS syntax for the error text** — has no TS equivalent
and needs none: it is purely a message-formatting nicety, verified to never affect pass/fail logic
(the `assert` either raises `AssertionError` or it doesn't, independent of how nicely the failure
gets described). **Decision**: each ported rule's own TS implementation throws a structured violation
carrying `ruleName`, the entity/type name, and a HAND-WRITTEN, human-readable description of the
constraint (not a decompiled string) — the porting agent already has to understand what the rule
checks to translate it faithfully, so capturing that understanding as the violation's own message
text is nearly free and produces clearer text than a decompiled pseudo-EXPRESS string would. Reuses
`validate.ts`'s own `ValidationError` class (or a close variant) for eventual Phase EX-5 unification
into one violation list alongside Phase EX-3's own checks.

**Test-fidelity resource already in hand, exactly like Phase EX-3's own**: real Python's
`test/fixtures/rules/` has **138 real `.ifc` fixtures** (plus 28 `generate_*.py` scripts that produced
them, not needed) — **already vendored byte-identical into this port's own
`src/ifcopenshell-ts/test/fixtures/rules/`** (confirmed via `diff`), spanning geometry/profile
constraints, placement/axis constraints, unit conversion, and enum/`USERDEFINED` constraints across
multiple schemas. Real Python's own `test/test_rules.py` (54 lines) is a direct, dedicated unit test
calling `rule_executor.run()` directly (not through `validate()`) — same parametrized
glob-and-assert-count pattern as `test_validate.py`. Zero fixture-sourcing work needed whenever the
test-fidelity backfill for this phase happens (Phase EX-5, or pulled forward per-chunk the same way
Phase EX-3's own chunk 4 did, TBD when that phase starts).

**Sequencing**: same smallest-schema-first, diff-against-previous strategy as Phase EX-2/EX-3 — IFC2X3
(365) → IFC4 (679) → IFC4X3_ADD2 (779). Ordinary, expected chunk-by-chunk work, not a blocker: many
rules call into rule-file-local EXPRESS-library helper functions (e.g. `IfcSameValidPrecision`,
`IfcSameAxis2Placement`) that Phase EX-2 never had reason to port (it only handled `calc_*` DERIVE
functions) — each chunk that first touches a rule needing an unported helper ports that helper too,
mirroring exactly how Phase EX-2 itself incrementally added new shared helpers as needed
(`IfcMlsTotalThickness`, `IfcGetBasisSurface`, etc.).

**Revised chunk-count estimate**: given ~99.7% of all 1,823 rules are trivially small (2-6 lines) —
genuinely simpler per-item than Phase EX-2's own `calc_*` functions — a materially higher rules-per-
chunk density than Phase EX-2's own ~15-per-chunk convention is both possible and desirable (per-chunk
dispatch/review/CI/merge overhead is roughly constant regardless of how many trivial rules ride along,
so batching more of them amortizes that overhead better). **Revises the original "40-60+ chunks"
estimate down to roughly 30-40**, targeting on the order of 50-80 rules per "typical" entity/type-scope
chunk (tuned in practice starting from chunk 1, the same way Phase EX-2 itself adjusted its own
per-chunk function count as real complexity was encountered), sequenced by real source file order
within each schema (which naturally clusters a WHERE-rule class near its own entity's `calc_*`
functions, when one exists) — with the 6 total `file`-scope rules (2 per schema) each handled with
individual care in whichever chunk their file-order position falls into, being the only genuinely
complex tier. Still a long-running, many-cycle effort — not something that finishes in a handful of
dispatches — but a real, evidence-based correction from the original estimate, not just an optimistic
guess.

**No Phase-EX-0-style native-primitive-fix prerequisite chunk needed** (unlike Phase EX-3): the
`type_declaration`-subtype-chain workaround, both settings toggles, and every other primitive Phase
EX-4 needs are already fully available. The first real dispatch can be an ordinary rule-porting chunk.

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
