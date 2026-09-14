// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset/add_qto.py` (src/ifcopenshell-python, 128 lines).
// Creates a new, blank named `IfcElementQuantity` and attaches it to a product. This is
// chunk 2 of 3 for `api.pset`'s remaining real Python files (`./addPset.ts`'s own header
// comment covers chunk 1; `edit_pset.py` -- chunk 3, the biggest file in the whole `api`
// package -- remains a separate, future PR).
//
// --- NOT symmetric with `./addPset.ts` -- read directly, not assumed ---
//
// This chunk's own task brief explicitly warned not to assume `add_qto` supports the
// same 4 attachment mechanisms `add_pset` does. Confirmed by reading `add_qto.py`
// directly: it supports only 2 of `add_pset`'s 4 -- `IfcObject`/`IfcContext` and
// `IfcTypeObject`. There is no material/profile branch at all (quantity sets are never
// attached to an `IfcMaterialDefinition`/`IfcProfileDef` the way property sets can be --
// makes sense conceptually too: "quantities" are take-off measurements of a physical
// occurrence/type, not descriptive metadata of a material or profile definition). Any
// other product class silently falls through to returning `undefined` in this port --
// matching real Python's own `execute()` just as faithfully: neither of its two `if`/
// `elif` branches has a final `else`, so Python's own function implicitly returns `None`
// for an unsupported class, NOT a `TypeError` the way `add_pset.py`'s explicit final
// `raise TypeError(...)` does. This asymmetry (silent `None`/`undefined` here vs. a loud
// exception in `add_pset`) is a genuine, confirmed difference between the two real
// Python source files, not an omission introduced by this port.
//
// --- Also NOT delegating to `./assignPset.ts`, unlike `add_pset.py` ---
//
// `add_pset.py`'s `IfcObject`/`IfcContext` and `IfcTypeObject` branches both delegate
// the actual pset-to-product linking to `assign_pset` (see `./addPset.ts`'s header
// comment, mechanism 1/2). `add_qto.py` does NOT do this -- it builds the
// `IfcRelDefinesByProperties`/`HasPropertySets` link itself, inline, in each branch.
// Confirmed by reading the actual source: no `ifcopenshell.api.pset.assign_pset` import
// or call anywhere in `add_qto.py`. Ported below the same way -- inline, not routed
// through `./assignPset.ts` -- to stay faithful to the real, independent code path
// (even though the end *result* -- a fresh `IfcRelDefinesByProperties`/an appended
// `HasPropertySets` entry -- looks the same as what `assignPset`'s own "no existing rel"
// path would produce).
//
// --- Dedup-by-name, and the qto's own attribute shape (verified against the generated
// `.d.ts`s directly, all 3 schemas) ---
//
// `IfcObject`/`IfcContext`: for each existing `IsDefinedBy` rel, if it's an
// `IfcRelDefinesByProperties` whose `RelatingPropertyDefinition.Name` already matches,
// that EXISTING qto is returned (no new entity created). `IfcTypeObject`: same idea,
// checked against `HasPropertySets` directly (no rel/inverse involved, matching
// `add_pset.py`'s identical type-branch shape).
//
// `IfcElementQuantity`: `GlobalId`(0), `OwnerHistory`(1), `Name`(2), `Description`(3),
// `MethodOfMeasurement`(4), `Quantities`(5) -- IDENTICAL order in all 3 schemas, no
// DERIVE-attribute interleaving. `IfcElementQuantity` itself is available on ALL 3
// schemas (confirmed directly against `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts` -- no
// missing interface on IFC2X3), and real Python's own test suite has a dedicated
// `TestAddQtoIFC2X3` class exercising exactly this (`test_add_qto.py`), so this port
// applies no IFC2X3 guard either, matching real Python exactly.
//
// `IfcRelDefinesByProperties`: `GlobalId`(0), `OwnerHistory`(1), `Name`(2),
// `Description`(3), `RelatedObjects`(4), `RelatingPropertyDefinition`(5) -- same order
// used by `./assignPset.ts`'s own already-verified positional creation.
//
// `MethodOfMeasurement`: real Python sets this to the literal string `"BaseQuantities"`
// whenever `name` ends with `"BaseQuantities"` (e.g. the buildingSMART-standardised
// `"Qto_WallBaseQuantities"`), else `None` -- a real, if narrow, magic-string-based
// heuristic in the real source itself, reproduced verbatim below, not second-guessed.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

