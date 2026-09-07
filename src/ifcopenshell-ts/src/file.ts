// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/file.py`'s `file_mixin`/`Transaction`
// (src/ifcopenshell-python) -- planning/ifcopenshell-ts/research/01-python-core-and-lowlevel.md
// SS1/SS2.2.
//
// Explicitly excluded from this chunk (per 20-roadmap.md's Phase 2 scope and
// research/01 SS2.2's own notes): `rocksdb_file_storage`/`rocksdb_lazy_instance`
// (native RocksDB-backed lazy storage), `header`/`mvd`/`assignHeaderFrom` (the
// primitive layer exposes `file.header(): spf_header` but `spf_header` has no
// `file_description()`/`file_name()`/`file_schema()` sub-entity accessors --
// Python's `spf_header.file_description_py`/etc. only exist as SWIG-only glue,
// research/01 SS5 -- and neither is in this chunk's required method list).
//
// A real, disclosed primitive-layer gap surfaced while building this chunk: there is
// no native `traverse`/`entity_names`/bulk-enumeration primitive for "every entity in
// the file" beyond by-declaration-name queries -- see `[Symbol.iterator]`'s doc
// comment below for how this is worked around (a schema-driven per-declaration scan,
// not a pure-TS attribute walk) now that `traverse`/`traverse_breadth_first`
// themselves *are* real primitives (added by this chunk, see the final report).

import { EntityInstance, referencesTarget } from "./entityInstance";
import {
	type declaration as NativeDeclaration,
	entity_instance as NativeEntityInstance,
	file as NativeFile,
} from "./native/ifcopenshell_native";

export type InverseReference = [number, unknown];
export type ElementInverses = Record<number, InverseReference[]>;

export type TransactionOperation =
	| { action: "create"; value: Record<string, unknown> }
	| { action: "edit"; id: number; index: number; old: unknown; new: unknown }
	| { action: "delete"; inverses: ElementInverses; value: Record<string, unknown> }
	| { action: "batch_delete"; inverses: ElementInverses };

/** Port of `ifcopenshell.file.UndoSystemError`. */
export class UndoSystemError extends Error {
	readonly transaction: Transaction;

	constructor(message: string, transaction: Transaction, cause?: unknown) {
		super(message, cause === undefined ? undefined : { cause });
		this.name = "UndoSystemError";
		this.transaction = transaction;
	}
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof EntityInstance);
}

/**
 * Port of `ifcopenshell.file.Transaction`. Pure logic, engine-independent (per
 * research/01 SS2.2: "directly portable to TS") -- records
 * create/edit/delete/batch_delete operations, walking attribute trees converting
 * `EntityInstance` <-> `{id}`/`{type, value}` dicts for storage exactly like Python.
 */
export class Transaction {
	operations: TransactionOperation[] = [];
	isBatched = false;
	batchDeleteIndex = 0;
	batchDeleteIds = new Set<number>();
	batchInverses: ElementInverses[] = [];

	constructor(readonly file: IfcFile) {}

