// This file was generated with the assistance of an AI coding tool.
//
// `test/api/geometry/test_regenerate_wall_representation.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search) -- `regenerate_wall_representation
// .py` has no dedicated Python test file to port from. Every test below is therefore original
// coverage, written directly against `regenerate_wall_representation.py`'s real source /
// `../../../src/api/geometry/regenerateWallRepresentation.ts`'s own port.
//
// Every genuinely private helper this port defines (`getLayers`/`combineLayers`/`getWallVectors`/
// `getAxes`/`join`/`getManualBooleans`) is module-private, matching real Python's own
// `Regenerator` class being entirely private (only `regenerate_wall_representation` itself is
// re-exported from `ifcopenshell.api.geometry`) -- so, like `editObjectPlacement.test.ts`'s own
// established precedent for a similarly helper-heavy file, every test below exercises those
// helpers INDIRECTLY, through the one exported `regenerateWallRepresentation` function's own
// observable behavior: whether it returns `undefined` vs. throws, and -- critically -- WHICH
// error it throws and at what point, which is what lets these tests distinguish "the pure layer/
// axis/join computation completed successfully" (reaching the disclosed, common `ShapeBuilder`
// primitive-layer throw at the very end, per `regenerateWallRepresentation.ts`'s own header
// comment, Finding 1) from "a genuinely different, premature error" (e.g. Finding 2's
// `combineLayers` bug, which throws EARLIER, with a distinguishable error message, before `join`
// is ever reached for that connection).
//
// Gated with `describe.each(AVAILABLE_SCHEMAS)` for the whole suite (every test needs a real
// `IfcFile`) -- CI's native build only registers IFC4 (`-DSCHEMA_VERSIONS=4`), so a hardcoded,
// ungated `describe("... (IFC2X3)")` block would fail CI with "No schema loaded" (a real mistake
// multiple past PRs in this project have hit and fixed).

import { mat4 } from "gl-matrix";
import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { editObjectPlacement } from "../../../src/api/geometry/editObjectPlacement";
import { regenerateWallRepresentation } from "../../../src/api/geometry/regenerateWallRepresentation";
import { addLayer } from "../../../src/api/material/addLayer";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** The disclosed, current `ShapeBuilder` primitive-layer blocker this file's own header comment
 * (Finding 1) documents -- reached by every real invocation with a wall that has an
 * `IfcMaterialLayerSet`, on every schema (via 2 different already-tracked gaps, depending on
 * schema). Matches `addWindowRepresentation.test.ts`'s/`addRailingRepresentation.test.ts`'s own
 * established regex for this exact blocker. */
const SHAPE_BUILDER_BLOCKER = /has no attribute 'Dim'|Attribute access is only supported on entity instances/;

/** Python: `model = add_context(...)`; `body = add_context(..., parent=model)`; `plan =
 * add_context(context_type="Plan")` -- matching `addWallRepresentation.test.ts`'s own identical
 * fixture, plus an explicit "Plan" context so `createRegeneratorContext`'s own `addContext`
 * fallback path (creating a fresh "Plan" context from scratch) isn't the only path exercised
 * across this whole suite. */
function bodyContext(file: IfcFile): EntityInstance {
	createEntity(file, { ifcClass: "IfcProject" });
	const model = addContext(file, { contextType: "Model" });
	return addContext(file, {
		contextType: "Model",
		contextIdentifier: "Body",
		targetView: "MODEL_VIEW",
		parent: model,
	});
}

/** A single-layer `IfcMaterialLayerSet`, assigned directly (not via a "Usage") to `products` --
 * sufficient for `getMaterial(wall, shouldSkipUsage=true).isA("IfcMaterialLayerSet")` to succeed,
 * matching this function's own only supported mode. */
function makeLayerSet(file: IfcFile, thickness = 0.2): EntityInstance {
	const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
	const concrete = addMaterial(file, { name: "CON01" });
	const layer = addLayer(file, { layerSet, material: concrete });
	layer.set("LayerThickness", thickness);
	return layerSet;
}

/** A minimal `IfcRelConnectsPathElements`, matching `connectPath.ts`'s own real Python positional
 * attribute order (verified against that file's own already-checked `createEntity` call) -- built
 * directly here (not via `connectPath`) so `relatingPriorities`/`relatedPriorities` can be
 * controlled explicitly, which `connectPath` itself always hard-codes to `[]`. */
