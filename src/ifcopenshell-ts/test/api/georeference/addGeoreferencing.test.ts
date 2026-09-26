// This file was generated with the assistance of an AI coding tool.
//
// TS port of `test/api/georeference/test_add_georeferencing.py`'s `TestAddGeoreferencing`
// (IFC4-only test class, run against every `AVAILABLE_SCHEMAS` entry except IFC2X3 --
// no schema divergence exists for the entities involved between IFC4/IFC4X3, matching
// `test/api/grid/createGridAxis.test.ts`'s own identical precedent) and
// `TestAddGeoreferencingIFC2X3`.
//
// Real Python's `test.bootstrap.IFC4`/`IFC2X3` fixture is genuinely blank (no
// pre-existing `IfcProject`/`RepresentationContexts`), unlike this port's own
// `createTestFile` (which uses the richer `template.create` port, pre-populating a
// default `IfcProject` WITH its own "Model" `RepresentationContexts` entry) -- every test
// below calls `stripProjectBootstrap` first, then creates its own bare `IfcProject`, to
// reach the same blank starting state real Python's tests do, matching
// `test/api/context/addContext.test.ts`'s own established precedent for this exact gap.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addGeoreferencing } from "../../../src/api/georeference/addGeoreferencing";
import { removeGeoreferencing } from "../../../src/api/georeference/removeGeoreferencing";
import type { EntityInstance } from "../../../src/entityInstance";
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

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.georeference.addGeoreferencing (%s)", (schema) => {
	test("adds georeferencing entities with blank parameters", () => {
		const file = blankProjectFile(schema);
		addContext(file, { contextType: "Model" });

		addGeoreferencing(file, {});

		expect(file.byType("IfcMapConversion")).toHaveLength(1);
		expect(file.byType("IfcProjectedCRS")).toHaveLength(1);
		const conversion = file.byType("IfcMapConversion")[0];
		const crs = file.byType("IfcProjectedCRS")[0];
		expect(conversion.get("Eastings")).toBe(0);
		expect(conversion.get("Northings")).toBe(0);
		expect(conversion.get("OrthogonalHeight")).toBe(0);
		expect(crs.get("Name")).toBe("EPSG:3857");
	});

	test("does nothing if there is no model context", () => {
		const file = blankProjectFile(schema);
		addGeoreferencing(file, {});
		addContext(file, { contextType: "Plan" });
		addGeoreferencing(file, {});
		expect(file.byType("IfcMapConversion")).toHaveLength(0);
		expect(file.byType("IfcProjectedCRS")).toHaveLength(0);
	});

	test("does not add georeferencing twice", () => {
		const file = blankProjectFile(schema);
		addContext(file, { contextType: "Model" });
		addGeoreferencing(file, {});
		addGeoreferencing(file, {});
		expect(file.byType("IfcMapConversion")).toHaveLength(1);
		expect(file.byType("IfcProjectedCRS")).toHaveLength(1);
	});

	test("recovers from an orphan IfcProjectedCRS", () => {
		const file = blankProjectFile(schema);
		addContext(file, { contextType: "Model" });
		file.createEntity("IfcProjectedCRS", "EPSG:1234");
		expect(file.byType("IfcProjectedCRS")).toHaveLength(1);
		expect(file.byType("IfcCoordinateOperation")).toHaveLength(0);

		addGeoreferencing(file, {});
		expect(file.byType("IfcMapConversion")).toHaveLength(1);
		expect(file.byType("IfcProjectedCRS")).toHaveLength(1);
	});

	test("recovers from an orphan IfcCoordinateOperation", () => {
		const file = blankProjectFile(schema);
		const context = addContext(file, { contextType: "Model" });
		file.createEntity("IfcMapConversion", context, file.createEntity("IfcProjectedCRS", "EPSG:1234"), 0, 0, 0);
		removeGeoreferencing(file, {});
		// Simulate orphan by re-adding just a conversion without a CRS.
		file.createEntity("IfcMapConversion", context, file.createEntity("IfcProjectedCRS", "EPSG:1234"), 0, 0, 0);
		file.remove(file.byType("IfcProjectedCRS")[0]);
		expect(file.byType("IfcProjectedCRS")).toHaveLength(0);
		expect(file.byType("IfcCoordinateOperation")).toHaveLength(1);

		addGeoreferencing(file, {});
		expect(file.byType("IfcMapConversion")).toHaveLength(1);
		expect(file.byType("IfcProjectedCRS")).toHaveLength(1);
	});
});

