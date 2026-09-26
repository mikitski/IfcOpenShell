# IfcOpenShell-TS — Testing Strategy

Status: draft, pre-`plan-eng-review`. Mirrors `research/05-testing-docs-packaging-conventions.md`
§1 (Python testing conventions) as closely as TS idiom allows, per this project's "translate
exactly" mandate.

## 1. Runner: Vitest

No in-repo precedent for unit-testing a TS library (`research/05` §5). Recommend **Vitest**:
Jest-compatible API (low friction for contributors coming from any JS testing background),
native TS support with no separate `ts-jest` compile step, `describe.each`/`test.each` cover the
Python schema-mixin-subclassing trick (see §3), and it's the natural fit alongside a Vite-based
build if one is chosen in `50-repo-and-tooling.md`. This is a recommendation for
`plan-eng-review`/`plan-devex-review` to confirm, not a locked decision.

## 2. Directory layout — mirror the Python tree exactly

```
src/ifcopenshell-ts/
  src/
    file.ts              # <- file.py
    entityInstance.ts     # <- entity_instance.py
    guid.ts               # <- guid.py
    ...
    api/
      root/createEntity.ts       # <- api/root/create_entity.py
      pset/addPset.ts             # <- api/pset/add_pset.py
      ...
    util/
      element.ts            # <- util/element.py
      ...
  test/
    bootstrap.ts            # <- test/bootstrap.py
    fixtures/                # <- test/fixtures/*.ifc (same files, copied or symlinked)
    file.test.ts             # <- test_file.py
    entityInstance.test.ts   # <- test_entity_instance.py
    api/
      root/createEntity.test.ts   # <- test/api/root/test_create_entity.py
      pset/addPset.test.ts
      ...
    util/
      element.test.ts        # <- test/util/test_element.py
      ...
```

One TS test file per Python test file, same relative path (snake_case → camelCase filenames),
so a reviewer can open both side by side and confirm coverage parity directly. This mapping is
also the mechanical basis for the "v1 completeness pass" exit criterion in `20-roadmap.md` Phase
10: walking the Python `test/` tree and confirming a TS counterpart exists is enough to catch
gaps, no separate tracking spreadsheet needed.

## 3. Fixture/bootstrap pattern — port `test/bootstrap.py`'s mixin trick

Python achieves "run the same test body against IFC2X3/IFC4/IFC4X3" via multiple inheritance
(`class TestCreateEntityIFC2X3(test.bootstrap.IFC2X3, TestCreateEntity): pass`). TS has no
equivalent, but Vitest's parametrized suites reproduce the same effect without duplicating test
bodies:

```ts
// test/bootstrap.ts
export function createTestFile(schema: "IFC2X3" | "IFC4" | "IFC4X3"): IfcFile {
  const file = api.project.createFile({ version: schema });
  // reset pre/post listeners, install a fake owner.settings.getUser/getApplication
  // equivalent (see §5) — mirrors bootstrap.py's monkeypatch, once per test.
  return file;
}

// test/api/root/createEntity.test.ts
import { createTestFile } from "../../bootstrap";
import * as subject from "../../../src/api/root/createEntity"; // "subject" alias, per research/05 §1

describe.each(["IFC2X3", "IFC4", "IFC4X3"] as const)("createEntity (%s)", (schema) => {
  let file: IfcFile;
  beforeEach(() => { file = createTestFile(schema); });

  test("creates a rooted entity with a fresh GlobalId", () => {
    const wall = subject.createEntity(file, { ifcClass: "IfcWall" });
    expect(wall.GlobalId).toHaveLength(22);
  });

  test("IFC2X3-only behavior", { skip: schema !== "IFC2X3" }, () => { /* ... */ });
});
```

This is a **recommendation**, not a locked design — the exact ergonomics (a shared `beforeEach` vs.
a factory helper, how to express per-schema-only test cases) are worth a quick spike alongside
Phase 2 rather than over-specifying here.

Fixture `.ifc` files: reuse `test/fixtures/**/*.ifc` from `ifcopenshell-python` directly (copy or
symlink into `src/ifcopenshell-ts/test/fixtures/`) rather than re-authoring them — they're
schema-version-agnostic binary/text assets, not Python code, so there's no "translation" needed
and reusing them keeps both suites honest against the same regression cases.

## 4. Assertion style

