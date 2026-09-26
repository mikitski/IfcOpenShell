#!/usr/bin/env python3
# This file was generated with the assistance of an AI coding tool.
#
# Python-baseline comparison script for Phase 2.5's benchmark suite
# (planning/ifcopenshell-ts/20-roadmap.md's "Phase 2.5 -- Alpha checkpoint":
# "record a one-time ratio (TS time / Python time) for the same operations against
# ifcopenshell-python ... visible and tracked rather than a hard gate"). Performs the
# *same* three operations as ../test/bench/*.bench.ts against ifcopenshell-python's
# SWIG binding, over an equivalent-sized synthetic fixture (same WALL_COUNT, same
# attribute-setting pattern). Deliberately duplicated rather than shared with the TS
# side -- the two can't share code across the language boundary; the roadmap's own
# task brief calls this expected and fine, not a design smell to avoid.
#
# This is a ONE-TIME, VISIBLE-BUT-NON-GATING comparison (per the roadmap's own
# framing: "visible and tracked rather than a hard gate ... some variance is
# expected"), and it deliberately does NOT run in this package's CI -- see
# ../../../.github/workflows/ci-ifcopenshell-ts.yml's `benchmark` job comment for the
# full reasoning: this project's CI already deliberately builds the C++ core with
# `-DBUILD_IFCPYTHON=OFF` (a Phase-0-era scope cut, unrelated to this chunk), and
# standing up a full Python/SWIG binding build in CI just for a non-gating comparison
# would be a disproportionate amount of new CI surface for what this chunk needs.
# Instead: a maintainer runs this manually/occasionally against a real
# ifcopenshell-python install and this script updates BASELINE_RATIOS.json (checked in
# alongside it) with the result, merging in whatever `ts` numbers the real CI
# `benchmark` job most recently recorded there.
#
# Usage (from a Python environment with ifcopenshell-python built/importable -- e.g.
# `src/ifcopenshell-python` in this monorepo with its native SWIG wrapper built, or
# `pip install ifcopenshell`):
#
#   python3 tools/bench_python_baseline.py [--wall-count N] [--out tools/BASELINE_RATIOS.json]
#
# Disclosed local-verification gap (same pattern as every other toolchain-dependent
# chunk in this project, see TODOS.md): this sandbox could not run this script itself.
# ifcopenshell-python's native SWIG wrapper isn't built here (`import ifcopenshell`
# fails with "IfcOpenShell not built for '<platform>'" -- no cmake/full C++
# toolchain/working Boost install in this sandbox to build it), and PyPI isn't
# reachable either (`pip install ifcopenshell` fails: the sandbox's outbound proxy
# returns 403 for pypi.org, i.e. network egress here is allowlisted and doesn't
# include it). BASELINE_RATIOS.json's "python" section and "ratios" section are
# therefore both still unpopulated placeholders as of this PR -- a maintainer with a
# real ifcopenshell-python install needs to run this script at least once (after the
# real CI `benchmark` job has recorded real "ts" numbers) to fill them in.

from __future__ import annotations

import argparse
import json
import tempfile
import time
from pathlib import Path

import ifcopenshell
import ifcopenshell.guid

# Matches test/bench/fixture.ts's own WALL_COUNT -- keep these in sync if that value
# ever changes, so the two sides stay an apples-to-apples comparison.
WALL_COUNT = 60_000


def build_large_fixture(wall_count: int) -> ifcopenshell.file:
    """Mirrors test/bench/fixture.ts's buildLargeFixtureFile(): `wall_count` IfcWall
    entities, each with a distinct GlobalId and Name set, OwnerHistory/
    ObjectPlacement/Representation left unset -- see that file's own comment for why
    (the get_info benchmark shouldn't chase an unrelated, arbitrarily-deep reference
    graph)."""
    f = ifcopenshell.file(schema="IFC4")
    for i in range(wall_count):
        f.create_entity(
            "IfcWall",
            GlobalId=ifcopenshell.guid.new(),
            Name=f"Wall {i}",
        )
    return f