	serialiseEntityInstance(element: EntityInstance): Record<string, unknown> {
		const info = element.getInfo();
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(info)) {
			result[key] = this.serialiseValue(element, value);
		}
		return result;
	}

	serialiseValue(element: EntityInstance, value: unknown): unknown {
		return EntityInstance.walk(
			(v) => v instanceof EntityInstance,
			(v) => {
				const inst = v as EntityInstance;
				const id = inst.id();
				if (id) return { id };
				return { type: inst.isA(), value: inst.getByIndex(0) };
			},
			value,
		);
	}

	unserialiseValue(element: EntityInstance, value: unknown): unknown {
		return EntityInstance.walk(
			isPlainObject,
			(v) => {
				const dict = v as { id?: number; type?: string; value?: unknown };
				if (dict.id) return this.file.byId(dict.id);
				return this.file.createEntity(dict.type as string, dict.value);
			},
			value,
		);
	}

	batch(): void {
		this.isBatched = true;
		this.batchDeleteIndex = this.operations.length;
		this.batchDeleteIds = new Set();
		this.batchInverses = [];
	}

	unbatch(): void {
		for (const inverses of this.batchInverses) {
			if (Object.keys(inverses).length > 0) {
				this.operations.splice(this.batchDeleteIndex, 0, { action: "batch_delete", inverses });
			}
		}
		this.isBatched = false;
		this.batchDeleteIndex = 0;
		this.batchDeleteIds = new Set();
		this.batchInverses = [];
	}

	storeCreate(element: EntityInstance): void {
		if (element.id()) {
			this.operations.push({ action: "create", value: this.serialiseEntityInstance(element) });
		}
	}

	storeEdit(element: EntityInstance, index: number, value: unknown): void {
		if (element.id()) {
			this.operations.push({
				action: "edit",
				id: element.id(),
				index,
				old: this.serialiseValue(element, element.getByIndex(index)),
				new: this.serialiseValue(element, value),
			});
		}
	}

	storeDelete(element: EntityInstance): void {
		let inverses: ElementInverses = {};
		if (this.isBatched) {
			if (!this.batchDeleteIds.has(element.id())) {
				this.batchInverses.push(this.getElementInverses(element));
			}
			this.batchDeleteIds.add(element.id());
		} else {
			inverses = this.getElementInverses(element);
		}
		this.operations.push({ action: "delete", inverses, value: this.serialiseEntityInstance(element) });
	}

	getElementInverses(element: EntityInstance): ElementInverses {
		const inverses: ElementInverses = {};
		for (const inverse of this.file.getInverse(element) as Set<EntityInstance>) {
			const inverseReferences: InverseReference[] = [];
			const count = inverse.attributeCount();
			for (let index = 0; index < count; index++) {
				const attribute = inverse.getByIndex(index);
				if (this.hasElementReference(attribute, element)) {
					inverseReferences.push([index, this.serialiseValue(inverse, attribute)]);
				}
			}
			inverses[inverse.id()] = inverseReferences;
		}
		return inverses;
	}

	hasElementReference(value: unknown, element: EntityInstance): boolean {
		if (Array.isArray(value)) {
			return value.some((v) => this.hasElementReference(v, element));
		}
		return value instanceof EntityInstance && value.equals(element);
	}

	rollback(): void {
		for (const operation of [...this.operations].reverse()) {
			if (operation.action === "create") {
				const element = this.file.byId(operation.value.id as number);
				try {
					// hack, otherwise ifcopenshell gets upset -- matches Python's own comment
					if (element.get("GlobalId") === null) {
						element.set("GlobalId", "x");
					}
				} catch {
					// this class has no GlobalId attribute; matches Python's `hasattr` guard
				}
				this.file.remove(element);
			} else if (operation.action === "edit") {
				const element = this.file.byId(operation.id);
				try {
					element.setByIndex(operation.index, this.unserialiseValue(element, operation.old));
				} catch {
					// Catch discrepancy where IfcOpenShell creates but doesn't allow editing
					// of invalid values.
				}
			} else if (operation.action === "delete") {
				const e = this.file.createEntityWithId(operation.value.type as string, operation.value.id as number);
				for (const [k, v] of Object.entries(operation.value)) {
					if (k === "id" || k === "type") continue;
					try {
						e.set(k, this.unserialiseValue(e, v));
					} catch {
						// ditto
					}
				}
				for (const [inverseId, data] of Object.entries(operation.inverses)) {
					const inverse = this.file.byId(Number(inverseId));
					for (const [index, value] of data) {
						inverse.setByIndex(index, this.unserialiseValue(inverse, value));
					}
				}
			} else {
				// batch_delete
				for (const [inverseId, data] of Object.entries(operation.inverses)) {
					const inverse = this.file.byId(Number(inverseId));
					for (const [index, value] of data) {
						inverse.setByIndex(index, this.unserialiseValue(inverse, value));
					}
				}
			}
		}
	}

	commit(): void {
		for (const operation of this.operations) {
			if (operation.action === "create") {
				const e = this.file.createEntityWithId(operation.value.type as string, operation.value.id as number);
				for (const [k, v] of Object.entries(operation.value)) {
					if (k === "id" || k === "type") continue;
					try {
						e.set(k, this.unserialiseValue(e, v));
					} catch {
						// ditto
					}
				}
			} else if (operation.action === "edit") {
				const element = this.file.byId(operation.id);
				element.setByIndex(operation.index, this.unserialiseValue(element, operation.new));
			} else if (operation.action === "delete") {
				const element = this.file.byId(operation.value.id as number);
				this.file.remove(element);
			}
			// batch_delete: no-op, matches Python.
		}
	}
}

