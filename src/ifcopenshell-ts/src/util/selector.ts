// This file was generated with the assistance of an AI coding tool.
//
// **Chunk 1** ported `ifcopenshell/util/selector.py`'s (src/ifcopenshell-python) **key-
// path mini-language** only -- planning/ifcopenshell-ts/research/03-python-util-
// inventory.md's dedicated "`selector.py` -- the IFC Query Selector Syntax" section,
// sub-section "2. Key-path grammar (`get_element_grammar`) -> `get_element_value(element,
// query)`". This is the shared dependency both `filter_elements`'s `query:` facet and
// `format()`'s `{{...}}` interpolation call into (both confirmed, by reading the real
// Python source, to call `get_element_value(element, query_string)` directly --
// selector.py lines 215 and 1180) -- so porting it first, standalone, unblocked both of
// those later chunks without needing to guess at their own scope.
//
// **Chunk 2** (this update, see that section's own header comment further down this
// file for the full scope/findings writeup) ports `filter_elements` (the
// `filter_elements_grammar` facet-based element-filtering language) -- the `query:`
// facet it adds reuses chunk 1's `getElementValue` directly, confirming the dependency
// note above.
//
// Explicitly NOT in this repo's scope yet: `format`/`FormatTransformer` (the
// `format_grammar` Excel-formula-like expression language) -- a separate, later chunk.
// `set_element_value` (selector.py's `get_element_value` inverse, which crosses into
// `ifcopenshell.api.pset`/`ifcopenshell.api.geometry` territory) is also out of scope
// here, for the same reason `util.unit`'s `convert_file_length_units` is (`TODOS.md`):
// it needs the not-yet-ported `api` layer (Phase 6+).
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
import type { IfcFile } from "../file";
import { getReferences } from "./classification";
import {
	getAggregate,
	getContainer,
	getDecomposition,
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

// ============================================================================
// Chunk 2: `filter_elements` -- the facet-based element-filtering language
// (`filter_elements_grammar`/`FacetTransformer`, selector.py lines 43-116 and
// 912-1298) -> `filter_elements(file, query, elements=None, edit_in_place=False)`
// (selector.py lines 570-610).
//
// Ported in full: every facet type (`instance`/`entity`/`attribute`/`type`/
// `material`/`property`/`classification`/`location`/`group`/`parent`/`query`), both
// combinators (`,` within a `facet_list`, `+` between `facet_list`s -- see
// `FacetRunner.run` below for why "OR within a group, AND across groups" is a
// simplification of what the real Python source does: entity/instance facets union
// elements *into* the current working set while every other facet type *narrows* it,
// so within one comma-separated group the actual semantics are "sequential
// union-then-filter in parse order", not a symmetric OR), block-comment stripping
// (`/* ... */`, correctly *not* recognized inside quoted-string content -- verified
// against `test_block_comments_are_ignored`'s own `Name="a/*b"` case), and `/regex/`
// support for pset/prop names and attribute/property values. Every filter facet reuses
// the real, already-ported `util.element`/`util.classification` functions the real
// Python source calls into (`getType`, `getMaterials`, `getPset`/`getPsets`,
// `getContainer`/`getAggregate`, `getDecomposition`, `getPredefinedType`, `classification
// .getReferences`) -- nothing reimplemented.
//
// *** Findings disclosed here (verified against the real Python source, not the task
// brief's own speculation -- see each point for what was confirmed and what changed): ***
//
// 1. **`decimal.Decimal` does NOT apply to this chunk.** The task brief (echoing this
//    project's own research doc) flagged `Decimal`-vs-`Number` as a porting concern for
//    numeric comparisons. Direct source verification (`grep -n "Decimal"
//    selector.py`) shows `Decimal`/`InvalidOperation` are imported and used *only* by
//    `FormatTransformer.round()` (the `format()` grammar's numeric rounding function --
//    a separate, later, explicitly out-of-scope chunk). `FacetTransformer.compare()` --
//    the only numeric-comparison logic in `filter_elements`'s actual scope -- uses plain
//    Python `int`/`float` throughout, with no `Decimal` anywhere. Plain JS `number` is
//    therefore an exact behavioral match for *this* chunk, not a "likely fine" fallback.
//
// 2. **A real, narrower, genuinely-JS-specific divergence exists instead: `int` vs.
//    `float`.** Python's `compare()` branches on `isinstance(element_value, int)` vs.
//    `isinstance(element_value, float)` to decide whether the query's string `value` is
//    parsed strictly (`int(value)`, rejecting any decimal point) or permissively
//    (`float(value)`). JS has no equivalent runtime type split -- every IFC INTEGER and
//    REAL attribute value (and every unwrapped pset/qto property value, via
//    `util/element.ts`'s `unwrapSelectValue`) surfaces as the same JS `number`, so this
//    port cannot recover which EXPRESS primitive type produced a given whole-number
//    value at the point `compare()` runs (the type tag `unwrapSelectValue`/`selectValueType`
//    track is only carried in `getProperty`/`getProperties`'s `verbose=true` mode, never
//    used by `get_pset(element, pset, prop)`'s plain unwrap that `property()`/`attribute()`
//    facets actually call). `compareValues` below (see its own comment) resolves this by
//    always using the permissive `float`-style parser (`pythonFloat`) for any numeric
//    `element_value`, regardless of whether it happens to be a whole number. This is
//    observably identical to Python in every case this module's own tests (and this
//    chunk's own tests, ported from `test_selector.py`) exercise, and only diverges in
//    one specific, narrow scenario: a *quoted, non-integer* value string (e.g.
//    `Foobar.Baz>"100.5"` -- note the grammar's own `unquoted_string` production
//    excludes `.`, so an unquoted decimal literal isn't even parseable in the first
//    place) compared against an attribute/property whose underlying EXPRESS type is
//    declared INTEGER (not REAL) -- Python's `int("100.5")` raises `ValueError` there
//    (caught, `result = False`), while this port's permissive float parse succeeds and
//    produces a real (mathematically correct) comparison instead of Python's blanket
//    exclusion. Disclosed, not silently smoothed over; no test in `test_selector.py`
//    exercises this specific combination. This is the *same* root-cause architectural
//    gap `TODOS.md`'s "`EntityInstance.getByIndex`/`wrapValue` collapse EXPRESS INTEGER
//    vs. REAL into one JS `number`" entry already tracks (found independently by an
//    earlier `util.migrator` chunk) -- that entry has been updated to note this file as
//    a second affected caller, rather than duplicating a new entry for the same gap.
//
// 3. **The task brief's "a trailing `+` allows continued mutation via `edit_in_place`"
//    claim (from the research doc's own summary) does not hold up against the real
//    grammar/transformer.** `filter_group: facet_list ("+" facet_list)* "+"?` -- the
//    trailing `"+"?` is pure grammar plumbing allowing a dangling `+` with nothing
//    (meaningful) after it, unrelated to `edit_in_place` entirely; it exists so a query
//    like `"IfcWall + /* IfcSlab */"` (a block comment "commenting out" everything after
//    the `+`) parses cleanly instead of erroring on the dangling operator (verified
//    directly against `test_block_comments_are_ignored`, which exercises exactly this).
//    `parseFilterQuery`'s `"+"`-loop below reproduces this (breaks out cleanly once
//    nothing but whitespace/comments remains after a `+`), independent of anything
//    `edit_in_place`-related.
//
// 4. **`edit_in_place` itself has no observable effect on `filter_elements`'s current
//    behavior**, confirmed by direct reading of `filter_elements`'s own body
//    (selector.py lines 604-610): `if elements and not edit_in_place: elements =
//    elements.copy()` only decides whether the *local* `elements` variable is a
//    defensive copy before being handed to `FacetTransformer(ifc_file, elements)` --
//    but `FacetTransformer.__init__` *unconditionally* does `self.base_elements =
//    elements.copy()` regardless, and `get_results()` always builds a brand-new `set`
//    from scratch (`results: set[...] = set(); for r in self.results: results |= r`),
//    never returning `elements`/`self.base_elements` by reference either way. So this
//    parameter is currently vestigial in the real Python source -- not the "complex
//    `ifcopenshell.api` mutation" scenario the task brief's "OUT of scope" caveat
//    anticipated (there is no such mutation at all in this function). `filterElements`
//    below still accepts and documents the parameter for API-shape fidelity (a future
//    Python change could make it meaningful again), but its value doesn't change this
//    port's output, matching upstream exactly. Not deferred/out-of-scope -- included,
//    because real investigation showed it was trivial, per the task brief's own
//    instruction to investigate before deferring.
//
// 5. **One genuine, faithfully-reproduced Python quirk, not "fixed":** `add_default_elements`
//    checks `if self.base_elements:` (*truthiness*, matching Python's "empty set is
//    falsy"), while `instance`/`entity` facets check `self.base_elements is None`
//    (*identity*). This means an explicitly-passed **empty** seed `Set` (as opposed to
//    `undefined`/no seed at all) behaves asymmetrically: `instance`/`entity` facets see
//    a real (empty) seed and match nothing from it, while every other facet type's
//    `add_default_elements()` call falls back to the *full* `IfcProduct`/`IfcTypeProduct`
//    default set anyway, since an empty JS `Map`'s `.size` is `0` just as an empty
//    Python `set()` is falsy. `FacetRunner` below reproduces this exactly (`baseElements
//    !== null` for the identity check, `baseElements.size > 0` for the truthiness
//    check) rather than "normalizing" the two to agree with each other. No test in
//    `test_selector.py` exercises this edge case; disclosed for completeness.
//
// 6. **A second genuine, faithfully-reproduced Python quirk, found by this chunk's own
//    adversarial test-writing (not by reading alone):** `get_container_tree`'s
//    memoization (selector.py ~line 1185) caches, for each node visited while walking
//    *up* from some starting container, that node's *remaining* upward tree --
//    deliberately excluding the node itself (`tree_copy.pop(0)` before caching
//    `tree_copy.copy()`). A subsequent *direct* `get_container_tree` call for that same
//    node (now a cache *hit*, since Python's `if tree: return tree` only short-circuits
//    on a non-empty cached value) therefore returns a tree **missing that node itself**
//    -- silently excluding it from any `location=<that node's own Name/GlobalId>`
//    match, even though it genuinely is its own container's (or another element's)
//    ancestor. This is order-dependent on `self.elements`' Python `set` iteration order
//    (unspecified) or, in this port, `Map` insertion order (deterministic, following
//    `file.byType(...)`'s creation-order result) -- see `getContainerTree`'s own
//    comment (verbatim, "if tree: return tree") and `test/util/selector.test.ts`'s
//    dedicated regression test (`"getContainerTree's cache quirk: ..."`) for a
//    concrete, deterministic reproduction. Reproduced verbatim, not "fixed" -- this is
//    a real upstream Python bug, not a porting error, and "fixing" it here would make
//    this port observably diverge from `filter_elements`'s actual (if surprising)
//    current behavior.
//
// Not a byte-for-byte reproduction of lark's Earley parser (same disclosed
// simplification as `parseKeyPath` above): most notably, (a) `NULL`/`TRUE`/`FALSE` are
// recognized as the `special` value tokens only when the literal keyword is followed by
// a facet/value delimiter (whitespace/comment then `,`/`+`/end) -- lark's real
// longest-match-wins-with-literal-priority disambiguation against the competing
// `unquoted_string` alternative is approximated this way rather than fully replicated,
// and (b) an `Ifc`-prefixed token immediately followed by a comparison operator (e.g. a
// literal IFC attribute somehow named `IfcFoo`, which no real schema has) falls through
// to `attribute` parsing via a one-token lookahead rather than full Earley backtracking.
// Both approximations produce identical results to lark for every query this module's
// own tests (ported from `test_selector.py`, covering every facet type and both
// combinators) exercise.

// --- filter-grammar AST types ---

/** `comparison` (selector.py's `comparison` rule, transformed to one of these eight
 * strings by `FacetTransformer.comparison`). */
export type FilterComparison = "=" | "!=" | ">=" | "<=" | ">" | "<" | "*=" | "!*=";

/** `value`/`special` (selector.py's `value` rule, transformed by `FacetTransformer.value`). */
export type FilterValue = string | RegExp | boolean | null;

export type FilterFacet =
	| { kind: "instance"; negate: boolean; globalId: string }
	| { kind: "entity"; negate: boolean; ifcClass: string }
	| { kind: "attribute"; name: string; comparison: FilterComparison; value: FilterValue }
	| {
			kind: "type" | "material" | "classification" | "location" | "group" | "parent";
			comparison: FilterComparison;
			value: FilterValue;
	  }
	| {
			kind: "property";
			pset: string | RegExp;
			prop: string | RegExp;
			comparison: FilterComparison;
			value: FilterValue;
	  }
	| { kind: "query"; keys: string; comparison: FilterComparison; value: FilterValue };

/** `facet_list` (comma-separated facets). */
export type FilterFacetList = FilterFacet[];
/** `filter_group` (`+`-separated `facet_list`s). */
export type FilterGroup = FilterFacetList[];

const KEYWORD_FACET_KINDS = new Set(["type", "material", "classification", "location", "group", "parent"]);
const GLOBALID_RE = /^[0-3][a-zA-Z0-9_$]{21}/;
const IFC_CLASS_RE = /^Ifc\w+/;
const ATTRIBUTE_NAME_RE = /^[A-Z]\w+$/;
const SPECIAL_VALUE_LITERALS: readonly (readonly [string, FilterValue])[] = [
	["NULL", null],
	["TRUE", true],
	["FALSE", false],
];

/**
 * Hand-rolled recursive-descent parser for `filter_elements_grammar` -- no new npm
 * dependency, matching `parseKeyPath`'s own precedent above. See this section's header
 * comment for the disclosed simplifications relative to lark's real Earley parser.
 */
export function parseFilterQuery(query: string): FilterGroup {
	const n = query.length;
	let i = 0;

	function skipWsAndComments(): void {
		while (true) {
			const before = i;
			while (i < n && /[ \t\f\r\n]/.test(query[i])) i++;
			if (query.startsWith("/*", i)) {
				const end = query.indexOf("*/", i + 2);
				if (end === -1) {
					throw new Error(`Unterminated block comment in filter query: '${query}'`);
				}
				i = end + 2;
			}
			if (i === before) break;
		}
	}

	/** Whether, after skipping whitespace/comments starting at `pos`, the next
	 * non-ignorable character is a facet/value-list delimiter (`,`, `+`) or end of
	 * input -- used to decide whether a candidate GlobalId/IFC-class/keyword token
	 * should actually be treated as such (see this section's header comment, point on
	 * lark-approximation). Doesn't mutate `i`. */
	function isDelimiterAhead(pos: number): boolean {
		let p = pos;
		while (true) {
			const before = p;
			while (p < n && /[ \t\f\r\n]/.test(query[p])) p++;
			if (query.startsWith("/*", p)) {
				const end = query.indexOf("*/", p + 2);
				if (end === -1) return true; // Let the real scan surface the "unterminated" error.
				p = end + 2;
			}
			if (p === before) break;
		}
		return p >= n || query[p] === "," || query[p] === "+";
	}

	/** Assumes `query[i] === '"'`. Returns the raw inner content (escape sequences
	 * un-collapsed), advancing `i` past the closing quote -- same scanning logic as
	 * `parseKeyPath`'s quoted-string branch above, but the *unescape* transform applied
	 * by the caller differs (see `parseNameToken` below). */
	function scanQuotedRaw(): string {
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
			throw new Error(`Unterminated quoted string in filter query: '${query}'`);
		}
		i = j + 1;
		return content;
	}

	/** Assumes `query[i] === '/'`. Same one-or-more-inner-char rule (and the same
	 * empty-`//`-is-a-parse-error bugfix) as `parseKeyPath`'s regex branch above. */
	function scanFilterRegex(): RegExp {
		let j = i + 1;
		while (j < n && query[j] !== "/") j++;
		if (j >= n) {
			throw new Error(`Unterminated regex in filter query: '${query}'`);
		}
		if (j === i + 1) {
			throw new Error(`Invalid filter query (empty regex '//' is not allowed): '${query}'`);
		}
		const pattern = query.slice(i + 1, j);
		i = j + 1;
		// Same JS-`RegExp`-vs-Python-`re` caveat as `parseKeyPath`'s regex branch above.
		return new RegExp(pattern);
	}

	/** A scanned `quoted_string | regex_string | unquoted_string` token. `bare` is
	 * false for quoted/regex tokens -- such a token can never be a `type`/`material`/…
	 * keyword literal or match `attribute_name`'s bare regex pattern (neither
	 * production has a quoted/regex alternative in the real grammar), only ever a
	 * `pset`/`prop` name. Callers that need to distinguish keyword/attribute-name
	 * tokens from `pset`/`prop` tokens check `.bare` before matching against either. */
	function parseNameToken(allowRegex: boolean): { value: string | RegExp; bare: boolean } {
		skipWsAndComments();
		if (i >= n) {
			throw new Error(`Invalid filter query (expected a name): '${query}'`);
		}
		const ch = query[i];
		if (ch === '"') {
			const raw = scanQuotedRaw();
			// `FacetTransformer.value`'s quoted_string handling (selector.py ~line 1236):
			// `args[0].children[0].value[1:-1].replace('\\"', '"')` -- only escaped
			// double-quotes are unescaped, every other backslash is left untouched. This
			// is a *different* rule from `parseKeyPath`'s get_element_grammar quoted
			// strings above (`.replace("\\", "")`, a blunt "strip every backslash") --
			// the two grammars' `GetElementTransformer`/`FacetTransformer` genuinely
			// disagree on this in the real Python source; both are ported faithfully to
			// their own grammar, not conflated.
			return { value: raw.replace(/\\"/g, '"'), bare: false };
		}
		if (ch === "/") {
			if (!allowRegex) {
				throw new Error(`Invalid filter query (a regex is not allowed here): '${query}'`);
			}
			return { value: scanFilterRegex(), bare: false };
		}
		// unquoted_string: /[^,.=><*!\s]+/
		let j = i;
		while (j < n && !/[,.=><*!\s]/.test(query[j])) j++;
		if (j === i) {
			throw new Error(`Invalid filter query (unexpected character '${ch}' at position ${i}): '${query}'`);
		}
		const token = query.slice(i, j);
		i = j;
		return { value: token, bare: true };
	}

	function parseComparison(): FilterComparison {
		skipWsAndComments();
		if (query[i] === "!") {
			if (query.startsWith("!=", i)) {
				i += 2;
				return "!=";
			}
			if (query.startsWith("!*=", i)) {
				i += 3;
				return "!*=";
			}
			throw new Error(`Invalid filter query ('!' is only valid before '=' or '*=') at position ${i}: '${query}'`);
		}
		if (query.startsWith(">=", i)) {
			i += 2;
			return ">=";
		}
		if (query.startsWith("<=", i)) {
			i += 2;
			return "<=";
		}
		if (query.startsWith("*=", i)) {
			i += 2;
			return "*=";
		}
		if (query[i] === ">") {
			i++;
			return ">";
		}
		if (query[i] === "<") {
			i++;
			return "<";
		}
		if (query[i] === "=") {
			i++;
			return "=";
		}
		throw new Error(`Invalid filter query (expected a comparison operator) at position ${i}: '${query}'`);
	}

	function parseFacetValue(): FilterValue {
		skipWsAndComments();
		if (i < n && query[i] !== '"' && query[i] !== "/") {
			for (const [literal, result] of SPECIAL_VALUE_LITERALS) {
				if (query.startsWith(literal, i) && isDelimiterAhead(i + literal.length)) {
					i += literal.length;
					return result;
				}
			}
		}
		return parseNameToken(true).value;
	}

	function parseFacet(): FilterFacet {
		skipWsAndComments();
		let negate = false;
		if (query[i] === "!") {
			negate = true;
			i++;
			skipWsAndComments();
		}

		const globalIdMatch = GLOBALID_RE.exec(query.slice(i));
		if (globalIdMatch && isDelimiterAhead(i + globalIdMatch[0].length)) {
			const globalId = globalIdMatch[0];
			i += globalId.length;
			return { kind: "instance", negate, globalId };
		}

		const ifcClassMatch = IFC_CLASS_RE.exec(query.slice(i));
		if (ifcClassMatch && isDelimiterAhead(i + ifcClassMatch[0].length)) {
			const ifcClass = ifcClassMatch[0];
			i += ifcClass.length;
			return { kind: "entity", negate, ifcClass };
		}

		if (negate) {
			throw new Error(
				`Invalid filter query ('!' is only valid before a GlobalId or IFC class name) at position ${i}: '${query}'`,
			);
		}

		if (query.startsWith("query:", i)) {
			i += "query:".length;
			const keysToken = parseNameToken(false); // `keys: quoted_string | unquoted_string` -- no regex_string.
			if (typeof keysToken.value !== "string") {
				throw new Error(`Invalid filter query (a regex is not allowed as a 'query:' key path): '${query}'`);
			}
			const comparison = parseComparison();
			const value = parseFacetValue();
			return { kind: "query", keys: keysToken.value, comparison, value };
		}

		const nameToken = parseNameToken(true);
		skipWsAndComments();
		if (query[i] === ".") {
			i++;
			const propToken = parseNameToken(true);
			const comparison = parseComparison();
			const value = parseFacetValue();
			return { kind: "property", pset: nameToken.value, prop: propToken.value, comparison, value };
		}

		if (nameToken.bare && typeof nameToken.value === "string" && KEYWORD_FACET_KINDS.has(nameToken.value)) {
			const kind = nameToken.value as "type" | "material" | "classification" | "location" | "group" | "parent";
			const comparison = parseComparison();
			const value = parseFacetValue();
			return { kind, comparison, value };
		}

		if (nameToken.bare && typeof nameToken.value === "string" && ATTRIBUTE_NAME_RE.test(nameToken.value)) {
			const comparison = parseComparison();
			const value = parseFacetValue();
			return { kind: "attribute", name: nameToken.value, comparison, value };
		}

		throw new Error(
			`Invalid filter query (expected an IFC class, GlobalId, attribute name, 'type'/'material'/'classification'/'location'/'group'/'parent' keyword, 'query:' prefix, or 'pset.prop' property filter) at position ${i}: '${query}'`,
		);
	}

	function parseFacetList(): FilterFacetList {
		const facets: FilterFacetList = [parseFacet()];
		skipWsAndComments();
		while (query[i] === ",") {
			i++;
			skipWsAndComments();
			facets.push(parseFacet());
			skipWsAndComments();
		}
		return facets;
	}

	function parseFilterGroup(): FilterGroup {
		const groups: FilterGroup = [parseFacetList()];
		skipWsAndComments();
		while (query[i] === "+") {
			i++;
			skipWsAndComments();
			// Grammar: `filter_group: facet_list ("+" facet_list)* "+"?` -- a trailing
			// "+" with nothing (meaningful) after it is valid (see this section's
			// header comment, point 3).
			if (i >= n) break;
			groups.push(parseFacetList());
			skipWsAndComments();
		}
		if (i < n) {
			throw new Error(`Unexpected trailing content in filter query at position ${i}: '${query}'`);
		}
		return groups;
	}

	return parseFilterGroup();
}

/** Python: `float(value)` -- permissive numeric-string parsing (accepts optional
 * leading/trailing whitespace, sign, decimal point, scientific-notation exponent, and
 * `inf`/`infinity`/`nan`, case-insensitively), used by `compareValues` below for
 * *every* numeric `element_value` comparison, not just ones that came from a
 * Python-`float`-typed source -- see this section's header comment, finding 2, for why. */
function pythonFloat(raw: string): number {
	const s = raw.trim();
	if (/^[+-]?(inf|infinity)$/i.test(s)) return s.startsWith("-") ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
	if (/^[+-]?nan$/i.test(s)) return Number.NaN;
	if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) {
		throw new Error(`invalid literal for float(): '${raw}'`);
	}
	return Number(s);
}

/** Python: `getattr(entity, name, None)` where `entity` may itself be `None` (e.g.
 * `getattr(element_type, "Name", None)` when `element_type` is `None`) -- `attrOrNull`
 * above assumes a real `EntityInstance`, so this adds the null-safe outer check every
 * `type`/`material`/`classification`/`group`/`parent` facet below needs. */
function attrOrNullOn(entity: EntityInstance | null, name: string): unknown {
	return entity === null ? null : attrOrNull(entity, name);
}

/**
 * Python: `FacetTransformer.compare(element_value, comparison, value) -> bool`
 * (selector.py ~line 1248). See this section's header comment (findings 1-2) for the
 * `Decimal`-doesn't-apply-here / `int`-vs-`float` disclosures.
 */
function compareValues(elementValue: unknown, comparison: FilterComparison, value: FilterValue): boolean {
	if (Array.isArray(elementValue)) {
		// Python: `isinstance(element_value, (list, tuple))` -- match if *any* item
		// does, negating the aggregate rather than each item, so `!=` stays the
		// complement of `=` for multi-valued properties (#8129, reproduced verbatim).
		const stripped = (comparison.startsWith("!") ? comparison.slice(1) : comparison) as FilterComparison;
		const result = elementValue.some((item) => compareValues(item, stripped, value));
		return comparison.startsWith("!") ? !result : result;
	}

	let result: boolean;
	if (typeof value === "string") {
		try {
			if (typeof elementValue === "number") {
				const numericValue = pythonFloat(value);
				const operator = comparison.replace(/^!/, "");
				if (operator === ">=") result = elementValue >= numericValue;
				else if (operator === "<=") result = elementValue <= numericValue;
				else if (operator === ">") result = elementValue > numericValue;
				else if (operator === "<") result = elementValue < numericValue;
				else result = elementValue === numericValue; // "=" or "*=" -- Python: "Tolerance?"
			} else if (typeof elementValue === "string") {
				const operator = comparison.replace(/^!/, "");
				result = operator === "*=" ? elementValue.includes(value) : elementValue === value;
			} else {
				result = (elementValue as unknown) === value;
			}
		} catch {
			// Python: bare `except:` around the whole `int(value)`/`float(value)`/
			// comparison block -- an unparseable numeric `value` string, or any other
			// comparison failure, means "no match", not a propagated error.
			result = false;
		}
	} else if (value instanceof RegExp) {
		if (elementValue === null || elementValue === undefined) {
			result = false;
		} else if (typeof elementValue !== "string") {
			// Python: `value.match(element_value)` raises `TypeError` here, uncaught --
			// a genuine Python crash for e.g. a numeric attribute compared against a
			// `/regex/` value, reproduced verbatim rather than silently smoothed over.
			throw new TypeError(
				`filterElements: cannot match a regex facet value against a non-string element value (${JSON.stringify(elementValue)})`,
			);
		} else {
			result = matchesFromStart(value, elementValue);
		}
	} else if (value === null || value === true || value === false) {
		// Python: `element_value is value` -- real identity, not `==` (so e.g. `1` is
		// never "is True"). JS `===` between a `number`/`string`/`EntityInstance` and a
		// literal `boolean`/`null` mirrors this exactly (no `1 == true`-style coercion).
		result = elementValue === value;
	} else {
		throw new Error(`filterElements: unexpected facet value: ${JSON.stringify(value)}`);
	}

	return comparison.startsWith("!") ? !result : result;
}

/**
 * Python: `FacetTransformer` (selector.py ~line 912) -- the stateful, imperative
 * facet-application engine `filter_elements` drives. See this section's header comment
 * for why this can't be a pure declarative filter tree: entity/instance facets
 * *additively union* into the working set while every other facet type *narrows* it,
 * and which behavior happens when is order-dependent within a `facet_list`.
 */
class FacetRunner {
	private elements = new Map<number, EntityInstance>();
	private readonly results: Map<number, EntityInstance>[] = [];
	private hasAdditiveFacetInCurrentList = false;
	/** Python: `self.container_trees` (`get_container_tree`'s memoization cache),
	 * keyed by container identity (matching this file's own identity-based `EntityInstance`
	 * dedup convention, e.g. `EntityInstanceSet` in `util/element.ts`). */
	private readonly containerTrees = new Map<number, EntityInstance[]>();

	constructor(
		private readonly file: IfcFile,
		/** `null` = no seed provided (Python's `elements=None`); a non-null `Map` here
		 * (possibly empty) is Python's `elements.copy()` -- see this section's header
		 * comment, finding 5, for the real, faithfully-reproduced Python quirk this
		 * `null`-vs-`Map` distinction (checked by `is None` for `instance`/`entity`
		 * facets) exists to support, separately from `addDefaultElements`'s own
		 * `.size > 0` *truthiness* check below. */
		private readonly baseElements: Map<number, EntityInstance> | null,
	) {}

	run(group: FilterGroup): void {
		for (const facetList of group) {
			for (const facet of facetList) this.applyFacet(facet);
			this.pushFacetListResult();
		}
	}

	getResults(): Set<EntityInstance> {
		const merged = new Map<number, EntityInstance>();
		for (const r of this.results) {
			for (const [id, inst] of r) merged.set(id, inst);
		}
		return new Set(merged.values());
	}

	private pushFacetListResult(): void {
		// Python: `if self.elements: self.results.append(self.elements); self.elements
		// = set()` -- appends by reference then rebinds to a fresh set, so the pushed
		// snapshot is never mutated by later facet_lists.
		if (this.elements.size > 0) {
			this.results.push(this.elements);
			this.elements = new Map();
		}
		this.hasAdditiveFacetInCurrentList = false;
	}

	private addDefaultElements(): void {
		if (this.hasAdditiveFacetInCurrentList) return;
		this.hasAdditiveFacetInCurrentList = true;
		if (this.baseElements !== null && this.baseElements.size > 0) {
			for (const [id, inst] of this.baseElements) this.elements.set(id, inst);
		} else {
			for (const inst of this.file.byType("IfcProduct")) this.elements.set(inst.identity(), inst);
			for (const inst of this.file.byType("IfcTypeProduct")) this.elements.set(inst.identity(), inst);
		}
	}

	private applyFacet(facet: FilterFacet): void {
		switch (facet.kind) {
			case "instance":
				this.applyInstance(facet);
				return;
			case "entity":
				this.applyEntity(facet);
				return;
			case "attribute":
				this.applyAttribute(facet);
				return;
			case "type":
				this.applyType(facet);
				return;
			case "material":
				this.applyMaterial(facet);
				return;
			case "property":
				this.applyProperty(facet);
				return;
			case "classification":
				this.applyClassification(facet);
				return;
			case "location":
				this.applyLocation(facet);
				return;
			case "group":
				this.applyGroup(facet);
				return;
			case "parent":
				this.applyParent(facet);
				return;
			case "query":
				this.applyQuery(facet);
				return;
		}
	}

	private applyInstance(facet: Extract<FilterFacet, { kind: "instance" }>): void {
		this.hasAdditiveFacetInCurrentList = true;
		if (this.baseElements === null) {
			try {
				const inst = this.file.byGuid(facet.globalId);
				if (!facet.negate) this.elements.set(inst.identity(), inst);
				else this.elements.delete(inst.identity());
			} catch {
				// Python: bare `except: pass` around `self.file.by_guid(...)` (also
				// swallows a `.remove()`-on-non-member `KeyError` for the negated case).
			}
		} else {
			for (const inst of this.baseElements.values()) {
				if (attrOrNull(inst, "GlobalId") !== facet.globalId) continue;
				if (!facet.negate) this.elements.set(inst.identity(), inst);
				else this.elements.delete(inst.identity());
			}
		}
	}

	private applyEntity(facet: Extract<FilterFacet, { kind: "entity" }>): void {
		this.hasAdditiveFacetInCurrentList = true;
		if (this.baseElements === null) {
			try {
				const matches = this.file.byType(facet.ifcClass);
				for (const inst of matches) {
					if (!facet.negate) this.elements.set(inst.identity(), inst);
					else this.elements.delete(inst.identity());
				}
			} catch {
				// Python: bare `except: pass` around `self.file.by_type(...)`.
			}
		} else {
			for (const inst of this.baseElements.values()) {
				if (!inst.isA(facet.ifcClass)) continue;
				if (!facet.negate) this.elements.set(inst.identity(), inst);
				else this.elements.delete(inst.identity());
			}
		}
	}

	private applyAttribute(facet: Extract<FilterFacet, { kind: "attribute" }>): void {
		this.addDefaultElements();
		const next = new Map<number, EntityInstance>();
		for (const [id, inst] of this.elements) {
			const elementValue = facet.name === "PredefinedType" ? getPredefinedType(inst) : attrOrNull(inst, facet.name);
			if (compareValues(elementValue, facet.comparison, facet.value)) next.set(id, inst);
		}
		this.elements = next;
	}

	private applyType(facet: Extract<FilterFacet, { kind: "type" }>): void {
		this.addDefaultElements();
		const next = new Map<number, EntityInstance>();
		for (const [id, inst] of this.elements) {
			const elementType = getType(inst);
			const matches =
				compareValues(attrOrNullOn(elementType, "Name"), facet.comparison, facet.value) ||
				compareValues(attrOrNullOn(elementType, "GlobalId"), facet.comparison, facet.value);
			if (matches) next.set(id, inst);
		}
		this.elements = next;
	}

	private applyMaterial(facet: Extract<FilterFacet, { kind: "material" }>): void {
		this.addDefaultElements();
		const next = new Map<number, EntityInstance>();
		for (const [id, inst] of this.elements) {
			const materials = getMaterials(inst);
			let result: boolean | null = materials.length > 0 ? false : null;
			for (const material of materials) {
				if (compareValues(attrOrNull(material, "Name"), facet.comparison, facet.value)) result = true;
				if (compareValues(attrOrNull(material, "Category"), facet.comparison, facet.value)) result = true;
			}
			const matches =
				result !== null
					? facet.comparison === "="
						? result
						: !result
					: compareValues(null, facet.comparison, facet.value);
			if (matches) next.set(id, inst);
		}
		this.elements = next;
	}

	private evaluateProperty(element: EntityInstance, facet: Extract<FilterFacet, { kind: "property" }>): boolean {
		const { pset, prop, comparison, value } = facet;
		if (typeof pset === "string" && typeof prop === "string") {
			return compareValues(getPset(element, pset, prop), comparison, value);
		}
		if (typeof pset === "string" && prop instanceof RegExp) {
			const elementProps = (getPset(element, pset) as Record<string, unknown> | null) ?? {};
			for (const [propName, propValue] of Object.entries(elementProps)) {
				if (matchesFromStart(prop, propName)) return compareValues(propValue, comparison, value);
			}
		} else if (pset instanceof RegExp) {
			const elementPsets = getPsets(element);
			for (const [psetName, elementProps] of Object.entries(elementPsets)) {
				if (!matchesFromStart(pset, psetName)) continue;
				if (typeof prop === "string") {
					const elementValue = elementProps[prop] ?? null;
					if (elementValue !== null) return compareValues(elementValue, comparison, value);
				} else {
					for (const [propName, propValue] of Object.entries(elementProps)) {
						if (matchesFromStart(prop, propName)) return compareValues(propValue, comparison, value);
					}
				}
			}
		}
		// Python: falls through to `self.compare(None, comparison, value)` when no
		// pset/prop combination matched at all (or `pset` didn't exist).
		return compareValues(null, comparison, value);
	}

	private applyProperty(facet: Extract<FilterFacet, { kind: "property" }>): void {
		this.addDefaultElements();
		const next = new Map<number, EntityInstance>();
		for (const [id, inst] of this.elements) {
			if (this.evaluateProperty(inst, facet)) next.set(id, inst);
		}
		this.elements = next;
	}

	private applyClassification(facet: Extract<FilterFacet, { kind: "classification" }>): void {
		this.addDefaultElements();
		const next = new Map<number, EntityInstance>();
		for (const [id, inst] of this.elements) {
			const references = getReferences(inst);
			let result: boolean | null = references.size > 0 ? false : null;
			for (const reference of references) {
				if (compareValues(attrOrNull(reference, "Name"), facet.comparison, facet.value)) result = true;
				// Python: `getattr(reference, "Identification", getattr(reference,
				// "ItemReference", None))` -- falls back to `ItemReference` only when
				// `Identification` isn't *declared at all* (not merely unset).
				const identificationOrItemReference =
					attrOrMissing(reference, "Identification") !== MISSING
						? attrOrNull(reference, "Identification")
						: attrOrNull(reference, "ItemReference");
				if (compareValues(identificationOrItemReference, facet.comparison, facet.value)) result = true;
			}
			const matches =
				result !== null
					? facet.comparison === "="
						? result
						: !result
					: compareValues(null, facet.comparison, facet.value);
			if (matches) next.set(id, inst);
		}
		this.elements = next;
	}

	private getContainerTree(container: EntityInstance | null): EntityInstance[] {
		if (container === null) return [];
		const cached = this.containerTrees.get(container.identity());
		// Python: `if tree: return tree` -- only a *non-empty* cached tree short-
		// circuits; an empty one (a container directly under `IfcProject`) recomputes
		// every time. Reproduced verbatim, not "fixed".
		if (cached && cached.length > 0) return cached;

		const tree: EntityInstance[] = [];
		let current: EntityInstance | null = container;
		while (current) {
			if (current.isA("IfcProject")) break;
			tree.push(current);
			current = getAggregate(current);
		}

		const rest = [...tree];
		while (rest.length > 0) {
			const node = rest.shift() as EntityInstance;
			this.containerTrees.set(node.identity(), [...rest]);
		}
		return tree;
	}

	private applyLocation(facet: Extract<FilterFacet, { kind: "location" }>): void {
		this.addDefaultElements();
		const next = new Map<number, EntityInstance>();
		for (const [id, inst] of this.elements) {
			const container = getContainer(inst) ?? getAggregate(inst);
			const containers = this.getContainerTree(container);
			let result: boolean | null = containers.length > 0 ? false : null;
			for (const c of containers) {
				if (
					compareValues(attrOrNull(c, "Name"), "=", facet.value) ||
					compareValues(attrOrNull(c, "GlobalId"), "=", facet.value)
				) {
					result = true;
				}
			}
			const matches =
				result !== null
					? facet.comparison === "="
						? result
						: !result
					: compareValues(null, facet.comparison, facet.value);
			if (matches) next.set(id, inst);
		}
		this.elements = next;
	}

	private applyGroup(facet: Extract<FilterFacet, { kind: "group" }>): void {
		this.addDefaultElements();
		const next = new Map<number, EntityInstance>();
		for (const [id, inst] of this.elements) {
			let result = false;
			for (const rel of attrList(inst, "HasAssignments")) {
				if (!rel.isA("IfcRelAssignsToGroup")) continue;
				const relatingGroup = attrOrNull(rel, "RelatingGroup") as EntityInstance | null;
				if (!relatingGroup) continue;
				if (compareValues(attrOrNull(relatingGroup, "Name"), "=", facet.value)) {
					result = true;
				} else if (compareValues(attrOrNull(relatingGroup, "GlobalId"), "=", facet.value)) {
					result = true;
				}
			}
			if (facet.comparison === "=" ? result : !result) next.set(id, inst);
		}
		this.elements = next;
	}

	private applyParent(facet: Extract<FilterFacet, { kind: "parent" }>): void {
		const parents = new Map<number, EntityInstance>();
		const collect = (relType: string, relatingAttrName: string): void => {
			for (const rel of this.file.byType(relType)) {
				const parent = attrOrNull(rel, relatingAttrName) as EntityInstance | null;
				if (
					parent &&
					(compareValues(attrOrNull(parent, "Name"), facet.comparison, facet.value) ||
						compareValues(attrOrNull(parent, "GlobalId"), facet.comparison, facet.value))
				) {
					parents.set(parent.identity(), parent);
				}
			}
		};
		collect("IfcRelAggregates", "RelatingObject");
		collect("IfcRelContainedInSpatialStructure", "RelatingStructure");
		collect("IfcRelNests", "RelatingObject");
		collect("IfcRelVoidsElement", "RelatingBuildingElement");
		collect("IfcRelFillsElement", "RelatingOpeningElement");

		const result = new Map(parents);
		for (const parent of parents.values()) {
			for (const child of getDecomposition(parent)) result.set(child.identity(), child);
		}

		this.addDefaultElements();
		if (facet.comparison === "=") {
			for (const id of [...this.elements.keys()]) {
				if (!result.has(id)) this.elements.delete(id);
			}
		} else {
			for (const id of result.keys()) this.elements.delete(id);
		}
	}

	private applyQuery(facet: Extract<FilterFacet, { kind: "query" }>): void {
		this.addDefaultElements();
		const next = new Map<number, EntityInstance>();
		for (const [id, inst] of this.elements) {
			const elementValue = getElementValue(inst, facet.keys);
			if (compareValues(elementValue, facet.comparison, facet.value)) next.set(id, inst);
		}
		this.elements = next;
	}
}

/**
 * Python: `filter_elements(ifc_file, query, elements=None, edit_in_place=False) ->
 * set[entity_instance]` (selector.py lines 570-610).
 *
 * Filter elements based on the provided `query`. If `elements` is omitted, all
 * `IfcProduct`/`IfcTypeProduct` elements in the file are queried; if provided, the
 * query is applied to (a subset of) that seed set instead.
 *
 * `editInPlace` is accepted and documented for API-shape fidelity but currently has no
 * observable effect on the result -- see this section's header comment, finding 4, for
 * why (confirmed against the real Python source, not assumed).
 */
export function filterElements(
	ifcFile: IfcFile,
	query: string,
	elements?: Set<EntityInstance> | null,
	editInPlace = false,
): Set<EntityInstance> {
	// Python: `if not query: return elements or set()`.
	if (!query) return elements ?? new Set<EntityInstance>();

	const baseElements =
		elements === undefined || elements === null
			? null
			: new Map(Array.from(elements, (inst) => [inst.identity(), inst] as const));
	const runner = new FacetRunner(ifcFile, baseElements);
	runner.run(parseFilterQuery(query));
	return runner.getResults();
}
