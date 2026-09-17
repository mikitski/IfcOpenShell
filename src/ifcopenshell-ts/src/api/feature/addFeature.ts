// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/feature/add_feature.py` (src/ifcopenshell-python, 151
// lines) -- creates (or updates) the void/projection/adherence relationship between an
// `IfcFeatureElement` (an opening, projection, or surface feature) and the `IfcElement`
// it affects, then re-localizes the feature's own placement relative to that element if
// it currently has one.
//
// --- The three feature kinds and their relationship classes ---
//
// - `IfcFeatureElementSubtraction` (e.g. `IfcOpeningElement`, IFC4+'s
//   `IfcVoidingFeature`) voids an element via `IfcRelVoidsElement`
//   (`RelatingBuildingElement`/`RelatedOpeningElement`).
// - `IfcFeatureElementAddition` (e.g. `IfcProjectionElement`) projects from an element
//   via `IfcRelProjectsElement` (`RelatingElement`/`RelatedFeatureElement`).
// - `IfcSurfaceFeature` (IFC4+ only -- absent from IFC2X3, confirmed by grep against
//   `generated/ifc2x3.d.ts`) adheres to an element. On the real IFC4 schema,
//   `IfcSurfaceFeature` has no dedicated `IfcRelAdheresToElement` class at all (that
//   relationship is IFC4X3-only, confirmed absent from `generated/ifc4.d.ts`) -- so
//   real Python instead attaches it via a plain aggregation
//   (`ifcopenshell.api.aggregate.assign_object`), returning directly. On IFC4X3, it
//   uses the real `IfcRelAdheresToElement` (`RelatingElement`/`RelatedSurfaceFeatures`,
//   the only one of the three relationship classes whose "related" side is a LIST
//   rather than a single entity, since several surface features may adhere to the same
//   element through one shared rel).
//
// --- `rels[0][4]`: real Python's positional-index trick, ported as a per-class named
// lookup instead ---
//
// Real Python reads `rels[0][4]` -- the 5th positional attribute of whichever
// relationship class is in play -- rather than a named attribute, exploiting the fact
// that `RelatingBuildingElement` (`IfcRelVoidsElement`) and `RelatingElement`
// (`IfcRelProjectsElement`/`IfcRelAdheresToElement`) all occupy the SAME index (4:
// `GlobalId`/`OwnerHistory`/`Name`/`Description`/`Relating*`), confirmed identical
// across all 3 relationship classes in `generated/ifc4.d.ts`/`ifc4x3.d.ts`. This port's
// `EntityInstance.get()` only resolves by name, not by positional index, so this is
// ported as an explicit per-`ifcClass` name lookup (`RELATING_ATTR` below) instead --
// behaviorally identical (same attribute, same value), not a shortcut around a real
// index-dependent trick.
//
// --- `IfcRelAdheresToElement`'s own extra branch: `RelatedSurfaceFeatures` dedup via a
// Python `set` -- ordering quirk disclosed, not reproduced ---
//
// When the existing rel's `RelatingElement` differs from `element` AND more than one
// surface feature currently shares that rel (`len(rels[0].RelatedSurfaceFeatures) !=
// 1`), real Python does NOT delete the whole rel (other features still need it) --
// it instead removes just `feature` from the list, via `list(set(rels[0]
// .RelatedSurfaceFeatures) - {feature})`. A Python `set` has no guaranteed ordering
// for arbitrary objects (and `entity_instance` defines `__hash__`), so the resulting
// list order is technically implementation-defined in real Python, not a promise this
// port needs to reproduce bit-for-bit. This port instead filters the existing list
// in place (`.filter(f => !f.equals(feature))`), which preserves the ORIGINAL order of
// the remaining features -- a strictly more predictable outcome, not a behavior
// regression (nothing reads a guaranteed order from a Python `set` either).
//
// --- Placement re-localization: only when the feature already has a placement AND
// that placement is a genuine `IfcLocalPlacement` ---
//
// `if (placement := feature.ObjectPlacement) and placement.is_a("IfcLocalPlacement")`
// -- ported as a plain `if`, since `IfcFeatureElement` (an `IfcElement`, hence
// `IfcProduct`) always forward-declares `ObjectPlacement` in all 3 schemas (confirmed
// against `generated/*.d.ts`'s `IfcProduct`/`IfcElement` interfaces), so no
// `hasattr`-style try/catch guard is needed here (unlike `editObjectPlacement.ts`'s own
// `hasObjectPlacementAttribute`, needed there because THAT function can be called on
// non-`IfcProduct` classes too).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { getLocalPlacement } from "../../util/placement";
import { assignObject } from "../aggregate/assignObject";
import { editObjectPlacement } from "../geometry/editObjectPlacement";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

/** Per-`ifcClass` name of the "relating" (i.e. the affected element's own side)
 * attribute -- see this file's header comment for why this replaces real Python's
 * `rels[0][4]` positional-index trick. */
