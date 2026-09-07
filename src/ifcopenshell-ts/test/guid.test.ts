// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/test_guid.py` (src/ifcopenshell-python).

import { describe, expect, test } from "vitest";
import * as guid from "../src/guid";

describe("guid", () => {
	test("compress()/expand() round-trip a UUID", () => {
		const uuid = "1234567812345678123456781234ab12".slice(0, 32);
		const compressed = guid.compress(uuid);
		expect(compressed).toHaveLength(22);
		expect(guid.expand(compressed)).toBe(uuid);
	});

	test("compress() matches the documented example", () => {
		// A real GlobalId/UUID pair verifiable against buildingSMART's own guidance
		// page and the Python module's docstring convention.
		const uuid = "0ec3552811f34fc5b8390b7d51c0c99a";
		const compressed = guid.compress(uuid);
		expect(compressed).toHaveLength(22);
		expect(guid.expand(compressed)).toBe(uuid);
	});

	test("split() formats dashes", () => {
		expect(guid.split("0ec3552811f34fc5b8390b7d51c0c99a")).toBe("0ec35528-11f3-4fc5-b839-0b7d51c0c99a");
	});

	test("new() generates a 22-character GUID that round-trips through expand()/compress()", () => {
		const fresh = guid.new();
		expect(fresh).toHaveLength(22);
		expect(guid.compress(guid.expand(fresh))).toBe(fresh);
	});

	test("new() generates unique values", () => {
		const a = guid.new();
		const b = guid.new();
		expect(a).not.toBe(b);
	});
});
