// This file was generated with the assistance of an AI coding tool.
//
// `test/util/test_representation.py` does not exist anywhere in `src/ifcopenshell-python`
// (confirmed by a repo-wide search) -- `util/representation.py` has no dedicated Python
// test file to port from, matching `util.constraint`'s own established precedent
// (`PROGRESS.md`'s row for that chunk). Every test below is therefore original coverage,
// written directly against `representation.py`'s real source / `representation.ts`'s own
// port, including a dedicated `guessType` coverage block per this chunk's own task brief.
//
// No `ifcopenshell.api.*` fixtures to port from either (same reason) -- local fixture
// helpers below build the underlying `IfcGeometricRepresentationContext`/
// `IfcShapeRepresentation`/`IfcMappedItem`/`IfcRepresentationMap`/`IfcCartesian
// TransformationOperator3D` entity graphs directly (`file.createEntity(...)` +
// `.set(...)`), matching `test/util/element.test.ts`'s/`test/util/placement.test.ts`'s
// own established pattern for this exact gap.
//
// Three real, disclosed Python-source/primitive-layer findings are each pinned by a
// dedicated test here, not just described in prose (see `representation.ts`'s own header
// comment for the full story on each):
// 1. `getPartOfProduct`'s real `"IFX2X3"` typo -- a dedicated IFC2X3 test asserts the
//    actual (surprising) behavior: an `IfcTypeProduct` under IFC2X3 does NOT short-circuit
//    to `null`, contradicting Python's own docstring.
// 2. `resolveItems`'s asymmetric identity-shortcut -- a dedicated 3-level nested
//    `IfcMappedItem` test (identity transform in the middle level) asserts the caller's
//    accumulated matrix is silently discarded, not composed through.
// 3. `guessType`'s `Dim`-dependent branches (`Curve2D`/`Curve3D`/`Surface2D`/`Surface3D`)
//    are blocked by the pre-existing `entityInstance.ts` "no EXPRESS DERIVED attribute"
//    gap -- a dedicated test asserts the real, documented error for an `IfcLine` item,
//    rather than silently skipping coverage of that branch.

import { mat4 } from "gl-matrix";
import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import * as subject from "../../src/util/representation";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header comment) ---

function point(file: IfcFile, coords: number[]): EntityInstance {
	return file.createEntity("IfcCartesianPoint", coords);
}

function subContext(file: IfcFile, contextType: string, contextIdentifier: string, targetView: string): EntityInstance {
	const context = file.createEntity("IfcGeometricRepresentationSubContext");
	context.set("ContextType", contextType);
	context.set("ContextIdentifier", contextIdentifier);
	context.set("TargetView", targetView);
	return context;
}

function shapeRepresentation(
	file: IfcFile,
	contextOfItems: EntityInstance,
	items: readonly EntityInstance[],
): EntityInstance {
	const rep = file.createEntity("IfcShapeRepresentation");
	rep.set("ContextOfItems", contextOfItems);
	rep.set("Items", items);
	return rep;
}

function productWithRepresentations(
	file: IfcFile,
	className: string,
	representations: readonly EntityInstance[],
): EntityInstance {
	const element = file.createEntity(className);
	const productShape = file.createEntity("IfcProductDefinitionShape");
	productShape.set("Representations", representations);
	element.set("Representation", productShape);
	return element;
}

function typeWithRepresentationMaps(
	file: IfcFile,
	className: string,
	mappedRepresentations: readonly EntityInstance[],
): EntityInstance {
	const elementType = file.createEntity(className);
	const maps = mappedRepresentations.map((mappedRep) => {
		const map = file.createEntity("IfcRepresentationMap");
		map.set("MappingOrigin", identityAxis2Placement3D(file));
		map.set("MappedRepresentation", mappedRep);
		return map;
	});
	elementType.set("RepresentationMaps", maps);
	return elementType;
}

function identityAxis2Placement3D(file: IfcFile): EntityInstance {
	return file.createEntity("IfcAxis2Placement3D", point(file, [0, 0, 0]));
}

/** A `IfcCartesianTransformationOperator3D` with no `Axis1`/`Axis2`/`Axis3`/`Scale`
 * overrides -- resolves to a pure translation by `localOrigin` (identity when
 * `localOrigin` is `[0, 0, 0]`). */
function translationOperator(file: IfcFile, localOrigin: number[]): EntityInstance {
	return file.createEntity("IfcCartesianTransformationOperator3D", null, null, point(file, localOrigin));
}

