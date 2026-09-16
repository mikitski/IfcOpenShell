// This file was generated with the assistance of an AI coding tool.
//
// TS port of `test/api/georeference/test_edit_georeferencing.py`'s
// `TestEditGeoreferencing` (IFC4-only, run against every non-IFC2X3 `AVAILABLE_SCHEMAS`
// entry) and `TestEditGeoreferencingIFC2X3` (ported as a dedicated "pins the disclosed
// blocked behavior" test -- see `../../../src/api/georeference/editGeoreferencing.ts`'s
// own header comment for why this is currently blocked, not silently skipped).
//
// Real Python's fixture is genuinely blank -- see `./addGeoreferencing.test.ts`'s own
// header comment for why every test below calls `stripProjectBootstrap` first.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addGeoreferencing } from "../../../src/api/georeference/addGeoreferencing";
import { editGeoreferencing } from "../../../src/api/georeference/editGeoreferencing";
import type { IfcFile } from "../../../src/file";
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
	test("IFC2X3 is currently blocked by the disclosed primitive-layer gap (and a real, confirmed dead-code bug)", () => {
		// See `../../../src/api/georeference/editGeoreferencing.ts`'s own header comment:
		// real Python computes a wrapped value inside the loop and never writes it back
		// into the dict -- a confirmed dead-code bug -- and the dead computation itself
		// (`file.createEntity("IfcLabel"/etc., v)`) hits the already-disclosed
		// `EntityInstance.setByIndex`/`IfcFile.createEntity` primitive-layer gap, so this
		// throws on the very first loop iteration.
		// TODO: once `TODOS.md`'s primitive-layer gap closes, replace this with a real
		// assertion porting real Python's own `TestEditGeoreferencingIFC2X3
		// .test_editing_georeferencing` (`crs["Name"]["value"] == "EPSG:7856"` wrapped in
		// an `IfcLabel` -- NOT `IfcText`, per the dead-code bug -- and
		// `conversion["Eastings"]["value"] == 123.45` wrapped in an `IfcReal` -- NOT
		// `IfcLengthMeasure` -- both reflecting `editPset`'s own generic type-inference
		// fallback, since the dead code never actually takes effect).
		// Uses `createTestFile` directly (NOT `blankProjectFile`) -- the setup below
		// needs a real user/application present so `addGeoreferencing`'s own `addPset`
		// call succeeds up through creating both psets (see `addGeoreferencing.test.ts`'s
		// own identical reasoning).
		const file = createTestFile(schema);
		// `addGeoreferencing` itself already throws on IFC2X3 (see its own test file) --
		// but only AFTER both `ePSet_MapConversion`/`ePSet_ProjectedCRS` psets are
		// created (real `addPset` calls, unaffected by the gap), so the setup below
		// reaches the same "both psets exist, both still empty" state real Python's own
		// fully-functional `add_georeferencing` would, just via a caught throw instead.
		try {
			addGeoreferencing(file, {});
		} catch {
			// Expected -- see `addGeoreferencing.test.ts`'s own IFC2X3 test.
		}
		expect(file.byType("IfcPropertySet")).toHaveLength(2);

		expect(() =>
			editGeoreferencing(file, {
				projectedCrs: { Name: "EPSG:7856" },
				coordinateOperation: { Eastings: 123.45, Northings: 234.56 },
			}),
		).toThrow(/Attribute access is only supported on entity instances/);
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
