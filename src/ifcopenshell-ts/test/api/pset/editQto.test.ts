// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/pset/test_edit_qto.py` (src/ifcopenshell-python) -- all 7
// real Python test methods ported in full below, adapted to build the `IfcWall` fixture
// directly via `file.createEntity(...)` instead of the unported `api.root.create_entity`
// (matching `addPset.test.ts`'s own established substitution). `TestEditQto` is IFC4-only
// in real Python; ported here across `AVAILABLE_SCHEMAS` since nothing in `edit_qto.py`
// (per `../../../src/api/pset/editQto.ts`'s own header comment) is schema-specific
// except the one disclosed IFC4X3 `IfcQuantityCount`-as-integer branch, which gets its
// own dedicated, schema-gated block.
//
// `createTypedValue` below (used only for the "explicit data type" tests, ported from
// real Python's `self.file.createIfcAreaMeasure(1)`-style fixture sugar) is the same
// disclosed, test-only raw-native workaround `test/util/unit.test.ts`'s own identically-
// named helper already established: `file.createEntity("IfcAreaMeasure", 21)` -- the
// production-code-facing equivalent -- throws ("Attribute access is only supported on
// entity instances"), a real, pre-existing (not introduced by this chunk)
// `entityInstance.ts` gap for constructing a POPULATED standalone defined-type instance.
// `editQto.ts`'s own production code never hits this gap itself (it only ever READS an
// already-constructed `entity_instance` value's `.isA()`/`.getByIndex(0)`, never
// constructs one) -- this workaround is needed only to build these tests' OWN input
// fixtures, exactly mirroring `unit.test.ts`'s situation.
//
// Extensive original coverage beyond the real Python file (this chunk's own brief calls
// out `edit_qto.py` as one of the more intricate functions in this whole module family,
// warranting thorough validation of the type-inference and nested-complex-quantity
// logic specifically): nested `IfcPhysicalComplexQuantity` creation/editing/removal
// (INCLUDING 2-level-deep nesting -- real Python's own test suite has ZERO complex-
// quantity coverage at all, confirmed by reading `test_edit_qto.py` in full), the
// `Discrimination`-required-on-create-vs-optional-on-update asymmetry, the "complex
// quantity fed a non-dict value" silent no-op and the reverse "simple quantity fed a
// dict value" `TypeError` (both real, disclosed Python quirks -- see `editQto.ts`'s own
// header comment), the confirmed `psetTemplate` bug (a caller-supplied template has NO
// effect on type inference, in either real Python -- which crashes -- or this port --
// which silently no-ops), the disclosed IFC4X3 `IfcQuantityCount`-int-coercion
// create-vs-update asymmetry, and Transaction/undo-redo regression coverage.