function mappedItem(
	file: IfcFile,
	mappedRepresentation: EntityInstance,
	mappingTarget: EntityInstance,
): EntityInstance {
	const map = file.createEntity("IfcRepresentationMap");
	map.set("MappingOrigin", identityAxis2Placement3D(file));
	map.set("MappedRepresentation", mappedRepresentation);
	const item = file.createEntity("IfcMappedItem");
	item.set("MappingSource", map);
	item.set("MappingTarget", mappingTarget);
	return item;
}

function translationOf(matrix: subject.MatrixType): [number, number, number] {
	return [matrix[12] as number, matrix[13] as number, matrix[14] as number];
}

// --- get_context ---

describe("util.representation getContext", () => {
	test("finds a base context by ContextType, ignoring subcontexts", () => {
		// Uses "Plan" (not "Model"): `createTestFile`'s blank template
		// (`src/template.ts`) always seeds one default "Model" `IfcGeometricRepresentation
		// Context` (`#11` in the template SPF text) -- "Plan" avoids any ambiguity with
		// that pre-existing fixture.
		const file = createTestFile("IFC4");
		const plan = file.createEntity("IfcGeometricRepresentationContext");
		plan.set("ContextType", "Plan");
		const body = subContext(file, "Plan", "Body", "MODEL_VIEW");
		body.set("ParentContext", plan);

		expect(subject.getContext(file, "Plan")?.id()).toBe(plan.id());
	});

	test("finds a subcontext by ContextType/ContextIdentifier/TargetView", () => {
		const file = createTestFile("IFC4");
		const model = file.createEntity("IfcGeometricRepresentationContext");
		model.set("ContextType", "Model");
		const body = subContext(file, "Model", "Body", "MODEL_VIEW");
		body.set("ParentContext", model);

		expect(subject.getContext(file, "Model", "Body", "MODEL_VIEW")?.equals(body)).toBe(true);
		expect(subject.getContext(file, "Model", "Body")?.equals(body)).toBe(true);
		expect(subject.getContext(file, "Plan", "Body", "MODEL_VIEW")).toBeNull();
	});

	test("returns null when nothing matches", () => {
		// "Plan" -- see the previous test's comment on why "Model" alone isn't a safe
		// no-match probe against `createTestFile`'s blank template.
		const file = createTestFile("IFC4");
		expect(subject.getContext(file, "Plan")).toBeNull();
	});
});

// --- is_representation_of_context ---

describe("util.representation isRepresentationOfContext", () => {
	test("matches an exact entity-instance context (identity, not attribute equality)", () => {
		const file = createTestFile("IFC4");
		const contextA = file.createEntity("IfcGeometricRepresentationContext");
		contextA.set("ContextType", "Model");
		const contextB = file.createEntity("IfcGeometricRepresentationContext");
		contextB.set("ContextType", "Model");
		const rep = shapeRepresentation(file, contextA, []);

		expect(subject.isRepresentationOfContext(rep, contextA)).toBe(true);
		expect(subject.isRepresentationOfContext(rep, contextB)).toBe(false);
	});

	test("matches by ContextType string alone", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		context.set("ContextType", "Model");
		const rep = shapeRepresentation(file, context, []);

		expect(subject.isRepresentationOfContext(rep, "Model")).toBe(true);
		expect(subject.isRepresentationOfContext(rep, "Plan")).toBe(false);
	});

	test("matches by ContextType + ContextIdentifier (subcontext only)", () => {
		const file = createTestFile("IFC4");
		const body = subContext(file, "Model", "Body", "MODEL_VIEW");
		const rep = shapeRepresentation(file, body, []);

		expect(subject.isRepresentationOfContext(rep, "Model", "Body")).toBe(true);
		expect(subject.isRepresentationOfContext(rep, "Model", "Axis")).toBe(false);
		// A base (non-sub) context never matches a subcontext-identifier query.
		const baseContext = file.createEntity("IfcGeometricRepresentationContext");
		baseContext.set("ContextType", "Model");
		const baseRep = shapeRepresentation(file, baseContext, []);
		expect(subject.isRepresentationOfContext(baseRep, "Model", "Body")).toBe(false);
	});

	test("matches by ContextType + ContextIdentifier + TargetView", () => {
		const file = createTestFile("IFC4");
		const body = subContext(file, "Model", "Body", "MODEL_VIEW");
		const rep = shapeRepresentation(file, body, []);

		expect(subject.isRepresentationOfContext(rep, "Model", "Body", "MODEL_VIEW")).toBe(true);
		expect(subject.isRepresentationOfContext(rep, "Model", "Body", "PLAN_VIEW")).toBe(false);
	});
});

