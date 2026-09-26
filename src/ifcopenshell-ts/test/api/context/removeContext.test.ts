// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/context/test_remove_context.py` (src/ifcopenshell-python)
// -- all 4 real Python test methods ported, one (`test_removing_a_context_with_
// assigned_representations`) adapted for a disclosed reason:
//
// Real Python's setup calls `ifcopenshell.api.geometry.assign_representation`, which is
// NOT ported in this chunk (see `../geometry/unassignRepresentation.ts`'s own header
// comment for why only `unassign_representation`/`remove_representation` -- the two
// functions `remove_context` itself actually calls -- are in scope here). The
// precondition is instead constructed directly (`file.createEntity("IfcProductDefinitionShape",
// ...)`/`.set("Representation", ...)`), mirroring exactly what `assign_representation`'s
// own `assign_product_representation` does for a plain `IfcProduct` (confirmed by
// reading that Python source directly), matching this project's established precedent
// for an unported sibling "assign" dependency (e.g. `unassignObject.test.ts`'s own
// `createAggregatesRel` helper).
//
// The real Python assertion (`assert len([e for e in self.file]) == 1` for IFC4/
// IFC4X3, `== 6` for IFC2X3) depends on `test.bootstrap.py`'s own IFC2X3-specific
// `get_user`/`get_application` overrides, which auto-create a `IfcPerson`/
// `IfcOrganization`/`IfcPersonAndOrganization`/`IfcApplication` chain on first use --
// a test-fixture-specific mechanism this port's own `ownerSettings` doesn't replicate
// (`owner/settings.ts`'s own default `getUser`/`getApplication` instead throw for
// IFC2X3 with no existing user/application, matching real Python's own *production*
// `owner.settings` default, not `test.bootstrap.py`'s special-cased override). Rather
// than reproduce that fixture-specific mechanism just for one incidental entity count,
// this test asserts the same underlying substance the Python assertion is actually
// checking (every representation-related entity left behind by the removed context is
// gone, but the product itself survives) directly and more robustly: `context`/`rep`/
// the synthesized `IfcProductDefinitionShape` are confirmed removed by id, and
// `element` is confirmed to still exist afterward -- schema-independent, and unaffected
// by incidental owner-history bootstrap entity counts.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { removeContext } from "../../../src/api/context/removeContext";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function blankFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	return file;
}

function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

