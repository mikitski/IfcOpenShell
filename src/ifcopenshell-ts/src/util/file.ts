// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/file.py` (src/ifcopenshell-python, 116 lines)
// -- `planning/ifcopenshell-ts/research/03-python-util-inventory.md`'s "file.py" entry.
// Unlike every other Phase 3 Tier A chunk so far, this module has no dependency on
// `ifcopenshell.util.element`/`ifcopenshell` core at all -- it deliberately parses the
// STEP header of an `.ifc`/`.ifczip` file as plain text, *without* building a full
// `ifcopenshell.file` model (see the Python docstring: "extracting header information
// ... without recreating the entire file as `ifcopenshell.file`"). No `IfcFile`/native
// dependency, pure `node:fs`/`node:zlib` (both stdlib).
//
// Ported in full: `HeaderMetadata` (as an interface, snake_case keys renamed to
// camelCase per this project's own established convention -- see e.g.
// `util/migrator.ts`'s `MigratorOptions.fallbackElementToProxy` for
// `fallback_element_to_proxy`), `IfcHeaderExtractor` (`extract`/`extractIfcSpf`/
// `extractIfcZip`).
//
// *** The one real investigation this chunk required: does reading `.ifczip` need a
// real ZIP-reading capability, and if so, is a new npm dependency actually necessary? ***
//
// `package.json` has no zip-capable dependency today (confirmed: grepped the full
// dependency list, nothing zip-related). The question this chunk had to answer before
// writing any code: is `extract_ifc_zip` (`archive = zipfile.ZipFile(self.filepath, "r");
// return self.extract_ifc_spf(archive.open(archive.filelist[0]))`) satisfiable with Node
// built-ins alone, or does it need real zip-entry decompression that only a library
// realistically provides?
//
// Investigated and confirmed: this genuinely needs real decompression, not just
// magic-byte sniffing -- `.ifczip` files produced by the real save path
// (`ifcopenshell/file.py:899-903`, `zipfile.ZipFile(path, "w").write(..., compress_type=
// zipfile.ZIP_DEFLATED)`) use DEFLATE compression, not just STORED (the test file in
// `test/util/test_file.py::test_ifc_zip` happens to write with `zipfile`'s *default*
// `ZIP_STORED`, but that test artifact is not representative of what this function must
// actually handle in the wild). However, this turned out to be a small, hand-rollable
// case, not a real blocker: Node's built-in `node:zlib` exposes `inflateRawSync`, which
// implements exactly the raw DEFLATE algorithm ZIP's "compression method 8" entries use
// (RFC 1951, the same algorithm `zipfile.ZIP_DEFLATED` wraps) -- no npm dependency
// needed for the decompression half. The remaining piece -- finding *where* in the file
// the first entry's compressed bytes live -- is locating and reading a few fixed-layout
// binary records (the End Of Central Directory record, one Central Directory File
// Header, one Local File Header; all documented, stable, decades-old formats), not
// implementing general ZIP read/write/modify support. `readIfcZipFirstEntry` below does
// exactly that: parse the EOCD (scanning backward for its signature, since it can be
// followed by a variable-length comment), read the first Central Directory entry (Python
// `archive.filelist[0]` order == Central Directory record order, which this reproduces
// by taking the first CD entry), locate its Local File Header via the CD's
// `local_header_offset`, and return the entry's raw compressed bytes (trusting the
// Central Directory's `compressed_size`/`compression_method`, not the Local File
// Header's copies -- the CD is authoritative regardless of whether a producer used the
// "sizes in a trailing data descriptor" streaming variant). Handles compression method 0
// (STORED, copy verbatim) and 8 (DEFLATED, `zlib.inflateRawSync`); any other method
// throws a clear, descriptive error rather than silently mis-parsing. This is
// deliberately scoped to "read the first entry's bytes out of a well-formed ZIP" --
// *not* a general ZIP reader: no ZIP64 support (throws a clear error if the EOCD's
// central-directory offset/size sentinel values indicate ZIP64 is in play -- astronomically
// unlikely for an IFC header-only read, since `.ifczip` files needing ZIP64 would be
// >4GiB), no multi-entry enumeration, no write support (this module only ever reads).
// **If a future caller needs real general-purpose ZIP read/write (e.g. porting
// `ifcopenshell/file.py`'s own `write(..., zipped=True)` path, or `util/doc.py`'s/
// `util/generate_pset_templates.py`'s bundled-data-zip reads), that is a materially
// bigger ask than this file's narrow "read one entry's bytes" need and should be
// re-evaluated then** -- flagged here rather than assumed to already be solved by this
// chunk's narrow parser.
//
// Preserved-verbatim, disclosed Python quirks (per this project's verbatim-translation
// mandate -- see e.g. `util/system.ts`'s header comment for the same category of
// disclosure):
//
// 1. `extract_ifc_spf`'s `for _ in range(50): line = next(ifc_file)` loop has no
//    `try`/`except StopIteration` around it. If the file/entry has fewer than 50 lines
//    and no `FILE_SCHEMA` line is found before it runs out, Python's `next()` raises
//    `StopIteration`, unhandled, propagating out of `extract_ifc_spf`/`extract` to the
//    caller -- i.e. a short/malformed header on a file shorter than where
//    `FILE_SCHEMA` would appear crashes the whole call instead of returning partial
//    data. `extractIfcSpf` below reproduces this: it throws (rather than returning
//    whatever partial `HeaderMetadata` it had accumulated) if the line source is
//    exhausted before hitting 50 lines or a `FILE_SCHEMA` line. In practice this never
//    fires for any real, complete IFC file (`FILE_SCHEMA` always appears within the
//    first ~10 header lines) -- this reproduces a real Python behavior for malformed
//    input, not a hypothetical one.
// 2. The `FILE_SCHEMA` branch does `data["schema_name"] = line.split("'")[1]` with no
//    bounds check (unlike the `FILE_DESCRIPTION`/`FILE_NAME` branches, which only
//    assign when the corresponding split index is actually present) -- a line that
//    starts with `"FILE_SCHEMA"` but contains no `'` at all raises Python's own
//    `IndexError: list index out of range`, unhandled. Reproduced below by throwing
//    (not silently assigning `undefined`, which is what a bare `parts[1]` would do in
//    JS with no error).
//
// No native/N-API involvement at all in this module -- it never touches an
// `ifcopenshell::file`/`entity_instance`, so none of the primitive-layer gaps tracked
// elsewhere in `TODOS.md` apply here.
//
// One deliberate, disclosed performance-only divergence: Python's `extract_ifc_spf`
// receives an already-open file iterator and only ever reads as many lines as it needs
// (up to 50, or until `FILE_SCHEMA`) directly off disk. `extractIfcSpf`/`extract` below
// read the *entire* `.ifc` file (or, for `.ifczip`, the entire archive plus the fully
// decompressed first entry) into memory up front via `fs.readFileSync`/the ZIP parser
// above, then operate on the in-memory content -- no different in *output* for any file
// that isn't pathologically large, but does mean this port always pays full-file I/O and
// (for STORED/DEFLATED alike) full-entry decompression cost rather than Python's
// early-exit-on-`FILE_SCHEMA` laziness. Not fixed here: a bounded/streamed read would
// need meaningfully more code (chunked reads, a UTF-8-boundary-safe decoder for text
// split across chunks) for a benefit that only matters for unusually large files being
// probed purely for header metadata -- disproportionate for this module's scope, same
// judgment call as `util/date.ts`'s `stringToDate` fuzzy-parsing gap (see `TODOS.md`).
// Flagged here rather than silently assumed away.

