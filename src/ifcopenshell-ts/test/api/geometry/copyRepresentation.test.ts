// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_copy_representation.py` (src/ifcopenshell-
// python, `TestCopyRepresentation`/`TestCopyRepresentationIFC2X3`), run against every
// schema this build has registered (`AVAILABLE_SCHEMAS`, see `../../bootstrap.ts`'s own
// header comment).
//
// **Fixture adaptation, disclosed**: the real Python `_add_body_rep` helper builds its
// representation via `ifcopenshell.api.geometry.add_wall_representation` (a full
// swept-area-solid wall body builder) -- NOT ported, out of this chunk's own 8-file
// scope. This port's own `addBodyRep` below builds a minimal, but structurally
// equivalent, `"Body"` `IfcShapeRepresentation` (a single `IfcBlock` item) instead --
// `copyRepresentation` itself never inspects the representation's own item classes, so
// this substitution doesn't change anything this test suite actually exercises. The
// real Python `_body_context` helper (reuse-an-existing-"Body"-context-or-create-one)
// is ported directly using this project's own already-landed `api.context.addContext`
// (not hand-rolled `createEntity` calls -- `addContext.ts`'s own header comment
// discloses a real, load-bearing `IfcGeometricRepresentationSubContext` positional-
// argument gotcha that would be easy to silently get wrong by re-deriving it here).

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { assignRepresentation } from "../../../src/api/geometry/assignRepresentation";
import { copyRepresentation } from "../../../src/api/geometry/copyRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { getContext, getRepresentation } from "../../../src/util/representation";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Python: `TestCopyRepresentation._body_context`. */
function bodyContext(file: IfcFile): EntityInstance {
	const existing = getContext(file, "Model", "Body", "MODEL_VIEW");
	if (existing) return existing;
	const model = addContext(file, { contextType: "Model" });
	return addContext(file, { contextType: "Model", contextIdentifier: "Body", targetView: "MODEL_VIEW", parent: model });
}

/** Python: `TestCopyRepresentation._add_body_rep` -- see this file's header comment for
 * why this builds a minimal `IfcBlock`-based body instead of a real wall solid. */
function addBodyRep(file: IfcFile, element: EntityInstance): EntityInstance {
	const body = bodyContext(file);
	const position = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0]));
	const item = file.createEntity("IfcBlock", position, 5, 0.2, 3);
	const rep = file.createEntity("IfcShapeRepresentation", body, "Body", "CSG", [item]);
	assignRepresentation(file, { product: element, representation: rep });
	return rep;
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.copyRepresentation (%s)", (schema) => {
	test("copy to empty target", () => {
		const file = createTestFile(schema);
		const wallA = file.createEntity("IfcWall");
		const wallB = file.createEntity("IfcWall");
		addBodyRep(file, wallA);

		const result = copyRepresentation(file, { source: wallA, target: wallB });

		expect(result).toBeDefined();
		expect((result as EntityInstance).isA("IfcShapeRepresentation")).toBe(true);
		const targetRep = getRepresentation(wallB, "Model", "Body");
		expect(targetRep).not.toBeNull();
		expect((targetRep as EntityInstance).equals(result as EntityInstance)).toBe(true);
	});

	test("source rep entities are distinct", () => {
		const file = createTestFile(schema);
		const wallA = file.createEntity("IfcWall");
		const wallB = file.createEntity("IfcWall");
		const sourceRep = addBodyRep(file, wallA);

		const newRep = copyRepresentation(file, { source: wallA, target: wallB }) as EntityInstance;

		expect(newRep.id()).not.toBe(sourceRep.id());
		const newItems = newRep.get("Items") as EntityInstance[];
		const sourceItems = sourceRep.get("Items") as EntityInstance[];
		expect((newItems[0] as EntityInstance).id()).not.toBe((sourceItems[0] as EntityInstance).id());
	});

	test("context is shared not copied", () => {
		const file = createTestFile(schema);
		const wallA = file.createEntity("IfcWall");
		const wallB = file.createEntity("IfcWall");
		const sourceRep = addBodyRep(file, wallA);

		const newRep = copyRepresentation(file, { source: wallA, target: wallB }) as EntityInstance;

		expect((newRep.get("ContextOfItems") as EntityInstance).id()).toBe(
			(sourceRep.get("ContextOfItems") as EntityInstance).id(),
		);
	});

	test("replaces existing target rep", () => {
		const file = createTestFile(schema);
		const wallA = file.createEntity("IfcWall");
		const wallB = file.createEntity("IfcWall");
		addBodyRep(file, wallA);
		const oldRep = addBodyRep(file, wallB);
		const oldRepId = oldRep.id();

		copyRepresentation(file, { source: wallA, target: wallB });

		expect(() => file.byId(oldRepId)).toThrow();
	});

	test("source unchanged after copy", () => {
		const file = createTestFile(schema);
		const wallA = file.createEntity("IfcWall");
		const wallB = file.createEntity("IfcWall");
		const sourceRep = addBodyRep(file, wallA);
		const sourceRepId = sourceRep.id();

		copyRepresentation(file, { source: wallA, target: wallB });

		expect(file.byId(sourceRepId)).toBeDefined();
		expect(getRepresentation(wallA, "Model", "Body")).not.toBeNull();
	});

	test("returns undefined when no matching rep", () => {
		const file = createTestFile(schema);
		const wallA = file.createEntity("IfcWall");
		const wallB = file.createEntity("IfcWall");

		const result = copyRepresentation(file, { source: wallA, target: wallB });

		expect(result).toBeUndefined();
	});

	test("custom context identifier", () => {
		const file = createTestFile(schema);
		const wallA = file.createEntity("IfcWall");
		const wallB = file.createEntity("IfcWall");
		addBodyRep(file, wallA);

		// "Axis" doesn't exist on wallA, so should return undefined.
		const result = copyRepresentation(file, { source: wallA, target: wallB, contextIdentifier: "Axis" });

		expect(result).toBeUndefined();
	});
});