export interface AddQtoSettings {
	/** The `IfcObject` (or `IfcContext`/`IfcTypeObject`) to assign a quantity set to. */
	product: EntityInstance;
	/**
	 * The name of the quantity set. Quantity sets standardised by buildingSMART typically
	 * use a "Qto_" prefix, e.g. "Qto_WallBaseQuantities".
	 */
	name: string;
}

function createQto(file: IfcFile, name: string): EntityInstance {
	const methodOfMeasurement = name.endsWith("BaseQuantities") ? "BaseQuantities" : null;
	// IfcElementQuantity: GlobalId(0), OwnerHistory(1), Name(2), Description(3, skipped),
	// MethodOfMeasurement(4) -- see header comment.
	return file.createEntity(
		"IfcElementQuantity",
		guid.new(),
		createOwnerHistory(file, {}),
		name,
		null,
		methodOfMeasurement,
	);
}

function addQtoUsecase(file: IfcFile, settings: AddQtoSettings): EntityInstance | undefined {
	const { product, name } = settings;

	if (product.isA("IfcObject") || product.isA("IfcContext")) {
		for (const rel of (product.get("IsDefinedBy") as EntityInstance[] | null) ?? []) {
			if (
				rel.isA("IfcRelDefinesByProperties") &&
				(rel.get("RelatingPropertyDefinition") as EntityInstance).get("Name") === name
			) {
				return rel.get("RelatingPropertyDefinition") as EntityInstance;
			}
		}

		const qto = createQto(file, name);
		file.createEntity(
			"IfcRelDefinesByProperties",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			[product], // RelatedObjects
			qto, // RelatingPropertyDefinition
		);
		return qto;
	}

	if (product.isA("IfcTypeObject")) {
		for (const definition of (product.get("HasPropertySets") as EntityInstance[] | null) ?? []) {
			if (definition.get("Name") === name) {
				return definition;
			}
		}
		const qto = createQto(file, name);
		const hasPropertySets = (product.get("HasPropertySets") as EntityInstance[] | null) ?? [];
		product.set("HasPropertySets", [...hasPropertySets, qto]);
		return qto;
	}

	// No `else`/`raise` here -- see header comment: real Python's own `execute()` simply
	// falls off the end (implicit `None`) for an unsupported product class, unlike
	// `add_pset.py`'s explicit `TypeError`.
	return undefined;
}

/**
 * Adds a new quantity set to a product (Python: `ifcopenshell.api.pset.add_qto`).
 *
 * Products, such as physical objects or types in IFC may have quantities associated
 * with them. These quantities are typically simple key-value metadata with data types --
 * for example, a wall type may have a quantity called `NetSideArea` with an area value
 * of `4.2`. Quantities are grouped into quantity sets, so that related quantities are
 * grouped together.
 *
 * Quantities are similar to, but different from properties in that they may store a
 * method of measurement or formula, and may have parametric relationships to other
 * calculated values (cost schedules, resource utilisation, construction task durations).
 *
 * This function adds a blank named quantity set. Once you have a quantity set you may
 * add quantities using `api.pset.editQto`.
 *
 * See also `api.pset.addPset` if you want arbitrary metadata, rather than
 * quantification data.
 *
 * @returns The newly created (or, if one with this exact `name` already existed,
 * pre-existing) `IfcElementQuantity` -- or `undefined` for an unsupported product class
 * (see header comment: real Python returns `None` here, not a `TypeError`).
 *
 * @example
 * ```ts
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * // Note that this only creates and assigns an empty quantity set. Quantities still
 * // need to be added via `editQto` -- a blank quantity set is invalid IFC.
 * const qto = api.pset.addQto(model, { product: wall, name: "Qto_WallBaseQuantities" });
 * api.pset.editQto(model, { qto, properties: { NetSideArea: 4.2 } });
 * ```
 */
export const addQto = wrapUsecase("pset.add_qto", addQtoUsecase);