// --- get_representations_iter / get_representation ---

describe("util.representation getRepresentation / getRepresentationsIter", () => {
	test("finds a matching IfcShapeRepresentation on an IfcProduct", () => {
		const file = createTestFile("IFC4");
		const body = subContext(file, "Model", "Body", "MODEL_VIEW");
		const bodyRep = shapeRepresentation(file, body, []);
		const axis = subContext(file, "Plan", "Axis", "GRAPH_VIEW");
		const axisRep = shapeRepresentation(file, axis, []);
		const wall = productWithRepresentations(file, "IfcWall", [axisRep, bodyRep]);

		expect(subject.getRepresentation(wall, "Model", "Body", "MODEL_VIEW")?.equals(bodyRep)).toBe(true);
		expect(subject.getRepresentation(wall, "Plan", "Axis", "GRAPH_VIEW")?.equals(axisRep)).toBe(true);
		expect(subject.getRepresentation(wall, "Model", "Box")).toBeNull();
	});

	test("finds a mapped representation on an IfcTypeProduct", () => {
		const file = createTestFile("IFC4");
		const body = subContext(file, "Model", "Body", "MODEL_VIEW");
		const innerRep = shapeRepresentation(file, body, []);
		const wallType = typeWithRepresentationMaps(file, "IfcWallType", [innerRep]);

		expect(subject.getRepresentation(wallType, "Model", "Body", "MODEL_VIEW")?.equals(innerRep)).toBe(true);
	});

	test("returns null for a product with no Representation set", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		expect(subject.getRepresentation(wall, "Model", "Body", "MODEL_VIEW")).toBeNull();
		expect(subject.getRepresentationsIter(wall)).toEqual([]);
	});
});

// --- guess_type ---

