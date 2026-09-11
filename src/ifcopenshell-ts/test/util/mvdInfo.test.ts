// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/test_mvd_info.py` (src/ifcopenshell-python), covering
// `util/mvdInfo.ts`. Ports every case from `test_mvd_info.py` that doesn't depend on
// `LARK_AVAILABLE=False` (that conditional-availability fallback is explicitly out of
// scope -- see `util/mvdInfo.ts`'s own header comment), using a `MockHeader`-style
// plain object satisfying `MvdHeader` in place of Python's fixture files (since this
// port has no `ifcopenshell.open()`/`IfcFile.header()` wiring yet -- also disclosed in
// that file's header comment) -- the fixture `.ifc` files' own `FILE_DESCRIPTION`
// strings are reused verbatim as literal input below, so the actual parsed content
// matches the Python fixtures exactly, only the "load from a real file" plumbing
// differs.
//
// Also covers this chunk's own empirical findings (see `util/mvdInfo.ts`'s header
// comment for the full investigation, run against a real `lark` install located on
// this machine): the leading-space-absorption quirk, the whitespace-normalization
// asymmetry between `Option`/`ExchangeRequirement` and dynamic keywords, the
// "kv-success `Option` doesn't add to `keywords`" bug, and the "dynamic keyword with
// no `key: value` structure crashes on access" bug -- all preserved verbatim, not
// fixed, per this project's established convention.
//
// No `IfcFile`/native/schema dependency anywhere in `mvdInfo.ts` (confirmed by reading
// it -- pure string parsing plus a structural `MvdHeader` interface), so this file
// needs no `AVAILABLE_SCHEMAS` schema-gating, matching `util/file.ts`'s own test file
// for the same reason.

import { describe, expect, test } from "vitest";
import { type MvdHeader, MvdInfo, parseMvd } from "../../src/util/mvdInfo";

function makeHeader(description: readonly string[]): MvdHeader {
	return { file_description: { description: [...description] } };
}

describe("ViewDefinition", () => {
	// Python: TestViewDefinition.test_single_view (passing_header.ifc).
	test("single view", () => {
		const header = makeHeader(["ViewDefinition [Alignment-basedView]"]);
		const mvd = new MvdInfo(header);
		expect(mvd.viewDefinitions).toEqual(["Alignment-basedView"]);
	});

	// Python: TestViewDefinition.test_multiple_views (two_views.ifc).
	test("multiple views across two description entries", () => {
		const header = makeHeader(["ViewDefinition [CoordinationView_V2.0]", "ViewDefinition[SpaceBoundaryAddonView]"]);
		const mvd = new MvdInfo(header);
		expect(mvd.viewDefinitions).toEqual(["CoordinationView_V2.0", "SpaceBoundaryAddonView"]);
	});

	// Python: TestViewDefinition.test_add_view.
	test("append writes back with a bare comma, no space", () => {
		const header = makeHeader(["ViewDefinition [CoordinationView_V2.0]"]);
		const mvd = new MvdInfo(header);
		expect(mvd.viewDefinitions).toEqual(["CoordinationView_V2.0"]);
		(mvd.viewDefinitions as string[]).push("SpaceBoundaryAddonView");
		expect(mvd.viewDefinitions).toEqual(["CoordinationView_V2.0", "SpaceBoundaryAddonView"]);
		expect(header.file_description.description).toEqual([
			"ViewDefinition [CoordinationView_V2.0,SpaceBoundaryAddonView]",
		]);
	});

	test("setter accepts a list, joined with ', '", () => {
		const header = makeHeader(["ViewDefinition [X]"]);
		const mvd = new MvdInfo(header);
		mvd.viewDefinitions = ["CoordinationView_V2.0"];
		expect(mvd.viewDefinitions).toEqual(["CoordinationView_V2.0"]);
	});
});

