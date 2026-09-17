// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_axis_subcontext.py`
// (src/ifcopenshell-python, 40 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 1 of many). Its 2 real dependencies
// (`ifcopenshell.util.representation.get_context`/`ifcopenshell.api.context
// .add_context`) are both already fully landed (`util/representation.ts`'s
// `getContext`, `../context/addContext.ts`) and reused directly here -- no blocker.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getContext } from "../../util/representation";
import { addContext } from "../context/addContext";

/**
 * Returns the `IfcGeometricRepresentationSubContext` for Model, Axis, MODEL_VIEW. If
 * one does not exist, it is created (Python:
 * `ifcopenshell.api.alignment.get_axis_subcontext`).
 *
 * @param file The model.
 * @returns The (possibly newly-created) `IfcGeometricRepresentationSubContext`.
 */
export function getAxisSubcontext(file: IfcFile): EntityInstance {
	let axisGeomSubcontext = getContext(file, "Model", "Axis", "MODEL_VIEW");
	if (axisGeomSubcontext == null) {
		const geometricRepresentationContext = addContext(file, { contextType: "Model" });
		axisGeomSubcontext = addContext(file, {
			contextType: "Model",
			contextIdentifier: "Axis",
			targetView: "MODEL_VIEW",
			parent: geometricRepresentationContext,
		});
	}
	return axisGeomSubcontext;
}
