// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/__init__.py`'s module-level surface (src/ifcopenshell-python):
// `open(path, format=None, ...)`, `class Error`/`class SchemaError`, `guess_format(path)`,
// `schema_by_name(schema=None, schema_version=None)`. Everything else in that file
// (`register_schema`, `set_plugin_search_paths`/`get_plugin_search_paths`/
// `clear_plugin_search_paths`, `stream2`/`stream2_from_string`/`convert_path_to_rocksdb`)
// is explicitly out of scope for this chunk -- see this chunk's own task brief:
// `register_schema` is a rare/advanced custom-EXPRESS-schema feature; the plugin-search-path
// functions are tied to `ifcopenshell.geom`'s plugin system (geometry is a documented
// post-v1 non-goal); `stream2`/`stream2_from_string`/`convert_path_to_rocksdb` are
// RocksDB/streaming, already-documented non-goals (00-overview.md §6).
//
// Naming note (real, disclosed collision): Python's `class Error(Exception)` would
// literally shadow the JS global `Error` if named identically inside this module. This
// file instead defines `IfcOpenShellError`/`IfcSchemaError` as the actual class names,
// and `index.ts` re-exports them ALSO under the real-Python names `Error`/`SchemaError`
// (a named export, opt-in for any consumer who imports it that way -- unlike a bare
// `class Error extends Error {}` declaration, this never redefines the global inside
// this module's own source, so nothing here is at risk of accidentally referencing the
// wrong `Error`).

import * as fs from "node:fs";
import * as os from "node:os";
import * as nodePath from "node:path";
import { IfcFile } from "./file";
import type { logger as NativeLogger, schema_definition as NativeSchemaDefinition } from "./native/ifcopenshell_native";
import { native } from "./native/native_loader";
import * as template from "./template";
import { extractFirstIfcOrIfcXmlEntry } from "./zip";

/** Port of `ifcopenshell.Error` -- see this file's header comment for the naming note. */
export class IfcOpenShellError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "IfcOpenShellError";
	}
}

/**
 * Port of `ifcopenshell.SchemaError`. Exported for API parity with real Python (which
 * this class exists in even for callers who only ever construct/catch it themselves),
 * but this file's own `open()` never THROWS it directly -- see the `file_open_status`
 * primitive-layer gap documented at `open()`'s own `good()`/`schema()` check (and its
 * dedicated `TODOS.md` entry): this port can't reliably identify the specific
 * `UNSUPPORTED_SCHEMA` case real Python maps to `SchemaError`, so `open()` throws the
 * more generic `IfcOpenShellError` for every parse failure instead, schema-related or
 * not.
 */
export class IfcSchemaError extends IfcOpenShellError {
	constructor(message: string) {
		super(message);
		this.name = "IfcSchemaError";
	}
}

/**
 * Port of the plain `FileNotFoundError` real Python's own `open()` raises for
 * `if not path.exists()`. Not a real Python `ifcopenshell` class (it's a Python
 * builtin), given its own name here for the same `instanceof`-friendly reason as
 * `file.ts`'s `UndoSystemError`.
 */
export class FileNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FileNotFoundError";
	}
}

/**
 * Port of the plain `LookupError` real Python's `open()` raises when a `.ifcZIP`
 * archive contains no `.ifc`/`.ifcxml` entry. Same "builtin exception, given its own
 * name" treatment as `FileNotFoundError` above.
 */
export class LookupError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "LookupError";
	}
}

/** Port of `ifcopenshell.SupportedFormat` (the `Literal[...]` type alias). */
export type SupportedFormat = ".ifc" | ".ifcZIP" | ".ifcXML" | ".ifcJSON" | ".ifcSQLite" | "rocksdb" | null;

/**
 * Port of `ifcopenshell.guess_format(path)`. Pure string/extension logic (plus one
 * filesystem stat for the directory-path special case) -- no native primitive
 * dependency at all, matching real Python's own implementation.
 *
 * Case-insensitive extension matching, exactly like real Python's `path.suffix.lower()`.
 * `path.is_dir()` in real Python returns `False` (not an exception) for a nonexistent
 * path, so the directory check here is guarded the same way.
 */
export function guessFormat(path: string): SupportedFormat {
	let isDirectory = false;
	try {
		isDirectory = fs.statSync(path).isDirectory();
	} catch {
		isDirectory = false;
	}
	if (isDirectory) return "rocksdb";

	const suffix = nodePath.extname(path).toLowerCase();
	if (suffix === ".ifc") return ".ifc";
	if (suffix === ".ifczip" || suffix === ".zip") return ".ifcZIP";
	if (suffix === ".ifcxml" || suffix === ".xml") return ".ifcXML";
	if (suffix === ".ifcjson" || suffix === ".json") return ".ifcJSON";
	if (suffix === ".ifcsqlite" || suffix === ".sqlite" || suffix === ".db") return ".ifcSQLite";
	return null;
}

