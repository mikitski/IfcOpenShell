// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/recalculate_schedule.py` (src/ifcopenshell-python,
// 522 lines) -- by far the largest and most complex file in this whole module. Part of
// this module's FINAL chunk (see `./index.ts`'s own header comment for the full module
// history). Implements the forward-pass/backward-pass Critical Path Method (CPM) over
// the schedule's task graph: marks every task's `EarlyStart`/`EarlyFinish`/
// `LateStart`/`LateFinish`/`TotalFloat`/`FreeFloat`/`IsCritical`.
//
// --- `networkx.DiGraph` usage is trivial and fully hand-rolled here, per this chunk's
//     own brief -- no graph library dependency ---
//
// Real Python's only `networkx` usage is `DiGraph()`, `add_node`/`add_edges_from`,
// `.successors`/`.predecessors`/`.nodes`, and `self.g[a][b]` edge-data lookup -- no
// actual graph algorithm from the library is used (confirmed by reading the whole real
// file). Reproduced here with a minimal hand-rolled adjacency structure: `nodes` (a
// `Map<NodeKey, GraphNodeData>`, `NodeKey` being the string literals `"start"`/
// `"finish"` or a task's own numeric STEP id, exactly matching real Python's own mixed
// `str | int` node-id space) plus `outEdges`/`inEdges` (`Map<NodeKey, Map<NodeKey,
// GraphEdgeData>>`, giving `successorsOf`/`predecessorsOf`/`getEdge` the same O(1)
// lookups `self.g.successors(node)`/`self.g.predecessors(node)`/`self.g[u][v]` provide).
//
// --- The forward/backward pass functions' "unready, retry" signal: a bare `return`
//     (falsy/`undefined`) means "come back later", ported as an explicit `false` ---
//
// `forward_pass`/`backward_pass` are called repeatedly in a `while self.pending_nodes:`
// loop until every node resolves. A bare Python `return` (implicit `None`, falsy) inside
// either function means "this node isn't ready yet -- a predecessor/successor hasn't
// been resolved in an earlier pass", and the caller re-queues it for the next iteration;
// only reaching the very end of the function (`return True`) means "done". Ported here
// as an explicit `boolean` return: `false` for "not ready, retry", `true` for "resolved"
// -- NOT an error, and not conflated with one anywhere below.
//
// --- Cycle detection: a heuristic, ported exactly, not simplified ---
//
// `attempts` increments on every full forward-pass sweep; `max_worst_case_attempts =
// pow(len(pending_nodes), 2)` is RECOMPUTED (and `attempts` reset to 0) every time
// `pending_nodes` actually shrinks between sweeps; if `attempts` ever exceeds the
// CURRENT `max_worst_case_attempts`, the graph is treated as cyclic and a `RecursionError`
// is raised (ported as a thrown `Error`, matching this module's own established "no
// native `RecursionError` equivalent" precedent, e.g. `cascadeSchedule.ts`). Ported
// exactly -- this heuristic is NOT applied to the second (backward-pass) `while` loop at
// all, matching real Python precisely: only the forward pass has any cyclic guard: once
// the forward pass has succeeded, the graph is already proven acyclic, so the backward
// pass's own `while` loop is unguarded in real Python too (not "fixed" to add one here).
//
// --- Two genuinely unused local variables, confirmed dead by reading both full function
//     bodies -- omitted, per this chunk's own pre-verified finding ---
//
// `forward_pass`'s own `successors = self.g.successors(node)` (real line 208) and
// `backward_pass`'s own `predecessors = self.g.predecessors(node)` (real line 332) are
// each assigned and never referenced again anywhere in their respective function bodies
// -- confirmed by re-reading both functions in full before writing this file. Genuinely
// inert, zero-behavioral-effect dead code (unlike `duplicateTask.ts`'s own disclosed dead
// METHOD, which IS preserved) -- omitted here without a corresponding TS statement.
//
// --- `TimeLag.LagValue.wrappedValue` is READ (not constructed) in `addNode`'s own
//     edge-building step -- not blocked by the standalone-value-construction gap ---
//
// `ifcopenshell.util.date.ifc2datetime(rel.TimeLag.LagValue.wrappedValue)` (real line
// 154) reads an EXISTING, already-populated `IfcLagTime`'s value -- via
// `lagValue.getByIndex(0)` here, matching `./cascadeSchedule.ts`'s own established
// precedent for this exact pattern (`wrappedValue` has no native "pseudo-attribute"
// equivalent; the wrapped scalar lives at attribute index 0 of the standalone
// simple/defined-type instance). This is a READ, not a construction, so it is NOT
// blocked by the already-tracked `TODOS.md` "cannot write an initial value into a
// freshly created simple/defined-type instance" gap -- moot in THIS port only because
// nothing can populate a real `TimeLag` in the first place (see
// `duplicateTask.ts`'s/`assignLagTime.ts`'s own header comments), not because reading
// one would fail.
//
// --- Real Python quirk: no `is_a("IfcDuration")` vs. `"IfcRatioMeasure"` branch here,
//     unlike `cascadeSchedule.ts`'s own careful branching -- ported verbatim ---
//
// `addNode`'s edge-building step calls `ifc2datetime(rel.TimeLag.LagValue.wrappedValue)`
// UNCONDITIONALLY, without first checking whether `LagValue` is an `IfcDuration` (a
// string) or an `IfcRatioMeasure` (a plain float, e.g. "150% of the predecessor's own
// duration") -- unlike `cascadeSchedule.ts`'s own `lagContribution` method, which
// branches on `lagValue.isA("IfcDuration")` first. `util/date.ts`'s own `ifc2datetime`
// treats a plain JS `number` input as an `IfcTimeStamp` (epoch seconds), so a
// ratio-typed `LagValue` here would be silently misinterpreted as a moment in time near
// the Unix epoch, not a ratio -- a real, confirmed Python source bug, ported verbatim
// (not "fixed" to branch like `cascadeSchedule.ts` does). See `duplicateTask.ts`'s own
// header comment for the second, independent confirmed instance of this exact quirk.
//
// --- Two unreachable `print("How did this happen?")` debug lines, ported as
//     `console.log` -- reachable only if a real `IfcRelSequence.SequenceType` existed
//     outside the 4 documented literals, which the schema itself forbids ---
//
// Both `forward_pass`'s and `backward_pass`'s own final `else: print(...)` branches are
// reached only when a node's per-successor/per-predecessor loop produced NEITHER a
// `starts` NOR a `finishes` candidate -- which requires an edge whose `type` matches
// none of `"FS"`/`"SS"`/`"FF"`/`"SF"`. Since `mapSequenceType` below (Python's own
// `sequence_type_map` dict) maps every one of `IfcRelSequence.SequenceType`'s 6 declared
// enumeration literals (`FINISH_START`/`START_START`/`FINISH_FINISH`/`START_FINISH`/
// `USERDEFINED`/`NOTDEFINED`) plus `null` onto one of those 4 edge types, this branch is
// unreachable via any schema-valid `IfcRelSequence` -- ported as `console.log` anyway
// (matching this module's own established Python `print()` -> `console.log` precedent,
// `cascadeSchedule.ts`), not silently dropped, since it's real source, just dead by
// construction rather than provably-dead like `duplicateTask.ts`'s own dead method.
//
// --- Naive-datetime SUBTRACTION (`late_finish - early_finish`), needed for a non-
//     `WORKTIME` `total_float` -- a NEW local helper, not `util/date.ts`'s own private,
//     semantically-different `toEpochSeconds` ---
//
// Real Python subtracts two naive `datetime.datetime` objects directly (pure calendar
// field arithmetic, independent of any system timezone -- naive-datetime subtraction in
// Python never consults `.timestamp()`/system tz at all, unlike `.timestamp()` itself,
// which DOES for a naive value). `util/date.ts`'s own private `toEpochSeconds` exists
// for the LATTER case (`IfcTimeStamp` conversion, where consulting local system tz is
// the intentionally-matched behavior) and isn't exported anyway -- reusing it here would
// be both inaccessible and semantically wrong. `diffDuration` below instead computes
// both sides via `Date.UTC` (UTC has no DST, so this is deterministic pure calendar
// arithmetic, the closest true equivalent to Python's own naive-datetime subtraction)
// and normalizes the result the same way Python's `datetime.timedelta` always does
// (`days = floor(totalSeconds / 86400)`, `0 <= seconds < 86400`) -- required for the
// real `data["total_float"].seconds == 60 * 60 * 8` check (real lines 488/493) to behave
// identically to Python's own `timedelta.seconds` semantics.
//
// `util.date.ifc2datetime`/`datetime2ifc`, `util.sequence.deriveCalendar`/
// `getSequenceAssignment`/`getStartOrFinishDate`/`offsetDate`/`countWorkingDays` (all
// already landed), and this SAME module's already-landed `editTaskTime` (chunk 3, real
// call inside `update_task_times`, real line 188) are the only real dependencies --
// confirmed by reading the whole real file.
//
// Schema availability: `IfcTaskTime`/`IfcLagTime`/`IfcWorkCalendar` do NOT exist on
// IFC2X3 at all (confirmed against `ifc2x3.d.ts`, matching this module's own chunk 1/2/3
// findings) -- `build_network_graph`'s own `task.TaskTime`/`derive_calendar` reads throw
// on IFC2X3 the moment any task exists, matching real Python's own unguarded behavior
// (no IFC2X3-specific branch exists in real Python either, and real Python's own test
// suite is IFC4-only: "sequence module features relies on entities introduced in IFC4
// therefore no IFC2X3 tests").
//
// --- Real Python test file EXISTS -- corrects this chunk's own brief, which claimed
//     otherwise ---
//
// `test/api/sequence/test_recalculate_schedule.py` exists (confirmed by listing the
// real `test/api/sequence/` directory directly) and has 9 real test cases covering the
// "no task time" no-op, cyclic-sequence detection, a single task, all 4 sequence types
// (FS/FF/SS/SF), a milestone as both a middle and last task, and a multi-successor
// chain with one `lag=` case -- ported in `recalculateSchedule.test.ts`, see that file's
// own header comment for how the 2 lag-dependent cases were adapted (`assignLagTime`
// remains fully blocked, so no fixture can populate a real `TimeLag`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type Duration, type IsoDate, datetime2ifc, ifc2datetime } from "../../util/date";
import {
	type CalendarValue,
	type DurationType,
	countWorkingDays,
	deriveCalendar,
	getSequenceAssignment,
	getStartOrFinishDate,
	offsetDate,
} from "../../util/sequence";
import { wrapUsecase } from "../hooks";
import { editTaskTime } from "./editTaskTime";

