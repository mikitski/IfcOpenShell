// This file was generated with the assistance of an AI coding tool.
//
// Minimal, hand-rolled ZIP central-directory reader backing `open.ts`'s `.ifcZIP`
// branch (port of `ifcopenshell/__init__.py`'s `open()`).
//
// *** Real, disclosed decision: hand-roll this instead of adding a dependency, or
// deferring `.ifcZIP` support entirely. ***
// No ZIP-archive-reading capability exists anywhere in this port or its dependencies
// (confirmed: no zip library in `package.json`, and Node's built-in `zlib` module only
// does raw deflate/gzip streams, not the ZIP container format's central-directory
// structure). Investigated whether this is a bounded task: the ZIP format's central
// directory (a flat, fixed-layout binary index at the end of the file: an "End Of
// Central Directory" record pointing at a linear list of fixed-size-header + filename
// entries, each in turn pointing at a local file header + raw entry bytes) is a small,
// well-specified format -- reading it (find EOCD, walk the central directory, locate
// one entry's raw bytes, decompress) is comparable in scope to this project's other
// hand-rolled parsers (`util/cost.ts`'s formula parser, `api.unit`'s work), NOT a
// multi-hour rabbit hole, so this was hand-rolled rather than deferred with a
// "not yet supported" throw. Deliberately narrow, though: this reader only supports
// exactly what `open()`'s `.ifcZIP` branch needs -- "find the first `.ifc`/`.ifcxml`
// entry and return its decompressed bytes" -- not a general-purpose ZIP API.
//
// Scope, disclosed: handles the two compression methods real-world `.ifcZIP` exports
// actually use -- STORED (method 0, raw bytes, no decompression needed) and DEFLATE
// (method 8, via Node's built-in `zlib.inflateRawSync`, which is exactly the raw
// deflate stream ZIP entries use -- no gzip/zlib framing to strip). Does NOT support
// ZIP64 (>4GB archives or >65535 entries) or encrypted entries -- neither is expected
// for this project's actual `.ifcZIP` use case (IFC sample/test files are far smaller),
// and both would need real, disclosed follow-up work if ever hit; this deliberately
// doesn't attempt to guess at that unbounded generality up front.
//
// *** Security note, added on review: decompression-bomb guard ***
// This project's own Phase 1 exit criterion explicitly flags "a Node-only (server-side)
// library plausibly parsing user-uploaded .ifc files" as an untrusted-input attack
// surface (see `planning/ifcopenshell-ts/20-roadmap.md`'s Phase 1 exit criterion and
// `40-testing-strategy.md` §7) -- the identical concern applies to `.ifcZIP` archives,
// which are just as plausibly user-supplied. `zlib.inflateRawSync` has no output-size
// cap by default, so a maliciously crafted, highly-compressed small ZIP entry ("zip
// bomb") could decompress into an arbitrarily large buffer and exhaust process memory
// -- a real DoS vector this reader would otherwise introduce for the first time (unlike
// the native IFC-SPF parser, this JS-side code has no ASAN/fuzz coverage of its own).
// Guarded via Node's own `maxOutputLength` option (confirmed to throw a catchable
// `ERR_BUFFER_TOO_LARGE`, not exhaust memory, when exceeded): capped at 2GiB, matching
// this same file's own already-disclosed ZIP64 (>4GB) scope boundary -- generous enough
// for any realistic IFC file, while still bounding the worst case.

import * as fs from "node:fs";
import * as nodePath from "node:path";
import * as zlib from "node:zlib";

/** Bounds `inflateRawSync`'s own output size against a decompression-bomb attack --
 * see this file's own "Security note" above. */
const MAX_DECOMPRESSED_ENTRY_SIZE = 2 * 1024 * 1024 * 1024;

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;
const EOCD_FIXED_SIZE = 22;
const MAX_ZIP_COMMENT_SIZE = 0xffff;

export interface ZipEntry {
	/** The entry's own path as stored in the archive (matches Python's `zf.namelist()` entries). */
	name: string;
	/** Decompressed entry bytes. */
	data: Buffer;
}