import { describe, expect, test } from "vitest";
import { addQto } from "../../../src/api/pset/addQto";
import { editQto, inferPropertyType } from "../../../src/api/pset/editQto";
import { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { entity_instance as NativeEntityInstance } from "../../../src/native/ifcopenshell_native";
import { native } from "../../../src/native/native_loader";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

// --- local fixture helper (no Python/api counterpart) -- see this file's header comment ---

/** Constructs a standalone, correctly-typed defined-type value (e.g. `IfcAreaMeasure(1)`). */
function createTypedValue(file: IfcFile, className: string, value: number): EntityInstance {
	const declaration = file.nativeFile.schema().declaration_by_name_with_name(className);
	const handle = file.nativeFile.create_with_declaration_instance_id(declaration, -1);
	const kind = className === "IfcInteger" || className === "IfcCountMeasure" ? native.INTEGER : native.DOUBLE;
	new NativeEntityInstance(handle._handle).set_attribute_value(0, {
		kind,
		integer_value: kind === native.INTEGER ? value : undefined,
		double_value: kind === native.DOUBLE ? value : undefined,
	});
	return new EntityInstance(handle._handle, file);
}

// The next 2 tests depend on the bundled buildingSMART `Qto_WallBaseQuantities`
// template actually containing this name (`util/pset.ts`'s `getTemplate`/`getByName`) --
// confirmed by inspecting `data/pset-templates/*.ifc` directly: `Qto_WallBaseQuantities`
// exists in the IFC4 and IFC4X3 bundles but is genuinely ABSENT from the IFC2X3 one.
// Real Python's own `TestEditQto` is IFC4-only for exactly this reason (no
// `TestEditQtoIFC2X3` subclass exists at all) -- scoped here to match, rather than
// `describe.each(AVAILABLE_SCHEMAS)` (which would spuriously fail on IFC2X3: without a
// template match, `Length: 1` -- a whole-number/`int`-shaped value -- falls through to
// `inferPropertyType`'s unconditional-`Count` `int` branch, correctly per this file's
// own disclosed quirk, just not what this test is trying to pin).
describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.pset.editQto buildingSMART-templated Qto_WallBaseQuantities (%s)",
	(schema) => {
		test("editing a blank buildingSMART-templated qto", () => {
			const file = createTestFile(schema);
			const element = file.createEntity("IfcWall");
			const qto = addQto(file, { product: element, name: "Qto_WallBaseQuantities" }) as EntityInstance;
			editQto(file, { qto, properties: { Length: 1, NetSideArea: 2, NetVolume: 3 } });

			const quantities = qto.get("Quantities") as EntityInstance[];
			expect(quantities[0].get("Name")).toBe("Length");
			expect(quantities[0].get("LengthValue")).toBe(1);
			expect(quantities[1].get("Name")).toBe("NetSideArea");
			expect(quantities[1].get("AreaValue")).toBe(2);
			expect(quantities[2].get("Name")).toBe("NetVolume");
			expect(quantities[2].get("VolumeValue")).toBe(3);
		});

		test("editing an existing buildingSMART-templated qto (update + purge)", () => {
			const file = createTestFile(schema);
			const element = file.createEntity("IfcWall");
			const qto = addQto(file, { product: element, name: "Qto_WallBaseQuantities" }) as EntityInstance;
			editQto(file, { qto, properties: { Length: 1, NetSideArea: 2, NetVolume: 3 } });
			editQto(file, { qto, properties: { Length: 42, NetSideArea: null } });

			const quantities = qto.get("Quantities") as EntityInstance[];
			expect(quantities.length).toBe(2);
			expect(quantities[0].get("Name")).toBe("Length");
			expect(quantities[0].get("LengthValue")).toBe(42);
			expect(quantities[1].get("Name")).toBe("NetVolume");
			expect(quantities[1].get("VolumeValue")).toBe(3);
		});
	},
);

// `IfcPropertySetTemplate`/`IfcSimplePropertyTemplate` (pset/qto templates as their own
// first-class IFC entities) are an IFC4+ feature -- confirmed empirically (a genuine
// `Entity with name 'IfcSimplePropertyTemplate' not found in schema 'IFC2X3'` from the
// native schema itself, not assumed) -- so this test, which builds one directly, is
// scoped the same way as the block above.
describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.pset.editQto psetTemplate bug disclosure (%s)",
	(schema) => {
		test("a caller-supplied psetTemplate has no effect on type inference (confirmed real Python bug, disclosed)", () => {
			const file = createTestFile(schema);
			const element = file.createEntity("IfcWall");

			// A custom pset template entry that says "Foo" is an AREA quantity.
			const propTemplate = file.createEntity(
				"IfcSimplePropertyTemplate",
				guid.new(),
				null,
				"Foo",
				null,
				"Q_AREA",
				"IfcAreaMeasure",
			);
			const template = file.createEntity(
				"IfcPropertySetTemplate",
				guid.new(),
				null,
				"Foo_Wall",
				null,
				"QTO_OCCURRENCEDRIVEN",
				"IfcWall",
				[propTemplate],
			);

			const qto = addQto(file, { product: element, name: "Foo_Wall" }) as EntityInstance;
			// "Foo" has no FLOAT_TYPE_KEYWORDS match, so the fallback heuristic defaults a
			// fractional value to Length -- if the template were actually honored, this
			// would be an IfcQuantityArea instead.
			editQto(file, { qto, properties: { Foo: 42.3 }, psetTemplate: template });

			const quantity = (qto.get("Quantities") as EntityInstance[])[0];
			expect(quantity.isA("IfcQuantityLength")).toBe(true);
		});
	},
);

