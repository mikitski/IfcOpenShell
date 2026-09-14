// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/constraint/add_metric.py` (src/ifcopenshell-python, 55
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Creates a new `IfcMetric` and, if an `objective` is given, appends it to the
// objective's `BenchmarkValues` list.
//
// --- `IfcMetric`'s attribute order, verified across all 3 schemas, not assumed ---
//
// `Name`(0)/`Description`(1)/`ConstraintGrade`(2)/`ConstraintSource`(3)/
// `CreatingActor`(4)/`CreationTime`(5)/`UserDefinedGrade`(6)/`Benchmark`(7) are
// identical and contiguous across all 3 schemas' generated `.d.ts` files (IFC4+
// additionally appends `ValueSource`(8)/`DataValue`(9)/`ReferencePath`(10, IFC4+ only --
// see `./addMetricReference.ts`'s header comment), but this file never touches those
// trailing positions). No DERIVE attribute anywhere in `IfcMetric`'s hierarchy on any
// schema. Like `IfcObjective` (see `./addObjective.ts`'s header comment), `IfcMetric` is
// not an `IfcRoot` subtype -- no `GlobalId`/`OwnerHistory` to populate.
//
// --- Real Python quirk, disclosed not "fixed": `objective.BenchmarkValues` cast to an
//     array uniformly across all 3 schemas, NOT branched on the generated `.d.ts`'s own
//     apparent IFC2X3-vs-IFC4+ type difference ---
//
// `IfcObjective.BenchmarkValues` is `IfcConstraint[] | null` in `ifc4.d.ts`/
// `ifc4x3.d.ts`, but shows as a bare, non-array `IfcMetric | null` in `ifc2x3.d.ts`
// (verified directly, not assumed) -- at face value this looks like a real
// IFC2X3-vs-IFC4+ cardinality difference (EXPRESS `LIST [1:?] OF IfcMetricValue` in the
// real IFC2X3 schema, vs. a direct `LIST [1:?] OF IfcConstraint` on IFC4+, where
// `IfcMetricValue` is IFC2X3's own indirect defined-type alias for `IfcMetric`), but is
// more likely a `.d.ts`-generation artifact specific to LIST attributes declared through
// such an indirect EXPRESS defined-type alias rather than a genuine scalar attribute --
// the already-landed `util/constraint.ts`'s `getMetrics` (this exact attribute's other
// real caller, ported in an earlier Phase 3 chunk) already reads `BenchmarkValues` as
// `EntityInstance[] | null` completely unbranched across all 3 schemas, with no
// IFC2X3-specific handling at all. This file follows that same already-established,
// already-merged precedent rather than introducing a NEW, untested IFC2X3 scalar branch
// of its own that would contradict it. Real Python itself does not special-case IFC2X3
// here either (`list(objective.BenchmarkValues or [])` runs unconditionally on every
// schema) -- ported verbatim, matching Python's own schema-agnostic behavior.
//
// Could not be empirically verified against a real IFC2X3 file in this sandbox: the
// locally available native addon build only has the IFC4 schema plugin registered
// (`AVAILABLE_SCHEMAS` resolves to `["IFC4"]` here), matching this project's own
// already-tracked, pre-existing build gap (see `api.library`'s landed `PROGRESS.md` row:
// "IFC2X3/IFC4X3 unavailable in this build's C++ core, matching CI's own
// `-DSCHEMA_VERSIONS=4` gap") -- not a regression introduced by this chunk.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddMetricSettings {
	/**
	 * The `IfcObjective` that this metric is a benchmark of. Real Python's own type hint
	 * says `entity_instance` (implying required), but its body does `if objective:` --
	 * ported verbatim as nullable, matching real Python's own actually-guarded behavior.
	 */
	objective: EntityInstance | null;
}

function addMetricUsecase(file: IfcFile, settings: AddMetricSettings): EntityInstance {
	const { objective } = settings;

	// IfcMetric: Name(0), Description(1), ConstraintGrade(2), ConstraintSource(3),
	// CreatingActor(4), CreationTime(5), UserDefinedGrade(6), Benchmark(7) -- see header
	// comment.
	const metric = file.createEntity("IfcMetric", "Unnamed", null, "NOTDEFINED", null, null, null, null, "EQUALTO");

	if (objective) {
		// Python: `benchmark_values = list(objective.BenchmarkValues or []);
		// benchmark_values.append(metric); objective.BenchmarkValues = benchmark_values` --
		// see header comment on why this is cast to an array uniformly, not branched.
		const benchmarkValues = [...((objective.get("BenchmarkValues") as EntityInstance[] | null) ?? [])];
		benchmarkValues.push(metric);
		objective.set("BenchmarkValues", benchmarkValues);
	}

	return metric;
}

/**
 * Add a new metric benchmark (Python: `ifcopenshell.api.constraint.add_metric`).
 *
 * Qualitative constraints may have a series of quantitative benchmarks linked to it
 * known as metrics. Metrics may be parametrically linked to computed model properties
 * or quantities. Metrics need to be satisfied to meet the objective of the constraint.
 *
 * @returns The newly created `IfcMetric` entity.
 *
 * @example
 * ```ts
 * const objective = api.constraint.addObjective(model, {});
 * const metric = api.constraint.addMetric(model, { objective });
 * ```
 */
export const addMetric = wrapUsecase("constraint.add_metric", addMetricUsecase);
