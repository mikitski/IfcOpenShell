// This file was generated with the assistance of an AI coding tool.
//
// Original, hand-rolled coverage for `src/express/runtimeShim.ts`'s Phase EX-1 port --
// real Python has no standalone test for this shim (always exercised indirectly
// through the generated `ifcopenshell/express/rules/*.py` files it's inlined into), so
// there is nothing to port from; every test below is derived directly from re-reading
// the real Python source (`IFC2X3.py`/`IFC4.py`/`IFC4X3.py`'s own first ~148 lines) and
// this port's own documented behavior, matching this project's established convention
// for shim-layer code with no dedicated real test (see e.g. `fm.ts`/`profiler.ts`'s own
// precedent, `PROGRESS.md`'s "Niche `util` modules" row).
//
// `createTypedValue` below is the same disclosed, test-only workaround already
// established in `test/util/unit.test.ts`/`test/util/element.test.ts` for constructing
// a standalone declared-type value instance (bypassing `EntityInstance.set`/`setByIndex`'s
// entity-only restriction by writing directly through the native layer) -- reused here,
// not reinvented, to exercise `typeOf`'s type-declaration branch and
// `expressLen`/`expressGetItem`'s "unwrap a standalone defined-type instance" branch
// against a REAL such instance -- this is exactly what empirically disproved this
// module's own first-draft doc comment claiming that unwrap branch would throw (see
// `runtimeShim.ts`'s `expressLen` doc comment for the corrected, verified finding).

import { describe, expect, test } from "vitest";
import { EntityInstance } from "../../src/entityInstance";
import * as subject from "../../src/express/runtimeShim";
import type { IfcFile } from "../../src/file";
import { entity_instance as NativeEntityInstance } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";
import { entityName, getSupertypes } from "../../src/util/schema";
import type { Schema } from "../bootstrap";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

function createTypedValue(file: IfcFile, className: string, value: number | string | boolean): EntityInstance {
	const declaration = file.nativeFile.schema().declaration_by_name_with_name(className);
	const handle = file.nativeFile.create_with_declaration_instance_id(declaration, -1);
	let variant: { kind: number; integer_value?: unknown; double_value?: unknown; string_value?: unknown };
	if (typeof value === "string") {
		variant = { kind: native.STRING, string_value: value };
	} else if (typeof value === "boolean") {
		variant = { kind: native.BOOL, integer_value: value ? 1 : 0 };
	} else {
		variant = { kind: native.DOUBLE, double_value: value };
	}
	new NativeEntityInstance(handle._handle).set_attribute_value(0, variant);
	return new EntityInstance(handle._handle, file);
}

function guid(seed: string): string {
	return seed.repeat(22).slice(0, 22);
}

// --- isIndeterminate ---

describe("express.isIndeterminate", () => {
	test("null and undefined are indeterminate (Python's None)", () => {
		expect(subject.isIndeterminate(null)).toBe(true);
		expect(subject.isIndeterminate(undefined)).toBe(true);
	});

	test("the INDETERMINATE sentinel is indeterminate", () => {
		expect(subject.isIndeterminate(subject.INDETERMINATE)).toBe(true);
	});

	test("ordinary falsy-but-real values are NOT indeterminate", () => {
		expect(subject.isIndeterminate(0)).toBe(false);
		expect(subject.isIndeterminate("")).toBe(false);
		expect(subject.isIndeterminate(false)).toBe(false);
		expect(subject.isIndeterminate([])).toBe(false);
		expect(subject.isIndeterminate(Number.NaN)).toBe(false);
	});

	test("ordinary truthy values are NOT indeterminate", () => {
		expect(subject.isIndeterminate(42)).toBe(false);
		expect(subject.isIndeterminate("value")).toBe(false);
		expect(subject.isIndeterminate({})).toBe(false);
	});
});

// --- nvl ---

describe("express.nvl", () => {
	test("Python: nvl(v, default) returns v when v is not indeterminate", () => {
		expect(subject.nvl(5, 99)).toBe(5);
		expect(subject.nvl("x", "y")).toBe("x");
		expect(subject.nvl(0, 99)).toBe(0);
		expect(subject.nvl(false, true)).toBe(false);
	});

	test("returns default for null/undefined/INDETERMINATE", () => {
		expect(subject.nvl(null, "fallback")).toBe("fallback");
		expect(subject.nvl(undefined, "fallback")).toBe("fallback");
		expect(subject.nvl(subject.INDETERMINATE, "fallback")).toBe("fallback");
	});
});

