// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/attribute/edit_attributes.py` (src/ifcopenshell-python, 85
// lines) -- the ONLY real file of `ifcopenshell.api.attribute`, a brand-new module (no
// TS port of any kind existed before this chunk; discovered by diffing
// `ls src/ifcopenshell-python/ifcopenshell/api/` against `ls src/ifcopenshell-ts/src/
// api/` -- the only top-level `api.*` Python module with zero TS coverage). No unported
// dependency of any kind: `api.owner.updateOwnerHistory` and `util.element.getType` are
// both already landed and used directly.
//
// *** Correction of this chunk's own task brief, verified directly against the real
// source before writing any code -- disclosed here rather than silently followed: ***
// the brief asserted `edit_attributes.py` is "NOT registered via `ifcopenshell.api.run`/
// an internal `Usecase` class... confirmed by there being no such wiring in the file",
// and that it should therefore be ported as a plain, non-`wrapUsecase`-wrapped function
// like `api.alignment`'s query/getter files. That's true of the FILE itself (no
// `Usecase` class, no `ifcopenshell.api.run` call anywhere in `edit_attributes.py`) but
// misses the sibling `ifcopenshell/api/attribute/__init__.py`, which calls
// `wrap_usecases(__path__, __name__)` -- the exact same reflection-based pre/post-
// listener auto-wrapping every other mutating `api.*` module uses (confirmed: 33 of the
// 35 real `api/*/__init__.py` files call `wrap_usecases`; only `api.alignment`/
// `api.cogo` -- pure getter/query modules -- do not). So `edit_attributes` genuinely IS
// wrapped in real Python's pre/post-listener system, structurally identical to
// `../type/unassignType.ts`'s own single-function module (whose sibling `api/type/
// __init__.py` calls the identical `wrap_usecases(__path__, __name__)`). Ported here
// with `wrapUsecase`, matching `unassignType.ts`'s precedent, NOT `api.alignment`'s
// plain-function shape.
//
// --- Shape (read directly from the real Python source) ---
//
// 1. Assign every `attributes` entry directly onto `product` (Python: `setattr(product,
//    name, value)` in a loop) -- a plain, portable translation, `product.set(name,
//    value)`.
//
// 2. PredefinedType/ElementType/ObjectType consistency maintenance (lines 66-82 of the
//    real source) -- real, non-trivial business logic, ported exactly, preserving the
//    real walrus-operator (`:=`) short-circuit structure: an `if`/`elif` chain gated on
//    whether `ElementType` exists as an ATTRIBUTE on this class AT ALL (not just
//    whether it's currently set), then a NESTED `if`/`elif` on `ObjectType` only when
//    `ElementType` doesn't exist as an attribute at all. This whole block is itself
//    gated on `PredefinedType` existing as an attribute in the first place -- ported via
//    this file's own private `attrOrMissing`/`MISSING` sentinel pair, the exact idiom
//    `util/element.ts` already established for Python's `getattr(x, name, <sentinel>)`
//    (distinguishing "attribute not declared on this class" from "declared but
//    `null`/empty"), redefined here as a small, per-file private helper per this
//    project's own "small pure helper, redefined per file, no cross-file sharing"
//    convention (see e.g. `../pset/editPset.ts`'s own `attrOrNull`/`tryGetAttr`,
//    `../geometry/regenerateWallRepresentation.ts`'s own `attrOrNull`, `../root/
//    removeProduct.ts`'s own `attrOr` -- each file keeps its own private copy rather
//    than importing `util/element.ts`'s non-exported internal one).
//
//    Inside the `ElementType`-doesn't-exist branch, a SINGLE `if`/`elif`/`elif` chain
//    (NOT three independent checks -- only one branch of the three ever fires, matching
//    real Python's `if ... elif ... elif ...` exactly):
//      - `relating_type and relating_type.PredefinedType not in ("NOTDEFINED", None)`:
//        real Python's own comment references a real upstream GitHub issue,
//        https://github.com/buildingSMART/IFC4.3.x-development/issues/818, documenting
//        deliberate handling of a known schema ambiguity (a relating type's own
//        `PredefinedType` allowed to be `None`) -- preserved verbatim below, not a bug.
//        `relating_type.PredefinedType` is read via a direct (default-less) `.get()`
//        call, matching Python's own unguarded `relating_type.PredefinedType` attribute
//        access (would raise `AttributeError` for a type class with no `PredefinedType`
//        attribute at all; this port's `.get()` throws the TS equivalent) -- per `util/
//        element.ts`'s own established "no default -> direct `.get()`, preserves the
//        same throw" convention for a Python attribute access with no `getattr` default.
//      - `object_type is None and predefined_type == "USERDEFINED"` -> `"NOTDEFINED"`.
//      - `object_type and predefined_type != "USERDEFINED"` -> `"USERDEFINED"`.
//
// 3. `if hasattr(product, "OwnerHistory"): update_owner_history(file, element=product)`
//    -- ported via the same `attrOrMissing`/`MISSING`-sentinel existence check (not a
//    value check), then `updateOwnerHistory(file, { element: product })`. Note this is a
//    real, deliberate optimization in real Python: `updateOwnerHistory` itself already
//    independently guards on `element.isA("IfcRoot")` internally (see `../owner/
//    updateOwnerHistory.ts`), so this outer check just avoids the call entirely for a
//    non-`IfcRoot` `product` rather than relying on that inner guard alone -- both are
//    ported, faithfully mirroring the redundancy already present in real Python.
//
// --- Disclosed: zero test coverage in real Python's own upstream suite ---
//
// Confirmed by search: there is no `test/api/attribute/` directory anywhere in
// `src/ifcopenshell-python`'s own test suite, and no other test file imports
// `ifcopenshell.api.attribute.edit_attributes` either -- this function has never had a
// dedicated regression test upstream. `editAttributes.test.ts` (this chunk) is
// therefore an ORIGINAL test suite, not a port of an existing one, covering every real
// branch read directly from the source: a plain attribute edit, both `ElementType`-based
// `USERDEFINED`<->`NOTDEFINED` transitions, the `ObjectType`-based transitions (including
// the `relating_type.PredefinedType not in ("NOTDEFINED", None)` branch, i.e. the #818
// issue's `None`-allowed edge case), and the `OwnerHistory` update trigger.
//
// This function itself is schema-generic, not schema-specific -- it never branches on
// `file.schema` directly, and `util.element.getType`'s own IFC2X3-vs-IFC4+ branch is
// exercised transitively through `getType(product)` above regardless of which schema is
// active -- so `editAttributes.test.ts` below uses `describe.each(AVAILABLE_SCHEMAS)`
// (matching `api.alignment`'s own precedent for schema-generic files, e.g. `getAxis
// Subcontext.test.ts`), not a schema-skip. One real, disclosed per-CLASS (not
// per-function) schema difference informed that test file's own fixture choice, though:
// `IfcWall.PredefinedType` does NOT exist on IFC2X3 at all (confirmed against the
// generated `ifc2x3.d.ts` -- only `ObjectType` is declared there), so its
// occurrence-level (`ObjectType`) fixtures use `IfcSlab`/`IfcSlabType` instead, confirmed
// identical (`ObjectType`/`PredefinedType` both present, no `ElementType`) across all 3
// generated `.d.ts`s -- see that file's own header comment.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getType } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/**
 * Python's `getattr(element, name, ...)` (`edit_attributes.py`'s own private
 * `getattr_safe`, using Python's `Ellipsis` as the "attribute doesn't exist on this
 * class" sentinel) -- the exact same idiom `util/element.ts`'s own (non-exported)
 * `attrOrMissing`/`MISSING` pair already established, redefined here as a small,
 * private, per-file helper per this project's own convention (see this file's header
 * comment for the other files that redefine an equivalent helper locally).
 */
