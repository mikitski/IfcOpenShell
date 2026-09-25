// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-3 chunk 2 (planning/ifcopenshell-ts/70-express-rules-plan.md): near-verbatim
// port of the core, self-contained type-checking engine from `ifcopenshell/validate.py`
// (src/ifcopenshell-python, 894 lines total) -- specifically `ValidationError` (lines
// 85-88), `format` (lines 185-189, exported here as `formatValue` -- see below for the
// rename), `assert_valid_inverse` (lines 192-217), `select_members_cache`/
// `get_select_members` (lines 220-247), `assert_valid` (lines 250-324), and
// `entity_attribute_map`/`get_entity_attributes` (lines 402-416). Every other function
// in real `validate.py` (`validate`, `validate_guid`, `validate_ifc_header`,
// `validate_ifc_applications`, `log_internal_cpp_errors`, `to_string_header_entity`,
// `annotate_inst_attr_pos`, `json_logger`, the CLI block) is explicitly deferred to
// chunks 3/4 per the phase plan -- nothing in this file wires into an orchestrator yet.
//
// `validate.ts` was not already in use for anything else in this package (confirmed via
// a full-repo search before creating it) -- matches the task brief's suggested name with
// no collision to disclose.
//
// *** Real, disclosed primitive-layer findings from this chunk's own investigation (in
// addition to the ones `70-express-rules-plan.md`'s own Phase EX-3 section already
// anticipated) -- each verified directly against `src/ifcparse/schema.h`, the C API
// header (`src/wrappergen/generated_napi/ifcopenshell_native_c_api.h`), and the
// generated N-API glue (`ifcopenshell_native.cpp`), not assumed: ***
//
// 1. TS has no SWIG-style dynamic auto-downcasting. Real Python's own `attr_type`
//    argument is always already the correct, most-derived dynamic type (SWIG resolves
//    this at the C++/Python boundary), so `isinstance(attr_type, simple_type)` etc. just
//    works. This port's native layer instead hands back *generic* container wrappers
//    (`parameter_type`, `declaration`) that must be explicitly downcast via their own
//    `as_simple_type()`/`as_named_type()`/`as_aggregation_type()` (on `parameter_type`)
//    or `as_entity()`/`as_type_declaration()`/`as_select_type()`/`as_enumeration_type()`
//    (on `declaration`) -- exactly one succeeds (returns non-null) per node, by
//    construction of the real EXPRESS type grammar. `classifyAny`/`classifyDeclaration`/
//    `classifyParameterType` below implement this dispatch once, replacing every
//    `isinstance(attr_type, X)` check in the real source with a `classified.kind === X`
//    check against their result -- the *only* structural change from the real source's
//    own control flow, needed because TS has no dynamic-dispatch equivalent to lean on.
//
// 2. **A genuine, additional primitive gap the task brief did not anticipate**:
//    `simple_type::declared_type()` (the C++ enum -- `binary_type`/`boolean_type`/
//    `integer_type`/`logical_type`/`number_type`/`real_type`/`string_type` --
//    `assert_valid`'s simple-type branch indexes `simple_type_python_mapping` with) is a
//    real accessor (`src/ifcparse/schema.h`) but has **no N-API binding at all** --
//    confirmed via both the TS `simple_type` class (only `as_simple_type()`) and the C
//    API header (no `ifcopenshell_simple_type_declared_type` symbol anywhere). This is
//    the *exact same* gap `util/attribute.ts`'s `getPrimitiveType` already disclosed as
//    its own "Gap 2" (that file's header comment has the full investigation, including
//    ruling out every workaround this chunk re-checked and confirmed still doesn't
//    exist: no per-instance fallback is available here either, since `assert_valid`'s
//    signature -- matching Python's own -- receives only a bare `parameter_type`/`val`,
//    no owning entity/attribute-index/file to probe with; and raw EXPRESS built-in
//    primitives are anonymous `simple_type` objects with no `.name()` to key a
//    workaround off, `simple_type : public parameter_type`, NOT `: public declaration`).
//    A second, independent, deeper finding compounds this: even if the exact declared
//    kind *were* available, this port's own attribute-value marshaling (`ifcopenshell_
//    native.cpp`'s `ifcopenshell_attribute_value_variant_to_js`) already collapses
//    INTEGER and DOUBLE into the same plain JS `number` on read (`napi_create_int64`/
//    `napi_create_double` are both JS "number"), and represents LOGICAL as a raw JS
//    `number` (0/1/2 for false/true/UNKNOWN, `ATTRIBUTE_VALUE_KIND_LOGICAL`'s own
//    conversion case) rather than Python's `True`/`False`/`"UNKNOWN"` -- so Python's
//    exact `simple_type_python_mapping` per-kind distinctions (`int` vs `float`, the
//    `{True, False, "UNKNOWN"}` set) could not be reproduced byte-for-byte even with the
//    missing accessor in hand. Given both findings, this port's simple-type branch below
//    makes a disclosed, deliberate choice: a **permissive** check (`val` must be a JS
//    `string`/`number`/`boolean` -- the only three runtime shapes any of Python's seven
//    categories can ever take here) rather than either (a) fabricating a specific-kind
//    check with a guessed mapping, or (b) throwing and breaking every ordinary
//    simple-typed attribute check (which chunk 4's per-instance `validate()` loop would
//    hit constantly, for nearly every attribute in every file). This trades precision
//    (won't flag e.g. a `BOOLEAN`-declared attribute holding a string) for usability,
//    matching this project's general "prefer an honest, working approximation over a
//    silently-broken or newly-unusable primitive" bias when a gap is real and
//    unworkaroundable -- see `test/validate.test.ts` for tests pinning this exact,
//    disclosed divergence from Python's stricter behavior.
//
// 3. `type_of_aggregation_string()` (the SET/LIST/BAG/ARRAY keyword `assert_valid_
//    inverse`'s error message embeds) is confirmed missing with no workaround, exactly
//    as `70-express-rules-plan.md` already anticipated -- `assertValidInverse` below
//    uses a generic `"AGGREGATE"` placeholder keyword instead, derived purely from
//    whether `bound1()`/`bound2()` indicate an aggregation at all (`(b1, b2) !==
//    (-1, -1)`), never from the missing accessor -- the cardinality pass/fail logic
//    itself needs (and uses) only `bound1()`/`bound2()`, both already exposed.
//
// 4. `entity`/`select_type`/`type_declaration`/`enumeration_type` have no `.name()` of
//    their own in this port's generated facade (only the generic `declaration` class
//    does) -- `util/schema.ts`'s `entityName` already established, verified, and
//    disclosed the fix for `entity` specifically (a safe pointer-reinterpret: `entity :
//    public declaration` is real, single, non-virtual C++ inheritance, and both
//    generated C-API wrapper structs are a single pointer field, so constructing a
//    `declaration` wrapper directly around an `entity` handle is a valid, no-op
//    upcast -- see that function's own doc comment for the full, empirically-verified
//    justification). This chunk generalizes the *identical* technique (re-verified
//    directly against `src/ifcparse/schema.h`, not assumed to carry over) to
//    `select_type`/`type_declaration`/`enumeration_type`, all three of which are
//    likewise real, single, non-virtual `: public declaration` subclasses -- `entity` is
//    reused via `util/schema.ts`'s own exported `entityName`; the other three share a
//    single local `declarationName` helper below rather than three near-duplicate
//    one-liners.
//
// 5. Python's `val.wrappedValue` (`assert_valid`'s select-type branch, real source line
//    292) is the SWIG pseudo-attribute name for a non-entity (simple/defined-type)
//    instance's own scalar value. `entityInstance.ts`'s own header comment already
//    discloses that this port's N-API shim doesn't support *name*-based access to that
//    pseudo-attribute (`.get("wrappedValue")` throws) -- but *index*-based access
//    (`getByIndex(0)`) on a non-entity instance works correctly and is already relied on
//    for exactly this purpose by `EntityInstance.equals()` (`this.getByIndex(0) ===
//    other` for a non-entity instance). Reused identically here, not a new workaround.
//
// 6. Two faithfully-*preserved* Python quirks (ported byte-for-byte, not "fixed" --
//    matching this project's verbatim-translation mandate, e.g. `util/schema.ts`'s own
//    `getSubtypes` precedent):
//    - `assert_valid`'s aggregation-type branch recurses via `assert_valid(ty, v,
//      schema, attr=attr)` -- note `no_throw` is **not** forwarded, so it always
//      defaults to `False` on the per-element recursive call regardless of what the
//      *outer* call's own `no_throw` was. A single invalid aggregate element therefore
//      always throws a `ValidationError`, breaking out of `all()`/`.every()` immediately
//      -- even when the outer caller passed `no_throw=true` and expected a plain
//      `false` back instead of an exception. Ported exactly as-is below (`false`
//      hard-coded on the recursive call, not `noThrow`).
//    - `get_select_members`'s cache check (`if from_cache:`) relies on Python's
//      "empty container is falsy" truthiness: a previously-cached-but-empty `set()`
//      is treated as a cache MISS and silently recomputed, not a hit. JS's empty `Set`
//      is truthy, so this is reproduced explicitly (`cached.size > 0`) rather than left
//      as a silent divergence -- the same "JS truthiness differs from Python's for empty
//      containers" issue `util/schema.ts`'s own `isPythonFalsy` helper already
//      documents and fixes for a different function. `get_entity_attributes`'s own
//      cached value (a 2-tuple, always non-empty) has no equivalent trap, so its cache
//      check (ported below following `attributeCache.ts`'s established
//      never-evicted-`Map` pattern, per this chunk's own explicit instruction) is a
//      plain "is present" check.
//
// 7. `format`/`repr(val)`/`str(val)`: Python's default SWIG `repr()`/`str()` for an
//    opaque wrapper object is itself non-deterministic (embeds a raw memory address) and
//    not meaningfully portable byte-for-byte -- there is also no dedicated real Python
//    test exercising these functions in isolation to pin an exact expected string
//    against (this phase's own scoping note). `format` is ported here as `formatValue`
//    (renamed to avoid the bare, generic top-level name `format` at this module's public
//    surface -- disclosed rename, not a behavior change) using small, disclosed
//    best-effort `pyRepr`/`pyStr` helpers that cover every value shape this port's own
//    attribute-value layer actually produces (`null`/boolean/number/string/
//    `EntityInstance`/array), not a general Python `repr()`/`str()` reimplementation.
//
// 8. **A newly-discovered, out-of-scope-for-this-chunk finding worth flagging for future
//    chunks**: `enumeration_type.enumeration_items()` -- which `70-express-rules-plan.md`
//    and `util/attribute.ts`'s own header comment both document as having *no* N-API
//    binding -- now actually has one (`native.enumeration_type_enumeration_items`,
//    confirmed present in `ifcopenshell_native.ts`/the C API header), landed as a side
//    effect of PR #200's (Phase EX-3 chunk 1) `spf_header` adapter work, not anything
//    this chunk added. This chunk still follows the task brief's locked design and uses
//    `lookup_enum_offset` for `assert_valid`'s enumeration-membership check (a single-
//    value membership question, exactly what that primitive answers, and the design
//    this project already committed to) -- but `util/attribute.ts`'s `getEnumItems`
//    (and its own header comment) is now stale and could be revisited in a future chunk
//    to return the real forward list instead of throwing. Not fixed here: out of this
//    chunk's own declared scope, and not needed by anything ported in this file.
//
// *** Phase EX-3 chunk 3 (planning/ifcopenshell-ts/70-express-rules-plan.md): adds the 3
// remaining standalone, independent leaf checks -- `validateGuid` (Python: `validate_guid`,
// real source lines 632-651), `validateIfcHeader` (Python: `validate_ifc_header`, lines
// 667-739 -- `to_string_header_entity`, lines 654-665, is deliberately NOT ported, see
// finding 12 below) and `validateIfcApplications` (Python: `validate_ifc_applications`,
// lines 741-782). None of these three depend on anything above in this file (chunk 2's
// `assertValid`/`assertValidInverse`/`getSelectMembers`/`getEntityAttributes`); they are
// independent leaves chunk 4's `validate()` orchestrator will call directly, exactly as
// the phase plan anticipated. Design recap (locked in the task brief, not re-litigated
// here): `validateGuid` keeps real Python's own single-message `string | null` return
// shape (only ever one thing to say about one guid); `validateIfcHeader`/
// `validateIfcApplications` return `ValidationError[]` instead -- collecting every
// violation found in one call rather than throwing on the first -- reusing chunk 2's own
// `ValidationError` class unchanged (message + optional `attribute`) rather than inventing
// a parallel violation type, so chunk 4 can concatenate everything (these two functions'
// return arrays, plus anything caught from `assertValid`/`assertValidInverse`'s thrown
// `ValidationError`s) into one final list with no shape mismatch.
//
// *** Additional real, disclosed findings from this chunk's own investigation, beyond
// what the task brief and `70-express-rules-plan.md` already anticipated -- each verified
// directly (native probes against the real built addon and real Python source), not
// assumed: ***
//
// 9. **`validateIfcHeader`'s per-field checks are driven entirely by the native
//    `spf_header` accessors' own thrown exceptions, and this turns out to line up with
//    real Python's own `except RuntimeError` branch almost exactly** -- empirically
//    confirmed (throwaway probes against every one of the 5 already-vendored malformed
//    header fixtures, `test/fixtures/validate/fail-header-*.ifc`/
//    `fail-expected-2-header-attr-too-few.ifc`, plus two hand-built edge cases) that
//    `spf_header_file_*_*()` throws whenever the underlying STEP value's shape doesn't
//    match what the accessor expects: a `$` (explicit null) or an entirely missing
//    trailing argument both throw "does not match actual type <null>"; a scalar where a
//    list is expected, or a list of non-strings where a list of strings is expected, both
//    throw a similarly-shaped type-mismatch message. A *present, syntactically valid, but
//    empty* list (`FILE_DESCRIPTION((), ...)`) does NOT throw -- confirmed separately --
//    so `validateIfcHeader`'s own aggregate-field helper still needs its own explicit
//    "list is empty" check after a successful call, mirroring real Python's own separate
//    `if not value:` branch. Net effect: this port's version doesn't need real Python's
//    own per-element `isinstance(v, str)` loop at all (the native accessor's own
//    marshaling already enforces "every element is a string" before ever returning
//    successfully) -- exactly the "noticeably simpler than real Python" shape the task
//    brief anticipated, and for a slightly different, now-confirmed reason (the native
//    layer's own type-checked marshaling, not just the absence of caret-annotation
//    machinery). Each field's violation message embeds the native exception's own message
//    text (already a real, useful diagnostic, e.g. "Requested type <string> does not match
//    actual type <int> at index 1") rather than reconstructing Python's separate
//    `type(value).__name__` -- an intentional, disclosed adaptation: this port never has
//    the raw pre-marshaled value in hand to name its type the way Python's `getattr` does
//    (a failed accessor call throws before producing anything), so the native layer's own
//    diagnostic is substituted rather than fabricated.
//
// 10. **A genuine, disclosed test-fidelity gap for one already-vendored fixture**:
//    `test/fixtures/validate/fail-header-attr-too-many.ifc` (a `FILE_NAME` with 2 extra
//    trailing arguments beyond the schema's 7) produces **zero** violations from
//    `validateIfcHeader` in this port -- confirmed empirically: none of the 9 field
//    accessors throw or report anything unusual for it, since the shim only reads the
//    fixed set of named fields and silently ignores anything beyond them. Real Python's
//    own `validate_ifc_header` has an identical structural blind spot (its own
//    `validate_attribute` helper only ever reads the 9 named fields too) -- the "too many
//    args" case is actually caught, in real Python, by a *different* mechanism entirely:
//    a raw C++/SWIG parse-time error surfaced through `log_internal_cpp_errors`, which
//    only runs when `validate()` is given a raw file PATH (not an already-open file).
//    `70-express-rules-plan.md`'s own Phase EX-3 findings already disclosed that this
//    port's `validate()` will only ever accept an already-open `IfcFile` -- making that
//    whole code path N/A by design, not a porting gap -- but this chunk is the first to
//    trace that decision through to a *specific, named, already-vendored fixture* it
//    affects: `fail-header-attr-too-many.ifc` (named `fail-...` with no `expected-N-`
//    prefix, i.e. real Python's own test convention expects exactly 1 violation from it)
//    will very likely report 0 violations from this port's eventual `validate()`, once
//    chunk 4 wires up the fixture suite, unless some other still-to-be-ported check
//    (chunk 4's own per-instance loop, or Phase EX-4's WHERE-rules) happens to also flag
//    something in it. Flagged here, now, for chunk 4 to account for explicitly (e.g. an
//    accepted, disclosed known-divergence skip) rather than being rediscovered as a
//    surprise test failure later.
//
// 11. **A genuine, newly-found primitive-layer divergence in `validateGuid`, not
//    previously disclosed anywhere in `guid.ts`/`TODOS.md`**: real Python's
//    `ifcopenshell.guid.expand` can genuinely raise (Python's `base64.b64decode` raises
//    `binascii.Error` when, after silently discarding out-of-alphabet characters, the
//    remaining decoded length is invalid) -- `validate_guid`'s own `except:` branch
//    depends on this. This port's `guid.ts#expand` instead decodes via Node's
//    `Buffer.from(str, "base64")`, which is **even more lenient than Python's own
//    decoder and confirmed, empirically, to never throw** for any input string
//    (garbage/all-invalid-character strings silently decode to whatever bytes Node can
//    salvage, verified directly: `expand("!!!!!!!!!!!!!!!!!!!!!!")` returns `""` rather
//    than throwing). Ported byte-for-byte, `validateGuid`'s `try { expand(guidValue) }
//    catch { ... }` structure would therefore make its own "invalid characters"/"couldn't
//    decompress" messages permanently unreachable dead code in this port -- a real,
//    silent functional regression from real Python's actual validation behavior (a
//    22-character, correct-first-character string full of garbage characters would be
//    reported as a *valid* guid). **Decision: keep the `try`/`catch` structure (for
//    fidelity, readability, and in case `expand()`'s own implementation ever becomes
//    stricter), but perform the character-set membership check unconditionally,
//    independent of whether the `catch` block actually ran** -- this reproduces real
//    Python's actual practical outcome for every case that matters (a 22-char,
//    correct-first-character guid containing any character outside the IFC base64
//    alphabet is correctly reported invalid) despite the underlying mechanism (exception
//    vs. unconditional check) genuinely differing. Real Python's own remaining "couldn't
//    decompress, not base64 encoded" branch is, on inspection, already close to dead code
//    in real Python too once the character-membership check passes (a 22-char string
//    built entirely from the 64-symbol IFC alphabet always translates to a
//    length-24 standard-base64 string, which always decodes successfully) -- ported
//    as-is for structural parity, not because it's expected to ever fire in practice in
//    either implementation.
//
// 12. **The task brief's own assumption that `IfcFile.header()` already exists (as a
//    wrapper method, mirroring `spf_header`'s exposure) was checked directly and found
//    stale**: `src/file.ts`'s `IfcFile` class has no `header()` method at all -- its own
//    header comment already explicitly defers this ("`header`/`mvd`/`assignHeaderFrom`
//    themselves are still not ported here; that remains later work"), and
//    `TODOS.md`'s "`spf_header` has no `file_description()` sub-entity accessor" entry
//    (itself now partially stale re: the accessor's existence, landed by PR #200, but
//    still accurate re: `IfcFile.header()`/`.mvd` not existing) confirms this is
//    deliberately-deferred, separate follow-up work, not something this chunk should add
//    incidentally. `validateIfcHeader` therefore reaches the native `spf_header` via
//    `f.nativeFile.header()` directly -- the exact same native-layer reach-through
//    pattern chunk 2's own test suite (`test/validate.test.ts`) already established for
//    the analogous `file.nativeFile.schema()` need, not a new convention.
//
// 13. **`validateIfcApplications`'s "previous element" reference** (real Python embeds
//    both the offending instance and the one that first claimed the name/id pair in its
//    error message): kept as plain text embedded in the `ValidationError`'s own `message`
//    (both instances' `toString()` STEP-text rendering, matching real Python's own
//    `%s`-formatted `inst`/`previous_element` substitutions) rather than adding a new
//    field to `ValidationError` -- keeps the violation shape uniform with every other
//    check in this file (`message` + optional `attribute`, nothing per-check-specific).
//    Real Python's own `annotate_inst_attr_pos(...)` caret-position annotations (embedded
//    in the same message) are dropped for the same already-established reason
//    `validateIfcHeader` drops `to_string_header_entity`/its own annotation calls: this
//    port has no raw SPF-text-with-caret diagnostic machinery, and the annotation is
//    cosmetic, not load-bearing for pass/fail logic.
//
// 14. **`/code-review`-found gap, fixed in this same chunk**: `validateIfcHeader` originally
//    dereferenced `f.nativeFile.header()` unchecked, even though that generated wrapper
//    method (`ifcopenshell_native.ts`) explicitly handles a `null` native result (the same
//    `result === null ? (null as unknown as spf_header) : ...` shape `schema()` uses, which
//    `test/bootstrap.ts`'s own `isSchemaAvailable` treats as a real, reachable case for
//    `schema()` specifically). Not proven reachable for `header()` in practice (every
//    construction path this port's own tests exercise -- including a bare, freshly-created
//    "blank" file -- returns a real, populated default header, per finding 9's own probing
//    and `test/native/header.test.ts`), and real Python's own `f.header` SWIG attribute is
//    presumed similarly always-populated (`ifcopenshell::file` owns its `spf_header` member
//    by value, never by pointer) -- but the original code's incidental safety (each field's
//    own `try`/`catch` happened to swallow a resulting raw `TypeError` rather than crash)
//    still produced a misleading diagnostic instead of a clear one. Fixed with an explicit
//    `header === null` guard at the top of `validateIfcHeader`, returning a single, clear
//    violation instead.
//
// *** Phase EX-3 chunk 4 (planning/ifcopenshell-ts/70-express-rules-plan.md): the main
// `validate(f)` orchestrator (real source lines 419-629), wiring chunks 2/3 together --
// see that function's own doc comment for the line-by-line real-source mapping. This
// chunk also wires up the real, fixture-based `test/test_validate.py`-equivalent test
// suite (`test/validate.orchestrator.test.ts`, all 38 already-vendored fixtures in
// `test/fixtures/validate/`). ***
//
// 15. **A real, disclosed, and now fully-enumerated test-fidelity gap family**: this
//    port's `validate()` cannot detect ANY malformed-STEP-syntax condition that real
//    Python's own C++ core only reports via a parse-time log message
//    (`ifcopenshell.get_log()`, surfaced through `log_internal_cpp_errors`) --
//    `70-express-rules-plan.md`'s own Phase EX-3 finding already disclosed this whole
//    mechanism as genuinely unavailable (no `logger::root()` binding, no factory) and
//    already locked the resulting API decision (`validate()` accepts only an
//    already-open `IfcFile`, never a raw path, making the entire log-capture branch
//    N/A by design); chunk 3's own finding 10 already named the *first* concrete
//    fixture this affects (`fail-header-attr-too-many.ifc`). Wiring up the full fixture
//    suite in this chunk empirically confirmed (via `validate()` itself, run against
//    every vendored fixture, not assumed) that the *same* root cause affects **8
//    further fixtures**, each for a different concrete flavor of "the tolerant C++
//    parser silently drops/pads/coerces a malformed value instead of raising a
//    catchable exception, but *does* log something a path-based `validate()` would
//    have captured":
//    - `fail-attr-too-few.ifc` / `fail-attr-too-many.ifc`: an entity instance given 7 or
//      9 raw STEP arguments where its schema declares exactly 8 (`IfcPerson`) --
//      confirmed empirically (throwaway probe against the built addon) that this
//      port's parser silently pads the missing trailing argument with `$`/drops the
//      extra one entirely (`inst.toString()` round-trips to exactly 8 arguments either
//      way), and every one of those 8 values reads back as an unremarkable, valid
//      `null` -- zero violations reachable through any per-instance check this file
//      implements.
//    - `fail-expected-2-header-attr-too-few.ifc`: `FILE_NAME` given only 6 of its 7
//      arguments. `validateIfcHeader` correctly reports the missing `authorization`
//      field (1 violation, confirmed) -- real Python's expected count of 2 implies a
//      *second*, log-only violation for the same underlying malformed-SPF-syntax event,
//      unreachable here for the same reason.
//    - `fail-expected-2-selected-simple-type-empty-typed-value.ifc`: a defined-type
//      literal, `IFCREAL()`, given ZERO of its 1 expected argument. This port's
//      `assertValid` DOES correctly flag the resulting `null` wrapped-value as invalid
//      (1 violation, confirmed) -- but real Python's expected count of 2 again implies
//      a second, log-only violation for the arg-count mismatch itself (the identical
//      "too few args" condition as `fail-attr-too-few.ifc` above, just at defined-type-
//      literal granularity instead of entity granularity).
//    - `fail-expected-2-selected-simple-type-non-existant-type.ifc`: `IFCNONEXISTANTTYPE(0.1)`
//      -- not a real declared EXPRESS type in the schema at all. Confirmed empirically
//      that this port's parser marshals it as a bare, undecorated JS array (`[0.1]`),
//      losing the (fictional) type name entirely; `assertValid`'s select branch
//      correctly flags this as invalid because the value isn't an `EntityInstance` at
//      all (1 violation, confirmed) -- real Python's expected count of 2 implies a
//      second, log-only violation for the unknown-type-name condition itself.
//    - `fail-expected-2-invalid-selected-enumeration.ifc`: `IFCNULLSTYLE(.NOT_EXISTING_ENUM.)`
//      -- `IfcNullStyle` is a real schema declaration (confirmed via a direct probe:
//      an `enumeration_type`, not an entity -- `TYPE IfcNullStyle = ENUMERATION OF
//      (NULL);`), so this port's `assertValid` select branch correctly resolves it,
//      reads its wrapped enum value, and correctly flags `"NOT_EXISTING_ENUM"` as not a
//      member of `IfcNullStyle`'s own (single-item) enumeration (1 violation, confirmed
//      -- and confirmed NOT a select-membership failure: `IfcNullStyle` genuinely IS a
//      real, legal member of `IfcPresentationStyleSelect`, verified directly against
//      `getSelectMembers`) -- real Python's expected count of 2 implies a second,
//      log-only violation for the malformed enumeration literal itself.
//    - `fail-expected-3-invalid-entity.ifc`: `IFCBUILTELEMENT(...)` (a nonexistent
//      entity name, presumably a typo for `IFCBUILDINGELEMENT`) is referenced both
//      standalone (`#1`) and from a valid `IfcRelAssociatesMaterial`'s `RelatedObjects`
//      (`(#1)`). Confirmed empirically: `#1` is dropped from the parsed model entirely
//      (`file.byId(1)` throws "Instance #1 not found", and this port's own
//      `[Symbol.iterator]` -- which walks real schema declarations, never a raw id
//      range -- can never visit it either), and the dangling reference to it is
//      silently dropped from `RelatedObjects` too (marshals to an empty array). This
//      port's own aggregation-bound check on `RelatedObjects` (`SET [1:?] OF IfcRoot`)
//      correctly flags the resulting empty array as invalid (1 of the 3 expected
//      violations, confirmed) -- the other 2 (one for the unknown entity name itself,
//      one for the dangling reference) are real Python's own C++-log-only
//      diagnostics, unreachable here for the same reason.
//    - `fail-invalid-entity-in-attribute.ifc`: `IFCCARTESIANPOINT((5.,5.,nan.))` --
//      `nan.` is not a valid STEP REAL literal (no special-case handling exists
//      anywhere in `src/ifcparse`, confirmed by grep). Confirmed empirically that this
//      port's tolerant parser silently drops the malformed third list element rather
//      than erroring (`Coordinates` marshals to a plain 2-element `[5, 5]`, which
//      satisfies `IfcCartesianPoint.Coordinates`'s own `LIST [1:3]` bound perfectly
//      fine) -- zero violations reachable through any per-instance check this file
//      implements; real Python's own single expected violation is presumably the same
//      C++-log-only diagnostic for the dropped, malformed token.
//    All 9 fixtures above are marked as accepted, disclosed known-divergences (skipped
//    with a comment citing this finding) in `test/validate.orchestrator.test.ts`, not
//    silently-adjusted expected counts -- matching chunk 3's own established precedent
//    for `fail-header-attr-too-many.ifc`.
//
// 16. **A second, distinct, real test-fidelity gap family, confirmed empirically**:
//    `fail-derived-as-nil.ifc` and `fail-nil-as-derived.ifc` (byte-identical fixture
//    content, `#1=IFCSIUNIT(*,.LENGTHUNIT.,*,.METRE.)`, both real Python `fail-`
//    fixtures expecting exactly 1 violation) are both a direct, disclosed consequence
//    of `use_attribute_value_derived` being deliberately out of scope for this port
//    (`70-express-rules-plan.md`'s locked Phase EX-3 decision; also see finding 2
//    above). Confirmed via a direct probe against the built addon:
//    `IfcSIUnit.Prefix` (an ordinary, optional, FORWARD-category attribute -- NOT
//    declared DERIVE, confirmed via `EntityInstance.attributeCategory`) is given `*`
//    in this fixture, which is a schema misuse (`*` may only appear at a position the
//    schema itself declares DERIVE, e.g. `IfcSIUnit.Dimensions`, position 0). Real
//    Python (with the feature flag on) reads `Prefix` back as an
//    `attribute_value_derived` marker object -- not `None` -- so its own "not
//    optional" guard (which only fires on `None`) never fires either, and instead
//    `assert_valid` is invoked on the marker object itself, which fails Prefix's own
//    `IfcSIPrefix` enumeration-membership check (the marker object is obviously not a
//    valid enum member) and raises the single expected `ValidationError`. This port
//    has no way to construct that marker object at all (feature out of scope); reading
//    `Prefix` here returns a plain `null`, indistinguishable from an ordinary,
//    perfectly legal `$` -- and since `Prefix` is genuinely optional, a `null` value
//    is silently accepted, producing zero violations instead of the expected one. Both
//    fixtures are marked as accepted, disclosed known-divergences in
//    `test/validate.orchestrator.test.ts`.
//
// 17. **A third test-fidelity gap family, confirmed as a real fixture-level
//    manifestation of an ALREADY-disclosed gap, not a new one**: `fail-invalid-
//    selected-simple-type.ifc` (`IFCPOSITIVELENGTHMEASURE('1')` -- a string literal
//    where a real number is declared) and `fail-selected-simple-type-wrong-literal.ifc`
//    (`IFCLABEL(0.5)` -- a real-number literal where a string is declared) are both
//    direct, concrete instances of this file's own finding 2 (`simple_type.
//    declared_type()` has no N-API binding, so `assertValid`'s simple-type branch uses
//    a disclosed, permissive `string | number | boolean` fallback instead of Python's
//    exact per-EXPRESS-kind check) -- already anticipated and already pinned by
//    `test/validate.test.ts`'s own "a disclosed permissive gap accepts other scalars
//    too" test (chunk 2). Both fixtures are marked as accepted, disclosed known-
//    divergences in `test/validate.orchestrator.test.ts`, citing this finding.
//
// *** Phase EX-5 (planning/ifcopenshell-ts/70-express-rules-plan.md, "final integration +
// test-fidelity backfill"): unifies this file's own `validate(f)` (Phase EX-3) and
// `express/ruleExecutor.ts`'s `executeRules(f)` (Phase EX-4) behind one entry point,
// mirroring real Python's own integration point exactly -- `validate(f, logger,
// express_rules=False)` (real source lines 419-629) ends with (lines 625-629):
//
//     if express_rules:
//         ...
//         ifcopenshell.express.rule_executor.run(f, logger)
//
// i.e. when the flag is set, `rule_executor.run`'s own violations are folded into the
// SAME `logger`/error stream `validate()` already populated -- not a separate return
// value. `validate()`'s signature here gains an `options?: { rules?: boolean }`
// parameter (the shape `70-express-rules-plan.md`'s own Phase EX-3 section already
// locked in advance, specifically anticipating this exact moment -- "the `rules` option
// is added when Phase EX-4 lands"); when `options.rules` is true, `executeRules(f)`'s
// own `ValidationError[]` is concatenated onto the same array this function already
// builds, reproducing real Python's "one combined stream" behavior with this port's own
// already-locked structured-array shape instead of a duck-typed `logger`. Both functions
// already return `ValidationError[]` (`ruleExecutor.ts` imports and reuses this file's
// own `ValidationError` class unchanged, per that file's own header comment) -- confirmed
// directly by reading both files' full return-type signatures before writing this, no
// reconciliation needed.
//
// **Import-strategy decision (static top-level import, not lazy/dynamic)**: real
// Python's own `validate.py` does an unconditional, top-of-file `import
// ifcopenshell.express.rule_executor` (real source line 65) regardless of whether
// `express_rules` is ever passed as `True` -- i.e. real Python already always pays the
// cost of loading the compiled rule modules just by importing `validate.py` at all, the
// exact same shape a static TS import reproduces. This was weighed against the
// alternative (a dynamic `import()` inside `validate()`, gated on `options?.rules`) and
// rejected for three independent reasons, not just fidelity-to-Python: (1) a dynamic
// `import()` would make `validate()` return a `Promise`, breaking its own already-locked
// synchronous `ValidationError[]` return shape (a real, disclosed API-shape cost, not a
// style preference) -- real Python's `rule_executor.run` is itself synchronous, so a
// synchronous TS call is the actually-faithful shape, not an artifact of convenience;
// (2) this package's `src/index.ts` (its own public npm entry point) ALREADY does an
// unconditional `export * as express from "./express"` (Phase EX-1), which already
// side-effect-imports `./express/whereRules` (all ~27,000 lines across the 3 per-schema
// files, confirmed via `wc -l`, larger than this plan's own earlier ~15,000-line
// estimate) for EVERY consumer of the package's main entry, whether or not they ever
// call `validate()` or `executeRules()` at all -- so a static import here does not
// newly impose a cost on the package's primary, documented import path; it only closes
// a gap for the narrower case of a consumer deep-importing `validate.ts` directly
// (exactly what this project's own test suite already does, see below); (3) a
// synchronous top-level `import` is trivially statically analyzable (by bundlers, by a
// future browser/WASM port per `00-overview.md` SS6's own non-goal note, and by a human
// reader), where a conditional dynamic `import()` gated on a boolean option is a real,
// disclosed increase in code complexity for a codebase-wide cost this specific file does
// not meaningfully change. **A genuine correctness consequence of this choice, addressed
// directly rather than left implicit**: unlike `express/dispatch.ts`'s calc_* DERIVE
// registrations (which `entityInstance.ts` already force-loads unconditionally for
// EVERY attribute read, `.get()` needing them regardless of `validate`/`executeRules`),
// the WHERE-rule registry is otherwise lazily populated only by whichever module
// happens to import `express/whereRules` first -- `executeRules(f)` run against an
// empty, ever registered, registry would silently report zero rule violations (not an
// error) for every fixture, a wrong-but-quiet failure mode this integration must not
// introduce. This file's own new imports below therefore include a side-effect import
// of `./express/whereRules` directly (mirroring `entityInstance.ts`'s own established
// "import the specific engine export, then side-effect-import the specific
// registration submodule" pattern for `./express/rules`, rather than routing through
// the broader `./express` barrel) -- guaranteeing `validate(f, { rules: true })`
// produces real, registered-rule results regardless of whatever else the calling
// process happened to import first, including this port's own test suite's existing
// convention of importing `validate` directly from `./validate` rather than through
// `src/index.ts`.
//
// **Circular-import risk, investigated and confirmed benign**: `express/ruleExecutor.ts`
// already imports `ValidationError`/`classifyAny`/`declarationName`/`getEntityAttributes`
// from THIS file (`../validate`, Phase EX-4's own established reuse, per that file's own
// header comment) -- so this file's new `import { executeRules } from
// "./express/ruleExecutor"` closes a genuine 2-module cycle (`validate.ts` <->
// `ruleExecutor.ts`) that did not exist before this chunk. Confirmed safe, not just
// assumed: this package compiles to CommonJS (`package.json`'s `"type": "commonjs"`),
// and neither side of the cycle touches the other's imported bindings at module-
// top-level evaluation time -- every one of `ruleExecutor.ts`'s own uses of this file's
// exports is inside a function body (`typeName`/`unwrapForCheck`/`toViolation`/
// `executeRules` itself), and this file's own new use of `executeRules` is likewise
// only inside the `validate()` function body below, never at top-level. TypeScript's
// CJS output resolves a named import as a property access on the required module
// object at the POINT OF USE, not a value destructured at require-time, so by the time
// either side's function bodies actually run, both modules have finished their
// synchronous top-level evaluation and every export is fully populated -- empirically
// re-confirmed by this chunk's own full build (`tsc --noEmit`) and test run (no
// `undefined is not a function`/TDZ-style failures from either direction). ***

