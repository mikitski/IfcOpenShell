// This file was generated with the assistance of an AI coding tool.
//
// Tests for this chunk's `Proxy` layer (planning/ifcopenshell-ts/10-architecture.md
// SS6): `wall.Name`-style dynamic property access, backed by `attributeCache.ts`'s
// cache. `test/attributeCache.test.ts` covers the cache's own correctness (the
// differential test `40-testing-strategy.md` SS5.5 requires); this file covers the
// Proxy's own dispatch behavior on top of it.

import { describe, expect, test } from "vitest";
import { EntityInstance } from "../src/entityInstance";
import type { IfcFile } from "../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "./bootstrap";

describe.each(AVAILABLE_SCHEMAS)("EntityInstance Proxy (%s)", (schema) => {
	function newFile(): IfcFile {
		return createTestFile(schema);
	}

	test("wall.Name = 'x' / wall.Name round-trips a STRING forward attribute", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		wall.Name = "My Wall";
		expect(wall.Name).toBe("My Wall");
		// Also observable via the explicit primitive escape hatch -- same underlying
		// storage, just reached two different ways.
		expect(wall.get("Name")).toBe("My Wall");
	});

	test("dynamic property set is observable via the explicit .get() escape hatch and vice versa", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		wall.set("Name", "Set via .set()");
		expect(wall.Name).toBe("Set via .set()");
		wall.Name = "Set via property";
		expect(wall.get("Name")).toBe("Set via property");
	});

	test("ENTITY_INSTANCE forward attribute round-trips through property access", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const ownerHistory = file.createEntity("IfcOwnerHistory");
		wall.OwnerHistory = ownerHistory;
		expect(wall.OwnerHistory).toBeInstanceOf(EntityInstance);
		expect((wall.OwnerHistory as EntityInstance).equals(ownerHistory)).toBe(true);
	});

	test("inverse attribute is readable via property access", () => {
		const file = newFile();
		const group = file.createEntity("IfcGroup");
		const wall = file.createEntity("IfcWall");
		const rel = file.createEntity("IfcRelAssignsToGroup");
		rel.RelatingGroup = group;
		rel.RelatedObjects = [wall];

		const inverse = group.IsGroupedBy as EntityInstance[];
		expect(inverse).toHaveLength(1);
		expect(inverse[0].equals(rel)).toBe(true);
	});

	test("getting an unknown attribute via property access throws (not silently undefined)", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		expect(() => {
			// biome-ignore lint/suspicious/noExplicitAny: deliberately accessing a nonexistent dynamic attribute name to exercise the error path.
			void (wall as any).NoSuchAttribute;
		}).toThrow(/has no attribute 'NoSuchAttribute'/);
	});

	test("setting an unknown attribute via property access throws with the same message as .set()", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		let viaProxy: unknown;
		try {
			// biome-ignore lint/suspicious/noExplicitAny: deliberately accessing a nonexistent dynamic attribute name to exercise the error path.
			(wall as any).NoSuchAttribute = 1;
		} catch (e) {
			viaProxy = e;
		}
		let viaSet: unknown;
		try {
			wall.set("NoSuchAttribute", 1);
		} catch (e) {
			viaSet = e;
		}
		expect(viaProxy).toBeInstanceOf(Error);
		expect((viaProxy as Error).message).toBe((viaSet as Error).message);
	});

	test("setting an INVERSE attribute via property access throws (inverse attributes are read-only)", () => {
		const file = newFile();
		const group = file.createEntity("IfcGroup");
		expect(() => {
			// biome-ignore lint/suspicious/noExplicitAny: exercising a real IFC inverse attribute name, which the Proxy must reject as a write target.
			(group as any).IsGroupedBy = [];
		}).toThrow();
	});

	test("real class members (file, id(), isA(), identity(), get(), set()) are unaffected by the Proxy", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		expect(wall.file).toBe(file);
		expect(wall.id()).toBeGreaterThan(0);
		expect(wall.isA()).toBe("IfcWall");
		expect(typeof wall.identity()).toBe("number");
		expect(typeof wall.get).toBe("function");
		expect(typeof wall.set).toBe("function");
	});

	test("instanceof EntityInstance holds through the Proxy (research/07's own explicit ask)", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		expect(wall).toBeInstanceOf(EntityInstance);
		expect(file.byId(wall.id())).toBeInstanceOf(EntityInstance);
		expect(file.byType("IfcWall")[0]).toBeInstanceOf(EntityInstance);
	});

	test("equals()/identity() still dispatch correctly through the Proxy (===  must never be used)", () => {
		const file = newFile();
		const created = file.createEntity("IfcWall");
		const viaById = file.byId(created.id());
		expect(viaById).not.toBe(created); // fresh wrapper per access, still true
		expect(viaById.equals(created)).toBe(true);
	});
});
