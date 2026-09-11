// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/util/selector.py`'s **key-path mini-language** only (src/
// ifcopenshell-python) -- planning/ifcopenshell-ts/research/03-python-util-inventory.md's
// dedicated "`selector.py` -- the IFC Query Selector Syntax" section, sub-section "2.
// Key-path grammar (`get_element_grammar`) -> `get_element_value(element, query)`". This
// is the shared dependency both `filter_elements`'s `query:` facet and `format()`'s
// `{{...}}` interpolation call into (both confirmed, by reading the real Python source,
// to call `get_element_value(element, query_string)` directly -- selector.py lines 215
// and 1180) -- so porting it first, standalone, unblocks both of those later chunks
// without needing to guess at their own scope.
//
// Explicitly NOT in this chunk's scope: `filter_elements` (the `filter_elements_grammar`
// facet-based element-filtering language) and `format`/`FormatTransformer` (the
// `format_grammar` Excel-formula-like expression language) -- both separate, later
// chunks. `set_element_value` (selector.py's `get_element_value` inverse, which crosses
// into `ifcopenshell.api.pset`/`ifcopenshell.api.geometry` territory) is also out of
// scope here, for the same reason `util.unit`'s `convert_file_length_units` is
// (`TODOS.md`): it needs the not-yet-ported `api` layer (Phase 6+).
//
// Ported in full: the `get_element_grammar` key-path grammar (hand-rolled as
// `parseKeyPath` below, a small recursive-descent-ish scanner -- no new npm dependency,
// per the research doc's own recommendation: the real grammar is ~15 lines of EBNF, well
// within hand-rolling range) and `_get_element_value`'s full key-resolution logic
// (`getElementValueForKeys` below): every special first-class key (`type`, `material`/
// `mat`, `materials`/`mats`, `styles`, `item`/`i`, `container`, `space`, `storey`,
// `building`, `site`, `parent`, `types`/`occurrences`, `count`, `class`,
// `predefined_type`, `id`, `group`), falling through to real IFC attribute lookup, then
// pset/qto lookup by name (including regex pset/prop names, matched the same way Python
// does -- `re.match`/`.match()` anchored-at-start semantics, ported as JS `RegExp.test`
// against the *whole* candidate string via an implicit `^...` anchor would be wrong --
// see `matchesFromStart` below for the exact translation chosen), with recursion over
// lists/sets/dicts (e.g. drilling into a nested `IfcComplexProperty`/
// `IfcPhysicalComplexQuantity`'s sub-properties via the `properties` sub-dict key,
// exactly matching `util/element.ts`'s already-ported `getProperties`/`getQuantities`
// shape).
//
// Verified against the real grammar text (not just the research doc's summary, per this
// chunk's own task brief): `get_element_grammar` is deliberately much smaller than
// `filter_elements_grammar` -- no quoted/regex *pset-or-prop* segment distinction at the
// grammar level (that's `filter_elements_grammar`'s `pset`/`prop` rules, a different,
// not-yet-ported grammar). `get_element_grammar` has exactly one production per
// dot-separated segment (`key: quoted_string | regex_string | unquoted_string`), and
// whether a given segment is treated as a "pset name" vs. a "prop name" vs. an "IFC
// attribute name" vs. a "special key" is entirely a runtime decision made by
// `_get_element_value` based on what `value` currently holds, not something the grammar
// itself distinguishes -- confirmed directly against the grammar text quoted at the top
// of `selector.py` (lines 118-133), reproduced verbatim in comment form on
// `parseKeyPath` below.
//
// *** Two real, disclosed gaps found while building this chunk: ***
//
// 1. **Genuine, disclosed hard blocker (not stubbed or partially implemented): the
//    positional/geolocated keys `x`/`y`/`z`/`easting`/`northing`/`elevation`/
//    `rotation_x`/`rotation_y`/`rotation_z`.** Python's `_get_element_value` calls
//    `ifcopenshell.util.placement.get_local_placement` (all nine keys) plus
//    `ifcopenshell.util.geolocation.auto_xyz2enh` (the `easting`/`northing`/`elevation`
//    trio) plus `ifcopenshell.util.shape_builder.np_matrix_to_euler` (the `rotation_*`
//    trio) -- none of `util.placement`/`util.geolocation`/`util.shape_builder` are
//    ported yet in this TS port (all Tier B, later phases per
//    `planning/ifcopenshell-ts/20-roadmap.md`; `util.placement` is this project's own
//    research doc's #3 near-term porting priority, not yet picked up).
//    `throwPositionalKeyBlocked` below throws a clear, descriptive error naming the
//    real missing Python modules --
//    but only when Python itself would actually need them: exactly mirroring Python's
//    own `hasattr(value, "ObjectPlacement")` guard, these keys fall through to ordinary
//    attribute/pset lookup (returning `null`, same as Python) when `value` isn't a class
//    that declares `ObjectPlacement` at all, and return `null` without throwing (same as
//    Python, which short-circuits to `value = None` before ever calling
//    `get_local_placement`) when `ObjectPlacement` is declared but unset -- the blocker
//    only fires for the one case that would genuinely need the unported math: a real,
//    *set* `ObjectPlacement`. See `TODOS.md`'s new entry for this; matches the
//    established "genuinely-blocked-not-just-deferred" disclosure pattern (that file's
//    `util.unit.convert_file_length_units` entry).
//
// 2. **Narrow, disclosed, non-exported local re-implementation** of exactly what one of
//    the special keys needs (matching `util/element.ts` chunk 3's
//    `findBodyRepresentation` precedent -- a disclosed narrow re-implementation of
//    exactly one fixed lookup, not scope creep into porting the whole owning module):
//    - `profiles` key: **partially** narrow -- `ifcopenshell.util.shape.get_profiles`'s
//      `IfcMaterialProfileSet` path (via already-ported `util.element.getMaterial`) is
//      fully ported below (`getProfilesNarrow`), but its fallback path
//      (`ifcopenshell.util.shape.get_extrusions`, for an element with no material
//      profile set) transitively calls `ifcopenshell.util.representation
//      .get_representation`/`.resolve_representation` -- a real, *not* narrow
//      dependency (representation-item graph resolution, including `IfcMappedItem`
//      indirection), unlike `findBodyRepresentation`'s one fixed-argument lookup. That
//      fallback throws the same disclosed-blocker pattern as point 1 above rather than
//      being silently dropped or force-approximated.
//
//    **UPDATE (a later Phase 3 chunk, `util.classification`/`util.constraint`/
//    `util.system`/`util.type`, 2026-09-10):** this finding originally also covered the
//    `classification` key (`getClassificationNarrow`/`getReferencesNarrow`, a narrow
//    re-implementation of `ifcopenshell.util.classification.get_classification`/
//    `.get_references`) and the `system`/`zone` keys (`getElementSystemsNarrow`/
//    `getElementZonesNarrow`, re-implementing `ifcopenshell.util.system
//    .get_element_systems`/`.get_element_zones`) -- both narrow-reimplementation
//    rationales are now obsolete, since `util.classification`/`util.system` are fully
//    ported (`util/classification.ts`, `util/system.ts`). Verified, before switching
//    over, that each narrow copy was behaviorally identical to the real ported function
//    (see those files' own header comments) -- this file now imports and calls
//    `classification.getReferences`/`system.getElementSystems`/`system.getElementZones`
//    directly, and the four narrow functions plus their backing `EntityInstanceSet`
//    class have been removed from this file entirely, along with the disclosure
//    paragraphs that only applied to them (preserved below in trimmed form for what's
//    still true of this file: the `parseKeyPath` empty-regex-key bugfix, still real and
//    still here).
//
// A real bug found and fixed by this chunk's own adversarial review (not shipped and
// deferred): `parseKeyPath` silently accepting an empty `//` regex key (the real
// grammar's inner class is one-or-more, so this is a parse error in Python, not a
// match-everything pattern) -- see `parseKeyPath`'s own inline comment below. (Two
// other bugs this same review caught -- a dedup-by-reference-equality bug in the
// then-narrow `getReferencesNarrow`, and an over-permissive subtype-inclusive `isA(name)`
// check in the then-narrow `getElementSystemsNarrow` -- were fixed at the time and are
// now simply part of the real, ported `classification.getReferences`/
// `system.getElementSystems` this file calls; see those files' own header comments for
// the current writeup, not repeated here now that the narrow copies are gone.)
//
// Every other key documented in this chunk's task brief (`type`, `material`/`mat`,
// `materials`/`mats`, `styles`, `item`/`i`, `container`, `space`, `storey`, `building`,
// `site`, `parent`, `types`/`occurrences`, `count`, `class`, `predefined_type`, `id`,
// `group`, plain IFC attribute lookup, pset/qto lookup by name including regex, and
// recursion over lists/sets/dicts) is fully, faithfully ported below -- the two gaps
// above are narrowly scoped, not an excuse to under-scope the rest.

