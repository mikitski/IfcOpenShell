// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/add_layer.py` (src/ifcopenshell-python, 95
// lines) -- chunk 2 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency -- the only cross-module call is
// `ifcopenshell.util.unit.calculate_unit_scale`, already landed (`util/unit.ts`'s
// `calculateUnitScale`, called here with its default `unitType: "LENGTHUNIT"`,
// matching real Python's own no-arg `calculate_unit_scale(file)` call).
//
// Appends a new `IfcMaterialLayer` to an existing `IfcMaterialLayerSet.MaterialLayers`
// list, defaulting its thickness to `0.1 / unit_scale` (i.e. "0.1 project length
// units", not a fixed real-world size) -- a placeholder value callers are expected to
// overwrite via `./editLayer.ts`'s already-landed sibling (see real Python's own
// docstring example: `add_layer` then immediately `edit_layer(attributes:
// {LayerThickness: ...})`).
//
// --- Real IFC2X3-vs-IFC4+ schema branch, ported verbatim (not merged into one call) ---
//
// Real Python has an explicit `if file.schema == "IFC2X3": ... else: ...` branch, NOT
// because the two calls differ semantically, but because IFC2X3's own
// `IfcMaterialLayer` declaration has no `Name` attribute at all (see the schema note
// below) -- passing `Name=name` unconditionally would throw a native "no such
// attribute" error on IFC2X3 even when the caller never asked for a name (`name`
// defaults to `None`, but `Name=None` is still an explicit keyword argument Python's
// own `create_entity(**kwargs)` machinery would try to resolve against the IFC2X3
// declaration and fail). Ported as the same explicit two-branch `if`/`else`, not a
// single call with a schema-conditional trailing arg, so the intent (and the reason
// for the branch) stays visible.
//
// `layers = list(layer_set.MaterialLayers or [])` -- Python's `or` is a truthiness
// check, not a `None`-only fallback, but an empty list is *also* falsy in Python, so
// `[] or []` and `None or []` both yield `[]` -- no observable difference from a
// straightforward `?? []` here (unlike `./addMaterial.ts`'s string-`name` quirk, where
// an empty string vs. `None` genuinely differ). Ported as `?? []` without further
// comment needed at each call site below.
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// `IfcMaterialLayer`: `[Material, LayerThickness, IsVentilated]` on IFC2X3 (no
// `Name`/`Description`/`Category`/`Priority` at all) vs. `[Material, LayerThickness,
// IsVentilated, Name, Description, Category, Priority]` on IFC4/IFC4X3 (`Material`/
// `LayerThickness` are attributes 0/1 on every schema). IFC2X3:
// `file.createEntity("IfcMaterialLayer", material, 0.1 / unitScale)` (`IsVentilated`
// left unset, matching real Python's own 2-kwarg call). IFC4/IFC4X3:
// `file.createEntity("IfcMaterialLayer", material, 0.1 / unitScale, null, name ?? null)`
// -- `IsVentilated` (index 2) explicitly `null` so `Name` lands at its real index 3,
// and `name ?? null` (not `name` alone) since real Python's own `Name=name` kwarg
// passes `None` explicitly whenever the caller didn't provide one, not "leave
// unset" -- the same explicit-`null`-not-omitted distinction this project's other
// `api.*` ports already draw (e.g. `../root/createEntity.ts`'s own `Name` handling).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

export interface AddLayerSettings {
	/** The `IfcMaterialLayerSet` that the layer is part of. */
	layerSet: EntityInstance;
	/** The `IfcMaterial` that the layer is made out of. */
	material: EntityInstance;
	/** An optional name of the layer. Not available in IFC2X3 (see this file's own header comment). */
	name?: string | null;
}

function addLayerUsecase(file: IfcFile, settings: AddLayerSettings): EntityInstance {
	const { layerSet, material } = settings;
	const unitScale = calculateUnitScale(file);
	const layers = ((layerSet.get("MaterialLayers") as EntityInstance[] | null) ?? []).slice();

	let layer: EntityInstance;
	if (file.schema === "IFC2X3") {
		layer = file.createEntity("IfcMaterialLayer", material, 0.1 / unitScale);
	} else {
		layer = file.createEntity("IfcMaterialLayer", material, 0.1 / unitScale, null, settings.name ?? null);
	}

	layers.push(layer);
	layerSet.set("MaterialLayers", layers);
	return layer;
}

/**
 * Adds a new layer to a layer set (Python: `ifcopenshell.api.material.add_layer`).
 *
 * A layer represents a portion of material within a layered build up, defined by a
 * thickness. Typical layered construction includes walls and slabs, where a wall
 * might include a layer of finish, a layer of structure, a layer of insulation, and
 * so on.
 *
 * Layers are defined in a particular order and thickness, so that it is clear which
 * layer comes next. The newly created layer's `LayerThickness` defaults to a
 * placeholder `0.1` project length units -- real Python's own docstring example then
 * calls `ifcopenshell.api.material.edit_layer` to set a real value, a sibling not yet
 * ported in this chunk (see `./index.ts`'s own header comment); use
 * `layer.set("LayerThickness", ...)` directly until then.
 *
 * @returns The newly created `IfcMaterialLayer`.
 *
 * @example
 * ```ts
 * const materialSet = api.material.addMaterialSet(model, { name: "GYP-ST-GYP", setType: "IfcMaterialLayerSet" });
 * const gypsum = api.material.addMaterial(model, { name: "PB01", category: "gypsum" });
 * const layer = api.material.addLayer(model, { layerSet: materialSet, material: gypsum });
 * layer.set("LayerThickness", 13);
 * ```
 */
export const addLayer = wrapUsecase("material.add_layer", addLayerUsecase);
