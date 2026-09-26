// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_assign_port.py` (src/ifcopenshell-python).
// Both real Python tests are now ported for real: `test_assigning_a_port_once_only`
// verbatim (a bare `file.createEntity("IfcDistributionPort")` port has no
// `ObjectPlacement`, so `updatePortPlacement` no-ops -- see
// `../../../src/api/system/assignPort.ts`'s own header comment), and
// `test_updating_the_placement_to_be_relative_if_it_exists` -- previously a
// disclosed-throw pin, now ported for real since `api.geometry.editObjectPlacement`
// has landed.

import { mat4 } from "gl-matrix";
import { describe, expect, test } from "vitest";
import { editObjectPlacement } from "../../../src/api/geometry/editObjectPlacement";
import { createEntity } from "../../../src/api/root/createEntity";
import { addPort } from "../../../src/api/system/addPort";
import { assignPort } from "../../../src/api/system/assignPort";
import { assignUnit } from "../../../src/api/unit/assignUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import { getLocalPlacement } from "../../../src/util/placement";
import * as systemUtil from "../../../src/util/system";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.assignPort (%s)", (schema) => {
	test("assigning a port once only", () => {
		const file = createTestFile(schema);
		const port = file.createEntity("IfcDistributionPort");
		const element = createEntity(file, { ifcClass: "IfcFlowSegment" });

		assignPort(file, { element, port });

		if (file.schema === "IFC2X3") {
			const hasPorts = element.get("HasPorts") as EntityInstance[];
			expect((hasPorts[0].get("RelatingPort") as EntityInstance).equals(port)).toBe(true);
		} else {
			const isNestedBy = element.get("IsNestedBy") as EntityInstance[];
			const relatedObjects = isNestedBy[0].get("RelatedObjects") as EntityInstance[];
			expect(relatedObjects.length).toBe(1);
			expect(relatedObjects[0].equals(port)).toBe(true);
		}
		expect(systemUtil.getPorts(element).length).toBe(1);
		expect(systemUtil.getPorts(element)[0].equals(port)).toBe(true);

		assignPort(file, { element, port });
		expect(systemUtil.getPorts(element).length).toBe(1);
		expect(systemUtil.getPorts(element)[0].equals(port)).toBe(true);
	});

	test("updating the placement to be relative if it exists", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = createEntity(file, { ifcClass: "IfcFlowSegment" });
		const subelement = addPort(file, {});
		const matrix = mat4.fromTranslation(mat4.create(), [1, 1, 1]);
		const submatrix = mat4.fromTranslation(mat4.create(), [1, 2, 3]);

		editObjectPlacement(file, { product: element, matrix: mat4.clone(matrix), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: mat4.clone(submatrix), isSi: false });

		assignPort(file, { element, port: subelement });

		const actualElement = getLocalPlacement(element.get("ObjectPlacement") as EntityInstance);
		const actualSubelement = getLocalPlacement(subelement.get("ObjectPlacement") as EntityInstance);
		for (let i = 0; i < 16; i++) {
			expect(actualElement[i]).toBeCloseTo(matrix[i], 9);
			expect(actualSubelement[i]).toBeCloseTo(submatrix[i], 9);
		}
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});
});
