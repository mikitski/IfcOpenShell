// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/create_from_csv.py` (src/ifcopenshell-python, 101
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full scope
// (chunk 8 of many, the LAST chunk for this module). PUBLIC (confirmed present in real
// Python's own `__init__.py` `__all__`). Depends on this chunk's own `create` (file 4,
// unconditionally blocked -- see `./create.ts`'s own header comment),
// already-landed `getHorizontalLayout` (chunk 1), this chunk's own `addVerticalLayout`
// (file 1) and `layoutHorizontalAlignmentByPiMethod`/`layoutVerticalAlignmentByPiMethod`
// (files 7-8) -- all verified directly against their real exported name/signature.
//
// --- CSV parsing: hand-rolled, no new npm dependency ---
//
// Real Python uses the stdlib `csv` module (`csv.reader(csvfile)`) reading via
// `open(filepath, newline="")`. No CSV-reading precedent exists anywhere else in this
// TS port (confirmed by grepping the whole `src/` tree for `readFileSync`/`csv` --
// `util/file.ts` is the only other `fs.readFileSync` user, for a completely unrelated
// ZIP-archive read). The task's own documented CSV format is plain floats with no
// quoting/escaping ("X1,Y1,R1,X2,Y2,R2 ... "), so a simple split-on-newline-then-comma
// parser is sufficient -- matching this project's "no new npm dependency for small
// hand-rollable parsing" convention. `readCsvRows` below splits on `\r\n`/`\r`/`\n`,
// drops a trailing blank line (matching Python's own `csv.reader` behavior of not
// yielding a row for a trailing newline at EOF), and splits each remaining line on `,`.
//
// --- CONFIRMED (by tracing `./create.ts`'s own already-disclosed blocker) unconditionally
//     blocked on its very first CSV row ---
//
// `alignment = ifcopenshell.api.alignment.create(file, "Alignment_from_CSV")` is called
// on `row_count == 1`, BEFORE anything else on that row (before
// `get_horizontal_layout`/`layout_horizontal_alignment_by_pi_method` are ever reached) --
// since `create()` (this chunk's own file 4) is itself unconditionally blocked (its own
// `addStationingReferent` gap, called regardless of any argument), `createFromCsv`
// throws immediately upon processing its first CSV row, for every real invocation,
// regardless of how many rows the CSV file actually has -- the second-and-later-row
// branch (`addVerticalLayout`/`layoutVerticalAlignmentByPiMethod`) is therefore never
// reached by any real invocation of this function today, even though `addVerticalLayout`
// (this chunk's own file 1) is itself independently confirmed fully functional -- ported
// faithfully anyway, matching this project's "port every real branch, even an
// unreachable one" discipline.
//
// Ported the real CSV-parsing logic (the coordinate/radii extraction loop, the
// `radii[1:-1]` slice) faithfully up to the exact point the first row's `create()` call
// throws -- `createFromCsv.test.ts` pins the real, portable row-1 parsing (via a
// dedicated exported `_parseCsvRow` test hook is NOT added, since real Python doesn't
// expose one either -- instead the test asserts on the exact `create()` arguments
// reached before the throw is not directly observable without refactoring the function's
// own shape, so the test instead pins the throw itself, matching
// `layoutHorizontalAlignmentByPiMethod.test.ts`'s/`layoutVerticalAlignmentByPiMethod
// .test.ts`'s own "pin the throw, not an unobservable intermediate" precedent for this
// same `create()`/`createLayoutSegment()` family of blockers).
import * as fs from "node:fs";
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { addVerticalLayout } from "./addVerticalLayout";
import { create } from "./create";
import { getHorizontalLayout } from "./getHorizontalLayout";
import { layoutHorizontalAlignmentByPiMethod } from "./layoutHorizontalAlignmentByPiMethod";
import { layoutVerticalAlignmentByPiMethod } from "./layoutVerticalAlignmentByPiMethod";

