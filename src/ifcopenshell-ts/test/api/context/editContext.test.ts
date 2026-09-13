// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/context/test_edit_context.py` (src/ifcopenshell-python) --
// both real Python test methods ported directly.

import { describe, expect, test } from "vitest";
import { editContext } from "../../../src/api/context/editContext";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.context.editContext (%s)", (schema) => {
	test("editing a context", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		editContext(file, {
			context,
			attributes: {
				ContextIdentifier: "ContextIdentifier",
				ContextType: "ContextType",
				CoordinateSpaceDimension: 1,
				Precision: 1,
			},
		});
		expect(context.get("ContextIdentifier")).toBe("ContextIdentifier");
		expect(context.get("ContextType")).toBe("ContextType");
		expect(context.get("CoordinateSpaceDimension")).toBe(1);
		expect(context.get("Precision")).toBe(1);
	});

	test("editing a subcontext", () => {
		const file = createTestFile(schema);
		const subcontext = file.createEntity("IfcGeometricRepresentationSubContext");
		editContext(file, {
			context: subcontext,
			attributes: {
				ContextIdentifier: "ContextIdentifier",
				ContextType: "ContextType",
				TargetScale: 0.5,
				TargetView: "MODEL_VIEW",
				UserDefinedTargetView: "UserDefinedTargetView",
			},
		});
		expect(subcontext.get("ContextIdentifier")).toBe("ContextIdentifier");
		expect(subcontext.get("ContextType")).toBe("ContextType");
		expect(subcontext.get("TargetScale")).toBe(0.5);
		expect(subcontext.get("TargetView")).toBe("MODEL_VIEW");
		expect(subcontext.get("UserDefinedTargetView")).toBe("UserDefinedTargetView");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.context.editContext Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute values; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		context.set("ContextIdentifier", "Old");

		file.beginTransaction();
		editContext(file, { context, attributes: { ContextIdentifier: "New", ContextType: "Model" } });
		file.endTransaction();

		expect(context.get("ContextIdentifier")).toBe("New");
		expect(context.get("ContextType")).toBe("Model");

		file.undo();
		expect(context.get("ContextIdentifier")).toBe("Old");
		expect(context.get("ContextType")).toBeNull();

		file.redo();
		expect(context.get("ContextIdentifier")).toBe("New");
		expect(context.get("ContextType")).toBe("Model");
	});
});
