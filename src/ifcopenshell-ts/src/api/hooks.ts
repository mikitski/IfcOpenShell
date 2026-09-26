// This file was generated with the assistance of an AI coding tool.
//
// Port of the pre/post-listener hook system from `ifcopenshell/api/__init__.py`
// (src/ifcopenshell-python, 314 lines total) -- the first Phase 6 (`api`) chunk,
// per planning/ifcopenshell-ts/20-roadmap.md's Phase 6 "cross-cutting, do early in
// this phase" call-out: every subsequent `api.*` usecase should be wrapped through
// this from the start, rather than retrofitted.
//
// Ported: `pre_listeners`/`post_listeners` (the two module-level registries),
// `add_pre_listener`/`add_post_listener`/`remove_pre_listener`/`remove_post_listener`/
// `remove_all_listeners`, and `wrap_usecase` (lines ~256-299 of the real source) -- the
// per-call wrapper that runs pre-listeners (exact `usecase_path` + wildcard `"*"`),
// calls the real function, and runs post-listeners (same exact+wildcard pattern) only
// if the call didn't raise.
//
// Two architectural decisions locked in for this project before this chunk started
// (see 00-overview.md SS2 / 20-roadmap.md Phase 6 -- not re-litigated here):
//   1. Dispatch is typed function calls only -- no string-dispatch `run()` shim. So
//      NOT ported: `run()`, `CACHED_USECASE_CLASSES`/`CACHED_USECASES`,
//      `ARGUMENTS_DEPRECATION`/`batching_argument_deprecation`/
//      `renamed_arguments_deprecation` (confirmed empty/unused against the real
//      source -- `ARGUMENTS_DEPRECATION = {}` with zero real call sites), `extract_docs`
//      (a Bonsai node-graph-UI introspection helper the research doc itself flags as
//      already stale against the plain-function refactor -- it still assumes the old
//      `Usecase.__init__`/`Usecase.execute` class shape). Also NOT ported:
//      `serialise_settings` (a downstream Bonsai-undo-system settings serializer, not
//      part of `ifcopenshell.api` functioning on its own) and the `owner.settings`
//      monkeypatch hook (`ifcopenshell.api.owner.settings.get_user`/`get_application`
//      reassignment -- a separate, `api.owner`-specific mechanism, to be handled
//      whenever `api.owner` itself is ported).
//   2. `wrap_usecases(path, name)` (lines ~302-314) -- the reflection-based
//      `pkgutil.iter_modules` + `getattr`/`setattr`-on-a-live-module-object plumbing
//      that auto-wraps every function in a Python submodule -- has no clean TS
//      equivalent and is NOT ported. Instead, each future `api/<module>/<function>.ts`
//      file calls `wrapUsecase` directly and explicitly at its own export site, e.g.
//      `export const createEntity = wrapUsecase("root.create_entity", (file,
//      settings) => {...})` -- a hand-written call site per function, matching this
//      project's "explicit over magic" style. `wrapUsecases` itself is not ported.
//
// --- Design notes on the two genuinely TS-specific decisions ---
//
// (a) `should_run_listeners` (Python: a kwarg on every wrapped call, default `True`,
// to skip listeners for one specific call -- real usage confirmed by grep: exactly one
// call site in the whole Python codebase, `api/project/append_asset.py`, passing
// `should_run_listeners=False` to suppress listener re-entrancy on a usecase called
// from inside another usecase; also reset via `ifcopenshell.api.pre_listeners = {}` /
// `post_listeners = {}` per-test in `test/bootstrap.py`, not via this kwarg). Since
// future TS usecases take a real `settings: TSettings` object rather than `**kwargs`,
// folding `shouldRunListeners` into that object would pollute every usecase's own
// settings type with a cross-cutting concern unrelated to its actual arguments. Instead
// it's threaded through as a third, wrapper-level parameter:
// `wrapped(file, settings, options?: { shouldRunListeners?: boolean })` -- matching the
// roadmap's own "wrapper-level parameter" framing, keeping each usecase's `TSettings`
// type free of plumbing concerns.
//
// (b) The "friendlier TypeError on bad kwargs" step (real Python: re-raises a more
// actionable error only when `e.args[0].startswith(f"{usecase.__name__}()")`, i.e. only
// when the `TypeError` is Python's own "got an unexpected keyword argument" signature-
// mismatch shape, not an error raised from inside the function body). This is
// deliberately NOT reproduced at runtime -- disclosed, not silently dropped:
// JS/TS simply doesn't produce an equivalent runtime error for a plain function call
// with an excess/missing property on an object-literal argument the way Python's
// `**kwargs`-binding machinery does for a bad keyword argument. A call like
// `createEntity(file, wrongShapeSettings)` in JS either passes extra properties through
// silently (structural typing, no runtime shape check) or leaves missing ones
// `undefined` -- there is no distinguishable "signature mismatch" `TypeError` class to
// catch and pattern-match on the way `e.args[0].startswith(...)` does. Trying to
// reproduce this would mean adding a runtime shape-checking layer on every settings
// object, which (1) TS's own compile-time argument checking already covers for any
// caller using real types -- exactly the class of error this Python code exists to
// soften -- and (2) directly contradicts this project's own "typed calls only" Phase 6
// decision, which chose compile-time safety over a runtime dispatch/validation layer.
// So `wrapUsecase` here does no TypeError interception at all: every error, `TypeError`
// included, propagates untouched from the wrapped call, exactly matching the "errors
// raised inside the function body are left alone" half of the real Python behavior
// (there is no other half left to reproduce). See `hooks.test.ts` for a regression test
// pinning this "no interception, ever" behavior.
//
// --- One further, disclosed deviation from the roadmap doc's own framing ---
//
// `20-roadmap.md`'s Phase 6 section describes the registries as mirroring "Python's
// dict-of-list shape" and recommends `Map<string, Set<Listener>>`, calling the
// resulting allow-duplicates-vs-idempotent difference "a minor behavior change." Read
// directly, the real Python source is NOT dict-of-list: `pre_listeners`/`post_listeners`
// are `dict[str, dict]` -- `{usecase_path: {name: callback}}`, a dict of dicts keyed by
// listener `name` (confirmed both by the source itself, `pre_listeners.setdefault(
// usecase_path, {})[name] = callback`, and independently by `research/
// 02-python-api-inventory.md` SS1.4's own "plain module-level dicts: `{usecase_path:
// {name: callback}}`" description). Re-registering the same `name` already just
// overwrites in real Python -- there is no allow-duplicates behavior to begin with, and
// no behavior change is needed to make it idempotent. This port uses
// `Map<string, Map<string, UsecaseListener>>` (usecase path -> listener name ->
// callback), the actually-faithful structural mirror of the real dict-of-dicts shape,
// not `Map<string, Set<...>>`.