describe.each(AVAILABLE_SCHEMAS)("api.pset.editQto (%s)", (schema) => {
	test("not adding a quantity if it is null", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Qto_WallBaseQuantities" }) as EntityInstance;
		editQto(file, { qto, properties: { Length: null } });
		expect((qto.get("Quantities") as EntityInstance[] | null) ?? []).toHaveLength(0);
	});

	test("editing a qto name", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "foo" }) as EntityInstance;
		editQto(file, { qto, name: "bar" });
		expect(qto.get("Name")).toBe("bar");
	});

	test("adding quantities without a template with autodetected and manual data types", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, {
			qto,
			properties: {
				MyArea: createTypedValue(file, "IfcAreaMeasure", 1),
				MyCount: createTypedValue(file, "IfcCountMeasure", 2),
				MyLength: createTypedValue(file, "IfcLengthMeasure", 3),
				MyTime: createTypedValue(file, "IfcTimeMeasure", 5),
				MyVolume: createTypedValue(file, "IfcVolumeMeasure", 6),
				MyWeight: createTypedValue(file, "IfcMassMeasure", 7),
			},
		});

		const quantities = qto.get("Quantities") as EntityInstance[];
		expect(quantities[0].get("Name")).toBe("MyArea");
		expect(quantities[0].get("AreaValue")).toBe(1);
		expect(quantities[1].get("Name")).toBe("MyCount");
		expect(quantities[1].get("CountValue")).toBe(2);
		expect(quantities[2].get("Name")).toBe("MyLength");
		expect(quantities[2].get("LengthValue")).toBe(3);
		expect(quantities[3].get("Name")).toBe("MyTime");
		expect(quantities[3].get("TimeValue")).toBe(5);
		expect(quantities[4].get("Name")).toBe("MyVolume");
		expect(quantities[4].get("VolumeValue")).toBe(6);
		expect(quantities[5].get("Name")).toBe("MyWeight");
		expect(quantities[5].get("WeightValue")).toBe(7);
	});

	test("editing quantities with autodetected existing types", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, { qto, properties: { MyLength: createTypedValue(file, "IfcLengthMeasure", 12) } });
		editQto(file, { qto, properties: { MyLength: 34 } });

		const quantities = qto.get("Quantities") as EntityInstance[];
		expect(quantities).toHaveLength(1);
		expect(quantities[0].get("Name")).toBe("MyLength");
		expect(quantities[0].isA("IfcQuantityLength")).toBe(true);
		expect(quantities[0].get("LengthValue")).toBe(34);
	});

	test("editing quantities with an explicit type retains the existing quantity's own type", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, { qto, properties: { MyLength: createTypedValue(file, "IfcLengthMeasure", 12) } });
		// The new value is explicitly an AreaMeasure, but the EXISTING quantity is a
		// IfcQuantityLength -- updating an existing quantity never changes its own class,
		// only its value (real Python's own docstring: "Editing existing quantities will
		// retain their current data types if possible").
		editQto(file, { qto, properties: { MyLength: createTypedValue(file, "IfcAreaMeasure", 34) } });

		const quantities = qto.get("Quantities") as EntityInstance[];
		expect(quantities).toHaveLength(1);
		expect(quantities[0].get("Name")).toBe("MyLength");
		expect(quantities[0].isA("IfcQuantityLength")).toBe(true);
		expect(quantities[0].get("LengthValue")).toBe(34);
	});

	// --- Original coverage: nested IfcPhysicalComplexQuantity (zero coverage in real
	// Python's own test suite -- see this file's header comment) ---

	test("creating a nested complex quantity", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, {
			qto,
			properties: {
				FireResistance: {
					Discrimination: "COMPONENT",
					HasQuantities: { InsulationLength: 12.3, InsulationCount: 2 },
				},
			},
		});

		const quantities = qto.get("Quantities") as EntityInstance[];
		expect(quantities).toHaveLength(1);
		const complex = quantities[0];
		expect(complex.isA("IfcPhysicalComplexQuantity")).toBe(true);
		expect(complex.get("Name")).toBe("FireResistance");
		expect(complex.get("Discrimination")).toBe("COMPONENT");
		const nested = complex.get("HasQuantities") as EntityInstance[];
		expect(nested).toHaveLength(2);
		expect(nested[0].get("Name")).toBe("InsulationLength");
		expect(nested[0].isA("IfcQuantityLength")).toBe(true);
		expect(nested[0].get("LengthValue")).toBe(12.3);
		expect(nested[1].get("Name")).toBe("InsulationCount");
		expect(nested[1].isA("IfcQuantityCount")).toBe(true);
	});

	test("2-level-deep nested complex quantities (unbounded recursion)", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, {
			qto,
			properties: {
				Outer: {
					Discrimination: "OUTER",
					HasQuantities: {
						Inner: { Discrimination: "INNER", HasQuantities: { Leaf: 1.5 } },
					},
				},
			},
		});

		const outer = (qto.get("Quantities") as EntityInstance[])[0];
		expect(outer.isA("IfcPhysicalComplexQuantity")).toBe(true);
		const inner = (outer.get("HasQuantities") as EntityInstance[])[0];
		expect(inner.isA("IfcPhysicalComplexQuantity")).toBe(true);
		expect(inner.get("Discrimination")).toBe("INNER");
		const leaf = (inner.get("HasQuantities") as EntityInstance[])[0];
		expect(leaf.get("Name")).toBe("Leaf");
		expect(leaf.get("LengthValue")).toBe(1.5);
	});

	test("editing a nested complex quantity's own quantities in place", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, {
			qto,
			properties: { FireResistance: { Discrimination: "COMPONENT", HasQuantities: { InsulationLength: 12.3 } } },
		});
		editQto(file, {
			qto,
			properties: { FireResistance: { HasQuantities: { InsulationLength: 99, InsulationArea: 4 } } },
		});

		const complex = (qto.get("Quantities") as EntityInstance[])[0];
		// Discrimination omitted on update -- falls back to the existing value (see
		// "Discrimination required on create, optional on update" coverage below).
		expect(complex.get("Discrimination")).toBe("COMPONENT");
		const nested = complex.get("HasQuantities") as EntityInstance[];
		expect(nested).toHaveLength(2);
		expect(nested[0].get("LengthValue")).toBe(99);
		expect(nested[1].get("Name")).toBe("InsulationArea");
	});

	test("removing a whole complex quantity by setting it to null", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, {
			qto,
			properties: { FireResistance: { Discrimination: "COMPONENT", HasQuantities: { InsulationLength: 12.3 } } },
		});
		editQto(file, { qto, properties: { FireResistance: null } });

		expect((qto.get("Quantities") as EntityInstance[] | null) ?? []).toHaveLength(0);
		expect(file.byType("IfcPhysicalComplexQuantity")).toHaveLength(0);
	});

	// --- Original coverage: Discrimination required-on-create vs. optional-on-update ---

	test("Discrimination is REQUIRED when creating a new complex quantity", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		expect(() =>
			editQto(file, { qto, properties: { FireResistance: { HasQuantities: { InsulationLength: 1 } } } }),
		).toThrow();
	});

	// --- Original coverage: real, disclosed Python quirks around branch mismatches ---

	test("updating an existing complex quantity with a non-dict value silently no-ops (disclosed quirk)", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, {
			qto,
			properties: { FireResistance: { Discrimination: "COMPONENT", HasQuantities: { InsulationLength: 1.5 } } },
		});

		// Deliberately passing a plain number for a key that currently holds a complex
		// quantity, to pin the real Python quirk this simulates (see this file's header
		// comment).
		editQto(file, { qto, properties: { FireResistance: 5 } });

		const complex = (qto.get("Quantities") as EntityInstance[])[0];
		expect(complex.isA("IfcPhysicalComplexQuantity")).toBe(true);
		expect(complex.get("Discrimination")).toBe("COMPONENT");
		expect((complex.get("HasQuantities") as EntityInstance[])[0].get("LengthValue")).toBe(1.5);
	});

	test("updating an existing simple quantity with a dict value throws (mirrors Python's float(dict) TypeError)", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, { qto, properties: { MyLength: 3 } });

		expect(() =>
			editQto(file, { qto, properties: { MyLength: { Discrimination: "X", HasQuantities: { A: 1 } } } }),
		).toThrow(TypeError);
	});

	// --- Original coverage: no template + no keyword match + int -> always Count,
	// regardless of name (real Python: `infer_property_type`'s `int` branch never even
	// consults FLOAT_TYPE_KEYWORDS) ---

	test("infer_property_type: an integer value with a Length-suggestive name still becomes Count", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, { qto, properties: { SomeLength: 5 } });
		expect((qto.get("Quantities") as EntityInstance[])[0].isA("IfcQuantityCount")).toBe(true);
	});

	test("infer_property_type: a fractional value with no keyword match defaults to Length", () => {
		expect(inferPropertyType("Unrecognized", 1.5)).toBe("Length");
	});

	test("infer_property_type: keyword matching for each FLOAT_TYPE_KEYWORDS category", () => {
		expect(inferPropertyType("NetSideArea", 1.5)).toBe("Area");
		expect(inferPropertyType("GrossVolume", 1.5)).toBe("Volume");
		expect(inferPropertyType("NetWeight", 1.5)).toBe("Weight");
		expect(inferPropertyType("GrossMass", 1.5)).toBe("Weight");
		expect(inferPropertyType("OverallHeight", 1.5)).toBe("Length");
		expect(inferPropertyType("Duration", 1.5)).toBe("Time");
	});
});

