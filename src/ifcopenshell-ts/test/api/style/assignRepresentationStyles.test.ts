// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/style/test_assign_representation_styles.py`
// (src/ifcopenshell-python -- `TestAssignRepresentationStyles(test.bootstrap.IFC4)`'s
// `test_run`/`test_assign_using_style_assignment`/
// `test_assign_style_to_topology_representation`, plus
// `TestAssignRepresentationStylesIFC2X3(test.bootstrap.IFC2X3)`'s own `test_run`, which
// (per real Python's own source) actually just re-runs
// `TestAssignRepresentationStyles.test_assign_using_style_assignment` on IFC2X3 --
// ported the same way below (as an IFC2X3 case of that same test, not a separate one).
// Also run on IFC4X3 for `test_run`/`test_assign_style_to_topology_representation`
// (`IfcPresentationStyleAssignment`-based tests are pre-IFC4X3-only, per that class's
// real removal from the schema, already established by chunk 1's own tests).

import { describe, expect, test } from "vitest";
import { assignRepresentationStyles } from "../../../src/api/style/assignRepresentationStyles";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.style.assignRepresentationStyles (%s)",
	(schema) => {
		test("run", () => {
			const file = createTestFile(schema);
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const representation = file.createEntity("IfcShapeRepresentation");
			representation.set("Items", [item]);

			const style = file.createEntity("IfcSurfaceStyle");
			assignRepresentationStyles(file, { styles: [style], shapeRepresentation: representation });
			let styledByItem = item.get("StyledByItem") as EntityInstance[];
			let styles = styledByItem[0].get("Styles") as EntityInstance[];
			expect(styles).toHaveLength(1);
			expect(styles[0].equals(style)).toBe(true);

			// reusing existing styled item for different style type
			const style2 = file.createEntity("IfcFillAreaStyle");
			assignRepresentationStyles(file, { styles: [style2], shapeRepresentation: representation });
			styledByItem = item.get("StyledByItem") as EntityInstance[];
			styles = styledByItem[0].get("Styles") as EntityInstance[];
			expect(styles).toHaveLength(2);
			expect(styles[0].equals(style)).toBe(true);
			expect(styles[1].equals(style2)).toBe(true);
			expect(file.byType("IfcStyledItem")).toHaveLength(1);

			// replacing existing style of the same type
			const style3 = file.createEntity("IfcSurfaceStyle");
			assignRepresentationStyles(file, { styles: [style3], shapeRepresentation: representation });
			styledByItem = item.get("StyledByItem") as EntityInstance[];
			styles = styledByItem[0].get("Styles") as EntityInstance[];
			expect(styles).toHaveLength(2);
			expect(styles[0].equals(style2)).toBe(true);
			expect(styles[1].equals(style3)).toBe(true);
			expect(file.byType("IfcStyledItem")).toHaveLength(1);
		});

		test("assign style to topology representation", () => {
			const file = createTestFile(schema);
			const item = file.createEntity("IfcFace");
			const representation = file.createEntity("IfcTopologyRepresentation");
			representation.set("Items", [item]);

			const style = file.createEntity("IfcSurfaceStyle");
			assignRepresentationStyles(file, { styles: [style], shapeRepresentation: representation });

			const styledByItem = item.get("StyledByItem") as EntityInstance[];
			const styles = styledByItem[0].get("Styles") as EntityInstance[];
			expect(styles).toHaveLength(1);
			expect(styles[0].equals(style)).toBe(true);
		});
	},
);

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC4X3"))(
	"api.style.assignRepresentationStyles (%s) -- shouldUsePresentationStyleAssignment",
	(schema) => {
		test("assign using style assignment", () => {
			const file = createTestFile(schema);
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const representation = file.createEntity("IfcShapeRepresentation");
			representation.set("Items", [item]);

			const style = file.createEntity("IfcSurfaceStyle");
			assignRepresentationStyles(file, {
				styles: [style],
				shapeRepresentation: representation,
				shouldUsePresentationStyleAssignment: true,
			});
			expect(file.byType("IfcPresentationStyleAssignment")).toHaveLength(1);
			const styleAssignment = file.byType("IfcPresentationStyleAssignment")[0];
			let assignmentStyles = styleAssignment.get("Styles") as EntityInstance[];
			expect(assignmentStyles).toHaveLength(1);
			expect(assignmentStyles[0].equals(style)).toBe(true);
			let styledByItem = item.get("StyledByItem") as EntityInstance[];
			let itemStyles = styledByItem[0].get("Styles") as EntityInstance[];
			expect(itemStyles).toHaveLength(1);
			expect(itemStyles[0].equals(styleAssignment)).toBe(true);

			// reusing existing styled item for different style type
			const style2 = file.createEntity("IfcFillAreaStyle");
			assignRepresentationStyles(file, {
				styles: [style2],
				shapeRepresentation: representation,
				shouldUsePresentationStyleAssignment: true,
			});
			expect(file.byType("IfcPresentationStyleAssignment")).toHaveLength(1);
			styledByItem = item.get("StyledByItem") as EntityInstance[];
			itemStyles = styledByItem[0].get("Styles") as EntityInstance[];
			expect(itemStyles).toHaveLength(1);
			expect(itemStyles[0].equals(styleAssignment)).toBe(true);
			assignmentStyles = itemStyles[0].get("Styles") as EntityInstance[];
			expect(assignmentStyles).toHaveLength(2);
			expect(assignmentStyles[0].equals(style)).toBe(true);
			expect(assignmentStyles[1].equals(style2)).toBe(true);
			expect(file.byType("IfcStyledItem")).toHaveLength(1);

			// replacing existing style of the same type
			const style3 = file.createEntity("IfcSurfaceStyle");
			assignRepresentationStyles(file, {
				styles: [style3],
				shapeRepresentation: representation,
				shouldUsePresentationStyleAssignment: true,
			});
			expect(file.byType("IfcPresentationStyleAssignment")).toHaveLength(1);
			styledByItem = item.get("StyledByItem") as EntityInstance[];
			itemStyles = styledByItem[0].get("Styles") as EntityInstance[];
			expect(itemStyles).toHaveLength(1);
			expect(itemStyles[0].equals(styleAssignment)).toBe(true);
			assignmentStyles = itemStyles[0].get("Styles") as EntityInstance[];
			expect(assignmentStyles).toHaveLength(2);
			expect(assignmentStyles[0].equals(style2)).toBe(true);
			expect(assignmentStyles[1].equals(style3)).toBe(true);
			expect(file.byType("IfcStyledItem")).toHaveLength(1);
		});
	},
);