describe("ExchangeRequirements", () => {
	// Python: TestExchangeRequirements.test_parsing (contains_exchange_requirement.ifc).
	test("parseMvd directly", () => {
		const parsed = parseMvd(["ViewDefinition [ReferenceView_V1.2]", "ExchangeRequirement [Any]"]);
		expect(parsed.exchangeRequirements).toBe("Any");
	});

	// Python: TestExchangeRequirements.test_access_and_modification.
	test("access and modification", () => {
		const header = makeHeader(["ViewDefinition [ReferenceView_V1.2]", "ExchangeRequirement [Any]"]);
		const mvd = new MvdInfo(header);
		header.file_description.description = [
			"ViewDefinition [Alignment-basedView]",
			"ExchangeRequirement [SomethingElse]",
		];
		expect(mvd.exchangeRequirements).toBe("SomethingElse");
		mvd.viewDefinitions = ["CoordinationView_V2.0"];
		expect(mvd.viewDefinitions).toEqual(["CoordinationView_V2.0"]);
	});

	// A "CustomRequirement: Value1, Value2"-shaped body still stays a raw string for
	// ExchangeRequirement -- unlike Option/dynamic keywords, exchangerequirement never
	// attempts `parse_semicolon_separated_kv` at all (confirmed against the real
	// Python source and empirically).
	test("never parsed as key:value, even when it looks like one", () => {
		const parsed = parseMvd(["ExchangeRequirement[CustomRequirement: Value1, Value2]"]);
		expect(parsed.exchangeRequirements).toBe("CustomRequirement: Value1, Value2");
	});

	test("whitespace is normalized (collapsed + trimmed)", () => {
		const parsed = parseMvd(["ExchangeRequirement[  lots   of   space   text  ]"]);
		expect(parsed.exchangeRequirements).toBe("lots of space text");
	});
});

describe("Comments", () => {
	// Python: TestComments.test_read_and_append (contains_comment.ifc).
	test("read and append -- leading-space quirk on the appended item", () => {
		const header = makeHeader(["ViewDefinition [ReferenceView_V1.2]", "Comment [Any]"]);
		const mvd = new MvdInfo(header);
		expect(mvd.comments).toEqual(["Any"]);
		mvd.comments = ["SomethingElse"];
		expect(mvd.comments).toEqual(["SomethingElse"]);
		(mvd.comments as string[]).push("AnotherComment");
		// Real, tested Python behavior (not a typo): the `value` grammar token absorbs
		// the space after the comma verbatim, so re-parsing "Comment [SomethingElse,
		// AnotherComment]" yields a leading space on the second item.
		expect(mvd.comments).toEqual(["SomethingElse", " AnotherComment"]);
		expect(mvd.description[1]).toBe("Comment [SomethingElse, AnotherComment]");
	});

	// Python: TestComments.test_comment_list_modifications. Uses `.splice()` in place
	// of Python's `del comments[0]` -- see `mvdInfo.ts`'s header comment for why bare
	// JS `delete arr[i]` is deliberately NOT wired to shift like Python's `del`.
	test("list modifications: append/insert/pop/splice-delete", () => {
		const header = makeHeader(["ViewDefinition [ReferenceView_V1.2]", "Comment [Any]"]);
		const mvd = new MvdInfo(header);
		mvd.comments = "";
		let comments = mvd.comments as string[];
		comments.push("OnlyOne");
		expect(mvd.comments).toContain("OnlyOne");

		comments = mvd.comments as string[];
		comments.splice(0, 0, "FirstOne");
		expect((mvd.comments as string[])[0]).toBe("FirstOne");

		comments = mvd.comments as string[];
		comments.pop();
		expect((mvd.comments as string[])[0]).toBe("FirstOne");

		comments = mvd.comments as string[];
		comments.splice(0, 1);
		expect(mvd.comments).toEqual([]);
	});

	test("multiple Comment[...] entries: last one wins (overwrite, not accumulate)", () => {
		const parsed = parseMvd(["Comment[First]", "Comment[Second]"]);
		expect(parsed.comments).toBe("Second");
	});
});

describe("Options", () => {
	// Python: TestOptions.test_string_options (contains_options.ifc).
	test("free-text Option adds 'options' to keywords", () => {
		const header = makeHeader(["ViewDefinition [ReferenceView_V1.2]", "Option [Any]"]);
		const mvd = new MvdInfo(header);
		expect(mvd.options).toBe("Any");
		expect(mvd.keywords.has("options")).toBe(true);
	});

	// Preserved Python bug (header comment finding 4): kv-structured Option does NOT
	// add "options" to keywords.
	test("kv-structured Option does NOT add 'options' to keywords (preserved bug)", () => {
		const parsed = parseMvd(["Option[ExcludedObjects: Stair, Ramp, Space; SplitLevel: On]"]);
		expect(parsed.options).toEqual({ ExcludedObjects: ["Stair", "Ramp", "Space"], SplitLevel: "On" });
		expect(parsed.keywords.has("options")).toBe(false);
	});

	test("internal multi-space runs are collapsed before kv-parsing", () => {
		const parsed = parseMvd(["Option[key1:  v1   x  ,  v2 ; key2:v3]"]);
		expect(parsed.options).toEqual({ key1: ["v1 x", "v2"], key2: "v3" });
	});
});