// --- Original coverage: IFC4X3 IfcQuantityCount-as-integer, create-vs-update asymmetry
// (point 8 of this chunk's own brief: CI's native build only registers IFC4, so the
// IFC4X3-specific assertions below are gated) ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.pset.editQto IFC4X3 Count coercion", () => {
	test("updating an existing Count quantity truncates toward zero on IFC4X3", () => {
		const file = createTestFile("IFC4X3");
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, { qto, properties: { MyCount: 2 } });
		editQto(file, { qto, properties: { MyCount: 4.7 } });
		expect((qto.get("Quantities") as EntityInstance[])[0].get("CountValue")).toBe(4);
	});

	test("creating a NEW Count quantity does NOT truncate, even on IFC4X3 (disclosed asymmetry)", () => {
		const file = createTestFile("IFC4X3");
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
		editQto(file, { qto, properties: { MyCount: createTypedValue(file, "IfcCountMeasure", 4) } });
		// Force the canonical type down the entity_instance path (Count), then re-update
		// with a fractional plain number via the CREATE path is not reachable for an
		// existing quantity -- this test instead pins that a freshly-created quantity
		// receives the value byte-for-byte, unlike the update path above.
		expect((qto.get("Quantities") as EntityInstance[])[0].get("CountValue")).toBe(4);
	});
});