/**
 * Splits raw CSV file content into rows of string cells (Python: `csv.reader(csvfile)`
 * over `open(filepath, newline="")`). No quoting/escaping support -- matches this
 * function's own documented plain-floats-only format. See this file's own header
 * comment for why this is hand-rolled rather than a new npm dependency.
 */
function readCsvRows(content: string): string[][] {
	const lines = content.split(/\r\n|\r|\n/);
	// A trailing newline at EOF doesn't produce an extra empty row in Python's own
	// `csv.reader` -- drop a single trailing blank line to match.
	if (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop();
	}
	return lines.map((line) => line.split(","));
}

/**
 * Creates an alignment from PI data stored in a CSV file (Python:
 * `ifcopenshell.api.alignment.create_from_csv`).
 *
 * The format of the file is:
 *
 *     X1,Y1,R1,X2,Y2,R2 ... Xn-1,Yn-1,Rn-1,Xn,Yn
 *
 *     D1,Z1,L1,D2,Z2,L2 ... Dn-1,Zn-1,Ln-1,Dn,Zn
 *
 *     D1,Z1,L1,D2,Z2,L2 ... Dn-1,Zn-1,Ln-1,Dn,Zn
 *
 *     ...
 *
 * where:
 * - X,Y are PI coordinates
 * - R is the horizontal circular curve radius
 * - D,Z are VPI coordinates as "Distance Along","Elevation"
 * - L is the horizontal length of a parabolic vertical transition curve
 * - R1 and Rn, as well as L1 and Ln are placeholders and not used. They are recommended
 *   to have values of 0.0.
 * - R2 and Rn-2 are the radii of the first and last horizontal curves.
 * - L2 and Ln-2 are the length of the first and last vertical curves.
 *
 * The CSV file contains one horizontal alignment, zero, one, or more vertical
 * alignments.
 *
 * **CONFIRMED unconditionally blocked on the very first CSV row** -- see this file's
 * own header comment.
 *
 * @param file The file.
 * @param filepath Path to the CSV file.
 * @returns The new `IfcAlignment`.
 * @throws {Error} Always, from the already-unconditionally-blocked `create()`, once the
 *   first CSV row is parsed.
 */
export function createFromCsv(file: IfcFile, filepath: string): EntityInstance {
	let alignment: EntityInstance | null = null;
	const content = fs.readFileSync(filepath, "utf-8");
	const rows = readCsvRows(content);
	let rowCount = 0;
	for (const row of rows) {
		const data = row.map((cell) => Number.parseFloat(cell));
		// horizontal coordinates for first row, vertical coordinates for subsequent rows
		const coordinates: [number, number][] = [];
		// horizontal curve radii for first row, vertical curve length for subsequent rows
		let radii: number[] = [];

		rowCount += 1;

		let i = 0;
		while (i < data.length) {
			if (i + 1 < data.length) {
				const x = data[i];
				const y = data[i + 1];
				coordinates.push([x, y]);
				i += 2;
			}
			if (i < data.length && (i + 1) % 3 === 0) {
				radii.push(data[i]);
				i += 1;
			}
		}

		radii = radii.slice(1, -1); // The first radius value is a placeholder, remove it

		if (rowCount === 1) {
			// *** BLOCKED HERE, unconditionally, for every real invocation -- see this
			// file's own header comment. ***
			alignment = create(file, "Alignment_from_CSV");
			const horizontalLayout = getHorizontalLayout(alignment) as EntityInstance;
			layoutHorizontalAlignmentByPiMethod(file, horizontalLayout, coordinates, radii);
		} else {
			// Unreachable by any real invocation today -- see this file's own header
			// comment. Ported faithfully regardless.
			if (alignment === null) {
				throw new Error("Assertion failed: alignment must not be null");
			}
			const verticalLayout = addVerticalLayout(file, alignment);
			layoutVerticalAlignmentByPiMethod(file, verticalLayout, coordinates, radii);
		}
	}

	if (alignment === null) {
		throw new Error("Assertion failed: alignment must not be null");
	}
	return alignment;
}
