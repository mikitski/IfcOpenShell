// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/edit_sequence.py` (src/ifcopenshell-python, 66
// lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Attribute-setter loop over `attributes`, then cascades the
// schedule from `rel_sequence.RelatedProcess` IF `SequenceType` was one of the edited
// attributes.
//
// `./cascadeSchedule.ts` (this chunk, ported first) is the only real dependency --
// confirmed by reading the whole real file.
//
// --- `"SequenceType" in attributes.keys()` -- keyed on PRESENCE, not on whether the
//     value actually changed ---
//
// Real Python cascades whenever the caller's `attributes` dict happens to include a
// `"SequenceType"` key at all, even if the new value is identical to the old one (or
// even `None`/falsy) -- ported verbatim as `"SequenceType" in Object.keys(attributes)`
// (equivalently, `Object.hasOwn`), not narrowed to "only if the value actually differs".

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { cascadeSchedule } from "./cascadeSchedule";

export interface EditSequenceSettings {
	/** The `IfcRelSequence` entity you want to edit. */
	relSequence: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editSequenceUsecase(file: IfcFile, settings: EditSequenceSettings): void {
	const { relSequence } = settings;
	for (const [name, value] of Object.entries(settings.attributes)) {
		relSequence.set(name, value);
	}
	if (Object.hasOwn(settings.attributes, "SequenceType")) {
		cascadeSchedule(file, {
			task: relSequence.get("RelatedProcess") as EntityInstance,
		});
	}
}

/**
 * Edits the attributes of an `IfcRelSequence` (Python:
 * `ifcopenshell.api.sequence.edit_sequence`).
 *
 * For more information about the attributes and data types of an `IfcRelSequence`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const sequence = api.sequence.assignSequence(model, { relatingProcess: zone1, relatedProcess: zone2 });
 * // What if they both started at the same time?
 * api.sequence.editSequence(model, { relSequence: sequence, attributes: { SequenceType: "START_START" } });
 * ```
 */
export const editSequence = wrapUsecase("sequence.edit_sequence", editSequenceUsecase);