// --- schema_by_name ---
//
// Real Python's `schema_by_name` calls `ifcopenshell_wrapper.schema_by_name(schema)`, a
// direct native lookup this port's primitive layer doesn't bind at all (no
// `schema_by_name`/`schema_registry`-instance-obtaining primitive exists anywhere on
// this surface -- confirmed via the C API header, not assumed, same investigation
// `util/schema.ts`'s own `getSchemaDefinition` already did for its own narrower need).
// That function already established the workaround this reuses: build a throwaway file
// via `template.create({schemaIdentifier})` and read `.schema()` off it. Its own
// signature is narrower than what's needed here, though (only the 3-member `IFC_SCHEMA`
// union, `"IFC2X3" | "IFC4" | "IFC4X3"`) -- `schema_by_name` must accept an arbitrary
// schema identifier string (including ones synthesized from `schema_version`), so this
// generalizes the same pattern with its own cache rather than importing that narrower
// function.

const SCHEMA_VERSION_PREFIXES = ["IFC", "X", "_ADD", "_TC"] as const;

const namedSchemaCache = new Map<string, NativeSchemaDefinition>();

/**
 * Port of `ifcopenshell.schema_by_name(schema=None, schema_version=None)`. See this
 * file's header comment (the "schema_by_name" section) for the primitive-layer gap and
 * the reused workaround.
 *
 * Preserves real Python's one piece of real logic: `schema="IFC4X3"` is remapped to
 * `"IFC4X3_ADD2"` before lookup (a real, disclosed alias in real Python itself, not a
 * typo) -- this port's own `template.create`/`util/schema.ts` already use the same
 * `IFC4X3_ADD2` identifier for their own IFC4X3 handling (see `util/schema.ts`'s
 * `SCHEMA_TEMPLATE_IDENTIFIER` map), confirming this is the correct, consistent
 * real-Python-equivalent identifier for this core build, not a guess.
 */
export function schemaByName(schema?: string, schemaVersion?: readonly number[]): NativeSchemaDefinition {
	const hasVersion = !!schemaVersion && schemaVersion.length > 0;
	if (!hasVersion && !schema) {
		throw new Error("Either schema or schema_version must be specified.");
	}

	let resolvedSchema: string;
	if (hasVersion) {
		// Python: `"".join("".join(map(str, t)) if t[1] else "" for t in zip(prefixes, schema_version))`.
		// `zip()` truncates to the shorter sequence -- mirrored here via `.slice(0, length)`
		// rather than assuming all 4 prefixes are always used.
		const version = schemaVersion as readonly number[];
		const prefixes = SCHEMA_VERSION_PREFIXES.slice(0, version.length);
		resolvedSchema = prefixes.map((prefix, index) => (version[index] ? `${prefix}${version[index]}` : "")).join("");
	} else {
		resolvedSchema = schema === "IFC4X3" ? "IFC4X3_ADD2" : (schema as string);
	}

	let schemaDefinition = namedSchemaCache.get(resolvedSchema);
	if (!schemaDefinition) {
		const file = template.create({ schemaIdentifier: resolvedSchema });
		schemaDefinition = file.nativeFile.schema();
		namedSchemaCache.set(resolvedSchema, schemaDefinition);
	}
	return schemaDefinition;
}

// --- open ---

export interface OpenOptions {
	/** Passed straight through to the native open primitive when set. */
	readonly?: boolean;
	/**
	 * Optional native logger instance, passed straight through if supplied. Real
	 * Python's own default (`logger_or_root(logger)`) constructs a root logger when
	 * none is given; this port has no way to construct ANY `logger` instance at all
	 * (`ifcopenshell::logger` has a deleted copy/move constructor, so wrappergen's
	 * generated constructor set has no `logger` factory -- confirmed by reading every
	 * method on the generated `logger` class, none are `static`; see `template.ts`'s
	 * own header comment for the same finding). So: when omitted, this port simply opens
	 * without a logger wired in (no native primitive requires one for the ordinary,
	 * no-explicit-logger case, unlike Python's own default-root-logger convenience).
	 */
	logger?: NativeLogger;
	/**
	 * Real Python's `should_stream` -- `ifcopenshell.stream`/RocksDB streaming backends
	 * are an explicit project non-goal (00-overview.md §6). Passing `true` throws
	 * immediately rather than silently ignoring the request.
	 */
	shouldStream?: boolean;
	/**
	 * Real Python's `mmap` -- real Python's own comment already calls this "only
	 * available for builds with USE_MMAP, not used in our main builds"; no native
	 * primitive on this port's binding surface plumbs it through either way. Passing
	 * `true` throws immediately rather than silently ignoring the request.
	 */
	mmap?: boolean;
	/**
	 * Real Python's `bypass_types` -- needs `ifcopenshell_wrapper.file.create_uninitialized()`,
	 * which has no native binding anywhere on this port's primitive layer (confirmed: no
	 * `create_uninitialized`/`file_new_uninitialized` primitive exists in the generated
	 * C API header). Passing a non-empty array throws immediately rather than silently
	 * ignoring the request.
	 */
	bypassTypes?: readonly string[];
}