type NodeKey = "start" | "finish" | number;
type SequenceEdgeType = "FS" | "SS" | "FF" | "SF";

interface GraphNodeData {
	duration: number;
	durationType: DurationType;
	calendar: EntityInstance | null;
	earlyStart?: CalendarValue;
	earlyFinish?: CalendarValue;
	lateStart?: CalendarValue;
	lateFinish?: CalendarValue;
	totalFloat?: Duration;
	freeFloat?: Duration | null;
}

interface GraphEdgeData {
	lagTime: number;
	type: SequenceEdgeType;
}

/** Python: `self.sequence_type_map` dict (`None`/`"FINISH_START"`/`"USERDEFINED"`/
 * `"NOTDEFINED"` -> `"FS"`, etc). A JS object can't key on `null`, so this is a small
 * function instead of a literal dict -- same 7-way mapping either way. */
function mapSequenceType(sequenceType: string | null): SequenceEdgeType {
	switch (sequenceType) {
		case null:
		case "FINISH_START":
		case "USERDEFINED":
		case "NOTDEFINED":
			return "FS";
		case "START_START":
			return "SS";
		case "FINISH_FINISH":
			return "FF";
		case "START_FINISH":
			return "SF";
		default:
			// Python: a bare `dict[key]` lookup -- `KeyError` for anything outside
			// `IfcRelSequence.SequenceType`'s own 6 declared enumeration literals (every
			// one of which is covered above) -- unreachable via a schema-valid rel.
			throw new Error(`KeyError: '${sequenceType}'`);
	}
}