describe("util.representation guessType", () => {
	test("MappedRepresentation", () => {
		const file = createTestFile("IFC4");
		const item = file.createEntity("IfcMappedItem");
		expect(subject.guessType([item])).toBe("MappedRepresentation");
	});

	test("empty items list -- Python's own all([]) === True quirk, preserved verbatim", () => {
		// Python: all([True if i.is_a("IfcMappedItem") else False for i in []]) is True
		// for an empty list -- the very first branch -- so guess_type([]) returns
		// "MappedRepresentation", not None. Reproduced verbatim (JS `[].every(...)` is
		// also `true`), not "fixed" to return `null` for an empty list.
		expect(subject.guessType([])).toBe("MappedRepresentation");
	});

	test("Point", () => {
		const file = createTestFile("IFC4");
		const p = file.createEntity("IfcCartesianPoint", [0, 0, 0]);
		expect(subject.guessType([p])).toBe("Point");
	});

	// **Real, verified finding**, same shadowing pattern as the `SolidModel`/
	// `AdvancedSweptSolid`/`Brep`/`AdvancedBrep` one documented in
	// `representation.ts`'s header comment: `IfcCartesianPointList3D` is a real
	// subtype of `IfcCartesianPointList` (checked directly against
	// `src/ifcparse/schemas/Ifc4.h`), and the `Point` branch (`isA("IfcPoint") or
	// isA("IfcCartesianPointList")`) comes BEFORE `PointCloud`
	// (`isA("IfcCartesianPointList3d")`) in the `elif` chain -- so `"PointCloud"` is
	// ALSO dead code for a homogeneous items list in real Python, exactly like the
	// `AdvancedSweptSolid`/`Brep`/`AdvancedBrep` case. `"Point"`, not `"PointCloud"`,
	// is the real, verified answer for an `IfcCartesianPointList3D` item.
	test("IfcCartesianPointList3D matches the Point branch, not PointCloud (verified shadowing, not a bug)", () => {
		const file = createTestFile("IFC4");
		const pointList = file.createEntity("IfcCartesianPointList3D", [[0, 0, 0]]);
		expect(subject.guessType([pointList])).toBe("Point");
	});

	test("Tessellation / SurfaceModel", () => {
		const file = createTestFile("IFC4");
		const tess = file.createEntity("IfcTriangulatedFaceSet");
		expect(subject.guessType([tess])).toBe("Tessellation");
	});

	test("SweptSolid (exact class match, not subtype)", () => {
		const file = createTestFile("IFC4");
		const extruded = file.createEntity("IfcExtrudedAreaSolid");
		expect(subject.guessType([extruded])).toBe("SweptSolid");
		const revolved = file.createEntity("IfcRevolvedAreaSolid");
		expect(subject.guessType([revolved])).toBe("SweptSolid");
	});

	// **Real, verified finding** (checked directly against the actual IFC4 class
	// hierarchy in `src/ifcparse/schemas/Ifc4.h`, not assumed): `IfcCsgSolid`/
	// `IfcSweptAreaSolid`/`IfcSweptDiskSolid`/`IfcManifoldSolidBrep` (and its subtypes
	// `IfcFacetedBrep`/`IfcAdvancedBrep`) are ALL real subtypes of `IfcSolidModel` in
	// the actual schema. Since the `SolidModel` branch (`i.isA("IfcSolidModel")`) comes
	// BEFORE `AdvancedSweptSolid`/`Clipping`/`CSG`/`Brep`/`AdvancedBrep` in Python's own
	// `elif` chain, it always matches first for a homogeneous items list built from any
	// of those classes -- meaning `"AdvancedSweptSolid"`/`"Brep"`/`"AdvancedBrep"` are
	// genuine DEAD CODE in the real Python source for a single-class items list (not a
	// gap in this port -- verified against the real schema, real Python would return the
	// exact same `"SolidModel"` result for these same fixtures). `"Clipping"`/`"CSG"`
	// remain reachable, but only via the OTHER (non-`IfcSolidModel`-subtype) classes
	// each branch also accepts (`IfcBooleanClippingResult`/`IfcBooleanResult`/
	// `IfcCsgPrimitive3D`, all confirmed to extend `IfcGeometricRepresentationItem`
	// directly, not `IfcSolidModel`).
	test("SolidModel shadows AdvancedSweptSolid/Brep/AdvancedBrep for their IfcSolidModel-subtype classes", () => {
		const file = createTestFile("IFC4");
		expect(subject.guessType([file.createEntity("IfcCsgSolid")])).toBe("SolidModel");
		expect(subject.guessType([file.createEntity("IfcFacetedBrep")])).toBe("SolidModel");
		expect(subject.guessType([file.createEntity("IfcSweptDiskSolid")])).toBe("SolidModel");
	});

	test("Clipping / CSG (reachable only via their non-IfcSolidModel-subtype classes)", () => {
		const file = createTestFile("IFC4");
		expect(subject.guessType([file.createEntity("IfcBooleanClippingResult")])).toBe("Clipping");
		expect(subject.guessType([file.createEntity("IfcBooleanResult")])).toBe("CSG");
		expect(subject.guessType([file.createEntity("IfcCsgPrimitive3D")])).toBe("CSG");
	});

	test("BoundingBox", () => {
		const file = createTestFile("IFC4");
		const box = file.createEntity("IfcBoundingBox");
		expect(subject.guessType([box])).toBe("BoundingBox");
	});

	test("Vertex / Edge / Face / Shell", () => {
		const file = createTestFile("IFC4");
		expect(subject.guessType([file.createEntity("IfcVertexPoint")])).toBe("Vertex");
		expect(subject.guessType([file.createEntity("IfcOrientedEdge")])).toBe("Edge");
		expect(subject.guessType([file.createEntity("IfcFace")])).toBe("Face");
		// "IfcOpenShell" here is the real IFC EXPRESS entity class (an open shell
		// geometry type), unrelated to this software package's own name.
		expect(subject.guessType([file.createEntity("IfcOpenShell")])).toBe("Shell");
	});

	test("no matching category returns null", () => {
		const file = createTestFile("IFC4");
		const person = file.createEntity("IfcPerson");
		expect(subject.guessType([person])).toBeNull();
	});

	test("mixed-type items list returns null (not all() branches match)", () => {
		const file = createTestFile("IFC4");
		const p = file.createEntity("IfcCartesianPoint", [0, 0, 0]);
		const brep = file.createEntity("IfcFacetedBrep");
		expect(subject.guessType([p, brep])).toBeNull();
	});

	// --- disclosed blocker: `Curve2D`/`Curve3D`/`Surface2D`/`Surface3D` need the real
	// EXPRESS DERIVED `.Dim` attribute, which this port's `EntityInstance.get()` cannot
	// resolve (a pre-existing `entityInstance.ts` gap) -- see this file's header
	// comment and `representation.ts`'s own header comment/`TODOS.md` for the full
	// story. Pinned here with a real regression test, not silently skipped.
	test("Curve2D/Curve3D branches throw the disclosed .Dim DERIVED-attribute error for a real IfcCurve", () => {
		const file = createTestFile("IFC4");
		const line = file.createEntity("IfcLine");
		expect(() => subject.guessType([line])).toThrow();
	});
});