function openNativeHandle(absolutePath: string, readonly: boolean, logger: NativeLogger | undefined): unknown {
	if (logger) {
		return native.file_new_with_path_with_filetype_readonly_logger(
			absolutePath,
			native.FT_AUTODETECT,
			readonly,
			logger._handle,
		);
	}
	return native.file_new_with_path_with_filetype_readonly(absolutePath, native.FT_AUTODETECT, readonly);
}

function openIfcZip(zipPath: string, options: OpenOptions): IfcFile {
	const entry = extractFirstIfcOrIfcXmlEntry(zipPath);
	if (!entry) {
		throw new LookupError(`No .ifc or .ifcXML file found in ${zipPath}`);
	}
	const tempDir = fs.mkdtempSync(nodePath.join(os.tmpdir(), "ifcopenshell-ts-zip-"));
	const tempPath = nodePath.join(tempDir, nodePath.basename(entry.name));
	try {
		fs.writeFileSync(tempPath, entry.data);
		// Recurse exactly like real Python's `open(zf.extract(name, unzipped_path),
		// logger=logger)` -- format is guessed fresh from the extracted entry's own
		// extension (not passed through), so an `.ifcxml` entry inside the zip still
		// correctly hits the `.ifcXML` `NotImplementedError` branch below, matching real
		// Python exactly.
		return open(tempPath, undefined, { logger: options.logger });
	} finally {
		try {
			fs.rmSync(tempDir, { recursive: true, force: true });
		} catch {
			// Best-effort cleanup -- matches `file.ts`'s own temp-file-cleanup precedent
			// (`toSpfTextViaTempFile`): a leftover temp dir isn't a correctness problem.
		}
	}
}

/**
 * Port of `ifcopenshell.open(path, format=None, ...)`. See this file's header comment
 * for the classes/format constant this file also exports, and the chunk-scoped
 * omissions (`register_schema`, plugin-search-path functions, `stream2`/etc., all out
 * of scope).
 *
 * Real Python's overload set (returning `file | sqlite | stream`) collapses here to a
 * single `IfcFile`-or-throw signature -- `sqlite`/`stream`/RocksDB backends are
 * explicit non-goals (00-overview.md §6), so every code path that would return one of
 * those in real Python throws a disclosed "not supported in this port" error instead.
 *
 * Example:
 * ```ts
 * const model = open("/path/to/model.ifc");
 * const model2 = open("/path/to/model.any_extension", ".ifc");
 * ```
 */
