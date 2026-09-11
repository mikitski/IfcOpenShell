// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_file.py` (src/ifcopenshell-python). That Python
// file has one test class, `TestExtractHeaderMetadata`, with two tests: `test_ifc`
// (plain `.ifc` text file) and `test_ifc_zip` (an `.ifczip` written via Python's
// `zipfile.ZipFile(..., mode="w")` with *no* explicit `compression=`/`compress_type=`,
// which defaults to `ZIP_STORED`, i.e. uncompressed). Both are ported verbatim below
// (`matches test_file.py::TestExtractHeaderMetadata.test_ifc`/`test_ifc_zip`), using
// the exact same header text fixture and the exact same field assertions.
//
// Everything else here is original coverage, written directly against `file.ts`'s own
// header comment/source (matching `util/element.ts`/`util/classification.ts`'s
// established precedent for functions Python itself doesn't directly test) --
// specifically targeting this chunk's own real investigation and the two disclosed
// Python-quirk-preservation findings:
// - A `.ifczip` entry compressed with DEFLATE (compression method 8, what the real
//   `ifcopenshell/file.py:899-903` save-as-zip path actually uses -- `test_file.py`'s
//   own fixture only exercises STORED, method 0), since that's the scenario the whole
//   "does this need real zip decompression" investigation was actually about.
// - Multi-entry archives (confirming the first Central Directory entry, matching
//   Python's `archive.filelist[0]`, is the one read -- not e.g. the last one or one
//   picked by name).
// - Malformed/unsupported-ZIP inputs (no valid EOCD, an unsupported compression
//   method) producing clear errors rather than silently mis-parsing.
// - The two preserved Python quirks: `extractIfcSpf` throwing on a short/malformed
//   header (Python's unhandled `StopIteration`) and on a `FILE_SCHEMA` line with no
//   quoted value (Python's unhandled `IndexError`).
// - `IfcHeaderExtractor.extract`'s extension dispatch (`.ifcsqlite` -> `{}`,
//   unsupported extension -> throws).
//
// No `IfcFile`/native addon involvement anywhere in this file -- `file.ts` itself has
// none either (see that file's own header comment) -- so unlike most other Phase 3
// test files, this one needs no `AVAILABLE_SCHEMAS`/`createTestFile` schema-gating at
// all.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { describe, expect, test } from "vitest";
import * as subject from "../../src/util/file";

const HEADER_EXTRACTOR_TEST_FILE_STR = `
ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition[DesignTransferView]'),'2;1');
FILE_NAME('file.ifc','2024-06-25T15:48:10+05:00',(),(),'IfcOpenShell 0.0.0','Bonsai 0.0.999999-xxxxxxx','Nobody');
FILE_SCHEMA(('IFC4X3_ADD2'));
ENDSEC;
DATA;
#1=IFCPROJECT('1U7MoqHmr8YP6jwz0pc7e0',$,'My Project',$,$,$,$,(#14,#26),#9);
ENDSEC;
END-ISO-10303-21;
`;

function checkMetadataFields(header: subject.HeaderMetadata): void {
	expect(header.description).toBe("ViewDefinition[DesignTransferView]");
	expect(header.implementationLevel).toBe("2;1");
	expect(header.name).toBe("file.ifc");
	expect(header.timeStamp).toBe("2024-06-25T15:48:10+05:00");
	expect(header.schemaName).toBe("IFC4X3_ADD2");
}

function makeTempIfcFile(content: string, filename = "test.ifc"): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ifcopenshell-ts-file-test-"));
	const filepath = path.join(dir, filename);
	fs.writeFileSync(filepath, content, "utf-8");
	return filepath;
}

/** Hand-rolls a minimal, valid, single- or multi-entry ZIP archive buffer (local file
 * header(s) + central directory file header(s) + end of central directory record), so
 * tests don't depend on any external zip tool or library. CRC-32 is written as 0 for
 * every entry -- `file.ts`'s reader never validates it (it only reads compression
 * method/sizes/offsets), matching real-world ZIP readers that treat CRC as an optional
 * integrity check, not something required to *locate* entry data. */
