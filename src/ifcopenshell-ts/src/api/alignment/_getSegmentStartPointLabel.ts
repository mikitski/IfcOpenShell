// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_get_segment_start_point_label.py`
// (src/ifcopenshell-python, 315 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 4 of many). Its only real dependency is
// `entity_instance` (a type-only import in real Python) -- no blocker.
//
// Defines TWO public-shaped things, unlike every other file ported so far in this
// module: `registerReferentNameCallback` (real Python's own
// `register_referent_name_callback`) is a genuine PUBLIC function -- confirmed
// present in real Python's own `__init__.py` `__all__`/import list -- so, unlike
// every `_`-prefixed helper landed in chunks 1-3 (`_sortNest`/`_getKeyPointTag`/
// `_getCantSegment`/`_getCurveSegmentCount`), it IS re-exported from `./index.ts`'s
// public barrel. `_getSegmentStartPointLabel` itself (real Python's own leading-
// underscore `_get_segment_start_point_label`) is module-private, matching every
// other `_`-prefixed helper's established convention -- NOT re-exported from the
// barrel; this chunk's own `updateKeyPointReferents.ts`/
// `updateAlignmentParameterSegmentTags.ts` import it directly by relative path,
// matching real Python's own `from ifcopenshell.api.alignment
// ._get_segment_start_point_label import _get_segment_start_point_label`.
//
// --- Module-level mutable callback state (real Python's own `global` variables) ---
//
// Real Python: `_horizontal_callback = None` / `_vertical_callback = None` /
// `_cant_callback = None` at module scope, reassigned wholesale (all 3, even to
// `None`) by every `register_referent_name_callback` call, and read (via `global`)
// by `_get_segment_start_point_label`. This project's own established precedent for
// porting Python module-level mutable global state is `api/owner/settings.ts`'s
// `ownerSettings` mutable-singleton-object shape -- but that shape exists
// specifically to support real Python's own attribute-*reassignment* usage pattern
// (`ifcopenshell.api.owner.settings.get_user = lambda ...`), which
// `register_referent_name_callback` does not use at all: real Python's own callers
// always go through the FUNCTION (`register_referent_name_callback(h, v, c)`), never
// reassign a module attribute directly. So this file instead uses the simpler shape
// the task itself anticipates for a case with no closer precedent: three private
// module-level `let` variables, mutated only by this file's own exported setter
// function -- mirroring real Python's own `global`-variable shape one-for-one
// (function in, function out) rather than introducing an object-property indirection
// real Python's own usage never exercises.
//
// **Real, disclosed test-ordering hazard, verified against real Python's OWN test
// suite before deciding how to test this port**: `test/api/alignment
// /test_referent_names.py` registers callbacks via `callback_alignment`'s module-
// scoped fixture (`register_referent_name_callback(_hcallback, _vcallback, None)`)
// and only resets them (`register_referent_name_callback(None, None, None)`) at the
// very END of `test_with_callbacks` -- there is no `pytest` fixture teardown/finalizer
// doing this unconditionally, so real Python's OWN suite is already
// order-/failure-dependent (a failure partway through `test_with_callbacks`, before
// its own trailing reset call runs, would leak the registered callbacks into whatever
// test runs next in the same process). This port's own `_getSegmentStartPointLabel
// .test.ts` deliberately does NOT copy that fragility: it adds a real `afterEach`
// that unconditionally calls `registerReferentNameCallback(null, null, null)`,
// matching this task's own instruction to avoid introducing order-dependent flakiness
// in a NEW test suite even where the real Python one it's ported from already has
// some -- this is a test-hygiene improvement, not a production-code behavior change
// (`registerReferentNameCallback` itself still behaves identically to real Python's
// own function, leaked state and all, if a caller doesn't reset it).
//
// --- Lookup tables ported verbatim, including every real "xx" placeholder ---
//
// All 3 tables (`_horizontal_label`/`_vertical_label`/`_cant_label`'s own nested
// dicts) are ported as literal, mechanical transcriptions of real Python's own
// dicts -- including every `"xx"` entry (real Python's own literal, deliberately
// unfilled placeholder string for a transition type the module doesn't yet have a
// real abbreviation for -- confirmed by `test_update_alignment_parameter_segment_tags
// .py`'s own `test_cant_layout_boundary_tags` comment: "CONSTANTCANT -> CONSTANTCANT
// is currently an unfilled 'xx' placeholder ... out of scope to fill in here").
import type { EntityInstance } from "../../entityInstance";