import { AttributeCategory, EntityInstance } from "./entityInstance";
import { executeRules } from "./express/ruleExecutor";
import "./express/whereRules";
import type { IfcFile } from "./file";
import { expand as guidExpand } from "./guid";
import {
	aggregation_type as NativeAggregationType,
	type attribute as NativeAttribute,
	declaration as NativeDeclaration,
	entity as NativeEntity,
	enumeration_type as NativeEnumerationType,
	type inverse_attribute as NativeInverseAttribute,
	named_type as NativeNamedType,
	parameter_type as NativeParameterType,
	type schema_definition as NativeSchemaDefinition,
	select_type as NativeSelectType,
	simple_type as NativeSimpleType,
	type_declaration as NativeTypeDeclaration,
} from "./native/ifcopenshell_native";
import { directSubtypesOf, entityName } from "./util/schema";

/** Python: `class ValidationError(Exception)` (real source lines 85-88). */
export class ValidationError extends Error {
	readonly attribute: string | undefined;

	constructor(message: string, attribute?: string) {
		super(message);
		this.name = "ValidationError";
		this.attribute = attribute;
	}
}

// --- attribute-type classification (see this file's header comment, finding 1) ---

/**
 * Every node shape `assert_valid`'s `attr_type` argument can be, across all real call
 * sites: the top-level `attribute.type_of_attribute()`/`aggregation_type.
 * type_of_element()` result (`parameter_type`, generic), the select-branch's recursive
 * `schema.declaration_by_name(val.is_a())` result (`declaration`, generic), or any of
 * the 7 already-downcast concrete kinds produced while unwrapping/classifying either of
 * those two.
 */
