// This file was generated with the assistance of an AI coding tool.
//
// Phase 1 exit criterion (planning/ifcopenshell-ts/20-roadmap.md): every primitive is
// callable from TS with correct types; create an IfcWall, set/get every attribute-type
// category once, read it back via schema introspection.

import { describe, expect, test } from "vitest";
import {
	type declaration as Declaration,
	entity_instance as EntityInstance,
	file as File,
} from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";

// `file`'s facade class only wraps the maximal-arity overload of each of its 3
// constructor families (emit_typescript_facade doesn't (yet) support C++ default
// arguments the way the Python facade does -- a disclosed, bounded gap, not fixed in
// this PR), and the maximal arity for the schema-based family requires a `logger`
// handle that has no way to be constructed at all (`ifcopenshell::logger` has a
// deleted copy/move constructor, so it's excluded from the generated constructor set
// entirely -- see napi_binding.py's `no_constructors` config). The shorter-arity
// native function (`file_new()`, using every C++ default including the logger) is
// still fully generated and callable -- this is exactly how Phase 0's own smoke test
// opened a file, just via the raw function instead of the class wrapper. The facade
// class's own (fully public, despite the `@internal` JSDoc tag) constructor accepts
// an already-native handle directly, so wrapping one obtained this way is legitimate.
function openBlankIfc4File(): File {
	return new File(native.file_new());
}

