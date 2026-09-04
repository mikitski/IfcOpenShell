# IfcOpenShell-TS — Repo Layout, Build, and Tooling

Status: draft, pre-`plan-eng-review`. Every choice below marked "greenfield" has zero in-repo
precedent (`research/05` §5) — these are recommendations for review, not settled decisions, unlike
`00-overview.md` §2's fixed constraints.

## 1. Package location

`src/ifcopenshell-ts/`, sibling to `src/ifcopenshell-python/`, following the existing
"`src/<language-binding-name>/`" convention (`ifcblender`, `ifcmax`, `ifcmcp`, ...). Gets its own
entry in `AGENTS.md`'s "Architecture Quick Reference" directory list alongside the others.

**License**: LGPL-3.0-or-later (mandatory per `AGENTS.md` — Bonsai is the only GPL exception in
the repo, and this isn't Bonsai).

## 2. Internal layout

```
src/ifcopenshell-ts/
  native/                 # the N-API addon: C++ glue over src/ifcparse, src/ifcgeom (post-v1)
    binding.gyp | CMakeLists.txt   # build system choice — see §3
    src/                  # addon C++ source (primitives from 20-roadmap.md Phase 1)
  src/                    # the TS package itself (what gets published to npm)
    index.ts
    file.ts, entityInstance.ts, guid.ts, settings.ts, template.ts, ...   # core (Phase 2)
    api/<subpackage>/<function>.ts                                       # Phase 6-9
    util/<module>.ts                                                     # Phase 3-4
  test/                   # mirrors src/, see 40-testing-strategy.md §2
  package.json
  tsconfig.json
  README.md
```

## 3. Native addon build (decided, gated on a spike)

Confirmed by the project owner (`00-overview.md` §2, 2026-09-03): pursue the generated path below,
gated on the timeboxed spike. Two realistic choices for the N-API layer:

- **`node-addon-api`** (C++ wrapper over N-API) + **CMake.js** or **`node-gyp`** — most direct,
  most control, integrates with the existing CMake-based C++ build (`cmake/`) with the least new
  tooling surface. Likely the default choice given the rest of the repo is CMake-centric.
- **A generated binding (recommended)**, extending `src/wrappergen/` (the repo's existing
  clang-based C++→C-API generator, currently emitting a language-agnostic C ABI plus a Python
  CPython-extension + facade on top of it — see `research/04-wasm-js-infra.md`) to also emit N-API
  glue + a TS facade, as two more sibling emitter functions of the same shape. Means the low-level
  binding surface (`20-roadmap.md` Phase 1) is generated once and kept in sync automatically as the
  C++ core evolves, rather than hand-maintained SWIG-style `.i`-file-equivalent glue. **Gated on a
  timeboxed validation spike (`10-architecture.md` §3) before Phase 1 schedules against it** —
  `wrappergen` is a 5-commit, ~5-month-old experimental prototype, sound in design but unproven past
  the small header subset it's currently pointed at; hand-written `node-addon-api` is the fallback
  if the spike finds a fundamental mismatch.

Either way, the addon binary is platform-**and-architecture**-specific (like the existing prebuilt
`ifcopenshell_wrapper` `.so`/`.pyd` blobs `ifcopenshell-python` downloads — `research/05` §3) —
expect prebuilt-binary distribution (e.g. via `prebuildify`/`node-gyp-build` or a postinstall
fetch script mirroring the Python side's S3-zip-download pattern) rather than requiring every npm
consumer to compile the C++ core themselves. **`plan-eng-review`'s Step 0 check**: the existing
`ci-ifcopenshell-python-pypi.yml`/`build_osx.yml` workflows already build the Python wheel for 3
OSes × 2 architectures (macOS x64+arm64, `linuxarm64` alongside linux x64, Windows) — the addon
build matrix (`20-roadmap.md` Phase 0) and this distribution mechanism both need to cover the same
6 combinations from the start, since a native Node addon has exactly the same per-arch-binary
requirement the Python extension already does.

**Fallback-cost sizing (added by `plan-eng-review`)**: if the `wrappergen` validation spike
(`10-architecture.md` §3) fails and Phase 1 falls back to hand-written `node-addon-api` glue,
that's not free — it means hand-writing the ~15-way `set_attribute_value_py`-equivalent type
dispatch, the full schema-introspection surface, and buffer-based file open by hand, the same
volume of glue work `ifcwrap`'s SWIG `.i` files represent today (`research/01` §5). Size this
fallback path (even roughly) *before* committing to the spike's timeline, so "gated on a spike" is
a bounded risk with a known worst case, not an open-ended one — `plan-eng-review` recommends this
estimate exist before Phase 0 starts, not be discovered mid-Phase-1 if the spike fails.

## 4. Lint/format (greenfield)

**Biome** — the only in-repo JS/TS precedent (`src/ifctester/webapp/biome.json`), recommended for
consistency rather than introducing a third tool (ESLint+Prettier) with zero existing footprint.
Needs its own root-level (or `src/ifcopenshell-ts/`-scoped) config, since the existing one is
Svelte-app-specific (ignores `.svelte`, has an app-specific `noExplicitAny` carve-out) and not
directly reusable. Pick a line-length convention (Python's is 120 chars per `AGENTS.md`; no
reason not to match it for consistency) and, per `research/05` §5's suggestion, add a JS/TS entry
to `AGENTS.md`'s "Code Style" section once this is decided so the gap is closed repo-wide, not
just documented in this planning tree.

## 5. Test runner

Vitest — see `40-testing-strategy.md` §1 for rationale.

## 6. Documentation toolchain (greenfield)

**TypeDoc** — closest analogue to the Python side's `sphinx-autoapi` (`research/05` §2): reads
TSDoc comments + type signatures directly from source, no import/build step required, matching
autoapi's explicitly-stated design philosophy (source-static, not introspection-based). Docstrings
should follow TSDoc `@param`/`@returns`/`@example` in the same summary → prose → params → return →
example shape the Python docstrings use (`research/05` §2 confirms this is the existing
Sphinx/reST field-list convention, sampled from `util/element.py`) — this is as close to a direct,
mechanical translation as documentation gets, and should be done at the same time as each
function's code port, not as a separate pass.

Open question, not blocking early phases: does this get a page under `docs.ifcopenshell.org`
alongside `ifcopenshell-python.html` (would need a docs-deploy workflow, none currently exists for
the Python Sphinx site either per `research/05` §2), or ship as a separately-hosted TypeDoc site
(e.g. Cloudflare Pages, matching the `ifctester` webapp's existing deploy pattern)? Defer to
whichever `plan-devex-review` or a later documentation-focused pass decides — not a v1 blocker.

## 7. Versioning (greenfield, tension to flag explicitly)

**Current monorepo convention** (`research/05` §3): every Python sub-package versions in lockstep
off the single root `VERSION` file, substituted at build time. **Tension**: this is idiomatic for
a monorepo of same-language siblings released together, but less idiomatic for npm, where
independent semver per package is the ecosystem norm and consumers often expect a package's
version number to reflect *that package's* stability/API-surface, not the whole monorepo's.

**Decided**: **sync to root `VERSION` for the 0.x line** (matches every existing sibling package,
avoids a second version-bump ceremony during heavy early development when the TS surface is
changing fast alongside the C++ core it binds) with the option to **break out to independent
semver once the package reaches a stable 1.0** (signals "this specific binding is now API-stable"
the way npm consumers expect). `plan-eng-review` can still challenge this, but it's no longer an
open question by default (`30-open-questions.md` item 11).

## 8. Publishing (greenfield)

No npm-publish workflow precedent anywhere in the repo (`research/05` §5). Recommend mirroring the
existing PyPI workflow shape for consistency: a `workflow_dispatch`-triggered
`ci-ifcopenshell-ts-npm.yml`, gated on `github.repository == 'IfcOpenShell/IfcOpenShell'`,
`IS_STABLE`-vs-nightly build distinction (matching `VERSION_DAILY`'s pattern if the synced-version
route from §7 is chosen). **Package name decided: bare `ifcopenshell`** (`00-overview.md` §2,
`30-open-questions.md` item 12) — matches PyPI exactly; confirmed unclaimed on the npm registry as
of 2026-09-03 (re-check immediately before the first publish, since availability can change between
now and Phase 0's build-out). This leaves the eventual Phase B1 browser/WASM package needing its
own distinguishing name decided later (e.g. a `browser`/`wasm` export condition on the same
package, or a genuinely separate package) — not a v1 blocker, revisit at Phase B1.

## 9. CI test gate

Extend the existing monolithic `ci.yml` (`research/05` §3: compiles the whole C++ core once, then
fans `make test`-equivalent out across every dependent sub-package) with one more fan-out step for
`ifcopenshell-ts`'s native-addon build + `npm test`, path-filtered on `src/ifcopenshell-ts/**` the
same way other sub-packages are. Keep lint as an independent job (mirroring `ci-lint.yaml`'s
decoupling from the C++/test build) so a lint failure doesn't block on a full C++ recompile.

## 10. AI-agent contribution rules

No changes needed to `AGENTS.md`'s existing rules (LGPL license, AI-disclosure requirements,
PR-scope discipline, commit-message format) — they already apply to any new package by virtue of
being repo-wide. The one gap worth closing (§4) is adding a JS/TS row to the "Code Style" section
once lint/format tooling is chosen, for parity with how Python and C++ are documented there.
