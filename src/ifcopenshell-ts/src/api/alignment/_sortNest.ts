// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_sort_nest.py` (src/ifcopenshell-python, 27
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 3 of many). No dependency of any kind, no blocker.
//
// Real Python's leading underscore marks this as module-private -- confirmed absent
// from `__init__.py`'s own `__all__`/import list. Matching `getMappedSegments.ts`'s
// own `_getCurveSegmentCount` precedent for a not-really-public, underscore-prefixed
// helper, this file is NOT re-exported from `./index.ts`'s public barrel; a future
// chunk that needs it (e.g. `_add_segment_to_layout`, per real Python's own
// `from ifcopenshell.api.alignment._sort_nest import _sort_nest`) imports it directly
// by relative path instead.
//
// Python's `key: Callable` type hint (`collections.abc.Callable`, a type-only import
// with no runtime behavior) is a generic sort-key function -- ported as a generic `K
// extends number | string` key function, matching every other Python
// `sorted(..., key=...)` port in this project (e.g. `util/type.ts`'s own
// `prioritiseBuildingElementProxyType`) rather than an unconstrained/unsafely-
// comparable generic. `Array.prototype.sort` is guaranteed stable (ES2019+), matching
// Python's own stable `sorted()`.
import type { EntityInstance } from "../../entityInstance";

/**
 * Sorts the `RelatedObjects` of an `IfcRelNests` in place, by an arbitrary key
 * function (Python: `ifcopenshell.api.alignment._sort_nest`).
 *
 * @param nest The `IfcRelNests`.
 * @param key A function returning a comparable (number or string) sort key for a
 *   `RelatedObjects` member.
 * @returns `nest`, for convenience (matching real Python's own return value).
 */
export function _sortNest<K extends number | string>(
	nest: EntityInstance,
	key: (item: EntityInstance) => K,
): EntityInstance {
	const sorted = [...(nest.get("RelatedObjects") as EntityInstance[])].sort((a, b) => {
		const ka = key(a);
		const kb = key(b);
		if (ka < kb) return -1;
		if (ka > kb) return 1;
		return 0;
	});
	nest.set("RelatedObjects", sorted);
	return nest;
}
