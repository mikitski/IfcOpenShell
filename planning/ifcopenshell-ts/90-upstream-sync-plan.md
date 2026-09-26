# IfcOpenShell-TS — Upstream Sync Plan

Status: scoped 2026-09-26, ahead of a planned discussion with the upstream `IfcOpenShell/IfcOpenShell`
maintainers about folding this port in. Two separate questions, deliberately kept apart: (1) how to
present this fork's own 263-commit history to upstream cleanly (§1-2), and (2) what upstream has
built since the fork point that this port now needs to catch up on (§3-5) — the actual motivating
question for this doc.

## 1. The fork has diverged in both directions

This fork (`mikitski/IfcOpenShell`) branched from real upstream at commit `2c1d445d5` (2026-03-03).
Since then:

- **This fork is 263 commits ahead** — the entire TS port (`src/ifcopenshell-ts/`,
  `planning/ifcopenshell-ts/`), confirmed self-contained: only 5 files outside those two directories
  are touched at all (`.github/workflows/ci-ifcopenshell-ts.yml` and `CLAUDE.md`, both new;
  `.github/workflows/ci-lint.yaml`, `.gitignore`, `AGENTS.md`, all small additive edits).
- **Real upstream is 584 commits ahead** — confirmed via `gh api repos/IfcOpenShell/IfcOpenShell/
  compare/v0.9.0...mikitski:IfcOpenShell:v0.9.0` (`ahead_by: 263, behind_by: 584, status: diverged`).
  Upstream's own default branch is also named `v0.9.0` — no naming mismatch, just genuine drift.

## 2. Attempting a full linear rebase: real, but bounded, difficulty

Tried rebasing this fork's 263 commits onto upstream's current `v0.9.0` tip
(`git rebase --onto upstream/v0.9.0 2c1d445d5 v0.9.0`, in a scratch branch, never touching the real
`v0.9.0`). Findings:

- The first conflict (commit 1 of 263, Phase 0 scaffolding) was trivial — upstream renamed
  `ci-lint.yaml` → `test-lint.yml` and renamed a job; resolved by re-inserting the fork's own
  `lint-ifcopenshell-ts` job into upstream's current file/job structure.
- The second conflict (commit 11/263, the ASan/UBSan-found `token::to_string()`/`as_string()`
  infinite-recursion fix) was NOT trivial: upstream has since **completely rewritten** the
  `ifcparse` tokenizer (`token`/`next()` removed entirely, replaced with a streaming
  `scan(Consumer&)` architecture — confirmed via `git log` on `src/ifcparse`: ~20 of the 100
  `ifcopenshell-python`/`ifcparse`-touching commits are this rewrite). The functions the fork's fix
  patched no longer exist in that form. Aborted the rebase attempt here rather than guess at whether
  the underlying bug still applies to the rewritten code.
- **Confirmed the rewrite doesn't break anything functionally today**: `ifcopenshell::token` is
  auto-generated into this port's native binding by `wrappergen` (it scans the C++ headers), but
  grepped this port's own consumer code (`src/*.ts` outside `native/`) and confirmed **nothing uses
  it** — it's a dead, unused binding. Regenerating bindings against upstream's new headers would
  simply stop producing a `token` class, not break anything.

**Recommendation, revisit after §3-5 lands**: a full history-preserving rebase across the tokenizer
rewrite is real, non-trivial work — likely a handful more substantive conflicts like the one above,
each needing "does this bug/behavior still apply to the rewritten code" judgment, not just text
merging. Doing the sync work in §3-5 first (which already requires reading through upstream's
`ifcparse`/`ifcopenshell-python` changes in detail) will make any remaining rebase conflicts easier
to resolve correctly, since the diffs will already be understood. Whether to then present upstream
with the full rebased history or a fresh, squashed "here's the new package" branch is a decision to
revisit once that's known — not made here.

## 3. What upstream actually changed, by area (584 commits since the fork point)

| Area | Files touched | Relevant to this port? |
|---|---|---|
| `src/bonsai` (Blender addon) | 260 | No |
| `src/ifcopenshell-python` | 149 | **Yes — this is what the TS port mirrors** |
| `src/ifcbimtester` | 78 | No |
| `.github/workflows` | 52 | Partial (CI infra, not covered further here) |
| `src/ifcgeom` (geometry kernel) | 39 | Not yet — post-v1 scope (`20-roadmap.md` Phase G1) |
| `src/ifcparse` (shared C++ core) | 25 | **Yes — the native binding wraps this directly** |
| everything else (viewers, other bindings, tools) | ~120 | No |

Of the **100 commits touching `src/ifcopenshell-python`/`src/ifcparse`** (the relevant intersection),
categorized by reading every commit subject and diffing the non-obvious ones directly (not assumed):

