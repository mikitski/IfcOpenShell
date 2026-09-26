// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/test_open.py` (src/ifcopenshell-python), plus `guessFormat`/
// `schemaByName` coverage (no dedicated real Python test file for either -- confirmed by
// searching the real test tree; `guess_format`/`schema_by_name` are exercised only
// indirectly via `open()`'s own tests in real Python).
//
// Real Python's `TestOpen` (`test_open.py`) has several `@pytest.mark.skip("IFC-XML
// temporarily disabled")` cases. Two different situations hide behind that one skip
// reason, disambiguated below:
//   - `test_open_ifcxml`/`test_open_ifc_zip_ifcxml_format`/`test_open_anyextension_ifcxml_format`
//     genuinely need real .ifcXML *reading* support, which real Python itself doesn't
//     have (`open()`'s own `.ifcXML` branch unconditionally raises
//     `NotImplementedError` -- this is a real Python limitation, not a port-specific
//     gap). Ported here as ACTIVE (not skipped) tests of the always-true "this format
//     unconditionally throws" behavior, since that part doesn't depend on the
//     "temporarily disabled" flag at all.
//   - `test_invalid_ifcxml` genuinely needs .ifcXML content-reading to even reach the
//     assertion it's testing -- no TS counterpart makes sense for a permanently-
//     unimplemented format, so this one has no port here.
//   - `test_invalid_ifcspf` is mis-tagged with the same "IFC-XML" skip reason in real
//     Python (it doesn't touch XML at all -- tests that a malformed IFC-SPF file raises
//     `ifcopenshell.Error`), so it's ported here as an ACTIVE test.
//
// `.ifcZIP` fixtures: no zip-library dependency exists anywhere in this port (see
// `src/zip.ts`'s own header comment for the decision to hand-roll a minimal ZIP reader
// instead of deferring `.ifcZIP` support) and no committed `.ifczip`/`.zip` binary
// fixtures exist in this repo's `test/fixtures/` (the real Python suite's own
// `test/input/*.ifczip`/`*.zip` fixtures aren't present in this checkout either --
// `test/input/` is empty here). `buildMinimalZip` below builds one in memory instead,
// using the same low-level ZIP knowledge `src/zip.ts` uses to read one, just forward
// instead of backward -- test-only, deliberately not shared production code.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { describe, expect, test } from "vitest";
import { FileNotFoundError, IfcOpenShellError, LookupError, guessFormat, open, schemaByName } from "../src/open";
import * as template from "../src/template";
import { AVAILABLE_SCHEMAS } from "./bootstrap";

const FIXTURES_DIR = path.join(__dirname, "fixtures");

function tempDir(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ifcopenshell-ts-open-test-"));
}

/**
 * Minimal ZIP-archive builder, test-only (see this file's header comment). Writes
 * exactly the fields `src/zip.ts`'s `extractFirstIfcOrIfcXmlEntry` reads back --
 * doesn't bother computing real CRC-32 values (written as 0) since that reader never
 * validates them.
 */