// --- exists ---

describe("express.exists", () => {
	test("Python: exists(v) for a non-callable is `not is_indeterminate(v)`", () => {
		expect(subject.exists(5)).toBe(true);
		expect(subject.exists(0)).toBe(true);
		expect(subject.exists("")).toBe(true);
		expect(subject.exists(null)).toBe(false);
		expect(subject.exists(undefined)).toBe(false);
		expect(subject.exists(subject.INDETERMINATE)).toBe(false);
	});

	test("a callable is invoked and checked for a non-null/undefined result", () => {
		expect(subject.exists(() => 5)).toBe(true);
		expect(subject.exists(() => 0)).toBe(true);
		expect(subject.exists(() => null)).toBe(false);
		expect(subject.exists(() => undefined)).toBe(false);
	});

	test("a RangeError thrown by the callable (this port's IndexError analog) is caught, returning false", () => {
		expect(
			subject.exists(() => {
				throw new RangeError("out of range");
			}),
		).toBe(false);
	});

	test("a non-RangeError thrown by the callable propagates, matching Python re-raising anything but IndexError", () => {
		expect(() =>
			subject.exists(() => {
				throw new TypeError("boom");
			}),
		).toThrow(TypeError);
	});
});

// --- expressLen / sizeof / hiIndex / bLength / loIndex ---

describe("express.expressLen", () => {
	test("string/array/Set/ExpressSet lengths", () => {
		expect(subject.expressLen("hello")).toBe(5);
		expect(subject.expressLen([1, 2, 3])).toBe(3);
		expect(subject.expressLen(new Set([1, 2, 3]))).toBe(3);
		expect(subject.expressLen(new subject.ExpressSet([1, 2, 3, 3]))).toBe(3);
	});

	test("empty aggregate has length 0 (not indeterminate)", () => {
		expect(subject.expressLen([])).toBe(0);
		expect(subject.expressLen(new Set())).toBe(0);
	});

	test("an indeterminate value returns INDETERMINATE, not a length", () => {
		expect(subject.expressLen(null)).toBe(subject.INDETERMINATE);
		expect(subject.expressLen(subject.INDETERMINATE)).toBe(subject.INDETERMINATE);
	});

	test("sizeof/hiIndex/bLength are the exact same function as expressLen (Python's three-way alias)", () => {
		expect(subject.sizeof).toBe(subject.expressLen);
		expect(subject.hiIndex).toBe(subject.expressLen);
		expect(subject.bLength).toBe(subject.expressLen);
	});

	describe.each(AVAILABLE_SCHEMAS)("%s -- standalone defined-type instance unwrap", (schema: Schema) => {
		test("expressLen unwraps a standalone entity_instance-wrapped defined type via its wrappedValue slot", () => {
			const file = createTestFile(schema);
			const label = createTypedValue(file, "IfcLabel", "hello world");
			expect(subject.isEntity(label)).toBe(false);
			expect(subject.expressLen(label)).toBe("hello world".length);
		});
	});
});

describe("express.loIndex", () => {
	test("Python: loindex = lambda x: 1 -- always 1, regardless of the argument", () => {
		expect(subject.loIndex([1, 2, 3])).toBe(1);
		expect(subject.loIndex([])).toBe(1);
		expect(subject.loIndex(null)).toBe(1);
		expect(subject.loIndex(subject.INDETERMINATE)).toBe(1);
	});
});

// --- expressRange ---

