// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/layout_vertical_alignment_by_pi_method.py`
// (src/ifcopenshell-python, 122 lines) -- see `./index.ts`'s own header comment for this
// brand-new module's full scope (chunk 8 of many, the LAST chunk for this module).
// PUBLIC (confirmed present in real Python's own `__init__.py` `__all__`). Same shape
// and treatment as `./layoutHorizontalAlignmentByPiMethod.ts` (see that file's own
// header comment for the full writeup of the shared "real math ported completely, then
// throws at the first `createLayoutSegment` call" finding) -- parabolic-arc/
// constant-gradient math instead of tangent-run/circular-curve math, calling the SAME
// unconditionally-blocked `createLayoutSegment` (this chunk's own file 2).
//
// `IfcAlignmentVerticalSegment` attribute order (`StartTag`(0), `EndTag`(1),
// `StartDistAlong`(2), `HorizontalLength`(3), `StartHeight`(4), `StartGradient`(5),
// `EndGradient`(6), `RadiusOfCurvature`(7), `PredefinedType`(8)) matches
// `addZeroLengthSegment.test.ts`'s own already-established `verticalSegment` helper's
// identical positional order -- reused verbatim, not re-derived.
//
// A cross-cutting, disclosed TS-vs-Python arithmetic divergence, same category as
// `./layoutHorizontalAlignmentByPiMethod.ts`'s own: `RadiusOfCurvature=1 / k` where
// `k = (end_slope - start_slope) / length` divides by exactly `0.0` for a degenerate
// input where `end_slope === start_slope` (a "parabolic arc" with no actual grade
// change) -- real Python's own float division by `0.0` raises `ZeroDivisionError`; this
// port's `/` instead silently produces `Infinity`. Not specially guarded against,
// matching the same established precedent (no real caller is expected to request a
// parabolic arc between two equal gradients).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { createLayoutSegment } from "./createLayoutSegment";

/**
 * Appends `IfcAlignmentVerticalSegment`s to a previously defined `IfcAlignmentVertical`
 * using the PI layout method (Python:
 * `ifcopenshell.api.alignment.layout_vertical_alignment_by_pi_method`). The zero length
 * segment is updated.
 *
 * **Currently unconditionally blocked** at its own first `createLayoutSegment` call --
 * see this file's own header comment, and `./layoutHorizontalAlignmentByPiMethod.ts`'s
 * own, for the full writeup.
 *
 * @param file The file.
 * @param layout An `IfcAlignmentVertical` layout.
 * @param vpoints (distance_along, Z_height) pairs denoting the location of the vertical
 *   PIs, including start and end.
 * @param lengths Horizontal length of parabolic vertical curves.
 * @throws {Error} If `lengths.length !== vpoints.length - 2`.
 * @throws {Error} Always, from the already-unconditionally-blocked `createLayoutSegment`
 *   -- see this file's own header comment.
 */
export function layoutVerticalAlignmentByPiMethod(
	file: IfcFile,
	layout: EntityInstance,
	vpoints: readonly (readonly number[])[],
	lengths: readonly number[],
): void {
	if (!(vpoints.length - 2 === lengths.length)) {
		throw new Error("lengths should have two fewer elements that vpoints");
	}

	let [xPBG, yPBG] = vpoints[0];
	let [xPVI, yPVI] = vpoints[1];
	let i = 1;
	for (const length of lengths) {
		// back gradient
		const dxBG = xPVI - xPBG;
		const dyBG = yPVI - yPBG;
		const startSlope = Math.tan(Math.atan2(dyBG, dxBG));

		// forward gradient
		i += 1;
		const [xPFG, yPFG] = vpoints[i];
		const dxFG = xPFG - xPVI;
		const dyFG = yPFG - yPVI;
		const endSlope = Math.tan(Math.atan2(dyFG, dxFG));

		const xEVC = xPVI + length / 2.0;
		const yEVC = yPVI + (endSlope * length) / 2.0;

		// create gradient
		const gradientLength = dxBG - length / 2.0;
		if (1.0e-3 < gradientLength) {
			const designParameters = file.createEntity(
				"IfcAlignmentVerticalSegment",
				null,
				null,
				xPBG,
				gradientLength,
				yPBG,
				startSlope,
				startSlope,
				null,
				"CONSTANTGRADIENT",
			);
			createLayoutSegment(file, layout, designParameters);
		}

		// create vertical curve
		if (0.0 < length) {
			const k = (endSlope - startSlope) / length;
			const xBVC = xPVI - length / 2.0;
			const yBVC = yPVI - (startSlope * length) / 2.0;

			const designParameters = file.createEntity(
				"IfcAlignmentVerticalSegment",
				null,
				null,
				xBVC,
				length,
				yBVC,
				startSlope,
				endSlope,
				1 / k,
				"PARABOLICARC",
			);
			createLayoutSegment(file, layout, designParameters);
		}

		// start of next curve is end of this curve
		xPBG = xEVC;
		yPBG = yEVC;
		xPVI = xPFG;
		yPVI = yPFG;
	}

	// create last gradient run
	const dx = xPVI - xPBG;
	const dy = yPVI - yPBG;
	const slope = Math.tan(Math.atan2(dy, dx));
	const gradientLength = dx;

	if (1.0e-3 < gradientLength) {
		const designParameters = file.createEntity(
			"IfcAlignmentVerticalSegment",
			null,
			null,
			xPBG,
			gradientLength,
			yPBG,
			slope,
			slope,
			null,
			"CONSTANTGRADIENT",
		);
		createLayoutSegment(file, layout, designParameters);
	}
}
