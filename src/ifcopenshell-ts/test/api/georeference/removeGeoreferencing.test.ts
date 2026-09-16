// This file was generated with the assistance of an AI coding tool.
//
// TS port of `test/api/georeference/test_remove_georeferencing.py`'s
// `TestRemoveGeoreferencing` (IFC4-only, run against every non-IFC2X3
// `AVAILABLE_SCHEMAS` entry) and its own `TestAddGeoreferencingIFC2X3` class (despite the
// name, this file's real IFC2X3 test exercises `remove_georeferencing`, not
// `add_georeferencing` -- ported here as a dedicated "pins the disclosed blocked
// `addGeoreferencing` behavior" test, since real Python's own setup step
// (`add_georeferencing`) is itself blocked on IFC2X3 -- see
// `../../../src/api/georeference/addGeoreferencing.ts`'s own header comment).
//
// Also includes original coverage for `remove_georeferencing`'s own disclosed native
// inverse-index bug workaround (`MapUnit` cleanup) -- real Python's own test file never
// exercises a `MapUnit`-bearing `IfcProjectedCRS` at all (confirmed by reading it in
// full; `add_georeferencing` never sets `MapUnit` itself).
//
// Real Python's fixture is genuinely blank -- see `./addGeoreferencing.test.ts`'s own
// header comment for why every test below calls `stripProjectBootstrap` first (so
// `file.byType("IfcProject")[0]` -- used internally by both `addGeoreferencing` and
// `removeGeoreferencing`'s own IFC2X3 branches -- always resolves to the SAME project
// this test itself holds a reference to, not `createTestFile`'s own pre-populated one).

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addGeoreferencing } from "../../../src/api/georeference/addGeoreferencing";
import { removeGeoreferencing } from "../../../src/api/georeference/removeGeoreferencing";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { getPset } from "../../../src/util/element";
import type { Schema } from "../../bootstrap";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

function blankProjectFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	file.createEntity("IfcProject");
	return file;
}

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.georeference.removeGeoreferencing (%s)",
	(schema) => {
		test("removes the map conversion and projected CRS", () => {
			const file = blankProjectFile(schema);
			addContext(file, { contextType: "Model" });
			addGeoreferencing(file, {});

			removeGeoreferencing(file, {});

			expect(file.byType("IfcMapConversion")).toHaveLength(0);
			expect(file.byType("IfcProjectedCRS")).toHaveLength(0);
		});

		test("purges an orphaned MapUnit when it is the projected CRS's only reference", () => {
			const file = blankProjectFile(schema);
			addContext(file, { contextType: "Model" });
			addGeoreferencing(file, {});
			const crs = file.byType("IfcProjectedCRS")[0];
			const unit = file.createEntity("IfcSIUnit", null, "LENGTHUNIT", null, "METRE");
			crs.set("MapUnit", unit);
			expect(file.getTotalInverses(unit)).toBe(1);

			removeGeoreferencing(file, {});

			// See `../../../src/api/georeference/removeGeoreferencing.ts`'s own header
			// comment -- the load-bearing assertion for the disclosed native
			// inverse-index bug workaround: a regression back to a literal
			// `projectedCrs.MapUnit = null` port would leave `unit` permanently orphaned
			// instead of genuinely removed.
			expect(file.byType("IfcSIUnit").some((u) => u.identity() === unit.identity())).toBe(false);
		});

		test("leaves a SHARED MapUnit alone", () => {
			const file = blankProjectFile(schema);
			addContext(file, { contextType: "Model" });
			addGeoreferencing(file, {});
			const crs = file.byType("IfcProjectedCRS")[0];
			const unit = file.createEntity("IfcSIUnit", null, "LENGTHUNIT", null, "METRE");
			crs.set("MapUnit", unit);
			// A second, independent reference to the same unit -- `IfcSIUnit` has no
			// natural second referrer, so this reuses it as an arbitrary unrelated
			// entity's `IfcNamedUnit`-typed attribute instead, purely to construct a
			// genuinely shared reference.
			const derivedUnit = file.createEntity("IfcDerivedUnitElement", unit, 1);
			expect(file.getTotalInverses(unit)).toBe(2);

			removeGeoreferencing(file, {});

			expect(file.byType("IfcSIUnit").some((u) => u.identity() === unit.identity())).toBe(true);
			expect((derivedUnit.get("Unit") as EntityInstance).identity()).toBe(unit.identity());
		});
	},
);

describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC2X3"))(
	"api.georeference.removeGeoreferencing (%s)",
	(schema) => {
		test("removes the ePSet_ProjectedCRS/ePSet_MapConversion psets, once they exist", () => {
			// `addGeoreferencing` itself is currently blocked on IFC2X3 (see
			// `addGeoreferencing.test.ts`), but real Python's own equivalent test
			// (`TestAddGeoreferencingIFC2X3.test_adding_georeferencing` in
			// `test_remove_georeferencing.py`) exercises `remove_georeferencing` AFTER
			// `add_georeferencing` -- so this port catches that expected setup throw (both
			// `ePSet_MapConversion`/`ePSet_ProjectedCRS` psets are already created by real
			// `addPset` calls before the throw -- see `addGeoreferencing.ts`'s own header
			// comment) and asserts `removeGeoreferencing` itself is fully functional
			// regardless (it never touches the blocked `editPset` gap at all).
			// Uses `createTestFile` directly (NOT `blankProjectFile`) -- the setup below
			// needs a real user/application present so `addGeoreferencing`'s own `addPset`
			// call succeeds up through creating both psets (see `addGeoreferencing.test.ts`'s
			// own identical reasoning).
			const file = createTestFile(schema);
			const project = file.byType("IfcProject")[0];
			try {
				addGeoreferencing(file, {});
			} catch {
				// Expected -- see `addGeoreferencing.test.ts`'s own IFC2X3 test.
			}
			expect(file.byType("IfcPropertySet")).toHaveLength(2);

			removeGeoreferencing(file, {});

			expect(getPset(project, "ePSet_MapConversion")).toBeNull();
			expect(getPset(project, "ePSet_ProjectedCRS")).toBeNull();
		});
	},
);
