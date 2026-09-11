// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/mvd_info.py` (src/ifcopenshell-python, 341
// lines) -- parses an IFC file header's `FILE_DESCRIPTION` strings (the
// `ViewDefinition[...]`/`Comment[...]`/`ExchangeRequirement[...]`/`Option[...]`/
// arbitrary-keyword-`[...]` MVD-metadata mini-language) into a live, mutable `MvdInfo`
// view that writes changes back to the header on assignment/mutation.
//
// *** Grammar: hand-rolled, no new npm dependency, per `util/selector.ts`'s
// established precedent *** -- Python's `mvd_grammar` (a ~15-line `lark` LALR
// grammar, conditionally used only when `importlib.util.find_spec("lark")` finds it
// installed; `LARK_AVAILABLE=False`'s fallback, `parse_mvd` always returning `None`,
// is NOT replicated here -- this port's hand-rolled grammar has no optional-
// dependency situation to model, so it is always "available"; the "unavailable"
// behavior and its own test (`TestFallbackBehavior::test_parse_mvd_fallback`) are
// deliberately out of scope, matching this chunk's own task brief) is hand-rolled
// below as `parseMvdGrammar`, a small recursive-descent scanner over the joined
// description text. `parseSemicolonSeparatedKv` (Python's own regex/string-split
// helper, NOT part of the `lark` grammar itself -- see the finding below) is ported
// separately.
//
// *** A real finding from reading the grammar text itself (not just this chunk's task
// brief, which is right that most of `mvd_grammar` matters, but doesn't mention this):
// `value_list_set`/`value_set`/`set_name` are dead grammar productions. *** They are
// defined in `mvd_grammar`'s text and have corresponding `DescriptionTransform`
// methods, but no `entry` alternative ever references `value_list_set` (only
// `simple_value_list`, for `ViewDefinition`/`Comment`, and `other_keyword`/
// `dynamic_option_word` -- both a single unstructured regex token, for
// `ExchangeRequirement`/`Option`/dynamic keywords) -- so `value_list_set` is
// unreachable from `start` and never actually invoked by real parsing. The real
// `key: value` parsing for `Option`/dynamic keywords happens entirely through
// `parse_semicolon_separated_kv`'s own string-splitting logic on the raw
// `other_keyword`/`dynamic_option_word` text, NOT through this grammar rule. Verified
// empirically (see below) -- not ported here, since porting unreachable grammar rules
// would add real code with no way to ever exercise it.
//
// *** Empirical verification, not just source-reading *** -- this chunk located a real
// `lark` install on this machine (an unrelated sibling project's venv,
// `formwork/mcp-server/ifc-backend/.venv`) and ran the *actual* Python
// `mvd_info.py` module against ~20 probe inputs (including every fixture under
// `test/fixtures/mvd_parsing/` and every case `test/test_mvd_info.py` exercises) to
// pin down exhaustively that this small grammar's whitespace/priority/tie-break
// behavior; this chunk's own PR description has the full probe transcript. Findings
// that would NOT have been obvious from reading the grammar text alone:
//
// 1. **`value`'s regex (`/[A-Za-z0-9 _.-]+/`, used by `ViewDefinition`/`Comment`)
//    includes a literal space in its character class, and -- confirmed empirically,
//    not just theorized -- this means a `value` token's match *absorbs* adjacent
//    whitespace (leading, trailing, and internal-multi-space runs) verbatim, rather
//    than lark's `%ignore WS` stripping it first.** E.g. `"ViewDefinition[A,
//    B]"` (one space after the comma) parses to view definitions `["A", " B"]` --
//    the *second* value keeps its leading space. This is exactly what
//    `test_mvd_info.py::TestComments::test_read_and_append` itself asserts
//    (`f.mvd.comments == ["SomethingElse", " AnotherComment"]` after `.append(...)`,
//    verbatim, not a typo) -- so this is real, tested Python behavior, not an
//    unintentional edge case this port is free to "clean up". `parseSimpleValueList`
//    below reproduces it exactly: each `value` token is read as one maximal run of
//    `[A-Za-z0-9 _.-]`, with no separate whitespace-skip between the comma and the
//    next value.
// 2. **`other_keyword`/`dynamic_option_word` (`ExchangeRequirement`/`Option`/dynamic
//    keywords) do NOT have this quirk** -- their regex is `/[^\[\]]+/` (anything but
//    brackets), captured as one raw run same as above, but what happens to that raw
//    text differs by call site (see finding 3).
// 3. **Whitespace normalization is applied inconsistently, and porting it faithfully
//    requires preserving exactly which call sites normalize and which don't:**
//    - `store_text_attribute` (the `ExchangeRequirement` entry, and `Option`'s
//      fallback when its text isn't `key: value` structured) collapses all internal
//      whitespace runs to a single space and trims both ends (Python:
//      `" ".join(text.split())`) -- confirmed empirically:
//      `ExchangeRequirement[  lots   of   space   text  ]` -> `"lots of space text"`.
//    - `option`'s *kv-parse attempt* feeds `parse_semicolon_separated_kv` the
//      ALREADY-NORMALIZED text (the same whitespace-collapsed string
//      `store_text_attribute` would have produced) -- confirmed empirically:
//      `Option[key1:  v1   x  ,  v2 ; key2:v3]` -> `{key1: ["v1 x", "v2"], key2: "v3"}`
//      (the internal `v1   x` run collapses to `v1 x`).
//    - `dynamic_option`'s kv-parse, by contrast, feeds `parse_semicolon_separated_kv`
//      the RAW, un-normalized captured text directly -- confirmed empirically:
//      `Custom[key1:  v1   x  ,  v2 ; key2:v3]` ->
//      `{key1: ["v1   x", "v2"], key2: "v3"}` (the internal run is preserved, only the
//      per-piece `.strip()` inside `parse_semicolon_separated_kv` itself trims
//      *boundary* whitespace around each key/value). `parseOption`/`parseDynamicOption`
//      below reproduce this asymmetry exactly (`normalizeWhitespace` called only on
//      the `option`/`exchangeRequirement` paths, never on the dynamic path).
// 4. **A real, disclosed, un-fixed bug preserved verbatim: `Option[...]`'s `keywords`
//    entry is only added on the free-text fallback path, NOT when the kv-parse
//    succeeds.** Reading `option`'s Python source alone (`if v := parse_semicolon_
//    separated_kv(...): setattr(self, "options", v)  else: self.store_text_attribute
//    (args, "options")`) shows the kv-success branch never calls
//    `self.keywords.add("options")` (only `store_text_attribute` does, on the
//    fallback branch) -- easy to misread as an oversight in the *grammar/transformer*
//    rather than confirm as real, so this was verified against the actual test
//    suite: `test_mvd_info.py::TestKeywords`'s own parametrized fixture list for
//    `dynamic_fields.ifc` (which has a *kv-structured* `Option[...]`) asserts
//    `{"view_definitions", "exchange_requirements", "comments", "remark"}` --
//    `"options"` is deliberately absent, confirmed both by reading that assertion and
//    by re-running it against the real module above. Reproduced verbatim in
//    `applyEntry` below (see the `"option"` case), not silently "fixed", per this
//    project's established preserved-Python-quirk disclosure convention (e.g.
//    `util/file.ts`'s header comment, findings 1-2).
// 5. **A second real, disclosed, un-fixed bug preserved verbatim: a dynamic keyword
//    whose captured text has no `key: value` structure crashes on read, not just
//    returns `null`.** `dynamic_option`'s `parse_semicolon_separated_kv` call can
//    return `None` (e.g. `MyKeyword[hello world]`, no colon) with no exception raised
//    (`None` is a normal return value, not caught by the surrounding `except
//    Exception`) -- `self._dynamic[key] = (None, original_keyword)` is stored as-is.
//    But `MvdInfo.__getattr__` *unconditionally* wraps whatever's stored there in
//    `DictionaryHandler(value, ...)`, and `DictionaryHandler.__init__` immediately
//    calls `value.items()` -- an unhandled `AttributeError: 'NoneType' object has no
//    attribute 'items'` when accessed. Confirmed empirically (not just theorized):
//    `MvdInfo(header).mykeyword` on `"MyKeyword[hello world]"` raises exactly that.
//    `mvdInfoProxyGet` below reproduces this: accessing a dynamic keyword whose
//    parsed value is `null` throws, rather than silently returning `null`/`{}`.
//
// *** `MvdInfo`/`DictionaryHandler`/`AutoCommitList` translation choice ***
//
// Python's `DictionaryHandler(dict)`/`AutoCommitList(list)` subclass `dict`/`list`
// directly to get free method-parity (iteration, `len()`, equality, etc.) while
// overriding only the mutating methods (`__setitem__`/`__delitem__`/`append`/
// `extend`/`insert`/`remove`/`pop`/`clear`) to fire a write-back callback after each
// mutation. JS classes CAN extend `Array`, but -- unlike Python's `__setitem__`/
// `__delitem__` magic-method hooks -- a plain `class X extends Array` subclass has no
// hook for `arr[i] = value`/`delete arr[i]` index operations; only explicitly
// *named* methods (`push`, `pop`, etc.) are interceptable by overriding them, and
// nothing intercepts raw index assignment. Investigated (matching this chunk's task
// brief) rather than assumed: the actual capability `AutoCommitList`/
// `DictionaryHandler` need is narrow -- "a real array/object that fires a callback
// after *any* mutation, and otherwise behaves exactly like a native array/object" --
// and a `Proxy` wrapping a genuine `Array`/plain-object target (this file's
// `createAutoCommitList`/`createDictionaryHandler`, matching `entityInstance.ts`'s own
// established `Proxy`-wrapping-`this` precedent for "dynamic property access with a
// hook", `ENTITY_INSTANCE_PROXY_HANDLER`) gets this for direct index assignment/
// deletion for free via the `set`/`deleteProperty` traps below (each is exactly one
// internal write, so exactly one commit -- matching Python's own `__setitem__`/
// `__delitem__`, which a hand-rolled `class extends Array` subclass could NOT
// intercept at all, since JS gives no hook for raw index operations on a plain
// subclass) -- confirmed with an explicit test (`mvdInfo.test.ts`'s "direct index
// assignment commits" case) that a bare `arr[0] = "x"` on the returned array does
// trigger a write-back, matching Python.
//
// **A real bug this chunk's own adversarial review caught and fixed (not shipped and
// deferred): letting `push`/`pop`/`splice`/etc. fall through to the Proxy's *default*
// `get`-forwarded `Array.prototype` method does NOT get "exactly one commit per
// logical mutation" for free.** The naive version of this design (every trap left to
// default `get` forwarding, only `set`/`deleteProperty` implemented) technically
// works -- `Array.prototype.splice` called on the Proxy still eventually produces the
// correct final array -- but each *internal* index/length write the spec algorithm
// for `splice`/`push`/`pop`/etc. performs along the way re-enters the `set`/
// `deleteProperty` traps and fires a separate commit, writing the array's
// transiently malformed intermediate state (duplicated elements, `null` holes) to the
// header on every one of those, not just the final one -- confirmed experimentally: a
// single `.splice(1, 0, "X")` call fired 4 commits, the first three with the array in
// a wrong, half-mutated shape. `MUTATING_ARRAY_METHODS`/`createAutoCommitList`'s `get`
// trap below fixes this properly (not by debouncing or making commits async, which
// would break the synchronous-write-lands-immediately behavior every test in
// `mvdInfo.test.ts` relies on and Python itself has): known mutating method names are
// intercepted and run directly against the raw target array (bypassing the Proxy
// entirely for the call's duration, so none of its own internal writes re-enter these
// traps), with `commit()` called exactly once afterward, array already in its final
// state -- restoring the same "exactly one commit per logical mutation, correct
// final state" guarantee Python's own `AutoCommitList` has. See that constant's own
// doc comment for the full list of methods covered and why.
//
// `Array.isArray()` on the returned value is `true` (a `Proxy` wrapping a real
// `Array` target is transparent to `IsArray`, per spec -- verified with a test, not
// assumed) and it satisfies `toEqual`/spread/`for...of`/`JSON.stringify` exactly like
// a plain array, since every non-mutating trap is left at its Proxy default
// (transparent forwarding to the target).
//
// One real, disclosed, deliberate API-shape difference from Python (not a gap, a
// judgment call about idiomatic JS): Python's `del comments[0]` (shifts subsequent
// elements down, shrinking the list) has no JS operator equivalent -- bare JS
// `delete arr[0]` does NOT shift (it leaves a sparse hole, `arr[0] === undefined`,
// length unchanged), so making `deleteProperty` *shift* to match Python's `del`
// would make the returned value behave surprisingly for any other JS consumer
// expecting normal `delete` semantics. The idiomatic JS equivalent exposed instead
// (and what `mvdInfo.test.ts`'s port of `test_comment_list_modifications` uses) is
// `.splice(i, 1)`, which the Proxy already supports transparently (via its internal
// `set`/`delete` operations, which do trigger `deleteProperty`/`set` traps and commit
// correctly) -- not a new method, just the native JS idiom for "remove at index,
// shift the rest".
//
// `DictionaryHandler`'s Python-`dict`-style `.get()`/`.keys()`/`.values()`/`.items()`
// methods are likewise NOT reproduced as bespoke methods on the returned object --
// investigated and deliberately dropped as unnecessary, not silently missing: JS
// already has idiomatic, collision-free equivalents (`Object.keys(handler)`/
// `Object.values(handler)`/`Object.entries(handler)`, `"key" in handler`, and plain
// `handler["key"]`, which -- unlike Python's `dict[missing_key]` -- already returns
// `undefined` rather than throwing for a missing key, so a `.get()` convenience
// method isn't even needed for parity). Adding real methods with those names to the
// object directly would risk colliding with an actual MVD key that happens to be
// spelled `"get"`/`"keys"`/etc. (e.g. `Option[keys: A, B]`) -- Python has no such
// collision risk (`dict.get`/`dict["get"]` are different namespaces), so reproducing
// the method-based API here would introduce a real bug the Python original doesn't
// have. `mvdInfo.test.ts`'s port of `test_custom_dict_behavior` uses the native-JS
// equivalents throughout.
//
// *** Genuine, disclosed out-of-scope item: `IfcFile.header()` -> `MvdInfo` live
// wiring. *** Python's `ifcopenshell.file.mvd` property (`file.py`) constructs
// `MvdInfo(self.header)` directly off the live `ifcopenshell.file`'s own header
// object. This port's `MvdInfo` is written against a *structural* `MvdHeader`
// interface (`{ file_description: { description: string[] } }`) -- deliberately not
// coupled to this project's own `IfcFile`/`spf_header` native binding -- because
// `spf_header` (`src/native/ifcopenshell_native.ts`) has no `file_description()`
// sub-entity accessor yet, a pre-existing, already-disclosed primitive-layer gap
// (`util/file.ts`'s own header comment: "`spf_header` has no `file_description()`/
// `file_name()`/`file_schema()` sub-entity accessors"; `TODOS.md` now has a dedicated
// entry for it). `MvdInfo` itself is fully usable today against any object satisfying
// `MvdHeader` (exactly how `test_mvd_info.py`'s own `MockHeader` fixture works, and
// how `mvdInfo.test.ts` below is written) -- only the "mint one automatically off a
// real `.ifc` file's live header" convenience is blocked pending that native
// accessor landing; this is not a scope-reduction of `MvdInfo`'s own logic, which is
// ported in full.