function buildZip(entries: ReadonlyArray<{ name: string; content: Buffer; method: 0 | 8 }>): Buffer {
	const localRecords: Buffer[] = [];
	const centralRecords: Buffer[] = [];
	let offset = 0;

	for (const entry of entries) {
		const nameBuf = Buffer.from(entry.name, "utf-8");
		const compressed = entry.method === 8 ? zlib.deflateRawSync(entry.content) : entry.content;

		const localHeader = Buffer.alloc(30);
		localHeader.writeUInt32LE(0x04034b50, 0);
		localHeader.writeUInt16LE(20, 4); // version needed
		localHeader.writeUInt16LE(0, 6); // flags
		localHeader.writeUInt16LE(entry.method, 8);
		localHeader.writeUInt16LE(0, 10); // mod time
		localHeader.writeUInt16LE(0, 12); // mod date
		localHeader.writeUInt32LE(0, 14); // crc-32 (unchecked by our reader)
		localHeader.writeUInt32LE(compressed.length, 18);
		localHeader.writeUInt32LE(entry.content.length, 22);
		localHeader.writeUInt16LE(nameBuf.length, 26);
		localHeader.writeUInt16LE(0, 28); // extra field length
		const localRecord = Buffer.concat([localHeader, nameBuf, compressed]);

		const centralHeader = Buffer.alloc(46);
		centralHeader.writeUInt32LE(0x02014b50, 0);
		centralHeader.writeUInt16LE(20, 4); // version made by
		centralHeader.writeUInt16LE(20, 6); // version needed
		centralHeader.writeUInt16LE(0, 8); // flags
		centralHeader.writeUInt16LE(entry.method, 10);
		centralHeader.writeUInt16LE(0, 12); // mod time
		centralHeader.writeUInt16LE(0, 14); // mod date
		centralHeader.writeUInt32LE(0, 16); // crc-32
		centralHeader.writeUInt32LE(compressed.length, 20);
		centralHeader.writeUInt32LE(entry.content.length, 24);
		centralHeader.writeUInt16LE(nameBuf.length, 28);
		centralHeader.writeUInt16LE(0, 30); // extra field length
		centralHeader.writeUInt16LE(0, 32); // comment length
		centralHeader.writeUInt16LE(0, 34); // disk number start
		centralHeader.writeUInt16LE(0, 36); // internal attributes
		centralHeader.writeUInt32LE(0, 38); // external attributes
		centralHeader.writeUInt32LE(offset, 42); // relative offset of local header
		const centralRecord = Buffer.concat([centralHeader, nameBuf]);

		localRecords.push(localRecord);
		centralRecords.push(centralRecord);
		offset += localRecord.length;
	}

	const localSection = Buffer.concat(localRecords);
	const centralSection = Buffer.concat(centralRecords);

	const eocd = Buffer.alloc(22);
	eocd.writeUInt32LE(0x06054b50, 0);
	eocd.writeUInt16LE(0, 4); // number of this disk
	eocd.writeUInt16LE(0, 6); // disk where central directory starts
	eocd.writeUInt16LE(entries.length, 8); // records on this disk
	eocd.writeUInt16LE(entries.length, 10); // total records
	eocd.writeUInt32LE(centralSection.length, 12); // size of central directory
	eocd.writeUInt32LE(localSection.length, 16); // offset of start of central directory
	eocd.writeUInt16LE(0, 20); // comment length

	return Buffer.concat([localSection, centralSection, eocd]);
}

function makeTempZipFile(entries: ReadonlyArray<{ name: string; content: Buffer; method: 0 | 8 }>): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ifcopenshell-ts-file-test-"));
	const filepath = path.join(dir, "test.ifczip");
	fs.writeFileSync(filepath, buildZip(entries));
	return filepath;
}

describe("util.file IfcHeaderExtractor.extract -- .ifc", () => {
	test("matches test_file.py::TestExtractHeaderMetadata.test_ifc", () => {
		const filepath = makeTempIfcFile(HEADER_EXTRACTOR_TEST_FILE_STR);
		const extractor = new subject.IfcHeaderExtractor(filepath);
		checkMetadataFields(extractor.extract());
	});
});

