// This file was generated with the assistance of an AI coding tool.
//
// Loads the Phase 0 smoke-test native addon (see native/src/binding.cpp).
// This is intentionally minimal - Phase 1 will decide the real primitive
// surface and its own loading strategy.

import * as fs from "node:fs";
import * as path from "node:path";

/** The native handle for a parsed IFC-SPF file, as exposed by the addon. */
export interface NativeIfcFile {
	schemaIdentifier(): string;
	close(): void;
}

interface NativeIfcFileConstructor {
	new (data: Buffer): NativeIfcFile;
}

interface NativeBinding {
	NativeIfcFile: NativeIfcFileConstructor;
}

// __dirname's depth relative to the package root differs between running
// against source directly (Vitest, "<pkg>/src") and the compiled CJS output
// ("<pkg>/dist/cjs"), so find the package root by its package.json rather
// than assuming a fixed number of ".." segments.
function findPackageRoot(startDir: string): string {
	let dir = startDir;
	while (!fs.existsSync(path.join(dir, "package.json"))) {
		const parent = path.dirname(dir);
		if (parent === dir) {
			throw new Error(`could not locate ifcopenshell-ts's package.json above ${startDir}`);
		}
		dir = parent;
	}
	return dir;
}

const addonPath = path.join(findPackageRoot(__dirname), "native", "build", "Release", "ifcopenshell_native.node");

export const native: NativeBinding = require(addonPath) as NativeBinding;