/**
 * Locates the End Of Central Directory record by scanning backward from the end of the
 * buffer -- it may be followed by an arbitrary-length (but spec-bounded to 65535 bytes)
 * ZIP comment, so a fixed offset from the end can't be assumed. Standard technique for
 * reading a ZIP's directory without a streaming parser.
 */
function findEndOfCentralDirectory(buffer: Buffer): number {
	// A buffer smaller than the fixed EOCD record can never contain one -- guarded
	// explicitly so a tiny/empty file throws this function's own clean error message
	// instead of a `RangeError` from `readUInt32LE`'s own bounds check.
	if (buffer.length < EOCD_FIXED_SIZE) {
		throw new Error("Not a valid ZIP archive (no End Of Central Directory record found).");
	}
	const minOffset = Math.max(0, buffer.length - EOCD_FIXED_SIZE - MAX_ZIP_COMMENT_SIZE);
	for (let offset = buffer.length - EOCD_FIXED_SIZE; offset >= minOffset; offset--) {
		if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) {
			return offset;
		}
	}
	throw new Error("Not a valid ZIP archive (no End Of Central Directory record found).");
}

function readLocalEntryData(
	buffer: Buffer,
	localHeaderOffset: number,
	compressionMethod: number,
	compressedSize: number,
): Buffer {
	if (buffer.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_SIGNATURE) {
		throw new Error("Not a valid ZIP archive (malformed local file header).");
	}
	const nameLength = buffer.readUInt16LE(localHeaderOffset + 26);
	const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
	const dataStart = localHeaderOffset + 30 + nameLength + extraLength;
	const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

	if (compressionMethod === 0) {
		// STORED -- raw bytes, no decompression.
		return Buffer.from(compressed);
	}
	if (compressionMethod === 8) {
		// DEFLATE -- ZIP entries use the raw deflate stream (no zlib/gzip header/trailer).
		return zlib.inflateRawSync(compressed, { maxOutputLength: MAX_DECOMPRESSED_ENTRY_SIZE });
	}
	throw new Error(
		`Unsupported ZIP compression method (${compressionMethod}) -- this hand-rolled reader only supports STORED (0) and DEFLATE (8), matching what real-world .ifcZIP exports use.`,
	);
}

/**
 * Walks the ZIP central directory and returns the first entry whose extension is
 * `.ifc`/`.ifcxml` (case-insensitive), decompressed -- matches real Python's own
 * `open()` `.ifcZIP` branch: `for name in zf.namelist(): if Path(name).suffix.lower()
 * in (".ifc", ".ifcxml"): return open(zf.extract(name, unzipped_path), ...)`. Returns
 * `null` if no such entry exists (the caller raises the same `LookupError` real Python
 * raises via its `for...else`).
 */
export function extractFirstIfcOrIfcXmlEntry(zipPath: string): ZipEntry | null {
	const buffer = fs.readFileSync(zipPath);
	const eocdOffset = findEndOfCentralDirectory(buffer);
	const entryCount = buffer.readUInt16LE(eocdOffset + 10);
	let centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);

	for (let i = 0; i < entryCount; i++) {
		if (buffer.readUInt32LE(centralDirOffset) !== CENTRAL_DIRECTORY_SIGNATURE) {
			throw new Error("Not a valid ZIP archive (malformed central directory entry).");
		}
		const compressionMethod = buffer.readUInt16LE(centralDirOffset + 10);
		const compressedSize = buffer.readUInt32LE(centralDirOffset + 20);
		const nameLength = buffer.readUInt16LE(centralDirOffset + 28);
		const extraLength = buffer.readUInt16LE(centralDirOffset + 30);
		const commentLength = buffer.readUInt16LE(centralDirOffset + 32);
		const localHeaderOffset = buffer.readUInt32LE(centralDirOffset + 42);
		const nameStart = centralDirOffset + 46;
		const name = buffer.toString("utf-8", nameStart, nameStart + nameLength);

		const suffix = nodePath.extname(name).toLowerCase();
		if (suffix === ".ifc" || suffix === ".ifcxml") {
			const data = readLocalEntryData(buffer, localHeaderOffset, compressionMethod, compressedSize);
			return { name, data };
		}

		centralDirOffset = nameStart + nameLength + extraLength + commentLength;
	}

	return null;
}
