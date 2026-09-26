// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage for `src/api/hooks.ts` -- the pre/post-listener hook system
// ported from `ifcopenshell/api/__init__.py`. No corresponding Python test file exists
// to port from (`ifcopenshell.api`'s listener plumbing is exercised only indirectly, via
// `test/bootstrap.py`'s per-fixture `pre_listeners = {}` / `post_listeners = {}` reset
// and real usecase tests that happen to register listeners -- there is no dedicated
// `test_api_init.py`), so this coverage is written directly against `hooks.ts`'s own
// ported behavior / the real Python source.
//
// This module is pure plumbing with no IFC-specific behavior -- deliberately no
// `IfcFile`/`EntityInstance`/native-addon dependency here. Small synthetic usecases
// (`add`/`throwingUsecase` below) exercise `wrapUsecase` end-to-end instead, matching
// this chunk's own scope (the hook machinery itself, not any real `api.*` usecase).
//
// `removeAllListeners()` runs in `beforeEach`, mirroring `test/bootstrap.py`'s own
// per-test registry reset (`hooks.ts`'s own doc comment on `removeAllListeners`).

import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	addPostListener,
	addPreListener,
	postListeners,
	preListeners,
	removeAllListeners,
	removePostListener,
	removePreListener,
	wrapUsecase,
} from "../../src/api/hooks";

// --- synthetic test usecases (no Python/api counterpart -- see this file's header
// comment) ---

interface FakeFile {
	name: string;
}

interface AddSettings {
	a: number;
	b: number;
}

/** A trivial two-number-adding usecase, standing in for a real `api.*` function. */
function add(_file: FakeFile, settings: AddSettings): number {
	return settings.a + settings.b;
}

/** A usecase that always throws, to exercise the "post-listeners skipped" path. */
function throwingUsecase(_file: FakeFile, _settings: AddSettings): number {
	throw new Error("boom");
}

/** A usecase that throws a `TypeError`, to exercise the "no interception" disclosure. */
function throwingTypeError(_file: FakeFile, _settings: AddSettings): number {
	throw new TypeError("throwingTypeError() got an unexpected keyword argument 'nope'");
}

const file: FakeFile = { name: "fake.ifc" };

beforeEach(() => {
	removeAllListeners();
});