export type AttributeTypeLike =
	| NativeParameterType
	| NativeDeclaration
	| NativeSimpleType
	| NativeNamedType
	| NativeAggregationType
	| NativeTypeDeclaration
	| NativeSelectType
	| NativeEnumerationType
	| NativeEntity;

// UPDATED (Phase EX-4 chunk 1, `planning/ifcopenshell-ts/70-express-rules-plan.md`):
// `ClassifiedAttributeType`/`classifyDeclaration`/`classifyParameterType`/`classifyAny`/
// `declarationName` are now `export`ed -- `express/ruleExecutor.ts`'s own `check()` port
// (`rule_executor.py`'s `type_name`/the aggregation/select unwrap walk) needs the exact
// same "no SWIG-style dynamic downcasting, dispatch via `as_X()` probes" classification
// this file already built (finding 1, above). A `/code-review` pass on that chunk found
// its own first draft had duplicated a byte-for-byte copy of this ~70-line cascade
// locally instead of importing it -- fixed by exporting here instead, matching this
// project's own established "export narrowly once a second real consumer exists"
// precedent (`util/schema.ts`'s `entityName`/`getSchemaDefinition`, `express/rules/
// ifc2x3.ts`'s `ifcCrossProduct`) rather than the "small local duplicate" precedent,
// which is reserved for genuinely tiny (1-3 line) reinterpret-casts -- a ~70-line
// classification cascade is well past that threshold, and duplicating it risks the two
// copies silently drifting apart under a future native-layer change.
type ClassifiedAttributeType =
	| { readonly kind: "simple"; readonly node: NativeSimpleType }
	| { readonly kind: "named"; readonly node: NativeNamedType }
	| { readonly kind: "aggregation"; readonly node: NativeAggregationType }
	| { readonly kind: "typeDeclaration"; readonly node: NativeTypeDeclaration }
	| { readonly kind: "select"; readonly node: NativeSelectType }
	| { readonly kind: "enumeration"; readonly node: NativeEnumerationType }
	| { readonly kind: "entity"; readonly node: NativeEntity };