import * as fs from "node:fs";
import * as zlib from "node:zlib";

/** Python: `class HeaderMetadata(TypedDict)`. Every field is `NotRequired` in Python
 * (optional here too). Field names renamed snake_case -> camelCase per this project's
 * convention; `description` is `FILE_DESCRIPTION`'s first quoted string (NOT the
 * description from `FILE_NAME`, matching the Python field's own comment). */
export interface HeaderMetadata {
	name?: string;
	description?: string;
	implementationLevel?: string;
	timeStamp?: string;
	schemaName?: string;
}

const MAX_LINES_TO_PARSE = 50;

/** Mirrors Python's own text-mode file iteration: splits on any of `\r\n`/`\r`/`\n`
 * (universal newlines) and -- unlike a naive `split()` -- does not produce a trailing
 * empty "line" for a file that ends with a line terminator (Python's line iterator
 * doesn't yield one either). Needed so the exhaustion check in `extractIfcSpf` (finding
 * #1 above) counts lines the same way Python's `next()`-based loop would. */
function splitLinesLikePython(content: string): string[] {
	if (content.length === 0) return [];
	const lines = content.split(/\r\n|\r|\n/);
	if (lines.length > 0 && lines[lines.length - 1] === "" && /[\r\n]$/.test(content)) {
		lines.pop();
	}
	return lines;
}

