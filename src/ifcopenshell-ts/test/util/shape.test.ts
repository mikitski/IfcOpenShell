// This file was generated with the assistance of an AI coding tool.
//
// `test/util/test_shape.py` does not exist anywhere in `src/ifcopenshell-python`
// (confirmed by a repo-wide search) -- `util/shape.py` has no dedicated Python test file
// to port from, matching `util.constraint`'s/`util.representation`'s own established
// precedent. Every test below is therefore original coverage, written directly against
// `shape.py`'s real source / `shape.ts`'s own port, covering the 4 functions this chunk
// ports for real (`isX`/`getProfiles`/`getExtrusions`/`getBaseExtrusions`) -- see
// `shape.ts`'s own header comment for why the module's other 39 functions are not
// ported at all (a genuine, disclosed `ifcopenshell.geom` hard blocker, not something
// to write speculative tests against).
//
// No `ifcopenshell.api.*` fixtures to port from either (same reason) -- local fixture
// helpers below build the underlying `IfcGeometricRepresentationSubContext`/
// `IfcShapeRepresentation`/`IfcMappedItem`/`IfcRepresentationMap`/
// `IfcRelAssociatesMaterial` entity graphs directly (`file.createEntity(...)` +
// `.set(...)`), matching `test/util/representation.test.ts`'s/`test/util/element.test.ts`'s
// own established pattern for this exact gap.
//
// A real finding is pinned by a dedicated test here, not just described in prose (see
// `shape.ts`'s own `getBaseExtrusions` doc comment for the full story): `getExtrusions`
// and `getBaseExtrusions` are written with different control-flow style in the real
// Python source, but are behaviorally identical for every input -- both unwrap an
// item's `IfcBooleanResult.FirstOperand` chain and append it only if the fully-unwrapped
// item is an `IfcExtrudedAreaSolid`.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import * as subject from "../../src/util/shape";
import { createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header comment) ---

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

/** Builds an `IfcWall` with a single "Model"/"Body"/"MODEL_VIEW" `IfcShapeRepresentation`
 * containing `items` -- the representation `getExtrusions`/`getBaseExtrusions`/
 * `getProfiles`'s fallback path all look for. */
function wallWithBodyItems(file: IfcFile, items: readonly EntityInstance[]): EntityInstance {
	const context = subContext(file, "Model", "Body", "MODEL_VIEW");
	const rep = shapeRepresentation(file, context, items);
	return productWithRepresentations(file, "IfcWall", [rep]);
}

function assignMaterial(file: IfcFile, elements: readonly EntityInstance[], material: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssociatesMaterial");
	rel.set("RelatedObjects", elements);
	rel.set("RelatingMaterial", material);
	return rel;
}

// --- is_x ---

describe("util.shape isX", () => {
	test("true when value is within the default tolerance", () => {
		expect(subject.isX(5.0000005, 5.0)).toBe(true);
	});

	test("false when value is outside the default tolerance", () => {
		expect(subject.isX(5.00001, 5.0)).toBe(false);
	});

	test("boundary is a strict less-than, not less-than-or-equal", () => {
		// Python: `abs(x - value) < tolerance` -- exactly at the tolerance is `false`.
		expect(subject.isX(5.000001, 5.0, 1e-6)).toBe(false);
	});

	test("custom tolerance overrides the default", () => {
		expect(subject.isX(5.5, 5.0, 1.0)).toBe(true);
		expect(subject.isX(5.5, 5.0, 0.1)).toBe(false);
	});

	test("tolerance=0 is honored explicitly, not treated as 'use the default'", () => {
		// Python: `if tolerance is None: tolerance = tol` -- `0` is not `None`, so a
		// caller passing `0` explicitly gets a strict equality check, not the 1e-6
		// default. Verifies the `??` (nullish coalescing, not `||`) choice in `isX`.
		expect(subject.isX(5.0, 5.0, 0)).toBe(false);
		expect(subject.isX(5.0000001, 5.0, 0)).toBe(false);
	});

	test("negative values", () => {
		expect(subject.isX(-5.0000001, -5.0)).toBe(true);
		expect(subject.isX(-5.1, -5.0)).toBe(false);
	});
});

// --- get_extrusions ---