describe("express.expressRange", () => {
	test("1-argument form: range(stop)", () => {
		expect(subject.expressRange(5)).toEqual([0, 1, 2, 3, 4]);
		expect(subject.expressRange(0)).toEqual([]);
	});

	test("2-argument form: range(start, stop)", () => {
		expect(subject.expressRange(2, 6)).toEqual([2, 3, 4, 5]);
		expect(subject.expressRange(6, 2)).toEqual([]);
	});

	test("3-argument form: range(start, stop, step), including a negative step", () => {
		expect(subject.expressRange(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
		expect(subject.expressRange(10, 0, -2)).toEqual([10, 8, 6, 4, 2]);
	});

	test("a zero step throws, matching Python's own ValueError", () => {
		expect(() => subject.expressRange(0, 10, 0)).toThrow(RangeError);
	});

	test("Python: any indeterminate argument makes range() yield nothing at all", () => {
		expect(subject.expressRange(subject.INDETERMINATE)).toEqual([]);
		expect(subject.expressRange(0, null)).toEqual([]);
		expect(subject.expressRange(0, 10, undefined)).toEqual([]);
	});

	test("more than 3 arguments throws", () => {
		expect(() => subject.expressRange(0, 1, 2, 3)).toThrow(RangeError);
	});
});

// --- ExpressSet ---

describe("express.ExpressSet", () => {
	test("basic construction/has/size/toArray, and dedupes like a real set", () => {
		const set = new subject.ExpressSet([1, 2, 2, 3]);
		expect(set.size).toBe(3);
		expect(set.has(2)).toBe(true);
		expect(set.has(4)).toBe(false);
		expect(set.toArray()).toEqual([1, 2, 3]);
	});

	test("is iterable in insertion order (a disclosed, deterministic improvement over Python's hash order)", () => {
		const set = new subject.ExpressSet(["c", "a", "b"]);
		expect([...set]).toEqual(["c", "a", "b"]);
	});

	test("Python: express_set.__mul__/__rmul__ -- intersection", () => {
		const a = new subject.ExpressSet([1, 2, 3]);
		expect(a.multiply([2, 3, 4]).toArray()).toEqual([2, 3]);
		expect(a.multiply([]).toArray()).toEqual([]);
		expect(a.multiply([9]).toArray()).toEqual([]);
	});

	test("Python: express_set.__add__/__radd__ -- union, scalar RHS coerced to a singleton", () => {
		const a = new subject.ExpressSet([1, 2]);
		expect(a.plus(3).toArray()).toEqual([1, 2, 3]);
		expect(a.plus([3, 4]).toArray()).toEqual([1, 2, 3, 4]);
		// duplicates from either side dedupe, matching express_set's own set semantics.
		expect(a.plus(2).toArray()).toEqual([1, 2]);
		expect(a.plus(new Set([2, 5])).toArray()).toEqual([1, 2, 5]);
		expect(a.plus(new subject.ExpressSet([5, 6])).toArray()).toEqual([1, 2, 5, 6]);
	});

	test("Python: express_set.__getitem__ -- express_getitem(list(self), k, INDETERMINATE)", () => {
		const set = new subject.ExpressSet(["a", "b", "c"]);
		expect(set.getItem(0)).toBe("a");
		expect(set.getItem(2)).toBe("c");
		expect(set.getItem(-1)).toBe("c"); // negative-index wraparound, see expressGetItem's own tests.
		expect(set.getItem(99)).toBeNull(); // out of range -> null, not INDETERMINATE (see expressGetItem doc comment).
	});

	test("getItem on an empty set: index 0 is out of range for an empty aggregate, so it returns null", () => {
		const set = new subject.ExpressSet<string>();
		expect(set.getItem(0)).toBeNull();
	});
});

// --- expressGetItem ---

describe("express.expressGetItem", () => {
	test("a missing (null/undefined) aggregate returns the caller's own default", () => {
		expect(subject.expressGetItem(null, 0, subject.INDETERMINATE)).toBe(subject.INDETERMINATE);
		expect(subject.expressGetItem(undefined, 0, "fallback")).toBe("fallback");
	});

	test("an out-of-range index returns null -- NOT the caller's default (real, easily-missed asymmetry)", () => {
		expect(subject.expressGetItem([1, 2, 3], 5, subject.INDETERMINATE)).toBeNull();
		expect(subject.expressGetItem([1, 2, 3], 5, "fallback")).toBeNull();
	});

	test("1-based-to-0-based indexing boundary: index 0 is the first element, matching EXPRESS_ONE_BASED_INDEXING subtraction at real call sites", () => {
		const aggregate = ["first", "second", "third"];
		const firstIndex = 1 - subject.EXPRESS_ONE_BASED_INDEXING; // real generated call-site shape.
		expect(subject.expressGetItem(aggregate, firstIndex, null)).toBe("first");
		const lastIndex = aggregate.length - subject.EXPRESS_ONE_BASED_INDEXING;
		expect(subject.expressGetItem(aggregate, lastIndex, null)).toBe("third");
	});

	test("negative indices wrap around, matching Python's own aggr[idx] semantics (JS arrays do NOT do this natively)", () => {
		const aggregate = ["a", "b", "c"];
		expect(subject.expressGetItem(aggregate, -1, null)).toBe("c");
		expect(subject.expressGetItem(aggregate, -3, null)).toBe("a");
		expect(subject.expressGetItem(aggregate, -4, null)).toBeNull(); // still out of range after wraparound.
	});

	test("an empty aggregate: any index is out of range -> null", () => {
		expect(subject.expressGetItem([], 0, subject.INDETERMINATE)).toBeNull();
		expect(subject.expressGetItem([], -1, subject.INDETERMINATE)).toBeNull();
	});

	test("supports string and Set/ExpressSet aggregates too", () => {
		expect(subject.expressGetItem("abc", 1, null)).toBe("b");
		expect(subject.expressGetItem(new Set(["x", "y", "z"]), 2, null)).toBe("z");
		expect(subject.expressGetItem(new subject.ExpressSet(["p", "q"]), 0, null)).toBe("p");
	});

	describe.each(AVAILABLE_SCHEMAS)("%s -- standalone defined-type instance unwrap", (schema: Schema) => {
		test("unwraps a standalone entity_instance-wrapped defined type via its wrappedValue slot before indexing", () => {
			const file = createTestFile(schema);
			const label = createTypedValue(file, "IfcLabel", "hello");
			expect(subject.expressGetItem(label, 1, null)).toBe("e");
		});
	});
});

// --- expressGetAttr ---

describe.each(AVAILABLE_SCHEMAS)("express.expressGetAttr (%s)", (schema: Schema) => {
	test("a real, set forward attribute returns its value", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", guid("1"));
		wall.set("Name", "My Wall");
		expect(subject.expressGetAttr(wall, "Name", subject.INDETERMINATE)).toBe("My Wall");
	});

	test("an unset (null) optional attribute returns the default, NOT null -- real, documented behavior", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", guid("2"));
		// `Description` is never set -- genuinely `$`/absent.
		expect(subject.expressGetAttr(wall, "Description", subject.INDETERMINATE)).toBe(subject.INDETERMINATE);
	});

	test("an unknown attribute name falls back to the default rather than throwing", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", guid("3"));
		expect(subject.expressGetAttr(wall, "ThisAttributeDoesNotExist", "fallback")).toBe("fallback");
	});

	test("null/undefined aggr falls back to the default, matching Python's getattr(None, name, default)", () => {
		expect(subject.expressGetAttr(null, "Name", "fallback")).toBe("fallback");
		expect(subject.expressGetAttr(undefined, "Name", "fallback")).toBe("fallback");
	});

	test("INDETERMINATE aggr poison-propagates, ignoring name/default entirely", () => {
		expect(subject.expressGetAttr(subject.INDETERMINATE, "AnyName", "fallback")).toBe(subject.INDETERMINATE);
	});
});