/** An utility class for extracting header information from IFC files.
 *
 * This class provides functionality to extract key metadata from the header section of
 * IFC files without recreating the entire file as `ifcopenshell.file`. For optimization,
 * extractor will search only for the first 50 lines of the IFC file for metadata.
 *
 * Supported formats: .ifc, .ifczip.
 *
 * Python: `class IfcHeaderExtractor`. */
export class IfcHeaderExtractor {
	constructor(private readonly filepath: string) {}

	extract(): HeaderMetadata {
		// Python: `extension = self.filepath.split(".")[-1]` -- a path with no "." at all
		// yields the whole path as "extension", reproduced verbatim by mirroring the exact
		// `split(".")`/last-element semantics rather than e.g. `path.extname`.
		const segments = this.filepath.split(".");
		const extension = segments[segments.length - 1] ?? "";
		const lower = extension.toLowerCase();
		if (lower === "ifc") {
			const content = fs.readFileSync(this.filepath, "utf-8");
			return this.extractIfcSpf(splitLinesLikePython(content));
		}
		if (lower === "ifczip") {
			return this.extractIfcZip();
		}
		if (lower === "ifcsqlite") {
			return {}; // TODO (matches Python's own unimplemented placeholder)
		}
		throw new Error(`Unsupported file extension: '${extension}'.`);
	}

	/** Python: `extract_ifc_spf(self, ifc_file: Union[IO[bytes], IO[str]])`. Python
	 * receives an open file iterator and calls `next()` on it up to 50 times; this port
	 * receives the already-split lines (see this file's header comment, finding #1, for
	 * why running out of lines before `FILE_SCHEMA`/50 lines throws rather than returning
	 * partial data, matching Python's own unhandled `StopIteration`). */
	extractIfcSpf(lines: readonly string[]): HeaderMetadata {
		// https://www.steptools.com/stds/step/IS_final_p21e3.html#clause-8
		const data: HeaderMetadata = {};
		for (let i = 0; i < MAX_LINES_TO_PARSE; i++) {
			if (i >= lines.length) {
				throw new Error(
					"IfcHeaderExtractor.extractIfcSpf: ran out of lines before finding " +
						"FILE_SCHEMA (matches Python's `next()` on an exhausted file iterator " +
						"raising StopIteration, unhandled by extract_ifc_spf).",
				);
			}
			const line = lines[i] as string;
			if (line.startsWith("FILE_DESCRIPTION")) {
				const parts = line.split("'");
				if (parts.length > 1) data.description = parts[1];
				if (parts.length > 3) data.implementationLevel = parts[3];
			} else if (line.startsWith("FILE_NAME")) {
				const parts = line.split("'");
				if (parts.length > 1) data.name = parts[1];
				if (parts.length > 3) data.timeStamp = parts[3];
			} else if (line.startsWith("FILE_SCHEMA")) {
				const parts = line.split("'");
				if (parts.length < 2) {
					// Python: `line.split("'")[1]` with no bound check -- IndexError.
					throw new Error(
						"IfcHeaderExtractor.extractIfcSpf: 'FILE_SCHEMA' line has no quoted " +
							"schema name (matches Python's unhandled IndexError: list index " +
							"out of range).",
					);
				}
				data.schemaName = parts[1];
				break;
			}
		}
		return data;
	}

	/** Python: `extract_ifc_zip(self)` -- opens `self.filepath` as a ZIP archive and reads
	 * the header out of its first entry (`archive.filelist[0]`), decoding it as UTF-8. See
	 * this file's header comment for the full investigation into why/how this is done
	 * without a new npm dependency. */
	extractIfcZip(): HeaderMetadata {
		const archive = fs.readFileSync(this.filepath);
		const entryBytes = readIfcZipFirstEntry(archive);
		const content = entryBytes.toString("utf-8");
		return this.extractIfcSpf(splitLinesLikePython(content));
	}
}

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const EOCD_MIN_SIZE = 22;
const MAX_COMMENT_LENGTH = 0xffff;

