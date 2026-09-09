// This file was generated with the assistance of an AI coding tool.
//
// Shared "large fixture" builder for Phase 2.5's benchmark suite
// (planning/ifcopenshell-ts/20-roadmap.md's "Phase 2.5 -- Alpha checkpoint": "a small CI
// benchmark suite (attribute access in a tight loop with/without the cache, bulk
// get_info on a large fixture model, file open/parse time)"). Reuses
// test/native/event_loop.test.ts's exact WALL_COUNT/low-level-construction pattern
// (60,000 synthetic IfcWall entities, built via the raw native primitives rather than
// through IfcFile.createEntity/the attribute Proxy) rather than inventing a new
// fixture shape -- this repo has no large real-world .ifc file checked in anywhere
// (the largest fixture under src/ifcopenshell-python/test/fixtures/ is ~12KB), so a
// synthetic generated fixture is the established, correct approach here.
//
// Construction goes through the raw native primitives directly, matching
// test/native/event_loop.test.ts's own buildLargeFixture(): the point of every
// benchmark in this directory is the cost of *reading* attributes / serializing /
// opening this fixture, not the cost of constructing it, so fixture construction
// itself is kept as fast and uncomplicated as possible and is never the thing being
// timed.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { IfcFile } from "../../src/file";
import { file as NativeFile } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";

/**
 * Matches test/native/event_loop.test.ts's own WALL_COUNT -- see that file's comment
 * for why this size ("large enough that ... takes long enough ... for a blocked event
 * loop to show up unambiguously, rather than being indistinguishable from ordinary
 * scheduler jitter") is the established fixture size for a timing-sensitive test in
 * this package, and doubles here as "IFC-processing code routinely loops over
 * thousands of entities" (10-architecture.md SS6) for the attribute-access benchmark.
 */
export const WALL_COUNT = 60_000;

/**
 * Builds an in-memory `IfcFile` containing `WALL_COUNT` `IfcWall` entities, each with
 * a distinct `GlobalId` and `Name` set (attribute indices 0 and 2 on `IfcRoot` --
 * confirmed against src/generated/ifc4.d.ts's own `IfcRoot`/`IfcWall` interfaces:
 * `GlobalId`, `OwnerHistory`, `Name`, `Description`, ...). `OwnerHistory`/
 * `ObjectPlacement`/`Representation` are deliberately left unset (null): the bulk
 * `getInfo(recursive)` benchmark that consumes this fixture would otherwise chase
 * those references too, which isn't what "bulk get_info on a large fixture *model*"
 * (the roadmap's own wording) is measuring -- the cost of reading each of
 * `WALL_COUNT` entities' own attributes, not an unrelated, arbitrarily-deep reference
 * graph.
 */
export function buildLargeFixtureFile(): IfcFile {
	const nativeFile = new NativeFile(native.file_new());
	const schema = nativeFile.schema();
	const wallDeclaration = schema.declaration_by_name_with_name("IfcWall");
	for (let i = 0; i < WALL_COUNT; i++) {
		const wall = nativeFile.create_with_declaration_instance_id(wallDeclaration, -1);
		wall.set_attribute_value(0, {
			kind: native.STRING,
			string_value: `3xhrZ$4XvA0v3iZQ8gGv${String(i).padStart(6, "0")}`,
		});
		wall.set_attribute_value(2, {
			kind: native.STRING,
			string_value: `Wall ${i}`,
		});
	}
	return new IfcFile(nativeFile._handle);
}

/**
 * Writes `file` to a fresh temp path as IFC-SPF text, for the benchmarks that need a
 * real file on disk to open/parse (the file-open/parse benchmark). Mirrors
 * test/native/event_loop.test.ts's own temp-path pattern.
 */
export function writeFixtureToPath(file: IfcFile): string {
	const targetPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ifcopenshell-ts-bench-")), "large.ifc");
	file.write(targetPath);
	return targetPath;
}
