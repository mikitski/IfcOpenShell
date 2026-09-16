// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/georeference/add_georeferencing.py` (src/ifcopenshell-python,
// 105 lines) -- part of this project's brand-new `api.georeference` module (see
// `./index.ts`'s own header comment). Adds the (initially blank) entities needed to
// georeference a model: a projected coordinate reference system (CRS) and a coordinate
// operation (map conversion) transforming to/from it.
//
// --- Two structurally different storage mechanisms, by schema (read the bodies, not
// assumed to be one uniform shape) ---
//
// IFC2X3 has no `IfcProjectedCRS`/`IfcCoordinateOperation`/`IfcMapConversion` at all
// (confirmed directly against `ifc2x3.d.ts` -- none of the three interfaces exist there),
// so real Python falls back to two `ePSet_ProjectedCRS`/`ePSet_MapConversion` property
// sets on the `IfcProject`, ported here via the already-landed `api.pset.addPset`/
// `api.pset.editPset` and `util.element.getPset`. IFC4+ uses the real dedicated entities.
//
// --- BLOCKED on IFC2X3: the already-disclosed `EntityInstance.setByIndex`/
// `IfcFile.createEntity` "cannot write an initial value into a freshly created simple/
// defined-type instance" primitive-layer gap (`TODOS.md`), hit TWICE over in this one
// branch -- confirmed by reading the real source's exact calls, not assumed ---
//
// 1. `ifcopenshell.api.pset.edit_pset(file, crs, properties={"Name": name})` -- `name`
//    is a plain JS string being written into a BRAND NEW property (`crs` was just
//    created via `addPset` with zero properties). `editPset.ts`'s own header comment
//    (its "CRITICAL...THIRD INDEPENDENT CONFIRMATION" section, `TODOS.md`'s fourth
//    documented consequence of this gap) already establishes that creating a NEW
//    property from a plain scalar value is currently blocked -- this call hits that
//    exact code path (`castValueToPrimaryMeasureType`'s own `file.createEntity(
//    primaryMeasureType).attributeType(0)` probe line), and is the FIRST statement in
//    this branch to do so, so it throws before either of the two statements below ever
//    run.
// 2. `file.createIfcLengthMeasure(0)` (Python's own dynamic sugar for
//    `file.create_entity("IfcLengthMeasure", 0)`) -- constructing a brand-new,
//    standalone, VALUED `IfcLengthMeasure` (a defined type, not a real multi-attribute
//    entity) hits the identical gate from the opposite direction:
//    `EntityInstance.setByIndex`'s own `attribute_kind_of` call during
//    `createEntityImpl`'s initial-attribute-assignment loop throws for a non-entity
//    target, exactly like `TODOS.md`'s own literal `file.createEntity("IfcLabel",
//    "hello")` example. Confirmed empirically against this worktree's own built native
//    addon before writing this file (not assumed from the existing entry alone).
//
// Ported completely and faithfully anyway, per this project's established discipline:
// the IFC2X3 branch's own early-return guards (`by_type("IfcProject")` empty; already
// georeferenced) and both `addPset` calls (real `IfcPropertySet` creation, unaffected by
// the gap) run to completion first, then the function throws naturally at the first
// blocked `editPset` call, with no proactive guard added -- matching `editPset.ts`'s/
// `editSurfaceStyle.ts`'s/every other confirmed-consequence file's own "let the native
// call fail naturally" precedent. `test/api/georeference/addGeoreferencing.test.ts` pins
// this CURRENT, disclosed, blocked behavior with a dedicated IFC2X3 test (matching those
// files' own established precedent), not silently skipped. See `TODOS.md`'s own entry for
// this gap (ninth documented consequence) for the full cross-reference.
//
// --- IFC4+ non-IFC2X3 branch: fully functional, but with one real, disclosed, narrower
// consequence of the SAME gap for the optional `ifcClass: "IfcRigidOperation"` case ---
//
// `ifc_class` defaults to `"IfcMapConversion"` (fully functional: `Eastings`/`Northings`/
// `OrthogonalHeight` are plain `number`-typed attributes on `IfcMapConversion` itself, a
// real multi-attribute entity -- no standalone defined-type value ever materialized).
// `"IfcMapConversionScaled"` is likewise fully functional for the identical reason (its
// additional `FactorX`/`FactorY`/`FactorZ` are also plain `number` attributes) -- but see
// the schema-divergence note below: it is IFC4X3-only. `"IfcRigidOperation"` (also
// IFC4X3-only) is the one ifc_class option that genuinely hits the gap again:
// `FirstCoordinate`/`SecondCoordinate` are SELECT-typed (`unknown` in the generated
// `.d.ts`s, confirmed directly) and real Python wraps a raw `0` in a standalone
// `file.createIfcLengthMeasure(0)` for each -- the identical blocked construction as the
// IFC2X3 branch's item 2 above. Ported completely and faithfully: the `SourceCRS`/
// `TargetCRS` real-entity-reference setup for this branch runs to completion, then throws
// naturally at the first `file.createEntity("IfcLengthMeasure", 0)` call, with no
// proactive guard -- this ifc_class value is not the default and must be explicitly
// requested by a caller to reach this code at all. `test/api/georeference/
// addGeoreferencing.test.ts` pins this CURRENT, disclosed, blocked behavior with a
// dedicated IFC4X3 test.
//
// --- Schema divergence, confirmed against the generated `.d.ts`s directly ---
//
// `IfcProjectedCRS`/`IfcCoordinateOperation`/`IfcMapConversion`: absent from
// `ifc2x3.d.ts` entirely (hence the pset-based IFC2X3 fallback above), present and
// identical in shape/attribute order on `ifc4.d.ts`/`ifc4x3.d.ts`.
// `IfcMapConversionScaled`/`IfcRigidOperation`: IFC4X3-only (absent from both
// `ifc2x3.d.ts` and `ifc4.d.ts`) -- the same finding `util/geolocation.ts`'s own header
// comment already independently made for
// `getHelmertTransformationParameters`'s reader-side counterpart of these two classes.
// `IfcMapConversion`: `SourceCRS`(0)/`TargetCRS`(1)/`Eastings`(2)/`Northings`(3)/
// `OrthogonalHeight`(4)/`XAxisAbscissa`(5, nullable)/`XAxisOrdinate`(6, nullable)/
// `Scale`(7, nullable) -- identical index order on IFC4/IFC4X3.
// `IfcMapConversionScaled` extends that with `FactorX`(8)/`FactorY`(9)/`FactorZ`(10),
// IFC4X3 only. `IfcRigidOperation`: `SourceCRS`(0)/`TargetCRS`(1)/`FirstCoordinate`(2)/
// `SecondCoordinate`(3)/`Height`(4, nullable), IFC4X3 only.
//
// --- One real Python comment preserved verbatim (a deliberate, disclosed leniency, not
// a bug) ---
//
// `# This is technically invalid, but we shall forgive the industry here if they are
// wrong ...` -- if a model already has EITHER a CRS or a conversion but not both (an
// invalid partial-georeferencing state some real-world authoring tools apparently
// produce), `add_georeferencing` silently calls `remove_georeferencing` first to clean
// the slate, rather than refusing to proceed. Ported verbatim via a real, top-level call
// to this module's own wrapped `removeGeoreferencing` export (a genuine sibling-usecase
// call, not a recursive self-call -- matching real Python's own
// `ifcopenshell.api.georeference.remove_georeferencing(file)`, which likewise goes
// through the top-level, listener-wrapped function, not some internal unwrapped helper).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getPset } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { addPset } from "../pset/addPset";
import { editPset } from "../pset/editPset";
import { removeGeoreferencing } from "./removeGeoreferencing";

