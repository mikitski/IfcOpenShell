// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_create_geometric_representation.py`
// (src/ifcopenshell-python, 153 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 6 of many). Depends on this module's own
// already-landed `getAxisSubcontext`/`getAlignmentLayouts`/`getChildAlignments`/
// `getBasisCurve` (all chunk 1) and already-landed `api.geometry.assignRepresentation`
// (`../geometry/assignRepresentation.ts`, verified directly -- a `wrapUsecase`-wrapped
// function called as `assignRepresentation(file, { product, representation })`) -- no
// blocker of any kind.
//
// Real Python's leading underscore marks this as module-private (absent from
// `__init__.py`'s own `__all__`) -- NOT re-exported from `./index.ts`'s public barrel,
// matching this module's established convention (e.g. `./_getCantSegment.ts`'s own
// header comment).
//
// --- Real Python `assert`s, ported as thrown `Error`s (the direct TS equivalent of an
// uncaught Python `AssertionError`) ---
//
// Every bare `assert layouts[N].is_a(...)` in the 3 fixed-layout-count branches, and the
// bare `assert child_layouts[N].is_a(...)` in the 2 fixed-child-layout-count branches,
// carries no message in real Python (a bare `AssertionError` with empty `str(e)`) --
// this port gives each a short, descriptive message naming the failed shape check for
// debuggability (a pure documentation improvement; the crash-on-failure behavior itself
// is unchanged), matching `api.structural.addStructuralBoundaryCondition.ts`'s own
// established "thrown Error, direct equivalent of an uncaught AssertionError" precedent.
// The trailing `else: assert False` (real Python's own comment: "should never get here
// -- can't have more than one vertical and cant in a child alignment") is ported as a
// loud, explicit `Unreachable` throw, matching `./_getSegmentStartPointLabel.ts`'s own
// identical `assert False` precedent.
//
// --- A real, CONFIRMED Python typo bug, preserved verbatim per this project's
// "preserve real Python bugs verbatim, disclose rather than silently fix" policy ---
//
// Real Python's line 145 (the `len(child_layouts) == 2` branch -- a child alignment
// with both a Vertical and a Cant layout) reads `file.creatIfcShapeRepresentation(...)`
// -- missing the "e" in "create". Every OTHER `IfcShapeRepresentation`-creating call
// site in the SAME real file (lines 57, 69, 91, and even the `len(layouts) == 3`
// branch's own `file.create_entity(type="IfcShapeRepresentation", ...)` at line 103)
// spells it correctly. Real Python: `ifcopenshell.file` dynamically exposes a
// `createIfc<Class>(...)` method per schema class (`file_mixin`'s own
// `__getattr__`-based sugar) -- `creatIfcShapeRepresentation` simply does not exist as
// an attribute, so real Python raises a real `AttributeError: 'file' object has no
// attribute 'creatIfcShapeRepresentation'` the moment this branch is exercised, AFTER
// `gradient_curve`/`segmented_reference_curve` have already been created successfully
// (lines 141-143).
//
// This TS port has NO per-class `createIfcXxx` dynamic-dispatch sugar at all (confirmed
// directly against `file.ts`'s own `createEntity` header comment -- "the dynamic
// `f.createIfcWall(...)`-style sugar ... deliberately deferred" -- every real
// `file.createIfcXxx(...)` call site in this module is ported as a uniform
// `file.createEntity("IfcXxx", ...)` call instead). There is therefore no literal
// "same misspelled identifier" to carry over via `createEntity`'s own string-typed
// `type` argument (misspelling the STRING would silently produce a DIFFERENT real
// Python behavior -- a schema-lookup `LookupError`, not an `AttributeError` on a
// missing dynamic method -- not the same bug). Instead, this port calls the
// IDENTICAL misspelled property name directly ON THE `file` OBJECT ITSELF
// (`(file as ...).creatIfcShapeRepresentation(...)`, cast through an index-signature
// type rather than `any` per this project's own lint discipline) -- since no such
// property exists on `IfcFile`, this throws the natural TS equivalent of real
// Python's own `AttributeError` (`TypeError: file.creatIfcShapeRepresentation is not
// a function`) at the EXACT same point, after the exact same 2 curves have already
// been created, and does NOT "fix" the typo to `createEntity("IfcShapeRepresentation",
// ...)`. Pinned by a dedicated regression test exercising exactly this branch (a
// child alignment with both a Vertical and a Cant layout).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { assignRepresentation } from "../geometry/assignRepresentation";
import { getAlignmentLayouts } from "./getAlignmentLayouts";
import { getAxisSubcontext } from "./getAxisSubcontext";
import { getBasisCurve } from "./getBasisCurve";
import { getChildAlignments } from "./getChildAlignments";