export function open(path: string, format?: SupportedFormat, options: OpenOptions = {}): IfcFile {
	if (options.shouldStream) {
		throw new IfcOpenShellError(
			"should_stream is not supported in this port -- ifcopenshell.stream/RocksDB streaming " +
				"backends are an explicit project non-goal (planning/ifcopenshell-ts/00-overview.md §6).",
		);
	}
	if (options.mmap) {
		throw new IfcOpenShellError(
			"mmap is not supported in this port -- real Python's own mmap option is only available " +
				'for builds with USE_MMAP ("not used in our main builds", per real Python\'s own comment), ' +
				"and no native primitive plumbs it through on this port's binding surface either.",
		);
	}
	if (options.bypassTypes && options.bypassTypes.length > 0) {
		throw new IfcOpenShellError(
			"bypass_types is not supported in this port -- it needs " +
				"ifcopenshell_wrapper.file.create_uninitialized(), which has no native binding anywhere " +
				"on this port's primitive layer (no create_uninitialized/file_new_uninitialized primitive " +
				"exists in the generated C API).",
		);
	}

	if (!fs.existsSync(path)) {
		throw new FileNotFoundError(`Path does not exist: '${path}'.`);
	}

	const resolvedFormat = format ?? guessFormat(path);

	if (resolvedFormat === ".ifcXML") {
		// Real Python ITSELF unconditionally throws this (not a port-specific gap) --
		// `ifcopenshell/__init__.py`'s own `open()` has never supported reading .ifcXML.
		throw new Error("Reading .ifcXML files is not currently supported.");
	}

	if (resolvedFormat === ".ifcZIP") {
		return openIfcZip(path, options);
	}

	if (resolvedFormat === ".ifcSQLite" || resolvedFormat === ".ifcJSON" || resolvedFormat === "rocksdb") {
		const label = resolvedFormat === "rocksdb" ? "RocksDB directories" : `${resolvedFormat} files`;
		throw new IfcOpenShellError(
			`Reading ${label} is not supported in this port -- SQLite/RocksDB alternate backends are an explicit project non-goal (planning/ifcopenshell-ts/00-overview.md §6).`,
		);
	}

	const absolutePath = nodePath.resolve(path);
	const handle = openNativeHandle(absolutePath, !!options.readonly, options.logger);
	const file = new IfcFile(handle);

	// *** Real, disclosed primitive-layer gap (see TODOS.md's dedicated entry) -- INCLUDING
	// a real correction to the pre-dispatch investigation's own original description of
	// it, found and verified empirically while implementing this, not assumed: ***
	//
	// `file_open_status` (`good()`'s return type) has NO value/enum accessor bound
	// anywhere on this port's native primitive layer -- confirmed: the generated
	// `file_open_status` class is a bare handle wrapper with zero methods, and the C API
	// header only exposes `ifcopenshell_file_good`/`ifcopenshell_file_open_status_free`.
	// This much was correctly anticipated going in. What was NOT correctly anticipated
	// (this is the correction): `good()` does NOT return `null` for a successfully-opened
	// file and non-null for a problem. Reading `file_open_status.h`'s real definition
	// shows `good()` returns an enum VALUE by value (`SUCCESS` included, default-
	// constructed to `UNKNOWN`), and `ifcopenshell_file_good`'s own C++ implementation
	// (`src/wrappergen/generated_napi/ifcopenshell_native_c_api.cpp`) always heap-allocates
	// a status object wrapping whatever that value is -- `nullptr` is only returned on a
	// genuine C++ exception (e.g. a disposed handle), which the generated N-API wrapper
	// (`napi_file_good`) converts into a THROWN JS exception rather than a JS `null`
	// anyway. So `good()` on this port's binding is unconditionally non-null for any live
	// handle, success or failure alike -- confirmed empirically against the built addon:
	// a known-good file's `good()` call returned a non-null handle exactly like a
	// deliberately-malformed one did. A naive "non-null means a problem" check (this
	// file's actual first draft, before this was caught) is therefore not just imprecise
	// but outright broken -- it throws for EVERY file, including well-formed ones.
	//
	// The real, verified-working substitute used instead: forcing schema resolution
	// (`file.nativeFile.schema()`) reliably throws a native "No schema loaded" exception
	// for a file that failed to parse, and does NOT throw for one that succeeded --
	// confirmed empirically for 3 of real Python's 4 error cases (a syntactically garbage
	// file, a completely empty file, and a well-formed header naming an unregistered
	// schema identifier all throw this exact message; the 4th, READ_ERROR -- the file
	// existing but being unreadable, e.g. a permissions problem -- isn't specifically
	// exercised here, but would most plausibly throw synchronously from the
	// `file_new_with_path_with_filetype_readonly` call itself before this point is even
	// reached, which this function doesn't specially catch either -- that exception is
	// left to propagate as-is, still a thrown error, just not wrapped in
	// `IfcOpenShellError`). This is coarser than real Python's 5-way `f.good().value()`
	// switch -- it can't distinguish which of the 4 problem cases occurred, and can't
	// single out the harmless UNKNOWN no-op case either (both real, disclosed
	// limitations, matching what this section always intended to disclose) -- but unlike
	// the original `good()`-nullness idea, it actually, correctly tells success from
	// failure.
	try {
		file.nativeFile.schema();
	} catch (cause) {
		const detail = cause instanceof Error ? cause.message : String(cause);
		throw new IfcOpenShellError(
			`Unable to open IFC file '${absolutePath}': ${detail}. This port's native primitive layer has no accessor for file_open_status's underlying enum value (see TODOS.md), so it can't report the specific cause (read error / missing SPF header / unsupported schema / syntax error) as precisely as real Python does.`,
			{ cause },
		);
	}

	return file;
}