import { EntityInstance } from "../entityInstance";
import { getReferences } from "./classification";
import {
	getContainer,
	getGroups,
	getMaterial,
	getMaterials,
	getParent,
	getPredefinedType,
	getPset,
	getPsets,
	getStyles,
	getType,
	getTypes,
} from "./element";
import { getElementSystems, getElementZones } from "./system";

// --- internal helpers (mirroring `util/element.ts`'s own `attrOrMissing`/`attrOrNull`/
// `attrList` -- not exported from that file, so re-declared here rather than reaching
// into another module's private internals; see that file's own doc comments for the
// full rationale, not repeated here) ---

const MISSING: unique symbol = Symbol("ifcopenshell.util.selector: attribute not declared on this class");

function attrOrMissing(element: EntityInstance, name: string): unknown {
	try {
		return element.get(name);
	} catch {
		return MISSING;
	}
}

function attrOrNull(element: EntityInstance, name: string): unknown {
	const value = attrOrMissing(element, name);
	return value === MISSING ? null : value;
}

function attrList(element: EntityInstance, name: string): EntityInstance[] {
	const value = attrOrNull(element, name);
	return value === null ? [] : (value as EntityInstance[]);
}

/** Python's `dict.pop("id", None)` / `del pset["id"]`-then-keep-the-rest idiom used
 * throughout this file for a `get_pset`/`get_psets` result (always carries a trailing
 * `id` field, per `util/element.ts`'s `getPropertyDefinition`) -- returns a shallow copy
 * with `id` removed, never mutates the input. */