/**
 * A pre/post-listener callback, matching Python's `Callable[[str, ifcopenshell.file,
 * dict], None]` signature: `(usecasePath, ifcFile, settings) -> void`.
 *
 * Generic over the file and settings types so every future `api.*` module can register
 * type-safe listeners for its own usecases without `any`. The two module-level
 * registries below necessarily erase this to `UsecaseListener` (`unknown`/
 * `Record<string, unknown>`) internally -- a single registry shared across every
 * usecase in the whole `api` surface cannot statically know each entry's concrete
 * types, exactly as Python's own untyped `dict[str, dict]` doesn't either. Call sites
 * (`addPreListener`/`addPostListener`/`wrapUsecase`) stay generic and type-checked;
 * only the shared-storage boundary is erased.
 */
export type UsecaseListener<TFile = unknown, TSettings = Record<string, unknown>> = (
	usecasePath: string,
	ifcFile: TFile,
	settings: TSettings,
) => void;

/** Options accepted by every function wrapped with {@link wrapUsecase}. */
export interface UsecaseCallOptions {
	/**
	 * Python: the `should_run_listeners` kwarg (default `true`). Set to `false` to skip
	 * both pre- and post-listeners for this one call -- e.g. a usecase invoking another
	 * usecase internally and not wanting to double-fire listeners (real Python's only
	 * actual call site for this, `api/project/append_asset.py`).
	 */
	shouldRunListeners?: boolean;
}

