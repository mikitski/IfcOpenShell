// This file was generated with the assistance of an AI coding tool.
//
// Loads the compiled Phase 1 native addon (native/CMakeLists.txt) and hands it to
// ./ifcopenshell_native.ts's generated facade as the fixed `./native_loader` import
// that generated file expects (see emit.py's `emit_typescript_facade` doc comment for
// why the generated facade doesn't hardcode a relative path to the compiled `.node`
// file directly: this package has at least two different layouts the addon can be
// found under relative to a given source file -- running tests directly against
// `src/`, vs. `tsc`'s compiled `dist/cjs/` tree -- so an absolute, package-root-relative
// `require()` is used instead of a relative import, the same approach Phase 0's
// original `native.ts` established).

import * as fs from "node:fs";
import * as path from "node:path";

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

// The addon's flat, per-primitive function surface (`file_new`, `base_get_attribute_value_variant`,
// ...) has no hand- or generator-produced `.d.ts` of its own -- the generated facade
// classes in `./ifcopenshell_native.ts` are the typed layer callers should use; this
// module only exists to load the addon and hand it to that file.
// biome-ignore lint/suspicious/noExplicitAny: untyped by design, see above.
export const native: any = require(addonPath);
