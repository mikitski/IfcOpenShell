# IfcOpenShell repo conventions: testing, docs, packaging/CI

Research to inform how a new `ifcopenshell-ts` package should fit into this
monorepo's existing conventions. Scope: testing patterns, documentation
pipeline, packaging/CI/versioning, and AI-agent contribution rules — plus an
explicit list of what has no in-repo precedent for JS/TS and will need fresh
decisions.

## 1. Testing conventions (`src/ifcopenshell-python`)

**Runner & invocation**

- Plain `pytest`, no exotic config in `pyproject.toml` (no `[tool.pytest.ini_options]`
  block was found there — behavior is driven by the `Makefile` instead).
- `src/ifcopenshell-python/Makefile` targets:
  - `make test` → `pytest -p no:pytest-blender test --ignore=test/util/test_shape_builder.py`
  - `make test-parallel` → same, with `-n $NPROCS` (uses `pytest-xdist`, pinned to
    `pytest-xdist==3.8.0` in CI)
  - `make test-mathutils` → runs `test/util/test_shape_builder.py` alone (isolated
    because it imports Blender's `mathutils`, which pre-built wheels only ship for
    Python 3.13+)
  - `make coverage` → `coverage run --source ifcopenshell -m pytest ... && coverage html`
    (uses the `coverage` package directly, not `pytest-cov`; no coverage
    threshold/gate enforced, just an HTML report opened locally)
  - `-p no:pytest-blender` disables the `pytest-blender` plugin (present because
    Bonsai/Blender share test infra) — not relevant to a standalone TS package.
- Root `pyproject.toml` sets no pytest config either; `dev` extra in
  `ifcopenshell-python/pyproject.toml` just lists `pytest`, `tabulate`,
  `types-networkx`.
- No custom pytest markers beyond one custom CLI option: `test/conftest.py`
  adds `--rule` (`pytest_addoption`) to filter `test_rules.py` fixtures by
  filename substring — a narrow, ad hoc mechanism, not a general marker system.

**Shared fixtures / bootstrap pattern**

- `test/bootstrap.py` defines mixin classes `IFC4X3`, `IFC4`, `IFC2X3`, each
  with an `autouse=True` pytest fixture `setup()` that:
  - Creates a blank in-memory file via `ifcopenshell.api.project.create_file(version=...)`
    (not `ifcopenshell.file()` directly) and stores it as `self.file`.
  - Monkeypatches `ifcopenshell.api.owner.settings.get_user` /
    `get_application` so owner-history related API calls don't need a real
    `IfcPersonAndOrganization`/`IfcApplication` in the file.
  - Resets `ifcopenshell.api.pre_listeners` / `post_listeners` to `{}` each
    test (global mutable state cleanup).
- Concrete test classes subclass these mixins directly, e.g.
  `class TestCreateEntity(test.bootstrap.IFC4)`, and schema-variant coverage is
  achieved by a second subclass that inherits both the schema mixin and the
  test class: `class TestCreateEntityIFC2X3(test.bootstrap.IFC2X3, TestCreateEntity): pass`
  — this reruns every test method against IFC2X3 without duplicating test
  bodies. This is the standard idiom across `test/api/**` and `test/util/**`.
- A separate `file` fixture (`@pytest.fixture(autouse=True)` in bootstrap.py,
  parametrized via `request.param`) opens a fixture file from
  `test/fixtures/<name>` via `ifcopenshell.open(...)` — used by tests that need
  a pre-built model rather than a blank one.
- `test/fixtures/` holds hand-crafted `.ifc` files for specific regression
  cases (e.g. `bug_2517_lib.ifc`, `ColumnPSetsOfSets.ifc`) plus subdirs
  (`geom/`, `mvd_parsing/`, `rules/`, `units/`, `validate/`) grouping fixtures
  by the subsystem they exercise. `test/files/basic.ifc` is a separate, more
  generic sample file. `test/fixture_generate.py` is a helper script for
  regenerating/authoring fixtures.
