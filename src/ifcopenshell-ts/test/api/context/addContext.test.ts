// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/context/test_add_context.py` (src/ifcopenshell-python) --
// all 6 real Python test methods ported directly, no adaptation needed (`add_context`
// has no unported dependency).
//
// Real Python's `test.bootstrap.IFC4`/`IFC2X3` fixture is genuinely blank
// (`ifcopenshell.api.project.create_file()`, no pre-existing `IfcProject`/
// `RepresentationContexts` -- see `bootstrap.ts`'s own `stripProjectBootstrap` doc
// comment), unlike this port's own `createTestFile` (which uses the richer
// `template.create` port, pre-populating a default `IfcProject` with its own
// `RepresentationContexts`). Every test below calls `stripProjectBootstrap` first, then
// creates its own bare `IfcProject`, to reach the same blank starting state real
// Python's tests do -- matching `api.unit`'s own established precedent for this exact
// gap (`assignUnit.test.ts`, etc.).

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function blankProjectFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	file.createEntity("IfcProject");
	return file;
}

describe.each(AVAILABLE_SCHEMAS)("api.context.addContext (%s)", (schema) => {
	test("adding a 3D context", () => {
		const file = blankProjectFile(schema);
		const context = addContext(file, { contextType: "Model" });
		expect(context.get("ContextType")).toBe("Model");
		expect(context.isA()).toBe("IfcGeometricRepresentationContext");
		const worldCoordinateSystem = context.get("WorldCoordinateSystem") as ReturnType<typeof file.createEntity>;
		expect(worldCoordinateSystem.isA()).toBe("IfcAxis2Placement3D");
		expect((worldCoordinateSystem.get("Location") as ReturnType<typeof file.createEntity>).get("Coordinates")).toEqual([
			0, 0, 0,
		]);
		expect((worldCoordinateSystem.get("Axis") as ReturnType<typeof file.createEntity>).get("DirectionRatios")).toEqual([
			0, 0, 1,
		]);
		expect(
			(worldCoordinateSystem.get("RefDirection") as ReturnType<typeof file.createEntity>).get("DirectionRatios"),
		).toEqual([1, 0, 0]);
		expect(context.get("CoordinateSpaceDimension")).toBe(3);
	});

	test("adding a 2D context", () => {
		const file = blankProjectFile(schema);
		const context = addContext(file, { contextType: "Plan" });
		expect(context.get("ContextType")).toBe("Plan");
		expect(context.isA()).toBe("IfcGeometricRepresentationContext");
		const worldCoordinateSystem = context.get("WorldCoordinateSystem") as ReturnType<typeof file.createEntity>;
		expect(worldCoordinateSystem.isA()).toBe("IfcAxis2Placement2D");
		expect((worldCoordinateSystem.get("Location") as ReturnType<typeof file.createEntity>).get("Coordinates")).toEqual([
			0, 0,
		]);
		expect(
			(worldCoordinateSystem.get("RefDirection") as ReturnType<typeof file.createEntity>).get("DirectionRatios"),
		).toEqual([1, 0]);
		expect(context.get("CoordinateSpaceDimension")).toBe(2);
	});

	test("defaulting to 3D with an unknown context type", () => {
		const file = blankProjectFile(schema);
		const context = addContext(file, {});
		expect(context.get("ContextType")).toBeNull();
		expect(context.isA()).toBe("IfcGeometricRepresentationContext");
		const worldCoordinateSystem = context.get("WorldCoordinateSystem") as ReturnType<typeof file.createEntity>;
		expect(worldCoordinateSystem.isA()).toBe("IfcAxis2Placement3D");
		expect((worldCoordinateSystem.get("Location") as ReturnType<typeof file.createEntity>).get("Coordinates")).toEqual([
			0, 0, 0,
		]);
		expect((worldCoordinateSystem.get("Axis") as ReturnType<typeof file.createEntity>).get("DirectionRatios")).toEqual([
			0, 0, 1,
		]);
		expect(
			(worldCoordinateSystem.get("RefDirection") as ReturnType<typeof file.createEntity>).get("DirectionRatios"),
		).toEqual([1, 0, 0]);
		expect(context.get("CoordinateSpaceDimension")).toBe(3);
	});

	test("adding a subcontext", () => {
		const file = blankProjectFile(schema);
		addContext(file, { contextType: "Model" });
		const context = file.byType("IfcGeometricRepresentationContext")[0];
		const subcontext = addContext(file, { parent: context, targetView: "NOTDEFINED" });
		expect(subcontext.isA("IfcGeometricRepresentationSubContext")).toBe(true);
		expect(subcontext.get("TargetView")).toBe("NOTDEFINED");
	});

	test("adding a subcontext with an optional identifier specified", () => {
		const file = blankProjectFile(schema);
		addContext(file, { contextType: "Model" });
		const context = file.byType("IfcGeometricRepresentationContext")[0];
		const subcontext = addContext(file, { parent: context, targetView: "NOTDEFINED", contextIdentifier: "Body" });
		expect(subcontext.isA("IfcGeometricRepresentationSubContext")).toBe(true);
		expect(subcontext.get("TargetView")).toBe("NOTDEFINED");
		expect(subcontext.get("ContextIdentifier")).toBe("Body");
	});

	test("adding two contexts", () => {
		const file = blankProjectFile(schema);
		addContext(file, { contextType: "Model" });
		addContext(file, { contextType: "Plan" });
		const project = file.byType("IfcProject")[0];
		expect((project.get("RepresentationContexts") as unknown[]).length).toBe(2);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.context.addContext Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created top-level context; redo recreates it", () => {
		const file = blankProjectFile(schema);

		file.beginTransaction();
		const context = addContext(file, { contextType: "Model" });
		file.endTransaction();
		const contextId = context.id();

		expect(file.byType("IfcGeometricRepresentationContext").length).toBe(1);

		file.undo();
		expect(file.byType("IfcGeometricRepresentationContext").length).toBe(0);
		const project = file.byType("IfcProject")[0];
		expect((project.get("RepresentationContexts") as unknown[] | null) ?? []).toHaveLength(0);

		file.redo();
		expect(file.byId(contextId).isA("IfcGeometricRepresentationContext")).toBe(true);
		expect((file.byType("IfcProject")[0].get("RepresentationContexts") as unknown[]).length).toBe(1);
	});

	test("undo removes the created subcontext; redo recreates it", () => {
		const file = blankProjectFile(schema);
		const context = addContext(file, { contextType: "Model" });

		file.beginTransaction();
		const subcontext = addContext(file, { parent: context, contextIdentifier: "Body", targetView: "MODEL_VIEW" });
		file.endTransaction();
		const subcontextId = subcontext.id();

		file.undo();
		expect(() => file.byId(subcontextId)).toThrow();

		file.redo();
		expect(file.byId(subcontextId).get("ContextIdentifier")).toBe("Body");
	});
});
