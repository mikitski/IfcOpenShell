#!/usr/bin/env python3
# This file was generated with the assistance of an AI coding tool.
#
# Golden-generation script for the reference-model parity testing plan's chunk 3
# (planning/ifcopenshell-ts/80-reference-parity-testing-plan.md, "Mutation differential
# battery"). Unlike chunk 1/2's fixtures (a real file read as-is), this chunk has no
# "reference model" to read -- there is nothing to diff a mutation against except the
# result of applying the SAME scripted sequence of `ifcopenshell.api.*` calls through
# both real Python and this port's own TS API. This script IS that scripted sequence,
# run once per schema through real Python, dumped via `reference_dump_python.py`'s own
# `dump_ifc_file`/`write_golden` (shared, not duplicated), and checked into the repo.
#
# Same "maintainer/orchestrating-session only" precedent as `reference_dump_python.py`/
# `bench_python_baseline.py`: needs a real, built/importable `ifcopenshell-python`, not
# available in an isolated dispatch worktree. The TS side (a dispatched chunk) replays
# the IDENTICAL scenario -- same operations, same order, same literal parameter values --
# via this port's own TS `api.*` functions, and diffs its own dump against the golden
# this script produces. The exact scenario is the actual contract between the two
# languages, so it's specified here in full, unambiguous detail (see SCENARIOS below) --
# the TS side must mirror it exactly, not "something similar."
#
# Owner-history bootstrap mirrors real `ifcopenshell-python`'s own `test/bootstrap.py`
# (`IFC2X3`/`IFC4`/`IFC4X3` fixture classes, read directly, not guessed) and this port's
# own already-ported equivalent (`test/bootstrap.ts`'s `useOwnerSettingsFixture`) --
# every `ifcopenshell.api.*` call that transitively creates an `IfcOwnerHistory` needs
# `ifcopenshell.api.owner.settings.get_user`/`get_application` overridden first, or it
# raises ("Please create a user to continue"). IFC2X3 auto-creates a person/organization/
# application on first use (its own `IfcOwnerHistory.OwningUser`/`OwningApplication` are
# NOT optional); IFC4/IFC4X3 tolerate a `None` user/application (both optional there).
#
# Usage (from a Python environment with ifcopenshell-python built/importable):
#
#   python3 tools/reference_mutation_python.py <fixtures-root> [--out-suffix .golden.json]
#
# Writes `<fixtures-root>/<schema-dir>/<scenario-name>.golden.json` for every scenario x
# schema combination. Intended one-shot/occasional usage, same as
# `reference_dump_python.py` -- regenerate only when a scenario is added/changed, never
# as part of routine test runs.

from __future__ import annotations

import argparse
from collections.abc import Callable
from pathlib import Path

import ifcopenshell
import ifcopenshell.api.aggregate as aggregate
import ifcopenshell.api.material as material_api
import ifcopenshell.api.owner.settings as owner_settings
import ifcopenshell.api.pset as pset
import ifcopenshell.api.root as root
import ifcopenshell.api.spatial as spatial
from reference_dump_python import dump_ifc_file, write_golden

SCHEMA_TO_DIR = {"IFC2X3": "ifc2x3", "IFC4": "ifc4", "IFC4X3_ADD2": "ifc4x3"}


def setup_owner_history(schema: str, f: ifcopenshell.file) -> None:
    """Mirrors real `test/bootstrap.py` exactly (`IFC2X3`/`IFC4`/`IFC4X3` fixture
    classes) and this port's own `test/bootstrap.ts` `useOwnerSettingsFixture`."""
    if schema == "IFC2X3":

        def get_user(ifc: ifcopenshell.file) -> ifcopenshell.entity_instance:
            user = next(iter(ifc.by_type("IfcPersonAndOrganization")), None)
            if user:
                return user
            person = ifc.create_entity("IfcPerson")
            organization = ifc.create_entity("IfcOrganization")
            return ifc.create_entity("IfcPersonAndOrganization", ThePerson=person, TheOrganization=organization)

        def get_application(ifc: ifcopenshell.file) -> ifcopenshell.entity_instance:
            application = next(iter(ifc.by_type("IfcApplication")), None)
            if application:
                return application
            return ifc.create_entity("IfcApplication")

        owner_settings.get_user = get_user
        owner_settings.get_application = get_application
    else:
        owner_settings.get_user = lambda ifc: (ifc.by_type("IfcPersonAndOrganization") or [None])[0]
        owner_settings.get_application = lambda ifc: (ifc.by_type("IfcApplication") or [None])[0]