interface FileState {
	history: Transaction[];
	future: Transaction[];
	transaction: Transaction | null;
}

// Class-level shared state trick (`file_mixin.registry`, research/01 SS2.2): keyed by
// the underlying native file's stable identity (`file_pointer()`, this chunk's new
// primitive -- see the final report), not by JS wrapper object identity, since every
// primitive-layer accessor mints a fresh wrapper (research/07-fresh-wrapper-per-access.md).
const fileRegistry = new Map<string, FileState>();

const SCHEMA_VERSION_PREFIXES = ["IFC", "X", "_ADD", "_TC"] as const;
const SCHEMA_IDENTIFIER_PATTERN = /^(IFC\d+)?(X\d+)?(_ADD\d+)?(_TC\d+)?/;

function parseSchema(schemaIdentifier: string): string {
	const match = schemaIdentifier.match(SCHEMA_IDENTIFIER_PATTERN);
	const groups = [match?.[1], match?.[2]];
	return SCHEMA_VERSION_PREFIXES.slice(0, 2)
		.map((prefix, index) => {
			const group = groups[index];
			return group ? `${prefix}${Number.parseInt(group.slice(prefix.length), 10)}` : "";
		})
		.join("");
}

function parseSchemaVersion(schemaIdentifier: string): [number, number, number, number] {
	return SCHEMA_VERSION_PREFIXES.map((prefix) => {
		const match = schemaIdentifier.match(new RegExp(`${prefix}(\\d)`));
		return match ? Number.parseInt(match[1], 10) : 0;
	}) as [number, number, number, number];
}

function dedupeByIdentity(instances: EntityInstance[]): Set<EntityInstance> {
	const seen = new Map<number, EntityInstance>();
	for (const instance of instances) {
		if (!seen.has(instance.identity())) {
			seen.set(instance.identity(), instance);
		}
	}
	return new Set(seen.values());
}

function attributeIndicesReferencing(entity: EntityInstance, target: EntityInstance): number[] {
	if (!entity.isEntity()) return [];
	const indices: number[] = [];
	const count = entity.attributeCount();
	for (let index = 0; index < count; index++) {
		if (referencesTarget(entity.getByIndex(index), target)) {
			indices.push(index);
		}
	}
	return indices;
}

/**
 * TS port of `file_mixin` (`ifcopenshell/file.py`). Wraps a native `file`
 * (`ifcopenshell::file`, `"shared_ptr"` handle-kind) handle.
 */
export class IfcFile {
	/** @internal */ readonly _handle: unknown;
	/** @internal */ readonly nativeFile: NativeFile;
	private readonly pointerKey: string;
	private state: FileState;
	historySize = 64;

	constructor(handle: unknown) {
		this._handle = handle;
		this.nativeFile = new NativeFile(handle);
		this.pointerKey = this.nativeFile.file_pointer();
		let state = fileRegistry.get(this.pointerKey);
		if (!state) {
			state = { history: [], future: [], transaction: null };
			fileRegistry.set(this.pointerKey, state);
		}
		this.state = state;
	}