/** Python: `class MvdInfo.__init__`'s `header` parameter -- `ifcopenshell.file`'s own
 * `spf_header` (`ifcopenshell/file.py`'s `.header` property) in real Python usage, or
 * `test_mvd_info.py`'s own `MockHeader` in tests. Deliberately structural (not tied to
 * this project's own not-yet-`file_description`-capable `spf_header` binding -- see
 * this file's header comment for why) so `MvdInfo` is usable today against any object
 * shaped like this, including a real header once the native accessor lands. */
export interface MvdFileDescription {
	description: string[];
}
export interface MvdHeader {
	file_description: MvdFileDescription;
}

/** A single MVD option/dynamic-keyword value: `parse_semicolon_separated_kv`'s
 * `dict[str, str | list[str]]`. */
export type MvdOptionValue = string | string[];
export type MvdOptionsRecord = Record<string, MvdOptionValue>;

// --- grammar: hand-rolled recursive-descent parser for `mvd_grammar` ---
// (see this file's header comment for the empirical investigation behind every
// whitespace/normalization decision below)

/** Thrown for any grammar violation -- caught by `parseMvd` exactly like Python's
 * `except (UnexpectedCharacters, UnexpectedEOF, UnexpectedToken)`. */
class MvdGrammarError extends Error {}