// --- isEntity ---

describe.each(AVAILABLE_SCHEMAS)("express.isEntity (%s)", (schema: Schema) => {
	test("a real entity instance is an entity", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		expect(subject.isEntity(wall)).toBe(true);
	});

	test("a standalone defined-type instance is NOT an entity", () => {
		const file = createTestFile(schema);
		const label = createTypedValue(file, "IfcLabel", "x");
		expect(subject.isEntity(label)).toBe(false);
	});

	test("non-entity_instance values are never entities (Python: `return False` for anything else)", () => {
		expect(subject.isEntity(5)).toBe(false);
		expect(subject.isEntity("x")).toBe(false);
		expect(subject.isEntity(null)).toBe(false);
		expect(subject.isEntity(undefined)).toBe(false);
		expect(subject.isEntity({})).toBe(false);
	});
});

// --- usedIn ---

describe.each(AVAILABLE_SCHEMAS)("express.usedIn (%s)", (schema: Schema) => {
	test("null instance returns an empty array (Python: `if inst is None: return []`)", () => {
		expect(subject.usedIn(null, "ifc4.ifcrelassociates.relatedobjects")).toEqual([]);
		expect(subject.usedIn(undefined, "ifc4.ifcrelassociates.relatedobjects")).toEqual([]);
	});

	test("an instance with no inverses at all returns an empty array", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", guid("4"));
		expect(subject.usedIn(wall, "ifc4.ifcrelassociates.relatedobjects")).toEqual([]);
	});

	test("finds the real referencing instance via the named forward attribute", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", guid("5"));
		const material = file.createEntity("IfcMaterial");
		material.set("Name", "Concrete");
		const rel = file.createEntity("IfcRelAssociatesMaterial");
		rel.set("GlobalId", guid("6"));
		rel.set("RelatedObjects", [wall]);
		rel.set("RelatingMaterial", material);

		const result = subject.usedIn(wall, "ifc4.ifcrelassociates.relatedobjects");
		expect(result).toHaveLength(1);
		expect(result[0].identity()).toBe(rel.identity());
	});

	test("attribute-name matching is case-insensitive but exact on the trailing component", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", guid("7"));
		const rel = file.createEntity("IfcRelAssociatesMaterial");
		rel.set("GlobalId", guid("8"));
		rel.set("RelatedObjects", [wall]);
		rel.set("RelatingMaterial", file.createEntity("IfcMaterial"));

		expect(subject.usedIn(wall, "IFC4.IFCRELASSOCIATES.RELATEDOBJECTS")).toHaveLength(1);
		expect(subject.usedIn(wall, "ifc4.ifcrelassociates.relatingmaterial")).toEqual([]);
	});

	test("a malformed ref_name (not exactly 3 dot-separated parts) throws", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		wall.set("GlobalId", guid("9"));
		expect(() => subject.usedIn(wall, "not.enough")).toThrow();
		expect(() => subject.usedIn(wall, "too.many.parts.here")).toThrow();
	});
});