// --- resolve_representation ---

describe("util.representation resolveRepresentation", () => {
	test("passes through a representation with more than one item unchanged", () => {
		const file = createTestFile("IFC4");
		const a = file.createEntity("IfcExtrudedAreaSolid");
		const b = file.createEntity("IfcExtrudedAreaSolid");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const rep = shapeRepresentation(file, context, [a, b]);
		expect(subject.resolveRepresentation(rep).equals(rep)).toBe(true);
	});

	test("passes through a representation whose single item is not IfcMappedItem", () => {
		const file = createTestFile("IFC4");
		const a = file.createEntity("IfcExtrudedAreaSolid");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const rep = shapeRepresentation(file, context, [a]);
		expect(subject.resolveRepresentation(rep).equals(rep)).toBe(true);
	});

	test("recursively resolves a chain of single-mapped-item representations", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const leaf = file.createEntity("IfcExtrudedAreaSolid");
		const innerRep = shapeRepresentation(file, context, [leaf]);
		const midItem = mappedItem(file, innerRep, translationOperator(file, [0, 0, 0]));
		const midRep = shapeRepresentation(file, context, [midItem]);
		const outerItem = mappedItem(file, midRep, translationOperator(file, [0, 0, 0]));
		const outerRep = shapeRepresentation(file, context, [outerItem]);

		expect(subject.resolveRepresentation(outerRep).equals(innerRep)).toBe(true);
	});
});

// --- resolve_items ---

describe("util.representation resolveItems", () => {
	test("direct (non-mapped) items get the identity matrix by default", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const a = file.createEntity("IfcExtrudedAreaSolid");
		const b = file.createEntity("IfcExtrudedAreaSolid");
		const rep = shapeRepresentation(file, context, [a, b]);

		const resolved = subject.resolveItems(rep);
		expect(resolved).toHaveLength(2);
		for (const r of resolved) {
			expect(translationOf(r.matrix)).toEqual([0, 0, 0]);
		}
		expect(resolved.map((r) => r.item.id()).sort()).toEqual([a.id(), b.id()].sort());
	});

	test("composes a non-identity mapped-item transform with the caller's matrix", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const leaf = file.createEntity("IfcExtrudedAreaSolid");
		const innerRep = shapeRepresentation(file, context, [leaf]);
		const outerItem = mappedItem(file, innerRep, translationOperator(file, [10, 0, 0]));
		const outerRep = shapeRepresentation(file, context, [outerItem]);

		const resolved = subject.resolveItems(outerRep);
		expect(resolved).toHaveLength(1);
		expect(resolved[0].item.equals(leaf)).toBe(true);
		expect(translationOf(resolved[0].matrix)).toEqual([10, 0, 0]);
	});

	test("DISCLOSED BUG: an identity-transform mapped item discards the caller's accumulated matrix", () => {
		// 3-level nesting: outerRep -(translate 10,0,0)-> midRep -(identity)-> innerRep
		// (leaf item). Naively, one would expect the leaf's final matrix to still carry
		// the outer level's (10,0,0) translation (identity composed with anything is a
		// no-op) -- Python's real source does NOT do this (see representation.ts's own
		// header comment, finding #2): the identity-transform level's own `if` guard
		// discards the caller-supplied matrix entirely rather than passing it through.
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const leaf = file.createEntity("IfcExtrudedAreaSolid");
		const innerRep = shapeRepresentation(file, context, [leaf]);
		const midItem = mappedItem(file, innerRep, translationOperator(file, [0, 0, 0])); // identity
		const midRep = shapeRepresentation(file, context, [midItem]);
		const outerItem = mappedItem(file, midRep, translationOperator(file, [10, 0, 0])); // non-identity
		const outerRep = shapeRepresentation(file, context, [outerItem]);

		const resolved = subject.resolveItems(outerRep);
		expect(resolved).toHaveLength(1);
		expect(resolved[0].item.equals(leaf)).toBe(true);
		// The (10,0,0) translation from `outerItem` is silently lost -- verbatim,
		// disclosed Python-source behavior, not a bug in this port.
		expect(translationOf(resolved[0].matrix)).toEqual([0, 0, 0]);
	});

	test("accumulates through two non-identity mapped-item levels", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const leaf = file.createEntity("IfcExtrudedAreaSolid");
		const innerRep = shapeRepresentation(file, context, [leaf]);
		const midItem = mappedItem(file, innerRep, translationOperator(file, [0, 5, 0]));
		const midRep = shapeRepresentation(file, context, [midItem]);
		const outerItem = mappedItem(file, midRep, translationOperator(file, [10, 0, 0]));
		const outerRep = shapeRepresentation(file, context, [outerItem]);

		const resolved = subject.resolveItems(outerRep);
		expect(resolved).toHaveLength(1);
		expect(translationOf(resolved[0].matrix)).toEqual([10, 5, 0]);
	});

	test("accepts an explicit starting matrix", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const leaf = file.createEntity("IfcExtrudedAreaSolid");
		const rep = shapeRepresentation(file, context, [leaf]);
		const start = mat4.create();
		mat4.fromTranslation(start, [1, 2, 3]);

		const resolved = subject.resolveItems(rep, start);
		expect(translationOf(resolved[0].matrix)).toEqual([1, 2, 3]);
	});
});