	/** Identity key for the underlying native `ifcopenshell::file` (`file.file_pointer()`). */
	filePointer(): string {
		return this.pointerKey;
	}

	get history(): readonly Transaction[] {
		return this.state.history;
	}

	get future(): readonly Transaction[] {
		return this.state.future;
	}

	get transaction(): Transaction | null {
		return this.state.transaction;
	}

	set transaction(value: Transaction | null) {
		this.state.transaction = value;
	}

	setHistorySize(size: number): void {
		this.historySize = size;
		while (this.state.history.length > this.historySize) {
			this.state.history.shift();
		}
	}

	beginTransaction(): void {
		if (this.historySize) {
			this.state.transaction = new Transaction(this);
		}
	}

	endTransaction(): void {
		if (this.state.transaction) {
			this.state.history.push(this.state.transaction);
			if (this.state.history.length > this.historySize) {
				this.state.history.shift();
			}
			this.state.future = [];
			this.state.transaction = null;
		}
	}

	discardTransaction(): void {
		if (this.state.transaction) {
			this.state.transaction.rollback();
		}
		this.state.transaction = null;
	}

	undo(): void {
		if (this.state.history.length === 0) return;
		const transaction = this.state.history.pop() as Transaction;
		try {
			transaction.rollback();
		} catch (e) {
			throw new UndoSystemError("Error during transaction undo.", transaction, e);
		}
		this.state.future.push(transaction);
	}

	redo(): void {
		if (this.state.future.length === 0) return;
		const transaction = this.state.future.pop() as Transaction;
		try {
			transaction.commit();
		} catch (e) {
			throw new UndoSystemError("Error during transaction redo.", transaction, e);
		}
		this.state.history.push(transaction);
	}

	// --- schema (file_mixin.schema / .schema_version properties) ---

	get schemaIdentifier(): string {
		return this.nativeFile.schema().name();
	}

	/** General IFC schema version: IFC2X3, IFC4, IFC4X3. */
	get schema(): string {
		return parseSchema(this.schemaIdentifier);
	}

	/** Numeric representation of the full IFC schema version, e.g. IFC4X3_ADD2 -> [4,3,2,0]. */
	get schemaVersion(): [number, number, number, number] {
		return parseSchemaVersion(this.schemaIdentifier);
	}

	// --- create / add / remove ---

	private resolveDeclaration(type: string): NativeDeclaration {
		return this.nativeFile.schema().declaration_by_name_with_name(type);
	}

	private createEntityImpl(type: string, args: readonly unknown[], id: number): EntityInstance {
		const declaration = this.resolveDeclaration(type);
		const handle = this.nativeFile.create_with_declaration_instance_id(declaration, id);
		const e = new EntityInstance(handle._handle, this);

		const attrs = args.map((value, index): [number, unknown] => [index, value]);
		if (attrs.length > e.attributeCount()) {
			throw new Error(
				`entity instance of type '${e.isA(true)}' has only ${e.attributeCount()} attributes but ${attrs.length} attributes were provided.`,
			);
		}

		// Don't store these attribute assignments as their own transaction operations
		// -- the creation itself already captures the initial values (matches Python's
		// save/restore of `self.transaction` around the loop).
		const transaction = this.state.transaction;
		if (attrs.length) this.state.transaction = null;
		try {
			for (const [index, value] of attrs) {
				e.setByIndex(index, value);
			}
		} finally {
			if (attrs.length) this.state.transaction = transaction;
		}

		if (this.state.transaction) {
			this.state.transaction.storeCreate(e);
		}
		return e;
	}

