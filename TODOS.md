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

1. **Static-method discovery is entirely missing from `wrappergen`.** `clang_frontend.py`'s
   `_discover_methods` skips every `is_static_method()` cursor unconditionally (mirrors how
   constructors are discovered, but static factory-style methods get no equivalent path at all).
   Concretely blocks: `ifcopenshell::file::traverse`/`traverse_breadth_first` (both static, listed
   in `20-roadmap.md` Phase 1's required primitive list) and `ifcopenshell::logger::root()`. Fix
   shape: a new `kind="static_method"` `CallableModel`, emitted like `"free_function"` but with no
   leading `handle` self-argument at the C-API/N-API layer.
2. **Several `file`-level primitives only exist as SWIG `%extend` glue, not real C++ methods, and
   are not yet shimmed:** `file_pointer()` (identity key, needed by Phase 2's `file_mixin.post_init`
   registry per `research/07-fresh-wrapper-per-access.md`), `to_string()`/`from_string()` (whole-file
   SPF serialization), `_write(fn)` (atomic file write), `entity_names()`, `schema_identifier()`,
   `storage_mode()`. Same pattern as the entity_instance primitives this PR *did* add
   (`attribute_value_shim.h`/`.cpp`'s `get_argument_index`/`attribute_name`/`attribute_type`/
   `get_attribute_category`/`is_a`) — bounded, one-function-at-a-time follow-up work, not a design
   gap.
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
