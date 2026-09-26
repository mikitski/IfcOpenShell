// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/grid/remove_grid_axis.py` (src/ifcopenshell-python, 46
// lines) -- part of this project's brand-new `api.grid` module (see `./index.ts`'s own
// header comment). Removes an `IfcGridAxis` from the file and purges its `AxisCurve`
// (if nothing else still references it).
//
// --- Real, disclosed Python quirk: an UNGUARDED `remove_deep2(file, None)` call if
//     `AxisCurve` was never set ---
//
// Real Python's own source (`remove_grid_axis.py:44-46`):
// ```python
// axis_curve = axis.AxisCurve
// file.remove(axis)
// ifcopenshell.util.element.remove_deep2(file, axis_curve)
// ```
// There is NO `if axis_curve:` guard around the final call, unlike the structurally
// similar cleanup step in e.g. `../nest/assignObject.ts`'s own `if (history)
// removeDeep2(...)`. `AxisCurve` is a mandatory `IfcCurve` attribute in the EXPRESS
// schema, but `../grid/createGridAxis.ts`'s own header comment already establishes that
// a freshly created `IfcGridAxis` never has it set (only `createAxisCurve.ts` populates
// it) -- so calling `remove_grid_axis` on an axis that never got a curve assigned passes
// `None`/`null` straight into `remove_deep2`, which itself has no `None`-tolerant branch
// either (`util/element.py`'s `remove_deep2(ifc_file, element, ...)` immediately calls
// `ifc_file.get_total_inverses(element)`, which raises for a `None` `element`). This is
// therefore a real, reachable crash in real Python for that specific (valid, if
// unusual) input shape, not a defensive check this port is choosing to skip. Ported
// verbatim: `elementUtil.removeDeep2(file, axisCurve as EntityInstance)` is called
// unconditionally below, with an explicit cast (not a runtime guard) documenting that a
// `null` `axisCurve` is passed straight through on purpose, matching
// `../drawing/assignProduct.ts`'s own identical "unguarded null dereference, cast +
// comment, not silently fixed" precedent for the exact same category of Python bug.
// Every real Python test in `test/api/grid/test_remove_grid_axis.py` always sets
// `AxisCurve` first, so this crash path is never exercised by upstream's own test
// suite either -- confirmed by reading both tests in full.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveGridAxisSettings {
	/** The `IfcGridAxis` you want to remove. */
	axis: EntityInstance;
}

function removeGridAxisUsecase(file: IfcFile, settings: RemoveGridAxisSettings): void {
	const axisCurve = settings.axis.get("AxisCurve") as EntityInstance | null;
	file.remove(settings.axis);
	// See this file's header comment: `axisCurve` may be `null` here, and is passed
	// through unguarded, matching real Python's own unguarded `remove_deep2(file,
	// axis_curve)` call.
	elementUtil.removeDeep2(file, axisCurve as EntityInstance);
}

/**
 * Removes a grid axis from a grid (Python: `ifcopenshell.api.grid.remove_grid_axis`).
 *
 * @example
 * ```ts
 * // A pretty standard rectangular grid, with only two axes.
 * const grid = api.root.createEntity(model, { ifcClass: "IfcGrid" });
 * const axisA = api.grid.createGridAxis(model, { axisTag: "A", uvwAxes: "UAxes", grid });
 * const axis1 = api.grid.createGridAxis(model, { axisTag: "1", uvwAxes: "VAxes", grid });
 *
 * // Let's create a third so we can remove it later
 * const axis2 = api.grid.createGridAxis(model, { axisTag: "2", uvwAxes: "VAxes", grid });
 *
 * // Let's remove it!
 * api.grid.removeGridAxis(model, { axis: axis2 });
 * ```
 */
export const removeGridAxis = wrapUsecase("grid.remove_grid_axis", removeGridAxisUsecase);
