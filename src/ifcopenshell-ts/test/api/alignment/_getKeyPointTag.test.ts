// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_get_key_point_tag.py` on its own (a
// module-private helper, never directly tested by `test/api/alignment/*.py` --
// confirmed by reading the whole real test directory; its own callers,
// `update_alignment_parameter_segment_tags`/`update_key_point_referents`, are both
// out of this chunk's scope). Original test coverage written here, exercising the
// real docstring example shape ("<station> (<label>)"), gated to IFC4X3.
//
// `stationAsString` itself is already independently, thoroughly tested
// (`test/util/alignment.test.ts`) -- this file only asserts the wrapping/formatting
// `_getKeyPointTag` itself adds, reusing that same file's own minimal SI-unit
// project-fixture pattern (`createProject`/`createSiUnit`/`assignUnits`, redefined
// here per this project's "no cross-file sharing" convention for module-private test
// fixtures).

import { describe, expect, test } from "vitest";
import { _getKeyPointTag } from "../../../src/api/alignment/_getKeyPointTag";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function createProject(file: IfcFile): EntityInstance {
	return file.byType("IfcProject")[0];
}

function createSiUnit(file: IfcFile, unitType: string, name: string): EntityInstance {
	const unit = file.createEntity("IfcSIUnit");
	unit.set("UnitType", unitType);
	unit.set("Name", name);
	return unit;
}

function assignUnits(file: IfcFile, project: EntityInstance, units: readonly EntityInstance[]): void {
	const assignment = file.createEntity("IfcUnitAssignment");
	assignment.set("Units", units);
	project.set("UnitsInContext", assignment);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._getKeyPointTag (IFC4X3)", () => {
	test("combines the stationized text and the label", () => {
		const file = createTestFile("IFC4X3");
		const project = createProject(file);
		assignUnits(file, project, [createSiUnit(file, "LENGTHUNIT", "METRE")]);

		expect(_getKeyPointTag(file, "P.O.B.", 100.0)).toBe("0+100.000 (P.O.B.)");
	});

	test("a different station/label pair", () => {
		const file = createTestFile("IFC4X3");
		const project = createProject(file);
		assignUnits(file, project, [createSiUnit(file, "LENGTHUNIT", "METRE")]);

		expect(_getKeyPointTag(file, "P.C.", 14598.32)).toBe("14+598.320 (P.C.)");
	});
});