- **34 are pure tooling/build/CI/lint/docs noise** (cmake, ruff/black formatting passes, version
  bumps, `win:`/`check-whitespace:` housekeeping, etc.) — no action needed.
- **~20 are the `ifcparse` tokenizer/reader rewrite** (§2) — internal architecture change, not
  consumed by this port's own code, no functional gap.
- **~10 are SWIG-wrapper-specific** (`ifcwrap: build ... -fastproxy -fastdispatch`, `Adopt swigptr
  from factory`, `Take shared_ptr further into the swig wrapper`, tree/registry construction from
  Python) — these are about the *Python* SWIG binding layer specifically; this port's own N-API/
  wrappergen binding is architecturally different, not directly portable, no action needed.
- **~10 are SQL-backend/RocksDB-backend-specific** (`sql, stream: raise for accessing derived
  attributes`, `fix(sql): recognise derived attributes in sqlite_entity.__getattr__`, `Fix
  calculate_unit_scale() crash on SQLite-linked files`, RocksDB delete/create support) — both
  backends are explicitly out of scope for this port (`00-overview.md` §6) — no action needed.
- **~4 are geometry-kernel/CGAL/tree-adjacent** (`fix(cgal): bound conic segments...`, `geom: expose
  a reusable kernel object to Python`, `Honour IfcAxis2PlacementLinear Axis/RefDirection in the loft
  builder`, `tree.clash_intersection_many`/`select_ray` signatures) — post-v1 scope (Phase G1) — no
  action needed yet.
- **~22 are real, relevant changes** — the actual subject of this doc, detailed in §4 below.

## 4. Real, relevant changes found (the actual porting/verification work)

### 4a. Real bug fixes (verify whether this port has the same bug, fix if so)

- **`a904ac3a9` — `schema.reassign_class` must not drop falsy-but-set attribute values.** A `Name`
  of `""` was treated as "never set" by a truthiness check instead of an explicit `None` check.
  Check `util/schema.ts`'s `reassignClass` for the same pattern.
- **`2932a0ec6` — `geometry.unassign_representation` crashes on a product with no `Representation`**
  (`product.Representation.Representations` with no null guard). Check
  `api/geometry/unassignRepresentation.ts` — this file is independently notable already: it's one of
  the 7 call sites in `TODOS.md`'s own tracked native inverse-index workaround, so it's worth a
  careful read regardless.
- **`0e8d0ee84` — `util.unit.get_property_unit()` crashes when `IfcPropertySingleValue.NominalValue`
  is `None`.** Check `util/unit.ts`'s `getPropertyUnit` for the same gap.
- **`6f2e1aa99` — `express::base::as<T>() null-instance guard`** (`src/ifcparse/express.h`, 5 lines).
  A real C++ core defensive fix. Worth checking whether this port's own native shim
  (`src/wrappergen/`) ever calls the equivalent cast path on a possibly-null instance in a way that
  could hit the same crash.
- **`261d2ce9a` — `get_attribute_category` type-stub fix**, documenting that category `3` means
  "derived attribute" (previously only `0`/`1`/`2` were documented). This port already built full
  DERIVE-attribute execution (Phase EX-0 through EX-2) and has its own `AttributeCategory` enum
  (`entityInstance.ts`) — likely already correctly handles category `3`, but worth a quick
  confirmation pass now that upstream's own docs make the 4th category explicit.

### 4b. Real new features (not yet ported — genuine functionality gaps)

- **`d19c86c72` — per-property/quantity `Unit` override support added to `edit_pset`/`edit_qto`**,
  plus new unit-scale/candidate-unit helpers. Real, non-trivial: introduces a `_NO_UNIT` sentinel to
  distinguish "no `Unit` passed" from "`{"Unit": None}` passed to explicitly clear an existing
  override" (previously both collapsed to a bare `None`, so an existing override could never be
  cleared) — `edit_qto()` had no `Unit`-handling capability at all before this. This port's own
  `editPset.ts`/`editQto.ts` don't have this capability; the "widest-impact consequence" file this
  session's own TODOS.md sweep already flipped 18 tests in (`editPset.test.ts`) is exactly the file
  that would need this addition.
- **`20a6c73fb` — `IfcDerivedUnit` support added to `util.unit`** (scale, symbol, dimension
  identification). A real capability gap in `util/unit.ts`.
- **`d11c4411e` — dimensional-analysis fallback added to `get_project_unit()` for `IfcDerivedUnit`.**
  Related to the above; check `util/unit.ts`'s `getProjectUnit`.