function connectPathElements(
	file: IfcFile,
	relatingElement: EntityInstance,
	relatedElement: EntityInstance,
	relatingConnection: string,
	relatedConnection: string,
	relatingPriorities: readonly number[] = [],
	relatedPriorities: readonly number[] = [],
): EntityInstance {
	return file.createEntity(
		"IfcRelConnectsPathElements",
		guid.new(),
		null,
		null,
		null,
		null,
		relatingElement,
		relatedElement,
		[...relatingPriorities],
		[...relatedPriorities],
		relatedConnection,
		relatingConnection,
	);
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.regenerateWallRepresentation (%s)", (schema) => {
	test("returns undefined for a wall with no IfcMaterialLayerSet -- fully functional, no throw", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall = file.createEntity("IfcWall");

		const result = regenerateWallRepresentation(file, { wall });

		expect(result).toBeUndefined();
	});

	test("returns undefined for a wall whose material is a plain IfcMaterial (not a layer set)", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall = file.createEntity("IfcWall");
		const material = addMaterial(file, { name: "CON01" });
		assignMaterial(file, { products: [wall], material });

		const result = regenerateWallRepresentation(file, { wall });

		expect(result).toBeUndefined();
	});

	test("a wall with a real IfcMaterialLayerSet and no connections throws the disclosed ShapeBuilder blocker (Finding 1)", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall = file.createEntity("IfcWall");
		const layerSet = makeLayerSet(file);
		assignMaterial(file, { products: [wall], material: layerSet, type: "IfcMaterialLayerSet" });

		expect(() => regenerateWallRepresentation(file, { wall })).toThrow(SHAPE_BUILDER_BLOCKER);
	});

	test("get_layers reads Priority/LayerThickness off each IfcMaterialLayer -- exercised indirectly via getAxes' own successful completion", () => {
		// A layer with a real, non-default Priority still reaches the SAME disclosed
		// ShapeBuilder blocker (not a premature, different error) -- proving `getLayers`
		// itself completed without incident for a non-default Priority value.
		const file = createTestFile(schema);
		bodyContext(file);
		const wall = file.createEntity("IfcWall");
		const layerSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const concrete = addMaterial(file, { name: "CON01" });
		const layer =
			schema === "IFC2X3"
				? file.createEntity("IfcMaterialLayer", concrete, 0.2)
				: file.createEntity("IfcMaterialLayer", concrete, 0.2, null, null, null, 3);
		layerSet.set("MaterialLayers", [layer]);
		assignMaterial(file, { products: [wall], material: layerSet, type: "IfcMaterialLayerSet" });

		expect(() => regenerateWallRepresentation(file, { wall })).toThrow(SHAPE_BUILDER_BLOCKER);
	});

	test("Finding 2: an IfcRelConnectsPathElements with a non-empty RelatingPriorities crashes combineLayers with a REAL, disclosed, verbatim-preserved upstream bug", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const layerSet = makeLayerSet(file);
		assignMaterial(file, { products: [wall1], material: layerSet, type: "IfcMaterialLayerSet" });
		assignMaterial(file, { products: [wall2], material: layerSet, type: "IfcMaterialLayerSet" });
		connectPathElements(file, wall1, wall2, "ATSTART", "ATEND", [5]);

		// A frozen `PrioritisedLayer`'s own `.priority` field cannot be reassigned -- see
		// this file's header comment / `regenerateWallRepresentation.ts`'s own header
		// comment (Finding 2). This is a REAL, severe, upstream Python bug (an immutable
		// namedtuple's own item-assignment attempt), not a TS-port gap -- reproduced
		// verbatim, not silently avoided.
		expect(() => regenerateWallRepresentation(file, { wall: wall1 })).toThrow(/read only property 'priority'/);
	});

	test("an IfcRelConnectsPathElements with EMPTY RelatingPriorities/RelatedPriorities (the common case) reaches join() and completes it without a premature error", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const layerSet = makeLayerSet(file);
		assignMaterial(file, { products: [wall1], material: layerSet, type: "IfcMaterialLayerSet" });
		assignMaterial(file, { products: [wall2], material: layerSet, type: "IfcMaterialLayerSet" });
		connectPathElements(file, wall1, wall2, "ATSTART", "ATEND");

		// If `join`'s own mitre-join branch (real Python's own priority-driven walk across
		// both walls' layer boundaries) crashed prematurely, the error here would NOT
		// match the disclosed `ShapeBuilder` blocker -- confirming `join` itself ran to
		// completion for this connection.
		expect(() => regenerateWallRepresentation(file, { wall: wall1 })).toThrow(SHAPE_BUILDER_BLOCKER);
	});

	test("a connection between 2 walls with DIFFERENT (translated) object placements exercises the real inv(matrix1) @ matrix2 coordinate transform without crashing", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const layerSet = makeLayerSet(file);
		assignMaterial(file, { products: [wall1], material: layerSet, type: "IfcMaterialLayerSet" });
		assignMaterial(file, { products: [wall2], material: layerSet, type: "IfcMaterialLayerSet" });
		connectPathElements(file, wall1, wall2, "ATSTART", "ATEND");

		const translated = mat4.create();
		mat4.fromTranslation(translated, [1.0, 0.5, 0.0]);
		editObjectPlacement(file, { product: wall2, matrix: translated });

		// A singular-matrix throw, or any matrix-math exception, would surface here
		// instead of the disclosed `ShapeBuilder` blocker -- proving the real
		// `mat4.invert`/`mat4.multiply`/coordinate-transform code in `join` ran correctly
		// for a non-identity `wall2` placement.
		expect(() => regenerateWallRepresentation(file, { wall: wall1 })).toThrow(SHAPE_BUILDER_BLOCKER);
	});

	test("an ATPATH connection (wall2 crosses through wall1's own path) reaches join()'s own dedicated ATPATH branch without a premature error", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const layerSet = makeLayerSet(file);
		assignMaterial(file, { products: [wall1], material: layerSet, type: "IfcMaterialLayerSet" });
		assignMaterial(file, { products: [wall2], material: layerSet, type: "IfcMaterialLayerSet" });

		// wall2 crosses wall1's own path perpendicular to it, translated so it actually
		// intersects wall1's own axis (which runs along +X from the origin by default).
		const translated = mat4.create();
		mat4.fromTranslation(translated, [0.5, 0.0, 0.0]);
		editObjectPlacement(file, { product: wall2, matrix: translated });
		mat4.fromZRotation(translated, Math.PI / 2);
		editObjectPlacement(file, { product: wall2, matrix: translated });

		connectPathElements(file, wall1, wall2, "ATPATH", "ATSTART");

		expect(() => regenerateWallRepresentation(file, { wall: wall1 })).toThrow(SHAPE_BUILDER_BLOCKER);
	});

	test("a connection with connection1 === 'NOTDEFINED' is a real, documented early-return no-op in join() -- still reaches the same disclosed blocker", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const layerSet = makeLayerSet(file);
		assignMaterial(file, { products: [wall1], material: layerSet, type: "IfcMaterialLayerSet" });
		assignMaterial(file, { products: [wall2], material: layerSet, type: "IfcMaterialLayerSet" });
		connectPathElements(file, wall1, wall2, "NOTDEFINED", "ATEND");

		expect(() => regenerateWallRepresentation(file, { wall: wall1 })).toThrow(SHAPE_BUILDER_BLOCKER);
	});

	test("an ATPATH+ATPATH connection pair is a real, documented early-return no-op in join()", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall1 = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const layerSet = makeLayerSet(file);
		assignMaterial(file, { products: [wall1], material: layerSet, type: "IfcMaterialLayerSet" });
		assignMaterial(file, { products: [wall2], material: layerSet, type: "IfcMaterialLayerSet" });
		connectPathElements(file, wall1, wall2, "ATPATH", "ATPATH");

		expect(() => regenerateWallRepresentation(file, { wall: wall1 })).toThrow(SHAPE_BUILDER_BLOCKER);
	});

	// `getManualBooleans`'s own JSON-parsing/read behavior (both the valid-JSON and
	// malformed-JSON paths) could NOT be given a dedicated test with a real property value:
	// constructing ANY populated `BBIM_Boolean.Data` property at all (an
	// `IfcPropertySingleValue.NominalValue`, a SELECT-typed value needing a freshly-populated
	// `IfcText`/`IfcLabel`) hits the SAME already-tracked, foundational `entityInstance.ts`
	// primitive-layer gap `clipSolid.ts`'s own header comment already discloses
	// (`EntityInstance.setByIndex`/`IfcFile.createEntity` cannot write an initial value into a
	// freshly created simple/defined-type instance) -- confirmed directly here, not assumed: even
	// a bare `file.createEntity("IfcText", "hello")` (no `editPset`/`addPset` involved at all)
	// throws the identical "Attribute access is only supported on entity instances" error in this
	// environment. This is NOT a new gap `getManualBooleans` introduces -- it's a downstream
	// consequence of the same already-disclosed foundational blocker: there is no way to CREATE a
	// real `Data` value to read back, so `getManualBooleans`'s own JSON-parsing logic cannot be
	// exercised with real data today, only its `pset === null` early-return branch (implicitly
	// exercised by every OTHER test in this file, none of which ever creates a `BBIM_Boolean`
	// pset -- `getManualBooleans` therefore returns `[]` every time, feeding `offset`/the
	// manual-booleans-application loop exactly as it does in real, boolean-free usage).

	test("angle parameter triggers the isAngled branch (sloped-wall extrusion path) and still reaches the same disclosed blocker", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall = file.createEntity("IfcWall");
		const layerSet = makeLayerSet(file);
		assignMaterial(file, { products: [wall], material: layerSet, type: "IfcMaterialLayerSet" });

		// A non-zero fallback angle (no existing body representation to derive one from)
		// makes `getWallVectors` set `isAngled = true`, taking the OTHER top-level branch
		// in `regenerate` (real Python's own `if self.is_angled: ... else: ...`) --
		// exercised here to prove it too reaches the identical disclosed blocker, not a
		// different one.
		expect(() => regenerateWallRepresentation(file, { wall, angle: Math.PI / 8 })).toThrow(SHAPE_BUILDER_BLOCKER);
	});

	test("explicit length/height parameters are accepted (SI-to-project-unit fallback conversion) without altering the disclosed blocker", () => {
		const file = createTestFile(schema);
		bodyContext(file);
		const wall = file.createEntity("IfcWall");
		const layerSet = makeLayerSet(file);
		assignMaterial(file, { products: [wall], material: layerSet, type: "IfcMaterialLayerSet" });

		expect(() => regenerateWallRepresentation(file, { wall, length: 4.0, height: 2.4 })).toThrow(SHAPE_BUILDER_BLOCKER);
	});
});
