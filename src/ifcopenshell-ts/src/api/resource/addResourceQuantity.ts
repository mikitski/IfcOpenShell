// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/add_resource_quantity.py` (src/ifcopenshell-
// python, 83 lines) -- part of this project's brand-new `api.resource` chunk (see
// `./index.ts`'s own header comment for the module's overall scope). Creates a new
// `IfcPhysicalSimpleQuantity` subtype (`IfcQuantityCount`/`IfcQuantityTime`/etc.),
// validated against `util/resource.ts`'s already-landed `resourcesToQuantities` table
// (Python: `RESOURCES_TO_QUANTITIES`), and assigns it as the resource's `BaseQuantity`
// (replacing and deep-purging any previous one).
//
// --- `quantity[3] = 0` / `quantity[3] = 0.0`, ported via `setByIndex(3, ...)` ---
//
// Real Python's own inline comment says it plainly: `# 3 IfcPhysicalSimpleQuantity
// Value` -- every `IfcPhysicalSimpleQuantity` subtype (`IfcQuantityCount`/
// `IfcQuantityTime`/`IfcQuantityArea`/`IfcQuantityLength`/`IfcQuantityVolume`/
// `IfcQuantityWeight`) shares the exact same attribute layout (`Name`/`Description`/
// `Unit`/`<X>Value`/`Formula`), verified directly against `ifc4.d.ts` -- index 3 is
// always that subtype's own `Value` field, regardless of which one was created. The
// `ifc_class == "IfcQuantityCount"` branch (writing a JS/Python `int` `0` vs a `float`
// `0.0`) is preserved verbatim below even though a plain JS `number` doesn't carry
// Python's `int`/`float` distinction at the value level -- this port's native
// `setByIndex` primitive resolves the correct EXPRESS INTEGER-vs-REAL serialization
// from the attribute's own schema-declared type (`CountValue` is INTEGER,
// `TimeValue`/etc. are REAL), not from any tag on the JS value passed in, so this is a
// no-op distinction at the TS call site -- kept only for readability/traceability
// against the real source, not because it changes behavior here.
//
// --- IFC2X3's `IfcConstructionResource.BaseQuantity` is typed `IfcMeasureWithUnit`,
//     not `IfcPhysicalQuantity` -- a real, disclosed, IFC2X3-only schema divergence,
//     confirmed NOT to block this function ---
//
// `ifc2x3.d.ts`'s `IfcConstructionResource.BaseQuantity: IfcMeasureWithUnit | null`
// vs. `ifc4.d.ts`'s/`ifc4x3.d.ts`'s `BaseQuantity: IfcPhysicalQuantity | null` -- a
// real IFC2X3 EXPRESS schema quirk (fixed in IFC4), not a `.d.ts`-generation artifact.
// Despite this, real Python's own `TestAddResourceQuantityIFC2X3` test (see
// `test/api/resource/test_add_resource_quantity.py`) assigns an actual
// `IfcPhysicalSimpleQuantity` subtype into `resource.BaseQuantity` on IFC2X3 and
// passes -- confirming neither the real SWIG-bound attribute setter nor this port's
// own native `setByIndex` primitive enforces entity-typed-attribute subtype
// compatibility at assignment time (only EXPRESS schema *validation* tooling, not
// exercised by this function or its tests, would catch the mismatch). Verified
// directly against this port's own test suite (`addResourceQuantity.test.ts`'s IFC2X3
// case passes), not merely assumed from the Python precedent.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { resourcesToQuantities } from "../../util/resource";
import { wrapUsecase } from "../hooks";

export interface AddResourceQuantitySettings {
	/** The `IfcConstructionResource` to add a quantity to. */
	resource: EntityInstance;
	/**
	 * The type of quantity to add, chosen from `IfcQuantityArea` (for material),
	 * `IfcQuantityCount` (for products), `IfcQuantityLength` (for material),
	 * `IfcQuantityTime` (for equipment or labour), `IfcQuantityVolume` (for material),
	 * and `IfcQuantityWeight` (for material). Python default: `"IfcQuantityCount"`.
	 */
	ifcClass?: string;
}

function addResourceQuantityUsecase(file: IfcFile, settings: AddResourceQuantitySettings): EntityInstance {
	const { resource } = settings;
	const ifcClass = settings.ifcClass ?? "IfcQuantityCount";

	const resourceType = resource.isA();
	// Python: `RESOURCES_TO_QUANTITIES[resource_type]` -- raises `KeyError` immediately
	// for a `resourceType` with no table entry, never reaching the `ValueError` below.
	// Not pre-guarded here either: `supportedQuantities` is `undefined` for such a
	// type, and `.includes` on it throws a real (if differently-shaped -- `TypeError`,
	// not `KeyError`) error for the exact same reason, rather than silently falling
	// through to a friendlier message Python itself never produces for this case.
	const supportedQuantities = resourcesToQuantities[resourceType];
	if (!supportedQuantities.includes(ifcClass)) {
		throw new Error(
			`Resource type '${resourceType}' does not support quantity type '${ifcClass}'. ` +
				`Supported quantities: ${supportedQuantities.join(",")}`,
		);
	}

	const quantity = file.createEntity(ifcClass, "Unnamed");
	// 3 IfcPhysicalSimpleQuantity Value -- see this file's header comment for why the
	// int-vs-float branch below is a no-op distinction in this port.
	if (ifcClass === "IfcQuantityCount") {
		quantity.setByIndex(3, 0);
	} else {
		quantity.setByIndex(3, 0.0);
	}
	const oldQuantity = resource.get("BaseQuantity") as EntityInstance | null;
	resource.set("BaseQuantity", quantity);
	if (oldQuantity) elementUtil.removeDeep2(file, oldQuantity);
	return quantity;
}

/**
 * Adds a quantity to a resource (Python: `ifcopenshell.api.resource.add_resource_quantity`).
 *
 * The quantity of a resource represents the "unit quantity" of that resource. For
 * example, labour might be hired on a daily basis (8 hours). There are different types
 * of quantities (e.g. volume, count, or time). Which quantity is used depends on the
 * type of resource. Material resources may be quantified in terms of length, area,
 * volume, or weight. Equipment and labour resources are quantified in terms of time.
 * Product resources are quantified in terms of counts.
 *
 * This base quantity is then used in other calculations.
 *
 * @returns The newly created quantity, depending on the IFC class.
 *
 * @example
 * ```ts
 * const crew = api.resource.addResource(model, { ifcClass: "IfcCrewResource" });
 * const labour = api.resource.addResource(model, { parentResource: crew, ifcClass: "IfcLaborResource" });
 * // Labour resource is quantified in terms of time.
 * const quantity = api.resource.addResourceQuantity(model, { resource: labour, ifcClass: "IfcQuantityTime" });
 * // Store the time used in hours.
 * api.resource.editResourceQuantity(model, { physicalQuantity: quantity, attributes: { TimeValue: 8.0 } });
 * ```
 */
export const addResourceQuantity = wrapUsecase("resource.add_resource_quantity", addResourceQuantityUsecase);
