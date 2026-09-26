// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/settings.py` (src/ifcopenshell-python) -- two global,
// user-mutable config flags consulted by `entityInstance.ts`'s `EntityInstance.get()`
// (`unpackNonAggregateInverses`) and `EntityInstance.equals()`
// (`compareInstancesByValue`). Python exposes these as reassignable module attributes
// (`ifcopenshell.settings.compare_instances_by_value = True`); TS/ESM named exports
// aren't reassignable from outside their module, so this is a single mutable object
// instead (planning/ifcopenshell-ts/40-testing-strategy.md SS5's decided DI-seam
// pattern, reused here for a plain production default rather than a full DI
// container -- this module intentionally stays this simple).

export const settings = {
	/**
	 * When true, inverse attributes without an aggregate specifier are returned as a
	 * single element or `null` instead of an array. Example:
	 *
	 * ```ts
	 * const group = file.createEntity("IfcGroup");
	 * file.createEntity("IfcRelAssignsToGroup", ...).set("RelatingGroup", group);
	 * group.get("IsGroupedBy"); // [rel]
	 * settings.unpackNonAggregateInverses = true;
	 * group.get("IsGroupedBy"); // rel
	 * ```
	 */
	unpackNonAggregateInverses: false,

	/**
	 * When true, compare entity instances by value rather than by identity, even when
	 * they belong to the same file. EXPRESS uses `=` for value comparison and `:=:` for
	 * instance comparison, whereas `EntityInstance.equals()` normally means "the same
	 * instance". Example:
	 *
	 * ```ts
	 * const a = file.createEntity("IfcCartesianPoint", [0, 0]);
	 * const b = file.createEntity("IfcCartesianPoint", [0, 0]);
	 * a.equals(b); // false
	 * settings.compareInstancesByValue = true;
	 * a.equals(b); // true
	 * ```
	 */
	compareInstancesByValue: false,
};
