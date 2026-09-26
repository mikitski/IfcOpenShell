// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/layout_horizontal_alignment_by_pi_method.py`
// (src/ifcopenshell-python, 144 lines) -- see `./index.ts`'s own header comment for this
// brand-new module's full scope (chunk 8 of many, the LAST chunk for this module).
// PUBLIC (confirmed present in real Python's own `__init__.py` `__all__`). Depends on
// already-landed `util.unit.calculateUnitScale` and calls this chunk's own
// `createLayoutSegment` (file 2) 2-3 times per invocation -- verified directly.
//
// --- Substantial real, portable geometric math (PI-method tangent-run/circular-curve
//     computation), ported completely and faithfully, even though it is currently
//     UNREACHABLE past its first real segment ---
//
// Every one of `angleBT`/`angleFT`/`delta`/`tangent`/`lc`/`xPC`/`yPC`/`xPT`/`yPT`/
// `tangentRun` is real, portable closed-form trigonometry -- no dependency on anything
// blocked. `createLayoutSegment` (this chunk's own file 2) is ALWAYS unconditionally
// blocked (it calls the already-unconditionally-blocked `_addSegmentToLayout`, chunk 7 --
// see `./createLayoutSegment.ts`'s own header comment), for every real invocation
// regardless of the segment's own shape -- so this function throws at its own FIRST
// reached `createLayoutSegment` call (the back-tangent-run "LINE" segment, if
// `1.0e-3 < tangentRun`; otherwise the "CIRCULARARC" segment, if `radius !== 0`;
// otherwise the loop continues to the next radius, and so on, up to the final tangent
// run after the loop) -- but every real math computation UP TO that point has already
// run for real by the time the throw happens, and `createLayoutSegment`'s own
// `_addSegmentToLayout` dependency ITSELF performs 2 real, portable side effects
// (`nest.assignObject`/`nest.reorderNesting`) BEFORE its own throw -- meaning the newly
// computed `IfcAlignmentHorizontalSegment`/`IfcAlignmentSegment` IS actually created and
// nested into `layout`, for real, before the exception propagates out. This lets
// `layoutHorizontalAlignmentByPiMethod.test.ts` verify the REAL, hand-computed
// intermediate math (angles, tangent lengths, PC/PT coordinates) by inspecting the one
// real segment that gets created and nested before the throw -- not just asserting the
// function throws, matching this module's own established "port real math even in a
// function currently blocked on its very last step" precedent.
//
// `IfcAlignmentHorizontalSegment` attribute order (`StartTag`(0), `EndTag`(1),
// `StartPoint`(2), `StartDirection`(3), `StartRadiusOfCurvature`(4),
// `EndRadiusOfCurvature`(5), `SegmentLength`(6), `GravityCenterLineHeight`(7),
// `PredefinedType`(8)) matches `addZeroLengthSegment.test.ts`'s own already-established
// `horizontalSegment` helper's identical positional order -- reused verbatim, not
// re-derived.
//
// A cross-cutting, disclosed TS-vs-Python arithmetic divergence, same category as
// `_mapAlignmentHorizontalSegment.ts`'s own (chunk 5): `radius *= delta / abs(delta)`
// divides by exactly `0.0` for a degenerate 3-collinear-PI input (`delta === 0`, i.e. no
// direction change at the PI at all) -- real Python's own float `0.0 / 0.0` raises
// `ZeroDivisionError`; this port's `/` instead silently produces `NaN`. Not specially
// guarded against, matching that established precedent (no real caller is expected to
// pass 3 exactly-collinear PIs with a nonzero radius).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { calculateUnitScale } from "../../util/unit";
import { createLayoutSegment } from "./createLayoutSegment";