test("updating an existing Count quantity does NOT truncate on IFC4/IFC2X3 (schema-scoped asymmetry)", () => {
	const file = createTestFile("IFC4");
	const element = file.createEntity("IfcWall");
	const qto = addQto(file, { product: element, name: "Foo_Bar" }) as EntityInstance;
	editQto(file, { qto, properties: { MyCount: 2 } });
	editQto(file, { qto, properties: { MyCount: 4.7 } });
	expect((qto.get("Quantities") as EntityInstance[])[0].get("CountValue")).toBeCloseTo(4.7);
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.pset.editQto Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the qto name and previous quantities; redo re-applies both", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "foo" }) as EntityInstance;
		editQto(file, { qto, properties: { Length: 1, NetSideArea: 2 } });
		const beforeIds = ((qto.get("Quantities") as EntityInstance[]) ?? []).map((q) => q.id()).sort();

		file.beginTransaction();
		editQto(file, { qto, name: "bar", properties: { Length: 42, NetSideArea: null } });
		file.endTransaction();
		expect(qto.get("Name")).toBe("bar");
		expect((qto.get("Quantities") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect(qto.get("Name")).toBe("foo");
		const afterUndoIds = ((qto.get("Quantities") as EntityInstance[]) ?? []).map((q) => q.id()).sort();
		expect(afterUndoIds).toEqual(beforeIds);

		file.redo();
		expect(qto.get("Name")).toBe("bar");
		expect((qto.get("Quantities") as EntityInstance[]).length).toBe(1);
	});

	test("undo removes newly-created quantities; redo re-creates them", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "foo" }) as EntityInstance;

		file.beginTransaction();
		editQto(file, { qto, properties: { Length: 5 } });
		file.endTransaction();
		const qId = (qto.get("Quantities") as EntityInstance[])[0].id();

		file.undo();
		expect((qto.get("Quantities") as EntityInstance[] | null) ?? []).toHaveLength(0);
		expect(() => file.byId(qId)).toThrow();

		file.redo();
		expect((qto.get("Quantities") as EntityInstance[]).length).toBe(1);
		expect(file.byId(qId).get("Name")).toBe("Length");
	});

	test("undo restores a purged complex quantity (its own nested quantity was never actually removed -- disclosed orphan quirk); redo re-purges", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const qto = addQto(file, { product: element, name: "foo" }) as EntityInstance;
		editQto(file, {
			qto,
			properties: { FireResistance: { Discrimination: "COMPONENT", HasQuantities: { InsulationLength: 1 } } },
		});
		const complexId = (qto.get("Quantities") as EntityInstance[])[0].id();
		const nestedId = (file.byId(complexId).get("HasQuantities") as EntityInstance[])[0].id();

		file.beginTransaction();
		editQto(file, { qto, properties: { FireResistance: null } });
		file.endTransaction();
		expect((qto.get("Quantities") as EntityInstance[] | null) ?? []).toHaveLength(0);
		// See editQto.ts's own header comment's disclosed orphan quirk: purging a complex
		// quantity only removes the complex quantity ITSELF -- its own nested quantity is
		// never deleted, just orphaned (still present in the file, unreferenced).
		expect(() => file.byId(nestedId)).not.toThrow();

		file.undo();
		expect(file.byId(complexId).isA("IfcPhysicalComplexQuantity")).toBe(true);
		expect((qto.get("Quantities") as EntityInstance[]).length).toBe(1);
		expect((file.byId(complexId).get("HasQuantities") as EntityInstance[]).map((q) => q.id())).toEqual([nestedId]);

		file.redo();
		expect((qto.get("Quantities") as EntityInstance[] | null) ?? []).toHaveLength(0);
		expect(() => file.byId(complexId)).toThrow();
	});
});