/** Python: `def mycallback(prev_segment: entity_instance, segment: entity_instance) -> str`. */
export type ReferentNameCallback = (prevSegment: EntityInstance | null, segment: EntityInstance | null) => string;

let horizontalCallback: ReferentNameCallback | null = null;
let verticalCallback: ReferentNameCallback | null = null;
let cantCallback: ReferentNameCallback | null = null;

/**
 * Registers custom naming callbacks for `updateKeyPointReferents`/
 * `updateAlignmentParameterSegmentTags`'s key-point labels (Python:
 * `ifcopenshell.api.alignment.register_referent_name_callback`).
 *
 * Referents are created at the start of each horizontal, vertical, and cant segment
 * by `updateKeyPointReferents`. The referents represent key points in the alignment
 * layout such as Point of Curvature, Point of Tangent, and others. Different
 * jurisdictions use different naming systems for these key points.
 *
 * The referent name callback functions provide a customizable method for naming
 * these referents. If a callback is registered, it is called when creating the
 * referent name, otherwise the default naming is used.
 *
 * The callback returns a string used in the referent name for the referent at the
 * start of `segment`. It must accommodate the following cases:
 * - `prevSegment === null && segment !== null` -- the first segment, so the
 *   "Beginning of Alignment" name should be returned.
 * - `prevSegment !== null && segment === null` -- the last segment, so the "End of
 *   Alignment" name should be returned.
 * - `prevSegment !== null && segment !== null` -- an intermediate segment, so a name
 *   representative of the transition should be returned.
 *
 * Passing `null` (the default) for any/all of `horizontal`/`vertical`/`cant` causes
 * the corresponding default naming to be used again.
 *
 * @param horizontal Callback for `IfcAlignmentHorizontalSegment`-based key points.
 * @param vertical Callback for `IfcAlignmentVerticalSegment`-based key points.
 * @param cant Callback for `IfcAlignmentCantSegment`-based key points.
 */
export function registerReferentNameCallback(
	horizontal: ReferentNameCallback | null = null,
	vertical: ReferentNameCallback | null = null,
	cant: ReferentNameCallback | null = null,
): void {
	horizontalCallback = horizontal;
	verticalCallback = vertical;
	cantCallback = cant;
}

