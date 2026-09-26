// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/add_surface_textures.py` (src/ifcopenshell-python,
// 204 lines) -- chunk 2 of 2 for `api.style` (see `./index.ts`'s own header comment).
// No sibling `api.style` dependency of any kind.
//
// --- Real Python's own exact order of operations, ported verbatim (this matters: see
// the `material` disclosure below for why the ORDER, not just the individual checks,
// is load-bearing) ---
//
// `execute()`'s real body runs, in this exact order: (1) `if self.file.schema ==
// "IFC2X3": return []` -- UNCONDITIONAL, `material` is never even inspected on this
// schema; (2) the full `textures` loop -- fully portable, ALWAYS runs to completion
// regardless of whether `material` was also supplied; (3) only THEN, `if
// self.settings["material"] is None: return self.textures` -- i.e. the
// Blender-node-tree-walking code (the part that genuinely can't be ported, see below)
// is reached only after both (1) and (2) have already run. This port mirrors that
// exact order: the IFC2X3 check comes first, the `textures` loop runs unconditionally
// second, and the `material` check/throw comes LAST -- so a caller supplying `material`
// on an IFC2X3 file gets the correct silent `[]` (the schema check short-circuits
// before `material` is ever inspected, exactly like real Python), and a caller
// supplying both `material` and `textures` still gets every real texture created
// before the throw (matching real Python's own "the blocked call is the very last
// step" ordering, the same discipline this project's every other disclosed-blocker
// file follows, e.g. `../material/setShapeAspectConstituents.ts`'s own header comment).
//
// --- IFC2X3: real, disclosed early-return, ported verbatim (real Python's own
// comment) ---
//
// `if self.file.schema == "IFC2X3": return []` -- real Python's own inline comment:
// "TODO: research how compatible IFC2X3 and IFC4 textures are". Confirmed a REAL
// schema difference, not just an unresearched guess: `IfcImageTexture` on IFC2X3 has
// an entirely different attribute shape (`RepeatS`/`RepeatT`/`TextureType`/
// `TextureTransform`/`UrlReference`, confirmed against `ifc2x3.d.ts`) than IFC4+
// (`RepeatS`/`RepeatT`/`Mode`/`TextureTransform`/`Parameter`/`URLReference`) -- notably
// `Mode`/`URLReference` (IFC4+) vs. `TextureType`/`UrlReference` (IFC2X3, different
// name AND different enum-vs-string typing for the mode field). `IfcTextureCoordinate`
// (the base of `IfcTextureCoordinateGenerator`) also declares no `Maps` relationship at
// all on IFC2X3 (a genuinely empty interface, matching `removeSurfaceStyle.ts`'s own
// identical finding) -- so even the `uv_mode` handling below couldn't work unmodified
// on IFC2X3 regardless. Real Python's own test suite agrees: `test_add_surface_textures
// .py`'s own `TestAddSurfaceTexture` class extends `test.bootstrap.IFC4` only, with an
// explicit `# TODO: add ifc2x3 tests after add_surface_textures will support ifc2x3`
// comment -- confirming no IFC2X3 behavior is defined or tested upstream either.
//
// --- The `material` (Blender node-tree) parameter: NOT a "not yet ported" gap,
// permanently out of scope -- throws only when actually supplied, and only LAST ---
//
// Real Python's OWN signature type-hints `material: Optional[bpy.types.Material]`
// (`bpy` imported only under `TYPE_CHECKING`) and, when provided, walks a Blender
// material's own node tree (`material.node_tree.nodes`) looking for a glTF-compatible
// shader graph (`BSDF_PRINCIPLED`/`MIX_SHADER`/`TEX_IMAGE`/`NORMAL_MAP`/`SEPRGB`/...
// node types, socket links, `node.image.filepath`) to auto-detect diffuse/normal/
// metallic-roughness/occlusion/emissive texture maps, finally importing `bonsai.tool`
// (a Blender ADDON, not part of `ifcopenshell` itself) inside `create_surface_texture`.
// This is architecturally different from every other genuinely-unported-dependency
// disclosure elsewhere in this project (e.g. `unassignMaterialStyle.ts`'s
// `util.element.getShapeAspects`) -- those are real `ifcopenshell` Python functions
// this project just hasn't ported YET; this is Blender's own live Python object model
// (`bpy.types.Material`/node trees/sockets), which has no meaning at all outside a
// running Blender process and therefore no TS/Node representation to even accept as a
// parameter, let alone port a traversal of. `material` is typed `unknown` below and
// this function throws a clear, loud, descriptive error the moment it's actually
// supplied (non-`null`/non-`undefined`) -- but, per the order-of-operations section
// above, only AFTER the IFC2X3 check and the full `textures` loop have already run (a
// `null`/omitted `material`, the common case and the ONLY case any real Python test for
// this function ever exercises -- confirmed against `test_add_surface_textures.py`,
// which never passes `material=` -- never reaches this check at all, since it's always
// `undefined`/`null` by then).
//
// --- `file.create_entity("IfcImageTexture", **texture_data)` -- ported as a fresh
// zero-arg create plus a named `.set()` per surviving key, not a positional call ---
//
// Real Python's own kwargs-dict construction accepts an ARBITRARY subset of
// `IfcImageTexture`'s attribute names (whatever the caller's own texture dict
// contains, minus the `uv_mode` control key popped off first) -- there is no fixed,
// caller-independent positional shape to verify against `.d.ts` here the way most
// other `createEntity` calls in this project do (see `./addStyle.ts`'s own header
// comment for that usual convention) -- so this port creates the entity bare, then
// calls `.set(key, value)` once per remaining key, exactly mirroring kwargs' own
// name-based, order-independent semantics without risking a positional-index
// transcription error for a class whose exact attribute SET a caller might supply
// varies from call to call.
//
// --- `apply_uv_map_to_texture`'s `set(uv_map.Maps or []); maps.add(texture)`, ported
// as an identity-keyed local map (Python's own `set()` relies on
// `entity_instance.__hash__`/`__eq__`, per-instance identity within one file) ---
//
// Matches this project's already-established `EntityInstanceIdSet`-style precedent
// (see `./removeSurfaceStyle.ts`'s own header comment) -- duplicated locally here
// rather than imported, per that same precedent's own "duplicated per-module" note.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** See this file's own header comment -- identity-keyed, matching this project's established per-module `set()` precedent (`./removeSurfaceStyle.ts`). */
function applyUvMapToTexture(uvMaps: readonly EntityInstance[], texture: EntityInstance): void {
	for (const uvMap of uvMaps) {
		const byIdentity = new Map<number, EntityInstance>();
		for (const existing of (uvMap.get("Maps") as EntityInstance[] | null) ?? []) {
			byIdentity.set(existing.identity(), existing);
		}
		byIdentity.set(texture.identity(), texture);
		uvMap.set("Maps", [...byIdentity.values()]);
	}
}