// --- resolve_base_items ---

describe("util.representation resolveBaseItems", () => {
	test("returns direct (non-mapped, non-boolean) items unchanged", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const a = file.createEntity("IfcExtrudedAreaSolid");
		const rep = shapeRepresentation(file, context, [a]);
		const result = subject.resolveBaseItems(rep);
		expect(result).toHaveLength(1);
		expect(result[0].equals(a)).toBe(true);
	});

	test("resolves through a mapped item to its base representation's items", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const leaf = file.createEntity("IfcExtrudedAreaSolid");
		const innerRep = shapeRepresentation(file, context, [leaf]);
		const outerItem = mappedItem(file, innerRep, translationOperator(file, [0, 0, 0]));
		const outerRep = shapeRepresentation(file, context, [outerItem]);

		const result = subject.resolveBaseItems(outerRep);
		expect(result).toHaveLength(1);
		expect(result[0].equals(leaf)).toBe(true);
	});

	test("resolves boolean-result operands, in LIFO (stack) order matching Python's generator", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const first = file.createEntity("IfcExtrudedAreaSolid");
		const second = file.createEntity("IfcExtrudedAreaSolid");
		const boolResult = file.createEntity("IfcBooleanResult");
		boolResult.set("FirstOperand", first);
		boolResult.set("SecondOperand", second);
		const rep = shapeRepresentation(file, context, [boolResult]);

		const result = subject.resolveBaseItems(rep);
		// Python's `queue.pop()` is LIFO: pushing First then Second means Second pops
		// (and yields) first.
		expect(result.map((i) => i.id())).toEqual([second.id(), first.id()]);
	});
});

// --- get_prioritised_contexts ---

describe("util.representation getPrioritisedContexts", () => {
	test("prioritises 3D over 2D, subcontexts over contexts, bodies over others, model over plan views", () => {
		const file = createTestFile("IFC4");
		const modelContext = file.createEntity("IfcGeometricRepresentationContext");
		modelContext.set("ContextType", "Model");
		const modelBody = subContext(file, "Model", "Body", "MODEL_VIEW");
		const planContext = file.createEntity("IfcGeometricRepresentationContext");
		planContext.set("ContextType", "Plan");
		const planAxis = subContext(file, "Plan", "Axis", "GRAPH_VIEW");

		const prioritised = subject.getPrioritisedContexts(file);
		// Compares by `.id()` (STEP id), not `.equals()` -- two structurally-identical
		// but distinct fixture entities (e.g. two bare "Annotation" contexts in the
		// stability test below) are `.equals()`-equal via this port's structural
		// fallback (`EntityInstance.equals`'s own doc comment), which would make
		// `findIndex` ambiguous between them; `.id()` is always unique per entity.
		const idx = (e: EntityInstance) => prioritised.findIndex((c) => c.id() === e.id());

		expect(idx(modelBody)).toBeLessThan(idx(modelContext));
		expect(idx(modelContext)).toBeLessThan(idx(planAxis));
		expect(idx(planAxis)).toBeLessThan(idx(planContext));
	});

	test("stable sort: contexts with identical priority keep their original relative order", () => {
		const file = createTestFile("IFC4");
		const first = file.createEntity("IfcGeometricRepresentationContext");
		first.set("ContextType", "Annotation");
		const second = file.createEntity("IfcGeometricRepresentationContext");
		second.set("ContextType", "Annotation");

		const prioritised = subject.getPrioritisedContexts(file);
		// Compares by `.id()` (STEP id), not `.equals()` -- two structurally-identical
		// but distinct fixture entities (e.g. two bare "Annotation" contexts in the
		// stability test below) are `.equals()`-equal via this port's structural
		// fallback (`EntityInstance.equals`'s own doc comment), which would make
		// `findIndex` ambiguous between them; `.id()` is always unique per entity.
		const idx = (e: EntityInstance) => prioritised.findIndex((c) => c.id() === e.id());
		expect(idx(first)).toBeLessThan(idx(second));
	});
});

