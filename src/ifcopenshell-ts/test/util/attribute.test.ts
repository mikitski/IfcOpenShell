// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_attribute.py` (src/ifcopenshell-python). Python's
// own suite hard-codes `ifcopenshell.schema_by_name("IFC4")` (not parameterized across
// schema versions at all) -- mirrored here via a single `describe.skipIf` gated on
// `AVAILABLE_SCHEMAS.includes("IFC4")` (CI's core build is `SCHEMA_VERSIONS=4`, so this
// always runs there, but per this project's own established rule -- see
// `planning/ifcopenshell-ts/PROGRESS.md`'s "Current focus" -- never hard-code a schema
// string directly in a `describe`/`test` call).
//
// `TestGetPrimitiveType` and `TestGetEnumItems` below assert this port's *actual*,
// disclosed behavior, not a blind mirror of Python's expected values -- see
// `src/util/attribute.ts`'s own header comment for the full investigation. Two real,
// verified (not assumed) N-API primitive-layer gaps mean this TS port cannot fully
// match Python here:
//   - `getPrimitiveType`: the terminal scalar `simple_type` kind (real/integer/
//     boolean/string/binary/logical) can't be distinguished (`simple_type
//     ::declared_type()` has no N-API binding) -- `OverallHeight` (float in Python)
//     and `Description` (string in Python) both resolve to `null` here, a real,
//     disclosed divergence, tested explicitly below rather than hidden.
//   - `getEnumItems`: there is no *forward* enum-item-name lookup on this primitive
//     surface at all (`enumeration_type::enumeration_items()` has no N-API binding)
//     -- this throws a clear, disclosed error instead of fabricating a wrong list.
// `getSelectItems` and the entity/enum *classification* branches of `getPrimitiveType`
// are fully portable and match Python exactly (verified below).

import { describe, expect, test } from "vitest";
import type { attribute as NativeAttribute } from "../../src/native/ifcopenshell_native";
import * as subject from "../../src/util/attribute";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

function getAttr(className: string, attrName: string): NativeAttribute {
	const file = createTestFile("IFC4");
	const entity = file.nativeFile.schema().declaration_by_name_with_name(className).as_entity();
	if (entity === null) {
		throw new Error(`${className} is not an entity in IFC4`);
	}
	const attribute = entity.all_attributes().find((a) => a.name() === attrName);
	if (!attribute) {
		throw new Error(`${className}.${attrName} not found in IFC4`);
	}
	return attribute;
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("util.attribute", () => {
	describe("getPrimitiveType", () => {
		test("classifies an entity-typed attribute correctly (matches Python)", () => {
			expect(subject.getPrimitiveType(getAttr("IfcRelVoidsElement", "RelatingBuildingElement"))).toBe("entity");
		});

		test("classifies a real enumeration-typed attribute correctly (matches Python)", () => {
			expect(subject.getPrimitiveType(getAttr("IfcPostalAddress", "Purpose"))).toBe("enum");
		});

		test("cannot classify a real (float)-typed attribute -- disclosed gap, diverges from Python's 'float'", () => {
			// Python: subject.get_primitive_type(getattr_("IfcWindow", "OverallHeight")) == "float"
			expect(subject.getPrimitiveType(getAttr("IfcWindow", "OverallHeight"))).toBeNull();
		});

		test("cannot classify a string-typed attribute -- disclosed gap, diverges from Python's 'string'", () => {
			// Python: subject.get_primitive_type(getattr_("IfcPostalAddress", "Description")) == "string"
			expect(subject.getPrimitiveType(getAttr("IfcPostalAddress", "Description"))).toBeNull();
		});

		test("classifies a list-of-string attribute as ('list', null) -- the outer shape matches Python's ('list', ...), the element is the same disclosed gap as above", () => {
			// Python: subject.get_primitive_type(getattr_("IfcPostalAddress", "AddressLines")) == ("list", "string")
			expect(subject.getPrimitiveType(getAttr("IfcPostalAddress", "AddressLines"))).toEqual(["list", null]);
		});
	});

	describe("getEnumItems", () => {
		test("throws a clear, disclosed error (no forward enum-item-name lookup exists on this primitive surface)", () => {
			// Python: subject.get_enum_items(getattr_("IfcPostalAddress", "Purpose")) ==
			//   ("OFFICE", "SITE", "HOME", "DISTRIBUTIONPOINT", "USERDEFINED")
			expect(() => subject.getEnumItems(getAttr("IfcPostalAddress", "Purpose"))).toThrow(/enumeration_items/);
		});

		test("throws for a non-enum attribute too (structural precondition still checked first)", () => {
			expect(() => subject.getEnumItems(getAttr("IfcPostalAddress", "Description"))).toThrow(/not an enumeration/);
		});
	});

	describe("getSelectItems", () => {
		test("matches Python exactly -- fully portable, no primitive gap", () => {
			const selectItems = subject.getSelectItems(getAttr("IfcLocalPlacement", "RelativePlacement"));
			expect(selectItems).toHaveLength(2);
			expect(selectItems.map((d) => d.name())).toEqual(["IfcAxis2Placement2D", "IfcAxis2Placement3D"]);
		});
	});
});