const HORIZONTAL_LOOKUP: Record<string, Record<string, string>> = {
	BLOSSCURVE: {
		BLOSSCURVE: "xx",
		CIRCULARARC: "S.C.",
		CLOTHOID: "xx",
		COSINECURVE: "xx",
		CUBIC: "xx",
		HELMERTCURVE: "xx",
		LINE: "S.T.",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	CIRCULARARC: {
		BLOSSCURVE: "C.S.",
		CIRCULARARC: "P.C.C.",
		CLOTHOID: "C.S.",
		COSINECURVE: "C.S.",
		CUBIC: "C.S.",
		HELMERTCURVE: "C.S.",
		LINE: "P.T.",
		SINECURVE: "C.S.",
		VIENNESEBEND: "C.S.",
	},
	CLOTHOID: {
		BLOSSCURVE: "xx",
		CIRCULARARC: "S.C.",
		CLOTHOID: "xx",
		COSINECURVE: "xx",
		CUBIC: "xx",
		HELMERTCURVE: "xx",
		LINE: "S.T.",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	COSINECURVE: {
		BLOSSCURVE: "xx",
		CIRCULARARC: "S.C.",
		CLOTHOID: "xx",
		COSINECURVE: "xx",
		CUBIC: "xx",
		HELMERTCURVE: "xx",
		LINE: "S.T.",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	CUBIC: {
		BLOSSCURVE: "xx",
		CIRCULARARC: "S.C.",
		CLOTHOID: "xx",
		COSINECURVE: "xx",
		CUBIC: "xx",
		HELMERTCURVE: "xx",
		LINE: "S.T.",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	HELMERTCURVE: {
		BLOSSCURVE: "xx",
		CIRCULARARC: "S.C.",
		CLOTHOID: "xx",
		COSINECURVE: "xx",
		CUBIC: "xx",
		HELMERTCURVE: "xx",
		LINE: "S.T.",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	LINE: {
		BLOSSCURVE: "T.S.",
		CIRCULARARC: "P.C.",
		CLOTHOID: "T.S.",
		COSINECURVE: "T.S.",
		CUBIC: "T.S.",
		HELMERTCURVE: "T.S.",
		LINE: "P.I.",
		SINECURVE: "T.S.",
		VIENNESEBEND: "T.S.",
	},
	SINECURVE: {
		BLOSSCURVE: "xx",
		CIRCULARARC: "S.C.",
		CLOTHOID: "xx",
		COSINECURVE: "xx",
		CUBIC: "xx",
		HELMERTCURVE: "xx",
		LINE: "S.T.",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	VIENNESEBEND: {
		BLOSSCURVE: "xx",
		CIRCULARARC: "S.C.",
		CLOTHOID: "xx",
		COSINECURVE: "xx",
		CUBIC: "xx",
		HELMERTCURVE: "xx",
		LINE: "S.T.",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
};

const VERTICAL_LOOKUP: Record<string, Record<string, string>> = {
	CIRCULARARC: { CIRCULARARC: "xx", CLOTHOID: "xx", CONSTANTGRADIENT: "xx", PARABOLICARC: "xx" },
	CLOTHOID: { CIRCULARARC: "xx", CLOTHOID: "xx", CONSTANTGRADIENT: "xx", PARABOLICARC: "xx" },
	CONSTANTGRADIENT: {
		CIRCULARARC: "xx",
		CLOTHOID: "xx",
		CONSTANTGRADIENT: "P.V.I",
		PARABOLICARC: "P.V.C.",
	},
	PARABOLICARC: {
		CIRCULARARC: "xx",
		CLOTHOID: "xx",
		CONSTANTGRADIENT: "P.V.T.",
		PARABOLICARC: "V.C.C.",
	},
};

const CANT_LOOKUP: Record<string, Record<string, string>> = {
	BLOSSCURVE: {
		BLOSSCURVE: "xx",
		CONSTANTCANT: "xx",
		COSINECURVE: "xx",
		HELMERTCURVE: "xx",
		LINEARTRANSITION: "xx",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	CONSTANTCANT: {
		BLOSSCURVE: "xx",
		CONSTANTCANT: "xx",
		COSINECURVE: "xx",
		HELMERTCURVE: "xx",
		LINEARTRANSITION: "xx",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	COSINECURVE: {
		BLOSSCURVE: "xx",
		CONSTANTCANT: "xx",
		COSINECURVE: "xx",
		HELMERTCURVE: "xx",
		LINEARTRANSITION: "xx",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	HELMERTCURVE: {
		BLOSSCURVE: "xx",
		CONSTANTCANT: "xx",
		COSINECURVE: "xx",
		HELMERTCURVE: "xx",
		LINEARTRANSITION: "xx",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	LINEARTRANSITION: {
		BLOSSCURVE: "xx",
		CONSTANTCANT: "xx",
		COSINECURVE: "xx",
		HELMERTCURVE: "xx",
		LINEARTRANSITION: "xx",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	SINECURVE: {
		BLOSSCURVE: "xx",
		CONSTANTCANT: "xx",
		COSINECURVE: "xx",
		HELMERTCURVE: "xx",
		LINEARTRANSITION: "xx",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
	VIENNESEBEND: {
		BLOSSCURVE: "xx",
		CONSTANTCANT: "xx",
		COSINECURVE: "xx",
		HELMERTCURVE: "xx",
		LINEARTRANSITION: "xx",
		SINECURVE: "xx",
		VIENNESEBEND: "xx",
	},
};

function horizontalLabel(prevSegment: EntityInstance | null, segment: EntityInstance | null): string {
	if (prevSegment === null && segment !== null) return "P.O.B.";
	if (prevSegment !== null && segment === null) return "P.O.E.";
	const prevType = ((prevSegment as EntityInstance).get("DesignParameters") as EntityInstance).get(
		"PredefinedType",
	) as string;
	const type = ((segment as EntityInstance).get("DesignParameters") as EntityInstance).get("PredefinedType") as string;
	return HORIZONTAL_LOOKUP[prevType][type];
}

function verticalLabel(prevSegment: EntityInstance | null, segment: EntityInstance | null): string {
	if (prevSegment === null && segment !== null) return "V.P.O.B.";
	if (prevSegment !== null && segment === null) return "V.P.O.E.";
	const prevType = ((prevSegment as EntityInstance).get("DesignParameters") as EntityInstance).get(
		"PredefinedType",
	) as string;
	const type = ((segment as EntityInstance).get("DesignParameters") as EntityInstance).get("PredefinedType") as string;
	return VERTICAL_LOOKUP[prevType][type];
}

function cantLabel(prevSegment: EntityInstance | null, segment: EntityInstance | null): string {
	if (prevSegment === null && segment !== null) return "C.P.O.B.";
	if (prevSegment !== null && segment === null) return "C.P.O.E.";
	const prevType = ((prevSegment as EntityInstance).get("DesignParameters") as EntityInstance).get(
		"PredefinedType",
	) as string;
	const type = ((segment as EntityInstance).get("DesignParameters") as EntityInstance).get("PredefinedType") as string;
	return CANT_LOOKUP[prevType][type];
}

/** Python's `f"{[_ for _ in expected_types]}"` -- `repr()` of a list of strings (single-quoted elements, `", "`-joined). Matches `hasZeroLengthSegment.ts`'s/`nameSegments.ts`'s/`updateEndPoint.ts`'s own identical, deliberately-duplicated-per-file helper. */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

const EXPECTED_DESIGN_PARAMETER_TYPES = [
	"IfcAlignmentHorizontalSegment",
	"IfcAlignmentVerticalSegment",
	"IfcAlignmentCantSegment",
];

/**
 * Returns the label for the start point of a segment. Typically used in the name of
 * an `IfcReferent` (Python: `ifcopenshell.api.alignment._get_segment_start_point_label`,
 * module-private -- see this file's own header comment).
 *
 * @param prevSegment The `IfcAlignmentSegment` before the transition point, or `null`
 *   for the alignment's first segment.
 * @param segment The `IfcAlignmentSegment` after the transition point, or `null` for
 *   the alignment's last segment.
 * @returns The label, e.g. `"P.C."`, `"P.O.B."` -- from a registered callback (see
 *   {@link registerReferentNameCallback}) if one is set, otherwise from this file's
 *   own built-in lookup tables.
 * @throws {TypeError} If `prevSegment`/`segment` are both given and have different
 *   `isA()` classes (real Python's own check -- see this file's own header comment;
 *   unreachable in practice since both are always `IfcAlignmentSegment`), or if
 *   either's `DesignParameters` isn't one of `IfcAlignmentHorizontalSegment`/
 *   `IfcAlignmentVerticalSegment`/`IfcAlignmentCantSegment`.
 */
export function _getSegmentStartPointLabel(prevSegment: EntityInstance | null, segment: EntityInstance | null): string {
	if (prevSegment !== null && segment !== null && prevSegment.isA() !== segment.isA()) {
		throw new TypeError(
			`Expected entity type to be the same type, instead received ${prevSegment.isA()} and ${segment.isA()}`,
		);
	}

	if (prevSegment !== null) {
		const prevDesignParametersType = (prevSegment.get("DesignParameters") as EntityInstance).isA();
		if (!EXPECTED_DESIGN_PARAMETER_TYPES.includes(prevDesignParametersType)) {
			throw new TypeError(
				`Expected prev_segment.DesignParameters type to be one of ${pythonListRepr(EXPECTED_DESIGN_PARAMETER_TYPES)}, instead received ${prevDesignParametersType}`,
			);
		}
	}
	if (segment !== null) {
		const designParametersType = (segment.get("DesignParameters") as EntityInstance).isA();
		if (!EXPECTED_DESIGN_PARAMETER_TYPES.includes(designParametersType)) {
			throw new TypeError(
				`Expected segment.DesignParameters type to be one of ${pythonListRepr(EXPECTED_DESIGN_PARAMETER_TYPES)}, instead received ${designParametersType}`,
			);
		}
	}

	const s = segment !== null ? segment : (prevSegment as EntityInstance);
	const designParameters = s.get("DesignParameters") as EntityInstance;

	if (designParameters.isA("IfcAlignmentHorizontalSegment")) {
		return horizontalCallback ? horizontalCallback(prevSegment, segment) : horizontalLabel(prevSegment, segment);
	}
	if (designParameters.isA("IfcAlignmentVerticalSegment")) {
		return verticalCallback ? verticalCallback(prevSegment, segment) : verticalLabel(prevSegment, segment);
	}
	if (designParameters.isA("IfcAlignmentCantSegment")) {
		return cantCallback ? cantCallback(prevSegment, segment) : cantLabel(prevSegment, segment);
	}

	// Python: `assert False, s.DesignParameters` -- unreachable given the
	// `EXPECTED_DESIGN_PARAMETER_TYPES` checks above already guarantee one of the 3
	// branches above matches. Ported as a loud, explicit throw (this project's own
	// established "throw rather than silently misbehave on dead code" discipline --
	// see `getMappedSegments.ts`'s own `_getCurveSegmentCount` quirk 1 for the
	// identical precedent).
	throw new Error(`Unreachable: unexpected DesignParameters type '${designParameters.isA()}'`);
}