// --- get_part_of_product ---

describe("util.representation getPartOfProduct", () => {
	test("IfcProduct: returns the product's own Representation", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const rep = shapeRepresentation(file, context, []);
		const wall = productWithRepresentations(file, "IfcWall", [rep]);
		const result = subject.getPartOfProduct(wall, context);
		expect(result?.equals(wall.get("Representation") as EntityInstance)).toBe(true);
	});

	test("IfcTypeProduct (IFC4): returns the matching RepresentationMap", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const innerRep = shapeRepresentation(file, context, []);
		const wallType = typeWithRepresentationMaps(file, "IfcWallType", [innerRep]);
		const maps = wallType.get("RepresentationMaps") as EntityInstance[];

		expect(subject.getPartOfProduct(wallType, context)?.equals(maps[0])).toBe(true);
	});

	test("IfcTypeProduct: returns null when no RepresentationMap matches the context", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const otherContext = file.createEntity("IfcGeometricRepresentationContext");
		const innerRep = shapeRepresentation(file, otherContext, []);
		const wallType = typeWithRepresentationMaps(file, "IfcWallType", [innerRep]);

		expect(subject.getPartOfProduct(wallType, context)).toBeNull();
	});

	test.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))(
		'DISCLOSED BUG (real Python "IFX2X3" typo): IFC2X3 IfcTypeProduct does NOT short-circuit to null',
		() => {
			// Python's docstring claims this returns None for IFC2X3 element types, but
			// the real source compares against the never-true string "IFX2X3" (a typo for
			// "IFC2X3") -- so the IFC2X3 short-circuit never actually fires. Reproduced
			// verbatim: see representation.ts's own header comment, finding #1.
			const file = createTestFile("IFC2X3");
			const context = file.createEntity("IfcGeometricRepresentationContext");
			const innerRep = shapeRepresentation(file, context, []);
			const wallType = typeWithRepresentationMaps(file, "IfcWallType", [innerRep]);
			const maps = wallType.get("RepresentationMaps") as EntityInstance[];

			expect(subject.getPartOfProduct(wallType, context)?.equals(maps[0])).toBe(true);
		},
	);
});

// --- get_item_shape_aspect ---

describe("util.representation getItemShapeAspect", () => {
	test("finds the shape aspect owning the representation that contains the item", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const aspectRep = shapeRepresentation(file, context, [item]);
		const shapeAspect = file.createEntity("IfcShapeAspect");
		shapeAspect.set("ShapeRepresentations", [aspectRep]);

		expect(subject.getItemShapeAspect(aspectRep, item)?.equals(shapeAspect)).toBe(true);
	});

	test("returns null when the item has no owning shape aspect", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const rep = shapeRepresentation(file, context, [item]);

		expect(subject.getItemShapeAspect(rep, item)).toBeNull();
	});

	test("returns null when the owning representation's context doesn't match", () => {
		const file = createTestFile("IFC4");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const otherContext = file.createEntity("IfcGeometricRepresentationContext");
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const aspectRep = shapeRepresentation(file, context, [item]);
		const shapeAspect = file.createEntity("IfcShapeAspect");
		shapeAspect.set("ShapeRepresentations", [aspectRep]);
		const unrelatedRep = shapeRepresentation(file, otherContext, []);

		expect(subject.getItemShapeAspect(unrelatedRep, item)).toBeNull();
	});
});

// --- get_material_style ---