export interface AddGeoreferencingSettings {
	/**
	 * A type of `IfcCoordinateOperation`. For IFC2X3, this has no impact and only uses
	 * `ePSet_MapConversion`. Defaults to `"IfcMapConversion"`.
	 */
	ifcClass?: string;
	/** Defaults to `"EPSG:3857"`. */
	name?: string;
}

function addGeoreferencingUsecase(file: IfcFile, settings: AddGeoreferencingSettings = {}): void {
	const ifcClass = settings.ifcClass ?? "IfcMapConversion";
	const name = settings.name ?? "EPSG:3857";

	if (file.schema === "IFC2X3") {
		const projects = file.byType("IfcProject");
		if (projects.length === 0) return;
		const project = projects[0];
		if (getPset(project, "ePSet_ProjectedCRS")) return;

		const conversion = addPset(file, { product: project, name: "ePSet_MapConversion" });
		const crs = addPset(file, { product: project, name: "ePSet_ProjectedCRS" });
		// See this file's header comment: blocked here (plain-string new-property
		// creation), letting the native call fail naturally, no proactive guard.
		editPset(file, { pset: crs, properties: { Name: name } });
		editPset(file, {
			pset: conversion,
			properties: {
				// See header comment item 2 -- also blocked, though unreachable in
				// practice since the `editPset` call directly above already throws first.
				Eastings: file.createEntity("IfcLengthMeasure", 0),
				Northings: file.createEntity("IfcLengthMeasure", 0),
				OrthogonalHeight: file.createEntity("IfcLengthMeasure", 0),
			},
		});
		return;
	}

	const hasCrs = file.byType("IfcProjectedCRS").length > 0;
	const hasConversion = file.byType("IfcCoordinateOperation").length > 0;
	if (hasCrs && hasConversion) return;
	if (hasCrs || hasConversion) {
		// This is technically invalid, but we shall forgive the industry here if they are
		// wrong ...
		removeGeoreferencing(file, {});
	}

	let sourceCrs: EntityInstance | null = null;
	for (const context of file.byType("IfcGeometricRepresentationContext", false)) {
		if ((context.get("ContextType") as string | null) === "Model") {
			sourceCrs = context;
			break;
		}
	}
	if (!sourceCrs) return;

	const projectedCrs = file.createEntity("IfcProjectedCRS", name);
	if (ifcClass === "IfcMapConversion") {
		// SourceCRS(0)/TargetCRS(1)/Eastings(2)/Northings(3)/OrthogonalHeight(4) -- see
		// header comment. Fully functional: all plain-`number` attributes on a real
		// multi-attribute entity.
		file.createEntity(ifcClass, sourceCrs, projectedCrs, 0, 0, 0);
	} else if (ifcClass === "IfcMapConversionScaled") {
		// SourceCRS(0)/TargetCRS(1)/Eastings(2)/Northings(3)/OrthogonalHeight(4)/
		// XAxisAbscissa(5)/XAxisOrdinate(6)/Scale(7, all explicitly left null, matching
		// real Python's own kwargs omission)/FactorX(8)/FactorY(9)/FactorZ(10). IFC4X3
		// only -- see header comment.
		file.createEntity(ifcClass, sourceCrs, projectedCrs, 0, 0, 0, null, null, null, 1, 1, 1);
	} else if (ifcClass === "IfcRigidOperation") {
		// SourceCRS(0)/TargetCRS(1)/FirstCoordinate(2)/SecondCoordinate(3, Height(4) left
		// unset). IFC4X3 only, and genuinely blocked -- see header comment.
		file.createEntity(
			ifcClass,
			sourceCrs,
			projectedCrs,
			file.createEntity("IfcLengthMeasure", 0),
			file.createEntity("IfcLengthMeasure", 0),
		);
	}
}

/**
 * Add empty georeferencing entities to a model (Python:
 * `ifcopenshell.api.georeference.add_georeferencing`).
 *
 * By default, models are not georeferenced. Georeferencing requires two entities: a
 * definition of the projected coordinate reference system (CRS) used, and the
 * transformation parameters between any local coordinate system and that projected CRS
 * if any.
 *
 * This function creates the entities to store the projected CRS and map conversion
 * transformation, but leaves all the parameters blank. It is the caller's
 * responsibility to specify the correct georeferencing parameters -- see
 * {@link import("./editGeoreferencing").editGeoreferencing}.
 *
 * **On IFC2X3, and for the optional `ifcClass: "IfcRigidOperation"` case on IFC4X3, this
 * is currently blocked by a real, pre-existing, already-disclosed primitive-layer gap**
 * (constructing a brand-new standalone typed value) -- see this file's own header
 * comment. The default (`ifcClass: "IfcMapConversion"`, or `"IfcMapConversionScaled"`)
 * IFC4+ path is fully functional.
 *
 * @example
 * ```ts
 * api.georeference.addGeoreferencing(model, {});
 * ```
 */
export const addGeoreferencing = wrapUsecase("georeference.add_georeferencing", addGeoreferencingUsecase);