function classifyDeclaration(decl: NativeDeclaration): ClassifiedAttributeType {
	const entity = decl.as_entity();
	if (entity !== null) return { kind: "entity", node: entity };
	const typeDeclaration = decl.as_type_declaration();
	if (typeDeclaration !== null) return { kind: "typeDeclaration", node: typeDeclaration };
	const select = decl.as_select_type();
	if (select !== null) return { kind: "select", node: select };
	const enumeration = decl.as_enumeration_type();
	if (enumeration !== null) return { kind: "enumeration", node: enumeration };
	throw new Error("assert_valid: declaration is none of entity/type_declaration/select_type/enumeration_type");
}

function classifyParameterType(pt: NativeParameterType): ClassifiedAttributeType {
	const simple = pt.as_simple_type();
	if (simple !== null) return { kind: "simple", node: simple };
	const named = pt.as_named_type();
	if (named !== null) return { kind: "named", node: named };
	const aggregation = pt.as_aggregation_type();
	if (aggregation !== null) return { kind: "aggregation", node: aggregation };
	throw new Error("assert_valid: parameter_type is none of simple_type/named_type/aggregation_type");
}

function classifyAny(node: AttributeTypeLike): ClassifiedAttributeType {
	if (node instanceof NativeSimpleType) return { kind: "simple", node };
	if (node instanceof NativeNamedType) return { kind: "named", node };
	if (node instanceof NativeAggregationType) return { kind: "aggregation", node };
	if (node instanceof NativeTypeDeclaration) return { kind: "typeDeclaration", node };
	if (node instanceof NativeSelectType) return { kind: "select", node };
	if (node instanceof NativeEnumerationType) return { kind: "enumeration", node };
	if (node instanceof NativeEntity) return { kind: "entity", node };
	if (node instanceof NativeDeclaration) return classifyDeclaration(node);
	if (node instanceof NativeParameterType) return classifyParameterType(node);
	throw new Error("assert_valid: unrecognized attribute-type node");
}

