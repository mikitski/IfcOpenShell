// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `remove_styled_representation.py` (no
// `test_remove_styled_representation.py` counterpart -- confirmed by directory listing
// of `src/ifcopenshell-python/test/api/style/`). Tests below are new, exercising real
// Python's own documented behavior (docstring/source) directly, including the file's
// own disclosed quirk: only an orphaned styled item's `IfcPresentationStyleAssignment`
// wrapper is cleaned up, never a bare style it (or a sibling item) references -- see
// `../../../src/api/style/removeStyledRepresentation.ts`'s own header comment.

import { describe, expect, test } from "vitest";
import { removeStyledRepresentation } from "../../../src/api/style/removeStyledRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

describe.each(AVAILABLE_SCHEMAS)("api.style.removeStyledRepresentation (%s)", (schema) => {
	test("removes an orphaned representation and its material definition representation", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const style = file.createEntity("IfcSurfaceStyle");
		const styledItem = withAttrs(file, "IfcStyledItem", { Styles: [style] });
		const representation = withAttrs(file, "IfcStyledRepresentation", {
			ContextOfItems: context,
			Items: [styledItem],
		});
		withAttrs(file, "IfcMaterialDefinitionRepresentation", { Representations: [representation] });

		removeStyledRepresentation(file, { representation });

		expect(file.byType("IfcStyledRepresentation").length).toBe(0);
		expect(file.byType("IfcMaterialDefinitionRepresentation").length).toBe(0);
		expect(file.byType("IfcStyledItem").length).toBe(0);
		// The underlying style itself is left alone -- see this function's own docstring.
		expect(file.byType("IfcSurfaceStyle").length).toBe(1);
	});

	test("leaves the material definition representation when it still references another representation", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const style = file.createEntity("IfcSurfaceStyle");
		const styledItem = withAttrs(file, "IfcStyledItem", { Styles: [style] });
		const representation = withAttrs(file, "IfcStyledRepresentation", {
			ContextOfItems: context,
			Items: [styledItem],
		});
		const otherRepresentation = file.createEntity("IfcShapeRepresentation");
		const definitionRepresentation = withAttrs(file, "IfcMaterialDefinitionRepresentation", {
			Representations: [representation, otherRepresentation],
		});

		removeStyledRepresentation(file, { representation });

		expect(file.byType("IfcStyledRepresentation").length).toBe(0);
		expect(file.byType("IfcMaterialDefinitionRepresentation").length).toBe(1);
		const remainingRepresentations = definitionRepresentation.get("Representations") as EntityInstance[];
		expect(remainingRepresentations).toHaveLength(1);
		expect(remainingRepresentations[0].equals(otherRepresentation)).toBe(true);
	});

	test("does not remove a styled item that has other inverse references", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const style = file.createEntity("IfcSurfaceStyle");
		const styledItem = withAttrs(file, "IfcStyledItem", { Styles: [style] });
		const representation = withAttrs(file, "IfcStyledRepresentation", {
			ContextOfItems: context,
			Items: [styledItem],
		});
		// A second representation also referencing the same styled item -- so
		// `get_total_inverses(styled_item)` is 2, not 1, at the moment `representation`
		// is being removed.
		withAttrs(file, "IfcStyledRepresentation", { ContextOfItems: context, Items: [styledItem] });

		removeStyledRepresentation(file, { representation });

		expect(file.byType("IfcStyledRepresentation").length).toBe(1);
		expect(file.byType("IfcStyledItem").length).toBe(1);
	});
});

// --- `IfcPresentationStyleAssignment` removed in IFC4X3. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC4X3"))(
	"api.style.removeStyledRepresentation (%s) -- IfcPresentationStyleAssignment quirk",
	(schema) => {
		test("removes an orphaned styled item's IfcPresentationStyleAssignment wrapper but keeps the bare style", () => {
			const file = createTestFile(schema);
			const context = file.createEntity("IfcGeometricRepresentationContext");
			const style = file.createEntity("IfcSurfaceStyle");
			const styleAssignment = file.createEntity("IfcPresentationStyleAssignment", [style]);
			const styledItem = withAttrs(file, "IfcStyledItem", { Styles: [styleAssignment] });
			const representation = withAttrs(file, "IfcStyledRepresentation", {
				ContextOfItems: context,
				Items: [styledItem],
			});

			removeStyledRepresentation(file, { representation });

			expect(file.byType("IfcStyledItem").length).toBe(0);
			expect(file.byType("IfcPresentationStyleAssignment").length).toBe(0);
			expect(file.byType("IfcSurfaceStyle").length).toBe(1);
		});
	},
);
