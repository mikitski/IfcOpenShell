// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/remove_application.py` (src/ifcopenshell-python, 34
// lines) -- the simplest function in this whole chunk: an unconditional `file.remove
// (application)`, no cascade of any kind. Real Python's own docstring is an explicit
// warning, not a guard: "removing an application may invalidate ownership histories.
// Check whether or not the application is used anywhere prior to removal." -- this
// function does NOT check `IfcOwnerHistory.OwningApplication`/`LastModifyingApplication`
// usage itself; ported verbatim, not "fixed" to add a safety check real Python doesn't
// have either.
//
// Real Python's own docstring also has a genuine, harmless copy-paste mistake: its
// `:param:` line is named `address` (`:param address: The IfcApplication to remove.`)
// and its example calls `ifcopenshell.api.owner.remove_address(model,
// application=application)` -- both clearly meant to say `application`/`remove_application`
// (this file's own function is `remove_application`, and `remove_address` takes an
// `address` kwarg, not `application`, so that example as literally written would raise a
// `TypeError` if run). Purely a docstring/comment-level slip with zero effect on this
// function's actual behavior -- not reproduced in this port's own doc comment below
// (this project's convention only ports a Python source's cosmetic mistakes when they
// have some possible ambiguity worth flagging; a plainly-broken example in a docstring
// isn't code this port needs to match at all).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface RemoveApplicationSettings {
	/** The `IfcApplication` to remove. */
	application: EntityInstance;
}

function removeApplicationUsecase(file: IfcFile, settings: RemoveApplicationSettings): void {
	file.remove(settings.application);
}

/**
 * Removes an application (Python: `ifcopenshell.api.owner.remove_application`).
 *
 * Warning: removing an application may invalidate ownership histories. Check whether
 * or not the application is used anywhere prior to removal.
 *
 * @example
 * ```ts
 * const application = api.owner.addApplication(model, {});
 * api.owner.removeApplication(model, { application });
 * ```
 */
export const removeApplication = wrapUsecase("owner.remove_application", removeApplicationUsecase);
