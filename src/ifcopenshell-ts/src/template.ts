// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/template.py` (src/ifcopenshell-python) -- generates a minimal
// valid empty IFC4 SPF file as a string, for `IfcFile`-from-scratch bootstrapping.
// Fully portable (research/01-python-core-and-lowlevel.md SS2.6): pure string
// formatting + `guid.new()`, no filesystem access (parses an in-memory buffer, not
// a path).
//
// One disclosed deviation: Python's `DEFAULTS.application`/`.application_version`
// read `ifcopenshell_wrapper.version()` (the native core's own version string) --
// this chunk's primitive layer doesn't bind a `version()` free function (out of
// scope; not one of this chunk's two authorized primitive additions), so this uses
// a fixed placeholder string instead (a `require("../package.json")` alternative was
// considered and rejected: this file's relative path to the package root differs
// between running against `src/` directly and `tsc`'s compiled `dist/cjs/` tree,
// the exact problem `native_loader.ts` solves for the addon path with a real
// upward package.json search -- not worth replicating for a cosmetic
// application-identifier string embedded in the generated header). Cosmetic only,
// not a correctness concern.
//
// UPDATED (`api.project` chunk): added `CreateOptions.blank`/`.authorization` and the
// new `BLANK_TEMPLATE` string, purely additive (both default to preserving the exact
// prior behavior for every existing caller -- `schema.ts`'s `getSchemaDefinition`,
// `test/bootstrap.ts`'s `createTestFile`, etc. -- none of which pass `blank`).
// `api/project/createFile.ts` (port of `ifcopenshell/api/project/create_file.py`)
// needs a genuinely *entity-free* file (just a HEADER section, empty DATA section) --
// unlike this file's own default `TEMPLATE`, which always bakes in a starter
// `IfcProject`/unit-assignment/geometric-context/owner-history chain (`test/
// bootstrap.ts`'s own `stripProjectBootstrap`/`stripOwnerBootstrap` header comments
// already document this exact "`template.create` != real `create_file`" gap, found by
// an earlier `api.unit` chunk). Investigated whether to instead reach this via the
// low-level `file_new_with_schema_filetype_path_logger` primitive
// (`native/ifcopenshell_native.ts`'s `file.create_schema_filetype_path_logger`, which
// *would* produce a truly blank file without going through STEP text at all): blocked
// -- the `logger` class (same file) has no static constructor/factory method bound
// anywhere on this primitive surface, so no `logger` instance can be obtained to pass
// to it at all (not merely "unwrapped at the `IfcFile` level", per `bootstrap.ts`'s
// own more optimistic phrasing -- confirmed by reading every method on the generated
// `logger` class: none are `static`). Also independently blocked from the "live
// header setter" angle: `IfcFile`/`spf_header` has no `file_name`/`file_description`
// sub-entity accessors at all yet (`TODOS.md`'s dedicated "`spf_header` has no
// `file_description()` sub-entity accessor" entry) -- there is no way to construct a
// blank native file and then assign `.header.file_name.name` etc. onto it after the
// fact either, even if the blank-construction problem above were solved. Both are
// real C++-side primitive additions, out of scope for this TS-only `api.project`
// chunk. So, exactly like this file's own pre-existing `TEMPLATE`/`create()`, the only
// currently-available route to a file with specific, chosen header field values is to
// bake them into STEP text and parse it via the existing `native.file_new_with_data_
// data_size` primitive (already used below) -- `BLANK_TEMPLATE` is that same
// technique, just with an empty `DATA;\nENDSEC;` section instead of `TEMPLATE`'s
// pre-populated one. See `createFile.ts`'s own header comment for the full field-by-
// field comparison against real Python's `create_file.py`.

import { IfcFile } from "./file";
import * as guid from "./guid";
import { native } from "./native/native_loader";

