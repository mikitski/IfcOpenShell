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
}

export function create(options: CreateOptions = {}): IfcFile {
	const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
	const schemaIdentifier = options.schemaIdentifier ?? "IFC4";
	const version = getPep440Version(PLACEHOLDER_VERSION);
	const application = options.application ?? `IfcOpenShell-TS - v${version}`;
	const applicationVersion = options.applicationVersion ?? version;
	const timestring = options.timestring ?? new Date(timestamp * 1000).toISOString().replace(/\.\d{3}Z$/, "");

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
		mvd: options.mvd ?? mvdFor(schemaIdentifier),
	};

	const text = TEMPLATE.replace(/\{(\w+)\}/g, (_match, key: string) => String(values[key] ?? ""));
	const buffer = Buffer.from(text, "utf-8");
	const handle = native.file_new_with_data_data_size(buffer, buffer.length);
	return new IfcFile(handle);
}