// IFC4X3-only: `ifcClass: "IfcRigidOperation"` doesn't exist on IFC2X3/IFC4 at all --
// see `../../../src/api/georeference/addGeoreferencing.ts`'s own header comment.
describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC4X3"))(
	"api.georeference.addGeoreferencing ifcClass variants (%s)",
	(schema) => {
		test("IfcMapConversionScaled is fully functional", () => {
			const file = blankProjectFile(schema);
			addContext(file, { contextType: "Model" });

			addGeoreferencing(file, { ifcClass: "IfcMapConversionScaled" });

			const conversion = file.byType("IfcMapConversionScaled")[0];
			expect(conversion).toBeDefined();
			expect(conversion.get("Eastings")).toBe(0);
			expect(conversion.get("FactorX")).toBe(1);
			expect(conversion.get("FactorY")).toBe(1);
			expect(conversion.get("FactorZ")).toBe(1);
		});

		test("ifcClass: 'IfcRigidOperation' wraps FirstCoordinate/SecondCoordinate in a fresh IfcLengthMeasure", () => {
			const file = blankProjectFile(schema);
			addContext(file, { contextType: "Model" });

			addGeoreferencing(file, { ifcClass: "IfcRigidOperation" });

			const op = file.byType("IfcRigidOperation")[0];
			expect(op).toBeDefined();
			const firstCoordinate = op.get("FirstCoordinate") as EntityInstance;
			const secondCoordinate = op.get("SecondCoordinate") as EntityInstance;
			expect(firstCoordinate.isA("IfcLengthMeasure")).toBe(true);
			expect(firstCoordinate.getByIndex(0)).toBe(0);
			expect(secondCoordinate.isA("IfcLengthMeasure")).toBe(true);
			expect(secondCoordinate.getByIndex(0)).toBe(0);
		});
	},
);

describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC2X3"))("api.georeference.addGeoreferencing (%s)", (schema) => {
	// Matches real Python's `TestAddGeoreferencingIFC2X3.test_adding_georeferencing`:
	// two `ePSet_ProjectedCRS`/`ePSet_MapConversion` psets on the project, `Name`
	// wrapped in an `IfcLabel`, `Eastings`/`Northings`/`OrthogonalHeight` each wrapped
	// in an `IfcLengthMeasure`.
	test("adds georeferencing pset properties", () => {
		const file = createTestFile(schema);
		const project = file.byType("IfcProject")[0];

		addGeoreferencing(file, {});

		expect(file.byType("IfcPropertySet")).toHaveLength(2);
		const conversion = elementUtil.getPset(project, "ePSet_MapConversion", null, false, false, true, true) as Record<
			string,
			{ id: number; value: unknown }
		>;
		const crs = elementUtil.getPset(project, "ePSet_ProjectedCRS", null, false, false, true, true) as Record<
			string,
			{ id: number; value: unknown }
		>;
		expect(conversion).toBeTruthy();
		expect(crs).toBeTruthy();
		expect(crs.Name.value).toBe("EPSG:3857");
		expect(file.byId(crs.Name.id).get("NominalValue").isA("IfcLabel")).toBe(true);
		expect(conversion.Eastings.value).toBe(0);
		expect(file.byId(conversion.Eastings.id).get("NominalValue").isA("IfcLengthMeasure")).toBe(true);
		expect(conversion.Northings.value).toBe(0);
		expect(conversion.OrthogonalHeight.value).toBe(0);
	});
});
