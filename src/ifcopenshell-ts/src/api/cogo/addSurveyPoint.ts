// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cogo/add_survey_point.py` (src/ifcopenshell-python, 60
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope. Adds a single survey-point `IfcAnnotation` to the model (IFC Concept Template
// 4.1.7.1.2.5), located relative to `IfcRepresentationContext.WorldCoordinateSystem`.
//
// Both real dependencies (`util.representation.get_context`, `api.spatial.
// assign_container`) are already landed and reused directly here -- `getContext` from
// `../../util/representation`, `assignContainer` from `../spatial/assignContainer`.
// No unported dependency of any kind.
//
// --- Not a usecase: a plain function, exactly matching real Python ---
//
// Real Python's `add_survey_point` is a bare module-level function, never registered
// with `ifcopenshell.api.run`/an internal `Usecase` class (confirmed: no reference to
// "cogo" anywhere outside `ifcopenshell/api/cogo/` itself, unlike every genuine
// usecase module in this codebase) -- so, matching `../aggregate/unassignObject.ts`'s
// own "plain function, not `wrapUsecase`-wrapped" precedent for the same reason, this
// port is a plain exported function too, no undo/redo transaction wiring.
//
// --- BLOCKED on literally every real invocation, by the pre-existing, already-
//     disclosed `entityInstance.ts` EXPRESS DERIVED-attribute gap -- a NEW confirmed
//     consequence of that same gap, not a new gap of its own ---
//
// `context = get_context(file, "Model", "Annotation", "MODEL_VIEW")` -- passing BOTH
// a subcontext identifier AND a target view means `get_context` (see
// `util/representation.ts`'s own `getContext`, already verified identical to real
// Python here) always resolves to an `IfcGeometricRepresentationSubContext`, never a
// plain `IfcGeometricRepresentationContext` -- confirmed by reading `getContext`'s own
// implementation directly (`subcontext || targetView` routes to
// `byType("IfcGeometricRepresentationSubContext")`). The very next line then reads
// `context.WorldCoordinateSystem`. On `IfcGeometricRepresentationSubContext`,
// `WorldCoordinateSystem` is NOT a stored attribute at all -- it's a real EXPRESS
// DERIVED attribute (`DERIVE WorldCoordinateSystem := ParentContext
// .WorldCoordinateSystem`, confirmed by reading `ifcopenshell.express.rules
// .IFC4X3`'s own compiled `calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem
// (self): return express_getattr(express_getattr(self, 'ParentContext', ...),
// 'WorldCoordinateSystem', ...)` directly, and by confirming `WorldCoordinateSystem`
// is absent from `IfcGeometricRepresentationSubContext`'s own generated interface on
// ALL 3 schemas -- identical across `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`, so this
// isn't schema-specific either). Real Python resolves this via its own DERIVED-
// category `__getattr__` fallback (the same mechanism `editSurveyPoint.ts`'s own
// header comment already documents for `IfcCartesianPoint.Dim`); this TS port's
// `EntityInstance.get()` has NO such fallback at all (the SAME pre-existing,
// already-disclosed `entityInstance.ts` gap, not a second, independent one) -- so
// `context.get("WorldCoordinateSystem")` throws every time a matching context is
// actually found, which is the common, intended case (an `IfcAnnotation` without
// this line ever succeeding at all is thus, by construction, unreachable). Confirmed
// EMPIRICALLY by actually running this chunk's own test suite against a locally-built
// multi-schema native addon, not just reasoned about -- see `addSurveyPoint.test.ts`'s
// own header comment. Ported completely and faithfully anyway (every other line
// below the throw point runs in real Python and is preserved verbatim, reachable the
// moment the underlying gap is fixed, with zero further changes needed here). See
// `TODOS.md`'s updated entry for the full writeup, now covering both this
// `WorldCoordinateSystem`-via-`ParentContext` case and `editSurveyPoint.ts`'s own
// `Dim` case as 2 confirmed consequences of the same foundational gap.
//
// --- Two further genuine, verbatim-preserved Python-source quirks below that throw
//     point, neither silently fixed (unreachable until the gap above is fixed, but
//     preserved for when it is) ---
//
// 1. `context = get_context(...)` is otherwise used completely UNGUARDED -- real
//    `get_context` returns `None` when no matching context exists at all, and real
//    Python then crashes with `AttributeError: 'NoneType' object has no attribute
//    'WorldCoordinateSystem'`. This port throws an equivalently blunt, disclosed error
//    at the exact same point rather than silently guarding around a case real Python
//    itself doesn't handle either -- distinct from, and checked BEFORE, the DERIVED-
//    attribute throw above (this one only fires when NO context exists; the DERIVED
//    throw fires once one is actually found).
// 2. `ObjectPlacement=context.WorldCoordinateSystem` -- once resolved, that value is
//    an `IfcAxis2Placement2D | IfcAxis2Placement3D` (`IfcGeometricRepresentationContext
//    .WorldCoordinateSystem`'s own declared type, confirmed identical across all 3
//    generated `.d.ts`s), NOT an `IfcObjectPlacement` (`IfcAnnotation.ObjectPlacement`'s
//    own declared type). Neither real Python nor this port's `createEntity` validates
//    attribute VALUE types against the schema at write time (only argument COUNT, via
//    `IfcFile.createEntity`'s own `attributeCount()` check) -- so this "wrong type"
//    assignment would silently succeed on both sides, once reachable. Preserved
//    verbatim, not silently corrected to a real `IfcLocalPlacement` wrapping that same
//    placement.
// 3. `if site == None: site = file.by_type("IfcSite")[0]` -- an unguarded index into a
//    possibly-empty list (real Python: `IndexError` if the model has no `IfcSite`).
//    This port preserves the same lack of a guard: `byType(...)[0]` on an empty result
//    is `undefined` (this project's `tsconfig.json` doesn't set
//    `noUncheckedIndexedAccess`, so this type-checks as a plain `EntityInstance`, same
//    as Python's own lack of a bounds check) -- `assignContainer` below then fails
//    downstream reading `undefined.get(...)`, matching real Python's own `IndexError`
//    failing before `assign_container` is ever reached, just via a different (JS,
//    not Python) crash shape.
//
// --- Schema-availability constraint: `PredefinedType` is IFC4X3-only ---
//
// `file.createIfcAnnotation(..., PredefinedType="SURVEY")` needs `IfcAnnotation` to
// declare an 8th, `PredefinedType` attribute -- confirmed by reading all 3 generated
// `.d.ts`s directly: `IfcAnnotation` has exactly 7 attributes (no `PredefinedType`) on
// BOTH `ifc2x3.d.ts` and `ifc4.d.ts`, and only gains the 8th `PredefinedType:
// IfcAnnotationTypeEnum | null` on `ifc4x3.d.ts`. This is a real, disclosable SCHEMA
// constraint, not a TS-port gap: real Python's own `createIfcAnnotation` validates
// keyword-argument names against the schema's declared attributes and would itself
// raise for `PredefinedType` on IFC2X3/IFC4 -- this port's `createEntity`'s own
// positional-arg-count check (`IfcFile.createEntity`'s `attributeCount()` guard)
// reproduces the identical constraint naturally: passing all 8 positions on a schema
// that only declares 7 throws `"entity instance of type '...' has only 7 attributes
// but 8 attributes were provided."`, matching the real Python source's own inability
// to run this function outside IFC4X3. This matches the real Python test suite
// itself, which only ever exercises `add_survey_point` under IFC4X3 (`skipif not
// IFC4X3_AVAILABLE`) -- confirmed by reading `test_add_survey_point.py` directly, not
// assumed.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { getContext } from "../../util/representation";
import { assignContainer } from "../spatial/assignContainer";

/**
 * Adds a single survey point to the model based on IFC Concept Template 4.1.7.1.2.5
 * (Python: `ifcopenshell.api.cogo.add_survey_point`). Survey points are located
 * relative to `IfcRepresentationContext.WorldCoordinateSystem`.
 *
 * IFC4X3-only: `IfcAnnotation.PredefinedType` doesn't exist on IFC2X3/IFC4 -- see this
 * file's own header comment.
 *
 * BLOCKED today: throws for every real invocation that finds a matching context (the
 * common case), via the pre-existing `entityInstance.ts` EXPRESS DERIVED-attribute
 * gap (`IfcGeometricRepresentationSubContext.WorldCoordinateSystem` is DERIVED, not
 * stored) -- see this file's own header comment.
 *
 * @param file The IFC file.
 * @param surveyPoint The survey point (an `IfcCartesianPoint`).
 * @param site The `IfcSite` to contain the resulting annotation in. Defaults to the
 *   model's first `IfcSite` when omitted/`null`.
 * @returns The new `IfcAnnotation`.
 *
 * @example
 * ```ts
 * const annotation = addSurveyPoint(file, file.createEntity("IfcCartesianPoint", [4000.0, 3500.0]));
 * ```
 */
export function addSurveyPoint(
	file: IfcFile,
	surveyPoint: EntityInstance,
	site?: EntityInstance | null,
): EntityInstance {
	const context = getContext(file, "Model", "Annotation", "MODEL_VIEW");
	if (!context) {
		throw new Error(
			"cogo.addSurveyPoint: no context found for (type=Model, identifier=Annotation, targetView=MODEL_VIEW) -- matches real Python's own unguarded `context.WorldCoordinateSystem` crash for this exact case",
		);
	}

	const shapeRepresentation = file.createEntity("IfcShapeRepresentation", context, "Annotation", "Point", [
		surveyPoint,
	]);
	const representation = file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]);
	const annotation = file.createEntity(
		"IfcAnnotation",
		guid.new(),
		null,
		null,
		null,
		null,
		context.get("WorldCoordinateSystem"),
		representation,
		"SURVEY",
	);

	const relatingStructure = site ?? file.byType("IfcSite")[0];

	assignContainer(file, { relatingStructure, products: [annotation] });

	return annotation;
}