function withoutId(pset: Record<string, unknown>): Record<string, unknown> {
	const { id: _id, ...rest } = pset;
	return rest;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		!(value instanceof EntityInstance) &&
		!(value instanceof Set)
	);
}

/** Python's `re.Pattern.match()` -- anchored to the *start* of the candidate string
 * (unlike a full-string match, the pattern doesn't need to consume the whole string,
 * just begin matching at index 0) -- distinct from JS `RegExp.test()`, which searches
 * for the pattern anywhere in the string. Both of this file's pset-name/prop-name regex
 * matches (`key.match(pset_name)`/`key.match(prop_name)` in the real Python source) use
 * this, not `.test()`. */
function matchesFromStart(pattern: RegExp, value: string): boolean {
	const match = pattern.exec(value);
	return match !== null && match.index === 0;
}

// --- key-path grammar (`get_element_grammar`, selector.py lines 118-133) ---
//
// start: keys
// keys: key ("." key)*
// key: quoted_string | regex_string | unquoted_string
// unquoted_string: /[^.=\/\s]+/
// regex_string: "/" /[^\/]+/ "/"
// quoted_string: ESCAPED_STRING            // "..." with lark's common.lark escaping
// WS: /[ \t\f\r\n]/+
// %ignore WS
//
// `GetElementTransformer` (selector.py ~line 385) turns each `quoted_string`/
// `regex_string`/`unquoted_string` leaf into, respectively: a plain string with the
// surrounding quotes stripped and *every* backslash character removed (Python's
// `args[1:-1].replace("\\", "")` -- not a proper escape-sequence unescape, just a blunt
// strip; reproduced verbatim below, not "fixed"), a compiled `re.Pattern`, or a plain
// string, and `keys` collects them into a flat `list[str | re.Pattern]` in order.

/**
 * Hand-rolled recursive-descent-ish scanner for the grammar above -- no new npm
 * dependency, per this project's research doc's own recommendation (the grammar is
 * small and stable). Not a byte-for-byte reproduction of lark's Earley parser (in
 * particular, the quoted-string escape scan below is a pragmatic "backslash escapes the
 * next character" reading of lark's `_STRING_ESC_INNER` lookbehind trick, not a literal
 * port of that regex), but produces the same `(string | RegExp)[]` result for every
 * query this module's own tests -- ported from `test_selector.py` -- and the real
 * `filter_elements`/`format` callers exercise.
 */