describe("api.hooks wrapUsecase", () => {
	test("calls the wrapped usecase and returns its result", () => {
		const wrapped = wrapUsecase("test.add", add);
		expect(wrapped(file, { a: 2, b: 3 })).toBe(5);
	});

	test("fires a pre-listener registered under the exact usecase path before the call", () => {
		const calls: string[] = [];
		addPreListener<FakeFile, AddSettings>("test.add", "tracker", (usecasePath, ifcFile, settings) => {
			calls.push(`pre:${usecasePath}:${ifcFile.name}:${settings.a}+${settings.b}`);
		});

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 2, b: 3 });

		expect(calls).toEqual(["pre:test.add:fake.ifc:2+3"]);
	});

	test("fires a pre-listener registered under the wildcard '*' path", () => {
		const calls: string[] = [];
		addPreListener<FakeFile, AddSettings>("*", "wildcard-tracker", (usecasePath) => {
			calls.push(usecasePath);
		});

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 });

		expect(calls).toEqual(["test.add"]);
	});

	test("exact-path pre-listeners fire before wildcard pre-listeners", () => {
		const order: string[] = [];
		addPreListener<FakeFile, AddSettings>("test.add", "exact", () => order.push("exact"));
		addPreListener<FakeFile, AddSettings>("*", "wildcard", () => order.push("wildcard"));

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 });

		expect(order).toEqual(["exact", "wildcard"]);
	});

	test("fires a post-listener registered under the exact usecase path after the call", () => {
		const calls: Array<{ usecasePath: string; result: unknown }> = [];
		// Post-listeners receive `settings`, not the result, matching the real Python
		// signature -- verify via a call-order spy instead of trying to observe a return
		// value the callback was never given.
		addPreListener<FakeFile, AddSettings>("test.add", "pre", () =>
			calls.push({ usecasePath: "pre", result: undefined }),
		);
		addPostListener<FakeFile, AddSettings>("test.add", "post", (usecasePath) =>
			calls.push({ usecasePath, result: "post" }),
		);

		const wrapped = wrapUsecase("test.add", add);
		const result = wrapped(file, { a: 4, b: 5 });

		expect(result).toBe(9);
		expect(calls.map((c) => c.result)).toEqual([undefined, "post"]);
	});

	test("fires a post-listener registered under the wildcard '*' path", () => {
		const calls: string[] = [];
		addPostListener<FakeFile, AddSettings>("*", "wildcard-tracker", (usecasePath) => calls.push(usecasePath));

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 });

		expect(calls).toEqual(["test.add"]);
	});

	test("exact-path post-listeners fire before wildcard post-listeners", () => {
		const order: string[] = [];
		addPostListener<FakeFile, AddSettings>("test.add", "exact", () => order.push("exact"));
		addPostListener<FakeFile, AddSettings>("*", "wildcard", () => order.push("wildcard"));

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 });

		expect(order).toEqual(["exact", "wildcard"]);
	});

	test("pre- and post-listeners both run, in the correct relative order, for a normal call", () => {
		const order: string[] = [];
		addPreListener<FakeFile, AddSettings>("test.add", "pre", () => order.push("pre"));
		addPostListener<FakeFile, AddSettings>("test.add", "post", () => order.push("post"));

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 });

		expect(order).toEqual(["pre", "post"]);
	});

	test("post-listeners do NOT fire when the wrapped usecase throws", () => {
		const preCalls: string[] = [];
		const postCalls: string[] = [];
		addPreListener<FakeFile, AddSettings>("test.throw", "pre", () => preCalls.push("pre"));
		addPostListener<FakeFile, AddSettings>("test.throw", "post", () => postCalls.push("post"));

		const wrapped = wrapUsecase("test.throw", throwingUsecase);

		expect(() => wrapped(file, { a: 1, b: 1 })).toThrow("boom");
		expect(preCalls).toEqual(["pre"]);
		expect(postCalls).toEqual([]);
	});

	test("wildcard post-listeners also do NOT fire when the wrapped usecase throws", () => {
		const postCalls: string[] = [];
		addPostListener<FakeFile, AddSettings>("*", "wildcard-post", () => postCalls.push("post"));

		const wrapped = wrapUsecase("test.throw", throwingUsecase);

		expect(() => wrapped(file, { a: 1, b: 1 })).toThrow("boom");
		expect(postCalls).toEqual([]);
	});

	test("shouldRunListeners: false skips both pre- and post-listeners for that one call", () => {
		const preCalls: string[] = [];
		const postCalls: string[] = [];
		addPreListener<FakeFile, AddSettings>("test.add", "pre", () => preCalls.push("pre"));
		addPostListener<FakeFile, AddSettings>("test.add", "post", () => postCalls.push("post"));

		const wrapped = wrapUsecase("test.add", add);
		const result = wrapped(file, { a: 2, b: 2 }, { shouldRunListeners: false });

		expect(result).toBe(4);
		expect(preCalls).toEqual([]);
		expect(postCalls).toEqual([]);
	});

	test("shouldRunListeners: true (explicit) behaves identically to the default", () => {
		const calls: string[] = [];
		addPreListener<FakeFile, AddSettings>("test.add", "pre", () => calls.push("pre"));
		addPostListener<FakeFile, AddSettings>("test.add", "post", () => calls.push("post"));

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 }, { shouldRunListeners: true });

		expect(calls).toEqual(["pre", "post"]);
	});

	test("a listener registered for a different usecase path does not fire", () => {
		const calls: string[] = [];
		addPreListener<FakeFile, AddSettings>("test.other", "tracker", () => calls.push("fired"));

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 });

		expect(calls).toEqual([]);
	});

	test("friendlier-TypeError disclosure: every error, including a signature-mismatch-shaped TypeError, propagates untouched", () => {
		// See hooks.ts's own header comment: the real Python "friendlier TypeError on bad
		// kwargs" step is not reproduced -- wrapUsecase never intercepts or rewrites any
		// error. This pins that "no interception, ever" behavior, including for a
		// TypeError whose message happens to look exactly like Python's own "got an
		// unexpected keyword argument" signature-mismatch shape.
		const wrapped = wrapUsecase("test.typeError", throwingTypeError);

		expect(() => wrapped(file, { a: 1, b: 1 })).toThrow(TypeError);
		expect(() => wrapped(file, { a: 1, b: 1 })).toThrow(
			"throwingTypeError() got an unexpected keyword argument 'nope'",
		);
	});
});

