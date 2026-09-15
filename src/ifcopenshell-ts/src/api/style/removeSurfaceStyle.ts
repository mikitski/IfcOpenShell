// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/remove_surface_style.py` (src/ifcopenshell-python, 68
// lines) -- chunk 1 of 2 for `api.style` (see `./index.ts`'s own header comment). No
// sibling `api.style` dependency -- only bare `ifcopenshell`/`ifcopenshell.util.element`
// (`remove_deep2`, already ported) are imported by the real source.
//
// Despite the name, this removes any single "presentation item" -- not just an
// `IfcSurfaceStyleShading`/`IfcSurfaceStyleRendering`/`IfcSurfaceStyleWithTextures`, but
// (per real Python's own docstring, ":param style: The IfcPresentationItem to remove")
// genuinely any entity assigned into an `IfcPresentationStyle.Styles`/`.FillStyles`-type
// aggregate -- `./removeStyle.ts`'s own `IfcSurfaceStyle`/`IfcFillAreaStyle` branches
// both call this (or `removeDeep2` directly, for `IfcFillAreaStyle`'s own items) on each
// of their own presentation items.
//
// --- `IfcSurfaceStyleWithTextures`: real IFC2X3-vs-IFC4+ schema difference, ported
// verbatim (real Python's own `if`/`else`, not a schema guard added by this port) ---
//
// On IFC2X3, `IfcTextureCoordinate`/`IfcTextureCoordinateGenerator` declare NO
// `Maps`/`IsMappedBy` relationship at all (confirmed against `ifc2x3.d.ts`:
// `IfcTextureCoordinate {}` -- a genuinely empty interface, `IfcTextureCoordinateGenerator`
// has no `Maps` attribute either), so every `IfcSurfaceTexture` in `style.Textures` is
// queued for deletion directly. On IFC4+, `IfcSurfaceTexture` instead carries an
// `IsMappedBy` inverse back to whichever `IfcTextureCoordinate`/
// `IfcTextureCoordinateGenerator` maps it (confirmed against `ifc4.d.ts`/`ifc4x3.d.ts`:
// both declare `Maps: IfcSurfaceTexture[]` on both texture-coordinate classes) -- when
// present, the COORDINATE object(s) are queued for deletion instead of the texture
// itself (real Python's own walrus-operator `if coords := texture.IsMappedBy:` --
// ported as a length check on the array `.get()` returns, matching this project's
// established `.get()`-returns-an-array-for-a-SET-inverse convention, see
// `../geometry/removeRepresentation.ts`'s identical `StyledByItem` precedent).
//
// --- `for attribute in style: if isinstance(attribute, entity_instance) and
// attribute.id()`, ported as an explicit `attributeCount()`/`getByIndex()` scan ---
//
// Real Python's `for attribute in style:` iterates the STYLE's own forward attribute
// VALUES in declaration order (`entity_instance.__iter__`), picking up every
// directly-referenced sub-entity with a real STEP id (e.g. an `IfcColourRgb` held by an
// `IfcSurfaceStyleShading.SurfaceColour`) for cleanup -- but NOT entities nested inside
// a list/aggregate-typed attribute (a tuple value fails `isinstance(attribute,
// entity_instance)`), and NOT an inline "simple value" instance with `.id() == 0` (an
// unwritten defined-type wrapper, as opposed to a real, separately-addressable file
// entity). Ported as this file's own `attributeCount()`/`getByIndex(i)` loop --
// `removeDeep2`'s own `util/element.ts` implementation established this exact idiom
// first (its own "clear a large list attribute" optimisation), reused here for the
// same underlying reason (no native "iterate my own attribute values" primitive beyond
// index-based access).
//
// --- `to_delete: set[...]`, ported as an identity-keyed local set (Python's own
// `set()` relies on `entity_instance.__hash__`/`__eq__`, effectively per-instance
// identity within one file) ---
//
// A small local `EntityInstanceIdSet` (keyed by `.identity()`, matching this project's
// established `MutableEntityInstanceSet`/`EntityInstanceSet` precedent duplicated
// per-module rather than shared, see `../material/unassignMaterial.ts`'s own header
// comment) avoids queuing the same sub-entity for `removeDeep2` twice (real Python's own
// reason for using a `set` here in the first place -- a texture referenced by more than
// one path, or a coordinate mapping more than one texture, must still only be removed
// once).

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { removeDeep2 } from "../../util/element";
import { wrapUsecase } from "../hooks";

/** See this file's own header comment -- identity-keyed, matching this project's established per-module `set()` precedent. */
class EntityInstanceIdSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance): void {
		this.byIdentity.set(instance.identity(), instance);
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface RemoveSurfaceStyleSettings {
	/** The `IfcPresentationItem` to remove (despite this function's name, any presentation item, not just an `IfcSurfaceStyle*` one -- see this file's own header comment). */
	style: EntityInstance;
}

function removeSurfaceStyleUsecase(file: IfcFile, settings: RemoveSurfaceStyleSettings): void {
	const { style } = settings;
	const toDelete = new EntityInstanceIdSet();

	if (style.isA("IfcSurfaceStyleWithTextures")) {
		const textures = style.get("Textures") as EntityInstance[];
		if (file.schema === "IFC2X3") {
			for (const texture of textures) toDelete.add(texture);
		} else {
			for (const texture of textures) {
				const coords = (texture.get("IsMappedBy") as EntityInstance[] | null) ?? [];
				if (coords.length > 0) {
					for (const coordinate of coords) toDelete.add(coordinate);
				} else {
					toDelete.add(texture);
				}
			}
		}
	}

	const count = style.attributeCount();
	for (let i = 0; i < count; i++) {
		const attribute = style.getByIndex(i);
		if (attribute instanceof EntityInstance && attribute.id()) {
			toDelete.add(attribute);
		}
	}

	file.remove(style);

	for (const element of toDelete.values()) {
		removeDeep2(file, element);
	}
}

/**
 * Removes a presentation item from a presentation style (Python:
 * `ifcopenshell.api.style.remove_surface_style`).
 *
 * @example
 * ```ts
 * // Create a new surface style
 * const style = api.style.addStyle(model, {});
 *
 * // Create a simple shading colour and transparency (api.style.addSurfaceStyle is a
 * // chunk 2 function, not yet ported -- see ./index.ts's own header comment; built
 * // directly here instead).
 * const shading = model.createEntity(
 *   "IfcSurfaceStyleShading",
 *   model.createEntity("IfcColourRgb", null, 1.0, 0.8, 0.8),
 *   0.0,
 * );
 * style.set("Styles", [shading]);
 *
 * // Remove the shading item
 * api.style.removeSurfaceStyle(model, { style: shading });
 * ```
 */
export const removeSurfaceStyle = wrapUsecase("style.remove_surface_style", removeSurfaceStyleUsecase);