# **Fixed, hardcoded `GlobalId` values, one per `IfcRoot`-derived entity this scenario
# creates, in creation order.** Real `ifcopenshell.guid.new()` (and this port's own
# equivalent) generates a fresh random GUID on every `create_entity`/`assign_*` call --
# meaning a live Python run and a live TS run of the IDENTICAL scenario would NEVER
# produce the same `GlobalId` by chance, which would make every diff report a spurious
# 100%-of-entities mismatch on `GlobalId` alone despite the scenario being replayed
# perfectly correctly otherwise. Generated once via a throwaway `ifcopenshell.guid.new()`
# call (so they're valid-shaped, real IFC GUIDs, not hand-typed nonsense) and hardcoded
# here -- the TS replay MUST explicitly overwrite each created entity's own `GlobalId`
# with the SAME fixed value immediately after creation, in the same order, rather than
# leaving the randomly-assigned one in place.
GUID_PROJECT = "0ebuHayv50LvfDNsHoXYWb"
GUID_SITE = "1av_VGvIjAZu3k7RmsAT$r"
GUID_BUILDING = "2jNHsX90XCcQku8De7qdsN"
GUID_STOREY = "3NydKujK935xXtC5rwKay3"
GUID_AGG_SITE = "0XdOjoksD7LuTPJLa5QYzr"
GUID_AGG_BUILDING = "3o4e$aAWDDg82PjGUdKucY"
GUID_AGG_STOREY = "2Esl9i4o9E$9Lx9BdTwytY"
GUID_WALL = "0gKni1lQX3XwjFwK4TBYKf"
GUID_CONTAINED = "2Be8YCZoD26vcUJlUNXgD8"
GUID_ASSOC_MATERIAL = "2YAVCNB5f2mumcCEqaUBjC"
GUID_PSET = "1W44wqaRr3vRwBSCkjDca6"
GUID_DEFINES_PROPS = "2botKWKCL1FQXgUu2wFgsU"


def scenario_wall_lifecycle(f: ifcopenshell.file) -> None:
    """**wall-lifecycle** -- the plan doc's own worked example ("add a wall, assign it a
    material, add a pset with 3 properties, edit one property, remove another"), plus a
    minimal spatial hierarchy bootstrap since `IfcWall` needs a containing structure to
    be a realistic instance, not an isolated one. Every literal name/value below (INCLUDING
    the `GUID_*` constants immediately above) is part of the cross-language contract --
    the TS replay must use the exact same ones, in the exact same order.

    1.  Create `IfcProject` "Test Project", `IfcSite` "Test Site", `IfcBuilding`
        "Test Building", `IfcBuildingStorey` "Ground Floor" (`root.create_entity`,
        `api.root.createEntity` on the TS side), then overwrite each one's `GlobalId`
        with `GUID_PROJECT`/`GUID_SITE`/`GUID_BUILDING`/`GUID_STOREY` respectively.
    2.  Aggregate: site under project, building under site, storey under building
        (`aggregate.assign_object`, `api.aggregate.assignObject`) -- three separate
        calls, each with exactly one product -- then overwrite each returned
        `IfcRelAggregates`'s `GlobalId` with `GUID_AGG_SITE`/`GUID_AGG_BUILDING`/
        `GUID_AGG_STOREY` respectively (same order as the three calls).
    3.  Create `IfcWall` "Test Wall" (`root.create_entity`/`createEntity`), overwrite its
        `GlobalId` with `GUID_WALL`.
    4.  `spatial.assign_container`/`api.spatial.assignContainer`: wall -> storey,
        overwrite the returned `IfcRelContainedInSpatialStructure`'s `GlobalId` with
        `GUID_CONTAINED`.
    5.  `material.add_material`/`api.material.addMaterial`: name="Concrete" (no
        `category` -- `IfcMaterial.Category` doesn't exist pre-IFC4, so this scenario
        deliberately omits it to stay valid on all 3 schemas). `IfcMaterial` is NOT an
        `IfcRoot` subtype -- no `GlobalId` to overwrite here.
    6.  `material.assign_material`/`api.material.assignMaterial`: products=[wall],
        type="IfcMaterial", material=<the material from step 5>, overwrite the returned
        `IfcRelAssociatesMaterial`'s `GlobalId` with `GUID_ASSOC_MATERIAL`.
    7.  `pset.add_pset`/`api.pset.addPset`: product=wall, name="Pset_WallCommon",
        overwrite the returned `IfcPropertySet`'s `GlobalId` with `GUID_PSET`. This also
        implicitly creates an `IfcRelDefinesByProperties` -- overwrite ITS `GlobalId`
        with `GUID_DEFINES_PROPS` too (fetch it via the pset's own inverse, e.g. real
        Python's `wall_pset.DefinesOccurrence` / whichever inverse this port's own
        `addPset` port already exposes -- check `addPset.ts`'s real return shape/the rel
        it creates directly rather than assuming the exact accessor name).
    8.  `pset.edit_pset`/`api.pset.editPset`: properties={"IsExternal": True,
        "FireRating": "2HR", "Status": "NEW"} -- adds all 3 as new properties (pset was
        just created empty). The 3 new `IfcPropertySingleValue`s are NOT `IfcRoot`
        subtypes -- no `GlobalId` to overwrite.
    9.  `pset.edit_pset`/`api.pset.editPset`: properties={"FireRating": "1HR", "Status":
        None} -- edits `FireRating` in place, removes `Status` entirely (real Python's
        own `None`-removes-the-property convention), leaves `IsExternal` untouched.
    """
    project = root.create_entity(f, ifc_class="IfcProject", name="Test Project")
    project.GlobalId = GUID_PROJECT
    site = root.create_entity(f, ifc_class="IfcSite", name="Test Site")
    site.GlobalId = GUID_SITE
    building = root.create_entity(f, ifc_class="IfcBuilding", name="Test Building")
    building.GlobalId = GUID_BUILDING
    storey = root.create_entity(f, ifc_class="IfcBuildingStorey", name="Ground Floor")
    storey.GlobalId = GUID_STOREY

    rel_agg_site = aggregate.assign_object(f, products=[site], relating_object=project)
    rel_agg_site.GlobalId = GUID_AGG_SITE
    rel_agg_building = aggregate.assign_object(f, products=[building], relating_object=site)
    rel_agg_building.GlobalId = GUID_AGG_BUILDING
    rel_agg_storey = aggregate.assign_object(f, products=[storey], relating_object=building)
    rel_agg_storey.GlobalId = GUID_AGG_STOREY

    wall = root.create_entity(f, ifc_class="IfcWall", name="Test Wall")
    wall.GlobalId = GUID_WALL
    rel_contained = spatial.assign_container(f, products=[wall], relating_structure=storey)
    rel_contained.GlobalId = GUID_CONTAINED

    material = material_api.add_material(f, name="Concrete")
    rel_associates = material_api.assign_material(f, products=[wall], type="IfcMaterial", material=material)
    rel_associates.GlobalId = GUID_ASSOC_MATERIAL

    wall_pset = pset.add_pset(f, product=wall, name="Pset_WallCommon")
    wall_pset.GlobalId = GUID_PSET
    rel_defines = f.by_type("IfcRelDefinesByProperties")[-1]
    rel_defines.GlobalId = GUID_DEFINES_PROPS

    pset.edit_pset(f, pset=wall_pset, properties={"IsExternal": True, "FireRating": "2HR", "Status": "NEW"})
    pset.edit_pset(f, pset=wall_pset, properties={"FireRating": "1HR", "Status": None})


