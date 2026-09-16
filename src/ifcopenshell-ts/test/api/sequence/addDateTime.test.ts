// This file was generated with the assistance of an AI coding tool.
//
// Port of `test/api/sequence/test_add_date_time.py`'s `TestAddDateTime` (run against
// IFC4/IFC2X3/IFC4X3 in real Python) into this project's `describe.each(AVAILABLE_SCHEMAS)`
// convention.

import { describe, expect, test } from "vitest";
import { addDateTime } from "../../../src/api/sequence/addDateTime";
import type { EntityInstance } from "../../../src/entityInstance";
import { ifc2datetime } from "../../../src/util/date";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.addDateTime (%s)", (schema) => {
	test("converts a JS Date into the schema-appropriate IFC representation", () => {
		const file = createTestFile(schema);
		const dt = new Date(2025, 2, 1, 12, 31, 24); // 2025-03-01T12:31:24, JS months are 0-indexed.

		const result = addDateTime(file, { dt });

		if (schema === "IFC2X3") {
			expect(typeof result).not.toBe("string");
			const entity = result as EntityInstance;
			expect(entity.isA("IfcDateAndTime")).toBe(true);
			const roundTripped = ifc2datetime(entity);
			expect(roundTripped).toMatchObject({
				kind: "datetime",
				year: 2025,
				month: 3,
				day: 1,
				hour: 12,
				minute: 31,
				second: 24,
			});
		} else {
			expect(result).toBe("2025-03-01T12:31:24");
		}
	});
});