/**
 * Create geometric representation for the alignment and its nested layouts (Python:
 * `ifcopenshell.api.alignment._create_geometric_representation`).
 *
 * There are 5 different cases (the `IfcCurve` created is indicated):
 * 1. Horizontal only -> `IfcCompositeCurve`
 * 2. Horizontal + Vertical -> `IfcCompositeCurve` and `IfcGradientCurve`
 * 3. Horizontal + Vertical + Cant -> `IfcCompositeCurve` and `IfcSegmentedReferenceCurve`
 * 4. Vertical only (horizontal reused from a parent alignment) -> `IfcGradientCurve`
 * 5. Vertical + Cant (horizontal reused from a parent alignment) ->
 *    `IfcSegmentedReferenceCurve`
 *
 * This creates the geometric representation entity and assigns it to the alignment,
 * but does not populate the geometry of the representation.
 *
 * @param file The model.
 * @param alignment The alignment for which the representation is being created.
 * @throws {TypeError} If `alignment` is not an `IfcAlignment`.
 * @throws {Error} If a real (but bare-message) Python `assert` on the layout shape
 *   fails -- see this file's own header comment.
 * @throws {TypeError} At the exact point real Python's own `creatIfcShapeRepresentation`
 *   typo would raise an `AttributeError`, for a child alignment with both a Vertical
 *   and a Cant layout -- see this file's own header comment.
 */
