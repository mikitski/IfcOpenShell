// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/update_owner_history.py` (src/ifcopenshell-python, 80
// lines) -- not part of this project's `api.owner` chunk's originally-scoped
// `create_owner_history`/`settings` pair (see `index.ts`'s header comment for that
// chunk's own stated scope), but added here as a small, necessary dependency of
// `api.spatial`: all 4 `api.spatial` functions call `ifcopenshell.api.owner.
// update_owner_history` on every relationship they mutate, to keep `IfcOwnerHistory`
// up to date. Not porting it would mean either reinventing its logic inline inside
// `api/spatial/*.ts` (duplicating a real, independently-testable `api.owner` function)
// or silently dropping ownership tracking from every mutating `api.spatial` call --
// this project's established "reuse the real ported exports, don't reinvent" rule
// (see `createEntity.ts`'s own header comment) applies here just as it would to any
// other cross-module dependency.
//
// Updates the `IfcOwnerHistory` attached to `element` (element index 1 for any
// `IfcRoot` subtype -- same "GlobalId=0/OwnerHistory=1, confirmed against the
// generated `.d.ts`s for all 3 schemas" fact `createEntity.ts` already established) to
// record that it was just modified: `ChangeAction="MODIFIED"`, `LastModifiedDate=now`,
// `LastModifyingUser`/`LastModifyingApplication` from the currently-configured
// `ownerSettings`. If `element` has no `OwnerHistory` yet, one is created (delegating to
// `createOwnerHistory`, unwrapped -- see below). If the existing `OwnerHistory` is
// shared by more than one element (`file.getTotalInverses(ownerHistory) > 1`), it is
// first `copy`-ed (`util/element.ts`) so this element gets its own, independently
// mutable `IfcOwnerHistory` rather than silently mutating a history record other
// elements still reference -- ported verbatim from the real Python source's identical
// copy-on-write guard.
//
// Two early-return guards, ported verbatim: (1) non-`IfcRoot` elements are a no-op
// (`return` with no value in Python -- `undefined` here); (2) if `ownerSettings.getUser`/
// `.getApplication` return falsy (owner tracking not configured -- the IFC4+ default),
// this is also a no-op, matching `createOwnerHistory`'s own "no owner tracking
// configured" early-return shape.
//
// `createOwnerHistory` is called here through its normal `wrapUsecase`-wrapped export
// with default options (listeners run), matching real Python exactly: `update_owner_
// history` calls `ifcopenshell.api.owner.create_owner_history(file)` as a plain,
// unsuppressed nested usecase call (no `should_run_listeners=False`) -- confirmed by
// reading the real source, which passes no such kwarg here (unlike the one genuine
// `should_run_listeners=False` call site in the whole Python codebase,
// `api/project/append_asset.py`, per `hooks.ts`'s own header comment). So
// `owner.create_owner_history`'s pre/post-listeners do fire when invoked via this
// nested call, exactly as they would nested inside `root.create_entity` (which also
// calls `create_owner_history` unsuppressed).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { copy } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "./createOwnerHistory";
import { ownerSettings } from "./settings";

// `IfcRoot`'s `OwnerHistory` attribute index -- see this file's header comment.
const OWNER_HISTORY_INDEX = 1;
// `IfcOwnerHistory`'s attribute indices for the four fields updated here (`State` at
// index 2 is intentionally left untouched, matching the real Python source, which
// updates ChangeAction/LastModifiedDate/LastModifyingUser/LastModifyingApplication but
// never touches State on an update -- only on initial creation).
const CHANGE_ACTION_INDEX = 3;
const LAST_MODIFIED_DATE_INDEX = 4;
const LAST_MODIFYING_USER_INDEX = 5;
const LAST_MODIFYING_APPLICATION_INDEX = 6;

export interface UpdateOwnerHistorySettings {
	/** The `IfcRoot` element to update the ownership details on. */
	element: EntityInstance;
}

function updateOwnerHistoryUsecase(
	file: IfcFile,
	settings: UpdateOwnerHistorySettings,
): EntityInstance | null | undefined {
	const { element } = settings;
	if (!element.isA("IfcRoot")) {
		return undefined;
	}
	const user = ownerSettings.getUser(file);
	if (!user) {
		return undefined;
	}
	const application = ownerSettings.getApplication(file);
	if (!application) {
		return undefined;
	}

	let ownerHistory = element.getByIndex(OWNER_HISTORY_INDEX) as EntityInstance | null;
	if (!ownerHistory) {
		ownerHistory = createOwnerHistory(file, {});
		element.setByIndex(OWNER_HISTORY_INDEX, ownerHistory);
		return ownerHistory;
	}

	if (file.getTotalInverses(ownerHistory) > 1) {
		ownerHistory = copy(file, ownerHistory);
		element.setByIndex(OWNER_HISTORY_INDEX, ownerHistory);
	}

	ownerHistory.setByIndex(CHANGE_ACTION_INDEX, "MODIFIED");
	ownerHistory.setByIndex(LAST_MODIFIED_DATE_INDEX, Math.floor(Date.now() / 1000));
	ownerHistory.setByIndex(LAST_MODIFYING_USER_INDEX, user);
	ownerHistory.setByIndex(LAST_MODIFYING_APPLICATION_INDEX, application);
	return ownerHistory;
}

/**
 * Updates the owner that is assigned to an object (Python:
 * `ifcopenshell.api.owner.update_owner_history`).
 *
 * This ensures that the owner is tracked to have modified the object last, including
 * the time when the change occurred. This is called automatically by mutating
 * `api.*` usecases (e.g. every `api.spatial` function) on every `IfcRoot` element they
 * change -- not usually called directly by end users.
 */
export const updateOwnerHistory = wrapUsecase("owner.update_owner_history", updateOwnerHistoryUsecase);
