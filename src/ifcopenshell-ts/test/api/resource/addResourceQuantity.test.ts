// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/resource/test_add_resource_quantity.py` (src/
// ifcopenshell-python)'s `test_run`. Real Python introspects the live EXPRESS schema
// (`ifcopenshell.schema_by_name(...).declaration_by_name(...).as_entity().subtypes()`)
// to enumerate every `IfcConstructionResource`/`IfcPhysicalSimpleQuantity` subtype at
// runtime -- this port has no bound schema-introspection primitive of that kind, so
// the same 6-resource-type x 6-quantity-type matrix is enumerated directly from
// `util/resource.ts`'s own already-ported `resourcesToQuantities` table instead
// (functionally identical: that table IS the real
// `RESOURCES_TO_QUANTITIES` constant this function itself reads from). Real Python
// runs this against IFC2X3/IFC4/IFC4X3 (all three explicitly, via
// `TestAddResourceQuantityIFC2X3`/`TestAddResourceQuantityIFC4X3`) -- matched here via
// `AVAILABLE_SCHEMAS` (no filter).

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { addResourceQuantity } from "../../../src/api/resource/addResourceQuantity";
import { removeResource } from "../../../src/api/resource/removeResource";
import type { EntityInstance } from "../../../src/entityInstance";
import { resourcesToQuantities } from "../../../src/util/resource";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

const RESOURCE_TYPES = Object.keys(resourcesToQuantities);
const QUANTITY_TYPES = [
	"IfcQuantityArea",
	"IfcQuantityCount",
	"IfcQuantityLength",
	"IfcQuantityTime",
	"IfcQuantityVolume",
	"IfcQuantityWeight",
];

describe.each(AVAILABLE_SCHEMAS)("api.resource.addResourceQuantity (%s)", (schema) => {
	test("every resource type only accepts its own supported quantity types", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");

		for (const resourceType of RESOURCE_TYPES) {
			const resource = addResource(file, { ifcClass: resourceType });
			const availableQuantities = resourcesToQuantities[resourceType];

			for (const quantityType of QUANTITY_TYPES) {
				if (!availableQuantities.includes(quantityType)) {
					expect(() => addResourceQuantity(file, { resource, ifcClass: quantityType })).toThrow();
					continue;
				}

				const quantity = addResourceQuantity(file, { resource, ifcClass: quantityType });

				expect(quantity.isA(quantityType)).toBe(true);
				expect(quantity.get("Name")).toBe("Unnamed");
				expect(quantity.getByIndex(3)).toBe(0);
				// The previous quantity is reassigned and removed.
				expect((resource.get("BaseQuantity") as EntityInstance).equals(quantity)).toBe(true);
				expect(file.byType("IfcPhysicalSimpleQuantity").length).toBe(1);
			}

			removeResource(file, { resource });
		}
	});
});