- No `unittest.mock`/`pytest-mock` idiom observed in the sampled files —
  state is faked by swapping module-level functions directly (see
  `get_user`/`get_application` above), consistent with Python's dynamic
  nature; a TS port would need an equivalent DI/override seam since JS module
  functions aren't as freely monkeypatchable.

**Assertion style**

- Plain `assert` throughout (pytest's assertion rewriting), no custom helper
  library or `unittest.TestCase` assertions. Confirmed in both
  `test/api/root/test_create_entity.py` and `test/util/test_element.py`:
  - Simple equality/membership: `assert wall.is_a() == "IfcRailing"`,
    `assert len(wall.GlobalId) == 22`.
  - Dict/structural equality is common for API results, e.g.
    `assert subject.get_pset(element, "name") == {"a": "b", "id": pset.id()}`.
  - Tests are organized as `TestXxx` classes with `test_` methods (pytest
    class-based style, not bare functions), one class per behavior grouping,
    named descriptively (`test_getting_the_psets_of_a_product_as_a_dictionary`).
  - `ifcopenshell.util.element` is conventionally imported `as subject` in its
    test file (`import ifcopenshell.util.element as subject`), i.e. the
    module under test gets an alias — a light "subject under test" idiom worth
    carrying into TS tests (`import * as subject from ...` / a `sut` alias).

## 2. Documentation conventions

**Two separate Sphinx builds**

1. **Root `docs/`** — C++ API reference only, via Doxygen + Breathe + Exhale
   (`docs/conf.py`: `extensions = ['breathe', 'exhale', 'sphinx.ext.intersphinx']`).
   `docs/generate_docs.py` is a legacy driver script (pre-dates the current
   pipeline) that runs `sphinx-build` and also shells out to build the Python
   docs from `src/ifcblenderexport/docs` — this looks stale/superseded by the
   per-package docs below and by `.github/workflows/publish-cpp-api-docs.yml`.
   `docs/contents.rst` is a minimal root index linking to the C++ tree and to
   the separately-hosted Python docs.
2. **`src/ifcopenshell-python/docs/`** — Python API reference, built with
   **Sphinx + `sphinx-autoapi`** (`docs/requirements.txt`: `furo`,
   `sphinx-autoapi`, `sphinx-copybutton`). Key `conf.py` settings:
   - `extensions = ["autoapi.extension", "sphinx.ext.autosectionlabel", "sphinx_copybutton"]`
   - `autoapi_type = "python"`, and **autoapi reads source code statically**
     (does not import modules) — deliberately chosen over `sphinx.ext.autodoc`
     per an explicit comment in `conf.py` citing autodoc's issues (broken
     module access, no subnav, hacky setup, can't reorder members).
   - `autoapi_dirs` lists every sub-package's source dir that should get
     reference docs: `ifcopenshell`, `bcf`, `bsdd`, `ifccsv`, `ifcdiff`,
     `ifcpatch`, `ifctester` — i.e. **one shared autoapi build documents
     several sibling Python packages together**, not just `ifcopenshell`
     itself.
   - `autoapi_options = ["members", "undoc-members", "show-inheritance", "imported-members"]`,
     `autoapi_python_class_content = "both"` (class + `__init__` docstrings
     both shown), `autoapi_member_order = "groupwise"`.
   - Custom template dir `_autoapi_templates/` overrides autoapi's default
     rendering.
   - Theme: `furo`, with IfcOpenShell brand colors and a `pygments_style =
     "one-dark"` for code blocks (dark code blocks even on light theme, "to
     pop"). Two custom Sphinx roles (`ios_python_url`, `ifcconvert_url`)
     generate versioned GitHub release-asset download links from the shared
     `VERSION` file.
   - Non-reference docs are hand-written `.rst` under
     `docs/ifcopenshell-python/*.rst` (installation, hello_world,
     code_examples, geometry_processing/creation/tree, selector_syntax,
     schema_querying, validation, running_tests) and wired into a `toctree` in
     `docs/ifcopenshell-python.rst`. So: **hand-written conceptual/tutorial
     docs live alongside auto-generated API reference**, both under Sphinx.
   - `release` in `conf.py` is read directly from the repo-root `VERSION` file
     (`../../../VERSION` relative to that `conf.py`), same single source of
     truth used everywhere else.

**Docstring style — confirmed by sampling `ifcopenshell/util/element.py`**

- **Sphinx/reST field-list style**, not Google-style or NumPy-style. Example
  (`get_pset`):
  ```python
  def get_pset(
      element: ifcopenshell.entity_instance,
      name: str,
      prop: Optional[str] = None,
      ...
  ) -> Union[Any, dict[str, Any]]:
      """Retrieve a single property set or single property

      This is more efficient than ifcopenshell.util.element.get_psets if you know
      exactly which property set and property you are after.

      :param element: The IFC Element entity
      :param name: The name of the pset
      :param prop: The name of the property
      :return: A dictionary of property names and values, or a single value if a
          property is specified.

      Example:

      .. code:: python

          element = ifc_file.by_type("IfcWall")[0]
          psets_and_qtos = ifcopenshell.util.element.get_pset(element, "Pset_WallCommon")
      """
  ```
  Pattern: one-line summary, prose description paragraph(s), `:param x:` /
  `:return:` field list (no `:type:`/`:rtype:` fields since type hints already
  carry that), and an `Example:` section with a `.. code:: python` block
  showing realistic usage. Type information lives in the Python type
  annotations, not duplicated in the docstring — autoapi picks up both.
- Implication for TS: **TSDoc/JSDoc `@param`/`@returns` plus an `@example`
  block** is the closest structural analogue and would let a TypeDoc-based
  pipeline mirror this shape (summary → prose → params → return → example).
  Since TS carries types in the signature already (like the Python type
  hints here), TSDoc tags don't need redundant `{type}` annotations either
  once using real TS types — same philosophy as this Python codebase.

**Repo-wide docs entry point**: `docs.ifcopenshell.org` is the published
site; `README.md` links to specific pages
(`ifcopenshell-python/installation.html`, `.../hello_world.html`, etc.),
confirming the per-package `docs/` folder + Sphinx pattern is what's
user-facing today for ifcopenshell-python specifically (separate from the
root C++-only Doxygen build). `.github/workflows/docs-deployment-unstable.yml`
currently deploys **Bonsai's** docs on push to the default branch (`v0.8.0` at
the time of that file); no equivalent always-on deploy workflow was found
specifically for `ifcopenshell-python`'s Sphinx site in `.github/workflows/`
(`publish-cpp-api-docs.yml` covers the C++ side only) — likely built via an
external/separate process (e.g. Read the Docs) not fully visible in
`.github/workflows/`.

## 3. Packaging / CI / versioning conventions

**Version source of truth**

- A single root `VERSION` file (`0.9.0alpha0` at time of writing) is the
  canonical version. Nothing else hardcodes a real version:
  `pyproject.toml` files across the repo (root, `ifcopenshell-python`) declare
  `version = "0.0.0"` as a placeholder — the real version is substituted
  **at build time** by `Makefile` targets using `sed`.
- `src/ifcopenshell-python/Makefile` derives several version strings from
  `VERSION`:
  - `VERSION` — raw content (`0.9.0alpha0`)
  - `VERSION_BASE` — strips the trailing alpha/beta suffix via `sed` regex
  - `VERSION_PYTHON` — PEP 440-compatible form (`alpha` → `a`, so
    `0.9.0alpha0` → `0.9.0a0`)
  - `VERSION_DAILY` — `VERSION_BASE` + `a<YYMMDD>` for nightly/dev builds
  - `make dist` / `make zip` substitute `version = "0.0.0"` in
    `pyproject.toml` and `ifcopenshell/__init__.py` with either
    `VERSION_PYTHON` (`IS_STABLE=TRUE`) or `VERSION_DAILY` (unstable/nightly).
- Root `pyproject.toml`'s own `[project] version = "0.0.0"` is explicitly a
  non-versioned placeholder too, with a comment: *"Don't provide
  requires-python explicitly allowing pyprojects to set their own (e.g.
  bonsai and general ifcopenshell version differ)."* — i.e. sub-packages are
  allowed independent Python-version constraints even though they share the
  one `VERSION` file for release numbering.
- **Every packaged sub-project in the repo (bcf, bsdd, ifccsv, ifcdiff,
  ifcpatch, ifctester, ifc4d, ifc5d, ifcclash, etc.) is versioned in lockstep
  off the same root `VERSION` file**, each with its own `ci-<name>-pypi.yaml`
  workflow performing the same `sed`-substitution-then-build-then-publish
  dance. This is the existing precedent for "should the new package share the
  monorepo version or go independent" — **current convention is synced, not
  independent semver**, for every Python sub-package. (The task doesn't ask
  us to decide for TS, only to document current scheme — noted here as
  precedent to weigh against.)

**Build/publish mechanics (`ifcopenshell-python` specifically)**

- Pure Python wheel packaging via `setuptools` (`build-system` =
  `setuptools>=61.0`, `setuptools.build_meta`), `[tool.setuptools.packages.find]`
  includes `ifcopenshell*`, `[tool.setuptools.package-data]` grabs `"*" = ["*.*"]`
  (ships all data files, e.g. schema `.exp`/express rule files, as package
  data).
- The compiled C-extension (`ifcopenshell_wrapper`) is **not built by this
  package** — it's downloaded as a prebuilt zip from an S3 bucket
  (`IOS_URL` in the Makefile, pinned to `BINARY_VERSION`/`BUILD_COMMIT`) and
  merged into the Python source tree before wheel-building. Wheels are
  therefore platform+Python-version specific
  (`PLATFORMTAG` per PLATFORM: manylinux/macosx/win, `PYVERSION` per
  py310–py314) even though the Python layer itself is pure Python — this is
  because the C++ core is vendored as a binary blob rather than compiled from
  source at wheel-build time.
- `.github/workflows/ci-ifcopenshell-python.yml` — `workflow_dispatch`-only,
  builds+uploads GitHub Release zip assets across a **5×4 matrix**: Python
  versions `py310, py311, py312, py313, py314` × platforms `win64, linux64,
  macos64, macosm164` (uses `actions/setup-python@v7` pinned to `3.11` as the
  *host* interpreter but cross-builds all target `pyver`s via the Makefile's
  `PYVERSION` param, not native multi-version matrix builds via `setup-python`).
- `.github/workflows/ci-ifcopenshell-python-pypi.yml` — same
  `workflow_dispatch` trigger, same matrix plus `linuxarm64`, runs
  `make dist ... IS_STABLE=TRUE` then `pypa/gh-action-pypi-publish@release/v1`
  with a `PYPI_API_TOKEN` secret. Both workflows gate on
  `github.repository == 'IfcOpenShell/IfcOpenShell'` (won't run on forks) and
  are **manually triggered**, not run automatically on tag/release push.
- **Actual CI test gate** is `.github/workflows/ci.yml` (triggered on push
  to path-filtered globs including `src/ifcopenshell-python/**`, and on all
  PRs): builds the full C++ core on Ubuntu 22.04 (matrix over
  `BUILD_SHARED_LIBS: [ON, OFF]`) with heavy manual compilation of transitive
  deps (rocksdb, OpenCOLLADA, zstd, libxml2, swig — all built from source with
  `ccache`), then runs `python tests.py` (root-level C++/SWIG smoke test) and
  `make test-parallel` for `ifcopenshell-python`, then cascades into building
  and testing sibling packages installed in editable mode from the same
  checkout (`bcf`, `bsdd`, `ifcdiff`, `ifcpatch`, `ifc5d`, `ifcquery`,
  `ifcedit`, `ifcmcp`, `ifctester`) — i.e. **one big monolithic CI job
  compiles the whole C++ stack once, then fans out `make test` across every
  Python sub-package that depends on it**, rather than per-package isolated
  CI. `test-mathutils` (the excluded `test_shape_builder.py`) runs last,
  guarded to Python ≥3.13 only, specifically to make sure nothing else
  accidentally depends on the `mathutils` import.
- Lint gate is separate: `.github/workflows/ci-lint.yaml` — runs on every
  push/PR, installs tools via `uv tool install` from `requirements-tools.txt`,
  and runs (each as an independent `continue-on-error` step, aggregated into
  one final pass/fail check): `compileall` syntax check (across two Python
  versions — the IfcOpenShell-minimum `3.10` and Blender's `3.11`),
  `psf/black@stable`, a second black pass piped through
  `black-codeclimate`/a custom `black_to_github_annotations.py` script purely
  to produce GitHub PR annotations, `ty` type checking (via `poe` tasks —
  `poe ty-venv`/`ty-bonsai`/`ty-ios`, i.e. Astral's `ty` type checker, not
  mypy/pyright directly in CI even though `pyright` config exists in
  `pyproject.toml` for local/VS Code use), and `ruff check`. This job is fully
  decoupled from the C++ build in `ci.yml`.

**Conda / other distribution channels** exist too (`ci-ifcopenshell-conda-daily.yml`,
`ci-ifcopenshell-conda-cleaner.yml`, `ci-ifcopenshell-docker.yml`,
`build_pyodide.yml`, `ci-pyodide-wasm-release.yml`) — not detailed here since
out of scope for a TS package's likely distribution channel (npm), but
confirms the general pattern: **one dedicated workflow file per
distribution target**, named `ci-<package>-<channel>.yml(aml)`
(the repo is inconsistent between `.yml`/`.yaml` extensions).

## 4. AI-agent contribution rules (recap from `AGENTS.md`)

Already read in full previously; recapped here for completeness of this
report since it directly bears on how any TS-package work should be
delivered:

- **License**: all library code (i.e. anything outside `src/bonsai/`) must be
  **LGPL-3.0-or-later**. A future `ifcopenshell-ts` package falls under this
  unless explicitly carved out.
- **AI-generation disclosure** required at three levels:
  - Commit messages: a body note ("Generated with the assistance of an AI
    coding tool.") on commits that modify existing code.
  - New files: a top-of-file comment in the AI-generated file, in the
    language's comment syntax (e.g. `// This file was generated with the
    assistance of an AI coding tool.` for `.ts`/`.js`).
  - PR descriptions: must state which parts (or all) of the PR are
    AI-generated.
- **PR scope**: one issue/feature per PR, small standalone commits, no
  unrelated refactors/cosmetic changes bundled in.
- **Avoid over-engineering / scope creep / unneeded docstrings, comments,
  type annotations, or error handling** beyond what the task requires.
- **Commit message format**: ≤50-char imperative subject line; body only if
  needed for explanation.
- **Code style** (as currently documented — JS/TS notably absent, see §5):
  - Python: 120-char lines, black formatter, ruff linter, config in
    `pyproject.toml`.
  - C++: C++17 minimum, clang-format + clang-tidy.
- **Testing**: PRs with tests are far more likely to be merged; Python tests
  use pytest, live in `test/`/`tests/` dirs per package; run the existing
  suite for the touched package before submitting.
- **Architecture quick reference** in `AGENTS.md` lists `src/ifcopenshell-python/`
  as "Python API (`ifcopenshell` package)" alongside the other `src/*`
  directories — a new `src/ifcopenshell-ts/` entry would slot into this same
  list/pattern when the package is actually created.

## 5. Gaps for the TS package to fill (no existing repo-wide precedent)

These are genuinely greenfield decisions — nothing at the monorepo level
currently governs them, and the one prior-art example in the repo
(`src/ifctester/webapp/`) is a UI app, not a library, so its choices are only
partially transferable to an SDK/wrapper package.

- **JS/TS lint/format convention.** `AGENTS.md`'s "Code Style" section only
  covers Python and C++; there is no JS/TS entry. No root-level `.eslintrc*`,
  `prettier*`, or `biome.json` exists outside `src/ifctester/webapp/biome.json`
  (a per-package config, not shared/root). That file enables Biome's
  `recommended` linter ruleset, ignores `**/*.svelte` files from linting
  entirely (Svelte-specific — irrelevant to a plain TS library), and disables
  `suspicious.noExplicitAny` only under `src/modules/wasm/worker/**`. No
  Prettier/formatter config or line-length convention for JS/TS was found
  anywhere (unlike Python's explicit 120-char rule in `AGENTS.md`). A TS
  package needs to pick and document its own linter (Biome — matching the one
  precedent — or ESLint/Prettier) and a line-length/style convention from
  scratch, and ideally that choice (plus any line-length figure) should be
  added to `AGENTS.md`'s Code Style section for consistency with how Python/C++
  are documented there.
- **JS/TS test runner choice.** Two different, non-overlapping precedents
  exist and neither is a general-purpose unit-test runner suitable for an SDK:
  - `src/ifctester/webapp/package.json` has `svelte-check` and `tsc --noEmit`
    for type-checking but **no unit test runner at all** (no vitest/jest in
    its `devDependencies`).
  - `src/ifcviewer-web/tests/` uses **Playwright** (`@playwright/test`) for
    browser-driven E2E smoke tests (`*.spec.mjs`) against the compiled
    Emscripten/WebGPU viewer — not a unit-test framework, and that package is
    vanilla JS (`.mjs`), not TypeScript (no `tsconfig.json` present there).
  - Net: **no precedent anywhere in the repo for unit-testing TypeScript
    library code** analogous to how `pytest` unit-tests `ifcopenshell-python`.
    Vitest is the natural choice (Vite-ecosystem-aligned, Jest-compatible API)
    but this is a fresh decision, not a documented convention.
- **JS/TS package registry publishing.** No `.github/workflows/*npm*` or
  `*-npm.yml`/`.yaml` file exists (contrast with the dozen-plus
  `ci-<pkg>-pypi.yaml` workflows for Python sub-packages). `ifctester/webapp`'s
  `package.json` has a `deploy` script that pushes to **Cloudflare Pages**
  (`wrangler pages deploy`), which is an app-hosting deploy, not a package
  publish — no npm `publishConfig`, no `files` allowlist, no npm-publish CI
  step anywhere in the repo. A TS *library* package (unlike the webapp) would
  need: an npm publish workflow (likely mirroring the
  `workflow_dispatch` + `IS_STABLE`/daily-build pattern used by the Python
  PyPI workflows, for parity), a decision on npm scope/name
  (`@ifcopenshell/...`? bare `ifcopenshell`?), and a versioning policy — synced
  to the root `VERSION` file (matching every existing Python sub-package) vs.
  independent npm semver (more idiomatic for the JS ecosystem, but breaks the
  "one version numbers everything" convention this repo currently follows
  everywhere else).
- **JS/TS docs toolchain.** The Python side has a deliberate, well-configured
  pipeline (Sphinx + `sphinx-autoapi` reading source statically + `furo` theme
  + hand-written conceptual `.rst` alongside auto-generated API reference, all
  keyed off the shared `VERSION` file). There is **no JS/TS equivalent
  anywhere** — no TypeDoc config, no docs directory in `ifctester/webapp`
  (it ships only a two-line `README.md`), nothing wired into
  `docs.ifcopenshell.org`'s toctree for a JS/TS audience. A TS package would
  need to stand up its own doc generator from scratch — **TypeDoc** is the
  closest analogue to `sphinx-autoapi` (reads TSDoc comments + type
  signatures straight from source, similar "don't need an import step"
  philosophy) — and a decision on whether/how it gets a page under
  `docs.ifcopenshell.org` alongside `ifcopenshell-python.html`, or ships as a
  separate site entirely (e.g. via the same Cloudflare Pages pattern already
  used for the `ifctester` webapp).
- **No `CONTRIBUTING.md`** exists anywhere in the repo (root or per-package) —
  confirmed by search; `AGENTS.md` and `README.md` are the only
  contributor-facing docs at the root. So there's also no precedent for a
  package-level "how to contribute to ifcopenshell-ts" doc distinct from the
  Sphinx `running_tests.rst`/`introduction/how_to_contribute.rst` pages that
  exist under the Python docs tree — those latter two are worth reading as a
  model for a TS-equivalent contributor guide page if one is wanted.