const DYNAMIC_FIELDS_DESCRIPTION = [
	"ViewDefinition [ReferenceView_V1.2]",
	"ViewDefinition [QuantityTakeOffAddOnView]",
	"Option [ExcludedObjects: Stair, Ramp, Space; SplitLevel: On]",
	"ExchangeRequirement [CustomRequirement: Value1, Value2]",
	"Remark [SomeKey: SomeValue; AnotherKey: AnotherValue]",
	"Comment [This is a free text comment, or a comma-separated list of items]",
];

describe("Dynamic fields", () => {
	// Python: TestDynamicFields.test_options_modifications (dynamic_fields.ifc).
	test("options modifications write back and mirror header.file_description.description", () => {
		const header = makeHeader(DYNAMIC_FIELDS_DESCRIPTION);
		const mvd = new MvdInfo(header);
		const options = mvd.options as Record<string, string[] | string>;
		(options.ExcludedObjects as string[]).push("Chair");
		options.SplitLevel = "Off";
		options.OtherAttr = "SomeValue";

		expect(mvd.description[2]).toMatch(/^Option \[/);
		expect(mvd.description[2]).toContain("OtherAttr: SomeValue");
		expect(mvd.description).toEqual(header.file_description.description);
	});

	// Python: TestDynamicFields.test_remark_editing.
	test("dynamic keyword ('remark') read/write via property access", () => {
		const header = makeHeader(DYNAMIC_FIELDS_DESCRIPTION);
		const mvd = new MvdInfo(header) as MvdInfo & Record<string, unknown>;
		expect(mvd.remark).toEqual({ SomeKey: "SomeValue", AnotherKey: "AnotherValue" });
		const remark = mvd.remark as Record<string, string | string[]>;
		remark.AnotherKey = "SomethingElse";
		remark.IncludedObjects = ["Floor", "Roof"];
		expect((mvd.remark as Record<string, unknown>).AnotherKey).toBe("SomethingElse");
		expect((mvd.remark as Record<string, unknown>).IncludedObjects).toEqual(["Floor", "Roof"]);
		expect(mvd.keywords.has("remark")).toBe(true);
	});

	// Python: TestDynamicFields.test_custom_dict_behavior. Uses `Object.keys/values/
	// entries` + `in` + plain index access in place of Python's `.keys()`/`.values()`/
	// `.items()`/`.get()` -- see `mvdInfo.ts`'s header comment for why.
	test("dict-like behavior via native JS object idioms", () => {
		const header = makeHeader(DYNAMIC_FIELDS_DESCRIPTION);
		const mvd = new MvdInfo(header) as MvdInfo & Record<string, unknown>;

		const options = mvd.options as Record<string, unknown>;
		// `delete` (not `= undefined`) is the point of this assertion -- it exercises
		// `createDictionaryHandler`'s `deleteProperty` trap (Python's `__delitem__`),
		// which actually removes the key, not just sets it to a nullish value.
		// biome-ignore lint/performance/noDelete: exercising the `deleteProperty` trap itself, not a hot path.
		delete options.SplitLevel;
		expect("SplitLevel" in (mvd.options as Record<string, unknown>)).toBe(false);

		const remark = mvd.remark as Record<string, unknown>;
		expect(new Set(Object.keys(remark))).toEqual(new Set(["SomeKey", "AnotherKey"]));
		expect(Object.values(remark)).toContain("SomeValue");
		expect(Object.entries(remark)).toContainEqual(["SomeKey", "SomeValue"]);

		expect("SomeKey" in remark).toBe(true);
		expect("MissingKey" in remark).toBe(false);
	});

	// Preserved Python bug (header comment finding 5): a dynamic keyword whose text has
	// no "key: value" structure crashes on access instead of returning null/{}.
	test("dynamic keyword with no key:value structure throws on access (preserved bug)", () => {
		const header = makeHeader(["MyKeyword[hello world]"]);
		const mvd = new MvdInfo(header) as MvdInfo & Record<string, unknown>;
		expect(mvd.keywords.has("mykeyword")).toBe(true);
		expect(() => mvd.mykeyword).toThrow(TypeError);
	});

	test("unknown attribute access throws", () => {
		const header = makeHeader(["ViewDefinition[X]"]);
		const mvd = new MvdInfo(header) as MvdInfo & Record<string, unknown>;
		expect(() => mvd.nonexistent).toThrow(/no attribute 'nonexistent'/);
	});
});

describe("Keywords", () => {
	// Python: TestKeywords.test_keywords_present, parametrized over the fixture files.
	test.each([
		[["ViewDefinition [ReferenceView_V1.2]", "Comment [Any]"], new Set(["view_definitions", "comments"])],
		[
			["ViewDefinition [ReferenceView_V1.2]", "ExchangeRequirement [Any]"],
			new Set(["view_definitions", "exchange_requirements"]),
		],
		[["ViewDefinition [ReferenceView_V1.2]", "Option [Any]"], new Set(["view_definitions", "options"])],
		[DYNAMIC_FIELDS_DESCRIPTION, new Set(["view_definitions", "exchange_requirements", "comments", "remark"])],
	])("keywords for %j", (description, expected) => {
		const header = makeHeader(description);
		const mvd = new MvdInfo(header);
		expect(mvd.keywords).toEqual(expected);
	});
});

describe("Grammar edge cases (empirically verified against a real lark install)", () => {
	test("case-sensitive reserved keywords: lowercase falls through to a dynamic keyword", () => {
		const parsed = parseMvd(["viewdefinition[Foo]"]);
		expect(parsed.viewDefinitions).toEqual([]);
		expect(parsed.keywords.has("viewdefinition")).toBe(true);
	});

	test("a near-miss keyword (extra trailing chars) is a dynamic keyword, not ViewDefinition", () => {
		const parsed = parseMvd(["ViewDefinitionX[Foo]"]);
		expect(parsed.viewDefinitions).toEqual([]);
		expect(parsed.keywords.has("viewdefinitionx")).toBe(true);
	});

	test("empty brackets fail to parse entirely (grammar requires >= 1 value)", () => {
		const parsed = parseMvd(["ViewDefinition[]"]);
		expect(parsed.viewDefinitions).toBeNull();
		expect(parsed.keywords.size).toBe(0);
	});

	test("missing brackets fail to parse entirely", () => {
		const parsed = parseMvd(["ViewDefinition Foo"]);
		expect(parsed.viewDefinitions).toBeNull();
	});

	test("empty description short-circuits without attempting to parse", () => {
		const parsed = parseMvd([]);
		expect(parsed.viewDefinitions).toBeNull();
		expect(parsed.comments).toBe("");
		expect(parsed.exchangeRequirements).toBe("");
		expect(parsed.options).toBe("");
		expect(parsed.keywords.size).toBe(0);
	});

	test("unparseable garbage: only viewDefinitions becomes null, other fields keep their defaults", () => {
		const parsed = parseMvd(["this is not valid mvd syntax at all !!! ###"]);
		expect(parsed.viewDefinitions).toBeNull();
		expect(parsed.comments).toBe("");
		expect(parsed.exchangeRequirements).toBe("");
		expect(parsed.options).toBe("");
	});

	test("leading/trailing whitespace inside brackets is absorbed into the value verbatim", () => {
		expect(parseMvd(["ViewDefinition[ Foo]"]).viewDefinitions).toEqual([" Foo"]);
		expect(parseMvd(["ViewDefinition[Foo ]"]).viewDefinitions).toEqual(["Foo "]);
	});

	test("whitespace before the opening bracket is ignored normally", () => {
		expect(parseMvd(["ViewDefinition   [Foo]"]).viewDefinitions).toEqual(["Foo"]);
	});

	test("entries need no separator between them", () => {
		expect(parseMvd(["ViewDefinition[A]ViewDefinition[B]"]).viewDefinitions).toEqual(["A", "B"]);
	});

	test("value characters: letters, digits, spaces, underscore, dot, hyphen", () => {
		expect(parseMvd(["ViewDefinition[A.1_b-2]"]).viewDefinitions).toEqual(["A.1_b-2"]);
	});

	test("Option free-text fallback with no colon at all", () => {
		const parsed = parseMvd(["Option[just free text no colon]"]);
		expect(parsed.options).toBe("just free text no colon");
	});

	test("dynamic keyword kv-parse uses RAW text (internal multi-space NOT collapsed)", () => {
		const parsed = parseMvd(["Custom[key1:  v1   x  ,  v2 ; key2:v3]"]);
		const dynamic = parsed.dynamic.get("custom");
		expect(dynamic?.[0]).toEqual({ key1: ["v1   x", "v2"], key2: "v3" });
	});

	test("a colon inside a value (e.g. a time) only splits on the first colon per pair", () => {
		const parsed = parseMvd(["Custom[key: Time: 10:30]"]);
		expect(parsed.dynamic.get("custom")?.[0]).toEqual({ key: "Time: 10:30" });
	});
});

describe("Proxy translation behaviors", () => {
	test("viewDefinitions/comments are real arrays (Array.isArray true)", () => {
		const header = makeHeader(["ViewDefinition[A]"]);
		const mvd = new MvdInfo(header);
		expect(Array.isArray(mvd.viewDefinitions)).toBe(true);
	});

	test("direct index assignment on the returned list commits (unlike a hand-rolled method-only subclass)", () => {
		// Note the required space before "[" (`ViewDefinition [` not `ViewDefinition[`)
		// so `_updateKeyword`'s own preserved quirk (see below) replaces this line in
		// place rather than appending a second one.
		const header = makeHeader(["ViewDefinition [A,B]"]);
		const mvd = new MvdInfo(header);
		const vd = mvd.viewDefinitions as string[];
		vd[0] = "Z";
		expect(header.file_description.description[0]).toContain("Z");
	});

	test("MvdInfo instances are still `instanceof MvdInfo` through the Proxy", () => {
		const header = makeHeader(["ViewDefinition[A]"]);
		const mvd = new MvdInfo(header);
		expect(mvd instanceof MvdInfo).toBe(true);
	});

	test("`_updateKeyword`'s space-required startswith quirk: a no-space existing line is not replaced in place", () => {
		const header = makeHeader(["ViewDefinition[A]"]);
		const mvd = new MvdInfo(header);
		mvd.viewDefinitions = ["B"];
		// The original no-space line stays, and a new, separately-spaced line is
		// appended -- preserved verbatim (see `mvdInfo.ts`'s `_updateKeyword` comment).
		expect(header.file_description.description).toEqual(["ViewDefinition[A]", "ViewDefinition [B]"]);
	});

	// Regression test for a real bug this chunk's own adversarial review caught and
	// fixed before shipping (see `createAutoCommitList`'s own doc comment and the
	// header comment's "translation choice" section): a `.splice()`/`.push()`/`.pop()`
	// call on the returned array must commit EXACTLY ONCE, with the array already in
	// its final, well-formed state -- not once per internal index/length write the
	// underlying `Array.prototype` method performs (which, before the fix, wrote
	// transiently malformed intermediate states -- duplicated elements, `null` holes
	// formatted into the joined string -- to the header on every one of those writes).
	test("splice/push/pop each commit exactly once, with no transiently malformed intermediate write", () => {
		let current: string[] = ["ViewDefinition [A,B,C]"];
		const writes: string[][] = [];
		const header: MvdHeader = {
			file_description: {
				get description(): string[] {
					return current;
				},
				set description(value: string[]) {
					current = [...value];
					writes.push(current);
				},
			},
		};

		const mvd = new MvdInfo(header);
		const vd = mvd.viewDefinitions as string[];
		vd.splice(1, 0, "X"); // insert "X" at index 1: ["A","B","C"] -> ["A","X","B","C"]

		// Exactly one commit (not one per internal index/length write `splice` performs),
		// and that one commit already holds the correct final state, not a transiently
		// malformed intermediate one.
		expect(writes).toHaveLength(1);
		expect(writes[0]).toEqual(["ViewDefinition [A,X,B,C]"]);
	});
});
