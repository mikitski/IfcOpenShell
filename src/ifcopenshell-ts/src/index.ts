// This file was generated with the assistance of an AI coding tool.
//
// Phase 0 has no real API surface yet (see planning/ifcopenshell-ts/20-roadmap.md).
// This file exists only to prove the native-addon build/CI pipeline works
// end-to-end: open an in-memory IFC-SPF buffer, read its schema identifier,
// close it. Phase 2 replaces this with the real `file`/`entity_instance`
// mixin port.

import { native } from "./native";

/** Thin wrapper around the Phase 0 smoke-test native binding. */
export class IfcFile {
	private handle: import("./native").NativeIfcFile | null;

	constructor(data: Buffer) {
		this.handle = new native.NativeIfcFile(data);
	}

	get schemaIdentifier(): string {
		if (!this.handle) {
			throw new Error("file is closed");
		}
		return this.handle.schemaIdentifier();
	}

	close(): void {
		this.handle?.close();
		this.handle = null;
	}
}