function daysDuration(days: number): Duration {
	return { years: 0, months: 0, days, hours: 0, minutes: 0, seconds: 0 };
}

/** Python: `datetime.datetime.combine(date, datetime.time(hour))` -- matches
 * `cascadeSchedule.ts`'s/`editTaskTime.ts`'s own identical local helper's doc comment
 * for why this isn't shared/exported from `util/sequence.ts` (duplicated here too). */
function combineDateWithTime(date: CalendarValue, hour: number): CalendarValue {
	return {
		kind: "datetime",
		year: date.year,
		month: date.month,
		day: date.day,
		hour,
		minute: 0,
		second: 0,
		microsecond: 0,
	};
}

/** Python: `datetime.date(y, m, d)` truncation (`.date()`) -- used only by the FS branch
 * of `backwardPass`'s own free-float calculation, matching real Python exactly. */
function toDateOnly(value: CalendarValue): IsoDate {
	return { kind: "date", year: value.year, month: value.month, day: value.day };
}

/** Python: `date + datetime.timedelta(days=1)` on a plain `datetime.date` (no
 * time-of-day component) -- matches `editTaskTime.ts`'s own identical `addDay` helper
 * (not exported from there, so duplicated here). */
function addOneDay(value: IsoDate): IsoDate {
	const date = new Date(value.year, value.month - 1, value.day);
	date.setDate(date.getDate() + 1);
	return { kind: "date", year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/** See this file's header comment: field-by-field chronological comparison, matching
 * `cascadeSchedule.ts`'s own identical private `compareMixed` helper (not exported from
 * there, so duplicated here) -- every value compared below is always `"datetime"`-kind
 * except `calculateFreeFloat`'s own FS-branch `toDateOnly` values, which are always
 * compared against ANOTHER `toDateOnly` value (both `"date"`-kind), never mixed. */
function compareCalendarValues(a: CalendarValue, b: CalendarValue): number {
	const ah = a.kind === "datetime" ? a.hour : 0;
	const bh = b.kind === "datetime" ? b.hour : 0;
	const amin = a.kind === "datetime" ? a.minute : 0;
	const bmin = b.kind === "datetime" ? b.minute : 0;
	const asec = a.kind === "datetime" ? a.second : 0;
	const bsec = b.kind === "datetime" ? b.second : 0;
	if (a.year !== b.year) return a.year - b.year;
	if (a.month !== b.month) return a.month - b.month;
	if (a.day !== b.day) return a.day - b.day;
	if (ah !== bh) return ah - bh;
	if (amin !== bmin) return amin - bmin;
	return asec - bsec;
}

function maxCalendarValue(values: readonly CalendarValue[]): CalendarValue {
	let result = values[0];
	for (const value of values.slice(1)) {
		if (compareCalendarValues(value, result) > 0) result = value;
	}
	return result;
}

function minCalendarValue(values: readonly CalendarValue[]): CalendarValue {
	let result = values[0];
	for (const value of values.slice(1)) {
		if (compareCalendarValues(value, result) < 0) result = value;
	}
	return result;
}

/** Python: `datetime.datetime(...).timestamp()`-free naive-datetime subtraction -- see
 * this file's header comment for why this is a NEW local helper, not a reuse of
 * `util/date.ts`'s own private, semantically-different `toEpochSeconds`. */
function toUtcMs(dt: CalendarValue): number {
	if (dt.kind === "date") return Date.UTC(dt.year, dt.month - 1, dt.day);
	return Date.UTC(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute, dt.second, Math.floor(dt.microsecond / 1000));
}

/** Python: `a - b` for two `datetime.datetime` values, normalized exactly like
 * `datetime.timedelta` (`days = floor(totalSeconds / 86400)`, `0 <= seconds < 86400`). */
function diffDuration(a: CalendarValue, b: CalendarValue): Duration {
	const totalSeconds = (toUtcMs(a) - toUtcMs(b)) / 1000;
	const days = Math.floor(totalSeconds / 86400);
	const seconds = totalSeconds - days * 86400;
	return { years: 0, months: 0, days, hours: 0, minutes: 0, seconds };
}

/** Python: `min(free_floats)`/`min((offset_date(...), offset_date(...)))` over
 * `datetime.timedelta` values -- compared by total effective seconds, matching
 * `util/sequence.ts`'s own `getStartOrFinishDate`'s "days + months*30 + years*12*30"
 * convention for reducing a `Duration` to a single linear scale (every `Duration` this
 * file ever compares is a `daysDuration`/`diffDuration` result, so `years`/`months` are
 * always 0 in practice; kept in the formula for a faithful general-purpose comparator). */
function durationTotalSeconds(d: Duration): number {
	return (d.years * 360 + d.months * 30 + d.days) * 86400 + d.hours * 3600 + d.minutes * 60 + d.seconds;
}

function minDuration(values: readonly Duration[]): Duration {
	let result = values[0];
	for (const value of values.slice(1)) {
		if (durationTotalSeconds(value) < durationTotalSeconds(result)) result = value;
	}
	return result;
}

class RecalculateScheduleContext {
	private readonly nodes = new Map<NodeKey, GraphNodeData>();
	private readonly outEdges = new Map<NodeKey, Map<NodeKey, GraphEdgeData>>();
	private readonly inEdges = new Map<NodeKey, Map<NodeKey, GraphEdgeData>>();
	private edges: Array<[NodeKey, NodeKey, GraphEdgeData]> = [];
	private startDates: CalendarValue[] = [];
	private pendingNodes = new Set<NodeKey>();

	constructor(private readonly file: IfcFile) {}

	execute(workSchedule: EntityInstance): void {
		this.buildNetworkGraph(workSchedule);

		if (this.startDates.length === 0) return;

		let isCyclic = false;
		let attempts = 0;
		this.pendingNodes = new Set(this.nodes.keys());
		let maxWorstCaseAttempts = this.pendingNodes.size ** 2;
		while (this.pendingNodes.size > 0) {
			attempts += 1;
			const remainingNodes = new Set<NodeKey>();
			for (const pendingNode of this.pendingNodes) {
				if (!this.forwardPass(pendingNode)) {
					remainingNodes.add(pendingNode);
				}
			}
			this.pendingNodes = remainingNodes;

			// As we parse nodes, the remaining attempts can drop dramatically, so we
			// recalculate the upper limit.
			const maxRemainingAttempts = this.pendingNodes.size ** 2;
			if (maxRemainingAttempts < maxWorstCaseAttempts) {
				maxWorstCaseAttempts = maxRemainingAttempts;
				attempts = 0;
			}

			if (attempts > maxWorstCaseAttempts) {
				isCyclic = true;
				break; // We have an infinite loop due to a cyclic graph
			}
		}

		if (isCyclic) {
			throw new Error("Task graph is cyclic and so critical path method cannot be performed.");
		}

		// See this file's header comment: NO cyclic guard on this second loop, matching
		// real Python exactly -- the forward pass having succeeded already proves the
		// graph is acyclic.
		this.pendingNodes = new Set(this.nodes.keys());
		while (this.pendingNodes.size > 0) {
			const remainingNodes = new Set<NodeKey>();
			for (const pendingNode of this.pendingNodes) {
				if (!this.backwardPass(pendingNode)) {
					remainingNodes.add(pendingNode);
				}
			}
			this.pendingNodes = remainingNodes;
		}

		this.updateTaskTimes();
	}

	private buildNetworkGraph(workSchedule: EntityInstance): void {
		this.edges = [];
		this.nodes.set("start", { duration: 0, durationType: "ELAPSEDTIME", calendar: null });
		this.nodes.set("finish", { duration: 0, durationType: "ELAPSEDTIME", calendar: null });
		for (const rel of workSchedule.get("Controls") as EntityInstance[]) {
			for (const relatedObject of rel.get("RelatedObjects") as EntityInstance[]) {
				if (!relatedObject.isA("IfcTask")) continue;
				this.addNode(relatedObject);
			}
		}
		for (const [u, v, data] of this.edges) {
			this.addEdge(u, v, data);
		}
	}

	private addEdge(u: NodeKey, v: NodeKey, data: GraphEdgeData): void {
		let outMap = this.outEdges.get(u);
		if (!outMap) {
			outMap = new Map();
			this.outEdges.set(u, outMap);
		}
		outMap.set(v, data);
		let inMap = this.inEdges.get(v);
		if (!inMap) {
			inMap = new Map();
			this.inEdges.set(v, inMap);
		}
		inMap.set(u, data);
	}

	private addNode(task: EntityInstance): void {
		const isNestedBy = task.get("IsNestedBy") as EntityInstance[];
		if (isNestedBy.length > 0) {
			for (const rel of isNestedBy) {
				for (const o of rel.get("RelatedObjects") as EntityInstance[]) {
					this.addNode(o);
				}
			}
			return;
		}

		const taskTime = task.get("TaskTime") as EntityInstance | null;
		let duration: number;
		let durationType: DurationType;
		if (taskTime?.get("ScheduleDuration")) {
			duration = (ifc2datetime(taskTime.get("ScheduleDuration") as string) as Duration).days;
			durationType = taskTime.get("DurationType") as DurationType;
		} else {
			duration = 0;
			durationType = "ELAPSEDTIME";
		}

		this.nodes.set(task.id(), { duration, durationType, calendar: deriveCalendar(task) });

		for (const rel of getSequenceAssignment(task, "predecessor")) {
			const timeLag = rel.get("TimeLag") as EntityInstance | null;
			let lagTime = 0;
			if (timeLag) {
				// See this file's header comment: READ of an existing value, and no
				// `is_a("IfcDuration")` branch -- both ported verbatim.
				const lagValue = timeLag.get("LagValue") as EntityInstance;
				lagTime = (ifc2datetime(lagValue.getByIndex(0) as string | number) as Duration).days;
			}
			this.edges.push([
				(rel.get("RelatingProcess") as EntityInstance).id(),
				task.id(),
				{ lagTime, type: mapSequenceType(rel.get("SequenceType") as string | null) },
			]);
		}

		// Python calls `get_sequence_assignment` twice more (once per list below) --
		// ported verbatim rather than reusing the edge-building loop's own result.
		const predecessorTypes = getSequenceAssignment(task, "predecessor");
		const successorTypes = getSequenceAssignment(task, "successor");

		if (predecessorTypes.length === 0) {
			this.edges.push(["start", task.id(), { lagTime: 0, type: "FS" }]);
			const scheduleStart = taskTime?.get("ScheduleStart") as string | null | undefined;
			if (scheduleStart) {
				const start = ifc2datetime(scheduleStart) as CalendarValue;
				this.startDates.push(start);
				// We assume this task is constrained to start on this date.
				const node = this.nodes.get(task.id());
				if (node) node.earlyStart = start;
			}
		}
		if (successorTypes.length === 0) {
			this.edges.push([task.id(), "finish", { lagTime: 0, type: "FF" }]);
		}
	}

	private updateTaskTimes(): void {
		for (const [key, data] of this.nodes) {
			if (key === "start" || key === "finish") continue;
			const task = this.file.byId(key);
			const taskTime = task.get("TaskTime") as EntityInstance | null;
			if (!taskTime) continue;
			editTaskTime(this.file, {
				taskTime,
				attributes: {
					FreeFloat: datetime2ifc(data.freeFloat ?? undefined, "IfcDuration"),
					TotalFloat: datetime2ifc(data.totalFloat as Duration, "IfcDuration"),
					IsCritical: (data.totalFloat as Duration).days === 0,
					EarlyStart: datetime2ifc(data.earlyStart as CalendarValue, "IfcDateTime"),
					EarlyFinish: datetime2ifc(data.earlyFinish as CalendarValue, "IfcDateTime"),
					LateStart: datetime2ifc(data.lateStart as CalendarValue, "IfcDateTime"),
					LateFinish: datetime2ifc(data.lateFinish as CalendarValue, "IfcDateTime"),
				},
			});
		}
	}

	private getNode(key: NodeKey): GraphNodeData {
		const data = this.nodes.get(key);
		if (!data) throw new Error(`Unknown graph node: ${key}`);
		return data;
	}

	private getEdge(u: NodeKey, v: NodeKey): GraphEdgeData {
		const edge = this.outEdges.get(u)?.get(v);
		if (!edge) throw new Error(`Unknown graph edge: ${u} -> ${v}`);
		return edge;
	}

	private successorsOf(node: NodeKey): NodeKey[] {
		return [...(this.outEdges.get(node)?.keys() ?? [])];
	}

	private predecessorsOf(node: NodeKey): NodeKey[] {
		return [...(this.inEdges.get(node)?.keys() ?? [])];
	}

	private offsetDateForNode(date: CalendarValue, days: number, node: GraphNodeData): CalendarValue {
		return offsetDate(date, daysDuration(days), node.durationType, node.calendar);
	}

	/**
	 * Python: `forward_pass(self, node) -> bool`. Returns `false` ("not ready, retry" --
	 * see this file's header comment) or `true` ("resolved").
	 */
	private forwardPass(node: NodeKey): boolean {
		// Python's own `successors = self.g.successors(node)` (real line 208) is
		// confirmed unused after assignment -- omitted, see this file's header comment.
		const predecessors = this.predecessorsOf(node);
		const data = this.getNode(node);

		if (node === "start") {
			data.earlyStart = minCalendarValue(this.startDates);
		} else {
			const finishes: CalendarValue[] = [];
			const starts: CalendarValue[] = [];
			if (data.earlyStart !== undefined) {
				data.earlyFinish = getStartOrFinishDate(
					data.earlyStart,
					daysDuration(data.duration),
					data.durationType,
					data.calendar,
					"FINISH",
				) as CalendarValue;
				return true; // we're done! We assume this task is constrained and finish processing it
			}

			for (const predecessor of predecessors) {
				const predecessorData = this.getNode(predecessor);
				const edge = this.getEdge(predecessor, node);
				if (edge.type === "FS") {
					const finish = predecessorData.earlyFinish;
					if (finish === undefined) return false;
					let days = predecessorData.duration === 0 ? 0 : 1;
					if (edge.lagTime) days += edge.lagTime;
					if (days) {
						starts.push(combineDateWithTime(this.offsetDateForNode(finish, days, data), 9));
						starts.push(combineDateWithTime(this.offsetDateForNode(finish, days, predecessorData), 9));
					} else {
						starts.push(finish);
					}
				} else if (edge.type === "SS") {
					const start = predecessorData.earlyStart;
					if (start === undefined) return false;
					if (edge.lagTime) {
						starts.push(this.offsetDateForNode(start, edge.lagTime, data));
						starts.push(this.offsetDateForNode(start, edge.lagTime, predecessorData));
					} else {
						starts.push(start);
					}
				} else if (edge.type === "FF") {
					const finish = predecessorData.earlyFinish;
					if (finish === undefined) return false;
					if (edge.lagTime) {
						finishes.push(this.offsetDateForNode(finish, edge.lagTime, data));
						finishes.push(this.offsetDateForNode(finish, edge.lagTime, predecessorData));
					} else {
						finishes.push(finish);
					}
				} else if (edge.type === "SF") {
					const start = predecessorData.earlyStart;
					if (start === undefined) return false;
					let days = -1;
					if (edge.lagTime) days += edge.lagTime;
					if (days || edge.lagTime) {
						finishes.push(combineDateWithTime(this.offsetDateForNode(start, days, data), 17));
						finishes.push(combineDateWithTime(this.offsetDateForNode(start, days, predecessorData), 17));
					} else {
						finishes.push(start);
					}
				}
			}
			if (starts.length > 0 && finishes.length > 0) {
				data.earlyStart = maxCalendarValue(starts);
				data.earlyFinish = maxCalendarValue(finishes);
				const potentialFinish = getStartOrFinishDate(
					data.earlyStart,
					daysDuration(data.duration),
					data.durationType,
					data.calendar,
					"FINISH",
				) as CalendarValue;
				if (compareCalendarValues(potentialFinish, data.earlyFinish) > 0) {
					data.earlyFinish = potentialFinish;
				} else {
					data.earlyStart = getStartOrFinishDate(
						data.earlyFinish,
						daysDuration(data.duration),
						data.durationType,
						data.calendar,
						"START",
					) as CalendarValue;
				}
			} else if (finishes.length > 0) {
				data.earlyFinish = maxCalendarValue(finishes);
			} else if (starts.length > 0) {
				data.earlyStart = maxCalendarValue(starts);
			} else {
				// See this file's header comment: unreachable via any schema-valid
				// `IfcRelSequence`, ported anyway (real Python source).
				console.log("How did this happen?");
			}
		}

		if (data.earlyFinish === undefined) {
			data.earlyFinish = getStartOrFinishDate(
				data.earlyStart as CalendarValue,
				daysDuration(data.duration),
				data.durationType,
				data.calendar,
				"FINISH",
			) as CalendarValue;
		} else if (data.earlyStart === undefined) {
			data.earlyStart = getStartOrFinishDate(
				data.earlyFinish,
				daysDuration(data.duration),
				data.durationType,
				data.calendar,
				"START",
			) as CalendarValue;
		}

		return true;
	}

	/**
	 * Python: `backward_pass(self, node) -> bool`. Same "unready, retry" convention as
	 * `forwardPass` above.
	 */
	private backwardPass(node: NodeKey): boolean {
		const successors = this.successorsOf(node);
		// Python's own `predecessors = self.g.predecessors(node)` (real line 332) is
		// confirmed unused after assignment -- omitted, see this file's header comment.
		const data = this.getNode(node);
		const freeFloats: Duration[] = [];

		if (node === "finish") {
			data.lateFinish = data.earlyFinish;
		} else {
			const finishes: CalendarValue[] = [];
			const starts: CalendarValue[] = [];
			for (const successor of successors) {
				const successorData = this.getNode(successor);
				const edge = this.getEdge(node, successor);
				if (edge.type === "FS") {
					const start = successorData.lateStart;
					if (start === undefined) return false;
					let days = 1;
					if (edge.lagTime) days += edge.lagTime;
					if (days || edge.lagTime) {
						finishes.push(combineDateWithTime(this.offsetDateForNode(start, -days, data), 17));
						finishes.push(combineDateWithTime(this.offsetDateForNode(start, -days, successorData), 17));
					} else {
						finishes.push(start);
					}
					freeFloats.push(
						this.calculateFreeFloat(
							addOneDay(toDateOnly(data.earlyFinish as CalendarValue)),
							toDateOnly(successorData.earlyStart as CalendarValue),
							edge.lagTime,
							data,
							successorData,
						),
					);
				} else if (edge.type === "SS") {
					const start = successorData.lateStart;
					if (start === undefined) return false;
					if (edge.lagTime) {
						starts.push(this.offsetDateForNode(start, -edge.lagTime, data));
						starts.push(this.offsetDateForNode(start, -edge.lagTime, successorData));
					} else {
						starts.push(start);
					}
					freeFloats.push(
						this.calculateFreeFloat(
							data.earlyStart as CalendarValue,
							successorData.earlyStart as CalendarValue,
							edge.lagTime,
							data,
							successorData,
						),
					);
				} else if (edge.type === "FF") {
					const finish = successorData.lateFinish;
					if (finish === undefined) return false;
					if (edge.lagTime) {
						finishes.push(this.offsetDateForNode(finish, -edge.lagTime, data));
						finishes.push(this.offsetDateForNode(finish, -edge.lagTime, successorData));
					} else {
						finishes.push(finish);
					}
					freeFloats.push(
						this.calculateFreeFloat(
							data.earlyFinish as CalendarValue,
							successorData.earlyFinish as CalendarValue,
							edge.lagTime,
							data,
							successorData,
						),
					);
				} else if (edge.type === "SF") {
					const finish = successorData.lateFinish;
					if (finish === undefined) return false;
					let days = successorData.duration === 0 ? 0 : -1;
					if (edge.lagTime) days += edge.lagTime;
					if (days) {
						starts.push(combineDateWithTime(this.offsetDateForNode(finish, -days, data), 9));
						starts.push(combineDateWithTime(this.offsetDateForNode(finish, -days, successorData), 9));
					} else {
						starts.push(finish);
					}
					freeFloats.push(
						this.calculateFreeFloat(
							data.earlyStart as CalendarValue,
							successorData.earlyFinish as CalendarValue,
							edge.lagTime,
							data,
							successorData,
						),
					);
				}
			}
			if (starts.length > 0 && finishes.length > 0) {
				data.lateStart = minCalendarValue(starts);
				data.lateFinish = minCalendarValue(finishes);
				if (compareCalendarValues(this.offsetDateForNode(data.lateStart, data.duration, data), data.lateFinish) < 0) {
					data.lateFinish = getStartOrFinishDate(
						data.lateStart,
						daysDuration(data.duration),
						data.durationType,
						data.calendar,
						"FINISH",
					) as CalendarValue;
				} else {
					data.lateStart = getStartOrFinishDate(
						data.lateFinish,
						daysDuration(data.duration),
						data.durationType,
						data.calendar,
						"START",
					) as CalendarValue;
				}
			} else if (finishes.length > 0) {
				data.lateFinish = minCalendarValue(finishes);
			} else if (starts.length > 0) {
				data.lateStart = minCalendarValue(starts);
			} else {
				// See this file's header comment: unreachable via any schema-valid
				// `IfcRelSequence`, ported anyway (real Python source).
				console.log("How did this happen?");
			}
		}

		if (data.lateFinish === undefined) {
			data.lateFinish = getStartOrFinishDate(
				data.lateStart as CalendarValue,
				daysDuration(data.duration),
				data.durationType,
				data.calendar,
				"FINISH",
			) as CalendarValue;
		} else if (data.lateStart === undefined) {
			data.lateStart = getStartOrFinishDate(
				data.lateFinish,
				daysDuration(data.duration),
				data.durationType,
				data.calendar,
				"START",
			) as CalendarValue;
		}

		if (data.durationType === "WORKTIME") {
			data.totalFloat = daysDuration(
				countWorkingDays(data.earlyFinish as CalendarValue, data.lateFinish, data.calendar),
			);
		} else {
			data.totalFloat = diffDuration(data.lateFinish, data.earlyFinish as CalendarValue);
			// If the float is within the span of a single day, it may show as 8 hours.
			if (data.totalFloat.seconds === 60 * 60 * 8) {
				data.totalFloat = daysDuration(data.totalFloat.days + 1);
			}
		}

		data.freeFloat = freeFloats.length > 0 ? minDuration(freeFloats) : null;
		// If the float is within the span of a single day, it may show as 8 hours.
		if (data.freeFloat && data.freeFloat.seconds === 60 * 60 * 8) {
			data.freeFloat = daysDuration(data.freeFloat.days + 1);
		}

		return true;
	}

	private calculateFreeFloat(
		predecessorDate: CalendarValue,
		successorDate: CalendarValue,
		lagTime: number,
		predecessorData: GraphNodeData,
		successorData: GraphNodeData,
	): Duration {
		let minSuccessorDate: CalendarValue;
		if (!lagTime) {
			minSuccessorDate = successorDate;
		} else {
			minSuccessorDate = minCalendarValue([
				this.offsetDateForNode(successorDate, -lagTime, predecessorData),
				this.offsetDateForNode(successorDate, -lagTime, successorData),
			]);
		}
		if (predecessorData.durationType === "WORKTIME") {
			return daysDuration(countWorkingDays(predecessorDate, minSuccessorDate, predecessorData.calendar));
		}
		return diffDuration(minSuccessorDate, predecessorDate);
	}
}

export interface RecalculateScheduleSettings {
	/** The `IfcWorkSchedule` to perform the critical path calculation on. */
	workSchedule: EntityInstance;
}

function recalculateScheduleUsecase(file: IfcFile, settings: RecalculateScheduleSettings): void {
	new RecalculateScheduleContext(file).execute(settings.workSchedule);
}

/**
 * Calculates the critical path and floats for a work schedule (Python:
 * `ifcopenshell.api.sequence.recalculate_schedule`).
 *
 * This implements critical path analysis, using the forward pass and backward pass
 * method. When run, any tasks that have no float will be marked as critical, and both
 * the total and free floats will be populated for all task times.
 *
 * Cyclical relationships are detected and will result in a thrown error.
 *
 * @example
 * ```ts
 * // See the example for api.sequence.cascadeSchedule for details of how to set up a
 * // basic set of tasks. Typically cascadeSchedule is run prior to ensure dates are
 * // correct.
 * api.sequence.recalculateSchedule(model, { workSchedule: schedule });
 * ```
 */
export const recalculateSchedule = wrapUsecase("sequence.recalculate_schedule", recalculateScheduleUsecase);