function buildMinimalZip(entries: ReadonlyArray<{ name: string; data: Buffer; method?: 0 | 8 }>): Buffer {
	const localParts: Buffer[] = [];
	const centralParts: Buffer[] = [];
	let offset = 0;

	for (const entry of entries) {
		const method = entry.method ?? 0;
		const compressed = method === 8 ? zlib.deflateRawSync(entry.data) : entry.data;
		const nameBuf = Buffer.from(entry.name, "utf-8");

		const localHeader = Buffer.alloc(30);
		localHeader.writeUInt32LE(0x04034b50, 0);
		localHeader.writeUInt16LE(20, 4);
		localHeader.writeUInt16LE(0, 6);
		localHeader.writeUInt16LE(method, 8);
		localHeader.writeUInt16LE(0, 10);
		localHeader.writeUInt16LE(0, 12);
		localHeader.writeUInt32LE(0, 14);
		localHeader.writeUInt32LE(compressed.length, 18);
		localHeader.writeUInt32LE(entry.data.length, 22);
		localHeader.writeUInt16LE(nameBuf.length, 26);
		localHeader.writeUInt16LE(0, 28);
		localParts.push(localHeader, nameBuf, compressed);

		const centralHeader = Buffer.alloc(46);
		centralHeader.writeUInt32LE(0x02014b50, 0);
		centralHeader.writeUInt16LE(20, 4);
		centralHeader.writeUInt16LE(20, 6);
		centralHeader.writeUInt16LE(0, 8);
		centralHeader.writeUInt16LE(method, 10);
		centralHeader.writeUInt16LE(0, 12);
		centralHeader.writeUInt16LE(0, 14);
		centralHeader.writeUInt32LE(0, 16);
		centralHeader.writeUInt32LE(compressed.length, 20);
		centralHeader.writeUInt32LE(entry.data.length, 24);
		centralHeader.writeUInt16LE(nameBuf.length, 28);
		centralHeader.writeUInt16LE(0, 30);
		centralHeader.writeUInt16LE(0, 32);
		centralHeader.writeUInt16LE(0, 34);
		centralHeader.writeUInt16LE(0, 36);
		centralHeader.writeUInt32LE(0, 38);
		centralHeader.writeUInt32LE(offset, 42);
		centralParts.push(centralHeader, nameBuf);

		offset += localHeader.length + nameBuf.length + compressed.length;
	}

	const centralDirectory = Buffer.concat(centralParts);
	const centralDirOffset = offset;

	const eocd = Buffer.alloc(22);
	eocd.writeUInt32LE(0x06054b50, 0);
	eocd.writeUInt16LE(0, 4);
	eocd.writeUInt16LE(0, 6);
	eocd.writeUInt16LE(entries.length, 8);
	eocd.writeUInt16LE(entries.length, 10);
	eocd.writeUInt32LE(centralDirectory.length, 12);
	eocd.writeUInt32LE(centralDirOffset, 16);
	eocd.writeUInt16LE(0, 20);

	return Buffer.concat([...localParts, centralDirectory, eocd]);
}

function writeBlankIfc4(destPath: string): void {
	const file = template.create({ schemaIdentifier: "IFC4" });
	file.write(destPath);
	file.dispose();
}