// The wildcard usecase-path key: a listener registered under `"*"` fires for every
// usecase, in addition to (after) any listeners registered for the exact path.
const WILDCARD_USECASE_PATH = "*";

/**
 * Python: `pre_listeners: dict[str, dict] = {}`.
 *
 * `usecasePath -> listenerName -> callback`. See this file's header comment for why
 * this is `Map<string, Map<string, UsecaseListener>>` rather than the roadmap doc's
 * suggested `Map<string, Set<Listener>>` -- the real Python structure is already a
 * dict keyed by listener name, not a list.
 */
export const preListeners = new Map<string, Map<string, UsecaseListener>>();

/** Python: `post_listeners: dict[str, dict] = {}`. See {@link preListeners}. */
export const postListeners = new Map<string, Map<string, UsecaseListener>>();

function addListener<TFile, TSettings>(
	registry: Map<string, Map<string, UsecaseListener>>,
	usecasePath: string,
	name: string,
	callback: UsecaseListener<TFile, TSettings>,
): void {
	let byName = registry.get(usecasePath);
	if (!byName) {
		byName = new Map();
		registry.set(usecasePath, byName);
	}
	byName.set(name, callback as UsecaseListener);
}

function removeListener(registry: Map<string, Map<string, UsecaseListener>>, usecasePath: string, name: string): void {
	registry.get(usecasePath)?.delete(name);
}

/**
 * Python: `add_pre_listener(usecase_path: str, name: str, callback) -> None`.
 *
 * Registers `callback` to run before `usecasePath` is invoked (see {@link wrapUsecase}).
 * `usecasePath` may be the wildcard `"*"` to run for every usecase. Re-registering the
 * same `name` for the same `usecasePath` overwrites the previous callback (matching
 * Python's dict-assignment semantics -- see this file's header comment).
 */
export function addPreListener<TFile, TSettings>(
	usecasePath: string,
	name: string,
	callback: UsecaseListener<TFile, TSettings>,
): void {
	addListener(preListeners, usecasePath, name, callback);
}

/** Python: `add_post_listener(usecase_path: str, name: str, callback) -> None`. See {@link addPreListener}. */
export function addPostListener<TFile, TSettings>(
	usecasePath: string,
	name: string,
	callback: UsecaseListener<TFile, TSettings>,
): void {
	addListener(postListeners, usecasePath, name, callback);
}

/**
 * Python: `remove_pre_listener(usecase_path: str, name: str, callback) -> None`.
 *
 * Removes the pre-listener registered under `name` for `usecasePath`, if any. `callback`
 * is accepted (matching the real Python signature) but unused -- real Python's own
 * implementation removes by `name` alone (`pre_listeners.get(usecase_path,
 * {}).pop(name, None)`), never actually consulting its `callback` parameter either.
 */
export function removePreListener<TFile, TSettings>(
	usecasePath: string,
	name: string,
	_callback: UsecaseListener<TFile, TSettings>,
): void {
	removeListener(preListeners, usecasePath, name);
}

/** Python: `remove_post_listener(usecase_path: str, name: str, callback) -> None`. See {@link removePreListener}. */
export function removePostListener<TFile, TSettings>(
	usecasePath: string,
	name: string,
	_callback: UsecaseListener<TFile, TSettings>,
): void {
	removeListener(postListeners, usecasePath, name);
}

/**
 * Python: `remove_all_listeners() -> None`.
 *
 * Clears both registries entirely. Matches `test/bootstrap.py`'s real per-test-fixture
 * reset pattern (`ifcopenshell.api.pre_listeners = {}` / `post_listeners = {}`), which
 * this project's own `beforeEach`/`afterEach` test hygiene should call between tests
 * that register listeners (see `hooks.test.ts`).
 */
export function removeAllListeners(): void {
	preListeners.clear();
	postListeners.clear();
}