/** Locates and returns the raw (decompressed) bytes of the first entry (in Central
 * Directory order, matching Python `zipfile.ZipFile.filelist[0]`) of a ZIP archive
 * buffer. Supports compression methods 0 (STORED) and 8 (DEFLATED) -- the only two
 * `zipfile` itself ever writes (`ZIP_STORED`/`ZIP_DEFLATED`) and the only two any
 * mainstream ZIP writer commonly produces. See this file's header comment for the full
 * scope disclosure (no ZIP64, no multi-entry enumeration, read-only). */
function readIfcZipFirstEntry(archive: Buffer): Buffer {
	const eocdOffset = findEndOfCentralDirectory(archive);
	const centralDirectoryOffset = archive.readUInt32LE(eocdOffset + 16);
	const totalEntries = archive.readUInt16LE(eocdOffset + 10);
	if (totalEntries === 0) {
		throw new Error("Not a valid ZIP archive: central directory has no entries.");
	}
	if (centralDirectoryOffset === 0xffffffff) {
		throw new Error(
			"ZIP64 archives are not supported by this reader (central directory offset " +
				"is the ZIP64 sentinel value); this only reads well-formed ZIP archives " +
				"under the ~4GiB ZIP64 threshold.",
		);
	}

	const cdSignature = archive.readUInt32LE(centralDirectoryOffset);
	if (cdSignature !== CENTRAL_DIRECTORY_SIGNATURE) {
		throw new Error("Not a valid ZIP archive: central directory file header not found at expected offset.");
	}
	const compressionMethod = archive.readUInt16LE(centralDirectoryOffset + 10);
	const compressedSize = archive.readUInt32LE(centralDirectoryOffset + 20);
	const fileNameLength = archive.readUInt16LE(centralDirectoryOffset + 28);
	const localHeaderOffset = archive.readUInt32LE(centralDirectoryOffset + 42);
	if (compressedSize === 0xffffffff || localHeaderOffset === 0xffffffff) {
		throw new Error(
			"ZIP64 archives are not supported by this reader (a central directory field " + "is the ZIP64 sentinel value).",
		);
	}
	void fileNameLength; // not needed: the local file header carries its own copy of the lengths.

	const lfhSignature = archive.readUInt32LE(localHeaderOffset);
	if (lfhSignature !== LOCAL_FILE_HEADER_SIGNATURE) {
		throw new Error("Not a valid ZIP archive: local file header not found at expected offset.");
	}
	const localFileNameLength = archive.readUInt16LE(localHeaderOffset + 26);
	const localExtraFieldLength = archive.readUInt16LE(localHeaderOffset + 28);
	const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
	const dataEnd = dataStart + compressedSize;
	if (dataEnd > archive.length) {
		throw new Error("Not a valid ZIP archive: entry data runs past the end of the file.");
	}
	const compressedData = archive.subarray(dataStart, dataEnd);

	if (compressionMethod === 0) {
		return Buffer.from(compressedData);
	}
	if (compressionMethod === 8) {
		return zlib.inflateRawSync(compressedData);
	}
	throw new Error(
		`Unsupported ZIP compression method ${compressionMethod} for the archive's first entry -- only STORED (0) and DEFLATED (8) are supported.`,
	);
}

/** Scans backward from the end of the buffer for the End Of Central Directory record's
 * signature -- it can be followed by a variable-length (up to 65535 bytes) comment
 * field, so its exact position isn't fixed. */
function findEndOfCentralDirectory(archive: Buffer): number {
	if (archive.length < EOCD_MIN_SIZE) {
		throw new Error("Not a valid ZIP archive: file is too small to contain an end of central directory record.");
	}
	const searchStart = Math.max(0, archive.length - EOCD_MIN_SIZE - MAX_COMMENT_LENGTH);
	for (let offset = archive.length - EOCD_MIN_SIZE; offset >= searchStart; offset--) {
		if (archive.readUInt32LE(offset) === EOCD_SIGNATURE) {
			return offset;
		}
	}
	throw new Error("Not a valid ZIP archive: end of central directory record not found.");
}