describe("util.shape getExtrusions", () => {
	test("returns null when the element has no Model/Body/MODEL_VIEW representation", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		expect(subject.getExtrusions(wall)).toBeNull();
	});

	test("a plain IfcExtrudedAreaSolid item is returned directly", () => {
		const file = createTestFile("IFC4");
		const extrusion = file.createEntity("IfcExtrudedAreaSolid");
		const wall = wallWithBodyItems(file, [extrusion]);

		const result = subject.getExtrusions(wall);
		expect(result?.map((e) => e.id())).toEqual([extrusion.id()]);
	});

	test("unwraps a single IfcBooleanResult.FirstOperand to find the extrusion", () => {
		const file = createTestFile("IFC4");
		const extrusion = file.createEntity("IfcExtrudedAreaSolid");
		const secondOperand = file.createEntity("IfcExtrudedAreaSolid");
		const boolResult = file.createEntity("IfcBooleanResult");
		boolResult.set("FirstOperand", extrusion);
		boolResult.set("SecondOperand", secondOperand);
		const wall = wallWithBodyItems(file, [boolResult]);

		// Only FirstOperand is ever walked -- SecondOperand is never inspected.
		expect(subject.getExtrusions(wall)?.map((e) => e.id())).toEqual([extrusion.id()]);
	});

	test("unwraps nested IfcBooleanResult.FirstOperand chains", () => {
		const file = createTestFile("IFC4");
		const extrusion = file.createEntity("IfcExtrudedAreaSolid");
		const inner = file.createEntity("IfcBooleanResult");
		inner.set("FirstOperand", extrusion);
		inner.set("SecondOperand", file.createEntity("IfcExtrudedAreaSolid"));
		const outer = file.createEntity("IfcBooleanResult");
		outer.set("FirstOperand", inner);
		outer.set("SecondOperand", file.createEntity("IfcExtrudedAreaSolid"));
		const wall = wallWithBodyItems(file, [outer]);

		expect(subject.getExtrusions(wall)?.map((e) => e.id())).toEqual([extrusion.id()]);
	});

	test("an item that's neither an extrusion nor a boolean result contributes nothing", () => {
		const file = createTestFile("IFC4");
		const circle = file.createEntity("IfcCircle");
		const wall = wallWithBodyItems(file, [circle]);

		expect(subject.getExtrusions(wall)).toEqual([]);
	});

	test("multiple items in one representation are all walked", () => {
		const file = createTestFile("IFC4");
		const first = file.createEntity("IfcExtrudedAreaSolid");
		const second = file.createEntity("IfcExtrudedAreaSolid");
		const boolResult = file.createEntity("IfcBooleanResult");
		boolResult.set("FirstOperand", second);
		boolResult.set("SecondOperand", file.createEntity("IfcExtrudedAreaSolid"));
		const circle = file.createEntity("IfcCircle");
		const wall = wallWithBodyItems(file, [first, boolResult, circle]);

		expect(subject.getExtrusions(wall)?.map((e) => e.id())).toEqual([first.id(), second.id()]);
	});

	test("resolves through a single IfcMappedItem indirection via resolveRepresentation", () => {
		const file = createTestFile("IFC4");
		const extrusion = file.createEntity("IfcExtrudedAreaSolid");
		const context = subContext(file, "Model", "Body", "MODEL_VIEW");
		const innerRep = shapeRepresentation(file, context, [extrusion]);
		const map = file.createEntity("IfcRepresentationMap");
		map.set(
			"MappingOrigin",
			file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0])),
		);
		map.set("MappedRepresentation", innerRep);
		const mapped = file.createEntity("IfcMappedItem");
		mapped.set("MappingSource", map);
		const outerRep = shapeRepresentation(file, context, [mapped]);
		const wall = productWithRepresentations(file, "IfcWall", [outerRep]);

		expect(subject.getExtrusions(wall)?.map((e) => e.id())).toEqual([extrusion.id()]);
	});
});

// --- get_base_extrusions ---

describe("util.shape getBaseExtrusions", () => {
	test("returns null when the element has no Model/Body/MODEL_VIEW representation", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		expect(subject.getBaseExtrusions(wall)).toBeNull();
	});

	test("a plain IfcExtrudedAreaSolid item is returned directly", () => {
		const file = createTestFile("IFC4");
		const extrusion = file.createEntity("IfcExtrudedAreaSolid");
		const wall = wallWithBodyItems(file, [extrusion]);

		expect(subject.getBaseExtrusions(wall)?.map((e) => e.id())).toEqual([extrusion.id()]);
	});

	test("unwraps nested IfcBooleanResult.FirstOperand chains to find the base extrusion", () => {
		const file = createTestFile("IFC4");
		const extrusion = file.createEntity("IfcExtrudedAreaSolid");
		const inner = file.createEntity("IfcBooleanResult");
		inner.set("FirstOperand", extrusion);
		inner.set("SecondOperand", file.createEntity("IfcExtrudedAreaSolid"));
		const outer = file.createEntity("IfcBooleanResult");
		outer.set("FirstOperand", inner);
		outer.set("SecondOperand", file.createEntity("IfcExtrudedAreaSolid"));
		const wall = wallWithBodyItems(file, [outer]);

		expect(subject.getBaseExtrusions(wall)?.map((e) => e.id())).toEqual([extrusion.id()]);
	});

	test("a non-extrusion terminal item after unwrapping contributes nothing", () => {
		const file = createTestFile("IFC4");
		const circle = file.createEntity("IfcCircle");
		const boolResult = file.createEntity("IfcBooleanResult");
		boolResult.set("FirstOperand", circle);
		boolResult.set("SecondOperand", file.createEntity("IfcExtrudedAreaSolid"));
		const wall = wallWithBodyItems(file, [boolResult]);

		expect(subject.getBaseExtrusions(wall)).toEqual([]);
	});

	test("multiple items accumulate only the base extrusions, preserving order", () => {
		const file = createTestFile("IFC4");
		const direct = file.createEntity("IfcExtrudedAreaSolid");
		const wrapped = file.createEntity("IfcExtrudedAreaSolid");
		const boolResult = file.createEntity("IfcBooleanResult");
		boolResult.set("FirstOperand", wrapped);
		boolResult.set("SecondOperand", file.createEntity("IfcExtrudedAreaSolid"));
		const circle = file.createEntity("IfcCircle");
		const wall = wallWithBodyItems(file, [direct, boolResult, circle]);

		expect(subject.getBaseExtrusions(wall)?.map((e) => e.id())).toEqual([direct.id(), wrapped.id()]);
	});

	test("real finding: getExtrusions and getBaseExtrusions agree on the same representation", () => {
		// See shape.ts's getBaseExtrusions doc comment: different control-flow style,
		// behaviorally identical for every input.
		const file = createTestFile("IFC4");
		const direct = file.createEntity("IfcExtrudedAreaSolid");
		const wrapped = file.createEntity("IfcExtrudedAreaSolid");
		const boolResult = file.createEntity("IfcBooleanResult");
		boolResult.set("FirstOperand", wrapped);
		boolResult.set("SecondOperand", file.createEntity("IfcExtrudedAreaSolid"));
		const circle = file.createEntity("IfcCircle");
		const wall = wallWithBodyItems(file, [direct, boolResult, circle]);

		expect(subject.getExtrusions(wall)?.map((e) => e.id())).toEqual(
			subject.getBaseExtrusions(wall)?.map((e) => e.id()),
		);
	});
});