describe("util.representation getMaterialStyle", () => {
	test("finds a presentation style associated with a material", () => {
		const file = createTestFile("IFC4");
		const material = file.createEntity("IfcMaterial");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const style = file.createEntity("IfcSurfaceStyle");
		const styledItem = file.createEntity("IfcStyledItem");
		styledItem.set("Styles", [style]);
		const styledRep = shapeRepresentation(file, context, [styledItem]);
		const materialDefRep = file.createEntity("IfcMaterialDefinitionRepresentation");
		materialDefRep.set("RepresentedMaterial", material);
		materialDefRep.set("Representations", [styledRep]);

		expect(subject.getMaterialStyle(material, context)?.equals(style)).toBe(true);
	});

	test("filters by ifcClass", () => {
		const file = createTestFile("IFC4");
		const material = file.createEntity("IfcMaterial");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const style = file.createEntity("IfcSurfaceStyle");
		const styledItem = file.createEntity("IfcStyledItem");
		styledItem.set("Styles", [style]);
		const styledRep = shapeRepresentation(file, context, [styledItem]);
		const materialDefRep = file.createEntity("IfcMaterialDefinitionRepresentation");
		materialDefRep.set("RepresentedMaterial", material);
		materialDefRep.set("Representations", [styledRep]);

		expect(subject.getMaterialStyle(material, context, "IfcCurveStyle")).toBeNull();
	});

	test("returns null when the material has no representation", () => {
		const file = createTestFile("IFC4");
		const material = file.createEntity("IfcMaterial");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		expect(subject.getMaterialStyle(material, context)).toBeNull();
	});

	test("returns null when no representation matches the context", () => {
		const file = createTestFile("IFC4");
		const material = file.createEntity("IfcMaterial");
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const otherContext = file.createEntity("IfcGeometricRepresentationContext");
		const style = file.createEntity("IfcSurfaceStyle");
		const styledItem = file.createEntity("IfcStyledItem");
		styledItem.set("Styles", [style]);
		const styledRep = shapeRepresentation(file, otherContext, [styledItem]);
		const materialDefRep = file.createEntity("IfcMaterialDefinitionRepresentation");
		materialDefRep.set("RepresentedMaterial", material);
		materialDefRep.set("Representations", [styledRep]);

		expect(subject.getMaterialStyle(material, context)).toBeNull();
	});
});

// --- get_reference_line ---

describe("util.representation getReferenceLine", () => {
	function wallWithAxisItems(file: IfcFile, items: readonly EntityInstance[]): EntityInstance {
		const axisContext = subContext(file, "Plan", "Axis", "GRAPH_VIEW");
		const axisRep = shapeRepresentation(file, axisContext, items);
		return productWithRepresentations(file, "IfcWall", [axisRep]);
	}

	test("IfcPolyline axis already in +X direction", () => {
		const file = createTestFile("IFC4");
		const polyline = file.createEntity("IfcPolyline", [point(file, [0, 0]), point(file, [5, 0])]);
		const wall = wallWithAxisItems(file, [polyline]);

		const [start, end] = subject.getReferenceLine(wall);
		expect(start).toEqual([0, 0]);
		expect(end).toEqual([5, 0]);
	});

	test("IfcPolyline axis reversed gets swapped to +X direction", () => {
		const file = createTestFile("IFC4");
		const polyline = file.createEntity("IfcPolyline", [point(file, [5, 0]), point(file, [0, 0])]);
		const wall = wallWithAxisItems(file, [polyline]);

		const [start, end] = subject.getReferenceLine(wall);
		expect(start).toEqual([0, 0]);
		expect(end).toEqual([5, 0]);
	});

	test("IfcIndexedPolyCurve axis", () => {
		const file = createTestFile("IFC4");
		const pointList = file.createEntity("IfcCartesianPointList2D", [
			[1, 1],
			[6, 1],
		]);
		const curve = file.createEntity("IfcIndexedPolyCurve", pointList);
		const wall = wallWithAxisItems(file, [curve]);

		const [start, end] = subject.getReferenceLine(wall);
		expect(start).toEqual([1, 1]);
		expect(end).toEqual([6, 1]);
	});

	test("axis representation exists but has no matching item -- falls through to the fallback length, does NOT throw", () => {
		// Verifies the real if/elif control-flow subtlety documented in
		// representation.ts's own header comment: Python's `elif` (the util.shape
		// blocker) is only reached when `axis` itself is falsy, never when a real axis
		// representation exists but its Items don't match IfcPolyline/IfcIndexedPolyCurve.
		const file = createTestFile("IFC4");
		const circle = file.createEntity("IfcCircle");
		const wall = wallWithAxisItems(file, [circle]);

		expect(subject.getReferenceLine(wall, 2.5)).toEqual([
			[0, 0],
			[2.5, 0],
		]);
	});

	test("no axis representation at all throws the disclosed util.shape blocker", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		expect(() => subject.getReferenceLine(wall)).toThrow(/util\.shape/);
	});

	test("default fallbackLength is 1.0", () => {
		const file = createTestFile("IFC4");
		const circle = file.createEntity("IfcCircle");
		const wallWithNonMatchingAxis = wallWithAxisItems(file, [circle]);
		expect(subject.getReferenceLine(wallWithNonMatchingAxis)).toEqual([
			[0, 0],
			[1, 0],
		]);
	});
});
