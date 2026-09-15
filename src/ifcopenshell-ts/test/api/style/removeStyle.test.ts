// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/style/test_remove_style.py` (src/ifcopenshell-python --
// `TestRemoveStyle(test.bootstrap.IFC4)` / `TestRemoveStyleIFC2X3(test.bootstrap.IFC2X3,
// TestRemoveStyle)`, real Python's own multiple-inheritance shape: every base-class
// test runs on both IFC4 and IFC2X3, with `TestRemoveStyleIFC2X3` adding no overrides
// of its own). This port additionally runs the shared tests against IFC4X3 too (via
// `describe.each(AVAILABLE_SCHEMAS)`, already CI-safe per `../../bootstrap.ts`),
// matching `../material/removeMaterial.test.ts`'s own established precedent.
//
// Real Python's fixture (`test.bootstrap`'s `IFC4`/`IFC2X3` classes) is
// `ifcopenshell.api.project.create_file(...)` -- a genuinely empty file (zero
// entities, not even an `IfcProject`), NOT `ifcopenshell.template.create()`'s
// pre-populated project/units/owner-history template that `../../bootstrap.ts`'s own
// `createTestFile` builds on. Several of these tests assert `len(list(self.file)) ==
// 0` after removal -- an assertion that only holds against a genuinely blank starting
// file -- so this port uses `api.project.createFile(undefined, { version: schema })`
// (already ported, produces the same genuinely-empty-file shape as real Python's own
// bootstrap) instead of `createTestFile` for those tests.

import { describe, expect, test } from "vitest";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { createFile } from "../../../src/api/project/createFile";
import { removeStyle } from "../../../src/api/style/removeStyle";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

function blankFile(schema: Schema): IfcFile {
	return createFile(undefined, { version: schema });
}

/**
 * On IFC2X3, `api.owner.createOwnerHistory`'s default `owner.settings.getUser` throws
 * when the file has no `IfcPersonAndOrganization` at all (owner tracking is mandatory
 * on that schema) -- real Python's own `test.bootstrap.IFC2X3` fixture works around
 * this by monkeypatching `owner.settings.get_user`/`get_application` to auto-create one
 * on demand. This port's genuinely blank `blankFile` has no such bootstrap-level
 * override wired up, so the 2 tests below that call `assignMaterial` (which internally
 * creates an `IfcOwnerHistory`) pre-create the same minimal person/organization/
 * application chain directly instead -- harmless for these 2 tests specifically, since
 * neither asserts a whole-file entity count (unlike every other test in this file).
 */
function ensureOwnerHistoryUser(file: IfcFile): void {
	const person = file.createEntity("IfcPerson");
	const organization = file.createEntity("IfcOrganization");
	file.createEntity("IfcPersonAndOrganization", person, organization);
	file.createEntity("IfcApplication");
}

describe.each(AVAILABLE_SCHEMAS)("api.style.removeStyle (%s)", (schema) => {
	test("removing a style", () => {
		const file = blankFile(schema);
		const shading = file.createEntity("IfcSurfaceStyleShading");
		const style = withAttrs(file, "IfcSurfaceStyle", { Styles: [shading] });

		removeStyle(file, { style });

		expect([...file].length).toBe(0);
	});

	test("removing any styled items referencing the style", () => {
		const file = blankFile(schema);
		const shading = file.createEntity("IfcSurfaceStyleShading");
		const style = withAttrs(file, "IfcSurfaceStyle", { Styles: [shading] });
		withAttrs(file, "IfcStyledItem", { Styles: [style] });

		removeStyle(file, { style });

		expect([...file].length).toBe(0);
	});

	test("remove non-surface styles", () => {
		const file = blankFile(schema);
		const styleTypes = ["IfcCurveStyle", "IfcFillAreaStyle", "IfcTextStyle"];
		for (const styleType of styleTypes) {
			const style = file.createEntity(styleType);
			if (styleType === "IfcFillAreaStyle") {
				style.set("FillStyles", [file.createEntity("IfcDraughtingPreDefinedColour", "cyan")]);
			}
			removeStyle(file, { style });
			expect(file.byType("IfcPresentationStyle").length).toBe(0);
		}
	});

	test("remove curve style with curve style hatching", () => {
		const file = blankFile(schema);
		const element = file.createEntity("IfcWall");
		ensureOwnerHistoryUser(file);
		const material = addMaterial(file, {});
		assignMaterial(file, { products: [element], material });
		const curveStyle = file.createEntity("IfcCurveStyle");
		const fillStyle = withAttrs(file, "IfcFillAreaStyleHatching", { HatchLineAppearance: curveStyle });
		const style = withAttrs(file, "IfcFillAreaStyle", { FillStyles: [fillStyle] });
		withAttrs(file, "IfcMaterialDefinitionRepresentation", {
			RepresentedMaterial: material,
			Representations: [
				withAttrs(file, "IfcStyledRepresentation", {
					Items: [withAttrs(file, "IfcStyledItem", { Styles: [style] })],
				}),
			],
		});

		removeStyle(file, { style: curveStyle });

		expect(file.byType("IfcPresentationStyle").length).toBe(0);
		expect(file.byType("IfcMaterialDefinitionRepresentation").length).toBe(0);
		expect(file.byType("IfcStyledRepresentation").length).toBe(0);
	});

	test("remove fill area with fill area style hatching", () => {
		const file = blankFile(schema);
		const element = file.createEntity("IfcWall");
		ensureOwnerHistoryUser(file);
		const material = addMaterial(file, {});
		assignMaterial(file, { products: [element], material });
		const curveStyle = file.createEntity("IfcCurveStyle");
		const fillStyle = withAttrs(file, "IfcFillAreaStyleHatching", { HatchLineAppearance: curveStyle });
		const style = withAttrs(file, "IfcFillAreaStyle", { FillStyles: [fillStyle] });
		withAttrs(file, "IfcMaterialDefinitionRepresentation", {
			RepresentedMaterial: material,
			Representations: [
				withAttrs(file, "IfcStyledRepresentation", {
					Items: [withAttrs(file, "IfcStyledItem", { Styles: [style] })],
				}),
			],
		});

		removeStyle(file, { style });

		expect(file.byType("IfcPresentationStyle").length).toBe(0);
		expect(file.byType("IfcMaterialDefinitionRepresentation").length).toBe(0);
		expect(file.byType("IfcStyledRepresentation").length).toBe(0);
	});
});
