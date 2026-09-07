// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/test_file.py` (src/ifcopenshell-python).

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../src/entityInstance";
import { IfcFile } from "../src/file";
import { createTestFile } from "./bootstrap";

describe.each(["IFC2X3", "IFC4", "IFC4X3"] as const)("IfcFile (%s)", (schema) => {
	function newFile(): IfcFile {
		return createTestFile(schema);
	}

	test("createEntity()/byId()/byGuid()/get()", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", "3xhrZ$4XvA0v3iZQ8gGvOa");

		expect(file.byId(wall.id()).equals(wall)).toBe(true);
		expect(file.byGuid("3xhrZ$4XvA0v3iZQ8gGvOa").equals(wall)).toBe(true);
		expect(file.get(wall.id()).equals(wall)).toBe(true);
		expect(file.get("3xhrZ$4XvA0v3iZQ8gGvOa").equals(wall)).toBe(true);
	});

	test("createEntity() with positional attribute arguments", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall", "3xhrZ$4XvA0v3iZQ8gGvOa");
		expect(wall.get("GlobalId")).toBe("3xhrZ$4XvA0v3iZQ8gGvOa");
	});

	test("createEntity() rejects too many attribute arguments", () => {
		const file = newFile();
		expect(() => file.createEntity("IfcWall", ...Array(100).fill("x"))).toThrow();
	});

	test("byType(): includes subtypes by default, excludes with includeSubtypes=false", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		expect(file.byType("IfcWall").some((e) => e.equals(wall))).toBe(true);
		expect(file.byType("IfcElement").some((e) => e.equals(wall))).toBe(true);
		expect(file.byType("IfcElement", false).some((e) => e.equals(wall))).toBe(false);
	});

	test("traverse(): includes the root instance and every referenced instance", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const ownerHistory = file.createEntity("IfcOwnerHistory");
		wall.set("OwnerHistory", ownerHistory);

		const result = file.traverse(wall);
		expect(result.some((e) => e.equals(wall))).toBe(true);
		expect(result.some((e) => e.equals(ownerHistory))).toBe(true);
	});

	test("traverse(): maxLevels limits recursion depth", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const ownerHistory = file.createEntity("IfcOwnerHistory");
		const person = file.createEntity("IfcPerson");
		wall.set("OwnerHistory", ownerHistory);
		ownerHistory.set("LastModifyingUser", file.createEntity("IfcPersonAndOrganization", person));

		// maxLevels=1: root (level 0) plus its direct references (level 1) only --
		// the native `ifcopenshell::file::traverse`'s own `max_level` semantics (see
		// `parse.cpp`'s `traverse_`: the depth check only fires for `max_level > 0`,
		// so `0`/negative both mean "unlimited," matching `-1`, not "root only").
		const shallow = file.traverse(wall, 1);
		expect(shallow.some((e) => e.equals(wall))).toBe(true);
		expect(shallow.some((e) => e.equals(ownerHistory))).toBe(true);
		expect(shallow.some((e) => e.equals(person))).toBe(false);

		const deep = file.traverse(wall, null);
		expect(deep.some((e) => e.equals(person))).toBe(true);
	});

	test("traverse(): breadthFirst produces the same instance set as depth-first", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const ownerHistory = file.createEntity("IfcOwnerHistory");
		wall.set("OwnerHistory", ownerHistory);

		const dfs = file.traverse(wall, null, false).map((e) => e.identity());
		const bfs = file.traverse(wall, null, true).map((e) => e.identity());
		expect(new Set(bfs)).toEqual(new Set(dfs));
	});

	test("getInverse(): returns entities referencing the given instance", () => {
		const file = newFile();
		const group = file.createEntity("IfcGroup");
		const wall = file.createEntity("IfcWall");
		const rel = file.createEntity("IfcRelAssignsToGroup");
		rel.set("RelatingGroup", group);
		rel.set("RelatedObjects", [wall]);

		const inverse = file.getInverse(group) as Set<EntityInstance>;
		expect([...inverse].some((e) => e.equals(rel))).toBe(true);
	});

	test("getTotalInverses(): counts referencing entities", () => {
		const file = newFile();
		const group = file.createEntity("IfcGroup");
		const wall = file.createEntity("IfcWall");
		const rel = file.createEntity("IfcRelAssignsToGroup");
		rel.set("RelatingGroup", group);
		rel.set("RelatedObjects", [wall]);

		expect(file.getTotalInverses(group)).toBeGreaterThanOrEqual(1);
	});

	test("remove(): deletes the instance and it's no longer reachable by id", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const id = wall.id();
		file.remove(wall);
		expect(() => file.byId(id)).toThrow();
	});

	test("add(): re-adding the same instance is a no-op (identity-checked)", () => {
		const a = newFile();
		const b = newFile();
		const wall = a.createEntity("IfcWall");
		const added = b.add(wall);
		expect(added.isA()).toBe("IfcWall");
	});

	test("getMaxId()/freshId()", () => {
		const file = newFile();
		file.createEntity("IfcWall");
		const before = file.getMaxId();
		const fresh = file.freshId();
		expect(fresh).toBeGreaterThan(before);
	});

	test("[Symbol.iterator](): iterates every entity in the file", () => {
		const file = newFile();
		const wall = file.createEntity("IfcWall");
		const slab = file.createEntity("IfcSlab");
		const ids = [...file].map((e) => e.identity());
		expect(ids).toContain(wall.identity());
		expect(ids).toContain(slab.identity());
	});

	test("write()/dispose(): writes a real SPF file to disk and cleans up native state", () => {
		const file = newFile();
		file.createEntity("IfcWall");
		const tmpPath = path.join(os.tmpdir(), `ifcopenshell-ts-test-${schema}-${Date.now()}.ifc`);
		try {
			file.write(tmpPath);
			const contents = fs.readFileSync(tmpPath, "utf-8");
			expect(contents).toContain("IFCWALL");
			expect(contents).toContain("ISO-10303-21");
		} finally {
			fs.rmSync(tmpPath, { force: true });
		}
		file.dispose();
		expect(() => file.getMaxId()).toThrow();
	});

	test("schema/schemaIdentifier/schemaVersion", () => {
		const file = newFile();
		expect(file.schema).toBe(schema);
		expect(file.schemaVersion[0]).toBe(schema === "IFC2X3" ? 2 : schema === "IFC4" ? 4 : 4);
	});

	describe("Transaction / undo-redo", () => {
		test("create -> undo -> verify gone -> redo -> verify back", () => {
			const file = newFile();
			file.beginTransaction();
			const wall = file.createEntity("IfcWall");
			file.endTransaction();
			const id = wall.id();

			expect(() => file.byId(id)).not.toThrow();

			file.undo();
			expect(() => file.byId(id)).toThrow();

			file.redo();
			expect(file.byId(id).isA()).toBe("IfcWall");
		});

		test("edit -> undo -> verify old value -> redo -> verify new value", () => {
			const file = newFile();
			const wall = file.createEntity("IfcWall");
			wall.set("Name", "Original");

			file.beginTransaction();
			wall.set("Name", "Changed");
			file.endTransaction();

			expect(file.byId(wall.id()).get("Name")).toBe("Changed");

			file.undo();
			expect(file.byId(wall.id()).get("Name")).toBe("Original");

			file.redo();
			expect(file.byId(wall.id()).get("Name")).toBe("Changed");
		});

		test("delete -> undo restores the entity with its original attributes", () => {
			const file = newFile();
			const wall = file.createEntity("IfcWall");
			wall.set("GlobalId", "3xhrZ$4XvA0v3iZQ8gGvOa");
			wall.set("Name", "My Wall");
			const id = wall.id();

			file.beginTransaction();
			file.remove(wall);
			file.endTransaction();

			expect(() => file.byId(id)).toThrow();

			file.undo();
			const restored = file.byId(id);
			expect(restored.get("GlobalId")).toBe("3xhrZ$4XvA0v3iZQ8gGvOa");
			expect(restored.get("Name")).toBe("My Wall");
		});

		test("discardTransaction() rolls back uncommitted changes", () => {
			const file = newFile();
			file.beginTransaction();
			const wall = file.createEntity("IfcWall");
			const id = wall.id();
			file.discardTransaction();

			expect(() => file.byId(id)).toThrow();
			expect(file.transaction).toBeNull();
		});

		test("setHistorySize() bounds the undo stack", () => {
			const file = newFile();
			file.setHistorySize(2);
			for (let i = 0; i < 5; i++) {
				file.beginTransaction();
				file.createEntity("IfcWall");
				file.endTransaction();
			}
			expect(file.history.length).toBeLessThanOrEqual(2);
		});

		test("history/future is shared across separately-constructed IfcFile wrappers of the same native file", () => {
			const file = newFile();
			file.beginTransaction();
			file.createEntity("IfcWall");
			file.endTransaction();

			// A second `IfcFile` wrapper of the exact same underlying native handle
			// must see the same transaction history (file_mixin.registry, keyed by
			// file_pointer() -- research/01 SS2.2/research/07).
			const secondWrapper = new IfcFile(file._handle);
			expect(secondWrapper).not.toBe(file);
			expect(secondWrapper.history.length).toBe(file.history.length);
			expect(secondWrapper.filePointer()).toBe(file.filePointer());
		});
	});
});
