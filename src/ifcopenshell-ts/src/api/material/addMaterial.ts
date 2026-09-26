// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/add_material.py` (src/ifcopenshell-python, 86
// lines) -- chunk 2 of `api.material` (see `./index.ts`'s own header comment for the
// full chunk scope). No sibling `api.material` dependency of any kind -- the only
// import in the real source is bare `ifcopenshell`.
//
// Creates a plain `IfcMaterial` (a physical material like timber/steel/concrete, not
// a colour/style -- see `ifcopenshell.api.style` for that).
//
// --- Real, disclosed quirk, ported verbatim ---
//
// `name or "Unnamed"` is a Python truthiness check, not a `None`-only fallback: an
// explicit empty string `""` also falls back to `"Unnamed"`, exactly like a `null`/
// omitted `name` would. Ported as `name || "Unnamed"`, which has the identical
// falsy-string semantics in JS/TS (`"" || "Unnamed"` also evaluates to `"Unnamed"`) --
// not `name ?? "Unnamed"`, which would (incorrectly, relative to real Python) let an
// explicit empty string through unchanged.
//
// `category`/`description` are set via a plain truthy `if` AFTER creation (`if
// category: material.Category = category`), not passed at `create_entity` time --
// ported the same way (two conditional `.set()` calls after the positional create),
// not folded into the constructor call, matching real Python's own two-step shape
// exactly (also relevant for `IFC2X3`, see below -- constructing with only `Name` set
// works on every schema, deferring the schema-dependent failure to the conditional
// `.set()` calls, exactly where real Python's own `setattr`-equivalent failure would
// happen too).
//
// --- IFC2X3-vs-IFC4+ schema difference, verified against generated `.d.ts`s ---
//
// `IfcMaterial` has only a single attribute (`Name`) on IFC2X3 (`ifc2x3.d.ts`) -- no
// `Description`/`Category` at all -- vs. `[Name, Description, Category]` on IFC4/
// IFC4X3. `Name` is attribute index 0 on every schema, so the positional
// `file.createEntity("IfcMaterial", name || "Unnamed")` call itself is schema-agnostic
// and always succeeds. Passing a truthy `category`/`description` on an IFC2X3 file,
// however, hits `.set("Category", ...)`/`.set("Description", ...)` for an attribute
// that doesn't exist on that schema's `IfcMaterial` declaration at all -- this throws
// a native "no such attribute" error, exactly matching real Python's own unguarded
// `setattr` (its own docstring even warns "categories are not available in IFC2X3");
// neither the real source nor this port adds a schema guard here, since this is a
// genuine, disclosed real-Python limitation, not a gap this port introduces.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddMaterialSettings {
	/** The name of the material, typically tagged in a finishes drawing or schedule. Defaults to `"Unnamed"` (also used for an explicit empty string, see this file's own header comment). */
	name?: string | null;
	/**
	 * The category of the material (e.g. `"concrete"`, `"steel"`, `"aluminium"`, `"block"`,
	 * `"brick"`, `"stone"`, `"wood"`, `"glass"`, `"gypsum"`, `"plastic"`, `"earth"`, or a
	 * custom category). **Not available in IFC2X3** -- setting this on an IFC2X3 file
	 * throws (see this file's own header comment).
	 */
	category?: string | null;
	/** A description of the material, beyond its name or category. **Not available in IFC2X3** (see this file's own header comment). */
	description?: string | null;
}

function addMaterialUsecase(file: IfcFile, settings: AddMaterialSettings): EntityInstance {
	const material = file.createEntity("IfcMaterial", settings.name || "Unnamed");
	if (settings.category) {
		material.set("Category", settings.category);
	}
	if (settings.description) {
		material.set("Description", settings.description);
	}
	return material;
}

/**
 * Adds a new material (Python: `ifcopenshell.api.material.add_material`).
 *
 * A material in IFC represents a physical material, such as timber, steel, concrete,
 * aluminium, etc. It may also contain physical properties used for structural or
 * lighting simulation. Note that unlike the computer graphics industry, a material by
 * itself does not define any colour or lighting information. Colours in IFC are known
 * as "styles", and an IFC material may or may not have any style information
 * associated with it. See `ifcopenshell.api.style` for more information.
 *
 * A material is typically given a code name which is used by architects in elevations
 * and details when tagging finishes. Materials are also useful to structural
 * engineers in specifying the exact types of concrete and steel to be used in
 * structural simulations.
 *
 * In addition, materials can belong to a category. Specifying this category is
 * critical to allow model recipients to make simple queries like "show me all
 * concrete / steel" elements in the model. **Not available in IFC2X3.**
 *
 * @returns The newly created `IfcMaterial`.
 *
 * @example
 * ```ts
 * const concrete = api.material.addMaterial(model, { name: "CON01", category: "concrete", description: "Garage Slab" });
 * const steel = api.material.addMaterial(model, { name: "ST01", category: "steel", description: "Corten Steel" });
 *
 * const concreteBench = api.root.createEntity(model, { ifcClass: "IfcFurnitureType" });
 * api.material.assignMaterial(model, { products: [concreteBench], material: concrete });
 * ```
 */
export const addMaterial = wrapUsecase("material.add_material", addMaterialUsecase);