const RELATING_ATTR: Record<string, string> = {
	IfcRelVoidsElement: "RelatingBuildingElement",
	IfcRelProjectsElement: "RelatingElement",
	IfcRelAdheresToElement: "RelatingElement",
};

export interface AddFeatureSettings {
	/** The `IfcFeatureElement` to affect the element. */
	feature: EntityInstance;
	/** The `IfcElement` to add the feature to. */
	element: EntityInstance;
}

function addFeatureUsecase(file: IfcFile, settings: AddFeatureSettings): EntityInstance {
	const { feature, element } = settings;

	let rels: readonly EntityInstance[];
	let ifcClass: string;

	if (feature.isA("IfcFeatureElementSubtraction")) {
		rels = feature.get("VoidsElements") as EntityInstance[];
		ifcClass = "IfcRelVoidsElement";
	} else if (feature.isA("IfcFeatureElementAddition")) {
		rels = feature.get("ProjectsElements") as EntityInstance[];
		ifcClass = "IfcRelProjectsElement";
	} else if (feature.isA("IfcSurfaceFeature")) {
		if (file.schema === "IFC4") {
			// Real Python: `return ifcopenshell.api.aggregate.assign_object(file,
			// [feature], element)`. `assignObject` only returns `undefined` for an empty
			// `products` list -- never the case here (`[feature]` is always length 1) --
			// so the cast below is safe, not a silent type hole.
			return assignObject(file, { products: [feature], relatingObject: element }) as EntityInstance;
		}
		rels = feature.get("AdheresToElement") as EntityInstance[];
		ifcClass = "IfcRelAdheresToElement";
	} else {
		// Python: `assert False, feature` -- unreachable for any real `IfcFeatureElement`
		// subtype, ported as a thrown Error.
		throw new Error(`Unexpected feature class: ${feature.isA()}`);
	}

	if (rels.length > 0) {
		const firstRel = rels[0];
		const relatingObject = firstRel.get(RELATING_ATTR[ifcClass]) as EntityInstance;
		if (relatingObject.equals(element)) {
			return firstRel;
		}
		if (
			ifcClass === "IfcRelAdheresToElement" &&
			(firstRel.get("RelatedSurfaceFeatures") as EntityInstance[]).length !== 1
		) {
			// See this file's header comment for the ordering quirk this deliberately
			// does NOT reproduce (a Python `set`'s own unordered dedup).
			const remaining = (firstRel.get("RelatedSurfaceFeatures") as EntityInstance[]).filter((f) => !f.equals(feature));
			firstRel.set("RelatedSurfaceFeatures", remaining);
		} else {
			const history = firstRel.get("OwnerHistory") as EntityInstance | null;
			file.remove(firstRel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}

	const rel = file.createEntity(
		ifcClass,
		guid.new(),
		createOwnerHistory(file, {}),
		null, // Name
		null, // Description
		element,
		ifcClass === "IfcRelAdheresToElement" ? [feature] : feature,
	);

	const placement = feature.get("ObjectPlacement") as EntityInstance | null;
	if (placement?.isA("IfcLocalPlacement")) {
		editObjectPlacement(file, {
			product: feature,
			matrix: getLocalPlacement(placement),
			isSi: false,
		});
	}

	return rel;
}

/**
 * Create a projecting, voiding, or surface feature in an element (Python:
 * `ifcopenshell.api.feature.add_feature`).
 *
 * There are three main types of features: those that add, remove, or influence
 * geometry of a parent object.
 *
 * The most common of these is an opening. For example, it is often necessary to cut
 * out openings in elements like walls and slabs to make space to insert doors,
 * windows, and other services that go through these penetrations.
 *
 * Whereas it is possible to simply draw the wall as a rectangle with a hole in it for
 * the opening, often these openings have specific meanings. For example, an opening
 * might be filled with a window, and so when the window moves, the opening should
 * move with it. Alternatively, the opening itself might have fire or acoustic
 * requirements, such that any service or equipment passing through that space must
 * also comply with those requirements. For these types of semantic openings, you
 * should have a distinct opening element which voids your regular element.
 *
 * Whenever you have an opening in your project, you should determine whether or not
 * the opening is semantic (i.e. should be represented by a distinct opening object)
 * or non-semantic (i.e. should simply be booleaned or be part of the shape of the
 * object).
 *
 * @returns The new (or, when re-associating an already-related feature, existing)
 * `IfcRelVoidsElement`/`IfcRelProjectsElement`/`IfcRelAdheresToElement` relationship --
 * or, for an IFC4 `IfcSurfaceFeature` (which has no `IfcRelAdheresToElement` class at
 * all in that schema), the `IfcRelAggregates` relationship from
 * `api.aggregate.assignObject` instead.
 */
export const addFeature = wrapUsecase("feature.add_feature", addFeatureUsecase);