Plain `expect(...)` (Vitest's Jest-compatible assertions), matching Python's plain `assert`
philosophy — no custom assertion-helper library. Structural/deep equality
(`expect(x).toEqual({...})`) for dict-shaped API results, mirroring Python's dict-equality
assertions (`research/05` §1 example: `assert subject.get_pset(...) == {"a": "b", "id": ...}`).
Integration-style tests against a real in-memory `IfcFile`, not mocks — Python's suite has no
mocking framework and the same reasoning applies in TS: IFC mutation is inherently graph-shaped,
hard to meaningfully isolate from the file object, and the point of these tests is confirming
graph-level side effects, not unit-isolating pure functions. Numeric/geometric tests (Phase 4/9 of
`20-roadmap.md`) assert with `toEqual`/`toBeCloseTo` against whatever vector/matrix type is chosen
in `30-open-questions.md`, mirroring Python's `numpy.array_equal` usage.

## 5. Global-state overrides: DI seam instead of monkeypatching

Python fakes `ifcopenshell.api.owner.settings.get_user`/`get_application` by directly reassigning
the module attribute — not available in TS (`export function` bindings aren't reassignable from
outside their module, `research/05` §1 flags this explicitly). **Decided** (`30-open-questions.md`
item 9): a mutable singleton config object — `ownerSettings.getUser = (ifc) => ...` — that tests
swap per-`beforeEach`/`afterEach` the same way `bootstrap.py` does today, rather than a rebound
import (which TS/ESM doesn't allow). This is the general pattern for every Python
global-mutable-config module this project ports, not just `owner.settings` — `settings.py`'s two
booleans (`unpack_non_aggregate_inverses`, `compare_instances_by_value`, `20-roadmap.md` Phase 2)
use the same shape. Settled ahead of Phase 6, since every subsequent `api` test's bootstrap depends
on it.

## 5.5. Cache-correctness test (added by `plan-eng-review`)

The attribute-metadata cache (`10-architecture.md` §6 — a TS-side `Map<schemaVersion,
Map<className, AttributeMeta[]>>` populated once per schema, consulted by the Proxy instead of a
native call per access) is new TS-only logic with no Python counterpart, so it falls through the
file-mirroring scheme in §2/§3 entirely unless called out explicitly. Required: a differential test
that, for every entity class in all three schema versions, asserts the cached attribute-category/
index lookup agrees with a direct, uncached primitive call. This guards against the optimization
silently diverging from ground truth — a bug class that would otherwise surface only as
downstream `wall.Name`-returns-garbage symptoms, not as a cache-layer test failure. Lives alongside
the Phase 1 native-primitive tests (§7) since it exercises the same schema-introspection surface,
but gates Phase 2 (where the cache is actually consumed by the Proxy), not Phase 1.

## 6. Coverage

Match Python's posture: an HTML coverage report available locally/in CI as a visibility tool
(Vitest's built-in `--coverage` via `@vitest/coverage-v8`), **no enforced threshold gate** —
consistent with `research/05` §1's finding that the Python suite's `make coverage` target doesn't
gate on a number either. Revisit if `plan-eng-review` wants a stricter bar for a new package
without years of accumulated coverage debt to justify leniency.

## 7. Low-level binding tests (Phase 0/1 specific, not part of the file-mirroring scheme above)

The native-addon primitive layer (`20-roadmap.md` Phase 1) has no Python-side test-file
counterpart to mirror — it's new surface unique to the TS port. These need their own focused
integration tests (e.g. `test/native/*.test.ts`) exercising each primitive directly (create,
by_id, attribute get/set across every `attribute_type` category, traverse, inverse lookups)
before Phase 2's mixin layer is built on top — this is what Phase 1's exit criterion in
`20-roadmap.md` refers to.

**Native-layer robustness testing (added by `plan-eng-review`)** — two requirements distinct from
the functional integration tests above, both gating Phase 1's close:

- **Memory safety.** A dedicated CI job builds the native addon with AddressSanitizer/
  UndefinedBehaviorSanitizer and runs the full native primitive test suite (and every later
  phase's tests that exercise the addon) under it. Standard practice for any project shipping
  native addons — a use-after-free or double-free here segfaults the entire Node process rather
  than throwing a catchable JS error, so it needs to be caught in CI, not in production.
- **Malformed/hostile input.** Fuzz test the file-open/parse primitives, corpus-seeded from
  `test/fixtures/**/*.ifc`, targeting the native parser directly. Motivated by the confirmed
  Node-only (server-side) target: a plausible real deployment parses user-uploaded `.ifc` files,
  making the parser an untrusted-input attack surface analogous to PDF/image-parsing CVEs. This is
  a gap the all-valid-fixture-file testing style in §2/§3 above cannot catch by construction —
  those tests exercise correct usage, not adversarial input.
- **Event-loop liveness under load (added by `plan-eng-review`'s failure-mode pass).** The async
  primitive variants (`10-architecture.md` §2) need a test that actually proves they don't block —
  e.g. start an async parse of a large fixture file, and while it's in flight, assert a trivial
  concurrent operation (another async call, or even just a timer tick) completes promptly rather
  than queuing behind the parse. Without this, an async primitive that's accidentally implemented
  as "synchronous work wrapped in a resolved Promise" (a real, easy-to-make mistake) would pass
  every functional test while still fully blocking the event loop in production — exactly the
  failure mode the async work was added to prevent, silently unverified.
- **Native memory growth under sustained use (added by `plan-eng-review`'s failure-mode pass).** A
  soak test — open and dispose many files/entities in a loop, or run without explicit `dispose()`
  and force GC — asserting process RSS/external memory stays bounded rather than climbing
  unboundedly. Verifies the `napi_adjust_external_memory` accounting and `dispose()` method
  (`10-architecture.md` §1) actually prevent the "memory keeps climbing, nobody knows why" failure
  mode they were added to solve, rather than leaving that solution unverified until a real
  long-running server reports the problem.

## 8. CI integration

Slot into the existing `ci.yml` pattern (`research/05` §3): the monolithic job already compiles
the C++ core once and fans test runs out across sibling packages — add `ifcopenshell-ts`'s native
addon build + `npm test` as one more fan-out step, gated the same way (path-filtered on
`src/ifcopenshell-ts/**`). Keep lint (`biome check` or equivalent, per `50-repo-and-tooling.md`)
as a separate decoupled job, mirroring `ci-lint.yaml`'s separation from the C++/test build.