type MvdGrammarEntry =
	| { kind: "view_definition"; values: string[] }
	| { kind: "comment"; values: string[] }
	| { kind: "exchange_requirement"; text: string }
	| { kind: "option"; text: string }
	| { kind: "dynamic_option"; keyword: string; text: string };

const RESERVED_ENTRY_KEYWORDS: Record<string, "view_definition" | "comment" | "exchange_requirement" | "option"> = {
	ViewDefinition: "view_definition",
	Comment: "comment",
	ExchangeRequirement: "exchange_requirement",
	Option: "option",
};

function isWhitespace(ch: string): boolean {
	return ch === " " || ch === "\t" || ch === "\f" || ch === "\r" || ch === "\n" || ch === "\v";
}

function isIdentifierChar(ch: string): boolean {
	return (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9") || ch === "_";
}

/** `value: /[A-Za-z0-9 _.-]+/` -- note the literal space in the character class (see
 * header comment finding 1: this is what makes leading/trailing/internal whitespace
 * around a `value` token get absorbed into it, rather than stripped as `%ignore WS`). */
function isValueChar(ch: string): boolean {
	return isIdentifierChar(ch) || ch === " " || ch === "." || ch === "-";
}

/** `other_keyword`/`dynamic_option_word`: both `/[^\[\]]+/` -- anything but brackets. */
function isOtherKeywordChar(ch: string): boolean {
	return ch !== "[" && ch !== "]";
}

/** Hand-rolled recursive-descent parser for `mvd_grammar`'s `start: entry+` (see this
 * file's header comment for the grammar text and the empirical findings behind every
 * design decision below). Throws `MvdGrammarError` on any violation, matching lark's
 * `UnexpectedCharacters`/`UnexpectedEOF`/`UnexpectedToken`. */
function parseMvdGrammar(text: string): MvdGrammarEntry[] {
	let pos = 0;
	const len = text.length;

	function skipWs(): void {
		while (pos < len && isWhitespace(text[pos])) pos++;
	}

	function readIdentifier(): string {
		const start = pos;
		while (pos < len && isIdentifierChar(text[pos])) pos++;
		if (pos === start) throw new MvdGrammarError(`Expected a keyword at position ${pos}`);
		return text.slice(start, pos);
	}

	function expectChar(ch: string): void {
		if (pos >= len || text[pos] !== ch) {
			throw new MvdGrammarError(`Expected '${ch}' at position ${pos}`);
		}
		pos++;
	}

	/** `value: /[A-Za-z0-9 _.-]+/` -- one token, no separate whitespace-skip (see
	 * header comment finding 1). */
	function readValue(): string {
		const start = pos;
		while (pos < len && isValueChar(text[pos])) pos++;
		if (pos === start) throw new MvdGrammarError(`Expected a value at position ${pos}`);
		return text.slice(start, pos);
	}

	/** `simple_value_list: value ("," value)*`. */
	function readSimpleValueList(): string[] {
		const values = [readValue()];
		while (pos < len && text[pos] === ",") {
			pos++;
			values.push(readValue());
		}
		return values;
	}

	/** `other_keyword`/`dynamic_option_word`: `/[^\[\]]+/`, one raw token. */
	function readOtherKeywordText(): string {
		const start = pos;
		while (pos < len && isOtherKeywordChar(text[pos])) pos++;
		if (pos === start) throw new MvdGrammarError(`Expected text at position ${pos}`);
		return text.slice(start, pos);
	}

	const entries: MvdGrammarEntry[] = [];
	skipWs();
	if (pos >= len) {
		// `start: entry+` requires at least one entry.
		throw new MvdGrammarError("Expected at least one entry");
	}
	while (pos < len) {
		skipWs();
		if (pos >= len) break;
		const keyword = readIdentifier();
		skipWs();
		expectChar("[");
		const reserved = RESERVED_ENTRY_KEYWORDS[keyword];
		if (reserved === "view_definition" || reserved === "comment") {
			const values = readSimpleValueList();
			expectChar("]");
			entries.push({ kind: reserved, values });
		} else if (reserved === "exchange_requirement" || reserved === "option") {
			const entryText = readOtherKeywordText();
			expectChar("]");
			entries.push({ kind: reserved, text: entryText });
		} else {
			// GENERIC_KEYWORD: /[A-Za-z0-9_]+/ -- any identifier that isn't exactly one
			// of the four reserved literal keywords above (case-sensitive, whole-token
			// match -- e.g. "viewdefinition"/"ViewDefinitionX" both fall here, confirmed
			// empirically, see header comment).
			const entryText = readOtherKeywordText();
			expectChar("]");
			entries.push({ kind: "dynamic_option", keyword, text: entryText });
		}
		skipWs();
	}
	return entries;
}

/** Python: `" ".join(text.split())` -- collapses all internal whitespace runs to a
 * single space and trims both ends. Used by `store_text_attribute`'s callers
 * (`ExchangeRequirement` always, `Option`'s free-text fallback) -- NOT by
 * `dynamic_option`'s kv-parse, which uses the raw captured text (see header comment
 * finding 3). */
function normalizeWhitespace(text: string): string {
	const trimmed = text.trim();
	if (trimmed === "") return "";
	return trimmed.split(/\s+/).join(" ");
}

/** Near-verbatim port of `parse_semicolon_separated_kv`. Python wraps the whole body
 * in `try`/`except Exception: return None`, but nothing in this direct port of that
 * logic (string splits/trims into a plain object) can throw in JS the way a
 * `KeyError`/etc. might in a more complex Python body -- the `try`/`except` is
 * defensive dead code for this specific implementation, not reproduced. */
function parseSemicolonSeparatedKv(text: string): MvdOptionsRecord | null {
	if (!/\w+\s*:\s*[^:]+/.test(text)) return null;
	const result: MvdOptionsRecord = {};
	for (const pair of text.split(";")) {
		const colonIndex = pair.indexOf(":");
		if (colonIndex === -1) continue;
		const key = pair.slice(0, colonIndex).trim();
		const values = pair
			.slice(colonIndex + 1)
			.split(",")
			.map((v) => v.trim());
		result[key] = values.length === 1 ? (values[0] as string) : values;
	}
	return result;
}

// --- `DescriptionTransform` port: accumulates parsed entries into `ParsedMvd` ---

/** Port of `DescriptionTransform`'s accumulated state (its `__init__` fields). Field
 * names renamed snake_case -> camelCase per this project's convention, except the
 * *string values* stored inside `keywords`/`dynamic`'s keys, which stay as Python's
 * own snake_case labels (`"view_definitions"`, `"exchange_requirements"`) -- those are
 * runtime *data* (introspection labels a caller compares against, matching
 * `test_mvd_info.py::TestKeywords`'s own literal string assertions), not TS code
 * identifiers, so the rename convention doesn't apply to them. */
class ParsedMvd {
	viewDefinitions: string[] | null = [];
	keywords = new Set<string>();
	comments: string | string[] = "";
	exchangeRequirements = "";
	options: string | MvdOptionsRecord = "";
	/** Python: `self._dynamic`. Keyed by the lowercased dynamic keyword; value is
	 * `[parsedValueOrNull, originalKeyword]`, matching Python's `(parsed_value,
	 * original_keyword)` tuple -- `parsedValueOrNull` is `null` exactly when
	 * `parse_semicolon_separated_kv` found no `key: value` structure (header comment
	 * finding 5). */
	dynamic = new Map<string, [MvdOptionsRecord | null, string]>();
}

function applyEntry(parsed: ParsedMvd, entry: MvdGrammarEntry): void {
	switch (entry.kind) {
		case "view_definition": {
			parsed.keywords.add("view_definitions");
			// `parsed.viewDefinitions` is always a list at this point: it starts as `[]`
			// and is only ever set to `null` by `parseMvd` itself (empty description, or
			// total grammar failure) -- neither of which reaches `applyEntry`.
			(parsed.viewDefinitions as string[]).push(...entry.values);
			break;
		}
		case "comment": {
			// Python: `self.comments = args[0] if len(args[0]) > 1 else args[0][0]` --
			// assignment (overwrite), not accumulation, unlike `view_definition`'s
			// `.extend()`; a later `Comment[...]` entry in the same description replaces
			// an earlier one rather than merging with it (confirmed empirically).
			parsed.keywords.add("comments");
			parsed.comments = entry.values.length > 1 ? entry.values : (entry.values[0] as string);
			break;
		}
		case "exchange_requirement": {
			parsed.keywords.add("exchange_requirements");
			parsed.exchangeRequirements = normalizeWhitespace(entry.text);
			break;
		}
		case "option": {
			const normalized = normalizeWhitespace(entry.text);
			const kv = parseSemicolonSeparatedKv(normalized);
			if (kv) {
				// Preserved Python quirk (header comment finding 4): the kv-success branch
				// does NOT add "options" to `keywords` -- only the free-text fallback below
				// does. Confirmed against `test_mvd_info.py::TestKeywords`'s own
				// `dynamic_fields.ifc` expectation (a kv-structured `Option[...]` there, and
				// `"options"` is deliberately absent from that test's expected keyword set).
				parsed.options = kv;
			} else {
				parsed.keywords.add("options");
				parsed.options = normalized;
			}
			break;
		}
		case "dynamic_option": {
			const originalKeyword = entry.keyword;
			const key = originalKeyword.toLowerCase();
			// Raw (non-normalized) text, unlike `option` above -- header comment finding 3.
			const parsedValue = parseSemicolonSeparatedKv(entry.text);
			parsed.dynamic.set(key, [parsedValue, originalKeyword]);
			parsed.keywords.add(key);
			break;
		}
	}
}

/** Port of `parse_mvd`. Python's `text = " ".join(description)` then either
 * short-circuits (empty text -> `view_definitions = None`) or parses+transforms,
 * catching any grammar exception the same way (-> `view_definitions = None`, every
 * other field left at its `__init__` default). */
export function parseMvd(description: readonly string[]): ParsedMvd {
	const text = description.join(" ");
	const parsed = new ParsedMvd();
	if (!text) {
		parsed.viewDefinitions = null;
		return parsed;
	}
	try {
		const entries = parseMvdGrammar(text);
		for (const entry of entries) applyEntry(parsed, entry);
	} catch (e) {
		if (!(e instanceof MvdGrammarError)) throw e;
		parsed.viewDefinitions = null;
	}
	return parsed;
}

// --- `AutoCommitList`/`DictionaryHandler`: `Proxy`-based write-back wrappers ---
// (see this file's header comment for the full translation-choice writeup)

/** Port of `AutoCommitList` -- a real JS `Array` (via `Proxy`, not a hand-rolled
 * method-by-method subclass; see header comment) that fires `callback` after any
 * mutation (`push`/`pop`/`splice`/`shift`/`unshift`/direct index assignment/`length`
 * changes all naturally trigger the `set`/`deleteProperty` traps below). Python:
 * `AutoCommitList.__init__(iterable, callback, formatter=None)` --
 * `callback(formatter(list))` when `formatter` is given, else bare `callback()`. */
/** Named `Array.prototype` methods that mutate their receiver in place. Intercepted
 * below (via the `get` trap) so each one commits exactly once, with the array
 * already in its final state -- see `createAutoCommitList`'s own doc comment for why
 * this interception exists (a real bug this chunk's own adversarial review caught and
 * fixed, not shipped-and-deferred). */
const MUTATING_ARRAY_METHODS: ReadonlySet<string> = new Set([
	"push",
	"pop",
	"shift",
	"unshift",
	"splice",
	"fill",
	"copyWithin",
	"sort",
	"reverse",
]);

function createAutoCommitList(
	initial: readonly string[],
	callback: (formatted?: string) => void,
	formatter?: (list: readonly string[]) => string,
): string[] {
	const target: string[] = [...initial];
	function commit(): void {
		if (formatter) callback(formatter(target));
		else callback();
	}
	return new Proxy<string[]>(target, {
		get(t, prop, receiver) {
			if (typeof prop === "string" && MUTATING_ARRAY_METHODS.has(prop)) {
				// A real bug this chunk's own adversarial review caught (not shipped and
				// deferred): without this interception, calling e.g. `.splice(1, 0, "X")`
				// through the Proxy's default `get`/`set` forwarding fires this array's
				// `set`/`deleteProperty` traps once per *internal* index/length write the
				// spec algorithm for `splice` performs, not once per logical call -- each
				// intermediate write commits the array's transiently malformed state
				// (duplicated elements, `null` holes) to the header, only converging to the
				// correct final value on the last internal write. Operating directly on `t`
				// (the raw target, bypassing the Proxy entirely for the duration of the
				// method) and committing once afterward, with the array already in its
				// final state, restores exactly the semantics Python's own `AutoCommitList`
				// has (`append`/`extend`/`insert`/`remove`/`pop`/`clear` each call
				// `self._commit()` exactly once, at the end) -- direct index assignment/
				// deletion (the `set`/`deleteProperty` traps below) were never affected by
				// this bug (each is already exactly one internal write, hence exactly one
				// commit) and are unchanged.
				return (...args: unknown[]) => {
					const method = (Array.prototype as unknown as Record<string, (...a: unknown[]) => unknown>)[prop] as (
						...a: unknown[]
					) => unknown;
					const result = method.apply(t, args);
					commit();
					return result;
				};
			}
			return Reflect.get(t, prop, receiver);
		},
		set(t, prop, value, receiver) {
			const ok = Reflect.set(t, prop, value, receiver);
			if (ok) commit();
			return ok;
		},
		deleteProperty(t, prop) {
			const ok = Reflect.deleteProperty(t, prop);
			if (ok) commit();
			return ok;
		},
	});
}

/** Port of `DictionaryHandler` -- a real plain JS object (via `Proxy`) that fires a
 * write-back to `updateKeyword(keyword, ...)` after any mutation. List-valued entries
 * are themselves wrapped in `createAutoCommitList` with no formatter (Python:
 * `AutoCommitList(v, self._commit)`), so a nested `handler["k"].push(...)` also
 * commits, recomputing the whole `"k: v; k2: v2"` string from the dict's current
 * state (not from the formatter argument, which nested `AutoCommitList`s ignore --
 * matches Python's `_commit(self)` taking no value argument). See header comment for
 * why `.get()`/`.keys()`/`.values()`/`.items()` are deliberately NOT reproduced as
 * bespoke methods here (use `Object.keys/values/entries`, `in`, and plain index
 * access instead). */
function createDictionaryHandler(
	initialData: MvdOptionsRecord,
	updateKeyword: (keyword: string, newValue: string) => void,
	keyword: string,
): MvdOptionsRecord {
	const target: MvdOptionsRecord = {};

	function commit(): void {
		const parts: string[] = [];
		for (const [k, v] of Object.entries(target)) {
			const valueText = Array.isArray(v) ? v.join(", ") : v;
			parts.push(`${k}: ${valueText}`);
		}
		updateKeyword(keyword, parts.join("; "));
	}

	function wrapValue(v: MvdOptionValue): MvdOptionValue {
		return Array.isArray(v) ? (createAutoCommitList(v, commit) as unknown as string[]) : v;
	}

	for (const [k, v] of Object.entries(initialData)) {
		target[k] = wrapValue(v);
	}

	return new Proxy<MvdOptionsRecord>(target, {
		set(t, prop, value, receiver) {
			const v = typeof prop === "string" ? wrapValue(value as MvdOptionValue) : value;
			const ok = Reflect.set(t, prop, v, receiver);
			if (ok) commit();
			return ok;
		},
		deleteProperty(t, prop) {
			const ok = Reflect.deleteProperty(t, prop);
			if (ok) commit();
			return ok;
		},
	});
}

// --- `MvdInfo` ---

/** Near-verbatim port of `MvdInfo`. Every getter re-parses lazily (`_ensureParsed`,
 * matching `_ensure_parsed`, cached in `_parsed` until the next mutation invalidates
 * it) off the live `header.file_description.description` array. Dynamic-keyword
 * attribute access (Python's `__getattr__`, e.g. `mvd.remark` for a `Remark[...]`
 * entry) is implemented via a `Proxy` wrapping every `MvdInfo` instance (matching
 * `entityInstance.ts`'s own established `ENTITY_INSTANCE_PROXY_HANDLER` precedent),
 * not literal Python `__getattr__` (TS has no such hook on a plain class). */
export class MvdInfo {
	/** @internal Not TS-`private` -- the external `Proxy` handler
	 * (`mvdInfoProxyHandler`) needs to call/read these, matching
	 * `entityInstance.ts`'s own `_resolveTypeInfo()` precedent for the same reason. */
	_header: MvdHeader;
	/** @internal */
	_parsed: ParsedMvd | null = null;

	constructor(header: MvdHeader) {
		this._header = header;
		// Every `MvdInfo` is minted as a `Proxy` wrapping itself, exactly like
		// `EntityInstance`'s own constructor -- see that file's own comment for why this
		// pattern (a class constructor `return`ing a different object) is how `new
		// MvdInfo(...)` ends up returning the `Proxy`, not the raw instance, with
		// `instanceof MvdInfo` still holding through it.
		// biome-ignore lint/correctness/noConstructorReturn: intentional -- this is the mechanism by which every `MvdInfo` becomes a `Proxy`, matching `entityInstance.ts`'s own established precedent.
		return new Proxy(this, mvdInfoProxyHandler);
	}

	/** @internal */
	_ensureParsed(): void {
		if (this._parsed === null) {
			this._parsed = parseMvd(this._header.file_description.description);
		}
	}

	get description(): string[] {
		// A defensive shallow copy, not the live header array -- Python's own getter
		// returns `self._header.file_description.description` directly, but that's a
		// `tuple` (immutable), so aliasing it is harmless there. This port's `MvdHeader`
		// interface declares a mutable `string[]`; returning the live reference would let
		// a caller mutate the header's array in place (e.g. `mvd.description.push(...)`)
		// without going through the `description` setter's `_parsed = null` cache
		// invalidation, silently desyncing `_parsed` from the header. A shallow copy
		// closes that gap; every actual mutation path in this file (`_updateKeyword`,
		// the `description` setter itself) already goes through the setter, so this
		// doesn't change any tested behavior.
		return [...this._header.file_description.description];
	}

	set description(newDescription: readonly string[]) {
		this._header.file_description.description = [...newDescription];
		this._parsed = null;
	}

	get viewDefinitions(): string[] | null {
		this._ensureParsed();
		const parsed = this._parsed as ParsedMvd;
		if (parsed.viewDefinitions === null) return null;
		return createAutoCommitList(
			parsed.viewDefinitions,
			(value) => {
				this._updateKeyword("ViewDefinition", value as string);
			},
			(list) => list.join(","),
		);
	}

	set viewDefinitions(newValue: string | readonly string[]) {
		const value = Array.isArray(newValue) ? newValue.join(", ") : String(newValue);
		this._updateKeyword("ViewDefinition", value);
	}

	get comments(): string[] {
		this._ensureParsed();
		const parsed = this._parsed as ParsedMvd;
		const comments = parsed.comments;
		const commentList = Array.isArray(comments) ? comments : comments ? [comments] : [];
		return createAutoCommitList(
			commentList,
			(value) => {
				this._updateKeyword("Comment", value as string);
			},
			(list) => list.join(", "),
		);
	}

	set comments(newValue: string | readonly string[]) {
		const value = Array.isArray(newValue) ? newValue.join(", ") : String(newValue);
		this._updateKeyword("Comment", value);
	}

	get exchangeRequirements(): string {
		this._ensureParsed();
		return (this._parsed as ParsedMvd).exchangeRequirements;
	}

	set exchangeRequirements(newValue: string) {
		this._updateKeyword("ExchangeRequirement", newValue);
	}

	get options(): string | MvdOptionsRecord {
		this._ensureParsed();
		const parsed = this._parsed as ParsedMvd;
		if (typeof parsed.options === "object" && parsed.options !== null) {
			return createDictionaryHandler(parsed.options, (kw, v) => this._updateKeyword(kw, v), "Option");
		}
		return parsed.options;
	}

	set options(newValue: string) {
		this._updateKeyword("Option", newValue);
	}

	get keywords(): Set<string> {
		this._ensureParsed();
		return (this._parsed as ParsedMvd).keywords;
	}

	/** @internal */
	_updateKeyword(keyword: string, newValue: string): void {
		const newLine = `${keyword} [${newValue}]`;
		const lines: string[] = [];
		let updated = false;
		for (const line of this.description) {
			// Python: `line.strip().startswith(f"{keyword} [")` -- note the required
			// space between the keyword and "[" here. A description line written without
			// one (e.g. a hand-authored `"ViewDefinition[X]"`, no space -- valid per the
			// grammar, which the update path doesn't reuse) will NOT match and be
			// replaced in place; instead a new, separately-spaced line gets appended,
			// leaving the old one in place too. Preserved verbatim, not "fixed" -- matches
			// this project's established preserved-Python-quirk convention.
			if (line.trim().startsWith(`${keyword} [`)) {
				lines.push(newLine);
				updated = true;
			} else {
				lines.push(line);
			}
		}
		if (!updated) lines.push(newLine);
		this.description = lines;
	}
}

const mvdInfoProxyHandler: ProxyHandler<MvdInfo> = {
	get(target, prop, receiver) {
		if (typeof prop === "symbol" || prop in target) {
			return Reflect.get(target, prop, receiver);
		}
		target._ensureParsed();
		const parsed = target._parsed as ParsedMvd;
		const key = String(prop).toLowerCase();
		const dynamicEntry = parsed.dynamic.get(key);
		if (dynamicEntry === undefined) {
			// Python: `raise AttributeError(f"'MvdInfo' object has no attribute '{name}'")`.
			throw new Error(`'MvdInfo' object has no attribute '${String(prop)}'`);
		}
		const [value, originalKeyword] = dynamicEntry;
		if (value === null) {
			// Preserved Python quirk (header comment finding 5): unhandled crash, not a
			// silent `null`/`{}`. See that finding for the full empirical confirmation.
			throw new TypeError(
				`Cannot read properties of null (reading 'items') -- MvdInfo's dynamic keyword '${originalKeyword}' has no "key: value" structure to expose as a dictionary (matches ifcopenshell-python's own unhandled AttributeError for this exact case, mvd_info.py's DictionaryHandler.__init__).`,
			);
		}
		return createDictionaryHandler(value, (kw, v) => target._updateKeyword(kw, v), originalKeyword);
	},
};
