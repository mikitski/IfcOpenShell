# TODOS

Deferred items surfaced during review, not yet scheduled into an active plan. Each entry captures
enough context that someone picking it up later understands the motivation and starting point.

## IfcOpenShell-TS

Surfaced by `/plan-eng-review` on `planning/ifcopenshell-ts/`, 2026-09-04, plus operational findings
from Phase 0 implementation.

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

### CI: `SCHEMA_VERSIONS=4`-only means IFC2X3/IFC4X3-parameterized tests are silently skipped, not run

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

### `util.unit.convert_file_length_units` -- genuinely blocked, not yet portable

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

**Depends on / blocked by:** Blocked on Phase 4's `util.geolocation` and Phase 6's `api.unit`/
`api.georeference` landing first.

### `EntityInstance.setByIndex`/`IfcFile.createEntity` cannot write an initial value into a freshly created simple/defined-type instance -- blocks `Migrator.migrate`'s `id() === 0` (SELECT-typed value) branch

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

**Depends on / blocked by:** Nothing blocking; independent design work in `entityInstance.ts` (Phase
2, already-shipped code). Low practical impact today (only `util/migrator.ts`'s two retyping checks
currently depend on this distinction, and only for whole-number REAL literals specifically), but worth
fixing at the root before a second caller reinvents the same lossy heuristic.

---

### `util.selector.get_element_value`'s positional/geolocated keys and `"profiles"`'s extrusion
### fallback -- genuinely blocked, not yet portable

**What:** Phase 3's `util.selector` chunk (`src/util/selector.ts`, `get_element_value`/the
key-path mini-language) ports every key `_get_element_value` supports except two genuine,
disclosed hard blockers, both throwing a clear, descriptive error naming the real missing Python
modules rather than being stubbed or silently dropped:

1. **The positional/geolocated keys** `x`/`y`/`z`/`easting`/`northing`/`elevation`/`rotation_x`/
   `rotation_y`/`rotation_z`. Python's `_get_element_value` calls
   `ifcopenshell.util.placement.get_local_placement` (all nine keys), plus
   `ifcopenshell.util.geolocation.auto_xyz2enh` (the `easting`/`northing`/`elevation` trio), plus
   `ifcopenshell.util.shape_builder.np_matrix_to_euler` (the `rotation_*` trio) -- none of
   `util.placement`/`util.geolocation`/`util.shape_builder` are ported yet in this TS port (all
   Tier B, later phases; `util.placement` is this project's own research doc's #3 near-term
   porting priority, not yet picked up). The blocker only fires when Python itself would actually
   need the unported math (a real, *set* `ObjectPlacement`) -- these keys still return `null`
   (matching Python) when the element's class has no `ObjectPlacement` at all, or when it's
   declared but left unset.
2. **`"profiles"`'s extrusion-based fallback path.** `ifcopenshell.util.shape.get_profiles`'s
   `IfcMaterialProfileSet` path is fully ported (self-contained, via already-ported
   `util.element.getMaterial`), but its fallback (`ifcopenshell.util.shape.get_extrusions`, used
   when the element has no material profile set) transitively calls
   `ifcopenshell.util.representation.get_representation`/`.resolve_representation` -- real
   representation-item graph resolution (including `IfcMappedItem` indirection), not a narrow,
   self-contained lookup like the `findBodyRepresentation`/`getElementSystemsNarrow`-style
   re-implementations this same chunk used for the `classification`/`system`/`zone` keys. Neither
   `util.shape` nor `util.representation` is ported yet.

**Why deferred rather than attempted:** Same category as `convert_file_length_units` above -- a
genuine cross-module hard blocker, not a "split into a follow-up chunk" situation. Porting only a
narrow slice of `util.placement`/`util.geolocation`/`util.shape_builder`/`util.representation`
just to unblock these specific keys would be real, disclosed scope creep into later-phase work
(`util.placement` and `util.representation` are each substantial modules in their own right), not
a small addition.

**Fix:** Port `ifcopenshell.util.placement` (Tier B, this project's own #3 near-term priority per
`planning/ifcopenshell-ts/research/03-python-util-inventory.md`) and `ifcopenshell.util
.geolocation`/`util.shape_builder` first, to unblock the positional/rotation keys; port
`ifcopenshell.util.representation`'s `get_representation`/`resolve_representation` (Tier B) to
unblock `"profiles"`'s extrusion fallback. Once each lands, the corresponding branch in
`src/util/selector.ts`'s `getElementValueForKeys` is a small, mechanical follow-up (replace the
`throwPositionalKeyBlocked`/`getProfilesNarrow` blocker call with the real computation) -- the
grammar/key-resolution plumbing around it is already fully ported and tested.

**Context:** Surfaced during Phase 3's `util.selector` (key-path mini-language) chunk
(2026-09-10) -- see that chunk's own PR description for the full disclosure.
`test_selector.py::TestGetElementValue.test_selecting_an_elements_rotation_using_a_query` has no
full TS counterpart for the same reason (this port's own test covers only the parts it *can*
reproduce: the blocker firing with a clear error, and the no-`ObjectPlacement`-set `null` case).

**Depends on / blocked by:** Blocked on `util.placement`/`util.geolocation`/`util.shape_builder`/
`util.representation` landing first (all Tier B, `planning/ifcopenshell-ts/20-roadmap.md` Phase
4-ish, not yet scheduled in detail).

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
