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
// --- Formerly BLOCKED on literally every real invocation, by the pre-existing,
//     already-disclosed `entityInstance.ts` EXPRESS DERIVED-attribute gap -- now
//     RESOLVED (Phase EX-2, IFC4X3's own SECOND chunk) ---
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
// .IFC4X3_ADD2`'s own compiled `calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem
// (self): return express_getattr(express_getattr(self, 'ParentContext', ...),
// 'WorldCoordinateSystem', ...)` directly, and by confirming `WorldCoordinateSystem`
// is absent from `IfcGeometricRepresentationSubContext`'s own generated interface on
// ALL 3 schemas -- identical across `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`, so this
// isn't schema-specific either).
//
// **UPDATE (Phase EX-2, IFC4X3's own SECOND chunk,
// planning/ifcopenshell-ts/70-express-rules-plan.md §4): this port's `EntityInstance
// .get()` DERIVED-attribute dispatch mechanism now covers exactly this attribute for
// IFC4X3.** `calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem` is one
// of that chunk's own 15 ported functions (`src/express/rules/ifc4x3.ts`) -- since
// `IfcAnnotation.PredefinedType` restricts this function to IFC4X3-only invocations
// anyway (see below), and IFC2X3/IFC4 already ported the identical formula in their
// own respective third chunks well before this one, `context.get
// ("WorldCoordinateSystem")` now resolves on the ONLY schema this function is ever
// actually exercised on -- `addSurveyPoint` now succeeds end to end for every real
// invocation that finds a matching context (the common, intended case), restoring
// real Python's own success behavior. Re-verified EMPIRICALLY against a locally-built
// multi-schema native addon (not just reasoned about) -- see `addSurveyPoint.test.ts`'s
// own updated header comment for the exact restored assertions. `TODOS.md`'s
// corresponding entry is updated to reflect this closed consequence (the sibling
// `editSurveyPoint.ts`/`IfcCartesianPoint.Dim` consequence of the same foundational
// gap remains open for IFC2X3/IFC4 -- both already resolved there too, in each
// schema's own first chunk -- see that file's own header comment).
//
// --- Two further genuine, verbatim-preserved Python-source quirks, now REACHABLE
//     (previously blocked by the throw point above, before this chunk) ---
//
// 1. `context = get_context(...)` is otherwise used completely UNGUARDED -- real
//    `get_context` returns `None` when no matching context exists at all, and real
//    Python then crashes with `AttributeError: 'NoneType' object has no attribute
//    'WorldCoordinateSystem'`. This port throws an equivalently blunt, disclosed error
//    at the exact same point rather than silently guarding around a case real Python
//    itself doesn't handle either.
// 2. `ObjectPlacement=context.WorldCoordinateSystem` -- once resolved, that value is
//    an `IfcAxis2Placement2D | IfcAxis2Placement3D` (`IfcGeometricRepresentationContext
//    .WorldCoordinateSystem`'s own declared type, confirmed identical across all 3
//    generated `.d.ts`s), NOT an `IfcObjectPlacement` (`IfcAnnotation.ObjectPlacement`'s
//    own declared type). Neither real Python nor this port's `createEntity` validates
//    attribute VALUE types against the schema at write time (only argument COUNT, via
//    `IfcFile.createEntity`'s own `attributeCount()` check) -- so this "wrong type"
//    assignment silently succeeds on both sides, confirmed EMPIRICALLY now that this
//    line is genuinely reachable: the resulting `IfcAnnotation.ObjectPlacement` reads
//    back as a real `IfcAxis2Placement3D`, not an `IfcLocalPlacement`. Preserved
//    verbatim, not silently corrected.
// 3. `if site == None: site = file.by_type("IfcSite")[0]` -- an unguarded index into a
//    possibly-empty list (real Python: `IndexError` if the model has no `IfcSite`).
//    This port preserves the same lack of a guard: `byType(...)[0]` on an empty result
//    is `undefined` (this project's `tsconfig.json` doesn't set
//    `noUncheckedIndexedAccess`, so this type-checks as a plain `EntityInstance`, same
//    as Python's own lack of a bounds check) -- `assignContainer` below then fails
//    downstream reading `undefined.get(...)`, matching real Python's own `IndexError`
//    failing before `assign_container` is ever reached, just via a different (JS,
//    not Python) crash shape. Not exercised by this file's own test (which always
//    supplies a real `IfcSite`), so this specific quirk remains unverified end-to-end,
//    same as before this chunk.
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
