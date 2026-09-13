// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/context/add_context.py` (src/ifcopenshell-python, 240
// lines, the largest file in `api.context`) -- adds a new
// `IfcGeometricRepresentationContext` (when `parent` is not given) or
// `IfcGeometricRepresentationSubContext` (when it is). Only depends on
// `ifcopenshell.util.representation` (already fully ported, `util/representation.ts`)
// for its `ContextType`/`RepresentationIdentifier`/`TargetView` literal types -- no
// other module dependency.
//
// --- Context vs. subcontext: dispatched on `parent`, not on any explicit flag ---
//
// Real Python's `execute()` branches on `if not self.settings["parent"]:` -- a falsy
// (`None`) `parent` means "create a top-level context" (always
// `IfcGeometricRepresentationContext`, 3D unless `context_type == "Plan"`, then
// appended to `IfcProject.RepresentationContexts`); any truthy `parent` means "create a
// subcontext" (`IfcGeometricRepresentationSubContext`, positional attributes read
// straight from `settings` with no origin/project-list logic at all). Ported verbatim,
// including the "any unrecognised/omitted `context_type` still gets a 3D context, with
// `ContextType` set to whatever was passed (even `null`)" behavior -- there is no
// validation that `context_type` is really `"Model"`/`"Plan"`/`"NotDefined"`, matching
// `test_defaulting_to_3d_with_an_unknown_context_type`'s real Python assertion
// (`context.ContextType is None`, ported below).
//
// --- `IfcGeometricRepresentationSubContext`: real Python builds via `**kwargs`, this
// port via positional `createEntity` (no keyword-argument support, see `file.ts`'s own
// `createEntity` doc comment) ---
//
// Real Python's `file.create_entity("IfcGeometricRepresentationSubContext", **{
// "ContextIdentifier": ..., "ContextType": ..., "ParentContext": ..., "TargetView": ...,
// "TargetScale": ...})` binds by name, so its dict's insertion order is irrelevant. This
// port's `createEntity` is positional-only, so the real positional index of every named
// attribute was confirmed empirically against this worktree's own built native addon
// (`native.get_argument_index(name)`), NOT merely assumed from the generated `.d.ts` --
// see the next paragraph for why the `.d.ts` alone would have been actively misleading
// here.
//
// **A real, load-bearing finding, the same category of gap `unit/addSiUnit.ts` already
// disclosed for `IfcSIUnit.Dimensions` (a single re-declared-as-DERIVE attribute), but
// bigger here (4 attributes, not 1):** `IfcGeometricRepresentationSubContext`'s
// generated `.d.ts` interface lists only 6 properties (`ContextIdentifier`,
// `ContextType`, `ParentContext`, `TargetScale`, `TargetView`,
// `UserDefinedTargetView`) with no `extends` clause, which looks exactly like a
// self-contained 6-attribute class -- but `attributeCount()` on a real instance
// reports **10**, confirmed empirically (identical across all 3 schemas). The real
// EXPRESS schema declares `IfcGeometricRepresentationSubContext SUBTYPE OF
// (IfcGeometricRepresentationContext)`, re-declaring `CoordinateSpaceDimension`/
// `Precision`/`WorldCoordinateSystem`/`TrueNorth` (its supertype's own 4 attributes) as
// `DERIVE`d from `ParentContext` -- so, per this port's established DERIVE-attribute
// convention (an EXPRESS `DERIVE` attribute still physically occupies a positional
// storage slot, always unset/`null` when read positionally, even though it's absent
// from the generated `.d.ts`'s forward-settable-attribute view), the TRUE positional
// layout is: `ContextIdentifier`(0), `ContextType`(1), `CoordinateSpaceDimension`(2,
// DERIVE, unsettable), `Precision`(3, DERIVE), `WorldCoordinateSystem`(4, DERIVE),
// `TrueNorth`(5, DERIVE), `ParentContext`(6), `TargetScale`(7), `TargetView`(8),
// `UserDefinedTargetView`(9, never set by `add_context` itself, left unset below).
// Positions 2-5 are passed as explicit `null` placeholders below (not simply omitted --
// omitting them would shift every attribute after them by 4 positions), matching real
// Python's own behavior of never touching these positions for a subcontext either (its
// `**kwargs` dict never mentions `CoordinateSpaceDimension`/`Precision`/
// `WorldCoordinateSystem`/`TrueNorth`, so they're left at their STEP-file default
// (unset) on both sides). Found by writing this chunk's own real `addContext.test.ts`
// against the real built addon (`TargetView` silently reading back `null` after being
// "successfully" written, with no error, at the `.d.ts`-implied index 4 -- which is
// actually `WorldCoordinateSystem`, one of these 4 reindexed slots) -- not merely
// assumed from reading the `.d.ts` text.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import type { ContextType, RepresentationIdentifier, TargetView } from "../../util/representation";
import { wrapUsecase } from "../hooks";