describe("util.file IfcHeaderExtractor.extract -- .ifczip", () => {
	test("matches test_file.py::TestExtractHeaderMetadata.test_ifc_zip (STORED, zipfile's default compression)", () => {
		const filepath = makeTempZipFile([
			{ name: "test.ifc", content: Buffer.from(HEADER_EXTRACTOR_TEST_FILE_STR, "utf-8"), method: 0 },
		]);
		const extractor = new subject.IfcHeaderExtractor(filepath);
		checkMetadataFields(extractor.extract());
	});

	test("DEFLATED entry (real ifcopenshell save-as-.ifczip path's actual compression -- ifcopenshell/file.py's own zipfile.ZIP_DEFLATED usage)", () => {
		const filepath = makeTempZipFile([
			{ name: "test.ifc", content: Buffer.from(HEADER_EXTRACTOR_TEST_FILE_STR, "utf-8"), method: 8 },
		]);
		const extractor = new subject.IfcHeaderExtractor(filepath);
		checkMetadataFields(extractor.extract());
	});

	test("reads the FIRST central directory entry when the archive has multiple entries", () => {
		const other = Buffer.from("not an ifc file at all\n", "utf-8");
		const filepath = makeTempZipFile([
			{ name: "test.ifc", content: Buffer.from(HEADER_EXTRACTOR_TEST_FILE_STR, "utf-8"), method: 0 },
			{ name: "readme.txt", content: other, method: 8 },
		]);
		const extractor = new subject.IfcHeaderExtractor(filepath);
		checkMetadataFields(extractor.extract());
	});

	test("throws a descriptive error for an unsupported compression method", () => {
		const filepath = makeTempZipFile([
			{ name: "test.ifc", content: Buffer.from(HEADER_EXTRACTOR_TEST_FILE_STR, "utf-8"), method: 0 },
		]);
		// Corrupt the compression method field of the one local + central header (byte 8
		// of the local header, byte 10 of the central directory header) to an
		// unsupported value (12 = BZIP2) after the fact, rather than teaching the test
		// helper to emit an intentionally-unsupported archive.
		const bytes = fs.readFileSync(filepath);
		bytes.writeUInt16LE(12, 8); // local file header compression method
		const centralDirOffset = bytes.readUInt32LE(bytes.length - 22 + 16);
		bytes.writeUInt16LE(12, centralDirOffset + 10); // central directory compression method
		fs.writeFileSync(filepath, bytes);

		const extractor = new subject.IfcHeaderExtractor(filepath);
		expect(() => extractor.extract()).toThrow(/[Uu]nsupported ZIP compression method 12/);
	});

	test("throws a descriptive error for a file with no end of central directory record", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ifcopenshell-ts-file-test-"));
		const filepath = path.join(dir, "not-a-zip.ifczip");
		fs.writeFileSync(filepath, Buffer.from("this is not a zip file", "utf-8"));
		const extractor = new subject.IfcHeaderExtractor(filepath);
		expect(() => extractor.extract()).toThrow(/end of central directory record not found/);
	});
});

describe("util.file IfcHeaderExtractor.extract -- extension dispatch", () => {
	test(".ifcsqlite returns an empty object (matches Python's TODO placeholder)", () => {
		const filepath = makeTempIfcFile("irrelevant content", "test.ifcsqlite");
		const extractor = new subject.IfcHeaderExtractor(filepath);
		expect(extractor.extract()).toEqual({});
	});

	test("unsupported extension throws", () => {
		const filepath = makeTempIfcFile("irrelevant content", "test.unsupported");
		const extractor = new subject.IfcHeaderExtractor(filepath);
		expect(() => extractor.extract()).toThrow("Unsupported file extension: 'unsupported'.");
	});
});

describe("util.file IfcHeaderExtractor.extractIfcSpf -- preserved Python quirks", () => {
	test("throws when the input runs out of lines before FILE_SCHEMA/50 lines (Python: unhandled StopIteration)", () => {
		const extractor = new subject.IfcHeaderExtractor("unused.ifc");
		const lines = ["ISO-10303-21;", "HEADER;", "FILE_DESCRIPTION(('x'),'2;1');"];
		expect(() => extractor.extractIfcSpf(lines)).toThrow(/ran out of lines/);
	});

	test("throws on a FILE_SCHEMA line with no quoted value (Python: unhandled IndexError)", () => {
		const extractor = new subject.IfcHeaderExtractor("unused.ifc");
		const lines = ["FILE_SCHEMA();"];
		expect(() => extractor.extractIfcSpf(lines)).toThrow(/no quoted schema name/);
	});

	test("stops parsing once FILE_SCHEMA is found, matching Python's early break", () => {
		const extractor = new subject.IfcHeaderExtractor("unused.ifc");
		const lines = ["FILE_SCHEMA(('IFC4'));", "FILE_NAME('should-not-be-parsed.ifc','2020-01-01',(),(),'x','y','z');"];
		const header = extractor.extractIfcSpf(lines);
		expect(header.schemaName).toBe("IFC4");
		expect(header.name).toBeUndefined();
	});

	test("only scans the first 50 lines, matching Python's max_lines_to_parse bound -- a FILE_SCHEMA beyond that is never seen (and, since there are enough lines overall, this does not throw either)", () => {
		const extractor = new subject.IfcHeaderExtractor("unused.ifc");
		const lines = Array.from({ length: 60 }, (_, i) => `-- filler line ${i}`);
		lines[55] = "FILE_SCHEMA(('IFC4'));";
		expect(extractor.extractIfcSpf(lines)).toEqual({});
	});
});