export function _createGeometricRepresentation(file: IfcFile, alignment: EntityInstance): void {
	const expectedType = "IfcAlignment";
	if (!alignment.isA(expectedType)) {
		throw new TypeError(`Expected ${expectedType} but got ${alignment.isA()}`);
	}

	const axisGeomSubcontext = getAxisSubcontext(file);

	const layouts = getAlignmentLayouts(alignment);
	const children = getChildAlignments(alignment);

	if (layouts.length === 1 && children.length === 0) {
		if (!layouts[0].isA("IfcAlignmentHorizontal")) {
			throw new Error("Assertion failed: layouts[0] must be IfcAlignmentHorizontal");
		}
		// Horizontal only - IFC CT 4.1.7.1.1.1
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		const representation = file.createEntity("IfcShapeRepresentation", axisGeomSubcontext, "Axis", "Curve2D", [
			compositeCurve,
		]);
		assignRepresentation(file, { product: alignment, representation });
	} else if (layouts.length === 2 && children.length === 0) {
		// Horizontal and Vertical - IFC CT 4.1.7.1.1.1
		if (!layouts[0].isA("IfcAlignmentHorizontal")) {
			throw new Error("Assertion failed: layouts[0] must be IfcAlignmentHorizontal");
		}
		if (!layouts[1].isA("IfcAlignmentVertical")) {
			throw new Error("Assertion failed: layouts[1] must be IfcAlignmentVertical");
		}
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		const footprintRepresentation = file.createEntity(
			"IfcShapeRepresentation",
			axisGeomSubcontext,
			"FootPrint",
			"Curve2D",
			[compositeCurve],
		);
		assignRepresentation(file, { product: alignment, representation: footprintRepresentation });

		const gradientCurve = file.createEntity("IfcGradientCurve", [], false, compositeCurve);
		const axisRepresentation = file.createEntity("IfcShapeRepresentation", axisGeomSubcontext, "Axis", "Curve3D", [
			gradientCurve,
		]);
		assignRepresentation(file, { product: alignment, representation: axisRepresentation });
	} else if (layouts.length === 3 && children.length === 0) {
		// Horizontal, Vertical, and Cant - IFC CT 4.1.7.1.1.3
		if (!layouts[0].isA("IfcAlignmentHorizontal")) {
			throw new Error("Assertion failed: layouts[0] must be IfcAlignmentHorizontal");
		}
		if (!layouts[1].isA("IfcAlignmentVertical")) {
			throw new Error("Assertion failed: layouts[1] must be IfcAlignmentVertical");
		}
		if (!layouts[2].isA("IfcAlignmentCant")) {
			throw new Error("Assertion failed: layouts[2] must be IfcAlignmentCant");
		}
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		const footprintRepresentation = file.createEntity(
			"IfcShapeRepresentation",
			axisGeomSubcontext,
			"FootPrint",
			"Curve2D",
			[compositeCurve],
		);
		assignRepresentation(file, { product: alignment, representation: footprintRepresentation });

		const gradientCurve = file.createEntity("IfcGradientCurve", [], false, compositeCurve);
		const segmentedReferenceCurve = file.createEntity("IfcSegmentedReferenceCurve", [], false, gradientCurve);
		// Real Python uses `file.create_entity(type="IfcShapeRepresentation", ...)` here
		// (not `file.createIfcShapeRepresentation(...)`, unlike every other call site in
		// this file) -- functionally identical to `createEntity("IfcShapeRepresentation",
		// ...)`, a stylistic-only difference, not a bug.
		const axisRepresentation = file.createEntity("IfcShapeRepresentation", axisGeomSubcontext, "Axis", "Curve3D", [
			segmentedReferenceCurve,
		]);
		assignRepresentation(file, { product: alignment, representation: axisRepresentation });
	} else {
		// Reusing Horizontal - CT 4.1.4.4.1.2
		// Create a representation on the parent alignment
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		const representation = file.createEntity("IfcShapeRepresentation", axisGeomSubcontext, "FootPrint", "Curve2D", [
			compositeCurve,
		]);
		assignRepresentation(file, { product: alignment, representation });
	}

	for (const childAlignment of children) {
		childAlignment.set("ObjectPlacement", alignment.get("ObjectPlacement"));
		const childLayouts = getAlignmentLayouts(childAlignment);
		if (childLayouts.length === 1) {
			if (!childLayouts[0].isA("IfcAlignmentVertical")) {
				throw new Error("Assertion failed: childLayouts[0] must be IfcAlignmentVertical");
			}
			const baseCurve = getBasisCurve(alignment) as EntityInstance;
			const gradientCurve = file.createEntity("IfcGradientCurve", [], false, baseCurve);
			const representation = file.createEntity("IfcShapeRepresentation", axisGeomSubcontext, "Axis", "Curve3D", [
				gradientCurve,
			]);
			assignRepresentation(file, { product: childAlignment, representation });
		} else if (childLayouts.length === 2) {
			if (!childLayouts[0].isA("IfcAlignmentVertical")) {
				throw new Error("Assertion failed: childLayouts[0] must be IfcAlignmentVertical");
			}
			if (!childLayouts[1].isA("IfcAlignmentCant")) {
				throw new Error("Assertion failed: childLayouts[1] must be IfcAlignmentCant");
			}
			const baseCurve = getBasisCurve(alignment) as EntityInstance;
			const gradientCurve = file.createEntity("IfcGradientCurve", [], false, baseCurve);
			const segmentedReferenceCurve = file.createEntity("IfcSegmentedReferenceCurve", [], false, gradientCurve);

			// *** THE CONFIRMED TYPO BUG, PRESERVED VERBATIM -- see this file's own header
			// comment for the full writeup. `file` genuinely has no
			// `creatIfcShapeRepresentation` property, so this throws
			// `TypeError: file.creatIfcShapeRepresentation is not a function`, the direct
			// TS equivalent of real Python's own `AttributeError` from the identical typo,
			// at the exact same point (after `gradientCurve`/`segmentedReferenceCurve` have
			// already been created). Do NOT "fix" this to `createEntity("IfcShapeRepresentation", ...)`. ***
			const representation = (
				file as unknown as {
					creatIfcShapeRepresentation: (
						contextOfItems: EntityInstance,
						representationIdentifier: string,
						representationType: string,
						items: EntityInstance[],
					) => EntityInstance;
				}
			).creatIfcShapeRepresentation(axisGeomSubcontext, "Axis", "Curve3D", [segmentedReferenceCurve]);
			assignRepresentation(file, { product: childAlignment, representation });
		} else {
			// Python: `assert False` -- "should never get here - can't have more than one
			// vertical and cant in a child alignment".
			throw new Error(
				`Unreachable: a child alignment can't have more than one vertical and cant layout (got ${childLayouts.length})`,
			);
		}
	}
}