describe("Phase 1 primitive layer", () => {
	test("fresh wrapper per access: N-API mints a new JS object each call, not a stable identity per native pointer", () => {
		const file = openBlankIfc4File();
		const schemaA = file.schema();
		const schemaB = file.schema();
		expect(schemaA).not.toBe(schemaB);
		expect(schemaA.name()).toBe(schemaB.name());
		expect(schemaA.name()).toBe("IFC4");
	});

	test("creates an IfcWall, sets/gets every attribute-type category once, reads it back via schema introspection", () => {
		const file = openBlankIfc4File();
		const schema = file.schema();
		const wallDeclaration = schema.declaration_by_name_with_name("IfcWall");
		const wall = file.create_with_declaration_instance_id(wallDeclaration, -1);

		// Schema introspection: the primitive schema-metadata surface Phase 10's
		// validate.py port and Phase 3/4's util modules will consult directly.
		const wallEntity = wallDeclaration.as_entity();
		expect(wallEntity.attribute_count()).toBe(9);
		expect(wallEntity.attribute_by_index(0).name()).toBe("GlobalId");

		// STRING
		wall.set_attribute_value(0, { kind: native.STRING, string_value: "3xhrZ$4XvA0v3iZQ8gGvOa" });
		expect(wall.get_attribute_value(0)).toBe("3xhrZ$4XvA0v3iZQ8gGvOa");

		// ENTITY_INSTANCE
		const ownerHistoryDeclaration = schema.declaration_by_name_with_name("IfcOwnerHistory");
		const ownerHistory = file.create_with_declaration_instance_id(ownerHistoryDeclaration, -1);
		// Unlike an ordinary method parameter (unwrapped to `._handle` automatically by
		// the generated facade), a handle nested *inside* a variant literal like this one
		// is passed through as-is -- `IfcopenshellAttributeValueVariantT`'s `entity_value`
		// field is loosely typed `unknown` precisely because the variant shape is
		// data-driven, not per-field generated, so the facade has no per-field knowledge
		// to unwrap it automatically. A documented, disclosed rough edge of the primitive
		// layer's ergonomics -- Phase 2's mixin/Proxy layer is where this gets smoothed
		// over, not this PR's scope.
		wall.set_attribute_value(1, { kind: native.ENTITY_INSTANCE, entity_value: ownerHistory._handle });
		// Symmetrically, the GET direction hands back the raw native external for an
		// ENTITY_INSTANCE-kind value (matching Python's `get_argument` ergonomics: a
		// plain value, here "plain" meaning "the native handle," since the facade's
		// variant return type can't statically know to wrap it in a particular class) --
		// wrap it in the facade class explicitly to call typed methods on it.
		const readBackOwnerHistory = new EntityInstance(wall.get_attribute_value(1));
		expect(readBackOwnerHistory.identity()).toBe(ownerHistory.identity());

		// ENUMERATION
		wall.set_attribute_value(8, { kind: native.ENUMERATION, string_value: "NOTDEFINED" });
		expect(wall.get_attribute_value(8)).toBe("NOTDEFINED");

		// NULL (unset)
		wall.set_attribute_value(2, { kind: native.NULL });
		expect(wall.get_attribute_value(2)).toBeNull();

		// entity_instance primitives that only exist as SWIG %extend glue in Python
		// (research/01-python-core-and-lowlevel.md SS5 point 3) -- hand-written shim
		// free functions here (attribute_value_shim.h/.cpp), not real C++ methods.
		expect(wall.get_argument_index("GlobalId")).toBe(0);
		expect(wall.attribute_name(0)).toBe("GlobalId");
		expect(wall.attribute_type(0)).toBe("STRING");
		expect(wall.get_attribute_category("GlobalId")).toBe(1); // forward
		expect(wall.get_attribute_category("NoSuchAttribute")).toBe(0); // invalid
		expect(wall.is_a("IfcWall")).toBe(true);
		expect(wall.is_a("IfcElement")).toBe(true); // supertype
		expect(wall.is_a("IfcDoor")).toBe(false);

		// Bulk attribute-value fetch (get_all_attribute_values) -- the disclosed,
		// narrower stand-in for Python's fully-recursive get_info_cpp.
		const allValues = wall.get_all_attribute_values() as unknown[];
		expect(allValues).toHaveLength(9);
		expect(allValues[0]).toBe("3xhrZ$4XvA0v3iZQ8gGvOa");
		expect(allValues[8]).toBe("NOTDEFINED");
	});

	test("BOOL, INTEGER, DOUBLE, LOGICAL, BINARY, and AGGREGATE (1- and 2-level) round-trip on real schema attributes", () => {
		const file = openBlankIfc4File();
		const schema = file.schema();
		function instanceOf(className: string): EntityInstance {
			const decl = schema.declaration_by_name_with_name(className);
			return file.create_with_declaration_instance_id(decl, -1);
		}

		const texture = instanceOf("IfcPixelTexture");
		texture.set_attribute_value(0, { kind: native.BOOL, integer_value: 1 }); // RepeatS
		expect(texture.get_attribute_value(0)).toBe(true);
		texture.set_attribute_value(5, { kind: native.INTEGER, integer_value: 42 }); // Width
		expect(texture.get_attribute_value(5)).toBe(42);

		const profile = instanceOf("IfcAsymmetricIShapeProfileDef");
		profile.set_attribute_value(3, { kind: native.DOUBLE, double_value: 12.5 }); // BottomFlangeWidth
		expect(profile.get_attribute_value(3)).toBe(12.5);

		const curve = instanceOf("IfcBoundaryCurve");
		curve.set_attribute_value(1, { kind: native.LOGICAL, logical_value: 1 }); // SelfIntersect, TRUE
		expect(curve.attribute_kind_of(1)).toBe(native.LOGICAL);

		const blobTexture = instanceOf("IfcBlobTexture");
		blobTexture.set_attribute_value(6, { kind: native.BINARY, string_value: "0101" }); // RasterCode
		expect(blobTexture.get_attribute_value(6)).toBe("0101");

		// AGGREGATE, 1-level (of DOUBLE): IfcCartesianPoint.Coordinates
		const point = instanceOf("IfcCartesianPoint");
		point.set_attribute_value(0, {
			kind: native.AGGREGATE,
			aggregate_value: [
				{ kind: native.DOUBLE, double_value: 1 },
				{ kind: native.DOUBLE, double_value: 2 },
				{ kind: native.DOUBLE, double_value: 3 },
			],
		});
		expect(point.get_attribute_value(0)).toEqual([1, 2, 3]);

		// AGGREGATE, 2-level (of DOUBLE): IfcCartesianPointList3D.CoordList
		const pointList = instanceOf("IfcCartesianPointList3D");
		pointList.set_attribute_value(0, {
			kind: native.AGGREGATE,
			aggregate_value: [
				{
					kind: native.AGGREGATE,
					aggregate_value: [
						{ kind: native.DOUBLE, double_value: 1 },
						{ kind: native.DOUBLE, double_value: 2 },
						{ kind: native.DOUBLE, double_value: 3 },
					],
				},
				{
					kind: native.AGGREGATE,
					aggregate_value: [
						{ kind: native.DOUBLE, double_value: 4 },
						{ kind: native.DOUBLE, double_value: 5 },
						{ kind: native.DOUBLE, double_value: 6 },
					],
				},
			],
		});
		expect(pointList.get_attribute_value(0)).toEqual([
			[1, 2, 3],
			[4, 5, 6],
		]);
	});

	test("declaration.as_entity() safely downcasts a generic declaration handle", () => {
		const file = openBlankIfc4File();
		const schema = file.schema();
		const wallDeclaration: Declaration = schema.declaration_by_name_with_name("IfcWall");
		const entity = wallDeclaration.as_entity();
		expect(entity).not.toBeNull();
		expect(entity.attribute_count()).toBeGreaterThan(0);
	});
});