function runListeners<TFile, TSettings>(
	registry: Map<string, Map<string, UsecaseListener>>,
	usecasePath: string,
	ifcFile: TFile,
	settings: TSettings,
): void {
	// Cast at the shared-registry boundary (see UsecaseListener's own doc comment):
	// the registry stores type-erased listeners since it's shared across every usecase
	// in the whole `api` surface, but this function's own generics keep its caller
	// (wrapUsecase) type-safe.
	const typedCallback = (callback: UsecaseListener) =>
		callback(usecasePath, ifcFile, settings as Record<string, unknown>);

	// Exact-path listeners run before wildcard listeners, matching Python's
	// `listeners = list(pre_listeners.get(usecase_path, {}).values()); listeners +=
	// pre_listeners.get("*", {}).values()` ordering.
	for (const callback of registry.get(usecasePath)?.values() ?? []) {
		typedCallback(callback);
	}
	if (usecasePath !== WILDCARD_USECASE_PATH) {
		for (const callback of registry.get(WILDCARD_USECASE_PATH)?.values() ?? []) {
			typedCallback(callback);
		}
	}
}

/**
 * Python: `wrap_usecase(usecase_path, usecase)` (lines ~256-299).
 *
 * Wraps a plain usecase function `(file, settings) => result` so every call runs
 * registered pre-listeners, then the real function, then (only if it didn't throw)
 * registered post-listeners. Each future `api/<module>/<function>.ts` file calls this
 * directly at its own export site -- e.g.
 * `export const createEntity = wrapUsecase("root.create_entity", (file, settings) =>
 * {...})` -- there is no Python-style reflection-based auto-wrapping (`wrap_usecases`
 * itself is not ported; see this file's header comment).
 *
 * `TFile` is deliberately a free type parameter, not hard-coded to `IfcFile`: real
 * Python's own wrapper treats "ifc_file" as simply "the wrapped function's first
 * argument" (`ifc_file = args[0] if args else None`) with no actual check that it's a
 * file at all -- e.g. `ifcopenshell.api.project.create_file(version="IFC4")` takes no
 * file argument, so Python's own listeners would see the `version` string in the
 * `ifc_file` slot for that usecase. This port preserves that same faithful "first
 * parameter, whatever it is" behavior rather than silently correcting it, and stays
 * generic so both file-taking and non-file-taking future usecases can use it.
 *
 * Not ported: the deprecated-argument-remapping step (`ARGUMENTS_DEPRECATION`, real
 * Python confirmed empty with no call sites -- see this file's header comment) and the
 * "friendlier TypeError" step (see this file's header comment for the disclosed
 * TS-equivalent decision -- every error, `TypeError` included, propagates untouched).
 * Also not ported: copying `__signature__`/`__doc__`/`__name__` from the wrapped
 * function onto the wrapper (real Python does this so `help()`/`inspect.signature()`
 * still work transparently) -- TS/JS has no equivalent runtime introspection need here
 * (IDE signature help and docs come from the wrapper's own compile-time type signature
 * and doc comment, not a runtime-inspectable `.__doc__`), and `Function.prototype.name`
 * would need `Object.defineProperty` to override, which buys nothing a caller can
 * actually use since JS doesn't have `inspect.signature()`'s runtime equivalent.
 */
export function wrapUsecase<TFile, TSettings, TResult>(
	usecasePath: string,
	usecase: (file: TFile, settings: TSettings) => TResult,
): (file: TFile, settings: TSettings, options?: UsecaseCallOptions) => TResult {
	return function wrappedUsecase(file: TFile, settings: TSettings, options?: UsecaseCallOptions): TResult {
		const shouldRunListeners = options?.shouldRunListeners ?? true;

		if (shouldRunListeners) {
			runListeners(preListeners, usecasePath, file, settings);
		}

		const result = usecase(file, settings);

		// Only reached if `usecase(...)` above didn't throw -- matching Python's own
		// "post-listeners run only if the call didn't raise" behavior, which in the real
		// source is likewise just a consequence of normal control flow (the post-listener
		// loop is the next statement after the call, not wrapped in a `finally`), not an
		// explicit try/catch. No `try`/`catch` is needed here for the same reason.
		if (shouldRunListeners) {
			runListeners(postListeners, usecasePath, file, settings);
		}

		return result;
	};
}