// A quick way to setup an 'empty' IFC file, taken from:
// http://academy.ifcopenshell.org/creating-a-simple-wall-with-property-set-and-quantity-information/
const TEMPLATE = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [{mvd}]'),'2;1');
FILE_NAME('{filename}','{timestring}',('{creator}'),('{organization}'),'{application}','{application}','');
FILE_SCHEMA(('{schema_identifier}'));
ENDSEC;
DATA;
#1=IFCPERSON($,$,'{creator}',$,$,$,$,$);
#2=IFCORGANIZATION($,'{organization}',$,$,$);
#3=IFCPERSONANDORGANIZATION(#1,#2,$);
#4=IFCAPPLICATION(#2,'{application_version}','{application}','');
#5=IFCOWNERHISTORY(#3,#4,$,.NOTDEFINED.,$,#3,#4,{timestamp});
#6=IFCDIRECTION((1.,0.,0.));
#7=IFCDIRECTION((0.,0.,1.));
#8=IFCCARTESIANPOINT((0.,0.,0.));
#9=IFCAXIS2PLACEMENT3D(#8,#7,#6);
#10=IFCDIRECTION((0.,1.));
#11=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#9,#10);
#12=IFCDIMENSIONALEXPONENTS(0,0,0,0,0,0,0);
#13=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);
#14=IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);
#15=IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);
#16=IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.);
#17=IFCMEASUREWITHUNIT(IFCPLANEANGLEMEASURE(0.017453292519943295),#16);
#18=IFCCONVERSIONBASEDUNIT(#12,.PLANEANGLEUNIT.,'DEGREE',#17);
#19=IFCUNITASSIGNMENT((#13,#14,#15,#18));
#20=IFCPROJECT('{project_globalid}',#5,'{project_name}',$,$,$,$,(#11),#19);
ENDSEC;
END-ISO-10303-21;
`;

// A header-only sibling of `TEMPLATE` above, with a genuinely empty `DATA` section --
// see this file's header comment (the `api.project` chunk update) for why this exists
// and why it's the only currently-available route to that shape. Unlike `TEMPLATE`,
// `preprocessor_version`/`originating_system`/`authorization` are independently
// substitutable (`{application}` is still reused for the first two, matching real
// Python's own `create_file.py`, which sets both to the exact same string), and the
// `FILE_DESCRIPTION` text is a single fully-substitutable `{description}` value rather
// than `TEMPLATE`'s own hardcoded `'ViewDefinition [{mvd}]'` (note the space before
// `[`, baked into that literal) -- `createFile.ts` needs the un-spaced literal
// `"ViewDefinition[DesignTransferView]"` real Python's `create_file.py` hardcodes,
// which isn't reachable through `TEMPLATE`'s own fixed text.
const BLANK_TEMPLATE = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('{description}'),'2;1');
FILE_NAME('{filename}','{timestring}',('{creator}'),('{organization}'),'{application}','{application}','{authorization}');
FILE_SCHEMA(('{schema_identifier}'));
ENDSEC;
DATA;
ENDSEC;
END-ISO-10303-21;
`;

// See this file's header comment for why this isn't read from package.json.
const PLACEHOLDER_VERSION = "0.9.0";

/**
 * PEP 440-compliant-*shaped* version string (Python's own docstring: "valid for use
 * with `packaging.version.parse()`"), kept here for parity even though npm's own
 * semver already satisfies the equivalent constraint -- a direct, if now somewhat
 * redundant, port rather than a silent drop.
 */
export function getPep440Version(version: string): string {
	return version.replace("-", "+");
}

function mvdFor(schemaIdentifier: string | undefined): string {
	if (schemaIdentifier === "IFC4") return "ReferenceView_V1.2";
	if (schemaIdentifier === "IFC2X3") return "CoordinationView_V2.0";
	if (schemaIdentifier === "IFC4X3_ADD2") return "ReferenceView";
	return "ReferenceView_V1.2";
}

export interface CreateOptions {
	filename?: string;
	timestring?: string;
	organization?: string;
	creator?: string;
	schemaIdentifier?: string;
	applicationVersion?: string;
	timestamp?: number;
	application?: string;
	projectGlobalId?: string;
	projectName?: string;
	mvd?: string;
	/**
	 * `FILE_NAME`'s `authorization` field (7th positional STEP header field). `TEMPLATE`
	 * (the default, non-`blank` shape) hardcodes this to `''` -- unused by any existing
	 * caller, so defaulting this option to `''` preserves that exactly. Added for
	 * `createFile.ts`'s `"Nobody"` (real Python's `create_file.py` literal).
	 */
	authorization?: string;
	/**
	 * When `true`, produces a header-only file with a genuinely empty `DATA` section
	 * (`BLANK_TEMPLATE` above) instead of `TEMPLATE`'s own pre-populated starter
	 * `IfcProject`/unit-assignment/owner-history chain. See this file's header comment
	 * (the `api.project` chunk update) for why this exists. Default `false` --
	 * preserves every existing caller's behavior exactly.
	 */
	blank?: boolean;
	/**
	 * Only consulted when `blank` is `true`: the exact `FILE_DESCRIPTION` text (single
	 * string, no surrounding quotes). Defaults to the same `'ViewDefinition [{mvd}]'`-
	 * shaped text `TEMPLATE` itself hardcodes (kept as a sensible default for any other
	 * future `blank: true` caller), but `createFile.ts` overrides this with real
	 * Python's own un-spaced literal -- see `BLANK_TEMPLATE`'s own comment.
	 */
	description?: string;
}

export function create(options: CreateOptions = {}): IfcFile {
	const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
	const schemaIdentifier = options.schemaIdentifier ?? "IFC4";
	const version = getPep440Version(PLACEHOLDER_VERSION);
	const application = options.application ?? `IfcOpenShell-TS - v${version}`;
	const applicationVersion = options.applicationVersion ?? version;
	const timestring = options.timestring ?? new Date(timestamp * 1000).toISOString().replace(/\.\d{3}Z$/, "");
	const mvd = options.mvd ?? mvdFor(schemaIdentifier);

	const values: Record<string, string | number> = {
		filename: options.filename ?? "",
		timestring,
		organization: options.organization ?? "",
		creator: options.creator ?? "",
		schema_identifier: schemaIdentifier,
		application_version: applicationVersion,
		timestamp,
		application,
		project_globalid: options.projectGlobalId ?? guid.new(),
		project_name: options.projectName ?? "",
		mvd,
		authorization: options.authorization ?? "",
		description: options.description ?? `ViewDefinition [${mvd}]`,
	};

	const templateText = options.blank ? BLANK_TEMPLATE : TEMPLATE;
	const text = templateText.replace(/\{(\w+)\}/g, (_match, key: string) => String(values[key] ?? ""));
	const buffer = Buffer.from(text, "utf-8");
	const handle = native.file_new_with_data_data_size(buffer, buffer.length);
	return new IfcFile(handle);
}