	/**
	 * Create a new IFC entity in the file (`file_mixin.create_entity`). Positional
	 * args only -- a plain `createEntity("IfcWall", ...)` call, per this chunk's scope
	 * (the dynamic `f.createIfcWall(...)`-style sugar and a keyword-argument
	 * equivalent are both deliberately deferred, see the final report).
	 */
	createEntity(type: string, ...args: readonly unknown[]): EntityInstance {
		return this.createEntityImpl(type, args, -1);
	}

	/**
	 * Create an entity with an explicit STEP id and no positional attributes --
	 * Python's `create_entity(type, id=<id>)` kwarg usage, needed internally by
	 * `Transaction.rollback`/`commit` to recreate a deleted/undone entity under its
	 * original id.
	 */
	createEntityWithId(type: string, id: number): EntityInstance {
		return this.createEntityImpl(type, [], id);
	}

	byId(id: number): EntityInstance {
		return new EntityInstance(this.nativeFile.instance_by_id(id)._handle, this);
	}

	byGuid(guid: string): EntityInstance {
		return new EntityInstance(this.nativeFile.instance_by_guid(guid)._handle, this);
	}

	/** `file_mixin.__getitem__`. */
	get(key: number | string): EntityInstance {
		return typeof key === "number" ? this.byId(key) : this.byGuid(key);
	}

	add(inst: EntityInstance, id?: number): EntityInstance {
		let maxId: number | undefined;
		if (this.state.transaction) {
			maxId = this.getMaxId();
		}
		const resultHandle = this.nativeFile.add_entity(new NativeEntityInstance(inst._handle), id ?? -1);
		const result = new EntityInstance(resultHandle._handle, this);
		if (this.state.transaction) {
			const addedElements = this.traverse(result).filter((e) => e.id() > (maxId as number));
			for (const e of [...addedElements].reverse()) {
				this.state.transaction.storeCreate(e);
			}
		}
		return result;
	}

	byType(type: string, includeSubtypes = true): EntityInstance[] {
		const handles = includeSubtypes
			? this.nativeFile.instances_by_type_with_type_name(type)
			: this.nativeFile.instances_by_type_excl_subtypes_with_type_name(type);
		return handles.map((h) => new EntityInstance(h._handle, this));
	}

	/**
	 * Depth-first (or breadth-first) traversal of all referenced instances, including
	 * the root instance itself (`file_mixin.traverse`). Delegates to the real
	 * `ifcopenshell::file::traverse`/`traverse_breadth_first` static methods, exposed
	 * as `entity_instance` primitives by this chunk (they exist as real C++ methods
	 * already; they simply aren't discoverable by wrappergen's clang frontend, which
	 * unconditionally skips static methods -- see the final report).
	 *
	 * `maxLevels`: `null` (default) or a negative number means infinite, matching
	 * Python's docstring -- but note the native implementation's own quirk
	 * (`src/ifcparse/parse.cpp`'s `traverse_`: the depth cutoff only fires for
	 * `max_level > 0`) also treats `0` as infinite, not "root only" -- `1` is the
	 * smallest value that actually limits depth (root plus its direct references).
	 */
	traverse(inst: EntityInstance, maxLevels: number | null = null, breadthFirst = false): EntityInstance[] {
		const limit = maxLevels ?? -1;
		const native = new NativeEntityInstance(inst._handle);
		const handles = breadthFirst ? native.traverse_breadth_first(limit) : native.traverse(limit);
		return handles.map((h) => new EntityInstance(h._handle, this));
	}