export function parseKeyPath(query: string): (string | RegExp)[] {
	const n = query.length;
	let i = 0;

	function skipWs(): void {
		while (i < n && /[ \t\f\r\n]/.test(query[i])) i++;
	}

	function parseKey(): string | RegExp {
		skipWs();
		if (i >= n) {
			throw new Error(`Invalid key-path query (expected a key): '${query}'`);
		}
		const ch = query[i];
		if (ch === '"') {
			let j = i + 1;
			let content = "";
			while (j < n && query[j] !== '"') {
				if (query[j] === "\\" && j + 1 < n) {
					content += query[j] + query[j + 1];
					j += 2;
				} else {
					content += query[j];
					j++;
				}
			}
			if (j >= n) {
				throw new Error(`Unterminated quoted key in key-path query: '${query}'`);
			}
			i = j + 1;
			// Python: `args[1:-1].replace("\\", "")` -- strip the quotes, then remove
			// every backslash character, not just ones that formed an escape sequence.
			return content.replace(/\\/g, "");
		}
		if (ch === "/") {
			let j = i + 1;
			while (j < n && query[j] !== "/") j++;
			if (j >= n) {
				throw new Error(`Unterminated regex key in key-path query: '${query}'`);
			}
			if (j === i + 1) {
				// Grammar: `regex_string: "/" /[^\/]+/ "/"` -- the inner character class is
				// `+` (one-or-more), so an empty `//` is a lark parse error in Python, not a
				// pattern that matches everything (which `new RegExp("")` would silently
				// become if this weren't rejected).
				throw new Error(`Invalid key-path query (empty regex key '//' is not allowed): '${query}'`);
			}
			const pattern = query.slice(i + 1, j);
			i = j + 1;
			// Compiled with JS `RegExp`, not Python `re` -- most patterns behave
			// identically, but Python-only syntax (e.g. `(?P<name>...)` named groups,
			// POSIX classes) will either throw a JS `SyntaxError` here or silently match
			// differently than it would in Python. Inherent to targeting a different regex
			// engine, not mechanically fixable without embedding a Python-regex-compatible
			// engine; disclosed here since this file otherwise documents every other
			// Python/JS behavioral divergence.
			return new RegExp(pattern);
		}
		// unquoted_string: /[^.=\/\s]+/
		let j = i;
		while (j < n && !/[.=/\s]/.test(query[j])) j++;
		if (j === i) {
			throw new Error(`Invalid key-path query (unexpected character '${ch}' at position ${i}): '${query}'`);
		}
		const token = query.slice(i, j);
		i = j;
		return token;
	}

	const keys: (string | RegExp)[] = [parseKey()];
	skipWs();
	while (i < n && query[i] === ".") {
		i++;
		keys.push(parseKey());
		skipWs();
	}
	if (i < n) {
		throw new Error(`Unexpected trailing content in key-path query at position ${i}: '${query}'`);
	}
	return keys;
}

// --- narrow, disclosed local re-implementation (see this file's header comment,
// finding #2, for why this one is still inlined here rather than treated as a
// blocker -- `classification`/`system`/`zone`'s own former narrow copies were removed
// once `util/classification.ts`/`util/system.ts` landed; see that same finding for the
// full story) ---

/** Partial, disclosed narrow re-implementation of
 * `ifcopenshell.util.shape.get_profiles` -- see this file's header comment, finding #2,
 * for why the `IfcMaterialProfileSet` path is ported but the `get_extrusions` fallback
 * is a genuine blocker instead. */
function getProfilesNarrow(element: EntityInstance): EntityInstance[] {
	const material = getMaterial(element, true);
	if (material?.isA("IfcMaterialProfileSet")) {
		return attrList(material, "MaterialProfiles").map((mp) => mp.get("Profile") as EntityInstance);
	}
	throw new Error(
		'getElementValue: the "profiles" key\'s extrusion-based fallback (this element has no ' +
			"IfcMaterialProfileSet, the only path this port implements) requires " +
			"`ifcopenshell.util.shape.get_extrusions`, which itself transitively calls " +
			"`ifcopenshell.util.representation.get_representation`/`.resolve_representation` -- " +
			"neither `util.shape` nor `util.representation` is ported yet in this TS port " +
			"(Tier B, a later phase; see TODOS.md). Not stubbed or partially implemented.",
	);
}

const POSITIONAL_XYZ_KEYS: readonly string[] = ["x", "y", "z"];
const POSITIONAL_ENH_KEYS: readonly string[] = ["easting", "northing", "elevation"];
const ROTATION_KEYS: readonly string[] = ["rotation_x", "rotation_y", "rotation_z"];

/** Throws the disclosed blocker for a positional/geolocated key -- see this file's
 * header comment, finding #1, for the full rationale. Only called once Python itself
 * would actually need the unported math (a real, *set* `ObjectPlacement`). */