export interface AddContextSettings {
	/** The type of the context, must be one of "Model" or "Plan" only. */
	contextType?: ContextType | null;
	/**
	 * The identifier of the context, chosen from one of the common identifiers (e.g.
	 * "Body", "Box", "Axis", "Profile", "FootPrint", "Clearance", "Annotation") or
	 * consult the IFC documentation (under the IfcShapeRepresentation page) for more
	 * details. Optional for contexts, but mandatory for subcontexts.
	 */
	contextIdentifier?: RepresentationIdentifier | null;
	/**
	 * The target view of the context, chosen from one of the common target views (e.g.
	 * "MODEL_VIEW", "PLAN_VIEW", "ELEVATION_VIEW", "SECTION_VIEW", "GRAPH_VIEW",
	 * "SKETCH_VIEW") or consult the IFC documentation for more details. Optional for
	 * contexts, but mandatory for subcontexts.
	 */
	targetView?: TargetView | null;
	/** The intended scale at which the representation is designed to be viewed or printed. */
	targetScale?: number | null;
	/**
	 * The parent context. Must be left as `null`/omitted (the default) for contexts,
	 * and only set for subcontexts. Note that there are only contexts and subcontexts, a
	 * subcontext cannot have any children.
	 */
	parent?: EntityInstance | null;
}

/** Python: `Usecase.create_3d_origin`. */
function create3dOrigin(file: IfcFile): EntityInstance {
	return file.createEntity(
		"IfcAxis2Placement3D",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]),
		file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
		file.createEntity("IfcDirection", [1.0, 0.0, 0.0]),
	);
}

/** Python: `Usecase.create_2d_origin`. */
function create2dOrigin(file: IfcFile): EntityInstance {
	return file.createEntity(
		"IfcAxis2Placement2D",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcDirection", [1.0, 0.0]),
	);
}

function addContextUsecase(file: IfcFile, settings: AddContextSettings = {}): EntityInstance {
	const parent = settings.parent ?? null;

	if (!parent) {
		let origin: EntityInstance;
		let context: EntityInstance;
		if (settings.contextType === "Plan") {
			origin = create2dOrigin(file);
			context = file.createEntity("IfcGeometricRepresentationContext", null, "Plan", 2, 1.0e-5, origin);
		} else {
			origin = create3dOrigin(file);
			context = file.createEntity(
				"IfcGeometricRepresentationContext",
				null,
				settings.contextType ?? null,
				3,
				1.0e-5,
				origin,
			);
		}

		// Python: `project = self.file.by_type("IfcProject")[0]` -- assumes at least one
		// `IfcProject` exists, crashing (`IndexError`) otherwise. `[0]` on an empty TS
		// array is `undefined`, so the next line's `.get(...)` throws a TypeError instead
		// -- a different concrete error type, but the same "caller must have a project
		// first" crash-don't-silently-tolerate behavior, not silently avoided.
		const project = file.byType("IfcProject")[0];
		const existingContexts = project.get("RepresentationContexts") as EntityInstance[] | null;
		const contexts = existingContexts ? [...existingContexts] : [];
		contexts.push(context);
		project.set("RepresentationContexts", contexts);
		return context;
	}

	return file.createEntity(
		"IfcGeometricRepresentationSubContext",
		settings.contextIdentifier ?? null,
		settings.contextType ?? null,
		// Indices 2-5 (`CoordinateSpaceDimension`/`Precision`/`WorldCoordinateSystem`/
		// `TrueNorth`, inherited-and-DERIVE-redeclared) -- see this file's header
		// comment for why these 4 explicit placeholders are required, not optional.
		null,
		null,
		null,
		null,
		parent,
		settings.targetScale ?? null,
		settings.targetView ?? null,
	);
}

/**
 * Adds a new geometric representation context (Python: `ifcopenshell.api.context.add_context`).
 *
 * In IFC, physical objects may have zero, one, or multiple geometric representations
 * associated with it. To distinguish between the different purposes of multiple
 * geometric representations, each geometric representation must belong to a geometric
 * representation "context". There are typically always 2 contexts, one for 3D
 * representations and one for 2D representations. These 2 contexts then have
 * subcontexts for things like the 3D body representation, clearance representations,
 * annotation representations, and so on.
 *
 * There are two steps to setting up appropriate subcontexts. First, a 2D and/or 3D
 * context must be added. These must be always called the "Model" context for 3D and
 * the "Plan" context for 2D (even if the 2D geometry is not a plan view). Then, one or
 * more subcontexts are added using either the "Model" or "Plan" as their `parent`.
 * These subcontexts are further distinguished using a `contextIdentifier` (e.g. "Body",
 * "Box", "Axis", "Profile", "FootPrint", "Clearance", "Annotation") and `targetView`
 * (e.g. "MODEL_VIEW", "PLAN_VIEW", "ELEVATION_VIEW", "SECTION_VIEW", "GRAPH_VIEW",
 * "SKETCH_VIEW").
 *
 * @returns The newly created `IfcGeometricRepresentationContext` or
 * `IfcGeometricRepresentationSubContext` entity.
 */
export const addContext = wrapUsecase("context.add_context", addContextUsecase);
