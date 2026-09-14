// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/project/test_create_file.py` (src/ifcopenshell-python) --
// its one real test method (`test_run`) is ported below, adapted in one necessary way:
// this port's `IfcFile`/`spf_header` binding has no live `file.header.file_name.*`/
// `.file_description.*` read accessor at all yet (a real, pre-existing, disclosed
// primitive-layer gap -- see `createFile.ts`'s own header comment and `TODOS.md`'s
// dedicated "`spf_header` has no `file_description()` sub-entity accessor" entry), so
// this can't assert `ifc.header.file_name.name` the way the real Python test does.
// Instead, this writes the file to a temp path (`IfcFile.write`, already used for the
// same "read back what the STEP serializer actually produced" purpose by
// `util/element.ts`'s `unbatchRemoveDeep2`) and asserts against the raw STEP HEADER
// text -- arguably a *stronger* check than an in-memory object assertion, since it
// verifies the exact bytes a real consumer would see on disk.
//
// Schema-availability note (per this chunk's own CI-gating requirement): the IFC2X3
// case is gated with `describe.skipIf`, matching `test/util/doc.test.ts`'s established
// pattern -- CI's native build only registers IFC4 (`-DSCHEMA_VERSIONS=4`).

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, test } from "vitest";
import { createFile } from "../../../src/api/project/createFile";
import { AVAILABLE_SCHEMAS } from "../../bootstrap";

/** See this file's header comment for why raw STEP text, not a live header accessor. */
function writeAndReadHeader(file: ReturnType<typeof createFile>): string {
	const tempPath = path.join(
		os.tmpdir(),
		`ifcopenshell-ts-create-file-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.ifc`,
	);
	try {
		file.write(tempPath);
		return fs.readFileSync(tempPath, "utf-8");
	} finally {
		try {
			fs.unlinkSync(tempPath);
		} catch {
			// Best-effort cleanup, matching `unbatchRemoveDeep2`'s own precedent.
		}
	}
}

describe("api.project.createFile", () => {
	test("defaults to IFC4", () => {
		const file = createFile(undefined);
		expect(file.schema).toBe("IFC4");
	});

	test("produces a genuinely blank file (zero entities)", () => {
		const file = createFile(undefined);
		expect([...file]).toHaveLength(0);
	});

	test("sets the STEP header fields real Python's create_file() sets", () => {
		const file = createFile(undefined, { version: "IFC4" });
		const text = writeAndReadHeader(file);

		// FILE_NAME('/dev/null','<timestamp>',('<author>'),('<org>'),'<preprocessor>','<originating>','Nobody');
		const fileNameMatch = text.match(/FILE_NAME\((.*)\);/);
		expect(fileNameMatch).not.toBeNull();
		const fileNameArgs = fileNameMatch?.[1] ?? "";

		expect(fileNameArgs).toContain("'/dev/null'");
		expect(fileNameArgs).toContain("'Nobody'");
		// preprocessor_version/originating_system: real Python's own test only asserts
		// the substring "IfcOpenShell" is present (not an exact string match) -- see
		// `createFile.ts`'s own header comment table for why this port's exact string
		// content differs from real Python's (`ifcopenshell.version`-sourced) content.
		const preprocessorAndOriginating = fileNameArgs.split(",").slice(4, 6);
		for (const field of preprocessorAndOriginating) {
			expect(field).toContain("IfcOpenShell");
		}
		// Real Python sets both to the exact same string -- verify that invariant holds
		// here too, not just that both happen to contain "IfcOpenShell".
		expect(preprocessorAndOriginating[0]).toBe(preprocessorAndOriginating[1]);

		// time_stamp: real Python's own test only asserts truthiness.
		const timeStamp = fileNameArgs.split(",")[1];
		expect(timeStamp.replace(/'/g, "").length).toBeGreaterThan(0);

		// FILE_DESCRIPTION(('ViewDefinition[DesignTransferView]'),'2;1');
		expect(text).toContain("FILE_DESCRIPTION(('ViewDefinition[DesignTransferView]')");
	});

	test("DesignTransferView MVD is hardcoded regardless of schema version", () => {
		const file = createFile(undefined, { version: "IFC4" });
		const text = writeAndReadHeader(file);
		expect(text).toContain("ViewDefinition[DesignTransferView]");
	});

	describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("IFC2X3", () => {
		test('version="IFC2X3" produces an IFC2X3 file', () => {
			const file = createFile(undefined, { version: "IFC2X3" });
			expect(file.schema).toBe("IFC2X3");
			expect([...file]).toHaveLength(0);
		});
	});

	describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("IFC4X3", () => {
		test('version="IFC4X3" produces an IFC4X3 file', () => {
			const file = createFile(undefined, { version: "IFC4X3" });
			expect(file.schema).toBe("IFC4X3");
			expect([...file]).toHaveLength(0);
		});
	});
});