	/**
	 * Return entities that reference `inst` (`file_mixin.get_inverse`). The native
	 * primitive layer has no unfiltered "who references this instance" primitive on
	 * `entity_instance` (only `file.instances_by_reference(id)`, and a narrower,
	 * declaration+attribute-index-scoped `file.get_inverse` used internally for typed
	 * queries) -- `instances_by_reference` is this chunk's native building block, with
	 * the attribute-index pairing for `withAttributeIndices` computed in TS by
	 * scanning each candidate's forward attributes, matching
	 * `Transaction.get_element_inverses`'s own pure-Python approach in `file.py`.
	 */
	getInverse(
		inst: EntityInstance,
		allowDuplicate = false,
		withAttributeIndices = false,
	): EntityInstance[] | Set<EntityInstance> | Array<[EntityInstance, number]> {
		if (withAttributeIndices && !allowDuplicate) {
			throw new Error("withAttributeIndices requires allowDuplicate to be True");
		}
		const handles = this.nativeFile.instances_by_reference(inst.id());
		const inverses = handles.map((h) => new EntityInstance(h._handle, this));

		if (allowDuplicate) {
			if (withAttributeIndices) {
				const pairs: Array<[EntityInstance, number]> = [];
				for (const inverse of inverses) {
					for (const index of attributeIndicesReferencing(inverse, inst)) {
						pairs.push([inverse, index]);
					}
				}
				return pairs;
			}
			return inverses;
		}
		return dedupeByIdentity(inverses);
	}

	getTotalInverses(inst: EntityInstance): number {
		return this.nativeFile.get_total_inverses(inst.id());
	}

	remove(inst: EntityInstance): void {
		if (this.state.transaction) {
			this.state.transaction.storeDelete(inst);
		}
		this.nativeFile.remove_entity(new NativeEntityInstance(inst._handle));
	}

	batch(): void {
		if (this.state.transaction) {
			this.state.transaction.batch();
		}
		this.nativeFile.batch();
	}

	unbatch(): void {
		if (this.state.transaction) {
			this.state.transaction.unbatch();
		}
		this.nativeFile.unbatch();
	}

	getMaxId(): number {
		return this.nativeFile.get_max_id();
	}

	freshId(): number {
		return this.nativeFile.fresh_id();
	}

	/**
	 * Iterate every entity in the file (`file_mixin.__iter__`). Python delegates to a
	 * native `entity_names()` bulk-enumeration primitive that this chunk's primitive
	 * layer doesn't expose (a real, disclosed gap -- see the final report); this
	 * instead walks every concrete entity declaration in the schema and unions
	 * `instances_by_type_excl_subtypes_with_type_name` per declaration, which is
	 * correct (every STEP-file instance is a concrete entity type) without assuming
	 * contiguous STEP ids.
	 */
	[Symbol.iterator](): IterableIterator<EntityInstance> {
		const schema = this.nativeFile.schema();
		const results: EntityInstance[] = [];
		for (const declaration of schema.declarations()) {
			if (declaration.as_entity() === null) continue;
			const handles = this.nativeFile.instances_by_type_excl_subtypes_with_type_name(declaration.name());
			for (const h of handles) {
				results.push(new EntityInstance(h._handle, this));
			}
		}
		return results[Symbol.iterator]();
	}

	/**
	 * Write the model to `path` as IFC-SPF text (`file_mixin.write`). Node target
	 * only, per this chunk's scope -- the native primitive layer only exposes a
	 * path-based `write` (matching `file::_write`'s atomic-write-via-temp-file
	 * behavior, research/01 SS5 point 3), not an in-memory buffer/string return, so
	 * this chunk doesn't offer a `Buffer`-returning variant (would need a new native
	 * primitive, out of scope here) -- keeping the door open for a future browser
	 * variant returning a `Blob`, as the roadmap describes, once that primitive exists.
	 */
	write(path: string): void {
		this.nativeFile.write(path);
	}

	writeAsync(path: string): Promise<void> {
		return this.nativeFile.write_async(path);
	}

	/** Delegates to the primitive layer's existing `file.dispose()` (Phase 1), and
	 * additionally cleans up this class's own TS-side state (the registry entry for
	 * this file, including any transaction history) so nothing keeps referencing a
	 * disposed native handle. */
	dispose(): void {
		this.nativeFile.dispose();
		fileRegistry.delete(this.pointerKey);
	}

	[Symbol.dispose](): void {
		this.dispose();
	}
}