/**
 * `entity`/`select_type`/`type_declaration`/`enumeration_type` have no `.name()` of
 * their own on this port's generated facade -- see this file's header comment, finding
 * 4, for the full, independently-verified justification (a generalization of
 * `util/schema.ts`'s own `entityName`).
 */
function declarationName(node: { readonly _handle: unknown }): string {
	return new NativeDeclaration(node._handle).name();
}

export { classifyAny, classifyDeclaration, classifyParameterType, declarationName };
export type { ClassifiedAttributeType };

/**
 * Python: `while isinstance(attr_type, type_wrappers): attr_type = attr_type.
 * declared_type()` (real source lines 257-265). `named_type` is always unwrapped;
 * `type_declaration` is unwrapped only when `val` is not an `entity_instance` (mirrors
 * Python's `type_wrappers = (named_type,)` vs. `(named_type, type_declaration)`).
 */
function unwrap(attrType: AttributeTypeLike, val: unknown): ClassifiedAttributeType {
	const unwrapTypeDeclaration = !(val instanceof EntityInstance);
	let classified = classifyAny(attrType);
	for (;;) {
		if (classified.kind === "named") {
			classified = classifyAny(classified.node.declared_type());
			continue;
		}
		if (unwrapTypeDeclaration && classified.kind === "typeDeclaration") {
			classified = classifyAny(classified.node.declared_type());
			continue;
		}
		return classified;
	}
}

/**
 * Single-value enumeration-membership check. Python: `val not in attr_type.
 * enumeration_items()` (real source line 304) -- ported using `lookup_enum_offset`
 * (throws iff `val` isn't a member) per this project's locked design decision, not the
 * bulk forward-list accessor (see this file's header comment, finding 8, for why that
 * accessor's own newly-discovered availability doesn't change this).
 */
function isEnumerationMember(node: NativeEnumerationType, val: unknown): boolean {
	if (typeof val !== "string") return false;
	try {
		node.lookup_enum_offset(val);
		return true;
	} catch {
		return false;
	}
}

// --- `get_select_members` (real source lines 220-247) ---

const selectMembersCache = new Map<string, Map<string, Set<string>>>();

/**
 * Python: `get_select_members(schema, ty) -> set[str]` (real source lines 223-247).
 * Recursively flattens a select type's members (nested selects, entity subtypes via
 * `util/schema.ts`'s `directSubtypesOf` -- see this file's header comment for why that
 * function, not a native `entity.subtypes()`, is reused -- type declarations,
 * enumerations) into a flat `Set` of member type names, cached per `(schema.name(),
 * ty.name())` (see this file's header comment, finding 6, for the cache's own faithfully
 * ported Python-falsiness quirk).
 */
export function getSelectMembers(schema: NativeSchemaDefinition, ty: NativeSelectType): ReadonlySet<string> {
	const schemaName = schema.name();
	const typeName = declarationName(ty);
	let bySchema = selectMembersCache.get(schemaName);
	const cached = bySchema?.get(typeName);
	// Python: `if from_cache:` -- an empty `set()` is falsy in Python and would be
	// treated as a cache miss and recomputed; JS's empty `Set` is truthy, so this is
	// reproduced explicitly (see this file's header comment, finding 6).
	if (cached && cached.size > 0) {
		return cached;
	}

	const subtypesByName = directSubtypesOf(schema);
	const result = new Set<string>();

	function inner(node: AttributeTypeLike): void {
		const classified = classifyAny(node);
		switch (classified.kind) {
			case "select":
				for (const member of classified.node.select_list()) {
					inner(member);
				}
				return;
			case "entity": {
				const name = entityName(classified.node);
				result.add(name);
				for (const subtype of subtypesByName.get(name) ?? []) {
					inner(subtype);
				}
				return;
			}
			case "typeDeclaration":
				// Python's own `@todo` note (real source line 238) questions whether
				// subtypes of a type declaration (e.g. IfcPositiveLengthMeasure ->
				// IfcLengthMeasure) should be listed too -- left as-is, matching real
				// Python's actual (not aspirational) behavior verbatim.
				result.add(declarationName(classified.node));
				return;
			case "enumeration":
				result.add(declarationName(classified.node));
				return;
			default:
				// Python: `else: pass` (real source lines 243-244) -- a select member
				// that is itself simple_type/named_type/aggregation_type never occurs in
				// a real schema's `select_list()` (always declaration-typed members),
				// ported as a faithful no-op rather than an error.
				return;
		}
	}

	inner(ty);

	if (!bySchema) {
		bySchema = new Map();
		selectMembersCache.set(schemaName, bySchema);
	}
	bySchema.set(typeName, result);
	return result;
}

/** Test-only escape hatch, matching `attributeCache.ts`'s own established convention. */
export function _clearSelectMembersCacheForTests(): void {
	selectMembersCache.clear();
}