describe("open()", () => {
	test("test_open_ifcspf: opens a real IFC-SPF file from disk", () => {
		const model = open(path.join(FIXTURES_DIR, "bug_2517_lib.ifc"));
		expect(model.schemaIdentifier).toBe("IFC4");
	});

	test(".ifcXML unconditionally throws (real Python's own permanent limitation, not a port-specific gap)", () => {
		const dir = tempDir();
		const xmlPath = path.join(dir, "model.ifcxml");
		fs.writeFileSync(xmlPath, "<ifc/>");
		expect(() => open(xmlPath)).toThrow("Reading .ifcXML files is not currently supported.");
	});

	test("test_open_ifc_zip_ifcxml_format: an .ifcxml entry inside a zip still hits the .ifcXML throw after extraction", () => {
		const dir = tempDir();
		const zipPath = path.join(dir, "model.ifczip");
		fs.writeFileSync(zipPath, buildMinimalZip([{ name: "model.ifcxml", data: Buffer.from("<ifc/>") }]));
		expect(() => open(zipPath)).toThrow("Reading .ifcXML files is not currently supported.");
	});

	test("test_open_ifc_zip_ifcspf_format: extracts and opens a STORED .ifc entry from a .ifczip archive", () => {
		const dir = tempDir();
		const ifcPath = path.join(dir, "inner.ifc");
		writeBlankIfc4(ifcPath);
		const zipPath = path.join(dir, "model.ifczip");
		fs.writeFileSync(zipPath, buildMinimalZip([{ name: "inner.ifc", data: fs.readFileSync(ifcPath), method: 0 }]));

		const model = open(zipPath);
		expect(model.schemaIdentifier).toBe("IFC4");
	});

	test("extracts and opens a DEFLATE-compressed .ifc entry from a .ifczip archive", () => {
		const dir = tempDir();
		const ifcPath = path.join(dir, "inner.ifc");
		writeBlankIfc4(ifcPath);
		const zipPath = path.join(dir, "model.ifczip");
		fs.writeFileSync(zipPath, buildMinimalZip([{ name: "inner.ifc", data: fs.readFileSync(ifcPath), method: 8 }]));

		const model = open(zipPath);
		expect(model.schemaIdentifier).toBe("IFC4");
	});

	test("test_open_zip: a plain .zip extension (not .ifczip) is also guessed as .ifcZIP and opens", () => {
		const dir = tempDir();
		const ifcPath = path.join(dir, "inner.ifc");
		writeBlankIfc4(ifcPath);
		const zipPath = path.join(dir, "model.zip");
		fs.writeFileSync(zipPath, buildMinimalZip([{ name: "inner.ifc", data: fs.readFileSync(ifcPath) }]));

		const model = open(zipPath);
		expect(model.schemaIdentifier).toBe("IFC4");
	});

	test(".ifcZIP with no .ifc/.ifcxml entry throws LookupError, matching real Python's for-else", () => {
		const dir = tempDir();
		const zipPath = path.join(dir, "model.ifczip");
		fs.writeFileSync(zipPath, buildMinimalZip([{ name: "readme.txt", data: Buffer.from("hello") }]));
		expect(() => open(zipPath)).toThrow(LookupError);
	});

	test("test_open_anyextension_ifcspf_format: an unrecognized extension still parses as IFC-SPF (native content-based autodetection, no format guessed)", () => {
		const dir = tempDir();
		const anyPath = path.join(dir, "model.anyextension");
		writeBlankIfc4(anyPath);
		expect(guessFormat(anyPath)).toBeNull();

		const model = open(anyPath);
		expect(model.schemaIdentifier).toBe("IFC4");
	});

	test("test_open_anyextension_ifczip_ifcspf_format: explicit format override (.ifcZIP) on an unrecognized extension", () => {
		const dir = tempDir();
		const ifcPath = path.join(dir, "inner.ifc");
		writeBlankIfc4(ifcPath);
		const zipPath = path.join(dir, "model.anyextension");
		fs.writeFileSync(zipPath, buildMinimalZip([{ name: "inner.ifc", data: fs.readFileSync(ifcPath) }]));

		const model = open(zipPath, ".ifcZIP");
		expect(model.schemaIdentifier).toBe("IFC4");
	});

	test("test_open_anyextension_ifcxml_format: explicit format override (.ifcXML) throws regardless of actual content", () => {
		const dir = tempDir();
		const anyPath = path.join(dir, "model.anyextension");
		writeBlankIfc4(anyPath); // real IFC-SPF content -- the override, not content sniffing, decides the format.
		expect(() => open(anyPath, ".ifcXML")).toThrow("Reading .ifcXML files is not currently supported.");
	});

	test("test_invalid_ifcspf: a malformed IFC-SPF file throws IfcOpenShellError (real Python's ifcopenshell.Error)", () => {
		const dir = tempDir();
		const invalidPath = path.join(dir, "invalid.ifc");
		fs.writeFileSync(invalidPath, "this is not a valid IFC-SPF file at all\n{{{garbage}}}");
		expect(() => open(invalidPath)).toThrow(IfcOpenShellError);
	});

	test("raises FileNotFoundError, with real Python's exact message shape, for a nonexistent path", () => {
		const missingPath = path.join(tempDir(), "does-not-exist.ifc");
		expect(() => open(missingPath)).toThrow(FileNotFoundError);
		expect(() => open(missingPath)).toThrow(`Path does not exist: '${missingPath}'.`);
	});

	test("readonly option is passed through and a readonly-opened file still reads back correctly", () => {
		const model = open(path.join(FIXTURES_DIR, "bug_2517_lib.ifc"), undefined, { readonly: true });
		expect(model.schemaIdentifier).toBe("IFC4");
	});

	test("should_stream throws a disclosed 'not supported in this port' error (ifcopenshell.stream is a non-goal)", () => {
		expect(() => open(path.join(FIXTURES_DIR, "bug_2517_lib.ifc"), undefined, { shouldStream: true })).toThrow(
			IfcOpenShellError,
		);
	});

	test("mmap throws a disclosed 'not supported in this port' error", () => {
		expect(() => open(path.join(FIXTURES_DIR, "bug_2517_lib.ifc"), undefined, { mmap: true })).toThrow(
			IfcOpenShellError,
		);
	});

	test("bypassTypes throws a disclosed 'not supported in this port' error", () => {
		expect(() => open(path.join(FIXTURES_DIR, "bug_2517_lib.ifc"), undefined, { bypassTypes: ["IfcWall"] })).toThrow(
			IfcOpenShellError,
		);
	});

	test(".ifcSQLite/.ifcJSON/rocksdb formats throw a disclosed 'not supported in this port' error (explicit non-goals)", () => {
		const dir = tempDir();

		const sqlitePath = path.join(dir, "model.sqlite");
		fs.writeFileSync(sqlitePath, "not a real sqlite file");
		expect(() => open(sqlitePath)).toThrow(IfcOpenShellError);

		const jsonPath = path.join(dir, "model.json");
		fs.writeFileSync(jsonPath, "{}");
		expect(() => open(jsonPath)).toThrow(IfcOpenShellError);

		const rocksdbDir = path.join(dir, "model-rocksdb");
		fs.mkdirSync(rocksdbDir);
		expect(() => open(rocksdbDir)).toThrow(IfcOpenShellError);
	});
});

