// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/test_file.py` (src/ifcopenshell-python).

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../src/entityInstance";
import { IfcFile } from "../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "./bootstrap";

describe.each(AVAILABLE_SCHEMAS)("IfcFile (%s)", (schema) => {
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

	// Regression coverage for the `TODOS.md` gate this chunk fixes ("EntityInstance
	// .setByIndex`/`IfcFile.createEntity` cannot write an initial value into a freshly
	// created simple/defined-type instance"). Before this fix, every case in this
	// block threw "Attribute access is only supported on entity instances" --
	// `attribute_value_shim.cpp`'s `entity_declaration_of` unconditionally required
	// `instance.declaration().as_entity()`, with no fallback for a bare
	// `type_declaration`-declared instance (a standalone `IfcLabel`/`IfcDuration`/
	// `IfcLineIndex`/etc., constructed on its own with no owning entity/attribute).
	describe("createEntity() on a standalone simple/defined-type instance (TODOS.md: EntityInstance.setByIndex/IfcFile.createEntity gate)", () => {
		test("scalar defined type: construct WITH an initial value round-trips", () => {
			const file = newFile();
			const label = file.createEntity("IfcLabel", "hello");
			expect(label.id()).toBe(0); // loose, not-yet-attached value -- matches real Python
			expect(label.getByIndex(0)).toBe("hello");
			expect(label.attributeType(0)).toBe("STRING");
		});

		test("scalar defined type: construct bare, then mutate via setByIndex", () => {
			const file = newFile();
			const label = file.createEntity("IfcLabel");
			label.setByIndex(0, "world");
			expect(label.getByIndex(0)).toBe("world");
		});

		// `IfcDuration` is IFC4+-only (confirmed against the real schema headers --
		// `SCHEMA_HAS_IfcDuration` is undefined for IFC2X3), matching this entry's own
		// `assignLagTime.test.ts` precedent for schema-gating a real-typed-but-not-
		// universal defined type.
		test.skipIf(schema === "IFC2X3")("a real (non-IfcLabel) STRING-backed defined type round-trips both ways", () => {
			const file = newFile();
			const durationCreated = file.createEntity("IfcDuration", "P1D");
			expect(durationCreated.getByIndex(0)).toBe("P1D");

			const durationMutated = file.createEntity("IfcDuration");
			durationMutated.setByIndex(0, "P2D");
			expect(durationMutated.getByIndex(0)).toBe("P2D");
		});

		// `IfcLineIndex` (`LIST [2:?] OF IfcPositiveInteger`, confirmed against the
		// generated schema source) is IFC4+-only (no `SCHEMA_HAS_IfcLineIndex` on
		// IFC2X3) -- an AGGREGATE-kind defined type, not just a scalar one, exercising
		// `attribute_kind_of`'s `ATTRIBUTE_VALUE_KIND_AGGREGATE`/
		// `Argument_AGGREGATE_OF_INT` path through the same new `type_declaration`
		// fallback.
		test.skipIf(schema === "IFC2X3")("an aggregate (LIST-typed) defined type round-trips both ways", () => {
			const file = newFile();
			const lineIndexCreated = file.createEntity("IfcLineIndex", [1, 2]);
			expect(lineIndexCreated.getByIndex(0)).toEqual([1, 2]);
			expect(lineIndexCreated.attributeType(0)).toBe("AGGREGATE OF INT");

			const lineIndexMutated = file.createEntity("IfcLineIndex");
			lineIndexMutated.setByIndex(0, [3, 4, 5]);
			expect(lineIndexMutated.getByIndex(0)).toEqual([3, 4, 5]);
		});

		test("attribute index 1 (out of range for a bare simple/defined-type instance, which only ever has index 0) still throws, matching the existing entity out-of-range behavior", () => {
			const file = newFile();
			const label = file.createEntity("IfcLabel", "x");
			expect(() => label.setByIndex(1, "y")).toThrow();
			expect(() => label.attributeType(1)).toThrow();
		});

		// Scope boundary this chunk deliberately does NOT change: a bare
		// select_type-declared instance (e.g. `IfcValue`, an abstract SELECT with no
		// `declared_type`) still throws exactly as before -- in fact even earlier than
		// this gate, at `create_with_declaration_instance_id` itself ("Requires and
		// entity or type declaration"), confirming there is no reachable bare
		// select_type/enumeration_type instance this fix needed to (or did) touch.
		test("a bare select_type-declared instance (e.g. IfcValue) is still rejected, unaffected by this fix", () => {
			const file = newFile();
			expect(() => file.createEntity("IfcValue")).toThrow();
		});
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