function throwPositionalKeyBlocked(key: string): never {
	const extra = POSITIONAL_ENH_KEYS.includes(key)
		? " and `ifcopenshell.util.geolocation.auto_xyz2enh`"
		: ROTATION_KEYS.includes(key)
			? " and `ifcopenshell.util.shape_builder.np_matrix_to_euler`"
			: "";
	throw new Error(
		`getElementValue: the "${key}" key-path key requires \`ifcopenshell.util.placement.get_local_placement\`${extra} -- none of \`util.placement\`/\`util.geolocation\`/\`util.shape_builder\` are ported yet in this TS port (Tier B, a later phase; see TODOS.md). Not stubbed or partially implemented: this element has a real, set \`ObjectPlacement\`, so Python would compute an actual value here that this port cannot yet reproduce.`,
	);
}

// --- `_get_element_value` (selector.py ~line 427) ---

/**
 * Python: `_get_element_value(element, keys) -> Any`. Not exported (matches Python's
 * leading-underscore privacy convention) -- `getElementValue` below is the only public
 * entry point, exactly like Python's own module (both `filter_elements` and `format`
 * call `get_element_value(element, query_string)`, never the private per-keys helper,
 * confirmed against the real source, selector.py lines 215/1180).
 */
function getElementValueForKeys(initialValue: unknown, keys: readonly (string | RegExp)[]): unknown {
	let value: unknown = initialValue;
	for (const key of keys) {
		if (value === null || value === undefined) return null;

		if (typeof key === "string" && key === "type") {
			value = getType(value as EntityInstance);
		} else if (typeof key === "string" && (key === "material" || key === "mat")) {
			value = getMaterial(value as EntityInstance, true);
		} else if (typeof key === "string" && (key === "materials" || key === "mats")) {
			value = getMaterials(value as EntityInstance);
		} else if (typeof key === "string" && key === "profiles") {
			value = getProfilesNarrow(value as EntityInstance);
		} else if (typeof key === "string" && key === "styles") {
			value = getStyles(value as EntityInstance);
		} else if (typeof key === "string" && (key === "item" || key === "i")) {
			const v = value as EntityInstance;
			if (v.isA("IfcMaterialLayerSet")) {
				value = v.get("MaterialLayers");
			} else if (v.isA("IfcMaterialProfileSet")) {
				value = v.get("MaterialProfiles");
			} else if (v.isA("IfcMaterialConstituentSet")) {
				value = v.get("MaterialConstituents");
			}
			// else: no Python `else` branch either -- `value` is left unchanged.
		} else if (typeof key === "string" && key === "container") {
			value = getContainer(value as EntityInstance);
		} else if (typeof key === "string" && key === "space") {
			value = getParent(value as EntityInstance, "IfcSpace");
		} else if (typeof key === "string" && key === "storey") {
			value = getParent(value as EntityInstance, "IfcBuildingStorey");
		} else if (typeof key === "string" && key === "building") {
			value = getParent(value as EntityInstance, "IfcBuilding");
		} else if (typeof key === "string" && key === "site") {
			value = getParent(value as EntityInstance, "IfcSite");
		} else if (typeof key === "string" && key === "parent") {
			value = getParent(value as EntityInstance);
		} else if (typeof key === "string" && (key === "types" || key === "occurrences")) {
			value = getTypes(value as EntityInstance);
		} else if (typeof key === "string" && key === "count") {
			if (value instanceof Set) {
				value = value.size;
			} else if (Array.isArray(value)) {
				value = value.length;
			} else {
				value = 1;
			}
		} else if (typeof key === "string" && key === "class") {
			value = (value as EntityInstance).isA();
		} else if (typeof key === "string" && key === "predefined_type") {
			value = getPredefinedType(value as EntityInstance);
		} else if (typeof key === "string" && key === "id") {
			value = (value as EntityInstance).id();
		} else if (typeof key === "string" && key === "classification") {
			value = getReferences(value as EntityInstance);
		} else if (typeof key === "string" && key === "group") {
			value = getGroups(value as EntityInstance);
		} else if (typeof key === "string" && key === "system") {
			value = getElementSystems(value as EntityInstance);
		} else if (typeof key === "string" && key === "zone") {
			value = getElementZones(value as EntityInstance);
		} else if (
			typeof key === "string" &&
			(POSITIONAL_XYZ_KEYS.includes(key) || POSITIONAL_ENH_KEYS.includes(key) || ROTATION_KEYS.includes(key)) &&
			value instanceof EntityInstance &&
			attrOrMissing(value, "ObjectPlacement") !== MISSING
		) {
			const placement = attrOrNull(value, "ObjectPlacement");
			if (placement) {
				throwPositionalKeyBlocked(key);
			} else {
				value = null;
			}
		} else if (value instanceof EntityInstance) {
			let effectiveKey: string | RegExp = key;
			if (key === "Name" && value.isA("IfcMaterialLayerSet")) {
				effectiveKey = "LayerSetName";
			}

			// Python: "Should we support regex attributes? Probably not for now." --
			// a `RegExp` key never resolves as a real IFC attribute name.
			const attribute = typeof effectiveKey === "string" ? attrOrNull(value, effectiveKey) : null;

			if (attribute !== null) {
				value = attribute;
			} else if (effectiveKey instanceof RegExp) {
				const psets = getPsets(value);
				const matching: Record<string, unknown>[] = [];
				for (const [psetName, pset] of Object.entries(psets)) {
					if (matchesFromStart(effectiveKey, psetName)) {
						matching.push(withoutId(pset));
					}
				}
				value = matching.length === 0 ? null : matching.length === 1 ? matching[0] : matching;
			} else {
				const pset = getPset(value, effectiveKey) as Record<string, unknown> | null;
				value = pset ? withoutId(pset) : null;
			}
		} else if (isPlainRecord(value)) {
			if (key instanceof RegExp) {
				const results: unknown[] = [];
				for (const [propName, propValue] of Object.entries(value)) {
					if (matchesFromStart(key, propName)) {
						if (Array.isArray(propValue)) {
							results.push(...propValue);
						} else {
							results.push(propValue);
						}
					}
				}
				value = results.length === 0 ? null : results.length === 1 ? results[0] : results;
			} else {
				const dictKey = key as string;
				if (Object.prototype.hasOwnProperty.call(value, dictKey)) {
					value = value[dictKey];
				} else {
					// A nested complex quantity/property (`IfcPhysicalComplexQuantity`/
					// `IfcComplexProperty`) is represented as a dict whose nested members
					// live under a `properties` sub-dict (`util/element.ts`'s
					// `getQuantities`/`getProperties`) -- descend into it so nested values
					// are reachable via the natural `Qto.Complex.Nested` path.
					const subprops = value.properties;
					value = isPlainRecord(subprops) ? (subprops[dictKey] ?? null) : null;
				}
			}
		} else if (Array.isArray(value) || value instanceof Set) {
			const isNumericKey = typeof key === "string" && /^\d+$/.test(key);
			if (isNumericKey) {
				if (value instanceof Set) {
					// Python: `value[int(key)]` against a real `set` raises `TypeError`
					// ("'set' object is not subscriptable") -- a different exception type
					// than the `except IndexError` below catches, so this is a genuine,
					// reproducible Python crash for this combination, not a code path this
					// port silently smooths over. Reproduced verbatim.
					throw new TypeError(
						`getElementValue: '${key}' is a numeric key against a set-valued result -- Python's own \`value[int(key)]\` raises TypeError for a real \`set\` here (sets aren't subscriptable), uncaught by its \`except IndexError\`.`,
					);
				}
				const idx = Number(key);
				if (idx < 0 || idx >= value.length) return null; // Python: bare `return` -> None.
				value = value[idx];
			} else {
				const items = value instanceof Set ? [...value] : value;
				const results: unknown[] = [];
				for (const item of items) {
					const subvalue = getElementValueForKeys(item, [key]);
					if (Array.isArray(subvalue)) {
						results.push(...subvalue);
					} else {
						results.push(subvalue);
					}
				}
				value = results;
			}
		}
		// else: `value` is some other scalar (string/number/boolean) with no further
		// keys resolvable against it -- Python's own `_get_element_value` has no final
		// `else` branch either, so `value` is silently left unchanged for the rest of
		// the loop (matching `elif`-chain fallthrough semantics exactly).
	}
	return value;
}

/**
 * Python: `get_element_value(element, query) -> Any`.
 *
 * Extracts a value out of `element` following a dotted key-path mini-language, e.g.
 * `"type.Name"`, `"Pset_WallCommon.FireRating"`, `"material.Name"`,
 * `"storey.Elevation"`. See this file's header comment for the full list of special
 * first-class keys and the two disclosed gaps.
 */
export function getElementValue(element: EntityInstance, query: string): unknown {
	const keys = parseKeyPath(query);
	return getElementValueForKeys(element, keys);
}