describe("api.hooks addPreListener / addPostListener", () => {
	test("re-registering the same name for the same usecase path overwrites the previous callback", () => {
		// Matches real Python's dict-assignment semantics (`pre_listeners.setdefault(
		// usecase_path, {})[name] = callback`) -- see hooks.ts's header comment on why this
		// is a Map<string, Map<...>>, not a Map<string, Set<...>>: it's already
		// name-keyed and idempotent in real Python, no behavior change needed.
		const first = vi.fn();
		const second = vi.fn();
		addPreListener<FakeFile, AddSettings>("test.add", "tracker", first);
		addPreListener<FakeFile, AddSettings>("test.add", "tracker", second);

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 });

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	test("registrations are visible on the exported preListeners/postListeners registries", () => {
		const callback = vi.fn();
		addPreListener<FakeFile, AddSettings>("test.add", "tracker", callback);
		addPostListener<FakeFile, AddSettings>("test.add", "tracker", callback);

		expect(preListeners.get("test.add")?.get("tracker")).toBe(callback);
		expect(postListeners.get("test.add")?.get("tracker")).toBe(callback);
	});
});

describe("api.hooks removePreListener / removePostListener", () => {
	test("removePreListener actually removes the registration by name", () => {
		const callback = vi.fn();
		addPreListener<FakeFile, AddSettings>("test.add", "tracker", callback);
		removePreListener<FakeFile, AddSettings>("test.add", "tracker", callback);

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 });

		expect(callback).not.toHaveBeenCalled();
		expect(preListeners.get("test.add")?.has("tracker")).toBe(false);
	});

	test("removePostListener actually removes the registration by name", () => {
		const callback = vi.fn();
		addPostListener<FakeFile, AddSettings>("test.add", "tracker", callback);
		removePostListener<FakeFile, AddSettings>("test.add", "tracker", callback);

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 });

		expect(callback).not.toHaveBeenCalled();
		expect(postListeners.get("test.add")?.has("tracker")).toBe(false);
	});

	test("remove is by name only -- the callback argument is accepted but unused, matching real Python", () => {
		const registered = vi.fn();
		const unrelatedCallbackArgument = vi.fn();
		addPreListener<FakeFile, AddSettings>("test.add", "tracker", registered);
		// Passing a completely different function as the `callback` arg still removes the
		// registration, since removal is keyed by `name` alone (hooks.ts's own doc comment
		// on removePreListener/removePostListener).
		removePreListener<FakeFile, AddSettings>("test.add", "tracker", unrelatedCallbackArgument);

		expect(preListeners.get("test.add")?.has("tracker")).toBe(false);
	});

	test("removing a non-existent name is a safe no-op", () => {
		expect(() => removePreListener<FakeFile, AddSettings>("test.add", "does-not-exist", vi.fn())).not.toThrow();
		expect(() => removePostListener<FakeFile, AddSettings>("test.add", "does-not-exist", vi.fn())).not.toThrow();
	});
});

describe("api.hooks removeAllListeners", () => {
	test("clears every registration across every usecase path, both registries", () => {
		addPreListener<FakeFile, AddSettings>("test.add", "a", vi.fn());
		addPreListener<FakeFile, AddSettings>("*", "b", vi.fn());
		addPostListener<FakeFile, AddSettings>("test.add", "c", vi.fn());
		addPostListener<FakeFile, AddSettings>("test.other", "d", vi.fn());

		removeAllListeners();

		expect(preListeners.size).toBe(0);
		expect(postListeners.size).toBe(0);
	});

	test("after removeAllListeners, a previously-wired usecase call fires no listeners", () => {
		const calls: string[] = [];
		addPreListener<FakeFile, AddSettings>("test.add", "pre", () => calls.push("pre"));
		addPostListener<FakeFile, AddSettings>("test.add", "post", () => calls.push("post"));

		removeAllListeners();

		const wrapped = wrapUsecase("test.add", add);
		wrapped(file, { a: 1, b: 1 });

		expect(calls).toEqual([]);
	});
});