const MISSING: unique symbol = Symbol("api.attribute.editAttributes: attribute not declared on this class");

function attrOrMissing(element: EntityInstance, name: string): unknown {
	try {
		return element.get(name);
	} catch {
		return MISSING;
	}
}

export interface EditAttributesSettings {
	/** The product you want to edit. This may be any rooted IFC entity. */
	product: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editAttributesUsecase(file: IfcFile, settings: EditAttributesSettings): void {
	const { product, attributes } = settings;

	for (const [name, value] of Object.entries(attributes)) {
		product.set(name, value);
	}

	const predefinedType = attrOrMissing(product, "PredefinedType");
	if (predefinedType !== MISSING) {
		const elementType = attrOrMissing(product, "ElementType");
		if (elementType !== MISSING) {
			if (elementType === null && predefinedType === "USERDEFINED") {
				product.set("PredefinedType", "NOTDEFINED");
			} else if (elementType && predefinedType !== "USERDEFINED") {
				product.set("PredefinedType", "USERDEFINED");
			}
		} else {
			const objectType = attrOrMissing(product, "ObjectType");
			if (objectType !== MISSING) {
				const relatingType = getType(product);
				// Allow for `null` due to
				// https://github.com/buildingSMART/IFC4.3.x-development/issues/818
				if (relatingType && !["NOTDEFINED", null].includes(relatingType.get("PredefinedType") as string | null)) {
					product.set("ObjectType", null);
					product.set("PredefinedType", null);
				} else if (objectType === null && predefinedType === "USERDEFINED") {
					product.set("PredefinedType", "NOTDEFINED");
				} else if (objectType && predefinedType !== "USERDEFINED") {
					product.set("PredefinedType", "USERDEFINED");
				}
			}
		}
	}

	if (attrOrMissing(product, "OwnerHistory") !== MISSING) {
		updateOwnerHistory(file, { element: product });
	}
}

/**
 * Edits the attributes of a product (Python: `ifcopenshell.api.attribute.edit_attributes`).
 *
 * All IFC entities have attributes. Normally they can be edited directly, by simply
 * assigning a new value to them. In some scenarios, you may wish to also ensure that
 * ownership history is updated. This function provides that convenience.
 *
 * The method will maintain consistency for the `PredefinedType` attribute based on
 * whether `ElementType`/`ObjectType` exist and whether the occurrence is typed:
 *
 * - `PredefinedType` and `ObjectType` become `null` if the occurrence is typed.
 * - `PredefinedType` becomes `"NOTDEFINED"` if `ElementType`/`ObjectType` is `null`.
 * - `PredefinedType` becomes `"USERDEFINED"` if `ElementType`/`ObjectType` is not `null`.
 *
 * @example
 * ```ts
 * const element = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * api.attribute.editAttributes(model, { product: element, attributes: { Name: "Waldo" } });
 * ```
 */
export const editAttributes = wrapUsecase("attribute.edit_attributes", editAttributesUsecase);