// --- get_profiles ---

describe("util.shape getProfiles", () => {
	test("returns profiles from an IfcMaterialProfileSet directly associated with the element", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		const profile = file.createEntity("IfcArbitraryClosedProfileDef");
		const materialProfile = file.createEntity("IfcMaterialProfile");
		materialProfile.set("Profile", profile);
		const profileSet = file.createEntity("IfcMaterialProfileSet");
		profileSet.set("MaterialProfiles", [materialProfile]);
		assignMaterial(file, [wall], profileSet);

		expect(subject.getProfiles(wall).map((p) => p.id())).toEqual([profile.id()]);
	});

	test("should_skip_usage=True (getProfiles' fixed getMaterial call): resolves through an IfcMaterialProfileSetUsage", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		const profile = file.createEntity("IfcArbitraryClosedProfileDef");
		const materialProfile = file.createEntity("IfcMaterialProfile");
		materialProfile.set("Profile", profile);
		const profileSet = file.createEntity("IfcMaterialProfileSet");
		profileSet.set("MaterialProfiles", [materialProfile]);
		const usage = file.createEntity("IfcMaterialProfileSetUsage");
		usage.set("ForProfileSet", profileSet);
		assignMaterial(file, [wall], usage);

		expect(subject.getProfiles(wall).map((p) => p.id())).toEqual([profile.id()]);
	});

	test("multiple material profiles", () => {
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		const profileA = file.createEntity("IfcArbitraryClosedProfileDef");
		const profileB = file.createEntity("IfcArbitraryClosedProfileDef");
		const materialProfileA = file.createEntity("IfcMaterialProfile");
		materialProfileA.set("Profile", profileA);
		const materialProfileB = file.createEntity("IfcMaterialProfile");
		materialProfileB.set("Profile", profileB);
		const profileSet = file.createEntity("IfcMaterialProfileSet");
		profileSet.set("MaterialProfiles", [materialProfileA, materialProfileB]);
		assignMaterial(file, [wall], profileSet);

		expect(subject.getProfiles(wall).map((p) => p.id())).toEqual([profileA.id(), profileB.id()]);
	});

	test("falls back to get_extrusions' SweptArea when there's no IfcMaterialProfileSet", () => {
		const file = createTestFile("IFC4");
		const profile = file.createEntity("IfcArbitraryClosedProfileDef");
		const extrusion = file.createEntity("IfcExtrudedAreaSolid");
		extrusion.set("SweptArea", profile);
		const wall = wallWithBodyItems(file, [extrusion]);

		expect(subject.getProfiles(wall).map((p) => p.id())).toEqual([profile.id()]);
	});

	test("an unrelated (non-profile-set) material also falls back to get_extrusions", () => {
		const file = createTestFile("IFC4");
		const profile = file.createEntity("IfcArbitraryClosedProfileDef");
		const extrusion = file.createEntity("IfcExtrudedAreaSolid");
		extrusion.set("SweptArea", profile);
		const wall = wallWithBodyItems(file, [extrusion]);
		assignMaterial(file, [wall], file.createEntity("IfcMaterial"));

		expect(subject.getProfiles(wall).map((p) => p.id())).toEqual([profile.id()]);
	});

	test("DISCLOSED BUG (matching Python): throws when there's no material profile set AND no representation at all", () => {
		// Python: `[e.SweptArea for e in get_extrusions(element)]` has no null-guard
		// against `get_extrusions` returning `None` -- see getProfiles' own doc comment.
		const file = createTestFile("IFC4");
		const wall = file.createEntity("IfcWall");
		expect(() => subject.getProfiles(wall)).toThrow();
	});
});