describe("guessFormat()", () => {
	test("real Python's own documented extension -> format mapping, case-insensitive", () => {
		expect(guessFormat("model.ifc")).toBe(".ifc");
		expect(guessFormat("MODEL.IFC")).toBe(".ifc");
		expect(guessFormat("model.ifczip")).toBe(".ifcZIP");
		expect(guessFormat("model.zip")).toBe(".ifcZIP");
		expect(guessFormat("MODEL.ZIP")).toBe(".ifcZIP");
		expect(guessFormat("model.ifcxml")).toBe(".ifcXML");
		expect(guessFormat("model.xml")).toBe(".ifcXML");
		expect(guessFormat("model.ifcjson")).toBe(".ifcJSON");
		expect(guessFormat("model.json")).toBe(".ifcJSON");
		expect(guessFormat("model.ifcsqlite")).toBe(".ifcSQLite");
		expect(guessFormat("model.sqlite")).toBe(".ifcSQLite");
		expect(guessFormat("model.db")).toBe(".ifcSQLite");
	});

	test("an unrecognized extension guesses to null", () => {
		expect(guessFormat("model.anyextension")).toBeNull();
		expect(guessFormat("model")).toBeNull();
	});

	test("a directory path guesses to 'rocksdb'", () => {
		const dir = tempDir();
		expect(guessFormat(dir)).toBe("rocksdb");
	});

	test("a nonexistent path doesn't throw, and isn't treated as a directory", () => {
		expect(guessFormat(path.join(tempDir(), "does-not-exist.ifc"))).toBe(".ifc");
	});
});

describe("schemaByName()", () => {
	test.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("resolves 'IFC4' directly", () => {
		const schema = schemaByName("IFC4");
		expect(schema.name()).toBe("IFC4");
	});

	test.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
		"remaps 'IFC4X3' to 'IFC4X3_ADD2' before lookup, matching real Python's own disclosed alias",
		() => {
			const schema = schemaByName("IFC4X3");
			expect(schema.name()).toBe("IFC4X3_ADD2");
		},
	);

	test.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("resolves 'IFC2X3' directly (no remapping)", () => {
		const schema = schemaByName("IFC2X3");
		expect(schema.name()).toBe("IFC2X3");
	});

	test.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))(
		"schema_version=(4,) resolves via the same zip-truncation logic real Python's own construction uses",
		() => {
			// Only the realistic, always-available (4,) case is exercised end-to-end against
			// the native layer here -- a longer tuple (e.g. (4, 0, 2, 1), real Python's own
			// docstring example for "IFC4 ADD2 TC1") would synthesize an identifier
			// ("IFC4_ADD2_TC1") that isn't necessarily registered by every build (this
			// project's own CI/local builds only register plain "IFC4"/"IFC2X3"/
			// "IFC4X3_ADD2"), so it isn't asserted against the native lookup here -- the
			// same prefix-joining logic is already exercised structurally by this case
			// (each prefix's own "skip if falsy" branch is reachable via a shorter tuple too).
			const schema = schemaByName(undefined, [4]);
			expect(schema.name()).toBe("IFC4");
		},
	);

	test("throws when neither schema nor schema_version is given, matching real Python's own assertion", () => {
		expect(() => schemaByName()).toThrow("Either schema or schema_version must be specified.");
	});

	test.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))(
		"caches and returns the identical schema_definition object for repeated calls",
		() => {
			const first = schemaByName("IFC4");
			const second = schemaByName("IFC4");
			expect(first).toBe(second);
		},
	);
});