def bench_attribute_access(f: ifcopenshell.file) -> float:
    """Mirrors attributeAccess.bench.ts. No cached-vs-uncached split on this side --
    Python's SWIG binding has no analogous N-API marshaling cost to cache around
    (`__getattr__` runs in-process, per the roadmap's own note) -- this measures raw
    per-access cost as the baseline the TS side's *cached* number is compared against
    (the number a real caller of either binding actually experiences)."""
    walls = f.by_type("IfcWall")
    start = time.perf_counter()
    for wall in walls:
        _ = wall.Name
    return (time.perf_counter() - start) * 1000


def bench_get_info(f: ifcopenshell.file) -> float:
    """Mirrors getInfo.bench.ts."""
    walls = f.by_type("IfcWall")
    start = time.perf_counter()
    for wall in walls:
        wall.get_info(recursive=True)
    return (time.perf_counter() - start) * 1000


def bench_file_open(f: ifcopenshell.file, target_path: Path) -> float:
    """Mirrors fileOpen.bench.ts's sync-open measurement (ifcopenshell.open() is
    Python's only file-open path -- there is no separate sync/async split to mirror on
    this side)."""
    f.write(str(target_path))
    start = time.perf_counter()
    reopened = ifcopenshell.open(str(target_path))
    duration_ms = (time.perf_counter() - start) * 1000
    assert len(reopened.by_type("IfcWall")) == len(f.by_type("IfcWall"))
    return duration_ms


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Python-baseline benchmark comparison for Phase 2.5 (see this file's own header comment)."
    )
    parser.add_argument("--wall-count", type=int, default=WALL_COUNT)
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent / "BASELINE_RATIOS.json",
    )
    args = parser.parse_args()

    attribute_access_ms = bench_attribute_access(build_large_fixture(args.wall_count))
    get_info_ms = bench_get_info(build_large_fixture(args.wall_count))
    with tempfile.TemporaryDirectory() as tmp_dir:
        file_open_ms = bench_file_open(build_large_fixture(args.wall_count), Path(tmp_dir) / "large.ifc")

    results = {
        "wallCount": args.wall_count,
        "attributeAccessMs": attribute_access_ms,
        "getInfoMs": get_info_ms,
        "fileOpenMs": file_open_ms,
        "measuredAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    print(json.dumps(results, indent=2))

    # Merge into the checked-in baseline file, preserving whatever "ts" section is
    # already recorded there (from a real CI `benchmark` job run) -- see
    # BASELINE_RATIOS.json's own top-level "_comment" field for the full layout.
    existing: dict = {}
    if args.out.exists():
        existing = json.loads(args.out.read_text())
    existing["python"] = results

    # `.get(...)`, not direct indexing: `ts` may be hand-edited and only partially
    # filled in (this file's own instructions populate it field-by-field from a CI
    # artifact), and by this point `existing["python"]` has already been set above --
    # a KeyError here would crash before writing the file at all, silently discarding
    # that freshly-measured "python" section along with it. Missing/partial `ts`
    # fields just leave the corresponding ratio (or the whole `ratios` block) `None`
    # instead.
    ts = existing.get("ts") or {}
    required_ts_fields = ("attributeAccessCachedMs", "attributeAccessUncachedMs", "getInfoMs", "fileOpenSyncMs")
    if all(field in ts for field in required_ts_fields):
        existing["ratios"] = {
            "_comment": "TS time / Python time -- see BASELINE_RATIOS.json's own top-level comment.",
            "attributeAccessCachedOverPython": (
                ts["attributeAccessCachedMs"] / attribute_access_ms if attribute_access_ms else None
            ),
            "attributeAccessUncachedOverPython": (
                ts["attributeAccessUncachedMs"] / attribute_access_ms if attribute_access_ms else None
            ),
            "getInfoOverPython": ts["getInfoMs"] / get_info_ms if get_info_ms else None,
            "fileOpenOverPython": ts["fileOpenSyncMs"] / file_open_ms if file_open_ms else None,
        }
    else:
        existing["ratios"] = None

    args.out.write_text(json.dumps(existing, indent=2, sort_keys=False) + "\n")
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
