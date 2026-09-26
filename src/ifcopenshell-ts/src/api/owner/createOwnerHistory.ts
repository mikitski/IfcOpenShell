// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/create_owner_history.py` (src/ifcopenshell-python,
// 117 lines) -- creates a new `IfcOwnerHistory` recording that an element was added.
// Used internally by `api/root/createEntity.ts` for every rooted entity it creates,
// matching real Python's `root.create_entity` -> `owner.create_owner_history` call.
//
// Returns `null` (not IFC2X3) if either `ownerSettings.getUser`/`.getApplication`
// (`./settings.ts`) is missing -- owner tracking is optional on IFC4+, mandatory on
// IFC2X3 (where the default `getUser`/`getApplication` throw instead of returning
// falsy, so this early-return path is IFC4+-only in practice with the box defaults;
// a caller-supplied `ownerSettings` override could still return falsy on IFC2X3, in
// which case this still returns `null` rather than creating a partially-owned
// `IfcOwnerHistory`, matching the real Python source's own unconditional `if
// file.schema != "IFC2X3" and not user: return` guard).
//
// `IfcOwnerHistory`'s 8 attributes are created positionally
// (`OwningUser`/`OwningApplication`/`State`/`ChangeAction`/`LastModifiedDate`/
// `LastModifyingUser`/`LastModifyingApplication`/`CreationDate`, confirmed against
// `src/generated/ifc4.d.ts`'s/`ifc2x3.d.ts`'s/`ifc4x3.d.ts`'s identical attribute order
// for this class in all 3 schemas) rather than via separate `.set()` calls after
// creation -- this project's established convention for synthesizing a whole entity's
// initial state in one atomic `IfcFile.createEntity(type, ...args)` call so the
// `Transaction` records one "create" operation, not N "create" + N "edit" operations
// (see `util/migrator.ts`'s `generateDefaultValue`'s own `IfcOwnerHistory` positional
// construction, the established precedent for this exact pattern, referenced in
// `planning/ifcopenshell-ts/PROGRESS.md`'s `util.schema` chunk 2 entry).
//
// Wrapped through `wrapUsecase` (`../hooks.ts`) under `"owner.create_owner_history"` --
// real Python's `wrap_usecases` reflection step wraps this function too (it's a
// same-named function in its own `create_owner_history.py` module, exactly the shape
// `wrap_usecases` looks for), not just `root.create_entity`. `createEntity.ts` calls
// this wrapped export directly (with default `shouldRunListeners: true`, matching
// Python's own un-suppressed internal call), so listener side effects nest exactly as
// they would in real Python.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { ownerSettings } from "./settings";

/** Python: `create_owner_history(file)` takes no settings kwargs -- kept for symmetry with every other `wrapUsecase` call site. */
// biome-ignore lint/complexity/noBannedTypes: an intentionally-empty settings object, matching this project's "every wrapped usecase takes (file, settings)" convention even where Python's own signature has no settings kwargs.
export type CreateOwnerHistorySettings = {};

function createOwnerHistoryUsecase(file: IfcFile, _settings: CreateOwnerHistorySettings = {}): EntityInstance | null {
	const user = ownerSettings.getUser(file);
	if (file.schema !== "IFC2X3" && !user) {
		return null;
	}
	const application = ownerSettings.getApplication(file);
	if (file.schema !== "IFC2X3" && !application) {
		return null;
	}
	const now = Math.floor(Date.now() / 1000);
	return file.createEntity("IfcOwnerHistory", user, application, "READWRITE", "ADDED", now, user, application, now);
}

/**
 * Creates a new owner history indicating an element was added (Python:
 * `ifcopenshell.api.owner.create_owner_history`). Low-level -- not usually called
 * directly; `api.root.createEntity` already calls this for you. See
 * `./settings.ts`'s `ownerSettings` for how to configure the "active user"/"active
 * application" this reads from.
 */
export const createOwnerHistory = wrapUsecase("owner.create_owner_history", createOwnerHistoryUsecase);