// --- message formatting: Python's `format`/`repr`/`str` (see header comment, finding 7) ---

function pyRepr(val: unknown): string {
	if (val === null || val === undefined) return "None";
	if (typeof val === "boolean") return val ? "True" : "False";
	if (typeof val === "number") return String(val);
	if (typeof val === "string") return `'${val.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
	if (Array.isArray(val)) {
		const items = val.map((v) => pyRepr(v));
		return `(${items.join(", ")}${items.length === 1 ? "," : ""})`;
	}
	if (val instanceof EntityInstance) return val.toString();
	return String(val);
}

function pyStr(val: unknown): string {
	if (typeof val === "string") return val;
	return pyRepr(val);
}

/**
 * Python: `format(val) -> str` (real source lines 185-189). Renamed to `formatValue`
 * (see header comment, finding 7) -- behavior otherwise ported directly: a tuple of
 * `entity_instance`s gets Python's own numbered-list rendering, everything else falls
 * back to a best-effort `repr()`-alike (`pyRepr`).
 */
export function formatValue(val: unknown): string {
	if (Array.isArray(val) && val.length > 0 && val[0] instanceof EntityInstance) {
		return `[\n${(val as EntityInstance[]).map((inst, i) => `      ${i + 1}. ${inst.toString()}`).join("\n")}\n    ]`;
	}
	return pyRepr(val);
}

function describeAttrOrType(attr: NativeAttribute | undefined, attrType: AttributeTypeLike): string {
	if (attr) return attr.name();
	// Best-effort stand-in for Python's own `{attr_type}` f-string interpolation
	// (`str(attr_type)`, an opaque, address-bearing SWIG default `__repr__` that isn't
	// meaningfully portable byte-for-byte -- see header comment, finding 7).
	try {
		const classified = classifyAny(attrType);
		switch (classified.kind) {
			case "entity":
			case "typeDeclaration":
			case "select":
			case "enumeration":
				return declarationName(classified.node);
			case "simple":
				return "<simple type>";
			case "named":
				return "<named type>";
			case "aggregation":
				return "<aggregation type>";
		}
	} catch {
		return "<attribute type>";
	}
}

// --- `assert_valid` (real source lines 250-324) ---

/**
 * Python: `assert_valid(attr_type, val, schema, no_throw=False, attr=None) -> bool`
 * (real source lines 250-324). The core EXPRESS type-checking dispatcher across all 6
 * type-kind branches (simple/entity/type_declaration/select/enumeration/aggregation).
 * Matches Python's own dual-mode contract exactly: with `noThrow` true, always returns
 * a `boolean` (never throws); with `noThrow` false (the default), returns `true` on
 * success or throws a `ValidationError` -- see this file's header comment (finding 6)
 * for one faithfully-preserved exception to that contract inherited directly from real
 * Python's own aggregation-branch recursion.
 */
export function assertValid(
	attrType: AttributeTypeLike,
	val: unknown,
	schema: NativeSchemaDefinition,
	noThrow = false,
	attr?: NativeAttribute,
): boolean {
	const classified = unwrap(attrType, val);

	let invalid: boolean;
	switch (classified.kind) {
		case "simple": {
			// See header comment, finding 2: `simple_type.declared_type()` has no N-API
			// binding, so this is a disclosed, permissive fallback, not Python's exact
			// `simple_type_python_mapping` per-kind check.
			invalid = !(typeof val === "string" || typeof val === "number" || typeof val === "boolean");
			break;
		}
		case "entity": {
			invalid = !(val instanceof EntityInstance) || !val.isA(entityName(classified.node));
			break;
		}
		case "typeDeclaration": {
			// Only reached when `val` IS an `EntityInstance` -- `unwrap` above always
			// unwraps a `type_declaration` first otherwise, matching Python exactly.
			invalid = val instanceof EntityInstance;
			break;
		}
		case "select": {
			if (!(val instanceof EntityInstance)) {
				invalid = true;
			} else {
				invalid = false;
				const valueDeclaration = schema.declaration_by_name_with_name(val.isA());
				const valueClassified = classifyAny(valueDeclaration);
				if (valueClassified.kind !== "entity") {
					try {
						// Python: `val.wrappedValue` -- see header comment, finding 5.
						const wrapped = val.getByIndex(0);
						const ok = assertValid(valueClassified.node, wrapped, schema, true);
						invalid = invalid || !ok;
					} catch {
						invalid = true;
					}
				}
				invalid = invalid || !getSelectMembers(schema, classified.node).has(val.isA());
			}
			break;
		}
		case "enumeration": {
			invalid = !isEnumerationMember(classified.node, val);
			break;
		}
		case "aggregation": {
			const b1 = classified.node.bound1();
			const b2 = classified.node.bound2();
			const elementType = classified.node.type_of_element();
			invalid =
				!Array.isArray(val) ||
				val.length < b1 ||
				(b2 !== -1 && val.length > b2) ||
				// `false` (not `noThrow`) is intentional -- see header comment, finding 6:
				// Python's own recursive call never forwards `no_throw` either.
				!(val as unknown[]).every((v) => assertValid(elementType, v, schema, false, attr));
			break;
		}
		case "named":
			// Unreachable in practice: `unwrap` always fully resolves past `named_type`.
			// Mirrors Python's own defensive `else: raise NotImplementedError(...)`
			// catch-all (real source lines 313-314).
			throw new Error("assert_valid: unresolved named_type after unwrap");
	}

	if (noThrow) {
		return !invalid;
	}
	if (invalid) {
		throw new ValidationError(
			`With attribute:\n    ${describeAttrOrType(attr, attrType)}\nValue:\n    ${pyStr(val)}\nNot valid\n`,
			attr ? attr.name() : undefined,
		);
	}
	return true;
}

// --- `assert_valid_inverse` (real source lines 192-217) ---

/**
 * Python: `assert_valid_inverse(attr, val, schema) -> bool` (real source lines
 * 192-217). `val` must be the *full* inverse-attribute value as a plain array (matching
 * Python's own `tuple[entity_instance, ...]`) -- not this port's own optional
 * `settings.unpackNonAggregateInverses`-driven single-value unpacking (an orchestration
 * concern for whichever later chunk wires this into `validate()`'s own per-instance
 * loop, out of this chunk's own scope). `schema` is accepted but, matching real
 * Python's own signature exactly (it's never referenced in the real function body
 * either), unused here.
 */
export function assertValidInverse(
	attr: NativeInverseAttribute,
	val: readonly EntityInstance[],
	schema: NativeSchemaDefinition,
): boolean {
	const b1 = attr.bound1();
	const b2 = attr.bound2();
	const singleValued = b1 === -1 && b2 === -1;
	const invalid = singleValued ? val.length !== 1 : val.length < b1 || (b2 !== -1 && val.length > b2);

	if (invalid) {
		const entRef = entityName(attr.entity_reference());
		const attrRef = attr.attribute_reference().name();
		// See header comment, finding 3: `type_of_aggregation_string()` has no N-API
		// binding -- generic "AGGREGATE" placeholder keyword instead, derived only from
		// whether this inverse is an aggregation at all (never from the missing
		// accessor). The cardinality check above is fully correct regardless.
		const aggrStr = singleValued ? "" : `AGGREGATE [${b1}:${b2 === -1 ? "?" : b2}] OF `;
		const attrFormatted = `${attr.name()} : ${aggrStr}${entRef} FOR ${attrRef}`;
		throw new ValidationError(
			`With inverse:\n    ${attrFormatted}\nValue:\n    ${formatValue(val)}\nNot valid\n`,
			attr.name(),
		);
	}
	return true;
}

// --- `entity_attribute_map`/`get_entity_attributes` (real source lines 402-416) ---

const entityAttributeMap = new Map<string, Map<string, readonly [NativeEntity, readonly NativeAttribute[]]>>();

/**
 * Python: `get_entity_attributes(schema, entity) -> tuple[entity_type, tuple[attribute,
 * ...]]` (real source lines 405-416). Ported using `attributeCache.ts`'s own established
 * caching shape (a never-evicted `Map<schemaName, Map<className, ...>>`, per this
 * chunk's explicit instruction to reuse that precedent) rather than a bare
 * `Map<[string, string], ...>` the way real Python's own tuple-keyed dict reads --
 * Python's `if from_cache:` has no empty-container-falsiness trap here (a 2-tuple is
 * never empty), so, unlike `getSelectMembers` above, a plain "is present" cache check
 * is faithful (see header comment, finding 6).
 */
export function getEntityAttributes(
	schema: NativeSchemaDefinition,
	entity: string,
): readonly [NativeEntity, readonly NativeAttribute[]] {
	const schemaName = schema.name();
	let classes = entityAttributeMap.get(schemaName);
	if (!classes) {
		classes = new Map();
		entityAttributeMap.set(schemaName, classes);
	}
	const cached = classes.get(entity);
	if (cached) return cached;

	const declaration = schema.declaration_by_name_with_name(entity).as_entity();
	if (declaration === null) {
		// Python: `assert ent` (real source line 412).
		throw new Error(`get_entity_attributes: '${entity}' is not an entity declaration in schema ${schemaName}`);
	}
	const entry: readonly [NativeEntity, readonly NativeAttribute[]] = [declaration, declaration.all_attributes()];
	classes.set(entity, entry);
	return entry;
}

/** Test-only escape hatch, matching `attributeCache.ts`'s own established convention. */
export function _clearEntityAttributeMapForTests(): void {
	entityAttributeMap.clear();
}

// --- `validate_guid` (real source lines 632-651) ---

/** The full IFC-convention base64 alphabet (`guid.ts`'s own `CHARS64_IFC`, inlined here to
 * match real Python's own `allowed_characters` local rather than exporting it from
 * `guid.ts` for a single caller). */
const GUID_ALLOWED_CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";

/**
 * Python: `validate_guid(guid: str) -> Union[str, None]` (real source lines 632-651).
 * Returns `null` when `guid` is valid, otherwise a human-readable error message -- kept as
 * real Python's own single-message return shape (this check only ever has one thing to say
 * about a single guid, unlike `validateIfcHeader`/`validateIfcApplications` below, so there
 * is no multi-violation list to design here). Uses this port's own `guid.ts#expand`
 * directly, matching real Python's own `ifcopenshell.guid.expand` call -- but see this
 * file's header comment, finding 11, for a genuine, disclosed divergence: this port's
 * `expand()` (Node's `Buffer.from(_, "base64")`) never actually throws the way Python's
 * `base64.b64decode`-backed `expand()` can, so the character-membership check below runs
 * unconditionally rather than only inside the `catch`, reproducing real Python's actual
 * practical outcome despite the underlying mechanism differing.
 */
export function validateGuid(guidValue: string): string | null {
	if (guidValue.length !== 22) {
		return "Guid length should be 22 characters.";
	}
	if (!"0123".includes(guidValue[0])) {
		return "Guid first character must be either a 0, 1, 2, or 3.";
	}
	let expandFailed = false;
	try {
		guidExpand(guidValue);
	} catch {
		expandFailed = true;
	}
	const hasInvalidCharacter = [...guidValue].some((c) => !GUID_ALLOWED_CHARACTERS.includes(c));
	if (expandFailed || hasInvalidCharacter) {
		if (hasInvalidCharacter) {
			return `Guid contains invalid characters, allowed characters: '${GUID_ALLOWED_CHARACTERS}'.`;
		}
		// NOTE (ported verbatim from real source's own comment, real source line 649): are
		// there actually cases where guid won't expand, besides invalid characters?
		return "Couldn't decompress guid, it's not base64 encoded.";
	}
	return null;
}

// --- `validate_ifc_header` (real source lines 667-739; `to_string_header_entity`, lines
// 654-665, is deliberately not ported -- see this file's header comment, finding 12) ---

const HEADER_STRING_TYPE = "STRING (256)";
const HEADER_AGGREGATE_TYPE = "LIST [ 1 : ? ] OF STRING (256)";

function pushHeaderFieldViolation(
	violations: ValidationError[],
	entityLabel: string,
	name: string,
	expectedType: string,
	detail: string,
): void {
	violations.push(
		new ValidationError(
			`On ${entityLabel}:\nAttribute '${name}' has invalid type:\n    Expected: ${expectedType}\n    ${detail}`,
			name,
		),
	);
}

/**
 * A single `STRING (256)`-typed header field (Python: `validate_attribute(header_entity,
 * name, index)`, real source lines 704-714's non-aggregate branch). See this file's header
 * comment, finding 9: the native `spf_header` accessor's own exception (thrown for a `$`/
 * missing value or a value of the wrong shape) IS the check -- there is no separate
 * `isinstance(value, str)` to perform here, since a successful call already guarantees a
 * `string`.
 */
function checkHeaderStringField(
	violations: ValidationError[],
	entityLabel: string,
	name: string,
	accessor: () => string,
): void {
	try {
		accessor();
	} catch (e) {
		pushHeaderFieldViolation(violations, entityLabel, name, HEADER_STRING_TYPE, (e as Error).message);
	}
}

/**
 * A single `LIST [ 1 : ? ] OF STRING (256)`-typed header field (Python:
 * `validate_attribute(header_entity, name, index, aggregate=True)`, real source lines
 * 704-714's aggregate branch). Unlike Python, no per-element `isinstance(v, str)` loop is
 * needed (see this file's header comment, finding 9) -- but the "empty list" check is
 * still needed here, since a present-but-empty list does not throw (confirmed directly,
 * same finding).
 */
function checkHeaderStringListField(
	violations: ValidationError[],
	entityLabel: string,
	name: string,
	accessor: () => string[],
): void {
	let value: string[];
	try {
		value = accessor();
	} catch (e) {
		pushHeaderFieldViolation(violations, entityLabel, name, HEADER_AGGREGATE_TYPE, (e as Error).message);
		return;
	}
	if (value.length === 0) {
		pushHeaderFieldViolation(violations, entityLabel, name, HEADER_AGGREGATE_TYPE, "Current value is an empty list.");
	}
}

/**
 * Python: `validate_ifc_header(f, logger) -> None` (real source lines 667-739). Validates
 * `FILE_DESCRIPTION`'s `description`/`implementation_level` and `FILE_NAME`'s `name`/
 * `time_stamp`/`author`/`organization`/`preprocessor_version`/`originating_system`/
 * `authorization` -- `FILE_SCHEMA` is deliberately skipped, matching real Python's own
 * comment ("Ignore header.file_schema as file won't load to IfcOpenShell with invalid
 * file_schema."). Returns every violation found (not just the first), matching this file's
 * locked multi-violation design (see header comment, chunk 3 preface) -- real Python's own
 * `to_string_header_entity`/`annotate_inst_attr_pos` message-formatting helpers are
 * deliberately not ported (this port has no raw-SPF-text-with-caret diagnostic machinery,
 * and they're cosmetic, not load-bearing -- see header comment, finding 9/12). Reaches the
 * native header via `f.nativeFile.header()` since `IfcFile` itself has no `header()` method
 * yet (see header comment, finding 12).
 *
 * `/code-review`-found defensive fix (see header comment, finding 14): `NativeFile.header()`'s
 * own generated wrapper (`ifcopenshell_native.ts`) mirrors `schema()`'s null-handling shape
 * (an unsafe cast papering over a real, possible `null` from the underlying native call) --
 * not proven reachable by anything this port's own tests construct (even a "blank" file gets
 * a real, populated default header, `test/native/header.test.ts`'s own finding), but guarded
 * explicitly here rather than left to surface as 9 confusing raw null-dereference messages
 * (each field's own try/catch would otherwise swallow a generic `TypeError` instead of a
 * clear diagnostic).
 */
export function validateIfcHeader(f: IfcFile): ValidationError[] {
	const header = f.nativeFile.header();
	if (header === null) {
		return [new ValidationError("File has no header.")];
	}
	const violations: ValidationError[] = [];

	checkHeaderStringListField(violations, "FILE_DESCRIPTION", "description", () =>
		header.file_description_description(),
	);
	checkHeaderStringField(violations, "FILE_DESCRIPTION", "implementation_level", () =>
		header.file_description_implementation_level(),
	);

	checkHeaderStringField(violations, "FILE_NAME", "name", () => header.file_name_name());
	checkHeaderStringField(violations, "FILE_NAME", "time_stamp", () => header.file_name_time_stamp());
	checkHeaderStringListField(violations, "FILE_NAME", "author", () => header.file_name_author());
	checkHeaderStringListField(violations, "FILE_NAME", "organization", () => header.file_name_organization());
	checkHeaderStringField(violations, "FILE_NAME", "preprocessor_version", () =>
		header.file_name_preprocessor_version(),
	);
	checkHeaderStringField(violations, "FILE_NAME", "originating_system", () => header.file_name_originating_system());
	checkHeaderStringField(violations, "FILE_NAME", "authorization", () => header.file_name_authorization());

	return violations;
}

// --- `validate_ifc_applications` (real source lines 741-782) ---

/**
 * Python: `validate_ifc_applications(f, logger) -> None` (real source lines 741-782).
 * Checks `IfcApplication` uniqueness: no two instances may share the same
 * `(ApplicationFullName, Version)` pair (Rule `IfcApplication.UR2`), and no two may share
 * the same `ApplicationIdentifier` (Rule `IfcApplication.UR1`). Returns every violation
 * found (not just the first) -- matching this file's locked multi-violation design.
 *
 * Real Python's dict-based "first claimant wins" semantics are preserved exactly: once a
 * given pair/id is first recorded, every subsequent duplicate is reported against that
 * SAME original instance (not against whichever duplicate was seen most recently) --
 * mirrored here by never overwriting `usedNames`/`usedIds` once a key is first set.
 *
 * See this file's header comment, finding 13, for the disclosed design choice on the
 * "previous element" reference (embedded as STEP text in the violation's own `message`
 * rather than a new field on `ValidationError`), and for why `annotate_inst_attr_pos`'s
 * caret-position annotations are dropped (same reasoning as `validateIfcHeader` dropping
 * `to_string_header_entity`).
 */
export function validateIfcApplications(f: IfcFile): ValidationError[] {
	const violations: ValidationError[] = [];
	const usedNames = new Map<unknown, Map<unknown, EntityInstance>>();
	const usedIds = new Map<unknown, EntityInstance>();

	for (const inst of f.byType("IfcApplication")) {
		const fullName = inst.get("ApplicationFullName");
		const version = inst.get("Version");
		const appId = inst.get("ApplicationIdentifier");

		if (fullName !== null && fullName !== undefined && version !== null && version !== undefined) {
			let byVersion = usedNames.get(fullName);
			const previous = byVersion?.get(version);
			if (previous) {
				violations.push(
					new ValidationError(
						`Rule IfcApplication.UR2:\n    The combination of attributes ApplicationFullName and Version should be unique\nOn instance:\n    ${inst.toString()}\nViolated by:\n    ${previous.toString()}`,
						"ApplicationFullName",
					),
				);
			} else {
				if (!byVersion) {
					byVersion = new Map();
					usedNames.set(fullName, byVersion);
				}
				byVersion.set(version, inst);
			}
		}

		if (appId !== null && appId !== undefined) {
			const previous = usedIds.get(appId);
			if (previous) {
				violations.push(
					new ValidationError(
						`Rule IfcApplication.UR1:\n    The attribute ApplicationIdentifier should be unique\nOn instance:\n    ${inst.toString()}\nViolated by:\n    ${previous.toString()}`,
						"ApplicationIdentifier",
					),
				);
			} else {
				usedIds.set(appId, inst);
			}
		}
	}

	return violations;
}

// --- `validate` orchestrator (real source lines 419-629; base checks close Phase EX-3,
// the `options.rules` unification below closes Phase EX-5) ---

/**
 * Python: `validate(f, logger, express_rules=False) -> None` (real source lines
 * 419-629). Deliberately omits the `use_attribute_value_derived` feature-flag toggle
 * (lines 452-453, 622-623) and the raw-path/`log_internal_cpp_errors` file-opening
 * branch (lines 455-483) -- both locked out-of-scope decisions from
 * `70-express-rules-plan.md`'s Phase EX-3 section, not overlooked. Calls chunk 3's
 * `validateIfcHeader`/`validateIfcApplications` (lines 485-486) and merges their
 * results, then walks every instance in the file (`for inst in f:`, line 491) checking,
 * in order: file-wide `GlobalId` uniqueness/validity (lines 495-521), the
 * entity-not-abstract check (lines 525-531), every forward attribute by index (lines
 * 533-551), the per-forward-attribute derived/not-optional/`assertValid` checks (lines
 * 553-593), and every inverse attribute via `assertValidInverse` (lines 595-612).
 * Returns every violation found across the whole file, matching real Python's own
 * "keep going, log everything" behavior (`try/except ValidationError` around each
 * `assert_valid`/`assert_valid_inverse` call, never re-raised) -- see this file's
 * header comment, chunk 3 preface, for why this whole file returns a structured
 * violation list instead of accepting a Python-style duck-typed `logger`.
 *
 * See this file's header comment, findings 15-17, for real, disclosed test-fidelity
 * gaps found and confirmed empirically (via throwaway probes against the real built
 * addon, not assumed) while wiring up the fixture-based test suite below.
 *
 * Phase EX-5: `options.rules` corresponds to real Python's own `express_rules`
 * parameter (lines 419, 625-629) -- when true, `express/ruleExecutor.ts`'s
 * `executeRules(f)` (Phase EX-4's own WHERE-rule execution engine) runs too, and its
 * violations are folded into this same returned array, matching real Python's own
 * "same logger, one combined stream" behavior. See this file's header comment's own
 * Phase EX-5 section for the full unification writeup (both functions' matching
 * `ValidationError[]` shape, the import-strategy decision, and the circular-import
 * investigation).
 */
export function validate(f: IfcFile, options?: { rules?: boolean }): ValidationError[] {
	const violations: ValidationError[] = [];

	violations.push(...validateIfcHeader(f));
	violations.push(...validateIfcApplications(f));

	const schema = f.nativeFile.schema();
	// Python: `used_guids: dict[str, entity_instance] = dict()` (real source line 158,
	// just above the loop).
	const usedGuids = new Map<string, EntityInstance>();

	for (const inst of f) {
		// Python: `entity, attrs = get_entity_attributes(schema, inst.is_a())` (line 175)
		// -- hoisted above the GlobalId check below (real source calls this slightly
		// later, after the GlobalId block) purely so `attrs` can answer "does this
		// entity's declaration even have a GlobalId attribute at all" (see this file's
		// header comment, finding 15, for why that's the right primitive-layer question
		// to ask here) -- a disclosed, behavior-neutral reordering, not a logic change:
		// `get_entity_attributes` is a pure, cached lookup with no side effects Python's
		// own GlobalId block could possibly observe.
		const [entity, attrs] = getEntityAttributes(schema, inst.isA());

		// --- GlobalId uniqueness + validity (lines 495-521) ---
		//
		// Python: `if (guid := getattr(inst, "GlobalId", ...)) is not ...:` -- `getattr`
		// with a sentinel default distinguishes "this entity type has no GlobalId
		// attribute at all" (not every entity is an `IfcRoot` subtype) from "it has one,
		// but the value is None." This port has no dynamic `getattr`-with-default
		// equivalent, so the same question is answered directly against the schema:
		// does `attrs` (`entity.all_attributes()`, from the cached lookup above) list a
		// "GlobalId" attribute at all? (See this file's header comment, finding 15.)
		if (attrs.some((a) => a.name() === "GlobalId")) {
			let guidValue: unknown;
			try {
				guidValue = inst.get("GlobalId");
			} catch {
				// A malformed GlobalId value that fails to read at all is reported by the
				// general forward-attribute read loop below (same index, same failure) --
				// not double-reported here.
				guidValue = undefined;
			}
			if (typeof guidValue === "string") {
				const previous = usedGuids.get(guidValue);
				if (previous) {
					violations.push(
						new ValidationError(
							`On instance:\n    ${inst.toString()}\nRule IfcRoot.UR1:\n    The attribute GlobalId should be unique\nViolated by:\n    ${previous.toString()}\n`,
							"GlobalId",
						),
					);
				} else {
					const guidError = validateGuid(guidValue);
					if (guidError === null) {
						usedGuids.set(guidValue, inst);
					} else {
						violations.push(
							new ValidationError(
								`On instance:\n    ${inst.toString()}\nIfcGloballyUniqueId base64 validation:\n    The attribute GlobalId should be valid base64 encoded 128-bit number.\nViolated by:\n    ${guidError}\n`,
								"GlobalId",
							),
						);
					}
				}
			}
		}

		// --- entity-not-abstract check (lines 525-531) ---
		if (entity.is_abstract()) {
			violations.push(
				new ValidationError(`For instance:\n    ${inst.toString()}\nEntity ${entityName(entity)} is abstract`),
			);
		}

		// --- read every forward attribute by index (lines 533-551) ---
		let hasInvalidValue = false;
		const values: unknown[] = new Array(attrs.length).fill(null);
		for (let i = 0; i < attrs.length; i++) {
			try {
				values[i] = inst.getByIndex(i);
			} catch {
				violations.push(
					new ValidationError(
						`For instance:\n    ${inst.toString()}\nInvalid attribute value for ${entityName(entity)}.${attrs[i].name()}`,
						attrs[i].name(),
					),
				);
				hasInvalidValue = true;
			}
		}

		// --- per-forward-attribute checks (lines 553-593) ---
		//
		// Python zips in `entity.derived()` (a per-position, per-concrete-class boolean
		// tuple with no N-API binding) -- ported via `EntityInstance.attributeCategory`
		// (`AttributeCategory.DERIVED`), confirmed to reproduce its exact per-position
		// semantics (`70-express-rules-plan.md`'s locked Phase EX-3 finding). See this
		// file's header comment, finding 16, for why a DERIVED-category position is
		// unconditionally skipped here (never checked for "not optional," never passed
		// to `assertValid`, and -- unlike real Python -- never itself flagged as "Derived
		// in subtype" either): this port has no way to construct real Python's own
		// `attribute_value_derived` marker object (the `use_attribute_value_derived`
		// feature is locked out of scope), and both a *correct* `*` usage and an
		// *incorrect* literal-value-instead-of-`*` usage marshal identically (indeed
		// identically to plain `$`/`null`) through this port's own attribute-value
		// layer -- skipping entirely reproduces real Python's outcome for the correct-
		// usage case (by far the common one) at the cost of silently accepting the
		// incorrect-usage case, a disclosed, deliberate trade-off, not an oversight.
		if (!hasInvalidValue) {
			for (let i = 0; i < attrs.length; i++) {
				const attr = attrs[i];
				const val = values[i];
				if (inst.attributeCategory(attr.name()) === AttributeCategory.DERIVED) {
					continue;
				}

				if (val === null && !attr.optional()) {
					violations.push(
						new ValidationError(
							`For instance:\n    ${inst.toString()}\nWith attribute:\n    ${attr.name()}\nNot optional\n`,
							attr.name(),
						),
					);
				}

				if (val !== null) {
					try {
						assertValid(attr.type_of_attribute(), val, schema, false, attr);
					} catch (e) {
						if (!(e instanceof ValidationError)) throw e;
						violations.push(new ValidationError(`For instance:\n    ${inst.toString()}\n${e.message}`, e.attribute));
					}
				}
			}
		}

		// --- every inverse attribute (lines 595-612) ---
		for (const invAttr of entity.all_inverse_attributes()) {
			let val: EntityInstance[];
			try {
				val = inst.getInverseAttribute(invAttr.name());
			} catch (e) {
				violations.push(
					new ValidationError(
						`For instance:\n    ${inst.toString()}\n${(e as Error).message}`,
						`${entityName(entity)}.${invAttr.name()}`,
					),
				);
				continue;
			}
			try {
				assertValidInverse(invAttr, val, schema);
			} catch (e) {
				if (!(e instanceof ValidationError)) throw e;
				violations.push(new ValidationError(`For instance:\n    ${inst.toString()}\n${e.message}`, e.attribute));
			}
		}
	}

	// Python: `if express_rules: ... ifcopenshell.express.rule_executor.run(f, logger)`
	// (real source lines 625-629) -- see this file's header comment's own Phase EX-5
	// section for the full unification writeup.
	if (options?.rules) {
		violations.push(...executeRules(f));
	}

	return violations;
}
