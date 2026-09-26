# TODOS

Deferred items surfaced during review, not yet scheduled into an active plan. Each entry captures
enough context that someone picking it up later understands the motivation and starting point.

## IfcOpenShell-TS

Surfaced by `/plan-eng-review` on `planning/ifcopenshell-ts/`, 2026-09-04, plus operational findings
from Phase 0 implementation.

### Upstream sync: ~22 real changes in real `IfcOpenShell/IfcOpenShell` since the fork point need review/porting -- scoped 2026-09-26, not yet dispatched

Real upstream is 584 commits ahead of this fork's fork-point (`2c1d445d5`); this fork is 263 ahead.
Full investigation and proposed 4-chunk breakdown in
`planning/ifcopenshell-ts/90-upstream-sync-plan.md`. Short version: of the 100 upstream commits
touching `src/ifcopenshell-python`/`src/ifcparse` (the only areas relevant to this port), ~22 are
real and relevant — bug fixes to verify (`reassignClass`, `unassignRepresentation`,
`util/unit.ts`'s `getPropertyUnit`), real new features not yet ported (`editPset`/`editQto`
per-property Unit-override support, `IfcDerivedUnit` support in `util.unit`, a new top-level string
decode/encode API), a substantial `api.alignment` stationing-behavior rework (6 already-shipped
files + 1 new file), and a selector-grammar relaxation (unquoted decimals in comparisons). The rest
(tooling noise, the `ifcparse` tokenizer rewrite, SWIG/SQL/RocksDB-backend-specific, geometry-kernel-
adjacent) were checked and confirmed not relevant. Also found: a full history rebase onto upstream's
current tip hit a real, non-mechanical conflict at commit 11/263 (a fork-side ASan fix colliding
with upstream's now-complete tokenizer rewrite) — deliberately not resolved yet, revisit once the
chunks above land and the diffs are better understood.

### CI: cache the C++ core build instead of rebuilding it on every push

**What:** `ci-ifcopenshell-ts.yml`'s `build-and-test` job reconfigures and rebuilds the entire
`IfcOpenShell` C++ core (`IfcParse`) from scratch on every push that touches `src/ifcopenshell-ts/**`
(which is nearly all future work in this project per `20-roadmap.md` Phases 3-10) — even though the
C++ source itself hasn't changed. Two specific gaps: (1) Windows has zero build-output caching at
all — `ccache` is explicitly skipped there (`if: matrix.os != 'windows'`), and there's no vcpkg
binary cache, so Boost gets compiled from source via vcpkg on every single Windows run, which is
the slow leg observed during Phase 0's CI bring-up; (2) even on Linux/macOS, where `ccache` is wired
and does speed up recompilation of unchanged source, the configure+build+install step still runs
every time — ccache makes it fast, not skipped.

**Why:** CI turnaround time compounds across every future PR in this project. The bigger fix (below)
eliminates the entire C++ build step on cache hits, on all 6 matrix legs, for the (large) majority
of PRs that only touch TS code — not just a Windows-specific speedup.

**Fix, two complementary layers:**
1. vcpkg binary caching on Windows (GitHub's built-in `x-gha` binary cache source) — avoids
   recompiling Boost from source when the vcpkg manifest/triplet is unchanged.
2. Bigger win: cache the *installed* `IfcOpenShell` C++ prefix itself (`$INSTALL_PREFIX`), keyed on
   a hash of `src/ifcparse/**` + `src/plugin/**` + `cmake/**` + matrix os/arch. On a cache hit, skip
   the "Configure and install IfcOpenShell core" step entirely and restore the prefix directly —
   this is the change that actually removes the C++ build from the critical path of ordinary TS-only
   PRs, rather than just making it faster.

**Pros:** Meaningfully faster CI for the overwhelming majority of this project's remaining PRs;
removes the single biggest source of CI wall-clock time (the Windows Boost compile took the longest
leg in Phase 0's CI run by a wide margin).

**Cons:** Real but bounded implementation work — cache-key correctness (must actually invalidate
when `ifcparse` changes) needs care to avoid silently testing against a stale C++ core.

**Context:** Observed during Phase 0's CI bring-up (2026-09-04) — the Windows legs took ~35+ minutes
compiling Boost from source while Linux/macOS finished in a fraction of that time via warm ccache.

**Depends on / blocked by:** None — can be picked up as a standalone infra PR any time after Phase 0
lands. Not urgent enough to block Phase 0, but high-value enough not to defer indefinitely, given
how many future PRs it affects.

---

### CI: duplicate workflow runs from push + pull_request triggers

**What:** `ci-ifcopenshell-ts.yml` triggers on both `push` (path-filtered) and `pull_request`
(unfiltered) — for a branch with an open PR, every push fires two independent full-matrix CI runs
for the same commit, doubling CI cost for no added signal.

**Why:** Wasted CI minutes/cost with zero benefit — the `pull_request` trigger alone is sufficient
for a branch that always has a PR open (per this project's "agents must create PRs" workflow rule).

**Fix:** Drop the `push` trigger entirely (rely on `pull_request` only), or scope `push` to just the
default/main branch pattern if post-merge builds are wanted independently of PR builds.

**Context:** Observed during Phase 0's CI bring-up (2026-09-04) — confirmed via the GitHub Checks
API showing two separate `workflow_run` IDs covering the same commit SHA.

**Depends on / blocked by:** None — trivial, standalone fix. Bundle with the caching fix above,
since both touch the same workflow file.

---

### Phase 0 smoke-test addon: throwaway or foundation?

**What:** Clarify whether Phase 0's smoke-test native-addon binding (`20-roadmap.md` Phase 0,
built with `node-addon-api`) is meant to be discarded once Phase 1's wrappergen-vs-hand-written
spike (`10-architecture.md` §3) picks a direction, or is meant to survive as the foundation either
way.

**Why:** As currently written this is ambiguous. Ambiguity here risks either wasted Phase 0 work
(if the spike picks the generated path and the hand-written smoke test is discarded) or an
accidental premature commitment to hand-written glue before the spike has run.

**Pros:** Cheap to clarify — a one-line decision. Prevents wasted early-phase work.

**Cons:** Minor; doesn't block anything else in the plan regardless of how it's resolved.

**Context:** Phase 0 exists specifically to de-risk the build/CI pipeline before real porting work
starts — it doesn't need to anticipate Phase 1's binding-technology decision, but should be
explicit about not anticipating it.

**Depends on / blocked by:** None. Should be resolved before Phase 0 execution begins.

---

### ESM vs CJS packaging for the native addon — RESOLVED 2026-09-04

**Resolved by the orchestrating session ahead of Phase 0 dispatch**, to avoid blocking the first
implementation chunk on a mechanical, well-precedented decision: dual-format via `package.json`
`exports` map — CJS-first internally (native `.node` addon loading is most naturally `require()`-based)
with a thin ESM wrapper re-exporting the same surface. Standard pattern for native-addon npm
packages. Revisit only if Phase 0 implementation surfaces a concrete reason this doesn't work.

<details><summary>Original TODO text</summary>

### ESM vs CJS packaging for the native addon

**What:** Decide whether the published `ifcopenshell` npm package ships as ESM, CJS, or dual-format
(a `package.json` `exports` map with both), and how that interacts with loading a native `.node`
addon — native addons are conventionally loaded via `require()`-style resolution, which has known
friction with pure-ESM packages (the "dual package hazard").

**Why:** Real day-one developer-experience friction. Every consumer's first `npm install && import`
depends on this working correctly regardless of which module system their project uses.

**Pros:** Affects every consumer immediately; getting it right once avoids a stream of "doesn't
work with ESM" / "doesn't work with require" issues.

**Cons:** Well-trodden problem with known solutions in the Node ecosystem — not novel risk, just an
undecided planning gap.

**Context:** `50-repo-and-tooling.md` covers lint/test/versioning/publishing in detail but never
mentions module format. Native-addon-specific ESM/CJS interop patterns are established practice
(e.g. `createRequire` shims, conditional exports) — this is a decision to make, not new territory
to invent.

**Depends on / blocked by:** Should be decided by Phase 0, since it shapes the `package.json`/
package-skeleton work done there.

</details>

---

### Phase 0 smoke-test addon: throwaway or foundation? — RESOLVED 2026-09-04

**Resolved by the orchestrating session ahead of Phase 0 dispatch**: the Phase 0 smoke-test binding
is explicitly throwaway/minimal — hand-written `node-addon-api` glue just sufficient to prove the
build+CI pipeline works (open a file, read schema name, close it), regardless of what Phase 1's
`wrappergen`-vs-hand-written spike concludes. Phase 1 replaces/extends this binding either way (even
the generated path produces different, more complete glue), so there's no risk of wasted-vs-wrong
investment either direction — keep Phase 0's addon code minimal on purpose.

---

### LGPL static-linking-through-addon compliance question

**What:** Confirm whether statically linking the LGPL-3.0-or-later C++ core (`src/ifcparse`,
`src/ifcgeom`, etc.) into a native Node addon — versus dynamic linking — preserves LGPL compliance,
and what obligations (if any) that places on npm consumers who receive only the compiled binary
(e.g. re-linking rights, source-availability requirements).

**Why:** This is a legal/compliance question, not an engineering one. LGPL's linking provisions
were written with dynamic linking primarily in mind; native Node addons are commonly built as
statically-linked binaries for distribution simplicity, which is exactly the scenario LGPL
compliance questions get raised about.

**Pros:** Resolving this before the first public release avoids a compliance problem discovered
after publication, when it's much harder to unwind.

**Cons:** Needs actual legal/licensing input — an engineering review (this one) is not the right
venue to resolve it unilaterally, only to flag it.

**Context:** `50-repo-and-tooling.md` §1 states the license is LGPL-3.0-or-later (mandatory per
`AGENTS.md`) but doesn't address linking mode. `ifcopenshell-python` already ships compiled
binaries under the same license today (worth checking how that precedent handles this question, if
at all, before assuming it's already settled).

**Depends on / blocked by:** Should be resolved before Phase 0's first public prebuilt-binary
publish; does not block earlier planning or Phase 0/1 engineering work.

---

### Phase 1 primitive binding: real, disclosed gaps left for follow-up

**What:** The Phase 1 primitive-binding PR (`file`/`entity_instance` primitives + full
schema-introspection class set, generated via `src/wrappergen/napi_binding.py`) intentionally ships
a smaller-but-complete slice rather than force every listed primitive in at lower quality. Specific,
disclosed gaps:

1. **Static-method discovery is entirely missing from `wrappergen`, still true as a *generator*
   limitation** -- `clang_frontend.py`'s `_discover_methods` still skips every `is_static_method()`
   cursor unconditionally; a real `kind="static_method"` `CallableModel` (emitted like
   `"free_function"` but with no leading `handle` self-argument) is still not implemented. **However,
   the two concrete blockers this bullet named are resolved**, via the free-function injection
   technique (not the generator fix above): the Phase 2 `IfcFile`/`EntityInstance` PR added
   `ifcopenshell::wrappergen::traverse`/`traverse_breadth_first` thin pass-throughs in
   `attribute_value_shim.h`/`.cpp`, injected in `napi_binding.py`'s
   `_inject_entity_instance_primitives` exactly like `get_all_attribute_values` already was --
   `IfcFile.traverse()`/`.getInverse()` (`file.ts`) now use the real native implementation, not a
   pure-TS attribute-walk reimplementation. `ifcopenshell::logger::root()` is still unaddressed (no
   concrete Phase 2 need for it yet).
2. **Several `file`-level primitives only exist as SWIG `%extend` glue, not real C++ methods, and
   are not yet shimmed:** ~~`file_pointer()`~~ **(resolved by the Phase 2 `IfcFile`/`EntityInstance`
   PR -- `file_shim.h`/`.cpp`'s `file_pointer()`, returned as a decimal string rather than a native
   integer since wrappergen's generic `"integer"` adapter marshals through a plain 32-bit C `int`
   end-to-end, which would silently truncate a real 64-bit pointer value; used by `file.ts`'s
   `IfcFile` registry, matching Python's `file_mixin.post_init`/`registry` pattern)**,
   `to_string()`/`from_string()` (whole-file SPF serialization -- Phase 2 sidesteps `from_string` by
   using the existing buffer-based `file` constructor instead, see `template.ts`),
   `entity_names()` (Phase 2's `IfcFile[Symbol.iterator]` sidesteps this via a schema-driven
   per-declaration `instances_by_type_excl_subtypes` scan instead, see `file.ts`'s own doc comment),
   `schema_identifier()` (Phase 2 found `schema_definition.name()` already returns this exact string
   for every currently-registered schema, e.g. `"IFC4X3_ADD2"` -- no primitive gap after all),
   `storage_mode()` (still unaddressed; RocksDB-related, out of Phase 2's scope). Same pattern as the
   entity_instance primitives this PR *did* add (`attribute_value_shim.h`/`.cpp`'s
   `get_argument_index`/`attribute_name`/`attribute_type`/`get_attribute_category`/`is_a`) —
   bounded, one-function-at-a-time follow-up work, not a design gap. (`_write(fn)` — as
   `write(path)` — was picked up and shimmed by the async-primitives PR, `file_shim.h`/`.cpp`.)
3. **`get_attribute_names()`/`get_inverse_attribute_names()` bulk fetch not implemented** (would need
   a third adapter kind, "sequence of scalar," alongside this PR's new `sequence_of_variant:`
   adapter — the *capability* to enumerate attribute names one at a time already exists via
   `entity.attribute_count()` + `attribute.name()`, just not as one bulk call).
4. **TS facade doesn't support C++ default-argument parameters** (unlike the existing Python facade,
   which already does via `default_python_value`) — a class constructor whose shortest usable arity
   omits an optional trailing parameter (e.g. `ifcopenshell::file`'s trailing `logger&`, which has no
   way to be constructed via the primitive layer at all, since `logger` has a deleted copy/move
   constructor) is only exposed as a raw flat native function
   (`native.file_new()`), not as a class-level convenience method. Concrete fix: mirror
   `_python_default_value` for TS syntax and emit one method per arity (or a single method with
   real TS default parameters), same technique the Python facade already uses.
5. **Recursion-depth guard missing** in the new recursive variant<->JS/C-ABI conversion helpers
   (`emit.py`'s `_emit_variant_helper_functions`/`_emit_napi_variant_helpers`) — a maliciously deep
   nested JS array passed into `set_attribute_value` could exhaust the call stack. Not a concern for
   real EXPRESS schema usage (aggregates never nest past 2 levels), but worth a depth cap if this
   primitive layer is ever exposed to less-trusted input than "generated Phase 2 code."

**Why:** Each is real, understood, and bounded — the kind of thing worth landing as its own small,
reviewable PR rather than bundling into an already-large primitive-binding PR. None blocks Phase 1's
actual exit criterion (create an `IfcWall`, set/get every attribute-type category once, read it back
via schema introspection — verified end-to-end, including the previously-missing BINARY and
AGGREGATE (1- and 2-level nested) dispatch cases).

**Context:** See the Phase 1 PR description and `planning/ifcopenshell-ts/research/07-fresh-wrapper-per-access.md`
for the full writeup, including the empirically-verified answer to the "fresh wrapper per access"
question (confirmed: fresh JS wrapper per accessor call, not stable per-pointer identity — Phase 2's
Proxy design needs the identity-keyed registry it was written anticipating it might not need).

**Depends on / blocked by:** None block each other; pick up independently as needed.

---

### Async primitive variants: disclosed scope cuts

**What:** The async-primitives PR (`napi_create_async_work`-based siblings of file open/parse,
`get_all_attribute_values`, and `write`, per `10-architecture.md`'s "Async story") intentionally
narrows scope in two ways:

1. **File open only gets an async sibling for its *minimal*-arity sync entry point**
   (`file_new_with_path`/`file_new_with_data_data_size` — just `path`, or `data`+`data_size`), not
   the fuller-arity overloads that also take an explicit `filetype`/`readonly`/`logger`. This is the
   same disclosed, bounded scope gap #4 above already describes for the *sync* facade (only the
   maximal-arity overload of each C++ constructor family gets a class-level TS convenience method;
   the async siblings piggyback on the one arity that already has no such gap either way, the
   minimal one). Extending async file-open to the fuller-arity overloads is the same bounded
   follow-up as gap #4, not a new one.
2. **The N-API async emitter (`emit.py`'s `_emit_napi_async_extension`/`_emit_async_facade_members`)
   only handles the parameter/return adapter shapes the three hand-picked async targets actually
   use** (parameters: `string`, `integer`, a `buffer`+its `integer` length; returns: `void`, a
   `handle`, `sequence_of_variant`) — it raises rather than silently mis-emitting for anything else
   (a `handle`- or `variant`-typed *parameter*, an `enum` return, etc.). `model.async_variants` is a
   short, explicit, hand-picked list (not "every callable gets an async twin"), so this has not been
   a real limitation yet — flagged here so whoever adds the next async variant knows to extend this
   function rather than assume it's fully generic.

**Why:** Both are real, understood, and match the scope-discipline precedent set by the prior two
Phase 1 PRs (ship a smaller, complete, well-tested slice; disclose the rest rather than force it in).
Neither blocks this PR's own correctness — both are documented, deliberate omissions, not bugs.

**Context:** Verified locally (this sandbox has no `cmake`/full C++ toolchain for the addon's real
CMake target): `ifcopenshell_native_c_api.cpp`/`.h` and `ifcopenshell_native.cpp` both pass a full
`clang++ -fsyntax-only` check against the *real* `src/ifcparse` headers (plus real Boost 1.86
headers and real `node_api.h`) — this caught and fixed one genuine bug during development (the
generated C-ABI wrapper structs, e.g. `ifcopenshell_file_t`, are only forward-declared in the header
wrappergen emits; their full definition lives only in the separately-compiled implementation file,
so an async "self" argument can't be deep-copied by value the way an earlier draft of this PR tried
— fixed by pinning the original JS wrapper alive with a `napi_ref` instead and using its raw pointer
directly, since a full CMake build wasn't available to catch this at native-addon build time).
Beyond static checking, the full C++ core (`ifcparse`, `plugin`, the shims, the generated C API) was
compiled and linked into both a standalone executable and a real loadable `.node` addon via manual
`clang++` invocations (bypassing the missing `cmake`), and exercised end-to-end under the locally
available Node 20.12.2: `write()`/`write_async()` round-tripped a real `IfcWall` through SPF text,
`open_path_async()`/`open_buffer_async()` reopened it, `get_all_attribute_values_async()` matched
its sync counterpart, the rejection path produced a real JS `Error`, a `setImmediate` scheduled
right after an async write ran and completed *before* the write's promise resolved (confirming the
event loop is not blocked during the call — the entire point of this PR), and repeated
`--expose-gc`-forced GC passes while a write/attribute-fetch was in flight did not crash or corrupt
memory (confirming the `napi_ref`-pinning fix above actually works). The real CMake-driven,
CI-built addon (all 6 OS×arch legs) still needs to confirm this compiles/links/runs identically
under the project's actual build system and every target compiler (MSVC in particular, given this
exact code area's history of clang/MSVC divergences per the prior two Phase 1 PRs).

**Depends on / blocked by:** None.

### Native memory accounting: disclosed approximations and scope cuts

**What:** The memory-accounting PR (`napi_adjust_external_memory` on every native allocation, plus
`file.dispose()`/`[Symbol.dispose]`, per `10-architecture.md`'s "Native object lifetime" section)
intentionally narrows scope in a few documented ways:

1. **`ifcopenshell::file`'s 1 MiB external-memory size hint (`napi_binding.py`'s
   `class_native_size_hints`) is a deliberately coarse, fixed approximation, not derived from any
   particular opened file's real size.** A parsed IFC model can range from empty to hundreds of MB;
   nothing in the C++ API exposes a byte-accurate "how much memory does this model use" query for
   the generator to call at wrap time. V8's own docs describe `napi_adjust_external_memory` as a
   GC-pressure hint, not a precise-accounting requirement, so this is treated as good enough —
   flagged here in case a future chunk wants a closer approximation (e.g. entity count × a
   per-entity estimate).
2. **`dispose()`'s external-memory decrement can run before the underlying native memory is
   actually freed, when other handles still hold a share of it.** `express::base`/`typed_entity_instance`
   handles derived from a `file` hold their own `std::shared_ptr<file>` copy (`class_owner_types`) to
   keep the file alive independent of the `file` wrapper's own lifetime. `file.dispose()` only resets
   *that* wrapper's own shared_ptr and decrements *that* wrapper's 1 MiB hint immediately (the whole
   point of "deterministic early release") — if live entity handles from the same file still hold
   their own reference, the real parsed-model memory isn't actually freed until those are gone too,
   even though V8's counter already went down. This is a known, disclosed imprecision of the hint,
   not a memory-safety bug (the C++ object itself is correctly kept alive by the remaining
   references) — same "hint, not precise accounting" rationale as point 1.
3. **A real concurrency bug found by self-review during this PR, not by the initial implementation,
   and fixed before shipping:** `dispose()`'s `handle->value.reset()` runs on the JS main thread,
   while an in-flight async op on the same `file` (currently only `write_async`, per the async PR)
   dereferences that exact same `shared_ptr` instance from a libuv worker thread inside its
   `_execute` callback — concurrent read+write of one non-thread-safe `shared_ptr` instance is a
   real data race (distinct from the *different-instances-same-object* case `shared_ptr` **is** safe
   for). Fixed with a small `async_refcount` counter on the C-ABI wrapper struct, incremented on the
   main thread immediately before an async op referencing a disposable handle is queued and
   decremented on the main thread once its worker-thread portion has fully returned; `dispose()`
   refuses (throws a catchable error) while the count is nonzero. Both increments/decrements are
   main-thread-only by construction (JS's single-threaded event loop), so `async_refcount` itself has
   no race despite guarding against one. Covered by
   `src/ifcopenshell-ts/test/native/memory.test.ts`'s "dispose() refuses to run while an async op ...
   is in flight" test.
4. **ASAN/UBSan CI and fuzz testing remain out of this PR's scope**, per `20-roadmap.md`'s Phase 1
   exit criterion explicitly naming them as a separate, later chunk — not narrowed further by this
   PR, just not newly in scope either.

**Why:** All four are real, understood, and match the scope-discipline precedent set by the prior
three Phase 1 PRs. None blocks this PR's own correctness — all are documented, deliberate choices
(or, for #3, a bug found and fixed within this same PR, not shipped and deferred).

**Context:** Verified locally (this sandbox has no `cmake`/full C++ toolchain for the addon's real
CMake target, same constraint as the prior two Phase 1 PRs): the full C++ core (`ifcparse`, `plugin`,
the shims, the generated C API) was compiled and linked into a real loadable `.node` addon via manual
`clang++` invocations (bypassing the missing `cmake`), rebuilt clean-room from scratch as a final
check, and exercised end-to-end under the locally available Node 20.12.2 — the full existing Phase 1
primitive-layer test suite (9 tests) plus 6 new tests in `test/native/memory.test.ts` covering:
`dispose()` releasing a `file` early and a second `dispose()`/any other method call throwing cleanly
afterward instead of crashing; `[Symbol.dispose]` delegating to `dispose()`; the async/dispose race
guard (point 3 above); and two `--expose-gc`/`global.gc()`-forced GC-pressure tests (200
created-and-dropped `file` handles observing external memory return to baseline rather than staying
pinned near 200 MiB, and 10 rounds of 50 handles each with half explicitly disposed and half left for
the finalizer) neither crashing nor corrupting memory. The real CMake-driven, CI-built addon (all 6
OS×arch legs) still needs to confirm this compiles/links/runs identically under the project's actual
build system and every target compiler (MSVC in particular, given this code area's history of
clang/MSVC divergences per the prior two Phase 1 PRs).

**Depends on / blocked by:** None.

---

### ASAN/UBSan CI + fuzz testing: disclosed scope cuts and local-verification gaps

**What:** The ASAN/UBSan CI job (`asan-ubsan`) and the libFuzzer target + `fuzz` CI job — Phase 1's
final exit-criterion items — intentionally narrow scope in a few documented ways:

1. **Both new jobs are scoped to Linux x64 only**, not the 6-way OS×arch matrix `build-and-test`
   uses. Sanitizers are best-supported and most CI-proven on Linux/glibc; this PR's own local
   development sandbox (macOS 26.5.1, Apple clang 16) surfaced a concrete reason macOS ASan support
   is real extra scope, not a given — see point 3 below. Extending sanitizer/fuzz coverage to
   Windows/macOS is a reasonable follow-up but not required for the roadmap's stated exit criterion
   ("the native addon test build runs under AddressSanitizer/UndefinedBehaviorSanitizer in CI" — one
   working leg satisfies this; it doesn't require every leg).
2. **The fuzz job runs for a bounded 90-second time budget per PR (`FUZZ_TIME_BUDGET_SECONDS`), not
   a fuzzing campaign.** This is a CI regression check (catches an obvious/shallow crash a change
   just introduced), not deep exploration of the parser's state space. A longer, persistent-corpus,
   scheduled fuzzing campaign (e.g. a nightly/weekly workflow that runs for hours and accumulates a
   growing corpus + crash archive across runs, closer to how OSS-Fuzz itself operates) would find
   more real bugs over time and is a worthwhile follow-up, but is a materially different piece of
   infrastructure (persistent storage for the corpus/crashes, a schedule trigger, longer runner
   budgets) than what a single-PR chunk should build unasked.
3. **ASan could not be locally verified end-to-end in this PR's own development sandbox — a genuine
   toolchain/OS incompatibility, confirmed independent of any code under test.** Apple clang 16's
   ASan runtime fails during its own process-init malloc-zone setup
   (`AddressSanitizer: CHECK failed: sanitizer_malloc_mac.inc:189 "((!asan_init_is_running)) != (0)"`)
   for a trivial, bug-free "hello world" compiled with `-fsanitize=address` on this sandbox's macOS
   26.5.1 — i.e. this is not specific to anything this PR added, ASan itself cannot run at all in
   this environment. UBSan alone (no ASan) works correctly in the same sandbox and was verified to
   catch a real, deliberately-introduced bug (signed integer overflow) with a nonzero exit and a
   correct diagnostic — confirming the *toolchain and flag wiring* aren't silently broken, just that
   ASan specifically needs a real run to verify. The addon-level "introduce a deliberate
   use-after-free, confirm the sanitizer build fails on it, then revert" verification step this PR's
   own instructions called for could therefore not be performed locally at all (no working ASan
   locally, and separately, no `cmake`/full C++ toolchain in this sandbox to build the real addon
   either way — same category of gap as every prior Phase 1 chunk's local-verification notes). This
   verification is deferred entirely to the real `asan-ubsan` CI job on Linux, which uses a
   completely different (glibc-based, actively-tested) ASan runtime — expected to not share this
   failure mode, but not yet independently confirmed as of this PR's local development.
4. **The fuzz harness (`native/fuzz/fuzz_parse.cpp`) could not be compiled or linked against the
   real C++ core locally**, for the same reason as point 3 (no `cmake`, and this sandbox's Homebrew
   has no actual Boost installation present despite `/opt/homebrew/opt/boost` existing as a stale
   path). What *was* verified locally: the harness source passes `clang++ -fsyntax-only` against the
   real, self-contained `ifcopenshell_native_c_api.h` (no transitive Boost/ifcparse dependency for
   that header alone), confirming the entry-point signatures and ownership/free calls it makes match
   the real generated C API; and this sandbox's own clang++ was confirmed to lack `-fsanitize=fuzzer`
   support (`libclang_rt.fuzzer_osx.a not found` at link time) — the CI `fuzz` job's own "Check clang
   supports -fsanitize=fuzzer" step exists specifically to catch this class of gap on the CI runner
   itself before spending time on the rest of that job, rather than assuming parity with a
   Linux/OSS-Fuzz-conventional clang install.
5. **The event-loop-liveness test (`test/native/event_loop.test.ts`) uses heuristic, CI-tuned
   timing thresholds** (`MAX_ALLOWED_TICK_GAP_MS = 250`, `WALL_COUNT = 60_000`), not something
   provably correct independent of hardware — it could not be run against real CI hardware before
   this PR opened (same no-addon-build-locally constraint as above). If it flakes on slower/loaded
   CI runners, the fix is to raise `MAX_ALLOWED_TICK_GAP_MS` and/or `WALL_COUNT` (more setup work to
   guarantee a longer, more clearly-measurable parse duration), not to remove the test — flagged here
   so whoever investigates a flake starts from that assumption rather than re-deriving it.
6. **The `asan-ubsan` job's `npm test` run has LeakSanitizer disabled (`ASAN_OPTIONS=detect_leaks=0`),
   caught by code review before this PR shipped.** An earlier draft left `detect_leaks=1` on, matching
   the reasoning applied at the time to the `fuzz` job's own standalone harness (see point 7 below for
   why that no longer holds either, for an unrelated reason found later in this same PR's own CI
   bring-up) — but for `npm test`, `LD_PRELOAD`-ing the ASan runtime intercepts `malloc` for the
   *entire* `node` process, not just the addon's `.node` file, and LeakSanitizer's exit-time check has
   no way to attribute an unreclaimed allocation to "the addon" vs. Node/V8's own long-lived
   steady-state allocations (ICU data, V8 heap/snapshot arenas, libuv buffers) that routinely aren't
   freed before process exit by design. Left on, this would likely fail on every PR for reasons
   unrelated to any native bug the job exists to catch. Memory-*corruption* detection (use-after-free,
   double-free, OOB read/write — ASan's actual purpose in this job) is unaffected; leak-shaped bugs in
   the addon's own accounting are still covered by `test/native/memory.test.ts`'s
   bounded-external-memory-growth soak test.
7. **The `fuzz` job's own standalone harness also has LeakSanitizer disabled
   (`ASAN_OPTIONS=detect_leaks=0`), for a completely different and more consequential reason than
   point 6 above: it found a real, pre-existing, systemic leak in `src/ifcparse` itself, not a false
   positive.** See the dedicated "Regular entity (`instance_data*`) lifecycle: never freed" entry
   below for the full writeup. Unlike point 6 (a genuine ASan/Node-process false-positive), this is a
   real bug this job correctly caught — deliberately deferred, not dismissed, because a correct fix
   needs a real ownership-model investigation this PR's scope doesn't cover. Memory-corruption/UB
   detection (this job's actual purpose) is unaffected and stays fully active; only leak detection is
   off, and only until that dedicated entry is picked up.

**Why:** Each is real, understood, and bounded, matching the scope-discipline precedent set by every
prior Phase 1 PR (ship a complete, well-reasoned slice; disclose the rest rather than force it in or
silently skip it). None blocks Phase 1's actual exit criterion — the CI jobs are configured
correctly per current understanding of ASan/UBSan/libFuzzer best practice (sanitizing both compile
and link stages, on both the C++ core and whatever links against it, distinct cache keys per
sanitizer configuration so a plain build never silently substitutes for an instrumented one); they
just haven't been confirmed green by a real CI run as of this PR's own local development, which is
what CI itself is for.

**Context:** See this PR's description for the full local-verification writeup, and
`.github/workflows/ci-ifcopenshell-ts.yml`'s `asan-ubsan`/`fuzz` jobs' own inline comments for the
per-job reasoning (cache-key isolation, `LD_PRELOAD`/`verify_asan_link_order=0` for the Node+ASan
combination, `-fsanitize=fuzzer-no-link` vs `-fsanitize=fuzzer` staging).

**Depends on / blocked by:** None block each other; pick up independently as needed. Extending
sanitizer/fuzz coverage to Windows/macOS and a scheduled longer-running fuzz campaign both depend on
the Linux-only versions landing and proving stable first.

---

### Regular entity (`instance_data*`) lifecycle: never freed — a real, systemic leak found by this PR's own `fuzz` job

**What:** Every regular (DATA-section, id != 0) parsed or API-created `ifcopenshell::instance_data*`
is leaked. Nothing in `src/ifcparse` ever frees one, under any code path:

1. `ifcopenshell::impl::in_memory_file_storage` (`storage.h`) has no user-declared destructor. Its
   `byid_`/`tbyid_` maps (`std::unordered_map<uint32_t, instance_data*>` in the default,
   non-`IFOPSH_SAFE_INSTANCE` build - see `express.h`'s `shared_pointer_type` typedef) and
   `read_simple_type_instances` (`std::vector<instance_data*>`) hold raw, owning pointers; the
   compiler-generated destructor destroys the containers themselves but never touches what the
   pointers point to.
2. `ifcopenshell::file::~file()` (`file.cpp:270`) is `{}` - empty. `file::storage_` is a
   `std::variant<std::monostate, in_memory_file_storage, rocks_db_file_storage>` value member, so it
   gets destroyed implicitly when `file` is destroyed, but per point 1 that destruction doesn't free
   anything either.
3. Explicit removal leaks too, not just parse-time creation: `file::remove_entity()` →
   `process_deletion_()` → `byid_.erase(entity.id())` (`parse.cpp:2797`) only erases the *map entry*
   - it never `delete`s the `instance_data*` the entry held.

Confirmed via a real LeakSanitizer report from this PR's own `fuzz` CI job (a standalone libFuzzer
target with no Node/N-API involvement, seeded from `test/fixtures/**/*.ifc`) during
`ReadAndExecuteSeedCorpora` - i.e. triggered by parsing a plain, valid seed file, not a fuzzer
mutation. The specific report was one leaked `instance_data` (185 bytes across 4 allocations: the
`instance_data` itself, its heap-allocated `in_memory_attribute_storage`/`variant_array` wrapper, and
that `variant_array`'s two internal arrays - see `variant_array.h` and `instance_data.h:532`),
reached via `in_memory_file_storage::load` (`parse.cpp:1042`) →
`instance_streamer::read_instance()` (`parse.cpp:2213`), most likely triggered by a duplicate entity
id: `read_from_stream` (`parse.cpp:2330-2336`) logs a "Overwriting instance with name #N" warning on
a duplicate id but then calls `byid_.insert({id, data})`, which silently no-ops (doesn't overwrite)
on an already-present key per `std::unordered_map::insert`'s own contract - the corpus includes
`test/fixtures/validate/*duplicated-guids*.ifc`, which fits.

**This is very likely the tip of a much bigger iceberg, not the whole bug.** LeakSanitizer under
libFuzzer aborts the entire run on the *first* detected leak (checked after each input execution) -
`ReadAndExecuteSeedCorpora` never got past whichever early corpus file first triggered this, so the
other ~190 seed files (and every entity within them) never got a chance to also report. Given points
1-3 above, there's no reason to believe the duplicate-id path is special; every successfully-parsed
DATA-section entity in every file - and every entity created via the primitive API
(`file::create_with_declaration_instance_id`, which inserts into *both* `byid_` and `tbyid_`, per
`file.cpp:376-378`) - should leak identically. Under this port's own stated threat model
(`planning/ifcopenshell-ts/20-roadmap.md`'s "(b)": a server-side process parsing many user-uploaded
`.ifc` files over its lifetime), this is a real, unbounded-growth memory issue, not a cosmetic one.

**Why deferred rather than fixed here:** A correct fix is real, non-trivial investigation into the
actual intended single-owner model across `byid_`, `tbyid_`, `byguid_` (holds `express::base` by
value - non-owning views, no cleanup needed there), `bytype_excl_` (same), and
`read_simple_type_instances` - specifically whether `byid_` and `tbyid_` can hold *the same* pointer
for API-created entities (confirmed: yes, per `file.cpp:376-378` above) while parser-loaded entities
only ever land in `byid_`. A destructor that naively walks and frees every raw-pointer-holding
container risks a real double-free on any entity present in more than one of them. This is the same
category of investigation as the `spf_header` header-entity leak fixed earlier in this PR's own
history (see the "ASAN/UBSan CI + fuzz testing" entry above and this PR's commit history), but
substantially larger in scope: that fix was 3 cleanly-scoped, single-owner pointers; this one spans
the parser's and the public API's entire entity-storage model, shared by every consumer of
`src/ifcparse` (**`ifcopenshell-python` too, via the same C++ core, not just this TS port** - every
`ifcopenshell.open()` call in Python-land hits the exact same leak). Improvising a fix here without
first mapping that ownership model risks trading a known, disclosed leak for a silent, harder-to-spot
double-free/use-after-free - exactly what happened once already in this PR when the `spf_header` leak
fix (correct in isolation) exposed a latent shallow-copy aliasing bug that only became a real
double-free/UAF once something started actually freeing memory. That was caught by this same `fuzz`
job's own ASan run; a bug of that kind in this much-larger surface would be far more likely to slip
through only-narrowly-scoped local review.

**What's already in place for whoever picks this up:** the `fuzz` CI job (Linux x64,
`.github/workflows/ci-ifcopenshell-ts.yml`) is a ready-made regression-detection asset for this exact
class of bug - once a real fix lands, flip `ASAN_OPTIONS=detect_leaks=0` back to `detect_leaks=1` in
that job (see point 7 of the "ASAN/UBSan CI + fuzz testing" entry above) and let it run; a genuine
fix will show a clean pass, and a wrong/partial one will show exactly which allocation is still
unowned or double-freed, with a full stack trace, the same way it did throughout this PR's own
history.

**Context:** Found and diagnosed entirely via this PR's own `fuzz` job (see the PR's own CI history/
diagnostic comments for the full LeakSanitizer stack traces). Not locally reproducible/verifiable
beyond static reading, for the same sandbox reasons (`no cmake`, no real Boost install) documented
throughout this PR's other entries.

**Depends on / blocked by:** None block other work landing. Should be picked up as a dedicated,
scoped piece of work (likely warranting its own design/plan review given the shared-core blast
radius and the double-free risk of an incomplete fix) rather than folded into an unrelated PR.

---

### CI: `SCHEMA_VERSIONS=4`-only means IFC2X3/IFC4X3-parameterized tests are silently skipped, not run -- RESOLVED 2026-09-22

**Resolved:** `ci-ifcopenshell-ts.yml` was widened to `-DSCHEMA_VERSIONS="2x3;4;4x3_add2"` (Phase EX-2
chunk 1's own PR, #170), matching this entry's own proposed fix exactly. This immediately surfaced
9 pre-existing test files' worth of real IFC2X3/IFC4X3 failures that had been silently skipped by CI
for this project's entire history (never previously run there, only ever run against a manually-
built multi-schema addon) -- exactly the risk this entry's own "Why this matters" section predicted.
A dedicated reconciliation chunk (same PR) fixed all of them: `test/bootstrap.ts`'s
`useOwnerSettingsFixture` (a faithful port of real Python's `test.bootstrap.IFC2X3` fixture's own
lazy-create `ownerSettings.getUser`/`.getApplication` override, previously never replicated in this
port at all) resolved the owner-history-fixture-gap category (`appendAsset.test.ts`/
`removeProduct.test.ts`); a genuine, small, pre-existing port bug in `regenerateWallRepresentation
.ts`'s `getLayers` (a raw `.get("Priority")` instead of the existing `attrOrNull` helper, unlike real
Python's own `getattr(l, "Priority", 0)`) was fixed; several tests picking schema-incompatible fixture
values (`IfcMaterial.Category`/`IfcCurrencyEnum` members not present on IFC2X3, `IfcMaterialLayer
.Priority` not present on IFC2X3) were corrected to use cross-schema-valid values or excluded from
IFC2X3 parametrization; and a couple of tests that hit a DIFFERENT, already-tracked, unrelated
primitive-layer blocker (this file's own EXPRESS-DERIVE/standalone-typed-value gaps) for a specific
schema were excluded from that one schema's parametrization instead, matching this file's own
established `test.skipIf(schema === ...)` precedent. Full suite: 6357 passed / 17 skipped (3 new,
intentional skips) / 0 unexplained failures (one unrelated, pre-existing, load-sensitive
`test/native/event_loop.test.ts` timing flake, confirmed to pass in isolation, untouched by this
chunk) -- see that PR's own commit for the itemized file-by-file breakdown.

<details><summary>Original TODO text</summary>

**What:** `ci-ifcopenshell-ts.yml` builds the C++ core with `-DSCHEMA_VERSIONS=4` (IFC4 only, a
deliberate Phase 0-era speed choice). Every test suite in `src/ifcopenshell-ts/test/` that's
version-parameterized via `test/bootstrap.ts`'s `AVAILABLE_SCHEMAS` (filtered from `ALL_SCHEMAS` at
collection time by actually trying to load each schema and dropping ones the addon doesn't have,
see `bootstrap.ts`'s own header comment) silently drops its IFC2X3/IFC4X3 cases in CI — they don't
fail, they don't show up as skipped in an obvious way either, they simply never execute there. Only
IFC4 gets real CI coverage today for any test written this way.

**Why this matters, concretely:** this is not a hypothetical — it's what happened in
`util/element.test.ts` (Phase 3, chunk 1, this PR's own predecessor commit): two tests hardcoded
`createTestFile("IFC2X3")` directly instead of going through `AVAILABLE_SCHEMAS`, and CI's `SCHEMA_
VERSIONS=4` build made this fail loudly with "No schema loaded" (a real, correctly-caught bug) —
but had those same two tests instead gone through the *correct* `AVAILABLE_SCHEMAS`-filtered
pattern from the start (as they now do), the exact same IFC2X3 behavior would have been silently
skipped in CI without any signal at all, passing locally (author's own manually-built addon
happened to include all three schemas) and in CI (nothing to fail — just nothing to run) alike. The
"correct" fix for one bug (respect `AVAILABLE_SCHEMAS`) is also, structurally, what makes the
broader coverage gap invisible rather than loud. Every future chunk's IFC2X3/IFC4X3-parameterized
tests inherit this same silent gap by construction, not by mistake per-chunk.

**Fix:** widen `SCHEMA_VERSIONS` in `ci-ifcopenshell-ts.yml` to build all three schema versions
(IFC2X3, IFC4, IFC4X3) into the C++ core, matching the exact schema-name strings/list syntax
`cmake/CMakeLists.txt`'s own default (`set(SCHEMA_VERSIONS "2x3" "4" "4x3_add2")`) already expects.
**User-approved** (via this project's orchestrating session, 2026-09-09) as the correct direction —
deliberately *not* done as part of this PR, since it isn't needed to fix this PR's own CI failure
(the `AVAILABLE_SCHEMAS` fix above is sufficient and properly scoped to this chunk) and is a
separate, real cost (slower core build on every future PR, plus likely a C++-core build-cache miss
on the first post-change run, since the cache key is keyed in part on the workflow file's own
content hash) that deserves its own explicit, standalone change rather than being folded into an
unrelated chunk's fix-up commit. Also worth doing alongside: the PR diagnostic-comment mechanism
currently only tails `build-native.log` on Unix legs (unlike the Windows-specific log-capture fix
from an earlier chunk), so a future CI failure on Unix under the widened schema set may still need
the GitHub Checks API / check-run annotations to diagnose rather than the PR comment alone — worth
closing that gap in the same pass.

**Context:** Surfaced during Phase 3 chunk 1 (`util.element` psets/qto/type/material/style query
functions) CI bring-up, 2026-09-09 — see that PR's own commit history for the concrete repro
(two IFC2X3 tests written against a literal schema string instead of `AVAILABLE_SCHEMAS`, caught
by CI's real `SCHEMA_VERSIONS=4` build failing loudly rather than silently skipping).

**Depends on / blocked by:** None block other work landing. Should be picked up whenever a future
chunk actually needs real IFC2X3/IFC4X3 CI coverage (not just skip-safe fallback behavior) — at that
point, silent skipping stops being an acceptable substitute for real coverage.

</details>

---

### `aggregation_type::type_of_aggregation()` never bound as a primitive — blocks true SET/LIST/BAG detection

**What:** The real C++ `aggregation_type` class (`src/ifcparse/schema.h`) has a
`type_of_aggregation()` accessor returning the `array_type`/`bag_type`/`list_type`/`set_type` enum
(and Python's SWIG binding additionally exposes a `type_of_aggregation_string()` convenience
wrapper, `src/ifcwrap/IfcParseWrapper.i` line ~1042) — but the N-API primitive layer's
`aggregation_type` class (`src/wrappergen/generated_napi/ifcopenshell_native.ts`) only exposes
`bound1()`/`bound2()`/`type_of_element()`/`as_aggregation_type()`. There is currently no way to
distinguish a `SET`-typed EXPRESS aggregate attribute from a `LIST`/`BAG`/`ARRAY`-typed one from
this primitive surface at all — confirmed by reading both the generated `.ts` facade and its C API
header (`ifcopenshell_native_c_api.h`) directly, not assumed.

**Why this matters, concretely:** `util/element.py`'s `replace_attribute` only de-duplicates a
replaced aggregate member when the attribute is a real `SET` (a `LIST`/`BAG` may legitimately
contain duplicates) — its private `_is_set_attribute` helper is exactly this schema-introspection
chain. Phase 3 chunk 3 (`util/element.ts`'s `replaceAttribute`/`isSetAttribute`) hit this gap
directly: `isSetAttribute` unconditionally returns `false` (never deduplicates) rather than
guessing, a disclosed, tested divergence from Python (see that PR's own test,
`replacing into a SET-typed attribute does not deduplicate the survivor`) — concretely,
`IfcRelAggregates.RelatedObjects` (a real EXPRESS `SET`) keeps a duplicate entry after a
`replaceAttribute` call where Python would have collapsed it to one.

**Fix:** bind `aggregation_type::type_of_aggregation()` (or a string-returning convenience wrapper
matching Python's own `type_of_aggregation_string()`) as a new N-API primitive, the same
one-function-at-a-time follow-up pattern as the Phase 1 gaps list above. Small, self-contained,
no dependency on anything else in this list.

**Context:** Surfaced during Phase 3 chunk 3 (`util.element` structural-editing helpers:
`copy`/`copyDeep`/`removeDeep`/`removeDeep2`/`batchRemoveDeep2`/`unbatchRemoveDeep2`/
`replaceElement`/`replaceAttribute`), 2026-09-09. Separately, that same chunk confirmed the
`to_string()`/`from_string()` gap noted in the Phase 1 gaps list above does *not* block
`unbatch_remove_deep2`'s file-reload semantics: `from_string` already has a working primitive
(`native.file_new_with_data_data_size`, already used by `template.ts`), and `to_string` was worked
around without a new primitive by writing to a throwaway temp file via the existing
`IfcFile.write(path)` (confirmed, by reading `src/ifcparse/parse.cpp`'s `operator<<`, to serialize
via the exact same code path `to_string()` itself would use, i.e. byte-identical, not an
approximation) and reading it back. `to_string()`/`from_string()` can stay in the Phase 1 gaps list
for anyone who wants an in-memory (no disk I/O) version later, but nothing currently blocks on it.

**Depends on / blocked by:** None. Independent, small, well-scoped primitive addition.

---

### `util.unit.convert_file_length_units` -- genuinely blocked, not yet portable -- **RESOLVED, stale entry never flipped (found during the 2026-09-25 TODOS.md sweep)**

**What:** `ifcopenshell/util/unit.py`'s `convert_file_length_units` (the file's only function not
ported by the Phase 3 `util.unit` chunk) transitively imports `ifcopenshell.api.unit`,
`ifcopenshell.api.georeference`, and `ifcopenshell.util.geolocation` -- none of which exist yet in
this TS port. `ifcopenshell.api.*` is a separate, much-later phase in this project's roadmap
(`planning/ifcopenshell-ts/20-roadmap.md` Phase 6+); `util.geolocation` is Phase 4 (`util` Tier B).

**Why deferred rather than attempted:** Unlike `util.element`'s own 3-way chunk split (same module,
sequenced sub-chunks), this is a genuine cross-module hard blocker -- there is no way to port a
working `add_si_unit`/`add_conversion_based_unit`/`edit_georeferencing` call without those API
modules existing first. Porting only a narrow slice of `api.unit`/`api.georeference` just to unblock
this one function would be real, disclosed scope creep into Phase 6+ work, not a small addition.

**Fix:** Port `ifcopenshell.api.unit` and `ifcopenshell.api.georeference` (Phase 6, `api` Tier 1) and
`ifcopenshell.util.geolocation` (Phase 4, `util` Tier B) first; `convert_file_length_units` itself is
then a comparatively small, mechanical port on top of `util/unit.ts`'s already-landed
`getPrefix`/`getUnitName`/`getProjectUnit`/`convertUnit`/`iterElementAndAttributesPerType`/
`getUnitAssignment` (all already ported and directly reusable).

**Context:** Surfaced during Phase 3's `util.unit` chunk (2026-09-10) -- see that chunk's own PR
description for the full disclosure. `test_unit.py::TestConvertFileLengthUnits`/
`TestConvertFileLengthUnitsIFC4`/`TestConvertFileLengthUnitsIFC4X3` have no TS counterpart for the
same reason.

**UPDATE 2026-09-11 (Phase 4's `util.geolocation` chunk):** `util.geolocation` has now landed
(`src/util/geolocation.ts`) -- one of the two remaining dependencies. Still fully blocked overall:
`convert_file_length_units` also needs `ifcopenshell.api.unit`/`ifcopenshell.api.georeference`
(Phase 6, `api` Tier 1), neither of which exists yet.

**Depends on / blocked by:** `util.geolocation` dependency resolved. Still blocked on Phase 6's
`api.unit`/`api.georeference` landing first.

**RESOLVED (found stale during the 2026-09-25 TODOS.md sweep):** both remaining dependencies
(`api.unit`, `api.georeference`) landed long ago as part of Phase 6/10's own `api` module work --
`convertFileLengthUnits` is fully implemented in `src/util/unit.ts` (confirmed directly: its own
header comment says "now ported below too, now that all three [dependencies] have landed"). This
entry was simply never flipped/archived after the dependency chain closed -- no code work needed,
just this documentation update.

### `EntityInstance.setByIndex`/`IfcFile.createEntity` cannot write an initial value into a freshly created simple/defined-type instance -- blocks `Migrator.migrate`'s `id() === 0` (SELECT-typed value) branch -- **RESOLVED 2026-09-23 for the shared gate itself; see "Resolved" below for exactly what's verified vs. what remains (each individual consequence's own test file still needs its own follow-up flip from "throws" to the real assertion)**

**BACKLOG FULLY CLOSED (2026-09-25):** all 29 files / 199 tests originally left `test.skip`'d to keep
CI green while this gate's own shared fix landed have now been processed across 5 module-grouped
chunks (PRs #260-#264, all merged) -- 196 flipped to real, verified assertions; the remaining 3
(`addPositioningReferent.test.ts`/`addStationingReferent.test.ts`/`updateKeyPointReferents.test.ts`'s
own composite-curve-branch regression tests, chunk 4) stay genuinely skipped, correctly re-attributed
to a SEPARATE, independent, already-tracked gap (`getAxis2placement`'s `IfcAxis2PlacementLinear`
fallback needing `ifcopenshell.geom`) rather than force-passed. Full-suite skip count went from 218
(199 from this gate + 19 pre-existing/intentional) down to 22 (19 pre-existing/intentional + those
same 3 re-attributed cases) -- confirmed via a from-scratch multi-schema native rebuild + full run on
the final merged `v0.9.0` tip, 11167 passed / 22 skipped / 0 failed (11189 total). No further
follow-up needed on this entry.

**Resolved (2026-09-23):** Fixed at the exact root this entry always pointed at --
`src/wrappergen/shim/attribute_value_shim.cpp`'s `entity_declaration_of` (the helper both
`attribute_kind_of`, backing `EntityInstance.setByIndex`, and `get_attribute_type_name`, backing
`.attributeType()`, went through) unconditionally required `instance.declaration().as_entity()` to
be non-null, with no fallback for a bare, standalone simple/defined-type instance (a `type_declaration`
-declared instance, e.g. a loose `IfcLabel`/`IfcDuration`/`IfcLineIndex` constructed on its own, with
no owning entity/attribute).

Verified directly against the real current source (not just re-asserting this entry's own prior
claims) before implementing: `src/ifcparse/schema.h`'s `declaration` base class (lines 141-179) has
virtual `as_entity()`/`as_type_declaration()`/`as_select_type()`/`as_enumeration_type()` accessors,
each defaulting to `nullptr` and overridden by the matching subclass; `type_declaration` (lines
181-195) has a `declared_type()` accessor needing zero entity/attribute context to resolve.
`src/ifcparse/utils.cpp`'s `ifcopenshell::from_parameter_type` (line 204) already walks a bare
`parameter_type*` on its own -- recursing through further `type_declaration`s via `declared_type()`
and through `aggregation_type::type_of_element()` for aggregates -- with no entity/attribute context
needed; `attribute_kind_of` (`attribute_value_shim.cpp`, was line 387) already called this exact
function, just fed an attribute's own `type_of_attribute()` rather than a bare type declaration's.

**The fix:** added a new `declared_argument_type_of(instance, attribute_index)` helper in
`attribute_value_shim.cpp`, factoring out the "resolve the declared EXPRESS argument type at this
index" logic `attribute_kind_of`/`get_attribute_type_name` both need (avoiding duplicating either the
`type_declaration`-vs-entity branch or the `from_parameter_type` mapping switch across both callers):
for a real entity, behavior is byte-identical to before (delegates to `attribute_declaration_at`'s
existing attribute-level `type_of_attribute()`); for a non-entity instance whose declaration
`.as_type_declaration()` is non-null, attribute index 0 resolves via
`from_parameter_type(type_decl->declared_type())` (matching `entityInstance.ts`'s own
`attributeCount()`, which already returns 1 for exactly this case, confirmed unchanged at lines
259-263), and any other index still throws `std::out_of_range("Attribute index out of range")`,
matching the existing entity out-of-range behavior exactly. A bare instance that is neither an entity
nor a `type_declaration` (i.e. a `select_type`/`enumeration_type`-declared instance) still falls
through to `entity_declaration_of`'s original throw, completely unchanged -- deliberately NOT
handled, per this chunk's own scope (and empirically confirmed unreachable in practice: attempting
`file.createEntity("IfcValue")`, a bare SELECT type, throws even earlier, at
`create_with_declaration_instance_id` itself, with an unrelated, pre-existing "Requires and entity or
type declaration" message -- there is no way to construct a bare select/enumeration-type instance at
all via `file.createEntity` for this gate to ever reach in the first place). `get_attribute_type_name`
was simplified to a one-line call through the same shared helper.

**Verified working, empirically, against a from-scratch full rebuild of both the C++ core
(`-DSCHEMA_VERSIONS="2x3;4;4x3_add2"`) and the native addon** (not assumed from the diff alone):
- `file.createEntity("IfcLabel", "hello")` (scalar, STRING-backed, construct WITH an initial value)
  round-trips on all 3 schemas.
- `file.createEntity("IfcLabel")` followed by `.setByIndex(0, "world")` (construct bare, then mutate)
  round-trips on all 3 schemas.
- `file.createEntity("IfcDuration", "P1D")` (a real, non-`IfcLabel` STRING-backed defined type, the
  exact shape `assignLagTime.ts`'s/`editLagTime.ts`'s own blocked call sites need) round-trips on
  IFC4/IFC4X3 (IFC4+-only, confirmed absent on IFC2X3 via `SCHEMA_HAS_IfcDuration`, matching this
  entry's own fifteenth-consequence UPDATE below).
- `file.createEntity("IfcLineIndex", [1, 2])` (an AGGREGATE-kind defined type -- `LIST [2:?] OF
  IfcPositiveInteger`, confirmed against the generated schema source) round-trips both the
  construct-with-value and construct-then-`setByIndex`-mutate shapes on IFC4/IFC4X3 (also IFC4+-only,
  confirmed absent on IFC2X3), exercising `attribute_kind_of`'s `ATTRIBUTE_VALUE_KIND_AGGREGATE`/
  `Argument_AGGREGATE_OF_INT` path through the same new fallback.
- Attribute index 1 (out of range for a bare simple/defined-type instance) still throws, both via
  `EntityInstance.setByIndex`/`.attributeType()` and via the raw native `attribute_kind_of`/
  `attribute_type` primitives directly.
- A bare `select_type`-declared instance (`IfcValue`) is still rejected, unaffected by this fix (see
  above).

New regression tests: `src/ifcopenshell-ts/test/native/primitives.test.ts` (raw native-primitive
level: `attribute_kind_of`/`attribute_type` directly on a freshly created `IfcLabel`/`IfcLineIndex`
instance, bypassing `EntityInstance`/`IfcFile` entirely) and
`src/ifcopenshell-ts/test/file.test.ts` (a new `describe` block, schema-parameterized, covering every
case above at the `IfcFile.createEntity`/`EntityInstance` level real callers actually use). `tsc
--noEmit` (both `tsconfig.json` and `tsconfig.typecheck.json`) and `biome check .` are both clean.

**Full suite, from-scratch rebuild, before vs. after (same 6439 pre-existing tests in both runs; the
19-test delta in the intermediate "after fix, before skip-annotating" total is this chunk's own new
tests -- 17 newly passing + 2 schema-gated `skipIf`s):**
- Before this fix: 420/420 test files passed, 6422 passed / 0 failed / 17 skipped (6439 total).
- Immediately after the native fix (before touching any pre-existing test): 391/420 test files
  passed, 6240 passed / **199 failed** / 19 skipped (6458 total).
- **Final, as merged (CI-green):** after marking every one of the 199 now-incorrect assertions below
  with `test.skip`/`test.skipIf` (never deleted, never rewritten to a guessed "correct" value -- see
  below), 416/420 test files passed, 4 fully skipped (every test in those 4 files happened to be
  gate-affected, confirmed test-by-test, not a blanket file skip), 6240 passed / **0 failed** / 218
  skipped (6458 total: 199 newly skipped + 19 pre-existing/intentional).

**The 199 tests, across 29 files, that flipped from "throws" to "succeeds" are the EXPECTED, disclosed
consequence this entry's own phasing recommendation predicted** -- every one of them was written to
pin the OLD, blocked "throws" behavior as its own explicit assertion (per this entry's own long
history of UPDATEs below, each already diagnosing exactly why its own module's tests throw here), and
the underlying operation now genuinely succeeds instead. Per the orchestrating session's explicit
direction (this repo's branch protection requires full CI green -- a "these are expected failures"
PR cannot land as-is), each one was marked `test.skip`/`test.skipIf` (matching this project's own
extensive precedent for exactly this "known gap, disclosed, not silently swept away" situation) with
a comment citing this entry and stating the real expected assertion inline -- reusing an already-
present "Real Python: ..."/"real, unblocked Python behavior once the gap closes" comment or the
test's own title wherever one already existed (most did), rather than inventing a new one. None of
these are regressions and none were FIXED (assertions flipped to a verified-correct value) as part of
this chunk -- that remains explicitly out of scope, left to a separate, later set of module-grouped
chunks, per this entry's own prior phasing recommendation; this chunk's own job was only to get CI
green without silently discarding the disclosure. One real bug caught along the way: two tests in
`editStructuralBoundaryCondition.test.ts` run across all 3 schemas, and IFC2X3 was NEVER affected by
this gate at all (confirmed empirically: `IfcBoundaryNodeCondition.TranslationalStiffnessX` doesn't
exist on IFC2X3 -- a genuinely separate, still-real, unrelated block) -- an unconditional `test.skip`
would have wrongly silenced an already-passing IFC2X3 case, caught by the full-suite passed-count
staying byte-for-byte identical (6240) before and after the skip-annotating pass; fixed with a
schema-conditional `test.skipIf(schema !== "IFC2X3")` instead, keeping that real, already-correct
IFC2X3 assertion running. Full file list, with a one-line reason each (all consequences of this same
now-fixed gate, already diagnosed in this entry's own UPDATE history below unless noted):

- `test/util/migrator.test.ts` (1) -- this entry's own original finding: `Migrator.migrate`'s
  `id() === 0` SELECT-typed-value branch. **DONE (chunk 1 of 5)**: un-skipped and flipped to the
  real, verified assertion (migrating a SELECT-typed `IfcMeasureWithUnit.ValueComponent` now
  correctly recreates the wrapped `IfcPlaneAngleMeasure`/`IfcSIUnit` in the target file).
- `test/util/unit.test.ts` (6), `test/api/unit/addConversionBasedUnit.test.ts` (16),
  `test/api/unit/assignUnit.test.ts` (3), `test/api/unit/removeUnit.test.ts` (3) -- `util.unit`'s own
  standalone-unit-value construction (`addConversionBasedUnit`'s imperial/offset units, transitively
  `assignUnit`/`removeUnit`). **DONE (chunk 1 of 5)**: all 4 files un-skipped and flipped to their
  real, verified assertions (`addConversionBasedUnit` now genuinely builds every imperial/mass/time/
  offset/userdefined unit; `assignUnit`'s imperial-synthesis branch and `removeUnit`'s deep-removal
  of a real conversion-based unit both work end-to-end; `convertFileLengthUnits`' imperial-target and
  entity-wrapped-`IfcLengthMeasure` in-place conversion paths both verified numerically).
- `test/api/owner/addApplication.test.ts` (1) -- third consequence (IFC4X3 default-organisation
  `IfcLabel` pset property). **DONE (chunk 3 of 5)**: un-skipped and flipped to the real, verified
  assertion (`TestAddApplicationIFC4X3.test_adding_the_ifcopenshell_application`'s own default
  organisation, wrapped in an `IfcActor` carrying a real "PEnum_AddressType" `IfcPropertySet`).
- `test/api/pset/editPset.test.ts` (18) -- fourth consequence (`cast_value_to_primary_measure_type`,
  the single widest-impact consequence). **DONE (chunk 2 of 5)**: un-skipped and flipped to the
  real, verified assertions (plain-scalar property creation/update, buildingSMART/custom-template
  casting, and list/enumerated-value creation all work end-to-end). One test's own pinning comment
  was wrong, not just blocked: a unit-wrapped raw-scalar `NominalValue` for a brand-NEW (not
  pre-existing) property has no `old_value`/template match to retain a measure type from, so it
  falls through to the plain-value heuristic (`IfcInteger`), not the `IfcModulusOfElasticityMeasure`
  the stale comment assumed (that shape only applies when UPDATING an already-typed property) --
  fixed to the real, confirmed-against-`src/ifcopenshell-python`, value.
- `test/util/shapeBuilder.test.ts` (19) -- transitively via the same `editPset`/pset-property gate
  (profile/swept-solid helpers that round-trip a property through `editPset`). **DONE (chunk 2 of
  5)**: un-skipped and flipped to real, verified assertions -- `polyline`'s `closed=true`/
  `arcPoints` paths, `rectangle`, `curveBetweenTwoPoints`, `getSimple2dcurveData`/
  `createZProfileLipsCurve`/`createTransitionArcIfc` with `createIfcCurve=true`, and `mepBendShape`
  on IFC4/IFC4X3 (both circular and rectangular profiles) all build real `IfcLineIndex`/
  `IfcArcIndex`/`IfcIndexedPolyCurve` values now. The separate, still-open `.get("Dim")`
  DERIVED-attribute gap (`profile()`/`createSweptDiskSolid()`) is untouched by this chunk and
  remains genuinely blocked -- no tests in this file exercised that path, so none needed to change
  for it.
- `test/api/pset_template/editPropTemplate.test.ts` (2) -- sixth consequence (`Enumerators` raw-value
  wrapping). **DONE (chunk 2 of 5)**: un-skipped and flipped to the real, verified assertion
  (`test_editing_an_enumeration`'s own wrapped `IfcLabel` values, and the existing
  `IfcPropertyEnumeration` being mutated in place rather than replaced).
- `test/api/structural/editStructuralBoundaryCondition.test.ts` (4) -- seventh consequence
  (`IfcBoolean`/generic-measure-class SELECT-typed stiffness attributes). **DONE (chunk 3 of 5)**:
  un-skipped and flipped to the real, verified assertions on IFC4/IFC4X3 (a fresh `IfcBoolean(true)`/
  `IfcLinearStiffnessMeasure(1000.0)` wrapping instance) -- IFC2X3 is left asserting its own,
  genuinely unrelated `.toThrow()` (`IfcBoundaryNodeCondition.TranslationalStiffnessX` doesn't exist
  on that schema at all), not touched by this gate.
- `test/api/cost/editCostValue.test.ts` (4), `test/api/cost/editCostValueFormula.test.ts` (2),
  `test/api/cost/calculateCostItemResourceValue.test.ts` (2) -- eighth consequence (`AppliedValue`/
  `UnitBasis` standalone measure construction, transitively through formula evaluation and resource
  cost calculation). **DONE (chunk 3 of 5)**: un-skipped and flipped to the real, verified assertions
  (`AppliedValue`/`UnitBasis` construction and replacement in `editCostValue.test.ts`, matching real
  Python's own `test_edit_cost_value.py`; the multi-operand `"5000 * 1.19"` `MULTIPLY` formula in
  `editCostValueFormula.test.ts`; and `calculateCostItemResourceValue.test.ts`'s own resource-cost
  formula, confirmed empirically to resolve to a `"0*1"` `MULTIPLY` of a `null` first operand -- a
  falsy `0` cost stays unwrapped, per `editCostValueFormula.ts`'s own `if (data.AppliedValue)` guard
  -- and a real `IfcMonetaryMeasure(1)` second operand, not a single scalar root `AppliedValue` as
  that test's own original pinning comment loosely assumed).
- `test/api/georeference/addGeoreferencing.test.ts` (2), `test/api/georeference/editGeoreferencing
  .test.ts` (1) -- ninth/tenth consequence (IFC2X3 pset-property/dead-code branches, IFC4X3
  `IfcRigidOperation` branch). **DONE (chunk 3 of 5)**: un-skipped and flipped to the real, verified
  assertions, matching `test_add_georeferencing.py`'s/`test_edit_georeferencing.py`'s own
  `TestAddGeoreferencingIFC2X3`/`TestEditGeoreferencingIFC2X3` classes exactly (both pset properties,
  correctly wrapped as `IfcLabel`/`IfcLengthMeasure`) and `addGeoreferencing.ts`'s own
  `IfcRigidOperation` branch (`FirstCoordinate`/`SecondCoordinate` both wrapping a fresh
  `IfcLengthMeasure(0)`). `editGeoreferencing.test.ts`'s own real, independently-confirmed dead-code
  bug (the loop-local wrapped value is computed and discarded, never written back into the dict) is
  still real and unrelated to this gate -- but doesn't affect the OBSERVED result here, since
  `addGeoreferencing` already created both pset properties with their correct wrapped types before
  `editGeoreferencing` runs, and `editPset`'s own "update an EXISTING property" tier retains that
  type regardless of what the dead code would have computed.
- `test/api/geometry/clipSolid.test.ts` (6), `test/api/geometry/clipSolidBounded.test.ts` (3) --
  eleventh/twelfth consequence (`element`-provided branch's final `edit_pset` call). **DONE (chunk 4
  of 5)**: both files un-skipped and flipped to their real, verified assertions (the `element`-
  provided branch now genuinely registers/appends the clipping result's STEP id in the target
  element's `BBIM_Boolean` pset, on all 3 schemas, whether the pset is brand-new or pre-existing).
- `test/api/alignment/addPositioningReferent.test.ts` (2), `test/api/alignment/addStationingReferent
  .test.ts` (4), `test/api/alignment/updateKeyPointReferents.test.ts` (3) -- fourteenth consequence
  (composite-curve placement branch plus `Pset_Stationing.Station` property creation); `test/api
  /alignment/create.test.ts` (3) and `test/api/alignment/createLayoutSegment.test.ts` (1) are the
  same underlying alignment-module standalone-value construction gate, not previously itemized by
  file name in this entry's own alignment UPDATEs. **DONE (chunk 4 of 5), with one real caveat found
  along the way**: the non-composite-curve (fallback-placement) branch of all 3 first-listed files
  is fully un-skipped and flipped to real, verified assertions (`Pset_Stationing.Station` now
  genuinely gets written, and `updateKeyPointReferents` creates one real `IfcReferent` per key
  point, not just the first one). `create.test.ts`/`createLayoutSegment.test.ts` are FULLY un-skipped
  too, for a real, verified, structural reason specific to `create()`: its own `IfcCompositeCurve` is
  always still EMPTY (`Segments === []`) at the exact point `addStationingReferent` runs (populated
  only afterward, by `create()`'s own trailing `_addZeroLengthSegment` loop), so `create()`
  unconditionally takes the fallback-placement branch itself, never the composite-curve one, on every
  schema/option combination -- confirmed empirically, not assumed. HOWEVER, the dedicated
  composite-curve-branch regression test in each of `addPositioningReferent.test.ts`/
  `addStationingReferent.test.ts`/`updateKeyPointReferents.test.ts` (1 test each, 3 total) remains
  genuinely skipped: fixing this entry's own gate un-blocks `IfcPointByDistanceExpression`
  construction, but the very next real statement, `updateFallbackPosition`'s own
  `getAxis2placement` call, then hits a SEPARATE, independent, already-tracked, still-open gap --
  this file's own dedicated "`getAxis2placement`'s `IfcAxis2PlacementLinear` fallback needs
  `ifcopenshell.geom`" entry (`util.placement` chunk, 2026-09-11) -- confirmed empirically against
  this chunk's own freshly-built native addon (`getAxis2placement: cannot resolve a non-Cartesian
  Location (IfcPointByDistanceExpression, no Coordinates attribute) without ifcopenshell.geom...`).
  Each of the 3 tests was left `test.skip`'d (not force-passed) with an updated comment recording
  this exact finding, rather than being flipped to a fudged "succeeds" assertion.
- `test/api/sequence/assignLagTime.test.ts` (2) -- fifteenth consequence (`IfcDuration` construction,
  every schema). **DONE (chunk 4 of 5)**: un-skipped and flipped to the real, verified assertion (a
  real `IfcLagTime` wrapping the constructed `IfcDuration`, assigned to `relSequence.TimeLag`).
- `test/api/sequence/editLagTime.test.ts` (4), `test/api/sequence/calculateTaskDuration.test.ts` (2)
  -- same `IfcLagTime`/`IfcDuration`/`editPset`-property gate family, not previously itemized by file
  name in this entry's own UPDATEs. **DONE (chunk 4 of 5)**: both files un-skipped and flipped to
  their real, verified assertions (`editLagTime`'s `IfcRatioMeasure`/`IfcDuration` `LagValue`
  branches both now build correctly; `calculateTaskDuration`'s custom-workday-duration fixture now
  builds and computes `ScheduleDuration === "P24D"`, matching real Python's own
  `test_calculating_a_task_duration_with_a_custom_workday_duration` assertion exactly).
- `test/api/geometry/addDoorRepresentation.test.ts` (31), `test/api/geometry/addWindowRepresentation
  .test.ts` (32), `test/api/geometry/regenerateWallRepresentation.test.ts` (18), `test/api/geometry
  /validateType.test.ts` (4) -- named in this entry's own EXPRESS-DERIVE-gap UPDATE (2026-09-22) as
  downstream of `guessType`'s `Dim` dispatch; on closer inspection during this chunk's own full-suite
  run, at least part of each of these files' newly-failing cases trace to THIS gate too (standalone
  measure/defined-type construction inside the same geometry helpers), not solely the separate
  EXPRESS-DERIVE gate -- both gates are real and independent. **DONE (chunk 5 of 5, the LAST chunk of
  this backlog): all 85 tests across these 4 files un-skipped and flipped to real, verified
  assertions on ALL 3 schemas** -- by the time this chunk ran, the separate EXPRESS-DERIVE `.get
  ("Dim")` gap these 4 files ALSO hit (`util.representation.guessType`'s own entry below) had
  independently finished closing for IFC4/IFC4X3 too (Phase EX-2's later, per-schema `calc_*`-porting
  chunks, PRs already merged well before this one -- see that entry's "UPDATE" through "UPDATE 5"),
  so BOTH gates this file group depends on were already closed on every schema going in. Re-verified
  directly (not assumed) with a throwaway script against a fresh, from-scratch multi-schema native
  rebuild before touching any test: every one of the 85 previously-skipped cases now produces a real,
  non-throwing result on IFC2X3, IFC4, AND IFC4X3 alike, with item counts/structure identical across
  schemas (the only schema-observable difference being which concrete curve class `ShapeBuilder
  .rectangle()`/`.polyline(closed=true)` build -- `IfcPolyline` on IFC2X3, `IfcIndexedPolyCurve` on
  IFC4/IFC4X3, a real, pre-existing, already-disclosed `util/shapeBuilder.ts` finding, not new here).
  Full-suite, from-scratch multi-schema rebuild, before vs. after this chunk alone (same native
  build both times): 11039 passed/150 skipped -> 11124 passed/65 skipped (11189 total either way,
  0 failures both times) -- exactly the 85-test delta this chunk's own scope predicts, no more, no
  less. No test in any of these 4 files needed to stay skipped or be re-attributed to a different
  gap; deep geometric-fidelity verification (exact panel/lining/join/mitre placement per
  operationType/partitionType/connection shape, on any schema) remains real, disclosed, scoped-out
  follow-up work, comparable in size to its own dedicated verification chunk, per each file's own
  test-file header comment.

**What this resolution does NOT cover (left to follow-up, module-grouped chunks, per this entry's own
established phasing recommendation):** flipping each of the 29 files above from `test.skip`/
`test.skipIf`-annotated to asserting the real, correct working result is explicitly out of this
chunk's scope -- each one now has a `test.skip`/`test.skipIf` plus a comment citing this entry and
stating the real expected assertion, but is otherwise untouched, by design, so each module's own
owner/reviewer can independently verify the *correct* unblocked value (not just "doesn't throw")
against real Python before un-skipping and flipping its assertions. IFC4/IFC4X3's own separate
EXPRESS-DERIVE `.get("Dim")` gap (this file's own dedicated entry below, "`util.representation
.guessType`'s `Curve2D`/.../ blocked by the pre-existing `entityInstance.ts` DERIVED-attribute gap")
remained genuinely unresolved for those two schemas AS OF THIS PARAGRAPH'S OWN 2026-09-23 WRITING --
**stale as of chunk 5 of 5 (this backlog's LAST chunk): that entry's own later "UPDATE" through
"UPDATE 5" independently closed it for IFC4/IFC4X3 too, well before this backlog's own chunk 5 ran**
(see that entry's own updates for the full per-schema history, and this entry's own file-list item
for `addDoorRepresentation.test.ts`/etc. above for how that combined with THIS gate's own fix to
unblock all 85 of those files' tests). This sentence is left otherwise unrewritten (historical
narrative describing what was true at the time), and is unrelated to (though sometimes co-occurring
with, per `addDoorRepresentation.test.ts`/etc. above) this entry's own gate.

<details><summary>Original TODO text</summary>

**What:** `EntityInstance.setByIndex` (called by both `IfcFile.createEntity(type, ...args)`'s own
initial-attribute-assignment loop and any later `.set()`/`.setByIndex()` call) always calls the
native `attribute_kind_of` primitive first, to disambiguate ambiguous JS value kinds (`boolean` ->
BOOL vs. LOGICAL, `number` -> INTEGER vs. DOUBLE, `string` -> STRING vs. ENUMERATION vs. BINARY).
That primitive's shim implementation (`attribute_value_shim.cpp`'s `attribute_declaration_at` ->
`entity_declaration_of`) unconditionally throws `"Attribute access is only supported on entity
instances"` for any non-entity (simple/defined-type) target instance -- entity or not, populated or
not. So `file.createEntity("IfcLabel", "hello")` (a loose, not-yet-attached simple-type value with an
initial value -- Python's `file.create_entity("IfcLabel", "hello")`, which works fine there) throws
in this port, even though *reading* an already-populated simple-type value (via `getByIndex`, which
calls the unrelated, ungated `get_attribute_value_variant` shim function) works fine regardless of
how the instance was constructed (confirmed empirically, see `util/unit.ts`'s own finding for the
*reading* half of this story).

**Why this matters:** `util/migrator.ts`'s `Migrator.migrate` (Phase 3, `util.migrator` chunk,
2026-09-10) has a dedicated `element.id() === 0` branch (Python: a source value that is itself a
bare, not-yet-in-any-file simple/defined-type wrapper, e.g. an `IfcLabel`/`IfcCountMeasure` read off
a SELECT-typed attribute like `IfcPropertySingleValue.NominalValue` or `IfcMeasureWithUnit
.ValueComponent`) that must recreate that value *with* its wrapped value in the target file --
exactly the blocked operation above. This is a real, common pattern across IFC files (any
SELECT-typed attribute value), not a rare corner case -- confirmed with a real repro
(`IfcMeasureWithUnit.ValueComponent`, a plain `IFCMEASUREWITHUNIT(IFCPLANEANGLEMEASURE(0.5), ...)`
literal) migrating between schemas that otherwise migrate correctly.

**Fix:** Teach `EntityInstance.setByIndex` (or a new, narrower internal helper it delegates to for
this one case) to skip the `attribute_kind_of` lookup for a non-entity target instance, and infer the
variant kind a different way for that case -- e.g. the same runtime-type-inference fallback
`valueToVariant` already uses for aggregate elements (`entityInstance.ts`'s own doc comment: "number
-> DOUBLE", a disclosed, narrower rough edge, not a correctness issue) could be reused/extended to
cover this case too. This is foundational, already-shipped `entityInstance.ts` code from Phase 2,
well before the `util.migrator` chunk that found this -- fixing it is a cross-cutting change to that
foundational surface, not something the chunk that found it should do silently; flagged here for the
orchestrating session's review rather than fixed inline, per that chunk's own instructions ("do NOT
silently add a new native primitive without flagging it for the orchestrating session's review" --
this isn't a *new* primitive, but is the same category of "foundational primitive-layer behavior
change" the instruction is guarding against).

**Context:** Surfaced during Phase 3's `util.migrator` chunk (2026-09-10) -- ported `Migrator.migrate`'s
`id() === 0` branch faithfully anyway (so it will work correctly the moment this is fixed, with zero
further changes in `util/migrator.ts`); `test/util/migrator.test.ts` has a dedicated test asserting
the CURRENT, disclosed, blocked behavior (not silently skipped) that will need updating once this is
fixed. See `util/migrator.ts`'s own header comment (finding 1) for the full investigation.

**Depends on / blocked by:** Nothing -- purely a Phase 2 `entityInstance.ts` fix, independent of any
other phase's work. Low urgency for most of this port's other consumers (most callers only ever read
existing values, never construct a loose simple-type value with an initial value from scratch), but
directly blocks full `Migrator` fidelity for any file containing SELECT-typed attribute values.

**UPDATE 2026-09-12 (Phase 3's `util.cost` chunk):** found a second, independent consequence of this
exact same gate -- it also breaks `Transaction.unserialiseValue`'s undo/redo REPLAY path (`file.ts`)
for any transaction that creates a brand-new standalone simple/defined-type value (e.g. a fresh
`IfcMonetaryMeasure` `AppliedValue`). `Transaction.serialiseValue` round-trips such a value (one with
no STEP id) as `{type: inst.isA(), value: inst.getByIndex(0)}`; `unserialiseValue` reconstructs it via
`file.createEntity(dict.type, dict.value)` on `redo()`/replay -- which hits the identical
`attribute_kind_of`/"Attribute access is only supported on entity instances" throw this entry already
documents. Confirmed empirically while building `test/util/cost.test.ts`'s undo/redo regression test
for the parse-a-formula-then-apply-it workflow (`ifcopenshell.api.cost.edit_cost_value_formula`'s real
`Usecase.edit_cost_value`, which always creates a fresh `IfcMonetaryMeasure` for `AppliedValue` on
every call, would hit this on `redo()` for that exact reason) -- that test was narrowed to only
exercise reference/scalar `.set()` mutations on already-existing entities (no new typed-value creation
inside the transaction under test), with this cross-reference in place of exercising the blocked path.
No `util/cost.ts` code changes as a result -- same fix as above resolves this consequence too.

**UPDATE 2026-09-13 (Phase 6's `api.owner` person/organisation/application chunk):** found a third,
independent consequence -- `ifcopenshell.api.owner.add_application`'s IFC4X3-only branch (no
`application_developer` given: real Python builds a default "IfcOpenShell" `IfcOrganization`,
wrapped in an `IfcActor` with a "PEnum_AddressType" `IfcPropertySet` attached, since `IfcTelecomAddress`
is deprecated on IFC4X3) needs `edit_pset`'s own `nominal_value = self.file.create_entity("IfcLabel",
value)` call to build each property's `IfcPropertySingleValue.NominalValue` -- the identical
`attribute_kind_of`/"Attribute access is only supported on entity instances" throw this entry already
documents. Confirmed empirically against this exact worktree's own built native addon before writing
`addApplication.ts`. Ported the whole IFC4X3 branch faithfully anyway, up through constructing the
actor/pset/rel (all real entities, unaffected by this gap) and throwing at the exact point a standalone
`IfcLabel` would need to be built -- `test/api/owner/addApplication.test.ts` pins this CURRENT, disclosed,
blocked behavior with a dedicated IFC4X3 test (matching `util/cost.test.ts`'s own precedent above), not
silently skipped. The IFC2X3/IFC4 default-organisation path, and the "`application_developer` explicitly
given" path on all 3 schemas, need no standalone defined-type instance at all and work correctly today.
See `src/api/owner/addApplication.ts`'s own header comment for the full writeup. No further consequences
found elsewhere in this chunk's own 11 files.

**UPDATE 2026-09-14 (Phase 6's `api.pset` `edit_pset` chunk):** found a fourth, independent
consequence -- and the most sweeping one yet, blocking the MAJORITY of a whole function's own real
Python test suite, not a single branch. `ifcopenshell.api.pset.edit_pset`'s
`cast_value_to_primary_measure_type` needs to build a standalone typed value (e.g. `IfcLabel("hi")`,
`IfcThermalTransmittanceMeasure(42.0)`) for EVERY plain-scalar (`string`/`number`/`boolean`/`Date`)
property value, for both creating a NEW property and updating an EXISTING one -- the identical
`attribute_kind_of`/"Attribute access is only supported on entity instances" throw this entry already
documents, hit on `cast_value_to_primary_measure_type`'s own very first line (`file.createEntity(
primaryMeasureType).attributeType(0)`, a probe-instance construction). The SAME gate also blocks the
raw-array `IfcPropertyEnumeratedValue`/`IfcPropertyListValue` creation paths. Ported the whole
function completely and faithfully anyway (its 4-tier value-type-inference resolver
`getPrimaryMeasureType`/`inferPrimaryMeasureType`, never itself touching `file.createEntity`, is
exported and independently unit-tested as pure logic, unaffected by the gap); every code path that
does NOT need to materialize a brand-new typed value (renaming; purging/clearing an existing
property; assigning an already-built `entity_instance` value to a new or existing property; full
`IfcProperty` passthrough; copying enum data from another existing property; the shared-property/
`NotImplementedError` dispatch logic) remains fully functional and gets real, passing test coverage.
`test/api/pset/editPset.test.ts` pins the CURRENT, disclosed, blocked behavior for every scalar-value-
creation test case ported from real Python's `test_edit_pset.py` (matching
`addConversionBasedUnit.test.ts`'s own established precedent), each with a comment recording the
real, unblocked assertion to restore once this gap closes. See `src/api/pset/editPset.ts`'s own
header comment (top section) for the full writeup.

**UPDATE 2026-09-15 (`api.style` chunk 2, `edit_surface_style` file):** found a fifth, independent
consequence -- `ifcopenshell.api.style.edit_surface_style`'s own two special-cased attribute-class
handlers each need a standalone typed value at one exact point: `edit_colour_or_factor`'s "set to a
numeric factor" branch needs a real, addressable `IfcNormalisedRatioMeasure(value)` (so it can later
be `file.remove()`d if reassigned again -- the entire reason real Python explicitly creates it rather
than assigning the raw scalar directly); `edit_specular_highlight`'s two branches each need a
standalone `IfcSpecularExponent(value)`/`IfcSpecularRoughness(value)`. Confirmed empirically against
this exact worktree's own built native addon (`file.createEntity("IfcLabel", "hello")` and even a
zero-arg `file.createEntity("IfcNormalisedRatioMeasure")` followed by `.setByIndex(0, 0.5)` both hit
the identical `attribute_kind_of`/"Attribute access is only supported on entity instances" throw this
entry already documents -- and the zero-arg instance itself gets `id() === 0`, so there is no way to
even obtain a real, addressable id for such a value without this gap being fixed first, regardless of
how its value gets written). Ported `edit_surface_style.ts`'s own `editColourRgb`/dict-shaped
`editColourOrFactor`/`SpecularHighlight`-`null`-clearing branches completely and faithfully (none of
them need a standalone typed-value creation, all unaffected); the numeric-factor `editColourOrFactor`
branch still runs its own real, portable "remove the old real-id value first" step to completion
before throwing (matching real Python's own order of operations: the blocked create-and-assign step
is the very last thing that branch does), and `editSpecularHighlight`'s two blocked branches throw
immediately (no prior mutation exists in real Python for that function to preserve first).
`test/api/style/editSurfaceStyle.test.ts` pins the CURRENT, disclosed, blocked behavior for these
exact scenarios (matching `editPset.test.ts`'s own established precedent), each with a comment
recording the real, unblocked assertion to restore once this gap closes. See
`src/api/style/editSurfaceStyle.ts`'s own header comment for the full writeup.

**UPDATE 2026-09-15 (`api.drawing`/`api.control`/`api.pset_template` chunk, `pset_template.edit_prop_template` file):** found a sixth, independent
consequence -- `ifcopenshell.api.pset_template.edit_prop_template`'s `Enumerators`
special case needs to wrap each RAW enum value (e.g. `"FOO"`) into a standalone typed
value (`IfcLabel("FOO")`, or whatever `primary_measure_type` resolves to) via
`file.create_entity(primary_measure_type, v)` -- the identical
`attribute_kind_of`/"Attribute access is only supported on entity instances" throw this
entry already documents. Confirmed empirically against this exact worktree's own built
native addon before writing `editPropTemplate.ts`. Ported the whole function completely
and faithfully anyway: the generic attribute-setter loop and everything up through
resolving `propName`/`primaryMeasureType` inside the `Enumerators` branch is fully
functional and gets real, passing test coverage; only the actual
`file.createEntity(primaryMeasureType, v)` call itself throws, at the exact point real
Python would materialize the value, with no proactive guard -- matching
`editPset.ts`'s/`editSurfaceStyle.ts`'s own "let the native call fail naturally"
precedent rather than introducing a new pattern. `test/api/pset_template/
editPropTemplate.test.ts` pins this CURRENT, disclosed, blocked behavior with a
dedicated test (matching `editPset.test.ts`'s/`editSurfaceStyle.test.ts`'s own
established precedent), with a comment recording the real Python assertion
(`test_editing_an_enumeration`) to restore once this gap closes. See
`src/api/pset_template/editPropTemplate.ts`'s own header comment for the full writeup.
No other file in this 3-module, 11-file chunk (`api.drawing`/`api.control`/
`api.pset_template`) touches this gap at all -- every other `file.createEntity(...)`
call across the chunk creates a real, multi-attribute ENTITY (`IfcRelAssignsToProduct`/
`IfcRelAssignsToControl`/`IfcPropertySetTemplate`/`IfcSimplePropertyTemplate`/
`IfcPropertyEnumeration`), never a standalone simple/defined-type value.

**UPDATE 2026-09-16 (`api.structural` chunk, `edit_structural_boundary_condition.ts` file):** found a seventh, independent
consequence -- `ifcopenshell.api.structural.edit_structural_boundary_condition`'s
`"IfcBoolean"`/generic-measure-class branches (every `IfcBoundaryCondition` stiffness
attribute, e.g. `TranslationalStiffnessX`, is a SELECT type -- confirmed against the
generated `.d.ts`s: `unknown | null` -- so the caller names the concrete class,
`"IfcBoolean"` or a real measure class like `"IfcLinearStiffnessMeasure"`, to wrap the
raw value in) need `file.create_entity(data["type"], data["value"])` -- the identical
`attribute_kind_of`/"Attribute access is only supported on entity instances" throw this
entry already documents. Confirmed empirically against this exact worktree's own built
native addon before writing `editStructuralBoundaryCondition.ts`. Ported the whole
function completely and faithfully anyway: the `"string"`/`"null"` branch (a plain
`.set()` with the raw value, never touching `createEntity`) is fully functional and
tested; only the `"IfcBoolean"`/generic-class branches throw, at the exact point real
Python would materialize the value, with no proactive guard -- matching
`editPset.ts`'s/`editSurfaceStyle.ts`'s/`editPropTemplate.ts`'s own "let the native call
fail naturally" precedent. `test/api/structural/editStructuralBoundaryCondition.test.ts`
pins this CURRENT, disclosed, blocked behavior with 2 dedicated tests, each with a
comment recording the real, unblocked assertion to restore once this gap closes. See
`src/api/structural/editStructuralBoundaryCondition.ts`'s own header comment for the
full writeup. No other file across this 23-file, brand-new `api.structural` module
touches this gap at all -- every other `file.createEntity(...)` call in the module
creates a real, multi-attribute ENTITY (`IfcStructuralAnalysisModel`/
`IfcRelConnectsStructuralActivity`/`IfcBoundaryNodeCondition`/`IfcCartesianPoint`/
`IfcAxis2Placement3D`/`IfcDirection`/etc.), never a standalone valued simple/
defined-type instance.

**UPDATE 2026-09-16 (`api.cost` chunk, `edit_cost_value.ts`/`edit_cost_value_formula.ts`/`calculate_cost_item_resource_value.ts` files):** found an eighth,
independent consequence -- `ifcopenshell.api.cost.edit_cost_value`'s `AppliedValue`
branch (`file.createEntity("IfcMonetaryMeasure", value)`) and its `UnitBasis` branch
(`file.createEntity(measureClass, unitBasis.ValueComponent)`), plus (transitively)
`ifcopenshell.api.cost.edit_cost_value_formula`'s own `AppliedValue`-wrapping step for
every leaf formula operand, plus (transitively again)
`ifcopenshell.api.cost.calculate_cost_item_resource_value`'s own final
`edit_cost_value_formula` call for every resource -- all hit the identical
`attribute_kind_of`/"Attribute access is only supported on entity instances" throw this
entry already documents. Confirmed empirically against this exact worktree's own built
native addon while writing `editCostValue.test.ts`/`editCostValueFormula.test.ts`
(a real repro during test-writing, not assumed). This is a notably WIDE-impact instance:
`edit_cost_value_formula`'s real end-to-end usefulness (actually writing a computed
numeric cost value) is blocked for essentially every realistic formula today, and
`calculate_cost_item_resource_value` (which always ends in a real numeric formula) is
thus blocked for every resource with a resolvable cost too. Ported all three functions
completely and faithfully anyway: every attribute/step that does NOT need to
materialize a brand-new standalone typed value (the generic `setattr` loop for every
other `IfcCostValue`/`IfcCostItem`/`IfcCostSchedule` attribute; `Category`/
`ArithmeticOperator` bookkeeping; reusing an already-`ifc`-paired existing
sub-`IfcCostValue`; resolving resources/costs/quantities; `addCostValue`/naming) remains
fully functional and gets real, passing test coverage -- only the exact
`file.createEntity(<simple/defined-type>, <value>)` call itself throws, at the exact
point real Python would materialize the value, with no proactive guard, matching
`editPset.ts`'s/`editSurfaceStyle.ts`'s/`editPropTemplate.ts`'s/
`editStructuralBoundaryCondition.ts`'s own "let the native call fail naturally"
precedent. `editCostValue.test.ts`, `editCostValueFormula.test.ts`, and
`calculateCostItemResourceValue.test.ts` each pin this CURRENT, disclosed, blocked
behavior with dedicated tests, with comments recording the real, unblocked assertions to
restore once this gap closes. See `src/api/cost/editCostValue.ts`'s,
`src/api/cost/editCostValueFormula.ts`'s, and
`src/api/cost/calculateCostItemResourceValue.ts`'s own header comments for the full
writeup. No other file across this 20-file, brand-new `api.cost` module touches this gap
at all -- every other `file.createEntity(...)` call in the module creates a real
ENTITY (`IfcCostItem`/`IfcCostSchedule`/`IfcCostValue`/`IfcQuantity*`/`IfcRelNests`/
`IfcRelAssignsToControl`/`IfcDateAndTime`/`IfcCalendarDate`/`IfcLocalTime`), never a
standalone valued simple/defined-type instance -- confirmed by reading every real file
in the module, not assumed (`assignCostItemQuantity.ts`'s own `file.createEntity(ifcClass,
"Unnamed")` quantity-creation calls are unaffected: `IfcQuantityVolume`/etc. are genuine
multi-attribute ENTITY declarations, not simple/defined types, and their `.setByIndex(3,
result)` write is on an ALREADY-CONSTRUCTED real entity, not part of the initial
positional-args construction call).

**UPDATE 2026-09-16 (`api.georeference` chunk, `add_georeferencing.ts`/`edit_georeferencing.ts`
files):** found a ninth (and tenth) independent consequence -- blocking BOTH real IFC2X3
branches of a brand-new module. `ifcopenshell.api.georeference.add_georeferencing`'s
IFC2X3 branch needs `edit_pset(file, crs, properties={"Name": name})` (a brand-new
plain-string property on a just-created, empty pset) followed by three standalone
`file.createIfcLengthMeasure(0)`-equivalent constructions for `coordinate_operation`'s
own `Eastings`/`Northings`/`OrthogonalHeight` -- the first of these (the `editPset` call)
already hits the identical `attribute_kind_of`/"Attribute access is only supported on
entity instances" throw this entry already documents (its own fourth consequence, above),
so the function throws there, before the `IfcLengthMeasure` constructions are ever
reached. `add_georeferencing`'s optional `ifcClass: "IfcRigidOperation"` branch (IFC4X3
only) hits the SAME gate directly via its own `FirstCoordinate`/`SecondCoordinate`
`file.createIfcLengthMeasure(0)` calls. `ifcopenshell.api.georeference.edit_georeferencing`'s
IFC2X3 branch hits the identical gate too, but for a real, INDEPENDENTLY DISCOVERED reason
distinct from `editPset`'s own already-documented consequence: both of its own loops
compute a wrapped value (`file.createIfcText`/`createIfcLabel`/`createIfcIdentifier`/
`createIfcReal`/`createIfcLengthMeasure`) directly via `file.create_entity(class, v)` --
confirmed, by reading the real source line-by-line, to be genuine DEAD CODE (a real,
independently-confirmed Python bug: the computed value is reassigned to a loop-local
variable that is NEVER written back into the `properties`/`coordinate_operation` dict,
so `edit_pset` is subsequently called with the ORIGINAL, unmodified dict) -- meaning this
port's own faithful reproduction of that dead computation throws on the very FIRST loop
iteration, before `edit_pset` is ever reached at all. Confirmed empirically against this
exact worktree's own built native addon before writing both files. Ported both functions
completely and faithfully anyway: every code path up to the exact blocked call (both
`addPset` calls in `add_georeferencing`'s IFC2X3 branch; the real `get_pset`/`file.by_id`
pset-lookup steps in `edit_georeferencing`'s IFC2X3 branch; the `SourceCRS`/`TargetCRS`
real-entity setup in `add_georeferencing`'s `IfcRigidOperation` branch) runs to completion,
then throws naturally with no proactive guard, matching every other confirmed consequence
of this same gap. `test/api/georeference/addGeoreferencing.test.ts`/
`editGeoreferencing.test.ts` each pin this CURRENT, disclosed, blocked behavior with
dedicated tests, with comments recording the real, unblocked assertions to restore once
this gap closes. See `src/api/georeference/addGeoreferencing.ts`'s and
`src/api/georeference/editGeoreferencing.ts`'s own header comments for the full writeup.
The rest of this brand-new module (`editTrueNorth`, `editWcs`, `removeGeoreferencing`,
and both functions' own IFC4+ default paths) is fully functional and unaffected by this
gap -- confirmed by reading every real file in the module, not assumed.

**UPDATE 2026-09-16 (`util.data`/`api.geometry` `clip_solid*` chunk):** found an
eleventh (and twelfth) independent consequence -- `ifcopenshell.api.geometry.clip_solid`'s
and `clip_solid_bounded`'s own `element` parameter, when provided, always ends in an
`edit_pset(file, pset=pset, properties={"Data": json.dumps(data)})` call writing a plain
JS `string` -- the identical `attribute_kind_of`/"Attribute access is only supported on
entity instances" throw this entry already documents (this module's own fourth
consequence, above). Confirmed empirically against this exact worktree's own built
native addon before writing `clipSolid.ts`/`clipSolidBounded.ts`. Unlike several earlier
consequences of this gate, this one is NOT narrower on the "existing pset" path: both
functions' `element` branch is byte-for-byte the same `get_pset`/`add_pset`/`edit_pset`
shape (confirmed by reading both real Python sources side by side), and `edit_pset`'s own
"update an EXISTING property" path needs `cast_value_to_primary_measure_type` just as much
as its "create a NEW property" path does (per this entry's own fourth-consequence update,
above) -- so EVERY call with `element` provided throws here, whether `pset` was just
created by `add_pset` or already existed from an earlier call. Ported both functions
completely and faithfully anyway: `calculate_unit_scale`, `Clipping.apply`/the inline
half-space-solid construction, and the full `get_pset`-or-`add_pset` pset lookup/creation
logic all run to completion; only the final `edit_pset` call itself throws, at the exact
point real Python would materialize the value, with no proactive guard -- matching
`editPset.ts`'s/`addGeoreferencing.ts`'s own "let the native call fail naturally"
precedent. `test/api/geometry/clipSolid.test.ts`/`clipSolidBounded.test.ts` each pin this
CURRENT, disclosed, blocked behavior with dedicated tests, with comments recording the
real, unblocked assertions (`test_element_registers_result_in_bbim_boolean`/
`test_element_appends_to_existing_bbim_boolean`) to restore once this gap closes. See
`src/api/geometry/clipSolid.ts`'s and `src/api/geometry/clipSolidBounded.ts`'s own header
comments for the full writeup. The `element`-omitted path of both functions, and
`add_axis_representation` (a separate file in this same chunk, no `element`/pset logic at
all), are fully functional and unaffected by this gap.

**UPDATE 2026-09-17 (`api.alignment` chunk 1 of many, `has_zero_length_segment.ts`
file):** found a thirteenth independent consequence -- this time in TEST-FIXTURE
construction rather than in ported production code. `has_zero_length_segment`'s own
`IfcCompositeCurve`/`IfcGradientCurve`/`IfcSegmentedReferenceCurve` branch reads a
wrapped `IfcCurveSegment.SegmentLength` (an `IfcCurveMeasureSelect` SELECT-typed
attribute, confirmed `unknown` in the generated `.d.ts`s). Building a real regression
test for this branch requires constructing a fresh, standalone declared-type value
(e.g. `file.createEntity("IfcLengthMeasure", 0)`) to assign there -- confirmed
EMPIRICALLY, while writing `test/api/alignment/hasZeroLengthSegment.test.ts`, to throw
the identical `attribute_kind_of`/"Attribute access is only supported on entity
instances" this entry already documents. Unlike every earlier consequence above, this
one never appears in any SHIPPED production code path at all -- `has_zero_length_segment
.ts`'s own ported logic for this branch (`wrappedValueOf`'s `.getByIndex(0)` read) is a
READ, not a write, and reads of an already-existing wrapped value are unaffected by this
gap (only *constructing* one via `createEntity` is blocked); the gap only blocked this
chunk's own attempt to build a fresh TEST FIXTURE exercising that read. No proactive
workaround was added -- the composite-curve branch's own dedicated test was left out of
`hasZeroLengthSegment.test.ts` entirely (with a header-comment cross-reference to this
entry) rather than forcing a broken fixture, matching this project's "disclose, don't
work around" discipline. Real Python's own `test_has_zero_length_segment.py` doesn't
exercise this branch either (only the horizontal/vertical/cant branch, which needs no
standalone typed value and IS fully tested here). See `src/api/alignment
/hasZeroLengthSegment.ts`'s own header comment and `test/api/alignment
/hasZeroLengthSegment.test.ts`'s own header comment for the full writeup.

**UPDATE 2026-09-17 (`api.alignment` chunk 2 of many -- a scope-narrowing clarification,
not a new consequence):** while building `getAlignmentStartStation.test.ts`/
`distanceAlongFromStation.test.ts`'s own real fixtures (`Pset_Stationing.Station`,
`IfcPointByDistanceExpression.DistanceAlong` -- both SELECT-typed), confirmed
EMPIRICALLY against this chunk's own freshly-built native addon that this gate is
narrower than the thirteenth consequence above might suggest: assigning a raw JS
`number` directly to an ALREADY-REAL entity's own SELECT-typed attribute -- e.g.
`file.createEntity("IfcPointByDistanceExpression", 100.0, null, null, null, curve)` or
`somePointByDistanceExpression.set("DistanceAlong", 100.0)` -- works FINE end to end
(the raw number round-trips through `.get()` unchanged, confirmed with
`IfcPropertySingleValue.NominalValue` too). The gate only fires for constructing a
STANDALONE simple/defined-type instance BY NAME (`file.createEntity("IfcLengthMeasure",
100.0)`, or a zero-arg one followed by `.setByIndex(0, ...)`) -- exactly what this
entry's own title and every consequence above actually describe, so this is not a
correction to any of them, just a previously-undocumented boundary of the SAME gate.
This does not retroactively unblock `hasZeroLengthSegment.test.ts`'s own uncovered
branch above -- that branch reads `IfcCurveSegment.SegmentLength` off an ALREADY-BUILT
fixture rather than assigning a fresh raw value to it, so re-visiting that one specific
test is a decision for whoever next touches that file, not done here (out of this
chunk's own scope: 5 unrelated files). Did let this chunk's own two files build fully
real, populated fixtures instead of disclosed-uncoverable ones -- see
`src/api/alignment/getAlignmentStartStation.test.ts`'s own header comment for the full
writeup.

**UPDATE 2026-09-17 (`api.alignment` chunk 4 of many, `addPositioningReferent.ts`/
`addStationingReferent.ts`/`updateKeyPointReferents.ts` files):** found a fourteenth
independent consequence -- and, distinctively, the FIRST one confirmed to combine with
an entirely SEPARATE, already-disclosed consequence of this SAME gate (this entry's
own "fourth consequence" update, `api.pset` `edit_pset` chunk) to block BOTH branches
of 3 functions at once, not just one. All 3 files construct a placement via
`file.createIfcLinearPlacement(RelativePlacement=file.createIfcAxis2PlacementLinear(
Location=file.createIfcPointByDistanceExpression(DistanceAlong=file.createIfcLengthMeasure(
distance_along), ...)))` whenever `curve` is a real, non-empty `IfcCompositeCurve` --
the identical `attribute_kind_of`/"Attribute access is only supported on entity
instances" throw this entry already documents, re-confirmed EMPIRICALLY
(`file.createEntity("IfcLengthMeasure", 1.0)` throws) against this chunk's own
freshly-built native addon before writing any of the 3 files. Separately, and
regardless of that branch, ALL 3 files' own `editPset(file, {pset, properties:
{Station: station}})` call (creating a brand-new `Pset_Stationing.Station` property)
hits this entry's own already-documented "fourth consequence" (the `api.pset`
`edit_pset` chunk's finding) -- also re-confirmed EMPIRICALLY for this chunk's own
exact call shape. The result: for `addPositioningReferent`/`addStationingReferent`/
`updateKeyPointReferents`, BOTH of the real Python function's two placement branches
are currently non-functional end to end in this port, just at different points -- the
composite-curve branch throws immediately (no side effect at all); the non-composite-
curve fallback-placement branch reaches much further (constructs a real, addressable
`IfcReferent` with a correct `Name`/`PredefinedType`/`ObjectPlacement`, and a real,
empty `Pset_Stationing` via `addPset`) before throwing at the `editPset` gap instead.
Ported all 3 files completely and faithfully anyway -- every line, every branch,
including each file's own portable `else` construction and (for
`updateKeyPointReferents`) its fully-portable validation/zero-real-segments early
return/`clear=true` referent-removal cleanup (a pure deletion path untouched by either
gap) -- with no proactive guard anywhere; each throws naturally at whichever of the 2
gaps its own `curve` shape reaches first. `addPositioningReferent.test.ts`/
`addStationingReferent.test.ts`/`updateKeyPointReferents.test.ts` each pin the CURRENT,
disclosed, blocked behavior for both branches with dedicated regression tests,
including one confirming `addStationingReferent`'s own `onBasisCurve` curve-selection
logic (`getBasisCurve` vs. `getCurve`) still resolves correctly despite the blocker --
observable because the two curve choices, in a fixture deliberately built so they
differ, hit DIFFERENT gaps. `updateAlignmentParameterSegmentTags.ts` (this chunk's
5th file) touches NEITHER gap at all -- confirmed `IfcAlignmentParameterSegment
.StartTag`/`EndTag` are plain `string | null` attributes on an already-real entity
(not SELECT-typed), directly against `ifc4x3.d.ts` -- and is fully portable, with full,
real, passing test coverage porting every one of real Python's own
`test_update_alignment_parameter_segment_tags.py` assertions. See
`src/api/alignment/addPositioningReferent.ts`'s own header comment for the full
writeup (reused verbatim by `addStationingReferent.ts`'s/`updateKeyPointReferents.ts`'s
own header comments).

**UPDATE 2026-09-18 (`api.sequence` chunk 1 of many, `assignLagTime.ts` file):** found a
fifteenth independent consequence -- and, distinctively, one that blocks a function's
ENTIRE body on EVERY schema, not just one branch or one schema. `assign_lag_time.py`'s
very first real statement (`file.create_entity("IfcDuration",
util.date.datetime2ifc(lag_value, "IfcDuration"))`) constructs a brand-new, standalone,
VALUED `IfcDuration` -- the identical `attribute_kind_of`/"Attribute access is only
supported on entity instances" throw this entry already documents, confirmed empirically
against this chunk's own freshly-built native addon (IFC4/IFC4X3) before writing the
file. Ported completely and faithfully anyway, left to fail naturally at that first line
-- `test/api/sequence/assignLagTime.test.ts` pins this CURRENT, disclosed, blocked
behavior with a dedicated test per schema. On IFC2X3, the function fails even earlier and
for an entirely INDEPENDENT reason (`IfcDuration` itself doesn't exist on that schema --
it's an IFC4+-only defined type, confirmed empirically: `"Entity with name 'IfcDuration'
not found in schema 'IFC2X3'"`), so IFC2X3 never actually reaches this gate at all -- both
throws are pinned separately in the same test file. See
`src/api/sequence/assignLagTime.ts`'s own header comment for the full writeup.

**UPDATE 2026-09-22 (CI `SCHEMA_VERSIONS` widening reconciliation chunk, PR #170):** two
already-documented consequences above (`addApplication.ts`'s IFC4X3 branch, "third
consequence" above; `addGeoreferencing.ts`'s IFC2X3 branch, "ninth/tenth consequence"
above) turned out to have a SECOND, previously-unnoticed caller each, both in
`test/api/project/appendAsset.test.ts`: its own "appends owner history without producing
duplicates" test calls `addApplication(library, {})` with no explicit
`applicationDeveloper` (hitting the IFC4X3 branch), and its own "appends a product when
projects have different georeferencing" test calls `addGeoreferencing(file, {})` on an
IFC2X3 file (hitting that branch) -- neither test had ever actually run in CI before
(IFC2X3/IFC4X3 were never built there until this same PR's own CI-widening commit), so
neither exposure was previously visible. Both are pre-existing, already-fully-diagnosed
consequences of this same gap, not new root causes -- fixed by excluding each one
specific schema case from that one test's own parametrization
(`test.skipIf(schema === "IFC4X3"/"IFC2X3")`), matching this file's own established
per-test-exclusion precedent (e.g. `assignLagTime.test.ts`'s own IFC2X3 case just above),
with a comment citing back to this entry. No source changes needed for either.

**UPDATE 2026-09-23 (Phase EX-2 chunk 4, EXPRESS derived-attribute porting) -- CORRECTED same
day, see the next UPDATE:** chunk 4 initially assumed (without attempting construction) that
`calc_IfcDerivedUnit_Dimensions`/`calc_IfcSIUnit_Dimensions` were blocked by this gate, since
both construct a fresh `IfcDimensionalExponents` and this looked structurally similar to
`IfcLineIndex`/`IfcArcIndex` below. This assumption was flagged by chunk 4 itself as an
unverified "secondhand observation," and turned out to be wrong -- see the dedicated
investigation below.

**UPDATE 2026-09-23 (dedicated investigation, no PR -- investigation only, requested by the
orchestrating session after noticing this gate is referenced by 34 files, far more than
previously tracked in this entry's own history):**

**Correction to the update above:** `IfcDimensionalExponents` is a real ENTITY (7 plain
non-optional INTEGER attributes), not a defined type -- confirmed directly against the compiled
schema data (`src/ifcparse/schemas/Ifc2x3-schema.cpp:355` declares it via `new entity(...)`;
line 1171 sets its 7 `simple_type::integer_type` attributes) and independently re-confirmed by
the orchestrating session via live execution against a real installed `ifcopenshell` 0.8.4
interpreter (`f.create_entity("IfcDimensionalExponents", 0,0,0,0,0,0,0)` then
`.LengthExponent = 5` both succeed with zero special handling). Real Python's own generated
rule file constructing it (`IFC2X3.py`'s `IfcDeriveDimensionalExponents`) is therefore just
ordinary entity construction + attribute mutation -- ALREADY fully supported by this port's
existing `createEntity`/`.set()` path, the same as `IfcCartesianPoint` or any other entity. This
gate does NOT block `calc_IfcDerivedUnit_Dimensions`/`calc_IfcSIUnit_Dimensions` after all --
they were simply left unported on a mistaken assumption, not a real primitive gap. (Defined
types never get their own generated `.d.ts` interface -- confirmed neither `IfcLabel` nor
`IfcLineIndex`/`IfcArcIndex` appear anywhere in `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`, they're
inlined as `string`/`number`/arrays on the attributes that use them -- `IfcDimensionalExponents`
getting a real `export interface` in `generated/ifc2x3.d.ts:1411` was itself the tell.)

**The real, much bigger finding from this investigation: the actual fix is small, needs no new
native primitive, and the true blast radius is 34 files across 10+ modules, not a handful.**

- **Fix mechanism (confirmed, not just theorized):** `src/ifcparse/schema.h`'s `declaration`
  base class already has a `type_declaration` subclass (line 181) with a `declared_type()`
  accessor requiring zero entity/attribute context, and `src/ifcparse/utils.cpp:204`
  (`ifcopenshell::from_parameter_type`) is a free function -- already used by this exact gate's
  own `attribute_kind_of` today, just fed `attribute->type_of_attribute()` -- that resolves a
  bare `parameter_type*` straight to the right `argument_type` (BOOL/INT/DOUBLE/STRING/
  ENUMERATION/AGGREGATE_OF_*) with no entity involved at all. The fix: in
  `attribute_value_shim.cpp`'s `entity_declaration_of`/`attribute_declaration_at` (lines 22-36),
  when `instance.declaration().as_entity() == nullptr`, check `.as_type_declaration()` instead;
  if non-null, call `from_parameter_type(type_decl->declared_type())` directly (a bare
  simple/defined-type instance only ever has attribute index 0, matching
  `entityInstance.ts:260-263`'s existing `attributeCount()` convention). Everything else
  (a bare `select_type`/`enumeration_type` instance, which no disclosed consequence below
  actually needs) keeps throwing as today. Estimated size: ~15-25 lines, one file, no
  N-API signature changes (so no wrappergen regeneration needed).
- **Scope confirmed shim-only** by tracing 3 real disclosed consequences end-to-end
  (`util.migrator`, `util.shapeBuilder`'s `IfcLineIndex`/`IfcArcIndex`, `api.pset.editPset`'s
  `cast_value_to_primary_measure_type`) -- all three read back to this identical single gate
  with no additional layered blocker; construction itself (`file.ts:484-513`) and the read path
  (`getByIndex`/`get_attribute_value_variant`) are both already ungated.
- **Real blast radius: 34 files** (9 source + 25 test, `grep -rl` count) across `util.migrator`,
  `util.shapeBuilder`, `util.unit`, `api.pset`, `api.style`, `api.structural`, `api.geometry`
  (`clipSolid`, `clipSolidBounded`, `addDoorRepresentation`, `addWindowRepresentation`,
  `regenerateWallRepresentation`, `validateType`, `addRailingRepresentation`), `api.sequence`
  (`editLagTime`, `assignLagTime`), `api.unit` (`addConversionBasedUnit`, `removeUnit`,
  `assignUnit`), `api.owner.addApplication`, `api.georeference` (`addGeoreferencing`,
  `editGeoreferencing`), `api.alignment` (several), `api.root.removeProduct`,
  `api.project.appendAsset` -- at least 31 literal occurrences of the disclosed-throw assertion
  across those test files (likely somewhat higher; a few TODOS-disclosed consequences assert on
  a substring/pattern rather than the exact string and didn't show up in a literal grep). This is
  materially bigger than the EX-2 `Dim`-gap unblocking precedent (PRs #170/#172, 44 test updates,
  one schema's derived-attribute rules) both in file count and module breadth.
- **Risk**: low-to-moderate. The new branch only fires where the code unconditionally throws
  today (no existing passing behavior to regress); the main residual risk is `from_parameter_type`
  being reused in a genuinely new calling context for the first time, worth dedicated native-layer
  regression tests (fresh `IfcLabel`/`IfcLineIndex`/`IfcDuration` instances) rather than relying
  solely on the 30+ TS-level test flips to catch a regression. Needs a real native addon rebuild +
  this project's normal native-addon CI verification, not a TS-only change.
- **Recommended phasing** (two kinds of chunk, not one): Chunk 1 = the ~20-line native shim fix +
  new native-layer regression tests + full addon rebuild + verification, reviewed on its own since
  it's foundational `entityInstance.ts`/native-shim surface touched by dozens of already-shipped
  modules (matches this entry's own long-standing "flag for the orchestrating session's review,
  don't fix silently" instruction). Chunks 2+ = module-grouped follow-ups (plausibly 3-5 chunks
  given 25+ test files across 9+ modules) flipping each disclosed "pins the current blocked
  behavior" assertion to the real, working one most files already record in a comment for exactly
  this purpose.

Key file/line references: `src/ifcparse/schema.h:141-195`; `src/ifcparse/utils.cpp:204-249`;
`src/wrappergen/shim/attribute_value_shim.cpp:22-36,387-422,437-440`;
`src/ifcopenshell-ts/src/entityInstance.ts:260-263,301-307,475-513`;
`src/ifcopenshell-ts/src/file.ts:484-513`;
`src/ifcparse/schemas/Ifc2x3-schema.cpp:355,1171` and `Ifc4-schema.cpp:503,510`.

</details>

### `EntityInstance.getByIndex`/`wrapValue` collapse EXPRESS INTEGER vs. REAL into one JS `number`, losing Python's `isinstance(value, float)` distinction

**What:** Python's `entity_instance.wrappedValue` (and any unwrapped scalar attribute read generally)
preserves whether the underlying STEP literal was INTEGER-typed (`232`) or REAL-typed (`232.`) as a
real Python `int` vs. `float` object. This port's `EntityInstance.getByIndex`/`wrapValue` returns a
plain JS `number` for both (the native shim's `get_attribute_value_variant` *does* distinguish
`ATTRIBUTE_VALUE_KIND_INTEGER` from `ATTRIBUTE_VALUE_KIND_DOUBLE` -- the distinction is lost only when
crossing into a JS `number`, not lost at the native layer itself). `Number.isInteger(value)` is not a
safe substitute: `232` and `232.` parse to the *identical* IEEE-754 value with zero fractional part,
so a whole-number REAL literal is indistinguishable from an INTEGER one by value alone, only a
genuinely fractional REAL (`232.5`) is reliably detectable this way.

**Why this matters:** `util/migrator.ts`'s `Migrator.migrate`/`migrateClass` (Phase 3, `util.migrator`
chunk, 2026-09-10) need this exact distinction for two IFC4 -> IFC4X3 class retypings
(`IfcCountMeasure` -> `IfcNumericMeasure`, `IfcQuantityCount` -> `IfcQuantityNumber`, both keyed on
"was the source value REAL-typed") and currently use the lossy `Number.isInteger(...) === false` as a
best-effort approximation, disclosed in that file's own header comment (finding 2) and its own test
file. `/code-review` (reviewing that chunk's PR) flagged this as a broader architectural concern worth
its own tracked entry, not just a `Migrator`-local footnote: the *right* place to preserve this
distinction is `entityInstance.ts`'s own value-unwrapping layer (so every future caller gets a
correct answer for free), not a symptom-fix reinvented independently by each caller that happens to
need it.

**Fix:** Give `EntityInstance` some way to expose the native `attribute_value_variant`'s actual kind
(INTEGER vs. DOUBLE) alongside (or instead of) the unwrapped JS `number` -- e.g. a paired
`getByIndexTyped`-style accessor, or a documented convention for recovering it via the already-bound
`attribute_kind_of`/`type()` primitives where an owning attribute/declaration context is available.
Needs design thought (a bare `number` return type is baked into `getByIndex`'s existing public
signature/every existing caller) -- not a one-line fix, hence its own tracked entry rather than being
folded into the entry above.

**Context:** Surfaced during Phase 3's `util.migrator` chunk (2026-09-10), flagged by `/code-review`'s
review of that chunk's PR. See `util/migrator.ts`'s own header comment (finding 2) for the original
disclosure and the two exact call sites using the lossy heuristic.

**Second occurrence (2026-09-11):** Phase 3's `util.selector` `format()` chunk (`src/util/selector.ts`)
hit the exact same gap, and more broadly than just `number()`: Python's `str()`/format-spec rendering
of a Python `int` (`5` -> `"5"`) differs from a `float` (`5.0` -> `"5.0"`) of the same value, confirmed
against the real Python package (`format('concat({{material.item.LayerThickness.0}})', wall)` renders
`"5.0"` in real Python for a whole-number REAL attribute, `"5"` in this port). `number()`'s own
`resolveNumberArgVal` at least gets a *literal* argument's int/float-ness exactly right (Python's own
`float(x) if "." in x else int(x)` re-derivation, ported faithfully), falling back to the lossy
`Number.isInteger(...)` heuristic only for a `{{...}}`-sourced value — but the file's shared `pyStr`
helper (backing `concat`/`lower`/`upper`/`title`/`substr`, plus `opAdd`'s string-concatenation
fallback) has *no* int/float signal available at all for a raw JS `number` and always renders via
plain `Number.prototype.toString()`, silently indistinguishable from Python's own `int` rendering.
Disclosed in that file's own "format()" section header comment (divergence 2) and its own test file.
This is exactly the "second caller reinvents the same lossy heuristic" scenario this entry already
called out below — still not fixed at the root, now two independent call sites (one of them itself
multiple internal callers) depend on it.

**Depends on / blocked by:** Nothing blocking; independent design work in `entityInstance.ts` (Phase
2, already-shipped code). Low practical impact today (only `util/migrator.ts`'s two retyping checks
and `util/selector.ts`'s `format()` — both its `number()` function and its shared `pyStr` helper —
currently depend on this distinction, and only for whole-number REAL literals specifically), but worth
fixing at the root now that a second caller has reinvented the same lossy heuristic.

**Update (Phase 3, `util.selector`'s `filter_elements` chunk, 2026-09-10):** a second caller now hits
this exact same gap, predicted by this entry's own last line. `FacetTransformer.compare()`
(`src/util/selector.ts`'s `compareValues`) branches on Python `isinstance(element_value, int)` vs.
`isinstance(element_value, float)` to decide strict-`int`-string-parsing vs. permissive-`float`-string-
parsing for a query's numeric comparison value (e.g. `Foobar.Baz>"100.5"`). Unlike `util.migrator`'s
two narrow, specific retyping checks, this is a *general-purpose* numeric-comparison path exercised by
every `attribute`/`property`/`query:` facet -- a broader, more visible surface for the same root gap.
`compareValues` resolves it the same way this entry recommends avoiding (a caller-local heuristic,
here "always parse permissively via `pythonFloat`, regardless of source EXPRESS type"), disclosed in
`src/util/selector.ts`'s header comment (finding 2) and `test/util/selector.test.ts`'s dedicated test.
Reinforces (doesn't change) this entry's fix/priority -- now two independent, disclosed call sites
would benefit from the same root-level fix.

---

### `util.selector.get_element_value`'s positional/geolocated keys and `"profiles"`'s extrusion
### fallback -- genuinely blocked, not yet portable (positional `x`/`y`/`z`/`easting`/`northing`/
### `elevation`/`rotation_x`/`rotation_y`/`rotation_z` ALL RESOLVED -- `rotation_*` fixed
### 2026-09-25 during the TODOS.md sweep, once `util.shape_builder` landed; only
### `"profiles"`'s extrusion fallback remains)

**What:** Phase 3's `util.selector` chunk (`src/util/selector.ts`, `get_element_value`/the
key-path mini-language) originally ported every key `_get_element_value` supports except two
genuine, disclosed hard blockers, both throwing a clear, descriptive error naming the real
missing Python modules rather than being stubbed or silently dropped:

1. **The positional/geolocated keys** `x`/`y`/`z`/`easting`/`northing`/`elevation`/`rotation_x`/
   `rotation_y`/`rotation_z`. Python's `_get_element_value` calls
   `ifcopenshell.util.placement.get_local_placement` (all nine keys), plus
   `ifcopenshell.util.geolocation.auto_xyz2enh` (the `easting`/`northing`/`elevation` trio), plus
   `ifcopenshell.util.shape_builder.np_matrix_to_euler` (the `rotation_*` trio) -- none of
   `util.placement`/`util.geolocation`/`util.shape_builder` were ported yet at the time.

   **UPDATE 2026-09-11 (Phase 4's `util.placement` chunk):** `util.placement` has now landed
   (`src/util/placement.ts`). `x`/`y`/`z` are RESOLVED -- `getElementValueForKeys` now calls the
   real `getLocalPlacement` and reads the translation column directly (`positionalXyzValue` in
   `selector.ts`), caught and fixed by that chunk's own `/code-review` pass (an earlier version of
   this entry, and the error message `throwPositionalKeyBlocked` used to throw, had gone stale the
   moment `util.placement` merged, since it still claimed `get_local_placement` itself wasn't
   ported). `easting`/`northing`/`elevation` and `rotation_x`/`rotation_y`/`rotation_z` remain
   genuinely blocked -- `util.geolocation`/`util.shape_builder` are still not ported. The blocker
   only fires when Python itself would actually need the unported math (a real, *set*
   `ObjectPlacement`) -- these six keys still return `null` (matching Python) when the element's
   class has no `ObjectPlacement` at all, or when it's declared but left unset.

   **UPDATE 2026-09-11 (Phase 4's `util.geolocation` chunk, same day):** `util.geolocation` has now
   also landed (`src/util/geolocation.ts`). `easting`/`northing`/`elevation` are ALSO RESOLVED --
   `getElementValueForKeys` now calls the real `autoXyz2enh` (`positionalEnhValue` in
   `selector.ts`), reusing the same translation-column read `positionalXyzValue` already does (via
   a new shared `matrixTranslation` helper) and the original top-level element's `.file` (a real,
   confirmed-against-the-source subtlety -- Python's `auto_xyz2enh(element.file, *xyz)` uses the
   *original* `element` parameter, not the loop's own traveling `value`; `getElementValueForKeys`
   now captures that as `rootElement` for this one call). Only `rotation_x`/`rotation_y`/
   `rotation_z` remain genuinely blocked now -- `util.shape_builder` (a separate module,
   untouched by this update) is still not ported.

2. **`"profiles"`'s extrusion-based fallback path.** `ifcopenshell.util.shape.get_profiles`'s
   `IfcMaterialProfileSet` path is fully ported (self-contained, via already-ported
   `util.element.getMaterial`), but its fallback (`ifcopenshell.util.shape.get_extrusions`, used
   when the element has no material profile set) transitively calls
   `ifcopenshell.util.representation.get_representation`/`.resolve_representation` -- real
   representation-item graph resolution (including `IfcMappedItem` indirection), not a narrow,
   self-contained lookup like the `findBodyRepresentation`/`getElementSystemsNarrow`-style
   re-implementations this same chunk used for the `classification`/`system`/`zone` keys. Neither
   `util.shape` nor `util.representation` was ported yet at the time. Still fully blocked, unaffected
   by the `util.placement` landing above.

   **UPDATE 2026-09-11 (Phase 4's `util.representation` chunk):** `util.representation` has now
   landed (`src/util/representation.ts`), resolving the `util.representation.get_representation`/
   `.resolve_representation` half of `get_extrusions`' own dependency chain. `ifcopenshell.util.shape`
   itself (both `get_extrusions` and `get_profiles`) is still not ported -- a separate module,
   explicitly out of that chunk's own scope -- so this key is still genuinely blocked, just on a
   narrower gap now. `getProfilesNarrow`'s error message in `src/util/selector.ts` was updated to
   name only the real remaining gap (`util.shape`), not `util.representation` too.

**Why deferred rather than attempted:** Same category as `convert_file_length_units` above -- a
genuine cross-module hard blocker, not a "split into a follow-up chunk" situation. Porting only a
narrow slice of `util.shape_builder`/`util.representation` just to unblock these specific keys
would be real, disclosed scope creep into later-phase work (`util.representation` is a substantial
module in its own right), not a small addition.

**Fix:** Port `ifcopenshell.util.shape_builder` to unblock the remaining `rotation_*` keys; port
`ifcopenshell.util.representation`'s `get_representation`/`resolve_representation` (Tier B) to
unblock `"profiles"`'s extrusion fallback. Once each lands, the corresponding branch in
`src/util/selector.ts`'s `getElementValueForKeys` is a small, mechanical follow-up (replace the
`throwPositionalKeyBlocked`/`getProfilesNarrow` blocker call with the real computation) -- the
grammar/key-resolution plumbing around it is already fully ported and tested, and `x`/`y`/`z`'s/
`easting`/`northing`/`elevation`'s own resolution above is the concrete precedent for how
mechanical that follow-up is once the underlying module lands.

**Context:** Surfaced during Phase 3's `util.selector` (key-path mini-language) chunk
(2026-09-10) -- see that chunk's own PR description for the full disclosure. Positional `x`/`y`/`z`
resolved during Phase 4's `util.placement` chunk (2026-09-11), caught by that chunk's own
`/code-review` pass rather than planned from the start; `easting`/`northing`/`elevation` resolved
the same day by Phase 4's `util.geolocation` chunk.
`test_selector.py::TestGetElementValue.test_selecting_an_elements_rotation_using_a_query` still has
no full TS counterpart (only exercises `rotation_*`, still blocked) -- this port's own test covers
only the parts it *can* reproduce: the blocker firing with a clear error for the still-blocked
`rotation_*` keys, the real `x`/`y`/`z`/`easting`/`northing`/`elevation` computation, and the
no-`ObjectPlacement`-set `null` case.

**Depends on / blocked by:** Item 1's `x`/`y`/`z`/`easting`/`northing`/`elevation`/`rotation_x`/
`rotation_y`/`rotation_z` are ALL now resolved. Only `"profiles"`'s extrusion fallback remains,
blocked on `util.shape` landing (`util.representation` resolved 2026-09-11) -- Tier B,
`planning/ifcopenshell-ts/20-roadmap.md` Phase 4-ish, not yet scheduled in detail.

**RESOLVED 2026-09-25 (`rotation_x`/`rotation_y`/`rotation_z`, found during the TODOS.md sweep):**
`util.shape_builder` had already landed (`util/shapeBuilder.ts`'s `npMatrixToEuler`) but the
mechanical follow-up this entry's own "Fix" section already anticipated was never done.
`src/util/selector.ts`'s `positionalRotationValue` now calls the real `npMatrixToEuler` on the same
matrix the `x`/`y`/`z` branch already computes, converting radians to degrees exactly like real
Python's own `np.degrees` call -- `throwPositionalKeyBlocked` removed entirely (no longer
reachable). `test/util/selector.test.ts` now has a full port of real Python's own
`test_selecting_an_elements_rotation_using_a_query`, verified against the exact expected values
(0, 0, 30 degrees for a 30° Z-rotation).

---

### `util.representation.getReferenceLine`'s `util.shape.get_base_extrusions` fallback

**RESOLVED (`util.shape` chunk, 2026-09-12).** `ifcopenshell.util.shape.get_base_extrusions` is now
ported for real (`src/util/shape.ts`'s `getBaseExtrusions`, no kernel dependency -- see that file's
own header comment), and `getReferenceLine`'s `elif` fallback branch is wired up to call it directly,
replacing the thrown-error stub described below. See `representation.ts`'s own header comment and
`getReferenceLine`'s doc comment for the full resolution (including a real Python
empty-list-is-falsy subtlety in the `elif extrusions := get_base_extrusions(wall):` check, preserved
verbatim: `extrusions.length > 0`, not just non-null, gates the fallback branch).

**What (historical, kept for context):** Python's `get_reference_line` is `if axis :=
get_representation(wall, "Plan", "Axis", "GRAPH_VIEW"): ... elif extrusions :=
ifcopenshell.util.shape.get_base_extrusions(wall): ...`. The primary path (a real
"Plan"/"Axis"/"GRAPH_VIEW" `IfcShapeRepresentation` containing an `IfcPolyline`/`IfcIndexedPolyCurve`)
was fully ported in `src/util/representation.ts`'s `getReferenceLine` from the start. The `elif`
fallback -- reached only when the wall has no such axis representation at all -- needed
`ifcopenshell.util.shape.get_base_extrusions`, a separate, not-yet-ported Tier B module at the time
(explicitly out of that chunk's own scope); `getReferenceLine` threw a clear, disclosed error in
exactly that one case (verified against the real `if`/`elif` control flow: a wall WITH an axis
representation, even one whose items don't match `IfcPolyline`/`IfcIndexedPolyCurve`, falls through to
the ordinary fallback-length return without ever touching this blocker, matching Python's own
fall-through behavior).

**Context:** Surfaced during Phase 4's `util.representation` chunk (2026-09-11). Resolved during the
`util.shape` chunk (2026-09-12).

---

### `util.representation.guessType`'s `Curve2D`/`Curve3D`/`Surface2D`/`Surface3D` branches are blocked by the pre-existing `entityInstance.ts` DERIVED-attribute gap

**What:** `guess_type`'s `Curve2D`/`Curve3D`/`Surface2D`/`Surface3D` branches read `i.Dim` --
`IfcCurve.Dim`/`IfcSurface.Dim` are real EXPRESS DERIVED attributes (`DERIVE Dim :=
IfcCurveDim(SELF)`/`IfcSurfaceDim(SELF)`; `IfcCurveDim` alone is a genuinely non-trivial ~20-line
recursive function spanning `IfcLine`/`IfcConic`/`IfcPolyline`/`IfcTrimmedCurve`/
`IfcCompositeCurve`/`IfcBSplineCurve`/`IfcOffsetCurve2D`/`3D`/`IfcPcurve`/`IfcIndexedPolyCurve`,
confirmed by reading the real `ifcopenshell.express.rules.*` generated rule modules). Real Python
resolves this via `ifcopenshell.express.rules.<schema>`'s compiled EXPRESS-rule module
(`entity_instance.py`'s `__getattr__`, DERIVED-category branch); this TS port's `EntityInstance.get()`
has no such fallback at all (a pre-existing, already-disclosed `entityInstance.ts` gap: "the EXPRESS
derived-attribute rule-compilation fallback ... is explicitly out of scope ... `.get()` throws
instead") -- `.get("Dim")` on any real entity unconditionally throws in this port today.

This is a genuinely *reachable* practical limitation, not merely theoretical: the `elif` chain checks
`Curve2D` (which evaluates `.Dim` for every `IfcCurve`-typed item) BEFORE the plain, dimension-agnostic
`Curve` branch, so `guessType` throws for essentially any real-world `items` list containing an actual
`IfcCurve`/`IfcSurface` instance -- including cases that would otherwise have resolved to the simple
`"Curve"`/`"Surface"` result, since the throwing check runs first and never falls through.

**Why not fixed now:** Implementing `IfcCurveDim`/`IfcSurfaceDim` would be real, disclosed scope creep
into a separate, sizable EXPRESS-derived-attribute-execution feature -- `entityInstance.ts`'s own
primitive-layer domain, already explicitly scoped out there (see that file's header comment). Not a
small, narrow addition `util/representation.ts` should silently take on.

**Fix:** Either (a) implement general EXPRESS DERIVED-attribute execution in `entityInstance.ts`
(a much larger, cross-cutting primitive-layer feature -- would unblock every module that ever needs
any derived attribute, not just this one), or (b) a narrower, `util.representation`-local
`calcCurveDim`/`calcSurfaceDim` re-implementation of just these two rule functions (feasible, since
both are fully described above, but has the same "narrow re-implementation of one module's private
rule, not the general primitive" character as `findBodyRepresentation`'s former precedent).

**Context:** Surfaced during Phase 4's `util.representation` chunk (2026-09-11). Pinned by a dedicated
regression test in `test/util/representation.test.ts`'s `guessType` coverage (asserts the real,
documented error for an `IfcLine` item), not just prose.

**UPDATE 2026-09-22 (Phase EX-2 chunks 1+2, `planning/ifcopenshell-ts/70-express-rules-plan.md`
§4, PRs #170 and this one) -- RESOLVED for IFC2X3, option (a) from "Fix" above, NOT yet for
IFC4/IFC4X3:** rather than a `util.representation`-local re-implementation (option (b) above),
Phase EX-2 took option (a): real EXPRESS DERIVED-attribute execution, ported function-by-function
from real Python's own generated `ifcopenshell/express/rules/{IFC2X3,IFC4,IFC4X3}.py` (see the
plan doc for why the compiled output is ported, not a new compiler) and dispatched from
`EntityInstance.get()`'s DERIVE branch (`express/dispatch.ts`). Chunk 1 (PR #170) ported
`calc_IfcCartesianPoint_Dim` (needed by every curve's own point coordinates) among its first 15
IFC2X3 functions; chunk 2 (this PR) ported `calc_IfcCurve_Dim` -- the FULL real `IfcCurveDim`
dispatch this entry's own "What" section describes above, all 8 branches
(`IfcLine`/`IfcConic`/`IfcPolyline`/`IfcTrimmedCurve`/`IfcCompositeCurve`/`IfcBSplineCurve`/
`IfcOffsetCurve2D`/`3D`) -- plus `calc_IfcElementarySurface_Dim`/`calc_IfcSweptSurface_Dim`/
`calc_IfcCurveBoundedPlane_Dim`/`calc_IfcRectangularTrimmedSurface_Dim`, which together cover
every concrete `IfcSurface` subtype IFC2X3 actually defines (`IfcPlane` via
`IfcElementarySurface`; `IfcSurfaceOfLinearExtrusion`/`IfcSurfaceOfRevolution` via
`IfcSweptSurface`; `IfcCurveBoundedPlane`/`IfcRectangularTrimmedSurface` directly -- IFC2X3 has no
`IfcBSplineSurface` or other `IfcSurface` subtype outside this set, confirmed against the schema).
**Net effect, verified directly against the real, built native addon (not assumed): `guessType`'s
`Curve2D`/`Curve3D`/`Surface2D`/`Surface3D` branches, and therefore every downstream caller
(`util.shapeBuilder.profile`/`createSweptDiskSolid`, `api.geometry.addWindowRepresentation`/
`addDoorRepresentation`/`regenerateWallRepresentation`/`validateType`, all cited below), now
complete successfully on IFC2X3** wherever they used to hit this exact `.get("Dim")` throw.
**Still open, disclosed, NOT resolved by this update:**
1. **IFC4/IFC4X3**: Phase EX-2 has so far only ported IFC2X3's `calc_*` functions (55 total,
   chunked; IFC4's 62 and IFC4X3's 65 are future chunks per the plan doc's own phase order) --
   `.get("Dim")` still throws unconditionally on IFC4/IFC4X3 today, independent of the separate
   `IfcLineIndex`/`IfcArcIndex` gap most IFC4/IFC4X3 call sites hit even earlier.
2. **Geometric-fidelity verification**: this update closes the `.get("Dim")` THROW -- it does not
   itself verify that the geometry `guessType`'s callers go on to build (window/door panel
   layouts, wall join miters, etc.) is dimensionally/geometrically CORRECT for every real-world
   shape. The 4 downstream `api.geometry` test files below were updated to assert minimal,
   structural sanity (return type, `RepresentationIdentifier`/`RepresentationType`, `Items`
   count/class) for their own now-unblocked IFC2X3 cases, not exhaustive numeric geometry
   correctness -- a real, disclosed, scoped-out follow-up (see each of those entries' own
   updates below), comparable in size to its own dedicated verification chunk.

**UPDATE (Phase EX-2, per-schema `calc_*` DERIVE porting continues): point 1 above ("IFC4/IFC4X3:
`.get("Dim")` still throws unconditionally") is now stale for both schemas, superseded piecemeal by
each schema's own `calc_*`-porting chunks, not rewritten in full here -- see
`src/express/rules/ifc4.ts`'s own chunk headers (IFC4 reaches its own full `IfcCurveDim`/
`IfcSurfaceDim` coverage by its third/fourth chunks) and `src/util/representation.ts`'s own header
comment (UPDATE 1 through UPDATE 4) for the exact, current, per-branch, per-schema state -- as of
IFC4X3's own THIRD `calc_*`-porting chunk (`src/express/rules/ifc4x3.ts`), `Curve2D`/`Curve3D` are
resolvable for every `IfcCurve` subtype on IFC4X3 except `IfcCompositeCurve` (still blocked on the
separately-unported `calc_IfcSegment_Dim`), and `Surface2D`/`Surface3D` remain blocked on IFC4X3
(`calc_IfcSurface_Dim` not yet ported for that schema). Point 2 (geometric-fidelity verification)
is UNCHANGED, still a real, disclosed, scoped-out follow-up.

**UPDATE 2 (Phase EX-2, IFC4X3's own FOURTH and LAST `calc_*`-porting chunk, `src/express/rules/
ifc4x3.ts`): the last 2 gaps named directly above are now BOTH closed.** That chunk ports
`calc_IfcSegment_Dim` (closing `IfcCompositeCurve`'s own `Segments[0].Dim`, the one remaining
`Curve2D`/`Curve3D` gap) and `calc_IfcSurface_Dim` (a bare `return 3`, same shape as IFC4's own) --
see `src/util/representation.ts`'s own header comment (UPDATE 5) for the full, re-verified
per-branch writeup. `Curve2D`/`Curve3D` are now resolvable for EVERY concrete `IfcCurve` subtype on
IFC4X3, and `Surface3D` is now reachable too, with `Surface2D` permanently unreachable dead code
(same shape as IFC4's own already-disclosed finding) -- IFC4X3 is now as fully resolved as IFC4 for
this entire family. **This also brings IFC4X3 to the full 60/60 `calc_*` DERIVE functions, closing
Phase EX-2 ("Derived-attribute support (EXPRESS rules)") ENTIRELY, across all 3 schemas
(IFC2X3 55/55, IFC4 62/62, IFC4X3 60/60).** Point 2 (geometric-fidelity verification) remains
UNCHANGED, still a real, disclosed, scoped-out follow-up.

---

### `util.date.stringToDate` doesn't reproduce `dateutil.parser.parse(..., fuzzy=True)`'s free-text date extraction

**What:** Python's `string_to_date` tries `dateutil.parser.isoparse` first, then falls back to
`dateutil.parser.parse(string, dayfirst=True, fuzzy=True)`. `src/util/date.ts`'s `stringToDate`
hand-rolls an `isoparse`-equivalent (extended + basic-form ISO 8601, no dependency added -- see that
file's own header comment finding #4) plus explicit `dayfirst=True` numeric-separator (`DD/MM/YYYY`
etc.) and month-name (`"5 January 2020"`, `"January 5, 2020"`) fallbacks covering `dateutil`'s most
common non-ISO inputs. What is genuinely **not** reproduced: `dateutil`'s `fuzzy=True` mode, which
extracts a date from surrounding free text that isn't itself date syntax (e.g. `"Meeting on 5 January
2020 at noon"` -> `dateutil` still finds `2020-01-05`). `stringToDate` returns `null` for input like
that instead.

**Why not fixed now:** True fuzzy substring extraction is an open-ended, locale-aware token-scanning
grammar -- a fundamentally different (and much larger) problem than the small, well-defined ISO 8601
duration grammar this same chunk hand-rolled successfully for `parseDuration`/`durationIsoformat`.
Disproportionate effort for a function that has **zero callers anywhere in `ifcopenshell-python`
itself** (confirmed by repo-wide grep during this chunk's investigation -- `string_to_date` exists for
external callers, e.g. a UI date-text-field parser, not for any internal `ifcopenshell-python` code
path), so nothing in this port is currently blocked on it either. Not silently approximated: this
chunk's own test file (`test/util/date.test.ts`) has an explicit test asserting the fuzzy-extraction
case returns `null`, so the gap is pinned by a regression test, not just prose.

**Fix, if a future caller needs it:** Either hand-roll a bounded fuzzy scanner (tokenize the input,
try the existing strict parsers against sliding windows/substrings -- meaningfully more code and edge
cases than today's `stringToDate`), or -- since this is the one place in `util/date.ts` where hand-
rolling was explicitly judged disproportionate -- consider a small, focused npm dependency for just
this function (e.g. a fuzzy-date-extraction library) after review, per this project's own "flag before
adding a new dependency" convention (not added speculatively here).

**Context:** Surfaced during Phase 3's `util.date` chunk (2026-09-10) while investigating the
`isodate`/`dateutil` library-equivalence question the chunk's own task brief raised. See
`src/util/date.ts`'s header comment (finding #4) for the full investigation and exactly what
`stringToDate` does and doesn't cover.

**Depends on / blocked by:** Nothing -- no current caller anywhere in this port needs the fuzzy case.
Pure "nice to have if a future caller (e.g. a UI layer) needs free-text date parsing" work.

---

### `spf_header` has no `file_description()` sub-entity accessor -- blocks wiring `MvdInfo` to a real `IfcFile.header()`

**What:** Python's `ifcopenshell.file.mvd` property (`file.py`) constructs `MvdInfo(self.header)`
directly off the live `ifcopenshell.file`'s own `spf_header` object, which exposes
`.file_description.description` (a mutable tuple of strings) via SWIG-only glue
(`IfcParseWrapper.i`'s `file_description_py`/etc., per `research/01-python-core-and-lowlevel.md`
SS5). This TS port's own native binding (`src/native/ifcopenshell_native.ts`'s `spf_header` class)
has `create`/`owner_file`/`assign` but no sub-entity accessor at all for `file_description`/
`file_name`/`file_schema` -- a pre-existing, already-disclosed gap (`util/file.ts`'s own header
comment, Phase 2: "the primitive layer exposes `file.header(): spf_header` but `spf_header` has no
`file_description()`/`file_name()`/`file_schema()` sub-entity accessors ... and neither is in this
chunk's required method list"). Phase 3's `util.mvd_info` chunk (`src/util/mvdInfo.ts`) ported
`MvdInfo`/`DictionaryHandler`/`AutoCommitList` in full, but deliberately against a *structural*
`MvdHeader` interface (`{ file_description: { description: string[] } }`) rather than this
project's own `spf_header` binding, so it doesn't have to wait on this gap to exist and be usable
today (exactly how `test_mvd_info.py`'s own `MockHeader` fixture works, and how
`mvdInfo.test.ts` is written) -- confirmed, not assumed: `MvdInfo` has zero other native/`IfcFile`
dependency (grep confirmed).

**Why deferred rather than attempted:** Adding a real `file_description()`/`file_name()`/
`file_schema()` sub-entity accessor means extending the N-API shim (a C++-side primitive addition,
not a TS-only change) -- a different, bigger unit of work than a `util` module port, and not
something a `util`-layer chunk should reach into `src/wrappergen`/`src/native` to add unilaterally.

**Fix:** Add the sub-entity accessor(s) to the N-API shim + `native/ifcopenshell_native.ts`'s
`spf_header` class (`file_description()`/`file_name()`/`file_schema()`, each returning a small
wrapper exposing the STEP header entity's own attributes, `description` chief among them for
`MvdInfo`'s purposes). Once that lands, `IfcFile` can gain a small `.mvd` convenience getter
(`new MvdInfo(this.header().file_description())`-shaped, matching Python's own `file.mvd` property)
as a follow-up -- `MvdInfo`'s own logic needs no changes, since it already only depends on the
structural `MvdHeader` shape.

**Context:** Surfaced during Phase 3's `util.mvd_info` chunk (2026-09-10) while confirming exactly
what `MvdInfo(header)`'s `header` parameter needs to be wired to a real `ifcopenshell.file` in this
port -- re-confirms `util/file.ts`'s own Phase 2 finding rather than duplicating a new one, and adds
the concrete "what would landing this actually unblock" writeup that finding didn't yet have.

**Depends on / blocked by:** Nothing blocking -- independent N-API shim work, not blocking any
currently-planned Phase 3 `util` chunk (confirmed no other not-yet-ported `util` module needs
`spf_header.file_description()` either, by the same reasoning `util/file.ts`'s own finding used).

---

### `gl-matrix` -- this project's first and only current runtime npm dependency beyond the native addon

**What:** Phase 4's `util.placement` chunk (`src/util/placement.ts`) added `gl-matrix@3.4.4`, pinned
exact, as a real `dependencies` entry (not `devDependencies`) in `package.json` -- the first time this
project has taken on a runtime npm dependency beyond the native `.node` addon itself. This was an
already-made project decision, not this chunk's own call: `planning/ifcopenshell-ts/research/03-python
-util-inventory.md`'s Porting priority section and `PROGRESS.md`'s Phase 4 table both explicitly name
`gl-matrix` as the intended TS mapping for `util.placement`'s numpy-based 4x4 matrix math.

**Why flagged here (not a problem, just worth visibility):** every prior chunk that considered a new
dependency (e.g. `util.selector`'s key-path/`format()` grammars, `util.date`'s ISO-8601 duration
parsing) correctly judged a hand-rolled implementation sufficient and avoided adding one -- this is the
first (and, as of this chunk, only) case where the "flag before adding a new dependency" convention
concluded a real dependency was the right call (genuine numerical linear algebra, not a small
hand-rollable grammar). Worth a tracked note purely so later chunks/reviewers aren't surprised to find
a runtime dependency in `package.json` and can see the reasoning in one place, not because it's an
open problem.

**A related, real, disclosed finding from the same chunk:** `gl-matrix`'s `ARRAY_TYPE` defaults to
`Float32Array` (only ~7 significant decimal digits), which would silently lose real precision for
IFC's frequent large-magnitude survey/geolocated coordinates (verified empirically: a translation
component of `6543210.123456789` round-trips as `6543210` under the default). `placement.ts` calls
`glMatrix.setMatrixArrayType(Float64Array)` once at module load to force numpy-float64-equivalent
precision globally -- a deliberate, disclosed *global* mutation of `gl-matrix`'s shared module state,
correct today since this is the only module using `gl-matrix`, but worth knowing about before a much
later chunk adds a second `gl-matrix` consumer with different precision needs (e.g. a GPU-buffer-facing
use case genuinely wanting `Float32Array`). See `placement.ts`'s own header comment for the full
verification writeup (including the confirmed-safe `mat4.multiply`/`mat4.scale`/`fromXRotation` etc.
composition-order and row/column-major mapping).

**Depends on / blocked by:** Nothing. Purely informational.

---

### `getAxis2placement`'s `IfcAxis2PlacementLinear` fallback needs `ifcopenshell.geom` (not yet ported)

**What:** `ifcopenshell.util.placement.get_axis2placement`'s `IfcAxis2Placement3D`/
`IfcAxis2PlacementLinear` branch has a fallback path, taken only when `placement.Location` has no
`Coordinates` attribute at all -- true only for `IfcAxis2PlacementLinear.Location`
(`IfcPointByDistanceExpression`, an IFC4X3+ alignment-referenced point with no direct Cartesian
coordinates; never true for `IfcAxis2Placement3D.Location`, always a plain `IfcCartesianPoint`).
Python's fallback calls `ifcopenshell.geom.create_shape` (the native OpenCASCADE-backed geometry
kernel) to resolve the point's real-world coordinates. This TS port has no `ifcopenshell.geom` binding
at all (confirmed: no `geom`-named module anywhere under `src/`, no native geometry-kernel primitive in
`src/native/ifcopenshell_native.ts`).

**Why deferred rather than attempted:** A real, narrow, cross-module hard blocker in the same category
as this file's existing `convert_file_length_units`/`util.selector` positional-key entries --
`ifcopenshell.geom` is a substantial, separate native-geometry-kernel binding effort, not something a
`util.placement` chunk should build unilaterally to unblock one rare branch.

**Fix:** `getAxis2placement` below throws a clear, descriptive error naming the real gap only when this
exact branch is reached (every `IfcAxis2Placement3D`/`IfcAxis2Placement2D`/`IfcAxis1Placement` call --
the overwhelming majority of real usage -- is unaffected). Once `ifcopenshell.geom` (or at least its
`create_shape` entry point) is ported, replace the thrown error with the real
`settings.set("convert-back-units", True)` + `create_shape` + `.matrix` reshape call Python performs.

**Context:** Surfaced during Phase 4's `util.placement` chunk (2026-09-11). Covered by a dedicated test
in `test/util/placement.test.ts`, guarded on `AVAILABLE_SCHEMAS.includes("IFC4X3")` since
`IfcAxis2PlacementLinear`/`IfcPointByDistanceExpression` are IFC4X3-only EXPRESS types and cannot be
exercised under CI's current `SCHEMA_VERSIONS=4` (IFC4-only) build.

**Depends on / blocked by:** Blocked on a future `ifcopenshell.geom` binding effort (not yet scheduled
in the roadmap as of this chunk). Does not block anything else in Phase 4.

---

### `util.shape`'s `ifcopenshell.geom`-dependent surface (39 of 43 functions, not ported)

**What:** `ifcopenshell.util.shape` (`src/ifcopenshell-python/ifcopenshell/util/shape.py`, 754 lines,
43 top-level functions) is the same `ifcopenshell.geom` gap as the entry directly above, but at a much
larger scale: **only 4 of its 43 functions are portable at all** (`is_x`, `get_profiles`,
`get_extrusions`, `get_base_extrusions` -- ported for real in `src/util/shape.ts`, no kernel
dependency). The remaining 39 all take a `W.triangulation` and/or `ShapeElementType` parameter --
types importable only under Python's `if TYPE_CHECKING:` guard, from `ifcopenshell.geom` -- so there
is no way to produce a real input for any of them in this TS port today, not merely "no test fixture
yet." This is confirmed independently of, and is a strictly bigger blocker than, the module's 3
`shapely`/`shapely.ops.unary_union` call sites (`get_footprint_area`'s polygon union) that
`planning/ifcopenshell-ts/20-roadmap.md`'s "just needs `polygon-clipping`" framing focuses on: 36 of
the 39 blocked functions don't touch `shapely` at all and are blocked purely on the missing kernel
binding, so swapping in `polygon-clipping` alone would not meaningfully unblock this module.

Full list of the 39 deferred functions (grouped by kernel-object parameter -- see `shape.ts`'s own
header comment for the identical, more detailed breakdown):
- `geometry: W.triangulation` only: `get_volume`, `get_x`, `get_y`, `get_z`, `get_max_xy`,
  `get_max_xyz`, `get_min_xyz`, `get_bbox_centroid`, `get_vert_centroid`, `get_vertices`, `get_edges`,
  `get_faces`, `get_material_colors`, `get_normals`, `get_shape_material_styles`,
  `get_faces_material_style_ids`, `get_faces_representation_item_ids`,
  `get_edges_representation_item_ids`, `get_bottom_elevation`, `get_top_elevation`, `get_area`,
  `get_side_area`, `get_max_side_area`, `get_top_area`, `get_footprint_area` (also uses
  `shapely`/`shapely.ops.unary_union`), `get_outer_surface_area`, `get_footprint_perimeter`,
  `get_total_edge_length`.
- `shape: ShapeElementType` (plus `geometry: W.triangulation`): `get_shape_matrix`,
  `get_shape_bbox_centroid`, `get_shape_vertices`, `get_shape_bottom_elevation`,
  `get_shape_top_elevation`.
- `element: ifcopenshell.entity_instance` (plus `geometry: W.triangulation`): `get_element_bbox_centroid`,
  `get_element_vertices`, `get_element_bottom_elevation`, `get_element_top_elevation`.
- Plain array inputs, no `W.triangulation`/`ShapeElementType` directly, but every real call site
  sources its arrays exclusively from the blocked `get_vertices`/`get_faces` above -- disclosed as a
  distinct sub-case in `shape.ts`'s header comment, not silently folded into the list above:
  `get_bbox`, `get_area_vf`.

**Why deferred rather than attempted, and why no per-function throwing stubs:** Same fundamental
category as the `getAxis2placement` entry above -- `ifcopenshell.geom` is a substantial, separate
native-geometry-kernel binding effort, not something a `util.shape` chunk should build unilaterally.
Given the sheer count (39, all equally and completely blocked, none "more done" than another),
`shape.ts` deliberately does NOT follow this project's usual one-real-throwing-stub-per-function
precedent (`util/alignment.ts`'s 3 blocked functions, `getAxis2placement`'s single blocked branch) --
39 near-identical stubs would be padding, not disclosure. Instead every function is named above (and
in `shape.ts`'s header comment) for API-surface-parity tracking, with this single entry as the real,
named gap.

**Fix:** Port an `ifcopenshell.geom` binding (native `W.triangulation`/`ShapeElementType` equivalents,
at minimum `triangulation.verts_buffer`/`.faces_buffer`/`.edges_buffer`/etc.). Once real geometry
objects are producible, all 39 functions above are a mechanical, verbatim `numpy` → array-math port
(no `IfcFile`/`EntityInstance`-shaped design questions of their own, unlike most other `util` chunks) --
`get_bbox`/`get_area_vf` need no kernel work themselves, only wiring once `get_vertices`/`get_faces`
exist.

**Context:** Surfaced during the `util.shape` chunk (2026-09-12), scoped and verified directly against
the real Python source (not assumed from the roadmap doc).

**Depends on / blocked by:** Same future `ifcopenshell.geom` binding effort as the `getAxis2placement`
entry above (not yet scheduled in the roadmap as of this chunk).

---

### `ci-ifcopenshell-ts.yml`'s macOS x64 leg was retired -- Homebrew no longer supports installing under Rosetta emulation

**What:** `ci-ifcopenshell-ts.yml`'s `build-and-test` matrix used to cross-compile a macOS x64 build
of the native addon from the `macos-14` (Apple Silicon) runner, via a separate x86_64 Homebrew
installed under `/usr/local` (`arch -x86_64 /bin/bash -c "$(curl -fsSL .../install.sh)"`) -- the same
pattern `build_osx.yml` (the main C++ core CI) uses. On 2026-09-11 this step began failing
consistently (8+ times across 4 unrelated PRs over several hours) with:
```
Homebrew on macOS is only supported on Apple Silicon processors!
```
Initially misdiagnosed as a transient network flake (dies in under a minute, before any log the
diagnostic-comment step captures, while every other CI check stayed green) and retried repeatedly,
including with a 3-attempt retry-loop fix -- none of that helped, because it isn't transient: Homebrew's
installer script (fetched unpinned from `HEAD` every run) now unconditionally refuses to install when
running as an x86_64 process on Apple Silicon hardware (i.e. under Rosetta emulation), which is exactly
what `arch -x86_64` does. Confirmed via the actual Actions UI log (the orchestrating session's own
sandbox couldn't reach GitHub's log-blob-storage host to see this directly -- the user pasted it).

**Fix applied:** Retired the `macosCrossCompileX64` matrix entry entirely (user-approved, given
GitHub's native macOS Intel (`macos-13`) runners are separately scarce/deprioritized and can queue
indefinitely, and the industry has broadly moved off x86_64 Mac hardware). `ci-ifcopenshell-ts.yml`'s
macOS coverage is now arm64-only.

**Not fixed here, a separate, bigger-blast-radius decision:** `build_osx.yml` (the main C++ core
project's own CI, not just this TS port) uses the identical `arch -x86_64` + Homebrew-installer
pattern and is presumably now equally broken -- confirmed only by reading its source (grep), not by
observing an actual failed run of it. Deliberately not touched by this fix: that workflow's blast
radius (the whole C++ core project, not just the TS port) and ownership are outside this Phase's
scope. Worth a maintainer decision on the same question (retire macOS x64 there too, or find another
fix -- e.g. `vcpkg`'s `x64-osx` triplet, matching how this same `ci-ifcopenshell-ts.yml` already
handles both Windows architectures without Homebrew at all).

**Context:** Surfaced 2026-09-11 while landing Phase 3/4/5 chunks (PRs #43/#44/#45); root-caused with
the user's help after the orchestrating session's own sandbox couldn't fetch the real CI logs (blocked
by a network proxy allowlist on the GitHub Actions log-blob-storage host).

**Depends on / blocked by:** Nothing -- this specific fix (retiring the leg) is independent and
already applied. The `build_osx.yml` follow-up decision noted above is a separate, not-yet-scheduled
piece of work.

---

### `api.spatial.assignContainer`/`api.aggregate.assignObject` skip the placement-relocalization step (`api.geometry.edit_object_placement` unported) -- **RESOLVED 2026-09-16, see UPDATE below: `edit_object_placement` landed for real, every call site in this file now wired in**

**What:** Real Python's `ifcopenshell.api.spatial.assign_container` AND
`ifcopenshell.api.aggregate.assign_object` both finish by calling
`ifcopenshell.api.geometry.edit_object_placement` on every product they moved, so a product's absolute
world position doesn't visually shift when reparented between two containers/aggregates whose own
placements differ. `ifcopenshell.api.geometry` has no TS port of any kind yet (confirmed by grep, matching
`util/shape.ts`'s own disclosed geometry-kernel gap for an unrelated reason). This TS port's
`assignContainer` (`src/ifcopenshell-ts/src/api/spatial/assignContainer.ts`) and `assignObject`
(`src/ifcopenshell-ts/src/api/aggregate/assignObject.ts`) both perform their full relationship surgery
correctly and independently, but simply do not invoke the placement step -- not stubbed to throw (which
would make either function fail on every call moving a product with an `IfcLocalPlacement`, a worse
regression than a stale placement).

**Why:** `edit_object_placement` (201 LOC: 4x4 matrix math, `ShapeBuilder.create_axis2_placement_3d`,
a recursive "move my children too" traversal, `util.unit.calculate_unit_scale` conversion) is real,
independent design work -- per `research/02-python-api-inventory.md` §3, `geometry` is one of the
seven subpackages "where real design decisions are needed," not a small CRUD dependency. Inlining a
partial port of it under either chunk's much narrower review scope risked a subtly wrong matrix-math
port landing under the wrong chunk's review. (Contrast `aggregate.unassign_object`, `assignContainer`'s
*other* real dependency: that one was small enough, 75 LOC and fully self-contained, to port for real
in the same chunk -- see `src/ifcopenshell-ts/src/api/aggregate/unassignObject.ts`. Likewise
`assignObject`'s own reused dependency, `spatial.unassignContainer`, was already landed by the time
`assignObject` was ported.)

**Impact:** After calling `assignContainer`/`assignObject` to move a product with an `IfcLocalPlacement`
between two containers/aggregates, the product's raw `ObjectPlacement` matrix is left exactly as it was
(still relative to whatever `PlacementRelTo` it already had) -- it does NOT visually shift in its own
`PlacementRelTo` frame, but WILL be visually shifted in absolute world space if the old and new
containers/aggregates sit at different absolute locations. `test_not_updating_placement_if_placement_is_not_relative`
(ported for both functions, in `assignContainer.test.ts`/`assignObject.test.ts`) is unaffected -- Python's
own `is_a("IfcLocalPlacement")` guard already skips non-local placements regardless of this gap.
`test_assigning_a_container_does_not_shift_object_placements` (both functions' Python test files have
one -- the exact same test exercising this exact same gap) is NOT ported for either function, for this
reason.

**Fix:** Port `ifcopenshell.api.geometry.edit_object_placement` as its own chunk (it has several other
callers across `api.*` beyond `assign_container`/`assign_object`, so it's independently valuable, not
`spatial`/`aggregate`-specific), then wire its call back into both functions' final loops and port the
two skipped tests above.

**Context:** Surfaced during the `api.spatial` chunk (2026-09-12), scoped and verified directly
against the real Python source (not assumed from the research doc, which describes `spatial` as having
"No geometry, no numpy" -- true for 3 of `spatial`'s 4 functions, not `assign_container`; see
`assignContainer.ts`'s own header comment for the full correction). Confirmed to hit the exact same gap,
not a new one, when `api.aggregate.assign_object` was ported (2026-09-12): `assign_object`'s own final
step calls the identical unported `edit_object_placement` function for the identical reason.

**Depends on / blocked by:** `ifcopenshell.api.geometry` (Phase 6, not yet started).

**UPDATE 2026-09-13 (Phase 6's `api.context` chunk):** `ifcopenshell.api.geometry` is no
longer entirely unstarted -- `unassign_representation`/`remove_representation` have landed as
a minimal, direct dependency of `api.context.removeContext` (see
`src/ifcopenshell-ts/src/api/geometry/index.ts`'s own header comment for the exact scope).
`edit_object_placement` itself remains fully unported -- this entry, and the gap it
describes, are unaffected either way.

**UPDATE 2026-09-14 (`api.root` -- `reassign_class` chunk):** A second, independent blocked
call site on `edit_object_placement`, this time paired with the SAME `assign_representation`
gap the entry immediately below already tracks: real Python's `ifcopenshell.api.root
.reassign_class`'s own `switch_between_class_types` (switching a product between an
occurrence class and a type class, e.g. `IfcWindowType` -> `IfcWindow`) needs
`ifcopenshell.api.geometry.assign_representation` to carry any of the element's own
representations across the switch, and -- ONLY for a type-to-occurrence switch that actually
had representations -- also `edit_object_placement` immediately after, to keep
`PlacementForShapeRepresentation` valid. `src/ifcopenshell-ts/src/api/root/reassignClass.ts`
performs the entire rest of this function (the "simple" same-`IfcTypeProduct`-ness
reassignment path, and every part of the type<->occurrence switch that doesn't touch
representations: unassigning/reassigning the type, container, aggregate, and psets) correctly
and independently, but throws a clear, disclosed error the moment it discovers the element
being switched has ANY representation at all -- checked immediately, before any of this
function's own mutations (see that file's own header comment for why "throw before mutating"
applies here too: doing the type/container/pset unwiring first, then discovering the
representation-reassignment step is blocked, would leave the element in a strictly worse
half-switched state than refusing the call outright). An element/type with no representations
completes the full switch normally. Pinned by 2 dedicated regression tests in
`reassignClass.test.ts` (adapted from real Python's own
`test_keeping_representations_switching_from_occurrence_class_to_type_class`/
`..._from_type_class_to_occurrence_class`, whose own fixtures themselves depend on the
unported `assign_representation` too).

**UPDATE 2026-09-14 (`api.geometry` chunk 2 -- `assign_representation`/`map_representation`):**
`assign_representation` landed for real (see `src/ifcopenshell-ts/src/api/geometry/
assignRepresentation.ts`'s own header comment) -- NARROWING, not fully resolving, this
entry. Re-reading `switch_between_class_types`'s own final `if` verbatim (not assumed)
shows the still-unported `edit_object_placement` call is reached ONLY `if switch_type ==
"type_to_occurrence" and representations:` -- never for `occurrence_to_type`. So
`reassignClass.ts` now only throws for a `type_to_occurrence` switch with a non-empty
`representations` (citing ONLY `editObjectPlacement` now, not `assignRepresentation` too,
which is real); an `occurrence_to_type` switch with representations now fully succeeds,
using the real `assignRepresentation` to carry the representations across. Updated
`reassignClass.test.ts`: `test_keeping_representations_switching_from_occurrence_class_to
_type_class` is now ported for real (no longer a disclosed-throw pin);
`test_keeping_representations_switching_from_type_class_to_occurrence_class` remains a
disclosed-throw pin, now citing only `editObjectPlacement`. This entry's OWN top-level
`edit_object_placement` gap (the `assignContainer`/`assignObject` placement-relocalization
step) is UNCHANGED -- still fully blocked, unrelated call sites.

**UPDATE 2026-09-15 (`api.system` chunk, all 12 files, completing that module):** Two
more independent blocked call sites on the same unported `edit_object_placement`,
surfaced porting a brand-new module:
1. `ifcopenshell.api.system.assign_port`'s own `update_port_placement` step, reached
   ONLY when the port being (re)assigned already has an `IfcLocalPlacement` (a bare
   port fresh out of `root.createEntity`/`system.addPort` never does, so this is
   unreached for the common case -- confirmed against `test_assigning_a_port_once_only`,
   which never hits it). `src/ifcopenshell-ts/src/api/system/assignPort.ts` performs the
   entire rest of `assign_port` (finding/reusing an existing `IfcRelNests`/
   `IfcRelConnectsPortToElement`, or creating a brand-new one) exactly as real Python
   does -- both BEFORE it would even check the port's placement -- then throws only if
   `port.ObjectPlacement` is set and `is_a("IfcLocalPlacement")`, the one condition real
   Python's own guard requires before it would reach `edit_object_placement` itself.
   Real Python's own `test_updating_the_placement_to_be_relative_if_it_exists` needs
   `edit_object_placement` both to build its own fixture (an already-placed port) AND
   to exercise the assertion -- pinned instead as a dedicated disclosed-throw
   regression test in `assignPort.test.ts`.
2. `ifcopenshell.api.root.copy_class`'s own ports-copying branch -- see the
   `api.root.copyClass` entry above (cross-referenced there in full, not duplicated
   here) -- calls `edit_object_placement` UNCONDITIONALLY for every copied port,
   unlike `assign_port`'s own placement-guarded call site above.

Both are pinned by dedicated regression tests, not silently dropped. Neither changes
this entry's own top-level `assignContainer`/`assignObject` gap, which remains
unrelated and fully blocked.

**RESOLVED 2026-09-16 (`api.geometry` -- `edit_object_placement` lands for real):**
`ifcopenshell.api.geometry.edit_object_placement` (201 LOC, this file's own top-level
gap and the single most-cited disclosed blocker in this project) is now a real, fully
exported function (`src/ifcopenshell-ts/src/api/geometry/editObjectPlacement.ts`). The
4x4 matrix math this entry originally called out as "real, independent design work"
turned out to be directly portable by reusing `util/placement.ts`'s own already-verified
`a2p`/`getLocalPlacement` (that file's own header comment already established
`gl-matrix`'s column-major layout and `mat4.multiply`'s argument order against numpy's
`A @ B`) -- the only NEW verification this chunk needed was `mat4.invert` against
numpy's `np.linalg.inv`, confirmed empirically with a disposable Node script (see
`editObjectPlacement.ts`'s own header comment for the worked example). Ported line-for-
line: the `hasattr` guard, the `is_si`/unit-conversion quirk (mutates the matrix's own
translation column up to SI when `isSi: false`, ported verbatim including the
opposite-of-what-the-name-suggests direction), `getPlacementRelTo`'s real 8-branch
ordered chain (including `ContainedInStructure`'s own distinct early-return shape),
`getChildrenSettings`'s real `IfcDistributionPort`-skip and `IfcFeatureElement`
two-level-recursion special cases, and `getRelativePlacement`'s full matrix math.

**One real, EMPIRICALLY VERIFIED, disclosed deviation from Python's own literal
sequence, load-bearing not stylistic:** clearing `product.ObjectPlacement`/
`old_placement.PlacementRelTo` to `null` (Python's own `= None` before calling
`remove_deep2`) hits the EXACT SAME native primitive-layer bug this file's own
"Native primitive-layer bug" entry (below) already discloses for an AGGREGATE
attribute -- confirmed here for a SINGLE-entity attribute too (previously unconfirmed
for that case): `.set(name, null)` does not correctly unregister the old value from the
file's inverse index, which would otherwise make `removeDeep2`'s own
`getTotalInverses(element) > 0` guard silently refuse to ever purge the old placement,
breaking almost every real Python test in this module. Worked around (verified
empirically, not assumed) by NEVER routing through an explicit `null` intermediate
state for `product.ObjectPlacement`: a direct entity-to-entity reassignment (old
placement -> new placement, skipping `null` entirely) was confirmed to correctly
unregister/register both sides. `oldPlacement.PlacementRelTo` is deliberately never
cleared at all (not even via a placeholder-entity workaround, which would leave a
permanent orphan) -- `removeDeep2`'s own inverse-containment check independently
guarantees a live ancestor placement is never swept into deletion, verified against
this chunk's own full multi-level nested-placement test suite. See
`editObjectPlacement.ts`'s own header comment for the complete writeup.

**A second, real, genuine ordering bug found and fixed by this chunk's own test
suite** (not present in real Python, introduced then caught during this port): an
early draft passed `placementRelTo` directly to `IfcLocalPlacement`'s constructor
(an "optimization" over real Python's own two-step "create blank, redirect old
placement's inverses, THEN assign `PlacementRelTo`" sequence) -- this breaks when
`placementRelTo` happens to equal `oldPlacement` (a real, reachable scenario: a
product's relationship target's current placement equals the product's own current
placement), since the newly-constructed placement would then be incorrectly caught by
its own redirect loop and pointed at itself. Fixed by reproducing real Python's exact
ordering (construct with `PlacementRelTo` unset, redirect old placement's inverses,
THEN assign `PlacementRelTo`) -- caught by
`test_changing_an_object_placement_shared_by_its_parent` (a real, ported Python test),
exactly the kind of "subtle transposition/order bug" this chunk's own task brief
warned about.

**Retroactively resolves every call site this file and its own UPDATEs tracked:**
1. `api.spatial.assignContainer`/`api.aggregate.assignObject`'s own top-level
   placement-relocalization step (this entry) -- both now call `editObjectPlacement`
   for real in their final loops; `test_assigning_a_container_does_not_shift_object_
   placements`/its `aggregate` counterpart are now ported with real assertions in
   `assignContainer.test.ts`/`assignObject.test.ts`.
2. `api.root.reassignClass`'s `type_to_occurrence`-with-representations case (this
   entry's own UPDATE above) -- `switchBetweenClassTypes` now completes both
   directions for real; `test_keeping_representations_switching_from_type_class_to_
   occurrence_class` is ported for real in `reassignClass.test.ts`. Also reproduced
   real Python's own `resolve_representation` re-binding for the `type_to_occurrence`
   unassign loop, which had been left un-ported as "dead code" while this path always
   threw -- now real, since the path is reachable.
3. `api.root.copyClass`'s distribution-ports branch (see `TODOS.md`'s dedicated
   `copyClass` entry below) -- fully resolved, no blocked call site left in that file.
   `test_copying_distribution_ports` is ported for real in `copyClass.test.ts`.
4. `api.system.assignPort`'s `update_port_placement` step (see `TODOS.md`'s `api.system`
   entry, folded into this file's own UPDATE above) -- fully resolved.
   `test_updating_the_placement_to_be_relative_if_it_exists` is ported for real in
   `assignPort.test.ts`.

Full local suite (2058 passed, 55 skipped, all pre-existing schema-gated skips) run
against a locally-built IFC4-only native addon (matching CI's own `-DSCHEMA_VERSIONS=4`
build); `tsc --noEmit`/`biome check` both clean.

---

### `api.type.assignType` skips material-usage mapping (`api.material.assign_material` unported -- `api.material` has NO TS port of any kind yet) -- **RESOLVED 2026-09-14, see UPDATE below**

**RESOLVED 2026-09-14 (`api.material` chunk 1 -- `assign_material`/`unassign_material`/`copy_material`):**
Both blocked call sites this entry tracks (`assignType`'s own `mapMaterialUsages`, and the
`removeProduct` cross-reference in the UPDATE below) are now real. `api.material` chunk 1 landed
`assignMaterial`/`unassignMaterial`/`copyMaterial` (`src/ifcopenshell-ts/src/api/material/
index.ts`) -- `assignMaterial`'s own `"...Usage"` branches (the exact ones `mapMaterialUsages`
needs) turned out to have NO sibling blocker of their own once actually read line-by-line (the
chunk-planning speculation that they might need still-unported `add_layer`/`add_profile`-style
helpers was wrong -- the real 364-line source builds the Usage entity directly via
`create_entity`, with the only actual `ifcopenshell.api.material.*` call being `unassign_material`,
itself in the same chunk). `assignType.ts`'s `mapMaterialUsages` now calls the real, exported
`assignMaterial` directly; `assignType.test.ts`'s own disclosed-throw test has been replaced with
the real, previously-unreachable `test_map_material_usages`/`test_do_not_reassign_material_if_
it_was_assigned_previously` assertions (the latter WAS this entry's own stated "one genuine gap"
-- it needed a *successful* prior mapping call to construct its precondition, unreachable while
blocked; now reachable and ported for real). The rest of `assignType.ts`'s own header comment
(the three-layer occurrence/type validation, the `PredefinedType`/`ObjectType` double-typing
cleanup, etc.) is unaffected. The sibling `api.geometry.mapRepresentation`/`.assignRepresentation`
blocker (the NEXT entry in this file) is UNCHANGED -- still blocked, unrelated module.

**What (historical, kept for context):** Real Python's `ifcopenshell.api.type.assign_type` finishes (when
`should_map_representations` is `True`, the default) by calling its own `map_material_usages`
helper, which -- only if the type's own material (`ifcopenshell.util.element.get_material`,
already landed) resolves to an `IfcMaterialLayerSet`/`IfcMaterialProfileSet` -- calls
`ifcopenshell.api.material.assign_material(file, products=related_objects,
type=f"{ifc_class}Usage")` to give every newly-typed occurrence a matching
`IfcMaterialLayerSetUsage`/`IfcMaterialProfileSetUsage`. `ifcopenshell.api.material` has NO TS
port of any kind yet (confirmed by grep -- unlike `api.geometry`, which at least has 2 of ~34
functions landed, `api.material` is entirely untouched). This TS port's `assignType`
(`src/ifcopenshell-ts/src/api/type/assignType.ts`) performs its full `IfcRelDefinesByType`
assign/reuse/merge surgery and `PredefinedType`/`ObjectType` double-typing cleanup correctly and
independently, but throws a clear, loud, descriptive error (rather than silently skipping the
mapping, or attempting a risky partial reimplementation of `api.material`) the moment it
actually needs to call the missing function -- i.e. only when `shouldMapRepresentations` is
`true` (the default) AND the type's own material genuinely is an
`IfcMaterialLayerSet`/`IfcMaterialProfileSet`. A type with no material, or
`shouldMapRepresentations: false`, is unaffected and completes normally.

**Why:** `api.material` (per `research/02-python-api-inventory.md`) is itself a real,
independent future chunk -- inlining even one of its ~30+ functions under `api.type`'s own,
much narrower review scope risked a partial/wrong port of `assign_material` (a non-trivial
function: it has its own inherit/reuse/merge logic for `IfcRelAssociatesMaterial`, plus
per-material-class dispatch for creating the right `*Usage` wrapper) landing under the wrong
chunk's review, exactly the same reasoning already established for `edit_object_placement`
above.

**Impact:** Calling `assignType` with `shouldMapRepresentations: true` (the default) against a
`relatingType` whose own material is an `IfcMaterialLayerSet`/`IfcMaterialProfileSet` throws
`"assignType: mapping material usages for N related object(s) needs api.material.assignMaterial
(type \"<Class>Usage\"), not ported yet -- see TODOS.md."` -- AFTER this function's own
`IfcRelDefinesByType` surgery has already been committed (matching what would happen if the
real `api.material.assign_material` call itself raised partway through the real Python
function; not a TS-specific regression). Callers who need this exact scenario today must either
pass `shouldMapRepresentations: false` (skipping representation-mapping too, see the
next entry) or manually construct the `IfcMaterialLayerSetUsage`/`IfcMaterialProfileSetUsage`
association themselves before/after calling `assignType`. Pinned by a dedicated regression test
in `assignType.test.ts` (`"mapping material usages when the type's material is an
IfcMaterialLayerSet/IfcMaterialProfileSet -- blocked on api.material.assignMaterial"`).

**Fix:** Port `ifcopenshell.api.material` as its own (large) future chunk, then wire the real
`assignMaterial` call back into `assignType`'s `mapMaterialUsages` helper and port the two
currently-unportable real Python tests this gap also blocks
(`test_do_not_reassign_material_if_it_was_assigned_previously` needs a *successful* prior call
to construct its precondition, so it can't even be adapted today -- see `assignType.test.ts`'s
own header comment).

**Context:** Surfaced during the `api.type` chunk completing `assign_type`/
`map_type_representations` (2026-09-14), verified directly against the real 319-line
`assign_type.py` source, not assumed from a summary.

**Depends on / blocked by:** `ifcopenshell.api.material` (Phase 6, not yet started).

**UPDATE 2026-09-14 (`api.root` -- `remove_product` chunk):** A second, independent blocked
call site on the same unported `api.material` module: `ifcopenshell.api.root.remove_product`'s
own generic inverse-cascade tail calls `ifcopenshell.api.material.unassign_material` (not
`assign_material`, but the same unported module) whenever an `IfcRelAssociatesMaterial`
relationship is found among the product's inverses. `src/ifcopenshell-ts/src/api/root
/removeProduct.ts` throws the same clear, disclosed error there rather than silently leaving
the material association dangling -- see that file's own header comment and
`removeProduct.test.ts`'s dedicated "throws the disclosed blocked error" regression test. Not a
duplicate of this entry's own `assignType` blocker (a different function, a different half of
`api.material`'s surface) -- cross-referenced here rather than given its own separate entry
since both track the exact same root cause (`api.material` has no TS port at all).

**UPDATE 2026-09-14 (`api.root` -- `copy_class` chunk):** A third independent blocked call
site, this time on `ifcopenshell.api.material.copy_material` (a different half of
`api.material`'s surface again, not `assign_material`/`unassign_material`): real Python's
`ifcopenshell.api.root.copy_class` duplicates a product's `IfcRelAssociatesMaterial`
association differently depending on the material's own class -- a plain `IfcMaterial`/
`IfcMaterialList` is shared as-is (no copy needed), a parametric `IfcMaterialLayerSetUsage`/
`IfcMaterialProfileSetUsage` is shallow-copied via the already-portable `util.element.copy`,
but a genuine `IfcMaterialLayerSet`/`IfcMaterialProfileSet`/`IfcMaterialConstituentSet`
material SET needs `api.material.copy_material` to duplicate the whole set (layers/profiles/
constituents and all). `src/ifcopenshell-ts/src/api/root/copyClass.ts` ports every other real
behavior of this function (placement, psets, ports -- see the new `api.system` entry below --
aggregation, containment, type, voids, the other 2 material cases, groups) correctly and
independently, throwing a clear, disclosed error only the moment it actually finds a `*Set`
material association, before copying/mutating anything for that specific relationship. A
product with no material, a plain `IfcMaterial`/`IfcMaterialList`, or a parametric usage is
entirely unaffected. Pinned by a dedicated regression test in `copyClass.test.ts` (adapted
from real Python's own `test_copying_material_sets_for_type_elements_only`).

**UPDATE 2026-09-14 (`api.material` chunk 1, same day, later):** The material-set half of this
blocker (the `*Set` material-association branch above, needing `api.material.copyMaterial`) is
RESOLVED for `removeProduct.ts`/`assignType.ts` (see the top of this file's sibling
`api.material` entry, above), but NOT yet for `copyClass.ts`: `copyMaterial` landed as a real,
exported function, but `copyClass.ts` (from PR #92/`ts-api-root-completion`) had not yet merged
into the `api.material` chunk 1 worktree's `v0.9.0` base at authoring time, so its own `*Set`
material-association branch could not be updated there -- left for the orchestrating session's
own follow-up once both PRs land. The distribution-port blocker (`api.system`, below) is
unrelated and remains fully open regardless.

---

### `api.root.copyClass` skips distribution-port copying (`api.system` unported -- has no TS port of any kind yet) -- **RESOLVED 2026-09-16, see UPDATE below: both the `api.system` half (2026-09-15) and the `api.geometry.editObjectPlacement` half (2026-09-16) are now real**

**What:** Real Python's `ifcopenshell.api.root.copy_class`, when the product being copied has
at least one nested `IfcDistributionPort` (via `IfcRelNests` in IFC4+, `IfcRelConnectsPortToElement`
in IFC2X3), recursively `copy_class`-es every port, builds a fresh nest/connection relationship
pointing the copies at the new element, then for each new port calls `ifcopenshell.api.system
.unassign_port`/`.disconnect_port` (severing whatever port-to-port connections the recursive
copy's own generic-fallback branch carried over) and `ifcopenshell.api.geometry
.edit_object_placement` (resetting the copied port's own placement to the same absolute matrix
the original had, since it now sits under a different `PlacementRelTo` parent). `ifcopenshell
.api.system` has NO TS port of any kind (confirmed by directory listing -- a brand-new blocked
module for this project, distinct from every other module this file already tracks) and
`edit_object_placement` is the same pre-existing `api.geometry` blocker this file's very first
entry tracks. `src/ifcopenshell-ts/src/api/root/copyClass.ts` performs every other real
behavior of this function correctly and independently, but throws a clear, disclosed error the
moment it discovers the product being copied actually has at least one nested port -- before
recursively copying any of them, before creating any new relationship. A product with no ports
is entirely unaffected.

**Why:** `api.system` (per `research/02-python-api-inventory.md`) is itself a real,
independent future chunk (manages `IfcDistributionPort`/`IfcSystem`/port-to-port connections) --
inlining even its 2 needed functions (`unassign_port`/`disconnect_port`) under `api.root`'s own
narrower review scope risked a partial/wrong port of a module with real design decisions of its
own landing under the wrong chunk's review, exactly the same reasoning already established for
every other genuinely-separate-future-module entry in this file.

**Impact:** Calling `copyClass` on a product with at least one nested distribution port throws
`"copyClass: copying <Class>#<id>'s N nested distribution port(s) needs api.system
.unassignPort/.disconnectPort and api.geometry.editObjectPlacement, none ported yet -- see
TODOS.md."` -- BEFORE any mutation for that specific relationship (this function's OTHER real
behavior for the SAME product -- placement/psets/aggregation/containment/type/voids/materials/
groups -- still completes normally regardless, since each inverse relationship is handled
independently in its own loop iteration). Pinned by a dedicated regression test in
`copyClass.test.ts` (adapted from real Python's own `test_copying_distribution_ports`, for
both IFC4+'s `IfcRelNests`-based and IFC2X3's `IfcRelConnectsPortToElement`-based port
mechanisms).

**Fix:** Port `ifcopenshell.api.system` as its own future chunk (at minimum `unassign_port`/
`disconnect_port`, though the whole module -- `add_port`/`assign_port`/`connect_port`/etc. --
is a natural single chunk per the research doc's own framing), then wire the real calls back
into `copyClass`'s ports branch and restore real Python's own `test_copying_distribution_ports`
assertions (currently pinned as a "throws" test instead).

**Context:** Surfaced during the `api.root` -- `copy_class` chunk (2026-09-14), verified
directly against the real 193-line `copy_class.py` source.

**Depends on / blocked by:** `ifcopenshell.api.system` (Phase 6, not yet started),
`ifcopenshell.api.geometry.editObjectPlacement` (this file's own first entry, above).

**UPDATE 2026-09-15 (`api.system` chunk, all 12 files, completing that module):**
`ifcopenshell.api.system` is no longer unstarted -- `unassign_port`/`disconnect_port`
(and every other function in the module) landed for real. `copyClass.ts`'s ports
branch (`src/ifcopenshell-ts/src/api/root/copyClass.ts`) now performs the ENTIRE real
sequence real Python does for every nested port: the recursive `copyClass` call, the
new `IfcRelNests`/`IfcRelConnectsPortToElement` relationship pointing at the copies,
and -- for each new port -- the real `unassignPort`/`disconnectPort` calls (undoing
the recursive copy's own generic-fallback side effects, exactly matching real Python's
own next step). This is a genuine NARROWING, not a full resolution: real Python's own
`copy_class` calls `ifcopenshell.api.geometry.edit_object_placement` UNCONDITIONALLY
for every copied port immediately after `unassign_port`/`disconnect_port` (unlike
`api.system.assignPort`'s own placement-GUARDED call site, which only reaches
`edit_object_placement` when the port already has an `IfcLocalPlacement` -- see the
`api.system` entry below) -- `editObjectPlacement` remains this file's own first entry,
fully unported, so `copyClass` still throws, now only at that exact remaining point
(after `unassignPort`/`disconnectPort` have already run for the port being processed,
matching this file's own "throw only where blocked, after every mutation real Python
would already have made" discipline). The error message now cites only
`api.geometry.editObjectPlacement` (`"copyClass: re-localizing <Class>#<id>'s
placement ... needs api.geometry.editObjectPlacement, not ported yet -- see
TODOS.md."`), not `api.system.unassignPort`/`.disconnectPort` (both now real).
`copyClass.test.ts`'s own disclosed-throw regression test is updated to build its
fixture with the real `api.system.addPort`/`.connectPort` (no longer substituted) and
asserts the real partial-mutation state up to the throw point (the port WAS
recursively copied, the original element's own ports are unaffected by the recursive
copy's side effect, and the new port is disconnected from whatever the original was
connected to) -- not just a bare "it throws". Real Python's own
`test_copying_distribution_ports` assertions past that point (the new port's placement
matching the original's absolute matrix) remain unported, still blocked on
`editObjectPlacement` exactly like every other call site tracked by this file's own
first entry.

**RESOLVED 2026-09-16 (`api.geometry.editObjectPlacement` lands for real):** The one
remaining blocker this entry tracked is now real (see `TODOS.md`'s own `edit_object_
placement` entry's "RESOLVED" UPDATE, above in this file). `copyClass.ts`'s ports
branch now performs the ENTIRE real sequence for every copied port -- recursive port
copy, new nest/connection relationship, `unassignPort`/`disconnectPort`, THEN
`editObjectPlacement` to re-localize the copy's placement to the original's absolute
matrix -- with no throw left at all. The disclosed-throw regression test is replaced
with the real Python assertions (`test_copying_distribution_ports`, both the shared
base class's connected-port-pair variant and the IFC2X3-specific simpler variant,
ported as one combined test in `copyClass.test.ts` since the former is a strict
superset of the latter's own assertions).

---

### `api.type.assignType`/`mapTypeRepresentations` skip representation mapping (`api.geometry.map_representation`/`.assign_representation` unported) -- **RESOLVED 2026-09-14, see UPDATE below**

**RESOLVED 2026-09-14 (`api.geometry` chunk 2 -- `assign_representation`/`map_representation`):**
Both blocked functions this entry tracks are now real, exported functions
(`src/ifcopenshell-ts/src/api/geometry/assignRepresentation.ts`/`mapRepresentation.ts`),
landed retroactively specifically to unblock this entry and the `api.root.reassignClass`
entry above. `mapTypeRepresentations.ts` now ports real Python's full two-loop body (strip
existing representations, then map+assign each of the type's own `RepresentationMaps`) --
no throw left at all; a type with no `RepresentationMaps` remains the same real no-op it
already was. `assignType.ts`'s own header comment (which cited this same blocker) is
updated to match. Replaced the previous disclosed-throw pins with the real Python test
assertions this entry's own "Fix" section already named:
`test_doing_nothing_if_the_type_has_no_representation_maps` (the no-op guard, was already
portable) and `test_removing_existing_element_representations_and_mapping_type_
representations` (the real two-loop body, newly portable) in `mapTypeRepresentations
.test.ts`; `assignType.test.ts`'s own disclosed-throw test for this path is likewise
replaced with real assertions. `test_do_not_map_representation_if_type_was_assigned_
previously` -- flagged in the "Fix" section below as needing a *successful* prior call to
construct its precondition -- is now reachable and ported for real too.

**What (historical, kept for context):** Real Python's `ifcopenshell.api.type.map_type_representations` -- called directly by
`assign_type` for every newly-typed occurrence whenever `should_map_representations` is `True`
(the default) AND the type's own `RepresentationMaps` is non-empty -- has two halves: the FIRST
(strip every representation currently on the occurrence, via
`ifcopenshell.api.geometry.unassign_representation`/`.remove_representation`) is fully portable,
since both of those functions already landed as a minimal, unrelated dependency of
`api.context.removeContext` (`src/ifcopenshell-ts/src/api/geometry/index.ts`). The SECOND (for
every one of the type's own `RepresentationMaps`, create a fresh `IfcMappedItem`-based
representation via `ifcopenshell.api.geometry.map_representation` and assign it onto the
occurrence via `ifcopenshell.api.geometry.assign_representation`) is NOT -- neither function has
any TS port at all yet. This TS port's `mapTypeRepresentations`
(`src/ifcopenshell-ts/src/api/type/mapTypeRepresentations.ts`) throws a clear, loud, descriptive
error the moment it's clear the blocked second half would be needed (i.e. `RepresentationMaps`
is non-empty) -- deliberately BEFORE running the otherwise-safe first (stripping) loop, so a
blocked call never leaves the occurrence with its old representations removed and nothing to
replace them with (a strictly worse silent-partial-state outcome than refusing the call
outright). A type with an empty/absent `RepresentationMaps` is unaffected and remains a real,
correct no-op, matching real Python's own early-return guard.

**Why:** Same reasoning as the `edit_object_placement`/`api.material.assign_material` entries
above -- `api.geometry.map_representation`/`.assign_representation` are real, independent
functions (`map_representation` in particular does non-trivial `IfcRepresentationMap`
reuse/creation and `IfcMappedItem`/`IfcCartesianTransformationOperator` construction) that
belong under `api.geometry`'s own future, wider review scope, not squeezed into `api.type`'s.

**Impact:** Calling `assignType` with `shouldMapRepresentations: true` (the default) against a
`relatingType` with a non-empty `RepresentationMaps` throws (via `mapTypeRepresentations`)
`"mapTypeRepresentations: mapping an occurrence to its type's own RepresentationMaps needs
api.geometry.mapRepresentation/api.geometry.assignRepresentation, neither ported yet -- see
TODOS.md."` -- AFTER `assignType`'s own `IfcRelDefinesByType` surgery has already been
committed (same partial-mutation-matches-real-Python-would-throw-too reasoning as the
`api.material` entry above). Callers who need this exact scenario today must pass
`shouldMapRepresentations: false`. Pinned by dedicated regression tests in both
`mapTypeRepresentations.test.ts` and `assignType.test.ts`.

**Fix:** Port `ifcopenshell.api.geometry.map_representation`/`.assign_representation` as part of
a future, wider `api.geometry` chunk (they have other callers across `api.*` beyond
`api.type`), then wire the real calls back into `mapTypeRepresentations`'s own second loop and
port the two currently-unportable real Python tests this gap also blocks
(`test_map_representation`, adapted below as a pinned "throws" test instead of its real
assertions; `test_do_not_map_representation_if_type_was_assigned_previously`, which -- like the
`api.material` entry's own analogous test -- needs a *successful* prior call to construct its
precondition and so can't even be adapted today).

**Context:** Surfaced during the same `api.type` chunk as the `api.material` entry immediately
above (2026-09-14) -- a genuinely different pair of blocked functions than either that entry or
the pre-existing `edit_object_placement` entry, not a duplicate of either.

**Depends on / blocked by:** `ifcopenshell.api.geometry` (Phase 6, only
`unassign_representation`/`remove_representation` landed so far).

---

### `api.root.removeProduct` skips `HasOpenings`/`IfcGrid` axis cleanup (`api.feature.remove_feature`/`api.grid.remove_grid_axis` unported -- neither module has any TS port of any kind yet) -- **RESOLVED 2026-09-17 (both halves), see UPDATEs below**

**What:** Real Python's `ifcopenshell.api.root.remove_product` has two more small, genuinely
new blocked call sites beyond the `api.material`/`api.boundary` ones this file already tracks
(see the "generic inverse-cascade tail" entries elsewhere): `for opening in getattr(product,
"HasOpenings", []) or []: ifcopenshell.api.feature.remove_feature(file, feature=opening
.RelatedOpeningElement)` (only reachable for a genuine `IfcElement` with at least one void
relationship) and `if product.is_a("IfcGrid"): for axis in product.UAxes + product.VAxes +
(product.WAxes or ()): ifcopenshell.api.grid.remove_grid_axis(file, axis=axis)` (only reachable
for a genuine `IfcGrid` with at least one axis). Neither `ifcopenshell.api.feature` nor
`ifcopenshell.api.grid` has any TS port of any kind (confirmed by directory listing, matching
`api.material`/`api.boundary`'s own "entirely untouched" status). `src/ifcopenshell-ts/src/api
/root/removeProduct.ts` performs every other real behavior of this function correctly and
independently, but throws a clear, loud, descriptive error the moment either blocked path would
actually be needed -- an occurrence with no openings, or removing a non-`IfcGrid`/axis-free
`IfcGrid`, is entirely unaffected and completes normally.

**Why:** Same reasoning as every other entry in this file for a genuinely separate, real,
independent future `api.*` module -- `api.feature`/`api.grid` are their own future chunks, not
squeezed into `api.root`'s own narrower review scope.

**Impact:** Calling `removeProduct` on an `IfcElement` with a non-empty `HasOpenings` throws
`"removeProduct: removing an element's HasOpenings needs api.feature.removeFeature, not ported
yet -- see TODOS.md."`; calling it on an `IfcGrid` with at least one `UAxes`/`VAxes`/`WAxes`
entry throws `"removeProduct: removing an IfcGrid's axes needs api.grid.removeGridAxis, not
ported yet -- see TODOS.md."` -- both AFTER this function's own representation/placement/pset
preamble has already been committed (matching what real Python's own `remove_feature`/
`remove_grid_axis` call raising partway through would do; not a TS-specific regression). Pinned
by two dedicated regression tests in `removeProduct.test.ts` (real Python's own
`test_removing_all_openings_of_an_element`/`test_removing_axes_of_a_grid`, adapted from their
real passing assertions into "throws the disclosed blocked error" pins instead).

**Fix:** Port `ifcopenshell.api.feature`/`ifcopenshell.api.grid` as their own future chunks
(both small: 2 files/functions each, per `research/02-python-api-inventory.md`), then wire the
real calls back into `removeProduct`'s two guarded branches and restore the two real Python
tests' original passing assertions.

**Context:** Surfaced during the `api.root` -- `remove_product` chunk (2026-09-14), verified
directly against the real 223-line `remove_product.py` source.

**Depends on / blocked by:** `ifcopenshell.api.feature`, `ifcopenshell.api.grid` (both Phase 6,
neither started).

**UPDATE 2026-09-16 (`IfcGrid` axis half wired in for real):** `api.grid.removeGridAxis` landed
one chunk earlier (PR #108) without this function's own `IfcGrid`-axis branch being retrofitted
at the same time (see `TODOS.md`'s sibling `IfcRelSpaceBoundary` entry below, and
`PROGRESS.md`'s own "UPDATE 2026-09-16" entries, for the same deliberate-deferral precedent).
That follow-up has now landed: `src/ifcopenshell-ts/src/api/root/removeProduct.ts`'s `IfcGrid`
branch now calls the real `removeGridAxis(file, { axis })` for every axis in `product`'s own
`UAxes`/`VAxes`/`WAxes` (the last matching real Python's own `(product.WAxes or ())` null
tolerance), exactly matching real Python's own `for axis in product.UAxes + product.VAxes +
(product.WAxes or ()): ifcopenshell.api.grid.remove_grid_axis(file, axis=axis)`.
`test_removing_axes_of_a_grid`'s real passing assertion is restored in `removeProduct.test.ts`
("removing axes of a grid"), replacing its former "throws the disclosed blocked error" pin. The
`HasOpenings`/`api.feature` half of this entry is UNCHANGED and still genuinely blocked --
`api.feature` still has no TS port of any kind.

**UPDATE 2026-09-17 (`api.feature` lands for real -- `HasOpenings` half now RESOLVABLE, not yet
wired up):** `api.feature` landed in full (`src/ifcopenshell-ts/src/api/feature/`, all 4 real
files -- see PR [#122](https://github.com/mikitski/IfcOpenShell/pull/122) and `PROGRESS.md`'s own
`api.feature` row), including a real, exported `removeFeature` matching real Python's
`ifcopenshell.api.feature.remove_feature` exactly. `root/removeProduct.ts`'s own `HasOpenings`
branch was deliberately NOT retrofitted in that same chunk -- matching this file's own
established "land the module, wire up the retroactive unblock separately" precedent (see this
entry's own `IfcGrid`/`IfcRelSpaceBoundary` sibling updates above/below, both landed one chunk
after their own dependency). This entry's blocker is now genuinely RESOLVABLE (both
`ifcopenshell.api.feature`/`ifcopenshell.api.grid` are fully ported), but the throw in
`removeProduct.ts` itself is UNCHANGED until a small, dedicated follow-up chunk wires in the real
`for opening in getattr(product, "HasOpenings", []) or []: ifcopenshell.api.feature.remove_feature
(file, feature=opening.RelatedOpeningElement)` call and restores
`test_removing_all_openings_of_an_element`'s real passing assertion in
`removeProduct.test.ts` (currently still pinned as a "throws the disclosed blocked error"
regression test).

**UPDATE 2026-09-17 (follow-up chunk wires it in for real -- entry now FULLY RESOLVED):**
The small, dedicated follow-up promised in the UPDATE directly above has now landed:
`src/ifcopenshell-ts/src/api/root/removeProduct.ts`'s `HasOpenings` branch now calls the
real `removeFeature(file, { feature: opening.get("RelatedOpeningElement") })` for every
`opening` (an `IfcRelVoidsElement`) in `product`'s own `HasOpenings`, exactly matching
real Python's own `for opening in getattr(product, "HasOpenings", []) or []:
ifcopenshell.api.feature.remove_feature(file, feature=opening.RelatedOpeningElement)`.
Confirmed `RelatedOpeningElement` (not `HasOpenings` itself) is the actual
`IfcFeatureElementSubtraction`/`IfcOpeningElement` to pass along, identical across
`generated/ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`.
`test_removing_all_openings_of_an_element`'s real passing assertion is restored in
`removeProduct.test.ts` ("removing all openings of an element"), replacing its former
"throws the disclosed blocked error" pin -- built via the real `api.feature.addFeature`
fixture call (not `withAttrs`), matching real Python's own fixture exactly now that
`api.feature` is fully ported. This entry is now fully resolved -- no remaining blocked
call site in this function.

---

### `api.root.removeProduct` skips `IfcRelSpaceBoundary` cleanup (`api.boundary.remove_boundary` unported -- `api.boundary` has no TS port of any kind yet) -- **RESOLVED 2026-09-16, see UPDATE below**

**What:** Real Python's `ifcopenshell.api.root.remove_product`'s generic inverse-cascade tail
calls `ifcopenshell.api.boundary.remove_boundary(file, boundary=inverse)` for every
`IfcRelSpaceBoundary` found among the product's inverses. `ifcopenshell.api.boundary` has no TS
port of any kind (confirmed by directory listing -- an entirely untouched module, same status
as `api.material`/`api.feature`/`api.grid` before this chunk). `src/ifcopenshell-ts/src/api
/root/removeProduct.ts` throws a clear, disclosed error the moment an `IfcRelSpaceBoundary` is
actually found, rather than silently leaving it dangling -- a product with no space boundary is
entirely unaffected.

**Why:** Same reasoning as every other entry in this file for a genuinely separate, real,
independent future `api.*` module.

**Impact:** Calling `removeProduct` on an element referenced by at least one
`IfcRelSpaceBoundary` throws `"removeProduct: IfcRelSpaceBoundary cleanup needs api.boundary
.removeBoundary, not ported yet -- see TODOS.md."`, AFTER this function's own representation/
placement/pset preamble (and any earlier-processed inverses in the same cascade loop) has
already been committed -- matching what real Python's own `remove_boundary` call raising
partway through would do. Pinned by a dedicated regression test in `removeProduct.test.ts`
(real Python's own `test_removing_all_space_boundaries_of_an_element`, adapted from its real
passing assertion into a "throws the disclosed blocked error" pin instead).

**Fix:** Port `ifcopenshell.api.boundary` as its own future chunk, then wire the real call back
into `removeProduct`'s guarded branch and restore the real Python test's original passing
assertion.

**Context:** Surfaced during the `api.root` -- `remove_product` chunk (2026-09-14), verified
directly against the real 223-line `remove_product.py` source.

**Depends on / blocked by:** `ifcopenshell.api.boundary` (Phase 6, not yet started).

**UPDATE 2026-09-16 (`api.boundary` chunk lands):** The dependency itself is now RESOLVED --
`api.boundary.removeBoundary` is fully ported (`src/ifcopenshell-ts/src/api/boundary/removeBoundary.ts`).
`removeProduct.ts`'s own guarded throw branch (this entry's own "Impact" section) is **deliberately
left unwired here**, matching the established precedent that landing a dependency does not itself
retrofit blocked call sites: `api.grid.removeGridAxis` landed one chunk earlier (PR #108) without
this same function's own still-throwing `IfcGrid`-axis branch (a few lines above this one) being
touched either. Wiring both back in (`IfcRelSpaceBoundary` here, `IfcGrid` axes above) is left as a
single, later, deliberate follow-up chunk, matching how `api.geometry.editObjectPlacement`'s own
5 blocked callers were retroactively resolved as an explicit, separate step once that function
landed (see `PROGRESS.md`'s own "UPDATE 2026-09-16" entries for `api.spatial`/`api.aggregate`/
`api.root.reassignClass`/`.copyClass`).

**UPDATE 2026-09-16 (follow-up chunk wires it in for real):** The deliberately-deferred follow-up
promised in the UPDATE directly above has now landed, alongside the sibling `IfcGrid` axis wiring
(this file's preceding entry): `src/ifcopenshell-ts/src/api/root/removeProduct.ts`'s
`IfcRelSpaceBoundary` branch now calls the real `removeBoundary(file, { boundary: inverse })` --
`inverse` (the `IfcRelSpaceBoundary` itself), not `product`, matching real Python's own
`ifcopenshell.api.boundary.remove_boundary(file, boundary=inverse)`.
`test_removing_all_space_boundaries_of_an_element`'s real passing assertion is restored in
`removeProduct.test.ts` ("removing all space boundaries of an element"), replacing its former
"throws the disclosed blocked error" pin. This entry is now fully resolved -- no remaining
blocked call site.

---

### Native primitive-layer bug: clearing an entity/aggregate-of-entity attribute to `null` via `.set()` leaves a stale (unregistered-but-still-counted) inverse-index entry

**What:** `EntityInstance.set(name, null)` (or `.setByIndex(index, null)`), for an attribute
whose *old* value referenced one or more other entities (a single entity-typed attribute, or
an aggregate-of-entities-typed one), does NOT unregister those old references from the file's
inverse index (`byref_excl_` in the C++ core) -- `IfcFile.getInverse`/`getTotalInverses` on the
*previously*-referenced entity keep reporting it as still referenced, even though the clearing
entity's own attribute correctly reads back as `null`/`[]` afterward. Confirmed directly against
this worktree's own built native addon (not assumed), via a real repro: clearing
`IfcTypeProduct.RepresentationMaps` (an aggregate-of-`IfcRepresentationMap`) to `null` left the
just-cleared `IfcRepresentationMap` reporting 1 remaining inverse (the very attribute that was
just cleared), causing `util/element.ts`'s `removeDeep2` (which starts with a
`getTotalInverses(element) > 0` early-return guard) to silently refuse to remove it at all -- not
a crash, a silent no-op.

**Root cause, found by reading the real C++ core directly, not guessed:** the N-API shim's
`set_attribute_value_variant` (`src/wrappergen/shim/attribute_value_shim.cpp`) handles a JS
`null` write via its `ATTRIBUTE_VALUE_KIND_NULL` case, which calls
`express::base::unset_attribute_value(index)` (`src/ifcparse/parse.cpp`). That function is a
two-line wrapper: `data()->set_attribute_value(index, blank{})` -- it calls the underlying
storage object's `set_attribute_value` *directly*, bypassing `express::base::set_attribute_
value<T>`'s own templated overload entirely (the one at `parse.cpp` ~line 1630), which is the
*only* place the inverse-index register/unregister bookkeeping (`register_inverse_visitor`/
`unregister_inverse_visitor`) actually runs. Real Python's own `entity_instance.__setattr__`
path for `value = None` does NOT hit this gap: `src/ifcwrap/IfcParseWrapper.i`'s
`set_attribute_value_py` calls `self->set_attribute_value(i, blank{})` directly -- the exact
overload *with* the bookkeeping (`blank` is one of the types explicitly handled by both the
unregister *and* -- vacuously, nothing to register -- register halves of that function's own
`if constexpr` dispatch). So this is a genuine, TS-port-specific primitive-layer bug in the
N-API shim's own dispatch, not a shared-core bug real Python also has -- verified by reading
both code paths side by side, not assumed from symmetry.

**Why this matters, concretely:** any `api.*` usecase (already-shipped or future) that clears an
entity- or aggregate-of-entity-typed attribute to `null` (Python's own `attr = None` /
`[...] or None` idiom, ported as `.set(name, null)`) and then expects the *old* referenced
entity/entities to become fully unreferenced (for a subsequent `removeDeep2` call, or any other
`getInverse`/`getTotalInverses`-based liveness check) will get a silently wrong answer -- the
old value looks live forever from the inverse-index's point of view, even after every real
forward reference to it is gone. This chunk's own `api.geometry.unassignRepresentation` (the
`IfcTypeProduct` branch, `unassignTypeRepresentation`) is a confirmed, real hit, not a
theoretical one -- worked around locally there (see that function's own doc comment: assign an
empty array first, which *does* correctly route through the register/unregister-bearing
overload since a non-`blank` `T`, then assign the real final `null` value immediately after).
**Every previously-shipped chunk that ever calls `.set(someEntityOrAggregateAttr, null)` should
be treated as a suspect for this exact same latent bug** until audited -- not confirmed broken
(most such calls happen right before deleting the entity that held the attribute, or don't
depend on the *old* referenced entity's own liveness afterward, so the actual blast radius may
be small), but not yet checked either.

**Fix:** In `attribute_value_shim.cpp`'s `set_attribute_value_variant`, change the
`ATTRIBUTE_VALUE_KIND_NULL` case from `instance.unset_attribute_value(attribute_index)` to
directly call the templated `set_attribute_value` overload with a `blank{}` value (i.e. mirror
`express::base::unset_attribute_value`'s own one-line body inline, or simply stop routing
through `unset_attribute_value` and call `instance.set_attribute_value(attribute_index,
blank{})` directly) -- a small, narrowly-scoped, well-understood one-line change, directly
verified correct by comparing against Python's own real, working code path side by side. **Not
applied directly in this chunk**: this sandbox has no `cmake`/full C++ toolchain (the same
long-standing, repeatedly-disclosed constraint noted throughout this file's other entries), so
a native-core change here could not be locally rebuilt and verified end-to-end before landing --
unlike the small, local, immediately-testable TS-level workaround this chunk actually shipped.
Whoever picks up the native fix should also then simplify/remove `unassignRepresentation.ts`'s
own workaround (the redundant empty-array pre-assignment), once the root cause is confirmed
fixed by CI.

**Context:** Found while porting `api.context.removeContext`/`api.geometry.unassignRepresentation`
(2026-09-13) -- `unassignTypeRepresentation`'s own real Python test
(`test_unassigning_a_type_product_representation`) failed with the just-cleared
`IfcRepresentationMap` never actually being removed, traced step by step (via `getTotalInverses`/
`getInverse` calls at each intermediate step, not assumed) down to this exact root cause, then
confirmed against the real C++ source for both this port's N-API shim and real Python's own SWIG
binding side by side. Pinned by a dedicated regression test,
`test/api/geometry/unassignRepresentation.test.ts`'s "undo restores the purged representation
map (type product path) ... also pins the disclosed inverse-index workaround".

**UPDATE 2026-09-16 (`api.geometry.editObjectPlacement`):** Confirmed empirically (a
disposable Node script against this worktree's own built native addon, not assumed from
this entry's own prior aggregate-only confirmation) that the SAME bug applies to a
SINGLE-entity-typed attribute too, not just an aggregate-of-entities one:
`IfcProduct.ObjectPlacement`/`IfcLocalPlacement.PlacementRelTo` set to `null` both leave
the old referenced entity's inverse count stuck, exactly like the aggregate case above.
This is genuinely load-bearing for `edit_object_placement`'s own core "purge the old
placement" logic (see `edit_object_placement`'s own `TODOS.md` entry, "RESOLVED" UPDATE
above), which would otherwise silently fail to remove the old placement in almost every
real Python test case. No `[]`-then-`null` equivalent exists for a single-entity
attribute (there's no "empty" intermediate value) -- the workaround applied there
instead is a direct entity-to-entity reassignment that never routes through `null` at
all (verified separately: an old-value -> different-non-null-value transition DOES
correctly register/unregister both sides), and, for the one attribute where the target
value is genuinely `null` (`IfcLocalPlacement.PlacementRelTo` when purging without a
disposable placeholder), relying instead on `removeDeep2`'s own independent
inverse-containment safety net rather than reproducing Python's defensive
pre-emptive clear (see `editObjectPlacement.ts`'s own header comment for the full
reasoning). This is this entry's second confirmed real-world hit, not a duplicate --
the underlying root cause and fix location in `attribute_value_shim.cpp` are identical
either way.

**Depends on / blocked by:** Nothing blocks other work landing -- the TS-level workaround already
in place is safe and correct regardless of whether/when the native fix lands. The native fix
itself needs a real `cmake` build environment to verify (this sandbox's own repeatedly-disclosed
constraint) -- pick up alongside any other native-core primitive-layer fix that has real CI/local
build access.

**UPDATE 2026-09-14 (`api.root` -- `remove_product` chunk): third confirmed hit, this time on a
SCALAR (single-entity-typed) attribute, plus a second, different TS-level workaround shape --**
Real Python's `remove_product` nulls `product.ObjectPlacement = None` before calling
`remove_deep2(file, object_placement)`, relying on that assignment dropping
`object_placement`'s own inverse count to 0 (real Python's own comment: "remove the inverse for
remove_deep2 to work"). Confirmed empirically (not assumed) that this port's
`product.set("ObjectPlacement", null)` hits the exact same root-cause bug this entry already
documents -- `getTotalInverses(objectPlacement)` stayed at 1 even after the nulling call,
causing `removeDeep2`'s own guard to silently refuse to remove the placement. This is a
genuinely NEW confirmed instance (a single entity-typed attribute, not an aggregate-of-entities
one like `unassignTypeRepresentation`'s `RepresentationMaps` case above) -- and it needed a
DIFFERENT workaround shape, since there's no "assign `[]` first" equivalent for a scalar
attribute: `src/ifcopenshell-ts/src/api/root/removeProduct.ts` instead calls `elementUtil
.removeDeep2(file, objectPlacement, [product])`, passing `product` via `removeDeep2`'s own
`alsoConsider` parameter (already-existing machinery, not new) so its inverse-containment check
treats `product`'s one forward reference to `objectPlacement` as "also being removed" without
ever touching the buggy null-assignment path at all -- `IfcFile.remove`'s own real, correct
auto-nulling of attributes referencing a just-deleted entity (`../group/removeGroup.ts`'s header
comment) then nulls `product.ObjectPlacement` as a side effect, reaching the identical final
state real Python's own working assignment achieves. Confirmed empirically against this
worktree's own built native addon. See `removeProduct.ts`'s own inline comment at this exact
call site for the full writeup, and `removeProduct.test.ts`'s "removing an element's local
placement" test for the regression coverage. Every previously-shipped or future chunk that ever
nulls a SCALAR entity-typed attribute (not just an aggregate one) and depends on the old
referenced entity becoming fully unreferenced should be treated as an equally-suspect case.

**UPDATE 2026-09-16 (`api.nest`/`api.resource` chunk): fourth confirmed hit, same SCALAR shape,
same workaround, this time on `IfcConstructionResource.BaseQuantity` --** Real Python's
`remove_resource_quantity` nulls `resource.BaseQuantity = None` before calling `remove_deep2(file,
old_quantity)`, same shape as `remove_product`'s `ObjectPlacement` case above. Confirmed
empirically (a real repro hit while writing this chunk's own test suite, not assumed) that this
port's `resource.set("BaseQuantity", null)` hits the exact same bug -- `getTotalInverses
(oldQuantity)` stayed at 1 after the nulling call, so `removeDeep2` silently refused to remove the
orphaned quantity (confirmed via `addResourceQuantity.test.ts`'s own resource-type/quantity-type
matrix test, which failed with a leftover `IfcPhysicalSimpleQuantity` count before this fix).
Same workaround shape as `removeProduct.ts`: `src/ifcopenshell-ts/src/api/resource/
removeResourceQuantity.ts` deliberately does NOT null `resource.BaseQuantity` itself -- it calls
`elementUtil.removeDeep2(file, oldQuantity, [resource])` while `resource.BaseQuantity` is still
live-pointing at `oldQuantity`, so the `alsoConsider` inverse-containment check succeeds via the
unaffected code path, and `IfcFile.remove`'s own auto-nulling clears `resource.BaseQuantity` as a
side effect of deleting `oldQuantity`. See `removeResourceQuantity.ts`'s own inline comment for
the full writeup, and `removeResourceQuantity.test.ts`/`addResourceQuantity.test.ts` for the
regression coverage. This is now the SECOND independent confirmation (beyond `removeProduct.ts`)
that this bug reaches any future chunk's explicit-null-clear-then-`removeDeep2` idiom, not a
one-off -- strengthens the case for prioritizing the native fix described above.

**UPDATE 2026-09-16 (`api.boundary` chunk): fifth confirmed hit, same SCALAR shape, same
workaround, this time on `IfcRelSpaceBoundary.ConnectionGeometry` --** Real Python's
`remove_boundary` nulls `boundary.ConnectionGeometry = None` before calling `remove_deep2(file,
geometry)`, the same shape as `remove_product`'s `ObjectPlacement`/`remove_resource_quantity`'s
`BaseQuantity` cases above. This chunk's own task brief explicitly required verifying this
specific case empirically rather than assuming the same workaround shape applies unmodified --
done via a disposable Node script against this worktree's own built native addon: the null-first
approach (`boundary.set("ConnectionGeometry", null)` then `removeDeep2(file, geometry)`) left
`getTotalInverses(geometry)` stuck at 1 forever, exactly reproducing this bug; the `alsoConsider`
workaround (`removeDeep2(file, geometry, [boundary])`, `boundary.ConnectionGeometry` deliberately
left untouched) correctly purged `geometry` and left `boundary.ConnectionGeometry` reading back as
`null` afterward (via `IfcFile.remove`'s own auto-nulling side effect). See
`src/ifcopenshell-ts/src/api/boundary/removeBoundary.ts`'s own header comment for the full writeup,
and `removeBoundary.test.ts`'s "removing a boundary also removes its connection geometry" test
(ported from real Python's own `test_removing_connection_geometry`) for the regression coverage.
This is now the THIRD independent confirmation (beyond `removeProduct.ts`/`removeResourceQuantity.ts`)
of this exact idiom, further strengthening the case for prioritizing the native fix described above.

**UPDATE 2026-09-16 (`api.georeference` chunk): sixth and seventh confirmed hits, same
SCALAR shape, same workaround, on `IfcGeometricRepresentationContext.TrueNorth` and
`IfcProjectedCRS.MapUnit` --** Real Python's `edit_true_north` nulls `context.TrueNorth =
None` before checking `get_total_inverses(old_true_north)` to decide whether to
`remove_deep2` it; `remove_georeferencing` nulls `projected_crs.MapUnit = None` before an
identical check. Both hit this exact root-cause bug, confirmed empirically against this
worktree's own built native addon before writing either file (not assumed to carry over
unmodified). Both worked around via the same `alsoConsider`-based reordering
`removeBoundary.ts`/`removeProduct.ts` already established: the old reference is
deliberately left LIVE while `removeDeep2(file, oldValue, [holder])` runs (so its
containment check sees a real, un-stale forward reference), with the actual attribute
clear happening either as a side effect of `IfcFile.remove`'s auto-nulling (when the old
value is genuinely deleted) or via an explicit, unconditional `.set(name, null)`
afterward (when it's shared and must survive -- a plain, un-gapped forward-attribute
clear on the STILL-LIVE holder entity, not the buggy "clear then check" sequence). See
`src/ifcopenshell-ts/src/api/georeference/editTrueNorth.ts`'s and
`src/ifcopenshell-ts/src/api/georeference/removeGeoreferencing.ts`'s own header comments
for the full writeup, and each file's own test suite for dedicated regression coverage
asserting the orphaned entity is genuinely removed (not just detached with a stale
reference) and that a genuinely shared one survives untouched. This is now the FOURTH and
FIFTH independent confirmations of this exact idiom.

---

### `api.unit.addMonetaryUnit`/`editMonetaryUnit` tests use `"ZWL"`/`"DOLLARYDOO"` currency codes that don't exist in IFC2X3's `IfcCurrencyEnum` -- another `SCHEMA_VERSIONS=4`-only silent-skip casualty -- **RESOLVED, stale entry never flipped (found during the 2026-09-25 TODOS.md sweep)**

**RESOLVED:** both test files already fix this -- `addMonetaryUnit.test.ts`'s "defaults to
DOLLARYDOO" case is `test.skipIf(schema === "IFC2X3")`-guarded, and the undo/redo tests in both
files use `"USD"`/`"GBP"` (valid on all 3 schemas), not `"ZWL"`. Confirmed directly against current
source -- no code work needed, this entry was just never flipped/archived after the fix landed
(likely as part of the 2026-09-22 "Reconcile IFC2X3 test failures newly exposed by CI schema
widening" fix pass).

**What:** `test/api/unit/addMonetaryUnit.test.ts`/`editMonetaryUnit.test.ts` (already-landed, PR
#74) use `describe.each(AVAILABLE_SCHEMAS)` and hardcode currency strings `"ZWL"`/`"DOLLARYDOO"`
for `IfcMonetaryUnit.Currency`. In IFC4+, `Currency` is a free-form `IfcLabel` (any string
accepted); in IFC2X3, it's a strict `IfcCurrencyEnum` with a fixed real-world-currency list that
does NOT include either string -- so these 3 test cases genuinely fail against a real IFC2X3
schema (`"Unable to find keyword in schema: ZWL"`/`"...DOLLARYDOO"`), not a flake.

**Why this was invisible until now:** `ci-ifcopenshell-ts.yml` builds the C++ core with
`-DSCHEMA_VERSIONS=4` (IFC4-only), so `AVAILABLE_SCHEMAS` silently filters IFC2X3 out of every
`describe.each(AVAILABLE_SCHEMAS)` suite in real CI today -- the exact, already-documented,
already-tracked gap in this file's own `"CI: SCHEMA_VERSIONS=4-only means IFC2X3/IFC4X3-
parameterized tests are silently skipped, not run"` entry above (dated 2026-09-09). This is a
second, concrete, real instance of that same documented pattern, not a new category of problem --
found only because this chunk's own local verification used a multi-schema-built native addon
(borrowed from a sibling worktree, see this chunk's own PR description) rather than the
IFC4-only one real CI builds.

**Fix:** Change the two IFC2X3-incompatible currency literals to a real `IfcCurrencyEnum` member
(e.g. `"USD"`) that's valid on all 3 schemas, or schema-parameterize the literal the same way
`createEntity.test.ts`'s own `IfcDoorStyle`/`IfcWindowStyle` IFC4X3 guard does (`if (schema !==
"IFC2X3") { ... }`) if exercising an intentionally-invalid-on-IFC2X3 value is itself the point.

**Context:** Found incidentally while independently verifying this chunk's own (`api.context`/
`api.geometry`) test suite against a real multi-schema native addon, 2026-09-13 -- confirmed via
`git stash` that this failure is 100% pre-existing (present on `v0.9.0`/PR #74's own landed
commit, unrelated to anything this chunk touched).

**Depends on / blocked by:** None -- trivial, standalone fix whenever someone has a multi-schema
addon to verify against (or picks up the broader `SCHEMA_VERSIONS` widening this file's other
entry already tracks).

---

### `api.material` `editLayer`/`editLayerUsage`/`reorderSetItem` tests crash on IFC2X3 by calling `addMaterial` with `category` -- a third `SCHEMA_VERSIONS=4`-only silent-skip casualty -- **RESOLVED, stale entry never flipped (found during the 2026-09-25 TODOS.md sweep)**

**RESOLVED:** none of the three test files pass a `category` to `addMaterial` anymore -- confirmed
directly against current source (each file's own header comment now documents the IFC2X3-safe,
no-`category` fixture convention). No code work needed, this entry was just never flipped/archived
after the fix landed (likely the same 2026-09-22 "Reconcile IFC2X3 test failures" fix pass as the
`addMonetaryUnit`/`editMonetaryUnit` entry above).

**What:** `test/api/material/editLayer.test.ts`/`editLayerUsage.test.ts`/`reorderSetItem.test.ts`
(already-landed, PR #97) use `describe.each(AVAILABLE_SCHEMAS)` with no IFC2X3 filter, and their
fixture setup calls `addMaterial(file, { name: ..., category: "..." })` -- e.g.
`addMaterial(file, { name: "PB01", category: "gypsum" })`. `addMaterial.ts`'s own header comment
(and its own IFC2X3-vs-IFC4+ disclosure) already documents that providing a truthy `category` on
an IFC2X3 file throws a native "no such attribute" error, since `IfcMaterial` has no `Category`
attribute at all on that schema. None of these three test files ever asserts on the material's
`Category` value -- it's purely decorative fixture data copied from the real Python docstring
examples -- so every one of these `addMaterial` calls genuinely crashes on IFC2X3 for no test-
relevant reason, not a flake.

**Why this was invisible until now:** Same root cause as this file's own `"api.unit.
addMonetaryUnit/editMonetaryUnit"` entry immediately above: `ci-ifcopenshell-ts.yml` builds the
C++ core with `-DSCHEMA_VERSIONS=4` (IFC4-only), so `AVAILABLE_SCHEMAS` silently filters IFC2X3 out
of every `describe.each(AVAILABLE_SCHEMAS)` suite in real CI today. Found only because the
`api.style` chunk 1 PR (#98) happened to run the full pre-existing suite against a locally-built
all-3-schemas native addon rather than CI's own IFC4-only one.

**Impact:** `editLayer.test.ts` (4 cases), `editLayerUsage.test.ts` (1 case), and
`reorderSetItem.test.ts` (2 of its cases -- the ones using named materials rather than the
bare-`name`-only fixture already present later in that same file) all throw when run against
IFC2X3 -- confirmed by grep, not yet re-run against a multi-schema addon by this session (no local
toolchain available to verify a fix here directly).

**Fix:** Drop the unused `category` (and, if present, `description`) argument from each offending
`addMaterial(...)` fixture call in these three test files -- `addMaterial(file, { name: "PB01" })`
is sufficient, matching `reorderSetItem.test.ts`'s own later, already-IFC2X3-safe fixture calls in
the same file (e.g. `addMaterial(file, { name: "AL01" })`).

**Context:** Found incidentally while independently reviewing PR #98 (`api.style` chunk 1) and
re-checking its own claim of "newly surfaced" pre-existing IFC2X3 failures against the exact
already-merged `api.material` chunk 4 files this session had personally reviewed for PR #97,
2026-09-15.

**Depends on / blocked by:** None -- trivial, standalone fix whenever someone has a multi-schema
addon to verify against.

---

### `api.pset.addPset`'s IFC2X3 material-properties dedup scan would crash on a malformed file with an unset `Material` -- **RESOLVED 2026-09-25 (TODOS.md sweep)**

**What:** `src/ifcopenshell-ts/src/api/pset/addPset.ts`'s `IfcMaterialDefinition`/`IfcMaterial`
branch, on IFC2X3, dedups existing `IfcMaterialProperties` instances via
`file.byType("IfcMaterialProperties").filter((d) => (d.get("Material") as EntityInstance).equals(product))`.
Real Python's equivalent generator expression, `(d for d in file.by_type("IfcMaterialProperties")
if d.Material == product)`, tolerates `d.Material` being `None` (`None == product` is just
`False`) -- but this port's `.equals(product)` call would throw a null-reference error if any
`IfcMaterialProperties` instance in the file happens to have no `Material` set.

**Why this is low-risk, not a live bug:** `IfcMaterialProperties.Material` is declared MANDATORY
(non-nullable, `Material: IfcMaterial` with no `| null`) in `ifc2x3.d.ts` -- a schema-valid file
can never actually have one of these unset. `addPset.ts`'s own creation path for this class
(`file.createEntity(ifcClass)` immediately followed by `properties.set("Material", product)`, both
within the same synchronous function call) also never leaves a newly-created instance in that
state observably to any other code. The only way to actually hit this is a file loaded from an
external, already-schema-invalid source (or a native primitive that constructs the entity without
immediately setting `Material`) -- not reachable through this port's own API surface today.

**Fix:** Guard the dedup filter with an optional-chaining/null check
(`(d.get("Material") as EntityInstance | null)?.equals(product) ?? false`) to match Python's
graceful `None == product -> False` behavior exactly, rather than throwing.

**Context:** Surfaced incidentally by a `/code-review` run (during the `api.pset` qto chunk, PR
#87) that hit its own documented fork-context-bleed bug and reviewed already-merged PR #86's diff
instead of PR #87's -- flagged for awareness rather than acted on immediately, since it's real but
very low practical risk. Not independently exercised against a real IFC2X3 file in this sandbox
(no multi-schema native addon available at review time).

**Depends on / blocked by:** None -- a trivial, one-line defensive fix whenever someone picks up
a small `api.pset` follow-up chunk.

**RESOLVED 2026-09-25:** guarded exactly as this entry's own "Fix" section specified
(`(d.get("Material") as EntityInstance | null)?.equals(product) ?? false`).

---

### `util.element.copyDeep`/`copy` cannot copy a "simple"/defined-type instance (e.g. `IfcLabel`) at all -- **RESOLVED 2026-09-25 (TODOS.md sweep)**

**What:** `src/ifcopenshell-ts/src/util/element.ts`'s `copy`/`copyDeep` both throw ("No forward
attribute at index 0 for instance of type '<Class>'") when asked to copy a "simple"/defined-type
EXPRESS instance (e.g. a standalone `IfcLabel("bar")`, `IfcText(...)`) -- whether passed directly
as the top-level argument, or reached indirectly via `copyDeep`'s own recursion into a forward
attribute that happens to hold one (e.g. an `IfcPropertySingleValue.NominalValue`). Confirmed by
direct repro against the built addon: `copy(file, createTypedValue(file, "IfcLabel", "bar"))`
throws on its own, in isolation, with no other code involved.

**Root cause:** Both functions call `attributeNameAt(result, i)` (to detect the `GlobalId` slot
needing regeneration) for every attribute index they iterate. `attributeNameAt` resolves via
`attributeCache.ts`'s `getClassAttributeMeta`, which is built from `entity.all_attributes()` --
an ENTITY-declaration-only schema introspection call. A defined/simple type (an EXPRESS `TYPE`
declaration, not an `ENTITY` one) has no such attribute-metadata entry to look up its own single
wrapped-value "attribute" by name against, so the lookup always fails for one, regardless of
which attribute index or what real value it wraps.

**Impact:** Any already-landed or future `api.*` function that calls `copy`/`copyDeep` on
something that could recurse into a populated simple-type leaf value hits this. Confirmed NOT
already hit by any of the 3 pre-existing call sites (`util/shapeBuilder.ts`'s 4 geometry-curve/
item copies, `api/pset/editPset.ts`'s single `EnumerationReference` copy) -- none of those ever
recurse into a populated simple-type attribute. First surfaced by `api/material/copyMaterial.ts`
(chunk 1 of `api.material`, this same session): `copyMaterialWithInverses`'s `IfcMaterialProperties`
branch calls `copyDeep(file, pset)` for each of a material's own property sets, matching real
Python's `copy_deep(file, pset)` exactly -- this works for a pset whose properties have no value
yet (`NominalValue: null`, an attribute value of `null` is skipped entirely before ever reaching
`attributeNameAt`), but throws the moment a property's `NominalValue` is an actual, populated
value. `copyMaterial.ts` itself is not at fault -- the throw comes from the shared utility.
Real Python's own `test_copy_a_material_with_properties` (`test/api/material/test_copy_material.py`)
needs this to work to pass for real; this port's own `copyMaterial.test.ts` splits that test in
two, porting the structural half (a pset WITH a property attached, just no value yet) for real
and pinning the value-copying half as a dedicated "throws" regression test instead.

**Fix:** Teach `copy`/`copyDeep` to special-case a simple/defined-type instance (detectable via
the native `declaration`'s own type-vs-entity introspection, or by checking `attributeCount() ===
1` combined with a failed/absent entity-declaration lookup) and copy its single wrapped value
directly via `getByIndex(0)`/`setByIndex(0, ...)`, bypassing the by-name `GlobalId`-detection path
entirely for that case (a defined type can never be `IfcRoot`-derived, so there is no `GlobalId`
concern to begin with).

**Context:** Surfaced during the `api.material` chunk 1 (`assign_material`/`unassign_material`/
`copy_material`, 2026-09-14), confirmed by direct, isolated repro against the built addon (not
assumed from the stack trace alone) before writing this entry.

**Depends on / blocked by:** None -- a self-contained fix to `util/element.ts`'s existing
`copy`/`copyDeep`, whenever someone picks up a follow-up chunk touching either function (or wants
to fully unblock `copyMaterial.test.ts`'s pinned "throws" test above).

**RESOLVED 2026-09-25:** both functions now special-case `!element.isEntity()` up front (empirically
confirmed `setByIndex(0, value)` on a freshly-created simple-type instance works fine -- the
`attribute_kind_of`-on-a-new-target gate other chunks hit is a DIFFERENT code path, materializing a
defined-type value as an ENTITY's own attribute, not writing directly to a standalone simple-type
instance's own single wrapped-value slot) and copy the single wrapped value directly via
`getByIndex(0)`/`setByIndex(0, ...)`, skipping the by-name `GlobalId` lookup entirely (a defined
type can never be `IfcRoot`-derived). `copyMaterial.test.ts`'s pinned "throws" test was flipped to
a real assertion matching real Python's own full `test_copy_a_material_with_properties`.

---

### `api.material.editProfileUsage`'s `CardinalPoint`-change branch needs `ifcopenshell.geom`/`util.shape.getX`/`getY` (not yet ported)

**What:** Real Python's `ifcopenshell.api.material.edit_profile_usage`, whenever a caller's
`attributes` actually change an `IfcMaterialProfileSetUsage`'s `CardinalPoint` (to a truthy value
genuinely different from the usage's current one), calls `update_cardinal_point()`, which builds
a throwaway single-entity `ifcopenshell.file`, strips fillet/rounding radii off a copy of the
profile curve in play, extrudes it via a dummy `IfcExtrudedAreaSolid`, calls
`ifcopenshell.geom.create_shape(...)` to actually triangulate it, then reads
`ifcopenshell.util.shape.get_x`/`get_y` off the resulting triangulation to compute one of 9
cardinal-point offsets, before patching every affected element's own body representation
`IfcSweptAreaSolid.Position`. This TS port has no `ifcopenshell.geom` binding of any kind (the
same pre-existing gap this file's very first entry, "`getAxis2placement`'s
`IfcAxis2PlacementLinear` fallback needs `ifcopenshell.geom`", already tracks, and the same
`util.shape` gap the "`util.shape`'s `ifcopenshell.geom`-dependent surface" entry tracks).
`src/ifcopenshell-ts/src/api/material/editProfileUsage.ts` ports every other real behavior of
this function correctly and independently (finding the profile curve in play via
`CompositeProfile`/`MaterialProfiles[0].Profile`, the real no-profile-at-all silent no-op guard,
and the final `attributes` setter loop), but throws a clear, disclosed error the instant it's
clear the geometry-kernel step would actually be needed (i.e. `CardinalPoint` genuinely changes
AND a profile is found) -- deliberately BEFORE building the dummy file, BEFORE patching any
element's representation, and BEFORE the function's own final `attributes` setter loop has
touched `usage` at all (real Python's own order-of-operations runs `update_cardinal_point()`
first). Editing any attribute other than `CardinalPoint`, or setting it to its own current value
or a falsy value, is entirely unaffected.

**Why:** `ifcopenshell.geom`/the `ifcopenshell.util.shape` functions that depend on it are a
substantial, separate native-geometry-kernel binding effort (OpenCASCADE-backed triangulation),
not something a single `api.material` chunk should build unilaterally -- exactly the same
reasoning this file's very first two entries already established.

**Impact:** Calling `editProfileUsage` with `attributes: { CardinalPoint: <new value> }` against
a usage whose profile set has a real profile (`CompositeProfile` or a non-empty
`MaterialProfiles`) throws `"editProfileUsage: changing CardinalPoint to <value> needs a
geometry-kernel-backed position calculation (ifcopenshell.geom.create_shape /
util.shape.get_x/get_y), not ported yet -- see TODOS.md."`. Pinned by a dedicated regression test
in `editProfileUsage.test.ts` (adapted from real Python's own `test_update_cardinal_point`, which
asserts a real geometric result this port cannot compute yet), alongside real, portable
assertions for every branch that doesn't need the geometry kernel (no `CardinalPoint` change, an
unchanged-value no-op, and the real no-profile-at-all early return).

**Fix:** Port an `ifcopenshell.geom` binding (see this file's first two entries' own "Fix"
sections for the shared scope: `create_shape`, `ifcopenshell_wrapper.CURVES_SURFACES_AND_SOLIDS`,
`W.triangulation`/`get_x`/`get_y` at minimum), then wire the real `calculate_position()`
computation back into `updateCardinalPoint` and restore real Python's own
`test_update_cardinal_point` assertions in place of the pinned "throws" test.

**Context:** Surfaced during the `api.material` chunk 4 (`edit_layer`/`edit_constituent`/
`reorder_set_item`/`edit_layer_usage`/`edit_profile`/`set_shape_aspect_constituents`/
`assign_profile`/`edit_profile_usage`, completing `api.material` at 26/26 files, 2026-09-15),
verified directly against the real 223-line `edit_profile_usage.py` source.

**Depends on / blocked by:** Same future `ifcopenshell.geom` binding effort as this file's first
two entries (not yet scheduled/started).

---

### RESOLVED -- `api.material.setShapeAspectConstituents` needed `ifcopenshell.api.style.assign_item_style` -- also discloses a real upstream bug (bug itself still open)

**Status: RESOLVED (`api.style` chunk 2, 2026-09-15).** `ifcopenshell.api.style.assign_item_style`
is now ported (`src/ifcopenshell-ts/src/api/style/assignItemStyle.ts`), and
`setShapeAspectConstituents.ts`'s own final loop now calls the real, landed `assignItemStyle`
instead of throwing the disclosed blocked error described below. The regression test that used to
pin the throw (`setShapeAspectConstituents.test.ts`) now asserts the real resulting
`IfcStyledItem`/`Styles` instead. The rest of this entry (kept for history) describes the
now-resolved blocker and the SEPARATE, STILL-OPEN upstream bug it was written alongside.

**What:** Real Python's `ifcopenshell.api.material.set_shape_aspect_constituents` ends with a
loop over an element's own representation items: for each item with a matching named shape
aspect whose name also matches one of the caller's own `materials` keys with a real style
attached, it calls `ifcopenshell.api.style.assign_item_style(file, item=item, style=style)`.
`ifcopenshell.api.style` has NO TS port of any kind (confirmed: no `api/style/` directory
anywhere under `src/ifcopenshell-ts/src/` -- a brand-new blocked module for this project, the
same treatment `../root/copyClass.ts`'s own `api.system` entry already established).
`src/ifcopenshell-ts/src/api/material/setShapeAspectConstituents.ts` ports every other real
behavior of this function correctly and independently (the material-set creation/reuse-check/
removal surgery, and the aspect/style matching logic itself), and throws a clear, disclosed error
ONLY at the exact point, and only for the exact item, where the real `assign_item_style` call
would actually be needed -- never proactively before the loop even starts.

This same file also discloses a real, verbatim-preserved upstream BUG, unrelated to the
`api.style` gap (this part is STILL OPEN -- not affected by the resolution above): the "reuse an
existing matching material constituent set" check reads
`material.is_a("IfcMaterialConstituent")` (a SET-ITEM class, never assignable as a
`RelatingMaterial`) where it should almost certainly read
`material.is_a("IfcMaterialConstituentSet")` (the class `ifcopenshell.util.element.get_material`
can actually return here). As written, this check is always `False`, so this function ALWAYS
creates a brand new `IfcMaterialConstituentSet` from scratch on every call, even when called
twice in a row with byte-for-byte identical `materials` -- it never reuses one. See
`setShapeAspectConstituents.ts`'s own header comment for the full writeup (including why even a
naive typo fix would immediately break on its own intended case, since the correct fix also needs
`MaterialConstituents` read off the SET, not the single item the current, always-losing branch
assumes).

**Why (the `api.style` gap, now resolved):** Same reasoning as every other genuinely-separate-
future-module entry in this file (e.g. `api.system`, `api.feature`, `api.grid`, `api.boundary`) --
`ifcopenshell.api.style` was a real, independent module (manages presentation
styles/`IfcSurfaceStyle`/`IfcStyledItem` assignment) that belonged under its own future chunk's
review scope, not squeezed into `api.material`'s -- and has since landed in full (13/13 files,
`api.style` chunks 1 and 2).

**Impact (historical, before the fix above):** Calling `setShapeAspectConstituents` used to throw
`"setShapeAspectConstituents: assigning item style for shape aspect '<name>' needs
api.style.assignItemStyle, not ported yet -- see TODOS.md."` only when an item's own shape aspect
name matched a `materials` key AND that material had a real style in `context` -- otherwise
(including every case where `element` has no shape-aspect-tagged representation items at all)
this function completed normally, with the material-set creation/removal surgery already having
run to completion. The disclosed reuse-bug (still open) means EVERY call still creates a brand new
material constituent set, never reusing an existing matching one -- pinned by a dedicated
regression test in `setShapeAspectConstituents.test.ts`.

**Fix:** ~~Port `ifcopenshell.api.style` (at minimum `assign_item_style`) as its own future chunk,
then wire the real call back into `setShapeAspectConstituents`'s own final loop.~~ Done (`api.style`
chunk 2, 2026-09-15). Separately (and independently of the now-resolved `api.style` gap, STILL
OPEN): decide whether to fix the disclosed
`is_a("IfcMaterialConstituent")`/`"IfcMaterialConstituentSet"` typo to match upstream once
upstream itself fixes it (or leave it as a deliberately-verbatim port of a real, currently-shipped
Python bug) -- see this file's own general policy of preserving real quirks/bugs verbatim rather
than silently "fixing" behavior upstream itself hasn't changed.

**Context:** Surfaced during the `api.material` chunk 4 (same chunk as the `editProfileUsage`
entry immediately above, completing `api.material` at 26/26 files, 2026-09-15), verified directly
against the real 115-line `set_shape_aspect_constituents.py` source. Resolved during the
`api.style` chunk 2 (completing `api.style` at 13/13 files, 2026-09-15).

**Depends on / blocked by:** Nothing -- resolved. The separate reuse-check bug above has no
dependency either; it's a deliberate verbatim-preservation decision, not a blocker.

### `api.style.unassignMaterialStyle`/`assignMaterialStyle` need `ifcopenshell.util.element.get_shape_aspects` (not yet ported)

**UPDATE (`api.style` chunk 2, 2026-09-15):** `assignMaterialStyle.ts` (the newly-landed inverse
of `unassignMaterialStyle.ts`, both described below) hits this EXACT SAME blocked dependency in its
own symmetric "handle material constituents and shape aspects" tail (`ifcopenshell.util.element
.get_shape_aspects`, called from `assign_material_style.py` immediately after
`get_elements_by_material`, exactly like the unassign side). `assignMaterialStyle.ts` throws its
own, differently-worded (but equally disclosed, equally non-proactive) error at the same kind of
point: `"assignMaterialStyle: matching material constituents to shape aspects for element #<id>
needs util.element.getShapeAspects, not ported yet -- see TODOS.md."`, gated by the exact same
conditions (a named material constituent AND at least one real element using the material) -- with
`assignMaterialStyle`'s own PRIMARY behavior (creating/reusing the material's own
`IfcStyledRepresentation` chain) always completing first, unaffected. Everything below (originally
written for `unassignMaterialStyle` alone) applies identically to both functions now.

**What:** Real Python's `ifcopenshell.api.style.unassign_material_style` ends with a "handle
material constituents and shape aspects" section: once it confirms `material` has at least one
named `IfcMaterialConstituent` inverse, it calls `ifcopenshell.util.element.get_elements_by_material`
(already ported, `util/element.ts`'s `getElementsByMaterial`) to find every element using that
material, then `ifcopenshell.util.element.get_shape_aspects(element)` on each one to collect shape
aspects whose name might match a constituent name (so the matching aspect's own representations can
have the style unassigned via `ifcopenshell.api.style.unassign_representation_styles`, itself
already ported in this same chunk). `get_shape_aspects` itself has NO TS port of any kind --
confirmed absent from `src/ifcopenshell-ts/src/util/element.ts`, whose own header comment
explicitly lists it as out of scope across all 3 of that file's own already-landed chunks ("calls
`ifcopenshell.util.representation`, a not-yet-ported Tier B module" -- a claim worth re-checking:
reading the real 36-line `get_shape_aspects` source directly shows it does NOT actually call
`util.representation` at all, only `get_type` -- already ported -- and direct `Representation`/
`RepresentationMaps` attribute access; the original blocking rationale may already be stale, but
porting a function outside this chunk's assigned 7 `api.style` files was kept out of scope here
regardless, per this project's own "do not inline a risky partial port for a dependency outside the
module under review" discipline).

`src/ifcopenshell-ts/src/api/style/unassignMaterialStyle.ts` ports every other real behavior of
this function correctly and independently (the full representation/styled-item unassignment loop,
which always runs to completion regardless of material constituents; the material-constituent-name
collection; the early return when there are none), and throws a clear, disclosed error ONLY at the
exact point, and only for the exact element, where the real `get_shape_aspects` call would actually
be needed -- never proactively, and never before the function's own real, unconditional mutations
(the first loop) have already run.

**Why:** Same reasoning as this file's own general policy for a genuinely-separate, out-of-scope
dependency: `ifcopenshell.util.element.get_shape_aspects` is a real function belonging to
`util.element`'s own future chunk (should one be needed) or a small standalone follow-up, not
squeezed into `api.style` chunk 1's review scope.

**Impact:** Calling `unassignMaterialStyle` throws
`"unassignMaterialStyle: matching material constituents to shape aspects for element #<id> needs
util.element.getShapeAspects, not ported yet -- see TODOS.md."` only when `material` is used by at
least one named `IfcMaterialConstituent` AND `get_elements_by_material` finds at least one real
element using that material (directly, or via a material set) -- otherwise (including every case
where `material` is a plain, non-constituent material) this function completes normally, with the
direct material-style unassignment (its primary, documented behavior) having already run to
completion.

**Fix:** Port `ifcopenshell.util.element.get_shape_aspects` (a small, ~20-line function -- `get_type`
plus direct `Representation.HasShapeAspects`/`RepresentationMaps[].HasShapeAspects` attribute reads,
per the real source) into `util/element.ts`, then wire the real call back into BOTH
`unassignMaterialStyle.ts`'s own loop AND `assignMaterialStyle.ts`'s own (symmetric) loop. Note
real Python's own `getattr(element, "Representation", ...)` sentinel trick distinguishes "this
class declares no `Representation` attribute at all" (an `IfcTypeProduct`) from "the attribute
exists but is `None`" (a plain `IfcProduct` with no geometry) -- but in the LATTER case, real
Python still proceeds to read `representation.HasShapeAspects` on a `None` value, which crashes
with a real `AttributeError` upstream. Any future port of this function should preserve that
crash-on-`None` behavior verbatim (matching this project's own "preserve real quirks/bugs verbatim"
policy), not silently guard against it.

**Context:** Surfaced during the `api.style` chunk 1 (7 files: `add_style`/`remove_style`/
`remove_surface_style`/`remove_styled_representation`/`edit_presentation_style`/
`unassign_material_style`/`unassign_representation_styles`, 2026-09-15), verified directly against
the real 102-line `unassign_material_style.py` source and the real 36-line
`util.element.get_shape_aspects` source. Confirmed to affect `assign_material_style.py` too (its
exact inverse) during the `api.style` chunk 2 (6 files, completing `api.style` at 13/13,
2026-09-15), verified directly against the real 247-line `assign_material_style.py` source.

**Depends on / blocked by:** `ifcopenshell.util.element.get_shape_aspects` (not yet ported).

---

### `api.style.addSurfaceTextures`'s `material` parameter has no TS/Node equivalent -- permanently out of scope, not a "port later" item

**What:** Real Python's `ifcopenshell.api.style.add_surface_textures(file, material=None,
textures=None, uv_maps=None)` accepts an OPTIONAL `material: bpy.types.Material` parameter (a
Blender material definition) and, when provided, walks that material's own glTF-compatible
Blender node tree (`material.node_tree.nodes`, node types like `BSDF_PRINCIPLED`/`MIX_SHADER`/
`TEX_IMAGE`/`NORMAL_MAP`/`SEPRGB`, socket links, `node.image.filepath`) to auto-detect diffuse/
normal/metallic-roughness/occlusion/emissive texture maps, finally importing `bonsai.tool` (a
Blender ADDON, not part of `ifcopenshell` itself) inside its own `create_surface_texture` helper.
`src/ifcopenshell-ts/src/api/style/addSurfaceTextures.ts` throws a clear, loud error when `material`
is actually supplied (non-`null`/non-`undefined`) -- but only LAST, matching real Python's own exact
order of operations: (1) the IFC2X3 early-return runs first, UNCONDITIONALLY (`material` is never
even inspected on that schema); (2) the full `textures` (list-of-dicts) loop -- fully portable, and
the ONLY path real Python's own test suite (`test_add_surface_textures.py`) ever exercises -- always
runs to completion, creating every real texture, regardless of whether `material` was also supplied;
(3) only then is `material` checked and thrown on. Never thrown proactively, and never before either
of the above two real, portable behaviors has already run (a `code-review` finding on the initial PR
for this chunk -- the first version of this file checked `material` first, which would have wrongly
thrown for a `material` supplied on an IFC2X3 file, and wrongly discarded already-creatable textures
when both `textures` and `material` were supplied together).

**Why:** Unlike every OTHER "genuinely unported dependency" entry in this file, this is NOT a
"hasn't been ported yet" gap -- there is no TS/Node representation of `bpy.types.Material` (or any
Blender node-tree concept) to accept as a parameter in the first place, since a Node.js native
addon has no running Blender process to query. This dependency cannot be "finished" the way
`util.element.getShapeAspects` (above) eventually can; it is architecturally out of scope for this
project for as long as IfcOpenShell-TS targets a plain Node addon rather than a Blender-embedded
Python/JS bridge.

**Impact:** Calling `addSurfaceTextures(file, { material: someValue })` (any non-`null`/
non-`undefined` value) throws
`"addSurfaceTextures: the \`material\` (Blender node-tree) parameter has no TS/Node equivalent --
see this file's own header comment and TODOS.md."` -- but on an IFC2X3 file, this NEVER throws at
all (the schema check returns `[]` first, unconditionally, before `material` is ever inspected); on
IFC4/IFC4X3, it throws only after the full `textures` loop has already run to completion, so any
`textures` supplied ALONGSIDE `material` are still created for real before the throw (there is no
meaningful "further partial" behavior to preserve beyond that, since the two parameters otherwise
represent mutually exclusive real Python usage modes -- "Either `material` or `textures` should be
provided", per real Python's own docstring). Every real call passing `textures=`/omitting `material`
is completely unaffected and was ported in full.

**Fix:** None planned -- this is a permanent, disclosed scope boundary, not a backlog item. If this
project ever needs to support Blender-driven texture auto-detection (e.g. as part of a future
Bonsai-on-Node integration), it would need its own bespoke design (there is no faithful "port" of a
live Blender node-tree traversal into a headless Node addon), not a straightforward translation of
this function's own Blender-specific helpers (`detect_normal_map`/`detect_emissive_map`/
`detect_metallicroughness_map`/`detect_occlusion_map`/`detect_diffuse_map`/
`detect_unlit_emissive_map`, all left unported in `add_surface_textures.py`'s own source, never
even attempted here).

**Context:** Surfaced during the `api.style` chunk 2 (6 files, completing `api.style` at 13/13,
2026-09-15), verified directly against the real 204-line `add_surface_textures.py` source.

**Depends on / blocked by:** Nothing scheduled -- see "Fix" above.

---

### `api.geometry.addProfileRepresentation`'s `getX`/`getY` need `ifcopenshell.geom`/`util.shape.get_x`/`get_y` for any profile outside a 10-class closed-form allowlist (not yet ported)

**What:** Real Python's `ifcopenshell.api.geometry.add_profile_representation` computes a
profile's own bounding-box X/Y extent (needed for `CardinalPoint` values `"bottom left"`/
`"bottom centre"`/`"bottom right"`/`"mid-depth left"`/`"mid-depth right"`/`"top left"`/
`"top centre"`/`"top right"`) via `Usecase.get_x`/`get_y`. Both methods special-case exactly 10
concrete profile classes with a closed-form formula (`IfcAsymmetricIShapeProfileDef`,
`IfcCShapeProfileDef`, `IfcCircleProfileDef`, `IfcEllipseProfileDef`, `IfcIShapeProfileDef`,
`IfcLShapeProfileDef`, `IfcRectangleProfileDef`, `IfcTShapeProfileDef`, `IfcUShapeProfileDef`,
`IfcZShapeProfileDef`) -- all 10 ported completely, faithfully, and for real in this chunk. Any
OTHER profile (an arbitrary/composite/derived profile, or any parameterized profile class outside
that list) falls to the real `else` branch: build `ifcopenshell.geom.settings()`, call
`ifcopenshell.geom.create_shape(settings, self.profile)` (a real OpenCASCADE-backed BRep/
triangulation build), then read `ifcopenshell.util.shape.get_x(shape)`/`get_y(shape)` off the
resulting mesh's own bounding box. This TS port has no `ifcopenshell.geom` binding of any kind --
the SAME pre-existing, already-tracked gap this file's own earlier entries cover
(`getAxis2placement`'s `IfcAxis2PlacementLinear` fallback, `util.shape`'s entire kernel-dependent
surface, and `api.material.editProfileUsage`'s own `CardinalPoint`-change branch, which needs the
identical `get_x`/`get_y` pair for the identical reason) -- not a genuinely new binding gap, just
the 4th real call site to hit it. `src/ifcopenshell-ts/src/api/geometry/addProfileRepresentation.ts`
ports every other real behavior of this function correctly and completely (every one of the 10
allowlisted profile classes' own closed-form `getX`/`getY`; every `CardinalPoint` value that never
needs either method at all -- falsy/`null`, `"mid-depth centre"`, and the 10 values from
`"geometric centroid"` onward, which real Python's own unfinished `# TODO other cardinal points`
comment already never implements either; the full `clippings`/`Clipping.apply`/existing-
`IfcBooleanResult`-copy chain; `placementZxAxes`; unit-scale conversion of `depth`), and throws a
clear, disclosed error ONLY at the exact point, for the exact axis, where the real kernel call
would actually be needed -- never proactively, and never for a profile/`CardinalPoint` combination
that doesn't actually reach the blocked `else` branch.

**Why:** Same reasoning as this file's earlier `ifcopenshell.geom` entries: a real OpenCASCADE-
class BRep/triangulation kernel is a substantial, separate native-binding effort, not something a
single `api.geometry` chunk should build unilaterally.

**Impact:** Calling `addProfileRepresentation` with a `cardinalPoint` that resolves to one of the
8 kernel-dependent values (see "What") against a `profile` outside the 10-class allowlist throws
`"addProfileRepresentation: computing the bounding-box <X|Y> extent of a '<profile.isA()>' profile
(needed for the 'bottom left'/'bottom centre'/'bottom right'/'mid-depth left'/'mid-depth right'/
'top left'/'top centre'/'top right' cardinalPoint values) needs a real geometry kernel (Python:
ifcopenshell.geom.create_shape + ifcopenshell.util.shape.get_x/get_y), which this TS port doesn't
have -- see TODOS.md."`. Every other combination (any profile with a non-kernel-dependent
`cardinalPoint`; OR any `cardinalPoint` at all against one of the 10 allowlisted profile classes)
completes normally, with a real, correct result. Pinned by a dedicated regression test in
`addProfileRepresentation.test.ts` (a hand-built `IfcArbitraryClosedProfileDef`, adapted from real
Python's own `test_run` -- see that test file's own header comment for why real Python's own test
fixture, built via `ShapeBuilder.rectangle()`/`.profile()`, itself always lands on this exact
blocked path, on every schema, today), alongside full, real, passing test coverage for all 10
allowlisted profile classes and every non-kernel-dependent `CardinalPoint` value.

**Fix:** Port an `ifcopenshell.geom` binding (see this file's first two entries' own "Fix"
sections for the shared scope: `create_shape`, `ifcopenshell_wrapper.CURVES_SURFACES_AND_SOLIDS`,
`W.triangulation`/`get_x`/`get_y` at minimum), then wire the real kernel call back into `getX`/
`getY`'s own final `else` branch, restoring real Python's own `test_run` assertion (currently
pinned as a "throws" test) in its place.

**Context:** Surfaced during the `api.geometry` chunk landing `add_profile_representation` (224
lines, the 26th of ~29 real `api.geometry` files), verified directly against the real source.

**Depends on / blocked by:** Same future `ifcopenshell.geom` binding effort as this file's
`getAxis2placement`/`util.shape`/`editProfileUsage` entries above (not yet scheduled/started).

---

### `api.geometry.addWindowRepresentation` is blocked end-to-end, on every `TargetView`/schema
combination, by the SAME 2 pre-existing primitive-layer gaps `util/shapeBuilder.ts` already
tracks -- not a new binding gap, just this project's most pervasive real-world call site for
them so far

**What:** `add_window_representation.py` (779 lines, the largest `api.geometry` file ported so
far) is a parametric window-geometry generator that makes heavy, load-bearing use of
`ShapeBuilder.rectangle()`/`.polyline(closed=true)`/`.profile()` -- all three already disclosed
as blocked in `util/shapeBuilder.ts`'s own header comment by 2 pre-existing `entityInstance.ts`
gaps: (1) `.profile()` unconditionally throws via `.get("Dim")` (the EXPRESS DERIVED-attribute
gap, `TODOS.md`'s "`util.representation.guessType`'s `Curve2D`/... branches..." entry above);
(2) `.rectangle()`/`.polyline(closed=true)` throw on IFC4/IFC4X3 only, via the `IfcLineIndex`/
`IfcArcIndex` defined-type-creation gap (`TODOS.md`'s "`EntityInstance.setByIndex`/
`IfcFile.createEntity` cannot write an initial value into a freshly created simple/defined-type
instance" entry above), but are fully functional on IFC2X3.

Traced precisely and confirmed EMPIRICALLY (by actually running this chunk's own test suite, not
just reasoned about): **on IFC4/IFC4X3, gap (2) is reached FIRST in literally every code path this
file has** (`ELEVATION_VIEW`'s/`PLAN_VIEW`'s own `rectangle()` calls; the main `MODEL_VIEW`
per-panel loop's `createIfcWindowFrameSimple`, whose OWN two branches both call `rectangle()`/
`polyline(closed=true)` before ever reaching `.profile()`) -- gap (1)'s `.profile()` `Dim` check is
therefore NEVER actually reached on IFC4/IFC4X3 for this file. Only on IFC2X3 (where `rectangle()`/
`polyline(closed)` are fully functional) does execution get far enough to hit gap (1) instead (via
`.profile()` directly in the `MODEL_VIEW` path, or via `util.representation.guessType`'s identical
`.get("Dim")` call inside `ELEVATION_VIEW`'s/`PLAN_VIEW`'s own final `getRepresentation()` call).
Net result: **the real 3D solid window geometry this function exists to build cannot be produced
today, on ANY schema** -- ported completely and faithfully anyway (every branch -- 9 different
`partitionType` panel layouts, mullion/transom offset math, L-shaped-lining detection, the 2D
plan-view lining/frame layout, the elevation-view rectangle -- is real, correct, verbatim-
translated control flow, reachable end-to-end the moment both underlying gaps are fixed, with zero
further changes needed in `addWindowRepresentation.ts`).

A SEPARATE, independent, genuine upstream-Python BUG (not a TS-port gap, see
`addWindowRepresentation.ts`'s own header comment for the full writeup) pre-empts even reaching
either ShapeBuilder gap for the common case: real Python's own public wrapper function calls
`Usecase.convert_si_to_unit()` to compute `overall_height`/`overall_width`'s own documented
defaults (0.9m/0.6m) BEFORE `Usecase.settings` is ever assigned, raising
`AttributeError: 'Usecase' object has no attribute 'settings'` -- i.e. every real call omitting
either dimension (the documented default, most-common usage) crashes upstream too, before any
geometry work begins. Preserved verbatim as an explicit, same-shaped throw; not tracked here as a
"fix later" item since there is nothing to port differently without deviating from real Python's
own actual behavior.

**Why not fixed now:** Same reasoning as every other entry in this file citing these 2 gaps: both
are foundational `entityInstance.ts` primitive-layer changes (EXPRESS DERIVED-attribute execution;
freshly-created-defined-type initial-value support), not something a single `api.geometry` chunk
should patch unilaterally.

**Impact:** `addWindowRepresentation()` throws for every real invocation today: the settings-order
bug's own descriptive error if either `overallHeight`/`overallWidth` is omitted; otherwise, on
IFC4/IFC4X3, `"Attribute access is only supported on entity instances"` (gap 2); on IFC2X3,
`"entity instance of type '...' has no attribute 'Dim'"` (gap 1). Pinned by ~50 dedicated
regression tests in `addWindowRepresentation.test.ts` covering every `TargetView` x schema
combination, all 9 `partitionType`s, both exported helper functions (`createIfcWindowFrameSimple`/
`createIfcWindow`), and the pure-logic `windowLShapeCheck`/`DEFAULT_PANEL_SCHEMAS` (unaffected by
either gap).

**Fix:** Same 2 fixes as this file's other entries citing these gaps (EXPRESS DERIVED-attribute
execution in `entityInstance.ts`, or a narrower `util.representation`-local re-implementation for
gap 1; teaching `EntityInstance.setByIndex` to skip the `attribute_kind_of` lookup for a non-entity
target instance for gap 2) -- once either lands, this file's own tests (currently pinned as
"throws the disclosed error") should be revisited and, where the underlying call now succeeds,
converted to real geometry assertions.

**Context:** Surfaced while landing `add_window_representation` (779 lines, bringing `api.geometry`
to 26 of ~29 real files landed, by far the largest yet), verified directly against the real source
and this project's own already-built native addon (both gaps, and the upstream Python bug,
confirmed empirically, not assumed).

**Depends on / blocked by:** Same 2 foundational `entityInstance.ts` fixes as
`util.representation.guessType`'s entry (gap 1) and `EntityInstance.setByIndex`'s entry (gap 2)
above (neither yet scheduled/started).

**UPDATE 2026-09-22 (Phase EX-2 chunks 1+2) -- gap 1 RESOLVED for IFC2X3, gap 2 still real on
IFC4/IFC4X3:** see `util.representation.guessType`'s own entry above for the full writeup.
`addWindowRepresentation` now completes end-to-end on IFC2X3 for every `TargetView`/`partitionType`
combination (verified directly against the real, built native addon) -- IFC4/IFC4X3 are unchanged
(gap 2 still fires first, unrelated to Phase EX-2). All ~50 regression tests in
`addWindowRepresentation.test.ts` were updated: the IFC2X3 branches now assert a genuinely-completed
`IfcShapeRepresentation` with a minimal, structural-sanity shape (`RepresentationIdentifier`/
`RepresentationType`/`Items` count and entity class) rather than the old disclosed throw; IFC4/IFC4X3
branches are unchanged. Deep geometric-fidelity verification (exact panel/mullion/frame placement
per `partitionType`) is explicitly NOT part of this update -- real, disclosed, scoped-out follow-up
work, comparable in size to its own dedicated verification chunk.

### `api.geometry.addDoorRepresentation` hits the SAME 2 pre-existing primitive-layer gaps as
`addWindowRepresentation` above, plus its own independently-reverified copy of the same
upstream-Python evaluation-order bug -- NOT a new gap, but with one genuinely NEW positive
finding (a real, unblocked code path)

**What:** `add_door_representation.py` (675 lines, landed directly after `add_window_representation`)
is a parametric door-geometry generator (lining/threshold/casing/panel/handle solids across
single/double-swing, double-door, and sliding `operation_type`s, plus an optional on-top "transom"
window built via `add_window_representation`'s own `create_ifc_window`). It hits the exact same 2
`util/shapeBuilder.ts`/`entityInstance.ts` primitive-layer gaps as the entry immediately above this
one (the `.profile()` `Dim`-DERIVED-attribute gap; the `.rectangle()`/`.polyline(closed=true)`
`IfcLineIndex`/`IfcArcIndex` defined-type-creation gap) -- not a new binding gap, just another
pervasive real-world call site. One structural difference from `add_window_representation`: this
file's own `createIfcDoorLining`/`createIfcBox` never call `.profile()` explicitly themselves --
they pass a raw curve/rectangle straight into `builder.extrude()`, whose own internal
`if (!profile.isA("IfcProfileDef")) profile = this.profile(profile)` auto-wrap is what reaches gap 1
(reached one call-frame deeper than window's own explicit `.profile()` call sites, same underlying
gap).

A SEPARATE, independent, genuine upstream-Python BUG (not a TS-port gap) also applies here, THE SAME
SHAPE as the one already documented above for `add_window_representation`, independently
re-verified against THIS file's own actual source lines (not assumed identical): real Python's own
public wrapper calls `Usecase.convert_si_to_unit()` to compute `overall_height`/`overall_width`'s
own documented defaults BEFORE `Usecase.settings` is ever assigned, raising `AttributeError:
'Usecase' object has no attribute 'settings'` for every real call omitting either dimension. This
file's own documented defaults are 2.0m/0.9m (confirmed by reading this file's own docstring and
`settings.update(...)` call directly -- DIFFERENT from window's own 0.9m/0.6m, not assumed
identical). Preserved verbatim as an explicit, same-shaped throw; not tracked as a "fix later" item
for the same reason as window's own entry.

**One genuinely NEW finding, not present in `add_window_representation`:** this file's own
`PLAN_VIEW` + `ContextIdentifier === "Annotation"` sub-branch (the sliding-door arrow-symbol
representation; non-sliding doors just return `null` here, no representation, no throw) is
**genuinely UNBLOCKED today, on every schema.** Traced precisely and confirmed EMPIRICALLY (by
actually running this chunk's own test suite): its own 2 `builder.polyline(...)` calls are both
left `closed` at the default `false` (real Python never passes `closed=True` here, unlike every
other lining/panel curve in this entire file), so gap 2 is never reached; its own final
`builder.getRepresentation(context, items2d, "Curve2D")` call passes an EXPLICIT
`representationType`, bypassing `guessType()` entirely, so gap 1 is never reached either. This is
the ONE code path across BOTH this file and `add_window_representation`'s own equally-blocked
branches that actually produces a real, non-throwing `IfcShapeRepresentation` today -- pinned with
real geometry assertions (not "throws the disclosed error") in `addDoorRepresentation.test.ts`. A
further quirk found while building those tests: `door_swing_type` is never computed or read in this
early-return branch, so `SLIDING_TO_LEFT`/`SLIDING_TO_RIGHT` produce byte-identical annotation
geometry -- confirmed empirically, preserved verbatim (see `addDoorRepresentation.ts`'s own header
comment for the full writeup).

**Why not fixed now:** Same reasoning as the entry immediately above: both gaps are foundational
`entityInstance.ts` primitive-layer changes, not something a single `api.geometry` chunk should
patch unilaterally.

**Impact:** `addDoorRepresentation()` throws for every real invocation today except the
`PLAN_VIEW`+`Annotation` sliding-door case: the settings-order bug's own descriptive error if either
`overallHeight`/`overallWidth` is omitted; otherwise, on IFC4/IFC4X3, `"Attribute access is only
supported on entity instances"` (gap 2); on IFC2X3, `"entity instance of type '...' has no attribute
'Dim'"` (gap 1). Pinned by 26 dedicated regression tests in `addDoorRepresentation.test.ts` covering
every `TargetView`/`ContextIdentifier` combination, all 9 `operationType`s, both exported helper
functions (`createIfcDoorLining`/`createIfcBox`), the pure-logic `doorLShapeCheck`, and the
genuinely-unblocked `Annotation` branch's own real geometry.

**Fix:** Same 2 fixes as the entry immediately above (EXPRESS DERIVED-attribute execution in
`entityInstance.ts` for gap 1; teaching `EntityInstance.setByIndex` to skip the
`attribute_kind_of` lookup for a non-entity target instance for gap 2) -- once either lands, this
file's own tests should be revisited the same way as `addWindowRepresentation.test.ts`'s own.

**Context:** Surfaced while landing `add_door_representation` (675 lines, bringing `api.geometry` to
27 of ~29 real files landed), verified directly against the real source and this project's own
locally-built native addon (both gaps, the upstream Python bug, and the `Annotation`-branch positive
finding, all confirmed empirically, not assumed).

**Depends on / blocked by:** Same 2 foundational `entityInstance.ts` fixes as
`util.representation.guessType`'s entry (gap 1) and `EntityInstance.setByIndex`'s entry (gap 2)
above (neither yet scheduled/started) -- same dependency as the `add_window_representation` entry
immediately above this one.

**UPDATE 2026-09-22 (Phase EX-2 chunks 1+2) -- gap 1 RESOLVED for IFC2X3, gap 2 still real on
IFC4/IFC4X3:** see `util.representation.guessType`'s own entry above for the full writeup.
`addDoorRepresentation` now completes end-to-end on IFC2X3 for every `TargetView`/`operationType`
combination (verified directly against the real, built native addon), including the previously
"real, measurable progress, not an immediate throw" `PLAN_VIEW` case, which now fully completes
rather than merely progressing further before its old disclosed throw. IFC4/IFC4X3 are unchanged.
All regression tests in `addDoorRepresentation.test.ts` were updated the same way as
`addWindowRepresentation.test.ts`'s own (minimal, structural-sanity assertions on IFC2X3; IFC4/IFC4X3
branches unchanged). Deep geometric-fidelity verification (exact lining/panel/swing-arc placement per
`operationType`) is explicitly NOT part of this update -- same scoped-out follow-up as
`addWindowRepresentation`'s entry.

**Note, NOT independently re-verified as part of this update (flagged for whoever next touches
`api.geometry.addRailingRepresentation`'s own entry below):** that entry's own Finding A cites the
exact same `pathCurve.get("Dim")` call (via `ShapeBuilder.createSweptDiskSolid`) as this gap -- so it
plausibly also closes for IFC2X3 as of this update. `addRailingRepresentation.test.ts`'s own
regression test for this already uses a 3-way alternation regex
(`/has no attribute 'Dim'|Attribute access is only supported on entity instances|Arcs are not
supported for IFC2X3\./`) that still passed, unmodified, against this chunk's own full-suite run --
so it is not a broken/failing test, but it may now be passing because a DIFFERENT one of its 3
alternatives matches (the `IFC2X3`-specific "Arcs are not supported" error) rather than the `Dim`
one it originally documented. Not investigated further here -- out of this chunk's own scope (only
the 4 files this chunk's own test run actually reported as failing were investigated/fixed:
`addWindowRepresentation`/`addDoorRepresentation`/`regenerateWallRepresentation`/`validateType`).

---

### `api.geometry.addRailingRepresentation` is blocked on LITERALLY EVERY input, on every schema
(a stronger finding than `addWindowRepresentation`/`addDoorRepresentation`'s own) -- plus a
genuinely NEW, independent upstream-Python bug (an incomplete `except` clause) found in this
chunk

**What:** `add_railing_representation.py` (646 lines) is a parametric WALL_MOUNTED_HANDRAIL
railing-geometry generator. UNLIKE `add_window_representation`/`add_door_representation`, it has NO
internal `Usecase` class at all -- real Python already splits it (deliberately, per its own
`ifcopenshell/api/geometry/__init__.py` comment: "the pilot for a 'pure-compute + IFC-wrap' split")
into a pure-geometry compute function (`compute_wall_mounted_handrail_geometry`, zero
`ifcopenshell.file` dependency) and a thin `ShapeBuilder`-based IFC-wrapping function
(`add_railing_representation` itself).

This chunk explicitly checked (per its own required process) whether the SAME evaluation-order bug
disclosed for `add_window_representation`/`add_door_representation` (`Usecase.settings` accessed via
`convert_si_to_unit()` before it is ever assigned) applies here too. **It does not** -- there is no
`Usecase`/`self.settings` in this file at all, and its own `unit_scale`-then-every-other-default
resolution order, traced line-by-line, is correct.

**Finding A -- `addRailingRepresentation` itself is blocked on literally every input, on every
schema (stronger than window/door's own "most real-world inputs are blocked"):**
`ShapeBuilder.createSweptDiskSolid` (`util/shapeBuilder.ts`) reads `pathCurve.get("Dim")` to
validate the curve is 3D -- the SAME already-tracked `entityInstance.ts` DERIVED-attribute gap as
`util.representation.guessType`'s entry above (`.get("Dim")` unconditionally throws for ANY entity,
on every schema, since "Dim" is never a real EXPLICIT attribute). `add_railing_representation` calls
`create_swept_disk_solid` UNCONDITIONALLY -- once per support (if any) and, with no branch that
skips it, once more for the handrail polyline itself at the very end. There is no
input/parameter/schema combination that avoids this call (confirmed by tracing every branch, not
assumed) -- unlike `add_door_representation`'s own genuinely-unblocked `PLAN_VIEW`+`Annotation`
sliding-door branch, which never calls `extrude()`/`.profile()` at all. **`addRailingRepresentation()`
therefore throws for every real invocation, full stop.** The SAME already-tracked `IfcLineIndex`/
`IfcArcIndex` defined-type-creation gap (`EntityInstance.setByIndex`/`IfcFile.createEntity` entry
above, IFC4/IFC4X3 only) is typically reached even earlier: every support's own `arc_polyline` is
swept via a FIXED, always-non-empty `arcPoints=[1]` (every support arc is a 3-point arc), and the
documented `terminalType="180"` default also always produces a non-empty
`handrailArcPointIndices` -- so on IFC4/IFC4X3, the very first support (or, with 0 supports, the
final handrail polyline) typically throws via this gap before `createSweptDiskSolid` is ever
reached; on IFC2X3 (which never needs `IfcLineIndex`/`IfcArcIndex`), execution gets further but
still always hits `createSweptDiskSolid`'s own unconditional throw. Net effect: the pure-geometry
compute function this module was deliberately split out for (`computeWallMountedHandrailGeometry`)
is genuinely, fully UNBLOCKED today, with zero IFC dependency at all; the thin IFC-wrapping layer on
top of it is 100% blocked, on every input, on every schema, with no exception -- ported completely
and faithfully anyway.

**Finding B -- a genuinely NEW, independent upstream-Python bug found by this chunk (not one of the
2 primitive-layer gaps above): `_add_arcs_on_turning_points`'s degenerate-fillet fallback has an
incomplete `except` clause.** `_get_fillet_points` calls `np_intersect_line_line`
(`ifcopenshell.util.shape_builder`, already landed as `npIntersectLineLine` in
`util/shapeBuilder.ts`) to locate the fillet arc's centre -- confirmed by reading its real source
directly, that function raises a plain `ValueError` ("Lines are parallel and do not intersect
uniquely.") for parallel lines. `_add_arcs_on_turning_points`'s own call site, however, only catches
`except (ZeroDivisionError, FloatingPointError):` -- a `ValueError` is neither, so it propagates
UNCAUGHT, crashing the whole compute function instead of falling back to a sharp-vertex corner the
way every OTHER degenerate case already does. This is reachable in practice, not merely
theoretical: `getFilletPoints`'s own 2 intermediate lines are just `dir1`/`dir2` rotated 90 degrees
about a shared normal -- a rotation preserves parallelism exactly in exact arithmetic, so
`np_intersect_line_line`'s own parallel-line check is testing essentially the SAME degeneracy
condition the caller-side `collinear` check already tests on the un-rotated vectors, just
recomputed independently through a different floating-point operation chain -- a `dir1`/`dir2` pair
landing just barely on the "not collinear" side of the caller's own `PRECISION = 1e-5` threshold can
still land on the "parallel" side of `np_intersect_line_line`'s own independently-computed,
not-bit-identical threshold. This is the exact same class of precision-boundary instability
`_collinear`'s own header comment already documents fixing ONE instance of (switching from
`arccos(dot)` to `|cross|`) -- a second, still-open instance one level deeper in the same call
chain.

**Why not fixed now:** Finding A needs the same 2 foundational `entityInstance.ts` primitive-layer
changes as every other entry in this file citing them. Finding B is a genuine upstream-Python bug
(not a TS-port gap) -- ported verbatim (a dedicated `FilletDegenerateError` class is the ONLY thing
`addArcsOnTurningPoints`'s own `try`/`catch` treats as "no usable fillet"; any other error,
including one sourced from `npIntersectLineLine`, propagates uncaught, exactly matching real
Python's own incomplete `except` clause) rather than silently "fixed" by widening the catch, since
this port's own discipline is to preserve real upstream bugs, not quietly correct them.

**Impact:** `addRailingRepresentation()` throws for every real invocation today, on every schema
(finding A). `computeWallMountedHandrailGeometry` (and, transitively, `addRailingRepresentation`)
additionally crashes with an uncaught error, instead of gracefully degrading to a sharp corner, for
a railing path whose turning point sits in a specific, narrow, floating-point precision-boundary
region (finding B) -- not given a dedicated regression test since it is an inherently
non-deterministic floating-point hazard, fragile to pin exactly; the SELECTIVE catch behavior
(only `FilletDegenerateError`, matching real Python's own selective `except`) is directly asserted
instead.

**Fix:** Finding A: same 2 fixes as every other entry in this file citing these 2 gaps (EXPRESS
DERIVED-attribute execution in `entityInstance.ts`; teaching `EntityInstance.setByIndex` to skip the
`attribute_kind_of` lookup for a non-entity target instance) -- once either lands,
`addRailingRepresentation.test.ts`'s own currently-pinned "throws the disclosed error" smoke test
should be revisited and converted to a real geometry assertion. Finding B is an upstream
`ifcopenshell-python` bug, not something this TS port should fix unilaterally -- widening
`_add_arcs_on_turning_points`'s own real Python `except` clause to also catch `ValueError` (or
using a narrower, more targeted parallel-line check) would need to happen upstream first, and this
port would then mirror whatever that fix turns out to be.

**Context:** Surfaced while landing `add_railing_representation` (646 lines, bringing `api.geometry`
to 28 of ~29 real files landed), verified directly against the real source (including
`ifcopenshell.util.shape_builder.np_intersect_line_line`'s own real implementation, read directly
to confirm its exact raised exception type) and this project's own locally-built native addon
(finding A confirmed empirically by actually running this chunk's own test suite).

**Depends on / blocked by:** Finding A depends on the same 2 foundational `entityInstance.ts` fixes
as `util.representation.guessType`'s entry (gap 1) and `EntityInstance.setByIndex`'s entry (gap 2)
above (neither yet scheduled/started). Finding B depends on an upstream `ifcopenshell-python` fix,
outside this port's own control.

**UPDATE (Phase EX-2, per-schema `calc_*` DERIVE porting, `70-express-rules-plan.md`): Finding A's
own root cause (gap 1, the `entityInstance.ts` EXPRESS DERIVED-attribute gap) is now RESOLVED for
IFC4 (that schema's own THIRD chunk, `src/express/rules/ifc4.ts`, ports `calc_IfcPlacement_Dim`)
AND IFC4X3 (that schema's own THIRD chunk, `src/express/rules/ifc4x3.ts`, ports
`calc_IfcPlacement_Dim`/`calc_IfcPoint_Dim` together) -- `addRailingRepresentation` now succeeds
end to end on both schemas for the documented default 2-point straight path, re-verified directly
against the real built addon (`addRailingRepresentation.ts`'s own header comment, UPDATE 2/UPDATE 4,
has the full per-schema citation). IFC2X3 remains blocked, but by a DIFFERENT, unrelated,
primitive-layer gap (`ShapeBuilder`'s own "Arcs are not supported for IFC2X3."), not gap 1/2 above.
Finding B (the incomplete `except` clause) is UNCHANGED by this update -- a genuine upstream Python
bug, not a TS-port gap, and out of Phase EX-2's own scope.

### `api.geometry.regenerateWallRepresentation` is blocked on every wall with a real
`IfcMaterialLayerSet`, on every schema (same 2 already-tracked primitive-layer gaps as
window/door/railing) -- plus a genuinely NEW, severe upstream-Python bug in `combine_layers`

**What:** `regenerate_wall_representation.py` (646 lines) -- the LAST portable file in
`api.geometry` (28 of ~29 real files landed before this chunk; `add_representation.py` is
permanently, genuinely Blender-only, not tracked here) -- regenerates a standard (case) wall's
body + axis representation, taking into account `IfcMaterialLayerSet` thicknesses/priorities and
`IfcRelConnectsPathElements` connections to other walls. Unlike `add_railing_representation`, real
Python implements this with an internal `Regenerator` CLASS -- explicitly checked (per this
chunk's own required process) whether the `Usecase.settings`-accessed-before-assignment
evaluation-order bug from `add_window_representation`/`add_door_representation` applies here: **it
does not** -- `Regenerator` never uses that dict-settings pattern at all, and every `self.*`
attribute is assigned strictly before it is ever read (traced line-by-line, not assumed).

**Finding A -- blocked on every wall with a real `IfcMaterialLayerSet`, on every schema (matches
`add_railing_representation`'s own "blocked on literally every input" shape, not window/door's
"most real-world inputs" one):** both of `regenerate`'s own 2 top-level branches (`isAngled`'s
single sloped extrusion + boolean-differenced caps; `!isAngled`'s composite-profile assembly)
unconditionally call `ShapeBuilder.polyline(points, closed=true, ...)` at least once while
building the body solid -- there is no branch that skips it. On IFC4/IFC4X3 this throws
immediately (the same already-tracked `IfcLineIndex`/`IfcArcIndex` defined-type-creation gap,
`EntityInstance.setByIndex`/`IfcFile.createEntity` entry above). On IFC2X3, `polyline(closed=true)`
succeeds, but the very next step -- `extrude()`'s own internal `profile()` upgrade call
(`isAngled`), or a direct `builder.profile(...)` call (`!isAngled`) -- hits the SAME already-
tracked `Dim` DERIVED-attribute gap (`util.representation.guessType`'s entry above) on every
schema, confirmed EMPIRICALLY against this worktree's own locally-built native addon (IFC4), not
just reasoned about. Every pure layer/axis/connection-join computation this function performs
(`join` never touches `ShapeBuilder` at all -- confirmed by tracing every line) is genuinely, fully
UNBLOCKED today and is this file's own primary test-coverage target, exercised indirectly through
the single exported function's own observable throw timing/message (every helper is module-
private, matching real Python's own entirely-private `Regenerator` class -- tested the same way
`editObjectPlacement.test.ts` already established precedent for a similarly helper-heavy file).

**Finding B -- a genuinely NEW, severe, upstream-Python bug, independent of any primitive-layer
gap: `combine_layers` attempts to mutate an immutable value whenever a connection specifies
`RelatingPriorities`/`RelatedPriorities`.** Real Python's `PrioritisedLayer = namedtuple(
"PrioritisedLayer", "priority thickness")` is an immutable tuple subclass. `combine_layers`'s own
override-priorities loop does `layers[i][0] = priority` -- positional item-assignment on a
`PrioritisedLayer` INSTANCE, which namedtuples never support
(`TypeError: 'PrioritisedLayer' object does not support item assignment`, confirmed against
Python's own namedtuple semantics directly). `RelatingPriorities`/`RelatedPriorities`
(`IfcRelConnectsPathElements`'s own real `LIST [0:?] OF INTEGER` attributes) are ordinary, real IFC
data -- a model author overriding layer join priorities on a wall connection is not a contrived
edge case. **So: any real connection that actually specifies a non-empty override crashes
`regenerate_wall_representation` upstream, with an uncaught `TypeError`, before `join` is even
called for that connection.** Reproduced here (not silently avoided) by representing
`PrioritisedLayer` as a FROZEN plain object -- `combineLayers`'s own override loop attempts
`layers[i].priority = priority` (the natural TS analogue of "mutate positional field 0"), which
throws `TypeError: Cannot assign to read only property 'priority' of object` in strict-mode ES
modules, reproducing the exact crash class and reachability. Confirmed empirically (both the crash
itself, and that an EMPTY-priorities connection -- the common real case -- reaches `join` and
completes it without any premature error, landing on the identical Finding A blocker instead).

**Why not fixed now:** Finding A needs the same 2 foundational `entityInstance.ts` changes as
every other entry in this file citing them. Finding B is a genuine upstream `ifcopenshell-python`
bug (not a TS-port gap) -- ported verbatim (a frozen object whose attempted mutation throws)
rather than silently "fixed" by making layer-priority overrides actually work, since this port's
own discipline is to preserve real upstream bugs, not quietly correct them.

**Impact:** `regenerateWallRepresentation` throws for every wall with a real `IfcMaterialLayerSet`,
on every schema, while building the body solid (Finding A). Separately, ANY real connection
specifying a non-empty `RelatingPriorities`/`RelatedPriorities` crashes even earlier, with a
different, distinguishable error (Finding B) -- both pinned by dedicated regression tests. A wall
with no `IfcMaterialLayerSet` returns `undefined` immediately and is fully functional and
unaffected by either finding.

**Fix:** Finding A: same 2 fixes as every other entry in this file citing these 2 gaps (EXPRESS
DERIVED-attribute execution in `entityInstance.ts`; teaching `EntityInstance.setByIndex` to skip
the `attribute_kind_of` lookup for a non-entity target instance). Finding B is an upstream
`ifcopenshell-python` bug, not something this TS port should fix unilaterally -- it would need to
be fixed upstream first (e.g. by not mutating `PrioritisedLayer` in place, or by not using an
immutable namedtuple for a value the code means to mutate), and this port would then mirror
whatever that fix turns out to be.

**Context:** Surfaced while landing `regenerate_wall_representation` (646 lines, bringing
`api.geometry` to 29 of ~29 real files landed -- the module's own portable scope is now
FUNCTIONALLY COMPLETE; `add_representation.py` remains permanently unported, by design, as it is
genuinely Blender-only). Verified directly against the real source and this project's own locally-
built native addon (both findings confirmed empirically, not just reasoned about). Also confirmed:
this file's own `getManualBooleans` (a pure `BBIM_Boolean` pset READ, `get_pset`-based) does NOT
hit `clipSolid.ts`'s own already-disclosed `editPset` WRITE-side gap -- but constructing ANY
populated pset value at all (even a bare `file.createEntity("IfcText", "hello")`, no pset API
involved) hits that SAME already-tracked foundational gap, so `getManualBooleans`'s own JSON-
parsing logic could not be given a dedicated test with real fixture data either (disclosed in the
test file's own header comment, not silently skipped -- not a new gap, just a new place the same
foundational blocker prevents test-fixture construction).

**Depends on / blocked by:** Finding A depends on the same 2 foundational `entityInstance.ts`
fixes as `util.representation.guessType`'s entry (gap 1) and `EntityInstance.setByIndex`'s entry
(gap 2) above (neither yet scheduled/started). Finding B depends on an upstream
`ifcopenshell-python` fix, outside this port's own control.

**UPDATE 2026-09-22 (CI `SCHEMA_VERSIONS` widening reconciliation chunk, PR #170):** found and
fixed a THIRD, genuinely separate bug in this same file, independent of Findings A/B -- a real
TS-port bug, not a primitive-layer gap or an upstream bug, only ever exercised once CI actually
started building IFC2X3 (see this file's own "CI: `SCHEMA_VERSIONS=4`-only..." entry above).
`getLayers` read `l.get("Priority")` directly; real Python's own `get_layers` reads
`getattr(l, "Priority", 0) or 0` -- a real `getattr`-with-default, which silently absorbs the
`AttributeError` real Python's SWIG binding raises for `IfcMaterialLayer.Priority` on IFC2X3
(genuinely absent there, added only on IFC4+, confirmed against the compiled schema:
`src/ifcparse/schemas/Ifc2x3.h`'s `IfcMaterialLayer` declares only `Material`/`LayerThickness`/
`IsVentilated`; `Ifc4.h`'s adds `Name`/`Description`/`Category`/`Priority`). This port's plain
`.get()` call had no equivalent default, so it threw for every IFC2X3 wall with a real
`IfcMaterialLayerSet` BEFORE ever reaching Finding A's own disclosed `ShapeBuilder` blocker --
fixed by routing through this same file's own pre-existing `attrOrNull` helper (already used
elsewhere in this file for the identical `getattr(x, name, None)` shape), restoring the intended
behavior: IFC2X3 now reaches the exact same Finding A blocker IFC4/IFC4X3 already did, rather
than a premature, different error. `test/api/geometry/regenerateWallRepresentation.test.ts`
needed no changes -- its "get_layers reads Priority/LayerThickness..." test already asserted
"reaches the disclosed ShapeBuilder blocker", which is what now actually happens on IFC2X3 too.

**UPDATE 2026-09-22 (Phase EX-2 chunks 1+2) -- Finding A RESOLVED for IFC2X3, still real on
IFC4/IFC4X3:** see `util.representation.guessType`'s own entry above for the full writeup on the
underlying `Dim`-DERIVE porting. `regenerateWallRepresentation` now completes end-to-end on IFC2X3
for every connection shape this file's own tests exercise (no connection, empty-priority
connection, translated-placement connection, `ATPATH`, `NOTDEFINED`, `ATPATH+ATPATH`, the angled/
sloped-wall branch, explicit length/height) -- verified directly against the real, built native
addon: each now returns a real `IfcShapeRepresentation` (`RepresentationIdentifier: "Body"`,
`RepresentationType: "SweptSolid"`, one `IfcExtrudedAreaSolid` item) instead of throwing. Finding B
(the immutable-`PrioritisedLayer`-namedtuple-mutation crash for a NON-empty `RelatingPriorities`)
is UNCHANGED -- it throws earlier than, and independent of, the `Dim` gap this update closes, on
every schema, confirmed still-real directly. IFC4/IFC4X3 are also unchanged (still hit the
`IfcLineIndex`/`IfcArcIndex` gap, unrelated to Phase EX-2). All regression tests in
`regenerateWallRepresentation.test.ts` affected by Finding A were updated to assert this minimal,
structural-sanity shape on IFC2X3 (return type, `RepresentationIdentifier`/`RepresentationType`,
one `IfcExtrudedAreaSolid` item) rather than the old disclosed throw; the Finding-B test and the
IFC4/IFC4X3 branches of every other test are unchanged. Deep geometric-fidelity verification of the
real join/mitre/notch output this function computes for each connection shape is explicitly NOT
part of this update -- real, disclosed, scoped-out follow-up work, comparable in size to its own
dedicated verification chunk.

### `api.cogo.addSurveyPoint`/`editSurveyPoint` are BOTH blocked by the pre-existing EXPRESS
DERIVED-attribute gap -- 2 more confirmed consequences, via 2 DIFFERENT derived attributes,
neither previously covered by this file's existing entries

**What:** `ifcopenshell.api.cogo` (a brand-new module, 4 real files, 246 lines) ported in full,
including its own 2 real dependencies (`util.representation.get_context`, `api.spatial
.assign_container`, both already landed). 2 of the 4 functions hit the SAME already-tracked,
cross-cutting `entityInstance.ts` gap this file already has an entire family of entries for
(`EntityInstance.get()` has no EXPRESS DERIVED-category fallback at all -- see
`util.representation.guessType`'s entry above, the first to surface it, via `IfcCurve.Dim`/
`IfcSurface.Dim`) -- but via 2 attributes/entity classes not previously covered by any existing
entry in this file:

1. **`addSurveyPoint`** reads `context.WorldCoordinateSystem` where `context` is guaranteed (by
   its own call to `get_context(file, "Model", "Annotation", "MODEL_VIEW")`, which always resolves
   to a *subcontext* whenever both a subcontext identifier and a target view are given) to be an
   `IfcGeometricRepresentationSubContext` -- confirmed by reading `getContext`'s own implementation
   directly. On that class, `WorldCoordinateSystem` is NOT a stored attribute at all: it's a real
   EXPRESS DERIVED attribute (`DERIVE WorldCoordinateSystem := ParentContext.WorldCoordinateSystem`,
   confirmed via `ifcopenshell.express.rules.IFC4X3`'s own compiled
   `calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem`), confirmed absent from
   `IfcGeometricRepresentationSubContext`'s own generated interface on all 3 schemas identically.
   This throws on literally every real invocation that finds a matching context at all -- the
   common, intended case -- confirmed EMPIRICALLY by running this chunk's own test suite against a
   locally-built multi-schema native addon.
2. **`editSurveyPoint`** reads `Items[0].Dim` where `Items[0]` is an `IfcCartesianPoint`.
   `IfcCartesianPoint.Dim` is a DIFFERENT real EXPRESS DERIVED attribute
   (`DERIVE Dim := HIINDEX(Coordinates)`, confirmed via `ifcopenshell.express.rules.IFC4X3`'s own
   compiled `calc_IfcCartesianPoint_Dim`) -- a much simpler formula than `IfcCurveDim`/
   `IfcSurfaceDim` (this file's existing entry's own ~20-line recursive functions), but the SAME
   category of gap, and this port's discipline (per this task's own required process: "throw a
   clear loud error only at the exact point actually needed, never proactively guard around a
   foundational gap") means it is NOT special-cased as a narrow `Coordinates.length` shortcut even
   though that would happen to produce an identical numeric answer for this one class -- it throws
   via the real, already-clear `.get()` error instead, exactly like every other entry in this
   family. This is this function's very FIRST statement, so it throws on every invocation, on
   every schema.

`assignSurveyPoint` (a single, direct, already-forward-attribute reassignment) and `bearing2dd`
(pure string/number math, no entity access at all) are NOT affected -- both fully functional and
given real, passing tests (not "throws" pins), including `assignSurveyPoint`'s own fixture, which
could not reuse real Python's own `add_survey_point`-based fixture (blocked, per finding 1 above)
and was instead built directly via raw `file.createEntity(...)` calls reproducing the same shape.

**Why not fixed now:** Same reasoning as every other entry in this family -- general EXPRESS
DERIVED-attribute execution in `entityInstance.ts` is a foundational, cross-cutting primitive-layer
change, not something a single `api.cogo` chunk should patch unilaterally (whether via the general
fix or a narrow per-attribute reimplementation).

**Impact:** `addSurveyPoint` throws for every real invocation that finds a matching
Model/Annotation/MODEL_VIEW context (`"entity instance of type '...IfcGeometricRepresentation
SubContext' has no attribute 'WorldCoordinateSystem'"`) -- the only way it does NOT throw is the
already-disclosed "no context exists at all" edge case, which throws a DIFFERENT, earlier,
already-guarded error instead. `editSurveyPoint` throws unconditionally, on its very first
statement (`"entity instance of type '...IfcCartesianPoint' has no attribute 'Dim'"`). Both pinned
by dedicated regression tests (`addSurveyPoint.test.ts`/`editSurveyPoint.test.ts`) asserting the
exact disclosed error, not a loose "either" net. `assignSurveyPoint`/`bearing2dd` are unaffected
and have real, fully-passing test coverage.

**Fix:** Same as every other entry in this family: (a) general EXPRESS DERIVED-attribute execution
in `entityInstance.ts` (unblocks every module that ever needs any derived attribute, not just
these 2), or (b) narrow, per-attribute local reimplementations (`WorldCoordinateSystem` ->
`ParentContext.get("WorldCoordinateSystem")`; `Dim` -> `Coordinates.length`) -- both trivial
one-liners once someone decides this project wants that narrower pattern for cogo specifically,
but deliberately NOT done in this chunk, per this task's own required process.

**Context:** Surfaced while landing `api.cogo` (a brand-new module, all 4 real files, 246 lines,
Phase 6). Also confirmed a genuine, real, IFC4X3-only schema constraint independent of this gap:
`IfcAnnotation.PredefinedType` (needed by `addSurveyPoint`) doesn't exist on IFC2X3/IFC4 at all,
confirmed against all 3 generated `.d.ts`s -- matching the real Python test suite's own
`IFC4X3_AVAILABLE`-gated tests, so `addSurveyPoint.test.ts`/`editSurveyPoint.test.ts`'s own
`describe.each` blocks are filtered to IFC4X3 (`editSurveyPoint`'s own `Dim` gap is schema-
independent, but its ported test still uses the same `addContext`/`IfcAnnotation` fixture shape
for consistency with `addSurveyPoint.test.ts`). Also confirmed a real, verbatim-preserved
upstream-Python bug in `bearing2dd.py` itself, unrelated to this gap: its 4th `dms2dd` argument is
neither real microseconds nor even correctly-scaled milliseconds (`100.0 * fractional_seconds`,
not `1000000.0 *`) -- confirmed against the real ported test fixture's own expected numeric
values, which lock in the buggy arithmetic as the documented, expected behavior.

**Depends on / blocked by:** Same foundational `entityInstance.ts` EXPRESS DERIVED-attribute fix as
`util.representation.guessType`'s entry and every other entry in this family above (not yet
scheduled/started).

**UPDATE (Phase EX-2, per-schema `calc_*` DERIVE porting, `70-express-rules-plan.md`): finding 1
(`addSurveyPoint`'s `WorldCoordinateSystem`) is now RESOLVED for real, on the only schema this
function is ever exercised on.** `calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem`
is ported for IFC4X3 by that schema's own SECOND `calc_*`-porting chunk (`src/express/rules
/ifc4x3.ts`) -- `IfcAnnotation.PredefinedType`'s own IFC4X3-only schema constraint (noted below)
means IFC4X3 was always the only schema this function could ever actually run on, and IFC2X3/IFC4
had already ported the identical formula in their own respective third chunks earlier still --
`addSurveyPoint` now succeeds end to end, restoring real Python's own test assertions verbatim
(`addSurveyPoint.test.ts`'s own updated header comment has the full citation). Finding 2
(`editSurveyPoint`'s `IfcCartesianPoint.Dim`) remained a live gap for IFC4X3 specifically ONLY --
`calc_IfcCartesianPoint_Dim` was ported for IFC2X3/IFC4 in each schema's own first chunk (already
resolved there), but ADD2 consolidated it into a differently-named `calc_IfcPoint_Dim` at an
abstract supertype level, genuinely not yet ported by any chunk at that point (`rules/ifc4x3.ts`'s
own header comment has the full writeup).

**UPDATE (Phase EX-2, IFC4X3's own THIRD `calc_*`-porting chunk, `src/express/rules/ifc4x3.ts`):
finding 2 is now RESOLVED for real too.** That chunk ports `calc_IfcPoint_Dim` for IFC4X3 --
`editSurveyPoint`'s own `Items[0].Dim` read now resolves correctly on all 3 schemas, re-verified
directly against the real built addon, not assumed. `editSurveyPoint.test.ts`'s own former
schema-conditional "still BLOCKED for IFC4X3" branch is removed; a single, unconditional test now
covers all 3 schemas. This whole entry (`api.cogo.addSurveyPoint`/`editSurveyPoint`) is now fully
resolved -- both functions succeed end to end on every schema they can run on.

---

### `api.alignment.updateEndPoint` needs the unported `api.alignment.addZeroLengthSegment` -- itself transitively blocked on the already-tracked `_get_segment_endpoint`/geometry-kernel gap -- **RESOLVED 2026-09-18, see UPDATE below: `addZeroLengthSegment` landed for real (conditionally), `updateEndPoint.ts` now wired in**

**What:** Real Python's `ifcopenshell.api.alignment.update_end_point` calls
`ifcopenshell.api.alignment.add_zero_length_segment(file, curve)` whenever
`has_zero_length_segment(curve)` is `false`. `add_zero_length_segment` is NOT ported in this chunk
(`api.alignment` chunk 3) -- confirmed absent, and explicitly named in `src/api/alignment/index.ts`'s
own "Still pending" list. Reading `add_zero_length_segment.py`'s own full body directly (not just its
top-level imports) confirms it is itself transitively blocked: for every realistic case where the
layout/curve already has at least one real segment (i.e. every non-empty, already-in-progress
alignment -- the common case, not an edge case), it calls `_get_segment_endpoint`, which needs the
real geometry kernel (`ifcopenshell.geom`) -- the SAME gap `./index.ts`'s own header comment already
discloses and explicitly excludes from this chunk's scope. Only the fully-empty-layout/curve case (no
segments at all yet) of `add_zero_length_segment` would be geometry-kernel-free, but porting just that
one narrow slice of a separate, not-yet-reviewed file was judged real, disclosed scope creep rather
than a small addition -- matching this project's own "do not inline a risky partial port for a
dependency outside the module under review" discipline (e.g. this file's own
`util.element.getShapeAspects` entry, or `api.style.addSurfaceTextures`'s `material` entry).

`src/ifcopenshell-ts/src/api/alignment/updateEndPoint.ts` ports every other real behavior of this
function correctly and completely (the type-check and its own deliberately-preserved unmatched-quote
message bug; the full `EndPoint`-not-yet-assigned branch construction for BOTH
`IfcGradientCurve`/`IfcSegmentedReferenceCurve`; the full `getAxis2placement` extraction and both
classes' own final attribute-assignment tail), and throws a clear, disclosed error ONLY at the exact
point, and only when, the real `add_zero_length_segment` call would actually be needed -- never
proactively, and never before the type-check has already run.

**Why:** Same reasoning as every other genuinely-separate-file dependency gap in this file (e.g.
`util.element.getShapeAspects`, `api.style.addSurfaceTextures`'s Blender-parameter entry) --
`add_zero_length_segment` is a real, substantial function (uses `ifcopenshell.api.nest`,
`ifcopenshell.util.unit`, and 3 more of its own module-private helpers besides
`_get_segment_endpoint`) belonging to its own future chunk's review scope, not squeezed into this
chunk's.

**Impact:** Calling `updateEndPoint(file, curve)` throws `"updateEndPoint: '<curve.isA()>' has no
zero-length segment yet, and adding one needs api.alignment.addZeroLengthSegment, which is not ported
in this chunk (itself transitively blocked on the unported _get_segment_endpoint, which needs the real
geometry kernel) -- see TODOS.md."` only when `hasZeroLengthSegment(curve)` is `false` -- a `curve`
that ALREADY ends in a real zero-length segment (the state any fully-constructed alignment's own
curve is expected to be in, per this module's own docstring: "The manditory zero length segment ...
are automatically created and maintained") is completely unaffected and computes a real, correct
`EndPoint`. Pinned by a dedicated regression test in `updateEndPoint.test.ts`
(`"throws a disclosed error when the curve has no zero-length segment yet"`), alongside full, real,
passing test coverage for both curve classes' own `EndPoint`-missing and `EndPoint`-already-present
branches (built via a real, hand-constructed zero-length `IfcCurveSegment`, sidestepping the blocked
path entirely -- see `updateEndPoint.ts`'s own header comment for the raw-SELECT-value-assignment
technique reused from chunk 2).

**Fix:** Port `ifcopenshell.api.alignment.add_zero_length_segment` (and its own transitive
dependency, `_get_segment_endpoint`, which needs the future `ifcopenshell.geom` binding -- see this
file's own `api.geometry.addProfileRepresentation`/`editProfileUsage`/`getAxis2placement` entries for
the shared scope of that future binding effort) as their own future chunk, then wire the real call
back into `updateEndPoint.ts`'s own `if (!hasZeroLengthSegment(curve))` branch.

**Context:** Surfaced during `api.alignment` chunk 3 (5 files: `_sort_nest`/`_get_key_point_tag`/
`update_fallback_position`/`_get_cant_segment`/`update_end_point`, 2026-09-17), verified directly
against the real 91-line `update_end_point.py` source and the real 206-line
`add_zero_length_segment.py` source (including its own `_get_segment_endpoint` import).

**Depends on / blocked by:** The same future `ifcopenshell.geom` binding effort as this file's
`getAxis2placement`/`util.shape`/`editProfileUsage`/`addProfileRepresentation` entries above (not yet
scheduled/started), plus porting `add_zero_length_segment` itself as its own future chunk once that
binding exists.

**UPDATE 2026-09-18 (`api.alignment` chunk 7 lands `addZeroLengthSegment` for real):** The
dependency itself is now ported (`src/ifcopenshell-ts/src/api/alignment/addZeroLengthSegment.ts`) --
and, unlike most of chunk 7's own 7 files, it is only CONDITIONALLY blocked on the real geometry
kernel, not unconditionally: fully portable for a genuinely empty layout/curve (no real segments
yet -- always for `IfcAlignmentCant`, confirmed to call `_get_segment_endpoint` zero times in its
own 206-line source; otherwise when the given layout/curve has no segments yet), and still throwing
a clear, disclosed error for a non-empty one (see `addZeroLengthSegment.ts`'s own header comment for
the full writeup). `updateEndPoint.ts`'s own `if (!hasZeroLengthSegment(curve))` branch is now wired
to call the real `addZeroLengthSegment(file, curve)`, exactly as this entry's own "Fix" section
above prescribed -- `updateEndPoint`'s own former bespoke disclosed-error message is removed
entirely; a non-empty `curve` missing its own zero-length segment now throws
`addZeroLengthSegment`'s own disclosed error instead, bubbled up transparently. A genuinely EMPTY
`IfcGradientCurve`/`IfcSegmentedReferenceCurve` (no real segments at all yet) now computes a real,
correct `EndPoint` end to end -- pinned by a new real, passing test in `updateEndPoint.test.ts`
("an empty curve auto-adds a real zero-length segment ... and computes EndPoint at the origin"),
alongside a regression test for the still-throwing non-empty case. This entry is now fully
resolved for the empty-curve case; the non-empty-curve case remains blocked on the SAME permanently-
excluded `_get_segment_endpoint`/geometry-kernel gap as ever -- also reached, unconditionally this
time, by chunk 7's own new `_addSegmentToCurve`/`_addSegmentToLayout` (both disclosed in their own
header comments and in `./index.ts`'s own header comment; not given their own new dedicated entries
here, since this is the SAME already-tracked gap, not a new category -- matching chunk 6's own
`.Dim`-gap-occurrence precedent for not duplicating an existing entry).

---

### Native primitive-layer gap: `EntityInstance.set()` performs no declared-attribute-type validation at all, unlike real Python's SWIG binding

**What:** Real Python's `entity_instance.__setattr__` validates a value against the attribute's
own declared EXPRESS type before writing it -- assigning a plain string into a `number`-typed
attribute (an `IfcTimeMeasure`/`IfcReal`/etc.), or into an entity-select-typed one (e.g. IFC2X3's
`IfcDateAndTime`-shaped `CreationDate`), raises a real `TypeError` in real Python. This port's own
`EntityInstance.set()` does NOT perform any equivalent check -- confirmed empirically (a disposable
trace script against a real built native addon, not assumed by symmetry with real Python) for both
a plain numeric-measure-typed attribute (`IfcWorkPlan.Duration` on IFC2X3, declared `IfcTimeMeasure`/
`number`, silently accepts and stores a string like `"P1D"` with no coercion or error) and an
entity-select-typed one (`IfcWorkPlan.CreationDate` on IFC2X3, declared a real
`IfcDateAndTime`/`IfcCalendarDate`/`IfcLocalTime` union, silently accepts and stores a plain ISO
string). `.get()` on the same attribute afterward returns exactly the wrongly-typed value back,
unchanged -- no silent coercion either, just no validation at all.

**Why this matters, concretely:** any `api.*` usecase (already-shipped or future) that assumed --
without independently, empirically verifying it -- that this port's own `.set()` would reject a
type mismatch "the same way real Python's SWIG binding does" is basing a disclosed-bug write-up on
a false premise. Confirmed, concrete instances found so far: `api.sequence.editWorkPlan`/
`editWorkSchedule`'s own `Duration`/`TotalFloat`-on-IFC2X3 branch (see those files' own header
comments) -- an earlier, unverified pass of those two files assumed this port's `.set()` would
throw here "the same as real Python", matching real Python's own genuine IFC2X3 schema-mismatch bug
for those two attributes; verifying it directly (rather than trusting the plausible-sounding
assumption) showed it does NOT throw at all in this port, a DIFFERENT (arguably worse -- a silently
wrongly-typed value ends up written into the file) divergence from real Python than "the same bug
faithfully reproduced". **Every previously-shipped or future chunk's own disclosed-bug write-up
that claims "`.set()` throws here, matching/reproducing a real Python type-mismatch bug" should be
treated as a suspect for this exact same false-premise error until independently re-verified**
(empirically, against a real built addon -- not re-derived from real Python's own behavior by
assumed symmetry) -- not confirmed wrong everywhere it appears, but not yet checked either.

**Root cause:** Not investigated at the native-shim/C++ level (would need reading
`attribute_value_shim.cpp`'s own `set_attribute_value_variant` dispatch in detail, the same file
already implicated in this document's own "stale inverse-index entry" entry above, to determine
whether type-checking was simply never implemented there, or is present but has its own separate
bug) -- flagged here as an empirically-confirmed BEHAVIOR gap, with the exact root cause left for
whoever picks up a native-layer fix (this sandbox has no `cmake`/C++ toolchain to investigate or
fix this further, the same long-standing, repeatedly-disclosed constraint noted throughout this
file's other entries).

**Fix:** Either (a) add real declared-type validation to `set_attribute_value_variant` (or
wherever the N-API shim currently just writes through unconditionally), matching real Python's own
SWIG-binding behavior generally -- the more faithful, but more invasive, fix, likely to surface
MANY previously-passing tests that unknowingly relied on the current permissive behavior and would
need re-auditing; or (b) leave native behavior as-is (permissive) and instead audit/correct every
existing "this throws, matching real Python" disclosure across the whole port that hasn't been
independently, empirically re-verified against this exact finding, replacing each with an accurate
"real Python throws here; this port's own `.set()` doesn't validate types at all, so it silently
writes the wrongly-typed value instead" write-up (the approach taken for `editWorkPlan.ts`/
`editWorkSchedule.ts`, the 2 confirmed instances so far). No irreversible decision needed now --
either fix is compatible with what's already shipped, and (b) is strictly the lower-risk near-term
action given the C++-toolchain constraint above.

**Context:** Found while independently re-verifying `api.sequence` chunk 2's own disclosed-bug
claims for `editWorkPlan`/`editWorkSchedule` (2026-09-20) -- both files' own header comments
asserted "this port's `EntityInstance.set` does the same [type validation as real Python's SWIG
binding]" without having actually run the assertion against a real built addon; two dedicated
regression tests failed as a direct result (`editWorkPlan.test.ts`'s/`editWorkSchedule.test.ts`'s
own `expect(() => ...).toThrow()` assertions for the IFC2X3 `Duration`/`TotalFloat`/`CreationDate`
cases), which is what surfaced the false premise. Verified directly via a disposable Node/vitest
trace script exercising `.set()` on both a plain-measure-typed and an entity-select-typed IFC2X3
attribute, not assumed from the test failures alone.

**Depends on / blocked by:** Nothing blocks other work landing -- this is a disclosure-accuracy
fix, not a functional blocker; every affected file's own PRODUCTION logic (the actual attribute-
conversion/writing behavior) is unaffected and already correct, only the accompanying doc comments
and test expectations needed correcting. A native-layer fix (option (a) above) would need a real
`cmake` build environment to implement and verify, same as this file's other native-primitive-layer
entries.

### `api.resource.editResourceTime`'s `calculate_resource_usage`-under-lock blocker is now resolvable -- `api.sequence.calculateTaskDuration` has landed -- **RESOLVED 2026-09-25 (TODOS.md sweep)**

**What:** `api.resource`'s PROGRESS.md row (PR #103) disclosed that `editResourceTime`'s
`ScheduleUsage`-under-a-hard-`Usage.ScheduleWork`-constraint branch needs
`ifcopenshell.api.sequence.calculate_task_duration`, and threw a clear, descriptive `Error` at that
exact call site since `api.sequence` had no TS port of any kind at the time. `api.sequence` is now
**functionally complete (40/40 files)** as of chunk 4 (PR #141, 2026-09-20), including
`calculateTaskDuration` itself (landed even earlier, chunk 2, PR #137) -- this dependency is no
longer genuinely unported, just not yet wired up in `editResourceTime.ts`.

**Fix:** Re-open `editResourceTime.ts`, replace the thrown `Error` at that call site with a real
call to the now-landed `calculateTaskDuration`, and un-skip/extend whatever real Python test
coverage was previously adapted around this blocker (check `editResourceTime.test.ts` for an
existing pinned-blocked-behavior test to convert, matching this project's established pattern for
closing a primitive/dependency gap once it's resolved -- e.g. `editPset.ts`'s own history once the
standalone-value-construction gap eventually closes).

**Depends on / blocked by:** Nothing -- this is now unblocked. Not done as part of the `api.sequence`
chunk 4 PR itself since it's out of that chunk's own scope (a change to an already-shipped
`api.resource` file, not a new `api.sequence` port) -- flagged here so it isn't lost, pending a
small, dedicated follow-up chunk.

**Context:** Found while updating `PROGRESS.md` after `api.sequence` chunk 4 landed (2026-09-20) --
re-reading `api.resource`'s own PROGRESS.md row for context surfaced the now-stale "has no TS port
of any kind" framing.

**RESOLVED 2026-09-25:** `editResourceTime.ts`'s blocked call site now calls the real
`calculateTaskDuration(file, { task })` directly. The pinned "throws" test in
`editResourceTime.test.ts` was flipped to a real end-to-end assertion (sets `ScheduleWork: "P4D"`
before locking it, then edits `ScheduleUsage: 2.0`, verifying the resulting `TaskTime
.ScheduleDuration` is computed correctly as `"P2D"` -- 4 days of work at 2x usage, matching
`calculateTaskDuration.ts`'s own formula with the default 8-hour workday).

### `enumeration_type::enumeration_items()` never bound -- `util.attribute.getEnumItems` has no forward enum-item-name lookup, and `util.fm.getFmhemClasses` is unconditionally blocked by it

**What:** `util/attribute.ts`'s `getEnumItems` is a pre-existing, disclosed throwing stub (landed
with the `util.schema` chunk, well before `util.fm` existed): the C++ core's real
`enumeration_type::enumeration_items()` accessor (a *forward* lookup -- "give me every value name
this enumeration declares") has no N-API binding anywhere on this primitive surface. Confirmed
again, not just trusted from that file's own comment: neither the TS `enumeration_type` class
(only `lookup_enum_offset(value_name)` -- a *reverse*, single-value lookup -- is bound) nor the
generated C API header exposes a forward-listing primitive. This gap previously had no dedicated
top-level `TODOS.md` entry of its own -- it was only disclosed inline in `attribute.ts`'s/
`attribute.test.ts`'s own comments, with no other real caller anywhere in the port until now.

**New consequence found by this chunk (`util.fm`, Phase 10):** `ifcopenshell/util/fm.py`'s
`get_fmhem_classes` calls `ifcopenshell.util.attribute.get_enum_items(attribute)` for every real
`PredefinedType` attribute it finds while walking `fmhem_classes_ifc4`/`fmhem_classes_ifc2x3` and
all of their real, non-abstract, non-excluded subtypes -- every one of those real classes declares
a `PredefinedType` attribute, so `util/fm.ts`'s ported `getFmhemClasses` throws this same clear,
disclosed error for EVERY real schema/class combination (`"IFC4"` and `"IFC2X3"` alike) -- pinned
by dedicated regression tests in `test/util/fm.test.ts`. Ported completely and faithfully up to and
including the exact `getEnumItems` call, not proactively guarded/stubbed around.

**Fix:** Add a real N-API binding for `enumeration_type::enumeration_items()` (a C++-side native
primitive addition, needs a `cmake`/C++ toolchain this sandbox doesn't have) returning the
enumeration's declared value names in order; `getEnumItems` and `getFmhemClasses` both then become
fully functional with no TS-side logic changes needed.

**Context:** `getEnumItems`'s own throwing behavior and root cause were fully disclosed and tested
when `util/schema.ts`/`util/attribute.ts` landed; this entry exists because `util.fm`'s own chunk
(Phase 10, "Niche `util` modules") is the first real, production caller to actually reach it
outside `attribute.ts`'s own unit tests, and no top-level `TODOS.md` entry named this specific gap
before now.

**Depends on / blocked by:** Same `cmake`/C++ toolchain constraint as every other native-primitive-
layer entry in this file. Does not block anything else in `util/fm.ts` -- `getCobieTypes`/
`getCobieComponents`/`getFmhemTypes` (the other 3 functions in that module) have no dependency on
this gap at all and are fully functional today.

### Two latent test bugs in already-merged PRs, found while independently reviewing an unrelated PR against a real multi-schema build — RESOLVED 2026-09-20

**Resolved by a dedicated follow-up chunk** that fixed both test files against a real, locally-built
multi-schema (IFC2X3/IFC4/IFC4X3) native addon (reusing the same leftover install at
`/private/tmp/ifcopenshell-ts-install-multi` this entry's own "Context" section names):

1. **`test/api/sequence/duplicateTask.test.ts`**: re-running the full file against the multi-schema
   addon surfaced a THIRD affected IFC2X3 test beyond the 2 this entry originally named --
   "duplicating one side of a sequence whose other side is NOT part of the batch..." also throws (via
   `assignSequence`'s own unconditional `cascadeSchedule` call, same root cause as "duplicating a
   sequenced pair..."). All 3 are now `test.skipIf(schema === "IFC2X3")`-guarded (matching
   `test/api/pset/removePset.test.ts`'s/`test/api/geometry/addShapeAspect.test.ts`'s own established
   per-test precedent), not the whole `describe` block -- the other 5 tests in the file neither nest
   tasks nor call `assignSequence`, so they still genuinely exercise real IFC2X3 coverage. See the
   test file's own updated header comment for the full trace.

2. **`test/util/fm.test.ts`**: the "throws for IFC2X3 too" test's assertion is corrected to
   `toThrow(/Entity with name 'IfcShadingDeviceType' not found in schema 'IFC2X3'/)`, matching the
   ACTUAL throw. The previously-unresolved trace question (why `IfcDoorStyle`/`IfcWindowStyle` don't
   throw first via the already-tracked `getEnumItems` gap) is now answered: both have NO
   `PredefinedType` attribute at all on IFC2X3 (confirmed against `ifc2x3.d.ts` -- they only declare
   `OperationType`/`ConstructionType` there), so `getFmhemClass` never reaches `getEnumItems` for
   either of them; the loop then reaches `IfcShadingDeviceType` (the list's 3rd entry), which doesn't
   exist on IFC2X3 at all, throwing first via the entity-lookup path instead. Verified empirically
   against BOTH this port's own multi-schema addon AND a real installed `ifcopenshell` (0.8.4) Python
   package: `ifcopenshell.util.fm.get_fmhem_classes("IFC2X3")` raises the identical `RuntimeError:
   Entity with name 'IfcShadingDeviceType' not found in schema 'IFC2X3'` -- confirming real Python's
   own `fmhem_classes_ifc2x3` list has the exact same upstream bug (`IfcShadingDeviceType` genuinely
   doesn't exist on IFC2X3), and this port's behavior matches it exactly. `util/fm.ts`'s own header
   comment and `getFmhemClasses`'s own doc comment are updated to disclose this precisely (previously
   they implied ALL schema/class combinations hit the SAME `getEnumItems` error, which is inaccurate
   for IFC2X3).

   A THIRD, previously-undetected bug in this same file was also found and fixed while re-verifying
   against the multi-schema addon: "excludes elements whose OWN concrete class is in
   fmhemExcludedClasses..." (`describe.each(AVAILABLE_SCHEMAS)`, not schema-filtered) unconditionally
   created an `IfcBurnerType` entity, which doesn't exist on IFC2X3 at all (a genuine IFC4+ addition,
   confirmed against `ifc2x3.d.ts`). Fixed by substituting `IfcCoilType` (another
   `fmhemExcludedClasses` entry, confirmed empirically to be a real IFC2X3
   `IfcEnergyConversionDeviceType` subtype too) for IFC2X3 specifically.

Both test files pass in full (verified via `npx vitest run` against the real multi-schema addon, not
just `tsc`/`biome`); `tsc --noEmit`/`biome check` both clean; the pre-existing, unrelated ~60ish
failures elsewhere in the full suite (`appendAsset`/`regenerateWallRepresentation`/`editLayer`/
`addMonetaryUnit`/`brick`, all already-tracked native-primitive-layer gaps) are untouched by this fix.

<details><summary>Original TODO text</summary>

**What:** While reviewing PR #145 (`util.unit.convertFileLengthUnits`, unrelated), the orchestrating
session built a genuine multi-schema (IFC2X3/IFC4/IFC4X3) native addon to verify it -- something
neither PR #141's nor PR #143's own dispatched agent had done (both built IFC4-only addons, matching
CI's own core build). Running the FULL suite against that multi-schema build surfaced 2 real,
pre-existing test failures in already-merged code, unrelated to PR #145's own changes (confirmed:
neither failing file nor any of its dependencies appears in PR #145's diff):

1. **`test/api/sequence/duplicateTask.test.ts` (PR #141, `api.sequence` chunk 4)**: 2 of its own
   IFC2X3 tests ("duplicates nested subtasks and re-nests..." / "duplicating a sequenced pair...")
   throw `entity instance of type 'IFC2X3.IfcTask' has no attribute 'Nests'`/`'TaskTime'`. This
   module's own chunk 1 finding already established that IFC2X3's `IfcTask` has neither `Nests`/
   `IsNestedBy` NOR `TaskTime` at all (confirmed again here against `ifc2x3.d.ts` directly) -- task
   NESTING and TASK TIMES are both impossible to construct on IFC2X3 in the first place, so these 2
   tests' own IFC2X3 fixtures were never meaningfully testable to begin with. **Fix:** exclude IFC2X3
   from these 2 specific tests (or scope the whole nesting-related `describe` block to
   `AVAILABLE_SCHEMAS.filter(s => s !== "IFC2X3")`), matching this module's own established
   precedent elsewhere for genuinely IFC2X3-incompatible functionality.

2. **`test/util/fm.test.ts` (PR #143, `util.fm` chunk)**: its own "throws for IFC2X3 too -- the same
   pre-existing gap, not schema-specific" test asserts `toThrow(/enumeration_items/)`, but the ACTUAL
   throw is `Entity with name 'IfcShadingDeviceType' not found in schema 'IFC2X3'`. Confirmed:
   `IfcShadingDeviceType` genuinely does not exist on IFC2X3 (absent from `ifc2x3.d.ts` entirely),
   yet real Python's own `fmhem_classes_ifc2x3` list (`ifcopenshell/util/fm.py`) includes it verbatim
   -- meaning real Python's OWN `get_fmhem_classes("IFC2X3")` likely also crashes, just via a
   different, earlier code path (`schema_.declaration_by_name` failing on a nonexistent class,
   before ever reaching `get_enum_items`) than this test assumed. Not yet traced far enough to
   confirm exactly why `IfcDoorStyle`/`IfcWindowStyle` (the 2 list entries before
   `IfcShadingDeviceType`) don't throw first via the already-tracked `getEnumItems` gap -- needs a
   dedicated investigation, not fixed here. **Fix:** re-verify the exact real Python throw shape for
   this exact call (ideally against a real Python install, matching this project's own "verify
   empirically, don't assume" discipline), then correct this test's own expectation to match --
   likely a `toThrow(/IfcShadingDeviceType|not found/)` or similar, not `/enumeration_items/`.

**Depends on / blocked by:** Nothing -- both are self-contained test-only fixes, no production code
or native primitive changes needed. Low priority (neither affects any real caller's behavior, only
these 2 test files' own coverage accuracy) but should be picked up as a small, dedicated follow-up
chunk so the full-suite multi-schema pass count stays meaningful going forward.

**Context:** Found 2026-09-20 while independently verifying PR #145 with a locally-built
multi-schema native addon (reusing a leftover install at
`/private/tmp/ifcopenshell-ts-install-multi` from an earlier chunk in this same session) --
neither bug is caused by or related to PR #145's own changes.

</details>

### A third (and fourth) latent IFC2X3 test bug in already-merged `test/util/brick.test.ts` (PR #143) — RESOLVED 2026-09-21

**What:** 6 of `util.brick getElementFeeds`'s own IFC2X3 tests threw `Entity with name 'IfcPump'
not found in schema 'IFC2X3'` -- `IfcPump` doesn't exist on IFC2X3 at all (a genuine IFC4+ addition
-- IFC2X3 has no `IfcPump`/`IfcFan`/`IfcCompressor` subtypes of `IfcFlowMovingDevice` whatsoever,
only the generic base class itself). Fixed by substituting `IfcFlowMovingDevice` directly for
`IfcPump` on IFC2X3 (a new local `flowMovingDeviceClass(schemaName)` helper) -- `getElementFeeds`
has no dependency on which concrete subtype is used, only on the connectivity graph.

**A second, related bug found while fixing the first**: 2 of `util.brick getBrickType -- Brick
classification reference`'s own tests also threw, using `IfcAirTerminalBox` -- also absent from
IFC2X3 entirely. Investigating further: NONE of `ifc4_to_brick.json`'s 20 bare-class mapping keys
(`IfcBoiler`/`IfcChiller`/`IfcAirTerminalBox`/etc., checked one by one against `ifc2x3.d.ts`) exist
on IFC2X3 at all -- IFC2X3 predates the fine-grained flow-equipment taxonomy this whole mapping
table is built against. Fixed differently per test: the "returns Location verbatim" test doesn't
actually depend on the JSON table resolving anything (the classification-reference branch wins
outright before the table is ever consulted) -- substituted `IfcFlowController` for IFC2X3 there
(already proven instantiable there by this same file's own `getBrickType (IFC2X3)` block). The
"falls through to JSON-table lookup" test DOES depend on a real table match for the element's own
bare class -- since no such match exists on IFC2X3 at all, this exact scenario is genuinely
untestable there, not just inconvenient to fixture -- excluded via `test.skipIf(schemaName ===
"IFC2X3")` rather than forced into a misleading substitute.

**Verification:** all 20 tests in `brick.test.ts` pass (1 correctly skipped) against a real,
locally-built multi-schema (IFC2X3/IFC4/IFC4X3) native addon; full suite shows only the same 9
pre-existing, already-documented unrelated failures. `tsc`/`biome` both clean.

**Context:** Found 2026-09-21 while independently re-verifying PR #147 (which fixed 2 *other*
already-tracked latent test bugs) against the same locally-built multi-schema native addon used for
PR #145's own review -- not caused by or related to #147's own changes (it doesn't touch
`brick.ts`/`brick.test.ts` at all). Fixed directly by the orchestrating session (small, well-
understood, test-only scope) rather than via a full dispatch cycle.

---

### Native primitive-layer gap: `file_open_status` (`good()`'s return type) has no bound value/enum accessor -- and `good()`'s own nullness is NOT a usable success/failure signal either

**What:** Real Python's `ifcopenshell.open()` distinguishes 5 outcomes via
`f.good().value()`: `READ_ERROR` -> `IOError`, `NO_HEADER` -> `Error`, `UNSUPPORTED_SCHEMA` ->
`SchemaError` (with the actual unsupported schema identifier in the message), `INVALID_SYNTAX` ->
`Error`, and `UNKNOWN` -> a silent no-op (the file is still returned). This port's native primitive
layer has NO accessor for that enum value at all: the generated `file_open_status` TS class
(`src/native/ifcopenshell_native.ts`) is a bare handle wrapper with zero methods, and the generated
C API header (`src/wrappergen/generated_napi/ifcopenshell_native_c_api.h`) only exposes
`ifcopenshell_file_good`/`ifcopenshell_file_open_status_free` -- no value/enum accessor exists to
bind even if a TS method were added to wrap it.

**A real correction to how this was first understood (disclosed here so it isn't re-discovered the
hard way):** it's tempting to assume `good()` returning a non-null handle means "some problem
occurred" and a null return means "no problem" (a plausible-looking coarse substitute for the
missing `.value()` accessor). This is **wrong**, confirmed empirically against a real, locally-built
native addon, not assumed: `good()` returns an enum VALUE by value in the real C++ core
(`src/ifcparse/file_open_status.h`: `file_open_status good() const { return good_; }`, default-
initialized to `SUCCESS`), and `ifcopenshell_file_good`'s own C++ implementation
(`src/wrappergen/generated_napi/ifcopenshell_native_c_api.cpp`) unconditionally heap-allocates a
status object wrapping whatever that value is -- `SUCCESS` included. `nullptr` is returned from the
C API ONLY on a genuine C++ exception (e.g. a disposed/null handle), which the generated N-API
wrapper (`napi_file_good`) converts into a THROWN JS exception rather than a JS `null` return
anyway. Net effect: calling `.good()` on this port's binding for any live file handle -- a
perfectly well-formed file included -- always returns a non-null wrapped object. Verified directly:
opening a known-good fixture file and a deliberately garbage one both returned non-null `good()`
handles. A "non-null means a problem" check throws for literally every file, including well-formed
ones -- this was caught during `ifcopenshell.open()`'s own port (PR introducing `src/open.ts`)
before it shipped, via the standard test suite immediately catching it (every `open()`-of-a-valid-
file test failed), not left as a shipped bug.

**The actual, verified-working substitute now in use (`src/open.ts`'s `open()`):** forcing schema
resolution on the freshly-opened file (`file.nativeFile.schema()`, i.e. `native.file_schema(handle)`)
reliably THROWS a native `"No schema loaded"` exception for a file that failed to parse, and does
NOT throw for one that parsed successfully. Confirmed empirically for 3 of the 4 real error cases: a
syntactically garbage file, a completely empty file, and a well-formed SPF header naming an
unregistered schema identifier (simulating `UNSUPPORTED_SCHEMA`) all throw this exact message; the
4th (`READ_ERROR` -- file exists but is unreadable, e.g. a permissions problem) wasn't specifically
exercised, but would most plausibly throw synchronously from the file-open native call itself before
this check is even reached (not specially caught either way -- it's left to propagate as a plain
thrown error, just not wrapped in `IfcOpenShellError`). This gives a reliable success/failure signal
this port didn't have before, but it's still coarser than real Python's own 5-way switch: it can't
distinguish which of the 4 problem cases occurred, and can't single out the harmless `UNKNOWN` no-op
case either, so `src/open.ts`'s `open()` throws one generic `IfcOpenShellError` for any of them
(a disclosed, conservative choice -- see that file's own header comment on the `good()`/`schema()`
section for the full writeup).

**Fix:** Bind a real value accessor for `file_open_status` (e.g. `ifcopenshell_file_open_status_value`
returning the underlying `int`/enum in the C API, wired through to a TS `.value()` method) to reach
real Python's full 5-way fidelity -- `IOError` for `READ_ERROR`, a precise `SchemaError` message
(needs `spf_header`'s own separate, already-tracked "no `file_schema()` sub-entity accessor" gap
fixed too, to read the actual unsupported schema identifiers back out) for `UNSUPPORTED_SCHEMA`, and
correctly no-op-ing (not throwing) for the genuinely-harmless `UNKNOWN` case instead of this port's
current conservative over-throw.

**Depends on / blocked by:** A real C++/N-API primitive addition -- needs a `cmake`/C++ toolchain to
implement and verify, same long-standing constraint as this file's other native-primitive-layer
entries. Nothing blocks other work landing in the meantime: `open()`'s own `schema()`-based
substitute is a reliable enough success/failure signal for ordinary use, just not as diagnostically
precise as real Python.

**Context:** Found and corrected during the `ifcopenshell.open()` module-level-surface port
(`src/open.ts`/`src/zip.ts`, 2026-09-21) -- the pre-dispatch investigation that scoped this chunk
had already correctly identified the missing value accessor, but its own description of `good()`'s
nullness as a usable coarse signal was independently re-verified against a real, locally-built
native addon (this port's standing "never trust a self-report" discipline) and found to be wrong in
a way that would have made `open()` unusable for every valid file, not merely imprecise -- caught by
the chunk's own test suite before landing, then fixed via the `file.nativeFile.schema()`-throws
substitute described above.

### `src/wrappergen/`'s own generator (`clang_frontend.py`) crashes on this dev machine, blocking any NEW native-primitive addition -- found 2026-09-21, dispatching `EntityInstance.toString()` -- **RESOLVED 2026-09-21/22, see UPDATE below**

Attempting to add a genuinely new native primitive (`EntityInstance.toString()`/`entity_instance.to_string`
-- see `PROGRESS.md`'s own tracking row) via the established `_inject_entity_instance_primitives`
free-function-injection mechanism (already used 8+ times for other SWIG-only/discovery-gap methods,
e.g. `is_a`, `attribute_kind_of`) required regenerating `src/wrappergen/generated_napi/` for the first
time since this project's Phase 1/2 bootstrap (confirmed via `git log` -- only 4 commits have ever
touched that directory, all from that initial phase). The regenerator crashes:

```
ValueError: Unknown template argument kind 437
  (raised from clang.cindex.CursorKind.from_id, called via cursor.kind)
```

**Root cause, fully diagnosed, not just observed:** the PyPI `libclang` Python-bindings package (tried
both 18.1.1 and 16.0.6 -- the highest version PyPI offers, and one older -- same gap in both) has a
real, visible hole in its `CursorKind` ID table: `DLLIMPORT_ATTR = CursorKind(419)` is immediately
followed by `CONVERGENT_ATTR = CursorKind(438)` -- IDs 420-437 are simply never registered, including
437 (`CXCursor_FlagEnum`, a real Clang cursor kind used for the `__attribute__((flag_enum))` attribute
Apple's macOS SDK headers apply). The crash happens on the very FIRST header parsed
(`alignment_helper.h`), at a cursor inside
`/Applications/Xcode.app/.../MacOSX.sdk/usr/include/mach/vm_types.h` -- pulled in transitively by
ordinary `#include <cstdint>`/`<string>` chains, nothing `ifcparse`-specific. This strongly suggests
the Phase 1/2 bootstrap ran on Linux (or with a fuller-fidelity libclang install) where Apple's
`flag_enum`-attributed system headers never appear at all.

**Why this can't be routed around by a header-set or clang-arg change:** `clang_frontend.py`'s
`_collect_enum_cursors`/`_collect_class_cursors` walk every descendant cursor of the WHOLE translation
unit via `_iter_children` (not scoped to the target headers) and call `.kind` on each one BEFORE ever
checking `_is_in_allowed_headers` -- so this breaks on step one of parsing the very first header, for
any header list, on any machine using this same third-party `libclang` package. A real fix means
reordering those two functions (and possibly other `_iter_children` consumers, not fully audited) to
filter by file location before touching `.kind` -- a small, self-contained, cross-cutting fix to
shared generator infrastructure, not something to bundle into a single-primitive addition.

**Independently re-verified by the orchestrating session**: reproduced the identical crash myself
against a completely clean `v0.9.0` checkout (zero involvement of the dispatched agent's own diff),
confirmed the exact `CursorKind` table gap by reading the installed `clang/cindex.py` directly, and
confirmed the dispatched agent's own stash-based control test (same crash with their 3-file diff
stashed out) was legitimate, not a convenient excuse. Also independently compiled the agent's own
C++ shim addition (`clang++ -std=c++17 -fsyntax-only`) and byte-compiled its Python registration
change -- both clean.

**Fix options (not yet decided, needs project-owner input):** (a) fix `_collect_enum_cursors`/
`_collect_class_cursors` to filter by allowed-header location before accessing `.kind`, as its own
small, separately-reviewable chunk, benefiting every future native-primitive addition, not just this
one; (b) try a Linux (or otherwise fuller-fidelity libclang) environment where this Apple-SDK-specific
gap doesn't occur, if one becomes available to this session.

**Depends on / blocked by:** nothing blocks other work landing in the meantime -- this only affects
adding brand-new native primitives, not anything already exposed. `EntityInstance.toString()`'s own
3-file diff (the shim function + its `napi_binding.py` registration, both independently verified
compile-clean above) is committed locally in a worktree, NOT pushed/opened as a PR, pending this
generator fix.

**Context:** Found while dispatching `EntityInstance.toString()`, the first genuinely new native
primitive attempted since this project's Phase 1/2 bootstrap -- see `PROGRESS.md`'s own tracking row
for the full history of why this needed a new primitive (not a TS-side workaround) in the first
place.

**UPDATE, RESOLVED (PR #162, 2026-09-22)**: project owner chose fix option (a) above (no Docker/Linux
environment was available to try option (b)). `_collect_enum_cursors`/`_collect_class_cursors` both
fixed by reordering the filter chain so `_is_in_allowed_headers` (which only touches `cursor.location.file`,
never `.kind`) runs FIRST, before `cursor.kind` is ever accessed -- confirmed via audit that `_iter_children`
(the exhaustive whole-translation-unit walk) is consumed ONLY by these two functions, so the fix is
complete, not partial. Also fixed a second, related pre-existing gap found along the way: `napi_binding.py`
had no Boost include directory configured at all (this repo has no `compile_commands.json` anywhere), so
the parser failed outright on `'boost/lexical_cast.hpp' file not found` even with the crash fixed -- added
`_discover_boost_include_dir()`, portable rather than hardcoded (tries `BOOST_INCLUDEDIR`/`BOOST_ROOT` env
vars matching CMake's own `FindBoost` convention, then `brew --prefix boost`, then common system paths;
every candidate verified against a real `boost/version.hpp` before use, so a bad guess can never inject a
wrong path -- a genuine miss silently adds nothing, so the underlying "file not found" still fails loudly).

**A second, real, incidental finding surfaced by successfully regenerating for the first time in a long
while**: the clean-regeneration diff (this fix's own primary verification) was NOT empty -- one new
binding, `spf_header.with_other(other)`, wrapping a real, already-existing C++ copy constructor
(`spf_header(const spf_header& other)`, `spf_header.h`). Investigated fully rather than assumed:
`git log -L` on that exact line shows it was added in commit `9d0dda897` ("Phase 1: ASan/UBSan CI +
libFuzzer harness + event-loop-liveness test (#13)", 2026-09-07 13:28), the SAME DAY as (a few hours
BEFORE) the last time `generated_napi/` was actually regenerated (commit `6b996395`, "Phase 2: IfcFile +
EntityInstance foundation (#15)", 17:56) -- meaning this real constructor should plausibly have been
picked up back then but wasn't, for an unrelated historical sequencing reason, and has been silently
missing from the checked-in bindings ever since. The diff was purely additive (zero removed lines across
all 4 files) -- landed as a disclosed, incidental byproduct of this fix, not scope creep: hand-suppressing
a correctly-generated, real binding would have been the wrong call.

**Independently re-verified by the orchestrating session, twice** (once mid-flight on an intermediate,
uncommitted version of the fix; once again on the final PR): reproduced the crash and confirmed the fix
resolves it; regenerated independently using the checked-in, fixed `napi_binding.py` (no manual monkeypatch
needed this time, confirming `_discover_boost_include_dir()` works for real) and confirmed the output is
byte-identical across all 4 files to what's checked into the PR; rebuilt the native addon from scratch and
ran the full suite (6189 passing, 55 failing -- the same 9 known pre-existing unrelated failure files, 0
new regressions); wrote an ad-hoc smoke test confirming `spf_header.with_other()` produces a distinct,
usable handle and throws a clean error on a null argument; caught and fixed a real but unrelated CI flake
(a timing-threshold assertion in `test/native/event_loop.test.ts`, not touched by this PR's diff) via a
retrigger, distinguishing it from a genuine regression before merging.

`EntityInstance.toString()` itself remains a separate, not-yet-landed follow-up chunk -- its own 3-file
diff (the shim function + registration, already written and verified compile-clean before this fix even
started) is preserved, uncommitted-to-`v0.9.0`, in a dedicated local worktree, ready to be regenerated and
shipped for real now that this blocker is cleared.

### Native primitive-layer gap: mixing a raw JS value with an `EntityInstance` in the same SELECT-of-(entity|simple) LIST/aggregate attribute crashes the native process (worker death, not a JS exception)

**Found:** 2026-09-24, while dispatching Phase EX-4 chunk 5 (final IFC2X3 WHERE-rule classes,
`whereRules/ifc2x3.ts`) -- building a test fixture for `IfcTrimmedCurve.Trim1` (a SELECT-typed LIST
attribute that can hold either wrapped `IfcCartesianPoint` entities or a raw `IfcParameterValue`-typed
number) by assigning `[point(...), 1.5]` directly -- a raw JS `number` alongside an `EntityInstance` in
the same JS array passed to a LIST/aggregate SELECT attribute setter -- kills the whole native worker
process outright, not a catchable JS exception. Worked around in that PR's own test fixtures by wrapping
the raw number as a proper standalone defined-type instance first (`file.createEntity("IfcParameterValue",
1.5)`) before putting it in the list, which does NOT crash.

**Not yet root-caused:** no native stack trace or ASan/UBSan repro captured yet (chunk 5's own CI run,
including asan-ubsan, passed -- meaning the crashing construction was never actually exercised by that
PR's final, fixed test suite, only by an intermediate iteration during authoring). Suspected shape: the
attribute-value marshaling path for a LIST/aggregate SELECT attribute likely assumes every element is
either uniformly a wrapped handle or uniformly a raw primitive when building the underlying `aggregate_of_instance`/
value vector, and a mixed list violates that assumption at the C++ layer without a bounds/type check.

**Impact:** any future WHERE-rule, calc function, or ordinary API call that constructs a SELECT-of-
(entity|simple)-typed LIST/aggregate attribute with a genuinely mixed raw/wrapped element list will hit
this. Not yet known how many such attributes exist in the schema or whether any already-merged code
constructs one this way (not audited).

**Depends on / blocked by:** nothing blocks other work in the meantime -- always wrapping raw simple
values in their own defined-type instance before adding them to such a list (as chunk 5's own test
fixtures now do) is a safe, always-available workaround; this entry tracks the underlying native gap for
whoever next has reason to fix the marshaling layer itself, or to reproduce it under ASan for a proper
root cause.

**RECONFIRMED, same schema-independent gap:** hit again 2026-09-24 while dispatching Phase EX-4's IFC4
chunk 6 (the final IFC4 WHERE-rule chunk, `whereRules/ifc4.ts`) -- same `IfcTrimmedCurve.Trim1`/`Trim2`
construct, same vitest-worker-segfault symptom, same workaround (`file.createEntity("IfcParameterValue",
value)`). Confirms this is a genuine cross-schema native-layer gap (IFC2X3 and IFC4 share the same
underlying attribute-marshaling code), not something specific to one schema's own generated bindings.

### `util/schema.ts`'s `getSupertypes()`/`isA()` may not fully reflect a real subtype relationship for at least one IFC4X3_ADD2 entity (`IfcGrid`/`IfcPositioningElement`)

**Found:** 2026-09-24, while independently re-verifying Phase EX-4's IFC4X3_ADD2 chunk 4 (PR #237,
`whereRules/ifc4x3.ts`). That chunk's own dispatched agent found and disclosed a genuine schema-hierarchy
change: IFC4's own `IfcGrid_HasPlacement` WHERE-rule has no IFC4X3_ADD2 counterpart, replaced by a wholly
new `IfcPositioningElement` entity with its own `HasPlacement` rule -- and claimed `IfcGrid` now
dispatches against it, meaning `IfcGrid` is a real schema subtype of `IfcPositioningElement` in ADD2.

**Independently reproduced the core claim from scratch** (not just trusted): building a real, bare
`IfcGrid` instance (no `ObjectPlacement`) in a fresh `IFC4X3_ADD2` file and running it through the real
`executeRules(file)` engine produces exactly one violation, whose message reads `Rule
IfcPositioningElement.HasPlacement violated` -- not any `IfcGrid`-named rule. This is the same production
`byType()`-backed dispatch mechanism the entire rest of this port already depends on, so the underlying
schema fact (IfcGrid is-a IfcPositioningElement in ADD2) is treated as confirmed.

**The discrepancy:** a parallel check using `util/schema.ts`'s own already-shipped `getDeclaration()` +
`getSupertypes()` (which walks the `entity.supertype()` pointer chain) on the SAME `IfcGrid` instance in
the SAME schema returned `IfcGrid -> IfcProduct -> IfcObject -> IfcObjectDefinition -> IfcRoot` --
`IfcPositioningElement` does not appear anywhere in that chain. A direct `isA(declaration,
"IfcPositioningElement")` call (`util/schema.ts`'s own thin wrapper around the native
`is__with_name`) also returned `false`, even though `isA(declaration, "IfcProduct")` on the same
declaration correctly returned `true` (confirming `is__with_name` itself does real hierarchy-aware
matching in the ordinary case, not just exact-name matching).

**Not yet root-caused.** Suspected shape: EXPRESS permits an entity to declare more than one direct
supertype (multiple inheritance via a `SUPERTYPE OF`/`SUBTYPE OF (...)` list); if IFC4X3_ADD2 added
`IfcPositioningElement` as an ADDITIONAL supertype of `IfcGrid` alongside its pre-existing `IfcProduct`
lineage, a `.supertype()` pointer walk that only ever follows a single "primary" parent (as
`getSupertypes()`'s own header comment describes: "Walks `.supertype()` repeatedly until `None`/`null`")
would silently miss the second lineage entirely, while the real native `byType()`/`is_a()` C++
implementation (which IfcOpenShell's own core has always needed to get right for ordinary schema
correctness) presumably accounts for all declared supertypes correctly. Not confirmed against the real
EXPRESS schema source for `IfcGrid` in IFC4X3_ADD2 -- that would be the next concrete step for whoever
picks this up.

**Impact:** any future code relying on `getSupertypes()`/`isA()` (both already-shipped, general-purpose
helpers, not specific to the WHERE-rules work) to answer "is X a subtype of Y" for an entity with more
than one direct EXPRESS supertype would get a false negative. The WHERE-rules engine itself is NOT
affected, since it dispatches via real `byType()`, not these helpers.

### `runtimeShim.ts`'s `expressGetAttr` catches ANY exception when reading an attribute, unlike real Python's `getattr(obj, name, default)`, which only swallows `AttributeError`

**Found:** 2026-09-24, Phase EX-5 chunk 1 (PR #247), while wiring up the real 138-fixture
`test/fixtures/rules/` suite (`test/rules.orchestrator.test.ts`) and investigating why a pre-existing
pinned regression test (`ifc4.test.ts`/`ifc4x3.test.ts`,
`IfcRationalBSplineSurfaceWithKnots.WeightValuesGreaterZero`) started behaving differently once that
chunk's own `expressGetItem` fix landed (see below).

**Real Python:** `rule_compiler.py`'s `express_getattr(aggr, name, default)` is `v = getattr(aggr, name,
default); return default if v is None else v` -- i.e. it relies entirely on Python's builtin `getattr`,
which substitutes `default` ONLY for a genuine `AttributeError` (the attribute doesn't exist). Any OTHER
exception raised while evaluating the attribute (e.g. a `TypeError` thrown deep inside a DERIVE formula
via `entity_instance.__getattr__` calling a `calc_*` function) propagates straight through `getattr`
uncaught -- confirmed directly against `rule_compiler.py`'s own source and by running real Python's
installed `ifcopenshell` package end-to-end against a concrete input that exercises this exact path.

**This port:** `runtimeShim.ts`'s `expressGetAttr` wraps its whole attribute-read in a blanket
`try { ... } catch { return defaultValue; }`, silently substituting `INDETERMINATE` for ANY thrown
exception, not just a "missing attribute" case. Concretely: `IfcRationalBSplineSurfaceWithKnots`'s
`Weights` DERIVE attribute (`calc_IfcRationalBSplineSurfaceWithKnots_Weights` -> `IfcMakeArrayOfArray`)
has an already-disclosed, verbatim-preserved upstream bug that unconditionally throws a `TypeError` for
any well-formed surface (see `rules/ifc4.ts`'s own header comment) -- real Python's own rule genuinely
throws for this input (confirmed empirically against the real installed package), while this port's
`WeightValuesGreaterZero` now silently reports NO violation for the identical input, because
`expressGetAttr(self, "Weights", INDETERMINATE)` swallows that `TypeError` into `INDETERMINATE` instead
of propagating it. (Before Phase EX-5's own `expressGetItem` fix landed in the same PR, this was masked
by an unrelated crash one line later, which is what the old pinned test was actually observing -- see
that PR's `ifc4.test.ts`/`ifc4x3.test.ts` diff for the full history.)

**Not fixed.** `expressGetAttr` is consumed by essentially every one of Phase EX-2's/EX-4's ~1,823
already-ported, already-tested WHERE-rules and DERIVE-attribute call sites -- narrowing its catch to
mirror Python's `AttributeError`-only semantics is a broad, cross-cutting change (what counts as "this
port's equivalent of `AttributeError`" needs its own design pass) requiring a full re-verification sweep
across all 3 schemas' rule/test files, not a small, well-scoped fix. Tracked here rather than folded into
Phase EX-5.

**Impact:** any rule (or DERIVE calculation) that reads an attribute whose value would genuinely throw in
real Python for a non-"missing attribute" reason will silently diverge from real Python's behavior in
this port -- real Python raises/reports a violation, this port swallows it to `INDETERMINATE` and
typically reports no violation. Currently confirmed for exactly one rule
(`IfcRationalBSplineSurfaceWithKnots.WeightValuesGreaterZero`, itself already unconditionally blocked by
the separate `IfcMakeArrayOfArray` bug regardless of this gap), but the underlying `expressGetAttr`
mechanism is generic and could mask other cases.

**Depends on / blocked by:** nothing blocks other work in the meantime -- no code in this port currently
relies on `getSupertypes()`/`isA()` returning a complete answer for a multiply-inherited entity as far as
this finding's own investigation went (not exhaustively audited). This entry tracks the open question for
whoever next needs a full "is this really a subtype" check outside the rule engine's own `byType()` path.

### Native primitive-layer gap: `LOGICAL`-typed attribute reads always return a raw `0`/`1`/`2` JS number, never Python's `true`/`false`/`"UNKNOWN"`

**Found:** 2026-09-25, while building the reference-model parity testing plan's chunk 1 (PR #252,
`test/referenceParity/`) -- the TS half of a read-parity harness diffing this port's own attribute reads
against real `ifcopenshell-python`'s, over 30 real buildingSMART reference fixtures.

**Root cause, confirmed directly against native source:** `src/wrappergen/generated_napi/
ifcopenshell_native.cpp`'s `IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_LOGICAL` case (line ~771-772) does
`napi_create_int64(env, value.logical_value, &js_result)` -- i.e. every EXPRESS `LOGICAL`-typed
attribute read comes back as a raw JS number (`0`=false/`1`=true/`2`=UNKNOWN), never real Python's own
`True`/`False`/`"UNKNOWN"` tri-state values.

**Confirmed real and non-trivial, not a one-off**: independently re-verified via a real installed
`ifcopenshell-python`, walking every entity declaration's attributes across all 3 supported schemas and
checking each attribute's `type_of_attribute()` for a `LOGICAL` (or `IfcLogical`-defined-type-wrapped)
underlying type -- found 29 in IFC2X3, 45 in IFC4, 48 in IFC4X3 real, non-SELECT-wrapped `LOGICAL`-typed
declared attributes (e.g. `IfcBSplineCurve.ClosedCurve`/`SelfIntersect`, `IfcBSplineSurface.UClosed`/
`VClosed`, `IfcMaterialLayer.IsVentilated`, `IfcPresentationLayerWithStyle.LayerOn`/`LayerFrozen`/
`LayerBlocked`, `IfcShapeAspect.ProductDefinitional`, `IfcAppliedValue.AppliedValue` via a SELECT branch,
and more).

**Currently latent, confirmed directly, not assumed**: none of the 30 real vendored reference-parity
fixtures (`test/fixtures/reference/`) contains an instance of any LOGICAL-attribute-bearing declaration
-- checked every fixture's own golden JSON directly (`grep`-style scan for each declaration name), zero
hits across all 30. This is why chunk 1's read-parity suite reports zero mismatches despite this gap
being real: the specific corpus in hand doesn't happen to exercise it.

**Not fixed.** This is a native primitive-layer issue (the N-API marshaling code itself), not something
fixable from TS -- needs a `wrappergen`/native-addon change to marshal `LOGICAL` attribute values as a
proper tri-state (boolean-or-`"UNKNOWN"`, matching this port's own already-established `Tri`/
`Indeterminate` convention from the EXPRESS rules work, `express/runtimeShim.ts`) rather than a raw
int64. Out of scope for the reference-parity testing chunk that found it.

**Impact:** any future reference fixture, mutation-battery scenario (chunk 3 of the reference-parity
plan), or ordinary API/util work that reads one of the ~29-48 LOGICAL-typed attributes above will get a
raw `0`/`1`/`2` number instead of a proper boolean/tri-state value -- a real, reachable read-path
divergence from real Python, currently masked only by this port's existing test corpus not touching any
of these attributes yet.
