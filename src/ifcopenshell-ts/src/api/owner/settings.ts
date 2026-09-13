// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/settings.py` (src/ifcopenshell-python, 103 lines) --
// the `owner.settings` monkeypatch hook (research/02-python-api-inventory.md SS1.6):
// two overridable functions, `get_user(ifc)`/`get_application(ifc)`, consulted by
// `createOwnerHistory.ts` to populate `IfcOwnerHistory.OwningUser`/`OwningApplication`
// on every created/edited rooted entity. Real Python's documented usage pattern is
// literally reassigning the module attribute (`ifcopenshell.api.owner.settings.get_user
// = lambda ifc: my_person_and_org`, see `test/bootstrap.py`) -- not available in TS/ESM
// (`export function` bindings aren't reassignable from outside their own module).
//
// TS-idiomatic replacement, per this project's own decided design
// (planning/ifcopenshell-ts/30-open-questions.md item 9 / 40-testing-strategy.md SS5,
// settled ahead of this chunk, not re-litigated here): **a mutable singleton config
// object** -- `ownerSettings.getUser = (file) => ...` -- swappable per-test the same
// way `bootstrap.py` does today, established as the general pattern for every Python
// global-mutable-config module this project ports (`settings.ts`'s own two booleans,
// `unpackNonAggregateInverses`/`compareInstancesByValue`, already use this exact
// shape -- this file follows that precedent, just with function-valued fields instead
// of booleans).
//
// `factoryReset()`/`restore()` are ported with the same real backup/restore semantics
// as the Python source: `factoryReset()` saves whatever is *currently* assigned (which
// may itself be a prior monkeypatch) into a `*Backup` slot, then resets the live field
// to the true out-of-the-box default (`*Factory`, captured once at module-load time and
// never reassigned); `restore()` undoes exactly that, putting the pre-`factoryReset()`
// value back. This is a real behavior, not just a "reset to default" -- see
// `test_create_owner_history.py`'s own `factory_reset()`/`restore()` pair, ported
// faithfully in `createOwnerHistory.test.ts`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";

export type GetUser = (file: IfcFile) => EntityInstance | null;
export type GetApplication = (file: IfcFile) => EntityInstance | null;

/**
 * Python: `get_application(ifc) -> Union[entity_instance, None]`.
 *
 * Returns the first `IfcApplication` in the file, or `null` if there is none --
 * except on IFC2X3, where owner tracking is mandatory and the real Python source
 * raises instead (`ifc.by_type("IfcApplication")` empty AND `ifc.schema ==
 * "IFC2X3"`).
 */
function defaultGetApplication(file: IfcFile): EntityInstance | null {
	const application = file.byType("IfcApplication")[0] ?? null;
	if (!application && file.schema === "IFC2X3") {
		throw new Error(
			"Please create an application to continue. See the owner.create_owner_history docs for more info." +
				"https://docs.ifcopenshell.org/autoapi/ifcopenshell/api/owner/create_owner_history/index.html",
		);
	}
	return application;
}

/**
 * Python: `get_user(ifc) -> Union[entity_instance, None]`.
 *
 * Returns the first `IfcPersonAndOrganization` in the file, or `null` if there is
 * none -- except on IFC2X3, where the real Python source raises instead (same
 * mandatory-owner-tracking reasoning as {@link defaultGetApplication}).
 */
function defaultGetUser(file: IfcFile): EntityInstance | null {
	const user = file.byType("IfcPersonAndOrganization")[0] ?? null;
	if (!user && file.schema === "IFC2X3") {
		throw new Error(
			"Please create a user to continue. See the owner.create_owner_history docs for more info." +
				"https://docs.ifcopenshell.org/autoapi/ifcopenshell/api/owner/create_owner_history/index.html",
		);
	}
	return user;
}

// Python: `get_application_factory = get_application` / `get_application_backup =
// get_application` / `get_user_factory = get_user` / `get_user_backup = get_user`
// (module-load-time snapshots of the box-default functions). `*Factory` is never
// reassigned after this; `*Backup` is only ever written by `factoryReset()` below.
const getApplicationFactory: GetApplication = defaultGetApplication;
let getApplicationBackup: GetApplication = defaultGetApplication;
const getUserFactory: GetUser = defaultGetUser;
let getUserBackup: GetUser = defaultGetUser;

export const ownerSettings = {
	/** Currently-active `get_user` -- overridable directly, e.g. `ownerSettings.getUser = (file) => myUser;`. */
	getUser: defaultGetUser as GetUser,

	/** Currently-active `get_application` -- overridable directly, e.g. `ownerSettings.getApplication = (file) => myApp;`. */
	getApplication: defaultGetApplication as GetApplication,

	/**
	 * Python: `factory_reset()`.
	 *
	 * Resets `getUser`/`getApplication` to what came out of the box, first saving
	 * whatever was currently assigned (possibly itself already overridden) so
	 * {@link restore} can undo this reset.
	 */
	factoryReset(): void {
		getApplicationBackup = ownerSettings.getApplication;
		ownerSettings.getApplication = getApplicationFactory;
		getUserBackup = ownerSettings.getUser;
		ownerSettings.getUser = getUserFactory;
	},

	/**
	 * Python: `restore()`.
	 *
	 * Restores `getUser`/`getApplication` to whatever they were immediately before
	 * the most recent {@link factoryReset} call.
	 */
	restore(): void {
		ownerSettings.getApplication = getApplicationBackup;
		ownerSettings.getUser = getUserBackup;
	},
};