/**
 * Appends `IfcAlignmentHorizontalSegment`s to a previously defined
 * `IfcAlignmentHorizontal` using the PI layout method (Python:
 * `ifcopenshell.api.alignment.layout_horizontal_alignment_by_pi_method`). The zero
 * length segment is updated.
 *
 * **Currently unconditionally blocked** at its own first `createLayoutSegment` call --
 * see this file's own header comment for the full writeup of exactly how much real,
 * portable math runs (and is observable, via the one real segment created before the
 * throw) before that happens.
 *
 * @param file The file.
 * @param layout An `IfcAlignmentHorizontal` layout.
 * @param hpoints (X, Y) pairs denoting the location of the horizontal PIs, including
 *   start (POB) and end (POE).
 * @param radii Radius values to use for transition.
 * @throws {Error} If `radii.length !== hpoints.length - 2`.
 * @throws {Error} Always, from the already-unconditionally-blocked `createLayoutSegment`
 *   -- see this file's own header comment.
 */
export function layoutHorizontalAlignmentByPiMethod(
	file: IfcFile,
	layout: EntityInstance,
	hpoints: readonly (readonly number[])[],
	radii: readonly number[],
): void {
	if (!(hpoints.length - 2 === radii.length)) {
		throw new Error("radii should have two fewer elements that hpoints");
	}

	const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");

	let [xBT, yBT] = hpoints[0];
	let [xPI, yPI] = hpoints[1];

	let i = 1;

	for (let radius of radii) {
		// back tangent
		const dxBT = xPI - xBT;
		const dyBT = yPI - yBT;
		const angleBT = Math.atan2(dyBT, dxBT);
		const lengthBT = Math.sqrt(dxBT * dxBT + dyBT * dyBT);

		// forward tangent
		i += 1;
		const [xFT, yFT] = hpoints[i];
		const dxFT = xFT - xPI;
		const dyFT = yFT - yPI;
		const angleFT = Math.atan2(dyFT, dxFT);

		const delta = angleFT - angleBT;

		const tangent = Math.abs(radius * Math.tan(delta / 2));

		const lc = Math.abs(radius * delta);

		radius *= delta / Math.abs(delta);

		const xPC = xPI - tangent * Math.cos(angleBT);
		const yPC = yPI - tangent * Math.sin(angleBT);

		const xPT = xPI + tangent * Math.cos(angleFT);
		const yPT = yPI + tangent * Math.sin(angleFT);

		const tangentRun = lengthBT - tangent;

		// create back tangent run
		if (1.0e-3 < tangentRun) {
			const pt = file.createEntity("IfcCartesianPoint", [xBT, yBT]);
			const designParameters = file.createEntity(
				"IfcAlignmentHorizontalSegment",
				null,
				null,
				pt,
				angleBT / angleUnitScale,
				0.0,
				0.0,
				tangentRun,
				null,
				"LINE",
			);
			createLayoutSegment(file, layout, designParameters);
		}

		// create circular curve
		if (radius !== 0.0) {
			const pc = file.createEntity("IfcCartesianPoint", [xPC, yPC]);
			const designParameters = file.createEntity(
				"IfcAlignmentHorizontalSegment",
				null,
				null,
				pc,
				angleBT / angleUnitScale,
				radius,
				radius,
				lc,
				null,
				"CIRCULARARC",
			);
			createLayoutSegment(file, layout, designParameters);
		}

		xBT = xPT;
		yBT = yPT;
		xPI = xFT;
		yPI = yFT;
	}

	// done processing radii
	// create last tangent run
	const dx = xPI - xBT;
	const dy = yPI - yBT;
	const angleBT = Math.atan2(dy, dx);
	const tangentRun = Math.sqrt(dx * dx + dy * dy);

	if (1.0e-3 < tangentRun) {
		const pt = file.createEntity("IfcCartesianPoint", [xBT, yBT]);

		const designParameters = file.createEntity(
			"IfcAlignmentHorizontalSegment",
			null,
			null,
			pt,
			angleBT / angleUnitScale,
			0.0,
			0.0,
			tangentRun,
			null,
			"LINE",
		);
		createLayoutSegment(file, layout, designParameters);
	}
}