// --- typeOf ---

describe("express.typeOf", () => {
	test("null/undefined instance returns an empty ExpressSet (Python: `if not inst: return express_set([])`)", () => {
		expect(subject.typeOf(null).toArray()).toEqual([]);
		expect(subject.typeOf(undefined).toArray()).toEqual([]);
	});

	describe.each(AVAILABLE_SCHEMAS)("%s -- entity branch", (schema: Schema) => {
		test("matches the independently-computed supertype chain (getSupertypes, a separately-implemented, pre-existing utility)", () => {
			const file = createTestFile(schema);
			const wall = file.createEntity("IfcWall");
			const wallEntity = wall.declaration().as_entity();
			expect(wallEntity).not.toBeNull();
			// biome-ignore lint/style/noNonNullAssertion: narrowed by the assertion above.
			const entity = wallEntity!;
			const schemaName = wall.declaration().schema().name().toLowerCase();
			const expected = [entityName(entity), ...getSupertypes(entity).map(entityName)].map(
				(name) => `${schemaName}.${name.toLowerCase()}`,
			);

			const actual = subject.typeOf(wall).toArray();
			expect(actual).toEqual(expected);
			expect(actual[0]).toBe(`${schemaName}.ifcwall`);
			// `IfcRoot` is the real, schema-wide topmost supertype for every schema this
			// port targets -- the walk's own last-yielded name should always land there.
			expect(actual[actual.length - 1]).toBe(`${schemaName}.ifcroot`);
		});
	});

	describe.each(AVAILABLE_SCHEMAS)("%s -- type-declaration branch", (schema: Schema) => {
		test("a standalone defined-type instance's typeOf() starts with its own declared type name", () => {
			const file = createTestFile(schema);
			const label = createTypedValue(file, "IfcLabel", "x");
			const schemaName = label.declaration().schema().name().toLowerCase();
			const names = subject.typeOf(label).toArray();
			expect(names[0]).toBe(`${schemaName}.ifclabel`);
		});
	});
});