SCENARIOS: dict[str, Callable[[ifcopenshell.file], None]] = {
    "wall-lifecycle": scenario_wall_lifecycle,
}

# `IfcOwnerHistory.LastModifiedDate` (index 4) and `.CreationDate` (index 7) are real
# `time.time()`-at-creation-instant Unix timestamps, set internally by
# `ifcopenshell.api.owner.create_owner_history` (called transitively by every
# `create_entity`/`assign_*` call in the IFC2X3 branch above -- IFC4/IFC4X3 don't create
# any `IfcOwnerHistory` in this scenario at all, since their `OwningUser`/
# `OwningApplication` are optional and `setup_owner_history` leaves them `None`,
# confirmed empirically: the IFC4/IFC4X3 goldens contain zero `IfcOwnerHistory`
# instances). A real "now" timestamp is inherently non-deterministic across two SEPARATE
# process runs (this script's own golden-generation run vs. whatever later moment a TS
# replay test actually executes) -- unlike `GlobalId` above, there's no API parameter to
# fix it to a literal value; `time.time()` is called internally with no override hook.
# Normalized to a fixed sentinel (`0`) here, in the golden itself, rather than left as a
# real timestamp neither side could ever match by chance. **The TS replay MUST apply the
# identical normalization to its own dump before diffing** -- overwrite any
# `IfcOwnerHistory` instance's `attrs[4]`/`attrs[7]` to `0` post-dump, pre-diff (a
# scenario-specific normalization step in the chunk 3 test file itself, not a change to
# the shared, generic `dump.ts`/`diff.ts` engine, which stays schema-attribute-agnostic).
_OWNER_HISTORY_TIMESTAMP_INDICES = (4, 7)


def normalize_owner_history_timestamps(dump: dict) -> None:
    for entry in dump.values():
        if entry["type"] == "IfcOwnerHistory":
            for index in _OWNER_HISTORY_TIMESTAMP_INDICES:
                entry["attrs"][index] = 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "fixtures_root",
        type=Path,
        help="Root directory holding <schema-dir>/ subfolders (e.g. test/fixtures/mutations)",
    )
    parser.add_argument("--out-suffix", default=".golden.json", help="Suffix for the golden JSON file")
    args = parser.parse_args()

    for scenario_name, scenario_fn in SCENARIOS.items():
        for schema, schema_dir in SCHEMA_TO_DIR.items():
            f = ifcopenshell.file(schema=schema)
            setup_owner_history(schema, f)
            scenario_fn(f)

            out_dir = args.fixtures_root / schema_dir
            out_dir.mkdir(parents=True, exist_ok=True)
            golden_path = out_dir / f"{scenario_name}{args.out_suffix}"
            dump = dump_ifc_file(f)
            normalize_owner_history_timestamps(dump)
            write_golden(dump, golden_path)
            print(f"{schema}/{scenario_name} -> {golden_path} ({len(dump)} instances)")


if __name__ == "__main__":
    main()
