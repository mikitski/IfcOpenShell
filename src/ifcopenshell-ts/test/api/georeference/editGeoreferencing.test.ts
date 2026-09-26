// This file was generated with the assistance of an AI coding tool.
//
// TS port of `test/api/georeference/test_edit_georeferencing.py`'s
// `TestEditGeoreferencing` (IFC4-only, run against every non-IFC2X3 `AVAILABLE_SCHEMAS`
// entry) and `TestEditGeoreferencingIFC2X3`.
//
// Real Python's fixture is genuinely blank -- see `./addGeoreferencing.test.ts`'s own
// header comment for why every test below calls `stripProjectBootstrap` first.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addGeoreferencing } from "../../../src/api/georeference/addGeoreferencing";
import { editGeoreferencing } from "../../../src/api/georeference/editGeoreferencing";
import type { IfcFile } from "../../../src/file";
import * as elementUtil from "../../../src/util/element";
import type { Schema } from "../../bootstrap";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

function blankProjectFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	file.createEntity("IfcProject");
	return file;
}

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.georeference.editGeoreferencing (%s)", (schema) => {
	test("edits the projected CRS and coordinate operation", () => {
		const file = blankProjectFile(schema);
		addContext(file, { contextType: "Model" });
		addGeoreferencing(file, {});

		editGeoreferencing(file, {
			projectedCrs: { Name: "EPSG:7856" },
			coordinateOperation: { Eastings: 123.45, Northings: 234.56 },
		});

		const crs = file.byType("IfcProjectedCRS")[0];
		expect(crs.get("Name")).toBe("EPSG:7856");
		const conversion = file.byType("IfcMapConversion")[0];
		expect(conversion.get("Eastings")).toBe(123.45);
		expect(conversion.get("Northings")).toBe(234.56);

		editGeoreferencing(file, { projectedCrs: { Name: "EPSG:1234" } });
		expect(crs.get("Name")).toBe("EPSG:1234");

		editGeoreferencing(file, { coordinateOperation: { Eastings: 42 } });
		expect(conversion.get("Eastings")).toBe(42);
	});
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC2X3"))("api.georeference.editGeoreferencing (%s)", (schema) => {
	// Matches real Python's `TestEditGeoreferencingIFC2X3.test_editing_georeferencing`.
	// The dead-code bug (`editGeoreferencing.ts`'s own header comment: the loop-local
	// wrapped value is computed and discarded, never written back into the dict) is
	// still real and unrelated to the now-resolved primitive-layer gate -- but it
	// doesn't affect the OBSERVED types here: `addGeoreferencing` already created both
	// pset properties (`Name` as `IfcLabel`, `Eastings`/etc. as `IfcLengthMeasure`), so
	// `editPset`'s own "update an EXISTING property" tier retains the property's
	// current wrapped type regardless of what the dead code would have computed.
	test("edits the pset properties, retaining their existing wrapped types", () => {
		const file = createTestFile(schema);
		const project = file.byType("IfcProject")[0];
		addGeoreferencing(file, {});

		editGeoreferencing(file, {
			projectedCrs: { Name: "EPSG:7856" },
			coordinateOperation: { Eastings: 123.45, Northings: 234.56 },
		});

		const conversion = elementUtil.getPset(project, "ePSet_MapConversion", null, false, false, true, true) as Record<
			string,
			{ id: number; value: unknown }
		>;
		const crs = elementUtil.getPset(project, "ePSet_ProjectedCRS", null, false, false, true, true) as Record<
			string,
			{ id: number; value: unknown }
		>;
		expect(crs.Name.value).toBe("EPSG:7856");
		expect(file.byId(crs.Name.id).get("NominalValue").isA("IfcLabel")).toBe(true);
		expect(conversion.Eastings.value).toBe(123.45);
		expect(file.byId(conversion.Eastings.id).get("NominalValue").isA("IfcLengthMeasure")).toBe(true);
		expect(conversion.Northings.value).toBe(234.56);
		expect(conversion.OrthogonalHeight.value).toBe(0);
	});

	test("is a silent no-op on a projectless IFC2X3 model (real Python's own early-return guard)", () => {
		// Python: `if not (project := file.by_type("IfcProject")): return` -- checked
		// BEFORE touching either pset. An earlier draft of this port dropped this guard
		// entirely, so `file.byType("IfcProject")[0]` resolved to `undefined` and
		// `getPset(undefined, ...)` threw a TypeError instead of silently no-op-ing --
		// caught by `/code-review` before merge. See
		// `../../../src/api/georeference/editGeoreferencing.ts`'s own header comment.
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		expect(file.byType("IfcProject")).toHaveLength(0);

		expect(() =>
			editGeoreferencing(file, {
				projectedCrs: { Name: "EPSG:7856" },
				coordinateOperation: { Eastings: 123.45 },
			}),
		).not.toThrow();

		// A genuine no-op: nothing was created.
		expect(file.byType("IfcPropertySet")).toHaveLength(0);
	});
});