describe.each(AVAILABLE_SCHEMAS)("api.context.removeContext (%s)", (schema) => {
	test("removing a context", () => {
		const file = blankFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		removeContext(file, { context });
		expect(file.byType("IfcGeometricRepresentationContext").length).toBe(0);
	});

	test("removing a context with subcontexts", () => {
		const file = blankFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const subcontext = file.createEntity("IfcGeometricRepresentationSubContext");
		subcontext.set("ParentContext", context);
		removeContext(file, { context });
		expect(file.byType("IfcGeometricRepresentationContext").length).toBe(0);
	});

	test("removing a subcontext and reassigning references to its parent", () => {
		const file = blankFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const subcontext = file.createEntity("IfcGeometricRepresentationSubContext");
		subcontext.set("ParentContext", context);
		const representation = withAttrs(file, "IfcRepresentation", { ContextOfItems: subcontext });
		if (schema !== "IFC2X3") {
			const projectedCrs = file.createEntity("IfcProjectedCRS");
			withAttrs(file, "IfcMapConversion", { SourceCRS: subcontext, TargetCRS: projectedCrs });
		}

		removeContext(file, { context: subcontext });

		expect(file.byType("IfcGeometricRepresentationSubContext").length).toBe(0);
		expect([...(file.getInverse(context) as Set<EntityInstance>)].some((e) => e.equals(representation))).toBe(true);
		expect(representation.get("ContextOfItems")).not.toBeNull();
		expect((representation.get("ContextOfItems") as EntityInstance).equals(context)).toBe(true);
		if (schema !== "IFC2X3") {
			expect(file.byType("IfcMapConversion").length).toBe(0);
			expect(file.byType("IfcProjectedCRS").length).toBe(0);
		}
	});

	test("removing a context with assigned representations", () => {
		// Uses the plain (not `stripProjectBootstrap`'d) fixture -- `createEntity` needs
		// `createOwnerHistory`, which throws on IFC2X3 with no existing user/application
		// (`owner/settings.ts`'s own real-Python-matching default, distinct from
		// `test.bootstrap.py`'s own IFC2X3-specific auto-creating override -- see this
		// file's header comment). `createTestFile`'s own template already provides a
		// default person/organization/application, unrelated to (and not asserted on by)
		// this test's own id-based assertions below.
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const element = createEntity(file, {});
		const rep = withAttrs(file, "IfcRepresentation", { ContextOfItems: context });
		const productDef = withAttrs(file, "IfcProductDefinitionShape", { Representations: [rep] });
		element.set("Representation", productDef);
		const contextId = context.id();
		const repId = rep.id();
		const productDefId = productDef.id();
		const elementId = element.id();

		removeContext(file, { context });

		expect(() => file.byId(contextId)).toThrow();
		expect(() => file.byId(repId)).toThrow();
		expect(() => file.byId(productDefId)).toThrow();
		expect(file.byId(elementId).isA("IfcBuildingElementProxy")).toBe(true);
		expect(element.get("Representation")).toBeNull();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---
//
// Particular scrutiny on the recursive subcontext-removal case and both of
// `removeContext`'s own branches (with/without `ParentContext`), per this chunk's own
// task brief.

describe.each(AVAILABLE_SCHEMAS)("api.context.removeContext Transaction/undo-redo (%s)", (schema) => {
	test("undo restores a removed top-level context with no subcontexts; redo removes it again", () => {
		const file = blankFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		context.set("ContextIdentifier", "Marker");
		const contextId = context.id();

		file.beginTransaction();
		removeContext(file, { context });
		file.endTransaction();

		expect(() => file.byId(contextId)).toThrow();

		file.undo();
		expect(file.byId(contextId).get("ContextIdentifier")).toBe("Marker");

		file.redo();
		expect(() => file.byId(contextId)).toThrow();
	});

	test("undo restores both a removed context AND its recursively-removed subcontext; redo removes both again", () => {
		const file = blankFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const subcontext = file.createEntity("IfcGeometricRepresentationSubContext");
		subcontext.set("ParentContext", context);
		subcontext.set("ContextIdentifier", "Body");
		const contextId = context.id();
		const subcontextId = subcontext.id();

		file.beginTransaction();
		removeContext(file, { context });
		file.endTransaction();

		expect(() => file.byId(contextId)).toThrow();
		expect(() => file.byId(subcontextId)).toThrow();

		file.undo();
		expect(file.byId(contextId).isA("IfcGeometricRepresentationContext")).toBe(true);
		expect(file.byId(subcontextId).get("ContextIdentifier")).toBe("Body");
		expect((file.byId(subcontextId).get("ParentContext") as EntityInstance).equals(file.byId(contextId))).toBe(true);

		file.redo();
		expect(() => file.byId(contextId)).toThrow();
		expect(() => file.byId(subcontextId)).toThrow();
	});

	test("undo restores a removed subcontext's reassigned reference (ParentContext branch); redo reassigns it again", () => {
		const file = blankFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const subcontext = file.createEntity("IfcGeometricRepresentationSubContext");
		subcontext.set("ParentContext", context);
		const representation = withAttrs(file, "IfcRepresentation", { ContextOfItems: subcontext });
		const subcontextId = subcontext.id();

		file.beginTransaction();
		removeContext(file, { context: subcontext });
		file.endTransaction();

		expect(() => file.byId(subcontextId)).toThrow();
		expect((representation.get("ContextOfItems") as EntityInstance).equals(context)).toBe(true);

		file.undo();
		expect(file.byId(subcontextId).isA("IfcGeometricRepresentationSubContext")).toBe(true);
		expect((representation.get("ContextOfItems") as EntityInstance).equals(file.byId(subcontextId))).toBe(true);

		file.redo();
		expect(() => file.byId(subcontextId)).toThrow();
		expect((representation.get("ContextOfItems") as EntityInstance).equals(context)).toBe(true);
	});

	test("undo restores a removed top-level context's unassigned/removed representations; redo removes them again", () => {
		// Plain (not `stripProjectBootstrap`'d) fixture -- see "removing a context with
		// assigned representations" above for why (`createEntity` needs a real user on
		// IFC2X3).
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const element = createEntity(file, {});
		const rep = withAttrs(file, "IfcRepresentation", { ContextOfItems: context });
		const productDef = withAttrs(file, "IfcProductDefinitionShape", { Representations: [rep] });
		element.set("Representation", productDef);
		const contextId = context.id();
		const repId = rep.id();

		file.beginTransaction();
		removeContext(file, { context });
		file.endTransaction();

		expect(() => file.byId(contextId)).toThrow();
		expect(() => file.byId(repId)).toThrow();
		expect(element.get("Representation")).toBeNull();

		file.undo();
		expect(file.byId(contextId).isA("IfcGeometricRepresentationContext")).toBe(true);
		expect(file.byId(repId).isA("IfcRepresentation")).toBe(true);
		expect((element.get("Representation") as EntityInstance).get("Representations")).toHaveLength(1);

		file.redo();
		expect(() => file.byId(contextId)).toThrow();
		expect(() => file.byId(repId)).toThrow();
		expect(element.get("Representation")).toBeNull();
	});
});

// `addContext` used with `removeContext` end-to-end (no Python counterpart) -- confirms
// the two functions in this chunk compose correctly, not just each in isolation.
describe.each(AVAILABLE_SCHEMAS)("api.context.addContext + removeContext round trip (%s)", (schema) => {
	test("a context added via addContext can be fully removed via removeContext, subcontexts included", () => {
		const file = blankFile(schema);
		file.createEntity("IfcProject");
		const context = addContext(file, { contextType: "Model" });
		addContext(file, { parent: context, contextIdentifier: "Body", targetView: "MODEL_VIEW" });
		addContext(file, { parent: context, contextIdentifier: "Axis", targetView: "GRAPH_VIEW" });

		expect(file.byType("IfcGeometricRepresentationSubContext").length).toBe(2);

		removeContext(file, { context });

		expect(file.byType("IfcGeometricRepresentationContext").length).toBe(0);
		expect(file.byType("IfcGeometricRepresentationSubContext").length).toBe(0);
		expect((file.byType("IfcProject")[0].get("RepresentationContexts") as unknown[] | null) ?? []).toHaveLength(0);
	});
});