export interface AddSurfaceTexturesSettings {
	/**
	 * A Blender material definition with a glTF-compatible node tree -- see this file's
	 * own header comment. Has no TS/Node representation of any kind; supplying anything
	 * other than `null`/`undefined` here always throws, at the exact point real Python
	 * would start walking `material.node_tree`, never proactively.
	 */
	material?: unknown;
	/**
	 * A list of objects containing attributes to create `IfcImageTexture` plus one
	 * additional `uv_mode` key to map the texture to the correct `IfcTextureCoordinate`
	 * type. Possible `uv_mode` values: `"UV"` (use `IfcTextureCoordinate` from
	 * `uvMaps`), `"Generated"` (`IfcTextureCoordinateGenerator` with mode `"COORD"`,
	 * autogenerated UV based on geometry), `"Camera"` (`IfcTextureCoordinateGenerator`
	 * with mode `"COORD-EYE"`, autogenerated UV based on camera position).
	 */
	textures?: readonly Record<string, unknown>[];
	/**
	 * A list of `IfcIndexedTextureMap` for any `IfcTessellatedFaceSet`s that the
	 * representation has, obtained from the `HasTextures` attribute.
	 */
	uvMaps?: readonly EntityInstance[];
}

function addSurfaceTexturesUsecase(file: IfcFile, settings: AddSurfaceTexturesSettings): EntityInstance[] {
	if (file.schema === "IFC2X3") {
		// See this file's own header comment ("order of operations") -- real Python's
		// own disclosed early-return, UNCONDITIONAL: `material` is never even inspected
		// on this schema, matching real IFC2X3/IFC4+ `IfcImageTexture` schema
		// differences.
		return [];
	}

	const textures: EntityInstance[] = [];
	const uvMaps = settings.uvMaps ?? [];
	for (const textureData of settings.textures ?? []) {
		const { uv_mode: uvMode, ...rest } = textureData;
		const texture = file.createEntity("IfcImageTexture");
		for (const [key, value] of Object.entries(rest)) {
			texture.set(key, value);
		}
		if (uvMode === "Generated") {
			const generator = file.createEntity("IfcTextureCoordinateGenerator");
			generator.set("Maps", [texture]);
			generator.set("Mode", "COORD");
		} else if (uvMode === "Camera") {
			const generator = file.createEntity("IfcTextureCoordinateGenerator");
			generator.set("Maps", [texture]);
			generator.set("Mode", "COORD-EYE");
		} else if (uvMode === "UV") {
			applyUvMapToTexture(uvMaps, texture);
		}
		textures.push(texture);
	}

	if (settings.material === undefined || settings.material === null) {
		return textures;
	}

	// See this file's own header comment ("order of operations" / "the `material`
	// parameter") -- no TS/Node equivalent of a Blender material node tree exists;
	// this is not a "not yet ported" gap, it's permanently out of scope. Thrown only
	// here, LAST -- the IFC2X3 check and the full `textures` loop above have already
	// run to completion, exactly matching real Python's own order of operations.
	throw new Error(
		"addSurfaceTextures: the `material` (Blender node-tree) parameter has no TS/Node equivalent -- see this file's own header comment and TODOS.md.",
	);
}

/**
 * Adds surface textures based on texture data, or a Blender material definition
 * (Python: `ifcopenshell.api.style.add_surface_textures`).
 *
 * Either `textures` or `material` should be provided. See this file's own header
 * comment for why `material` (a Blender node-tree) has no TS/Node equivalent and
 * always throws when actually supplied.
 *
 * @returns A list of the created `IfcImageTexture`s.
 *
 * @example
 * ```ts
 * const textures = api.style.addSurfaceTextures(model, {
 *   textures: [{ Mode: "DIFFUSE", RepeatS: true, RepeatT: true, URLReference: "diffuse.jpg" }],
 * });
 * ```
 */
export const addSurfaceTextures = wrapUsecase("style.add_surface_textures", addSurfaceTexturesUsecase);