- **`87bc6bfba` — new top-level string decode/encode API** added to `ifcopenshell/__init__.py`
  itself (SPF character-escaping, `src/ifcparse/character_decoder.h`/`parse.cpp` under the hood).
  Small (55 lines across 8 files), self-contained. Check whether this port's own core module
  (`src/index.ts` or wherever top-level functions live) has an equivalent, and whether it's worth
  adding.

### 4c. Real behavior change (substantial — the highest-effort item here)

- **`b5670c4fc` — alignment stationing rework.** Reverts automatic stationing-on-create (added
  because initial geometry could be missing) and adds support for stationing with *decreasing*
  values. Touches `api/alignment/__init__.py`, `create.py`, `create_as_polyline.py`,
  `create_by_pi_method.py`, `create_from_csv.py`, `add_stationing_referent.py`,
  `distance_along_from_station.py`, plus a **brand-new file**, `_referent_distance_along.py`. Every
  one of these except the new file is **already fully ported** in this session's own `api.alignment`
  work (56/59 files landed, chunk 8 complete) — this is a real, substantial behavior change to
  already-shipped TS files, not a net-new module. Given how much alignment-specific verification
  work already happened this session, this deserves its own dedicated, careful chunk — not a quick
  patch.

### 4d. Real grammar/behavior change (small, self-contained)

- **`41390dad9` — the selector mini-language now accepts an unquoted decimal** in a comparison
  value (`Foobar.Baz>1.5` used to be a syntax error, requiring `Foobar.Baz>"1.5"`, which read like a
  string comparison). `1c6362ec3`/`ff4ef510f` document the quoting rule and multi-value/regex
  behavior alongside it. This port's own `util/selector.ts` (`parseFilterQuery`) faithfully
  re-implements this grammar by hand (Python's own parser uses `lark`) — needs the equivalent
  grammar relaxation to stay in parity.

### 4e. Performance-only changes (real, but functionally invisible — low priority, optional)

- `e1be43320` — `ifcparse`'s inverse-record deletion changed from an O(R) full-index scan to a
  targeted per-attribute removal (a real perf win on large files, `file.remove()`/batch deletion).
  Confirmed NOT the fix for this port's own already-tracked `TODOS.md` native bug ("clearing an
  attribute to `null` via `.set()` leaves a stale inverse-index entry" — that's about `.set()`, this
  commit is about `file.remove()`); unrelated finding, no action needed, but worth knowing upstream
  found and fixed a related-sounding-but-distinct inverse-index performance issue in the same area.
- `8003d43e6` — `util.element.remove_deep2`'s containment check moved from materializing every
  inverse into a Python object (`set(get_inverse(...))`) to deciding in C++ without materializing —
  a real perf win for files with heavily-shared instances. This port's own `removeDeep2` (already
  ported) could plausibly have the same performance characteristic; worth a look if it ever becomes
  a real bottleneck, not urgent.
- `4a81f72f3`, `ba9810f45` — more inverse-handling perf fixes in the same family as the two above.

## 5. Proposed chunking

Given §4a-4d together are a bounded, well-understood body of work (not a re-scoping of anything
already shipped), propose:

- **Chunk 1 — bug fixes (4a)**: `reassignClass`, `unassignRepresentation`, `getPropertyUnit`, plus
  the `AttributeCategory`/derived-attribute confirmation check. Small, independent, low risk.
- **Chunk 2 — `util.unit`/`editPset`/`editQto` feature additions (4b)**: the `_NO_UNIT` sentinel and
  per-property Unit-override support, `IfcDerivedUnit` support, `getProjectUnit`'s dimensional-
  analysis fallback, and the new string decode/encode API. Larger than chunk 1, self-contained to
  `util/unit.ts`/`api/pset/editPset.ts`/`api/pset/editQto.ts`.
- **Chunk 3 — alignment stationing rework (4c)**: the highest-effort item, touching 6 already-shipped
  files plus one new one. Warrants its own dedicated investigation given how much alignment-specific
  verification already happened this session — read the real diff in full before scoping into
  sub-chunks.
- **Chunk 4 — selector grammar relaxation (4d)**: small, self-contained, `util/selector.ts` only.
- **Not scheduled**: 4e (performance-only, no functional gap) — revisit only if a real perf
  complaint arises.

Each chunk should follow this project's own established discipline: read the real upstream diff in
full (not just the subject line) before writing any TS, verify against real Python's own current
test suite for that function if one exists, and independently verify against a real Python install
before merging — matching every other chunk this project has landed.

**Not yet done, left for whoever picks up chunk 3 or a follow-up doc**: a similarly careful read of
the ~20 `ifcparse` tokenizer-rewrite commits, to confirm none of them changed *observable* file-open/
parse/read behavior (only internal performance/architecture) — this doc's own categorization treated
them as safe based on commit subjects and the confirmed-unused `token` binding, not a line-by-line
audit of every one of the ~20 diffs.
