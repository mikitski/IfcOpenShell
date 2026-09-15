// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/style/test_unassign_representation_styles.py`
// (src/ifcopenshell-python -- `TestUnassignRepresentationStyles(test.bootstrap.IFC4)`'s
// `test_run`/`test_assign_using_style_assignment`, plus
// `TestUnassignRepresentationStylesIFC2X3(test.bootstrap.IFC2X3)`, which does NOT
// inherit from `TestUnassignRepresentationStyles` at all -- it only defines its own
// `test_run`, which manually delegates to `test_assign_using_style_assignment`'s body.
// I.e. real Python deliberately never runs the bare/unwrapped-style scenario
// (`test_run`) under IFC2X3 at all -- ported the same way below (that scenario's own
// `describe.each` excludes IFC2X3): `IfcStyledItem.Styles` on IFC2X3 is typed as
// `IfcPresentationStyleAssignment[]` only (confirmed against `ifc2x3.d.ts`) -- a bare
// `IfcSurfaceStyle` is not a valid direct member there at all, so building this
// scenario's fixture on IFC2X3 would itself be invalid IFC, not merely untested by
// real Python.
//
// `api.style.assignRepresentationStyles` (a chunk 2 function, see `../../../src/api
// /style/index.ts`'s own header comment) is NOT ported -- both fixtures below are
// built directly, reproducing the exact `IfcStyledItem`/`IfcPresentationStyleAssignment`
// shape that function's own two successive calls (`styles=[style]` then
// `styles=[style2], replace_previous_same_type_style=False`) would produce, identical
// technique to `../material/removeMaterial.test.ts`'s own established precedent for a
// not-yet-ported sibling.
//
// The `should_use_presentation_style_assignment=True` scenario is run against IFC2X3
// (where it's the schema default, matching real Python's own `TestUnassignRepresentation
// StylesIFC2X3.test_run` delegation) and IFC4 (where it's an explicit,
// Revit-compatibility opt-in) -- but NOT IFC4X3, since `IfcPresentationStyleAssignment`
// was REMOVED in IFC4X3 (confirmed absent from `ifc4x3.d.ts` entirely) -- constructing
// this fixture there would fail at `file.createEntity("IfcPresentationStyleAssignment",
// ...)` itself, a real schema constraint, not a gap in this port.

import { describe, expect, test } from "vitest";
import { unassignRepresentationStyles } from "../../../src/api/style/unassignRepresentationStyles";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.style.unassignRepresentationStyles (%s) -- bare styles, IFC4+ only",
	(schema) => {
		test("unassigns styles directly assigned to a representation", () => {
			const file = createTestFile(schema);
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const representation = file.createEntity("IfcShapeRepresentation");
			representation.set("Items", [item]);

			const style = file.createEntity("IfcSurfaceStyle");
			const style2 = file.createEntity("IfcSurfaceStyle");
			// Reproduces what 2 successive `assignRepresentationStyles` calls (the second
			// with `replacePreviousSameTypeStyle: false`) would produce -- see this file's
			// own header comment.
			file.createEntity("IfcStyledItem", item, [style, style2], null);
			const initialStyles = (item.get("StyledByItem") as EntityInstance[])[0].get("Styles") as EntityInstance[];
			expect(initialStyles.length).toBe(2);
			expect(initialStyles[0].equals(style)).toBe(true);
			expect(initialStyles[1].equals(style2)).toBe(true);

			unassignRepresentationStyles(file, { shapeRepresentation: representation, styles: [style] });
			const remaining = (item.get("StyledByItem") as EntityInstance[])[0].get("Styles") as EntityInstance[];
			expect(remaining.length).toBe(1);
			expect(remaining[0].equals(style2)).toBe(true);

			// unassigning last style removes styled item
			unassignRepresentationStyles(file, { shapeRepresentation: representation, styles: [style2] });
			expect(item.get("StyledByItem")).toEqual([]);
			expect(file.byType("IfcStyledItem").length).toBe(0);
		});
	},
);

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC4X3"))(
	"api.style.unassignRepresentationStyles (%s) -- IfcPresentationStyleAssignment-wrapped styles",
	(schema) => {
		test("unassigns styles wrapped in an IfcPresentationStyleAssignment", () => {
			const file = createTestFile(schema);
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const representation = file.createEntity("IfcShapeRepresentation");
			representation.set("Items", [item]);

			const style = file.createEntity("IfcSurfaceStyle");
			const style2 = file.createEntity("IfcSurfaceStyle");
			const styleAssignment = file.createEntity("IfcPresentationStyleAssignment", [style, style2]);
			file.createEntity("IfcStyledItem", item, [styleAssignment], null);

			unassignRepresentationStyles(file, {
				shapeRepresentation: representation,
				styles: [style],
				shouldUsePresentationStyleAssignment: true,
			});
			expect(styleAssignment.get("Styles")).toHaveLength(1);
			expect((styleAssignment.get("Styles") as EntityInstance[])[0].equals(style2)).toBe(true);

			// unassigning last style removes styled item and presentation style
			unassignRepresentationStyles(file, {
				shapeRepresentation: representation,
				styles: [style2],
				shouldUsePresentationStyleAssignment: true,
			});
			expect(item.get("StyledByItem")).toEqual([]);
			expect(file.byType("IfcStyledItem").length).toBe(0);
			expect(file.byType("IfcPresentationStyleAssignment").length).toBe(0);
		});
	},
);
