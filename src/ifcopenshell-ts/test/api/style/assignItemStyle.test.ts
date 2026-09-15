// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `assign_item_style.py` (no `test_assign_item_style.py`
// counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/style/`). Tests below are new, exercising real
// Python's own documented source behavior directly (see
// `../../../src/api/style/assignItemStyle.ts`'s own header comment for the three-way
// schema branch this pins): the "no existing style" branch (with and without the
// IFC2X3 `IfcPresentationStyleAssignment` wrap), the "already exactly this style"
// fast-path no-op, the IFC4X3 direct-overwrite/removal branch, and the pre-IFC4X3
// assignment-reuse/removal branch.

import { describe, expect, test } from "vitest";
import { assignItemStyle } from "../../../src/api/style/assignItemStyle";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.style.assignItemStyle (%s)", (schema) => {
	test("creates a new IfcStyledItem when the item has no existing style", () => {
		const file = createTestFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const style = file.createEntity("IfcSurfaceStyle");

		const styledItem = assignItemStyle(file, { item, style }) as EntityInstance;

		expect(styledItem).not.toBeNull();
		expect(styledItem.isA("IfcStyledItem")).toBe(true);
		const styles = styledItem.get("Styles") as EntityInstance[];
		expect(styles).toHaveLength(1);
		if (schema === "IFC2X3") {
			expect(styles[0].isA("IfcPresentationStyleAssignment")).toBe(true);
			expect((styles[0].get("Styles") as EntityInstance[])[0].equals(style)).toBe(true);
		} else {
			expect(styles[0].equals(style)).toBe(true);
		}
	});

	test("does nothing when the item has no existing style and style is null", () => {
		const file = createTestFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");

		const result = assignItemStyle(file, { item, style: null });

		expect(result).toBeNull();
		expect((item.get("StyledByItem") as EntityInstance[]).length).toBe(0);
	});

	test("returns the existing styled item unchanged when it already carries exactly this style", () => {
		const file = createTestFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const style = file.createEntity("IfcSurfaceStyle");
		const styledItem = file.createEntity("IfcStyledItem", item, [style]);

		const result = assignItemStyle(file, { item, style });

		expect(result?.equals(styledItem)).toBe(true);
		const styles = styledItem.get("Styles") as EntityInstance[];
		expect(styles).toHaveLength(1);
		expect(styles[0].equals(style)).toBe(true);
	});
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC4X3"))(
	"api.style.assignItemStyle (%s) -- IFC4X3-specific (IfcPresentationStyleAssignment removed)",
	(schema) => {
		test("removes the styled item entirely when style is null", () => {
			const file = createTestFile(schema);
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const style = file.createEntity("IfcSurfaceStyle");
			file.createEntity("IfcStyledItem", item, [style]);

			const result = assignItemStyle(file, { item, style: null });

			expect(result).toBeNull();
			expect(file.byType("IfcStyledItem").length).toBe(0);
		});

		test("overwrites Styles directly with the new style", () => {
			const file = createTestFile(schema);
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const style1 = file.createEntity("IfcSurfaceStyle");
			const style2 = file.createEntity("IfcSurfaceStyle");
			const styledItem = file.createEntity("IfcStyledItem", item, [style1]);

			const result = assignItemStyle(file, { item, style: style2 });

			expect(result?.equals(styledItem)).toBe(true);
			const styles = styledItem.get("Styles") as EntityInstance[];
			expect(styles).toHaveLength(1);
			expect(styles[0].equals(style2)).toBe(true);
		});
	},
);

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC4X3"))(
	"api.style.assignItemStyle (%s) -- pre-IFC4X3 (IfcPresentationStyleAssignment)",
	(schema) => {
		test("reuses an existing IfcPresentationStyleAssignment, replacing its wrapped style", () => {
			const file = createTestFile(schema);
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const style1 = file.createEntity("IfcSurfaceStyle");
			const assignment = file.createEntity("IfcPresentationStyleAssignment", [style1]);
			const styledItem = file.createEntity("IfcStyledItem", item, [assignment]);
			const style2 = file.createEntity("IfcSurfaceStyle");

			const result = assignItemStyle(file, { item, style: style2 });

			expect(result?.equals(styledItem)).toBe(true);
			const styles = styledItem.get("Styles") as EntityInstance[];
			expect(styles).toHaveLength(1);
			expect(styles[0].equals(assignment)).toBe(true);
			const assignmentStyles = assignment.get("Styles") as EntityInstance[];
			expect(assignmentStyles).toHaveLength(1);
			expect(assignmentStyles[0].equals(style2)).toBe(true);
		});

		test("removes the styled item entirely when style is null", () => {
			const file = createTestFile(schema);
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const style = file.createEntity("IfcSurfaceStyle");
			file.createEntity("IfcStyledItem", item, [style]);

			const result = assignItemStyle(file, { item, style: null });

			expect(result).toBeNull();
			expect(file.byType("IfcStyledItem").length).toBe(0);
		});
	},
);
