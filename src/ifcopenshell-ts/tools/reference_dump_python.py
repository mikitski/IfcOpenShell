#!/usr/bin/env python3
# This file was generated with the assistance of an AI coding tool.
#
# Golden-generation script for the reference-model parity testing plan
# (planning/ifcopenshell-ts/80-reference-parity-testing-plan.md, chunk 1). Reads a real,
# published reference `.ifc` file via `ifcopenshell-python` and emits a normalized JSON
# dump (the doc's own SS4 format): one entry per instance, keyed by its STEP id, holding
# its type name and its forward attributes as a plain positional array -- entity
# references collapsed to `"#<id>"` strings (never nested/recursively expanded, so the
# dump stays flat and immune to inverse-relationship cycles), aggregates recursively
# normalized the same way, everything else (numbers/strings/bools/nulls) passed through
# as-is.
#
# **Same "maintainer/orchestrating-session only" precedent as `bench_python_baseline.py`
# (Phase 2.5)**: this needs a real, built/importable `ifcopenshell-python` (this repo's
# own `src/ifcopenshell-python` with its native SWIG wrapper built, or `pip install
# ifcopenshell`) -- NOT available in an isolated dispatch worktree (confirmed via that
# same script's own header comment: no cmake/full C++ toolchain/working Boost install,
# and outbound network egress there doesn't reach pypi.org either). The golden JSON files
# this script produces are generated ONCE, offline, by whoever has a real install (in
# this project's history so far, that's been the orchestrating session's own local
# environment), and checked into the repo -- see the plan doc's SS3 for why this is a
# deliberate two-tier design, not a shortcut: everyday verification (the TS side diffing
# against these checked-in goldens) needs neither Python nor network, so it can run in
# normal `npm test`/PR CI at effectively zero added cost.
#
# Attribute iteration uses `entity_instance`'s own direct index/`len()` support
# (confirmed empirically: `list(inst)` yields attribute values in schema-declaration
# order, matching `entity_instance.get_argument(i)`/`get_attribute_names()`'s own
# ordering) rather than `get_info()`'s dict-key order, so the resulting array's
# NsPositional index always lines up with the schema's own declared attribute order --
# the same order this port's own TS `EntityInstance`/`validate()` (see
# `planning/ifcopenshell-ts/70-express-rules-plan.md`) already treats as canonical
# ("every forward attribute by index").
#
# Usage (from a Python environment with ifcopenshell-python built/importable):
#
#   python3 tools/reference_dump_python.py <fixtures-root> [--out-suffix .golden.json]
#
# Walks <fixtures-root> for every `*.ifc` file and writes `<name>.golden.json` next to
# it (default suffix `.golden.json`), overwriting any existing golden. Intended
# one-shot/occasional usage: regenerate goldens after adding a new reference fixture or
# after a confirmed real upstream Python behavior change -- never as part of routine
# test runs.

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import ifcopenshell


def normalize(value: Any) -> Any:
    if isinstance(value, ifcopenshell.entity_instance):
        step_id = value.id()
        if step_id > 0:
            return f"#{step_id}"
        # id() == 0: an inline simple/defined-type wrapper with no own STEP line.
        # Not expected to reach here in practice -- ifcopenshell's own SWIG binding
        # already transparently unwraps defined types (e.g. IfcLabel, IfcReal) to
        # plain Python values at attribute-access time, confirmed empirically before
        # writing this script (`IfcCartesianPoint(...).Coordinates` returns a plain
        # tuple of floats, not a wrapped entity_instance). Kept as a disclosed,
        # non-silent fallback rather than assumed impossible.
        if hasattr(value, "wrappedValue"):
            return normalize(value.wrappedValue)
        return str(value)
    if isinstance(value, (tuple, list)):
        return [normalize(v) for v in value]
    # None, bool, int, float, str all pass through as JSON-native values already.
    return value


def dump_ifc_file(f: ifcopenshell.file) -> dict[str, Any]:
    """Dumps an already-open/in-memory `ifcopenshell.file` -- the reusable half of this
    script, shared with `reference_mutation_python.py` (chunk 3), which builds its own
    in-memory file via `ifcopenshell.api.*` calls rather than reading one from disk."""
    result: dict[str, Any] = {}
    for inst in f:
        attrs = [normalize(v) for v in inst]
        result[f"#{inst.id()}"] = {"type": inst.is_a(), "attrs": attrs}
    return result


def dump_file(path: Path) -> dict[str, Any]:
    return dump_ifc_file(ifcopenshell.open(str(path)))


def write_golden(dump: dict[str, Any], golden_path: Path) -> None:
    """One compact JSON object per line, keyed by numeric STEP id (not `indent=`-pretty-
    printed recursively) -- keeps each golden's repo footprint reasonable while staying
    line-diffable: a mismatch on one instance shows as a one-line diff, not a multi-line
    reflow of the whole file. Shared by `reference_dump_python.py` and
    `reference_mutation_python.py` so both produce byte-identical formatting."""
    lines = [json.dumps({key: dump[key]}, sort_keys=True)[1:-1] for key in sorted(dump, key=lambda k: int(k[1:]))]
    golden_path.write_text("{\n" + ",\n".join(lines) + "\n}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("fixtures_root", type=Path, help="Directory to walk for *.ifc files")
    parser.add_argument("--out-suffix", default=".golden.json", help="Suffix for the golden JSON file")
    args = parser.parse_args()

    ifc_files = sorted(args.fixtures_root.rglob("*.ifc"))
    if not ifc_files:
        raise SystemExit(f"No .ifc files found under {args.fixtures_root}")

    for ifc_path in ifc_files:
        golden_path = ifc_path.with_suffix(args.out_suffix)
        dump = dump_file(ifc_path)
        write_golden(dump, golden_path)
        print(f"{ifc_path} -> {golden_path} ({len(dump)} instances)")


if __name__ == "__main__":
    main()
