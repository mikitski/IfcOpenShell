// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/fm.py` (src/ifcopenshell-python, 186 lines)
// -- Phase 10's "Niche `util` modules" chunk (`PROGRESS.md`'s own table entry), one of
// the 3 confirmed-remaining-unported real Python `util` files. Facilities-management
// helpers: COBie type/component class filtering and FM Handover / Energy Model
// ("FMHEM") class + `PredefinedType` enumeration discovery.
//
// Real Python's ONLY `ifcopenshell_wrapper` import (`import ifcopenshell.
// ifcopenshell_wrapper as W`) is used SOLELY as a type annotation (`declaration: W.
// entity`, line 159 of the real file) -- confirmed by grepping the whole file for `W.`
// usage: it is never called at runtime, so this is NOT treated as a wrapper/kernel
// dependency. The annotated parameter itself is a schema-level `entity` DECLARATION
// (walked via `.subtypes()`/`.is_abstract()`/`.all_attributes()`/`.name()`), the exact
// same thing `util/doc.ts`'s `getInverseAttributes`/`util/schema.ts`'s `getSupertypes`/
// `getSubtypes` already type as `NativeEntity` (`entity` from `../native/
// ifcopenshell_native`) -- reused here for the same reason, no new type needed.
//
// Ported in full: `get_cobie_types`, `get_cobie_components`, `get_fmhem_types`,
// `get_fmhem_classes` (plus the 5 module-level class-name/exclusion lists these 4
// functions read: `cobie_type_classes`, `cobie_component_classes`,
// `fmhem_classes_ifc4`, `fmhem_classes_ifc2x3`, `fmhem_excluded_classes`).
//
// *** Real, disclosed primitive-layer gap -- `getFmhemClasses` is unconditionally
// blocked for every real invocation ***: `get_fmhem_classes`'s own `get_fmhem_class`
// inner helper calls `ifcopenshell.util.attribute.get_enum_items(attribute)` whenever
// it finds a `PredefinedType` attribute -- which every real class in
// `fmhem_classes_ifc4`/`fmhem_classes_ifc2x3` (and all of their real, non-abstract,
// non-excluded subtypes) declares. This port's own `util/attribute.ts` `getEnumItems`
// is ALREADY a disclosed, pre-existing throwing stub (landed well before this chunk,
// `util.schema` chunk): `enumeration_type::enumeration_items()` (the C++ forward
// enum-item-NAME lookup) has no N-API binding anywhere on this primitive surface at
// all (confirmed again here, not just trusted from that file's own comment: neither
// the TS `enumeration_type` class -- only `lookup_enum_offset(value_name)`, a REVERSE,
// single-value lookup, is bound -- nor the C API header exposes a forward-listing
// primitive). This is a genuinely NEW, confirmed consequence of that pre-existing gap
// (the first real caller of `getEnumItems` reaching it outside `attribute.ts`'s own
// unit tests) -- ported completely and faithfully up to and including the exact
// `getEnumItems` call (not proactively guarded/stubbed around), so `getFmhemClasses`
// throws for every real schema/class combination -- but NOT always via the SAME error:
// see the correction below (`getFmhemClasses("IFC2X3")` never actually reaches
// `getEnumItems` at all). `TODOS.md` updated with a new entry (no existing top-level
// entry named this specific gap -- it was previously only disclosed inline in
// `attribute.ts`'s/`attribute.test.ts`'s own comments).
//
// *** CORRECTION -- `getFmhemClasses("IFC2X3")` throws a DIFFERENT, EARLIER error than
// the `getEnumItems` gap above, and this is itself a real, pre-existing Python bug ***:
// `fmhemClassesIfc2x3`'s first 2 entries, `IfcDoorStyle`/`IfcWindowStyle`, have NO
// `PredefinedType` attribute at all on IFC2X3 (confirmed against `ifc2x3.d.ts` -- they
// only declare `OperationType`/`ConstructionType` there), so `getFmhemClass` never
// reaches the `getEnumItems` call for either of them (or their subtypes, since neither
// has any). The loop then reaches the list's 3rd entry, `IfcShadingDeviceType`, which
// doesn't exist ANYWHERE on IFC2X3 (confirmed absent from `ifc2x3.d.ts` entirely) --
// yet real Python's own `fmhem_classes_ifc2x3` list (`ifcopenshell/util/fm.py`)
// includes it verbatim regardless, meaning this is a genuine upstream Python bug, not
// something this port introduced. `schema_.declaration_by_name(ifc_class)` (this
// port's `declaration_by_name_with_name`) throws first, before `getEnumItems` is ever
// reached: verified empirically against BOTH this port's own locally-built
// multi-schema native addon AND a real installed `ifcopenshell` Python package
// (`ifcopenshell.util.fm.get_fmhem_classes("IFC2X3")` raises `RuntimeError: Entity
// with name 'IfcShadingDeviceType' not found in schema 'IFC2X3'`) -- this port's own
// throw message matches real Python's exactly, including which class name is named in
// it. `getFmhemClasses("IFC2X3")` is therefore blocked by the SAME upstream Python
// bug real Python itself would hit, not by this port's own `getEnumItems` gap --
// `getFmhemClasses("IFC4")`/`getFmhemClasses()` (default) remain blocked by the
// `getEnumItems` gap specifically, since `fmhemClassesIfc4`'s own first entry,
// `IfcDoorType`, DOES have a real `PredefinedType` attribute on IFC4.
//
// `entity::subtypes()` (real Python's `declaration.subtypes()`) is ALSO a separate,
// already-disclosed pre-existing gap (`util/schema.ts`'s own header comment, backing
// `getSubtypes`): no N-API binding exists for it either. Worked around the SAME way
// `getSubtypes` already does -- by reusing that file's own `directSubtypesOf`
// schema-wide `.supertype()`-scan grouping helper (exported by this chunk for this
// exact second-consumer reuse, see `schema.ts`'s own updated header comment) -- computed
// ONCE per `getFmhemClasses` call (not per node, unlike `getSubtypes`'s own
// per-call recompute), since the schema (hence the whole direct-subtype grouping) is
// fixed for the entire call.
//
// `get_cobie_types`/`get_cobie_components`/`get_fmhem_types` have NO primitive-layer
// gap at all -- pure `IfcFile.byType` filtering, already fully bound.
//
// *** Minor, disclosed, harmless behavioral divergence found while testing ***: real
// Python's `ifc_file.by_type(ifc_class)` raises a real exception for a class name not
// valid in the file's own schema (why `get_cobie_types`/`get_cobie_components` wrap
// every call in a bare `except: pass`). This port's own `IfcFile.byType` (`file.ts`,
// landed well before this chunk) does NOT throw for an unrecognized class name --
// confirmed empirically against this chunk's own built addon (`file.byType
// ("IfcDoorStyle")` on an IFC4 file returns `[]`, not a throw). The `try`/`catch`
// below is kept anyway, for structural parity with Python's own necessary guard (and
// in case a future `IfcFile.byType` change reintroduces a throw for this case) -- it
// is simply inert on this port's current primitive layer, not a functional
// requirement here. Either way, the observable RESULT is identical (an unrecognized
// class contributes zero elements), so this is not a behavior change, only a
// mechanism change, and needs no `TODOS.md` entry (nothing to fix -- if anything,
// this port's own `byType` is more forgiving than Python's, not less).

import type { EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import type { entity as NativeEntity } from "../native/ifcopenshell_native";
import { getEnumItems } from "./attribute";
import { directSubtypesOf, entityName, getSchemaDefinition } from "./schema";

// Python: `cobie_type_classes: list[str]` -- "COBie actually uses an exclusion list,
// but this inclusion list is equivalent." Deliberately mixes IFC2X3-only names (e.g.
// `IfcDoorStyle`/`IfcWindowStyle`) and IFC4-only names (e.g. `IfcDoorType`/
// `IfcWindowType`) in the SAME list, relying on `getCobieTypes`'s own per-class
// try/catch to silently skip whichever half doesn't exist in the file's actual schema
// -- ported verbatim, not split per schema.
const cobieTypeClasses: readonly string[] = [
	"IfcDoorStyle",
	"IfcBuildingElementProxyType",
	"IfcChimneyType",
	"IfcCoveringType",
	"IfcDoorType",
	"IfcFootingType",
	"IfcPileType",
	"IfcRoofType",
	"IfcShadingDeviceType",
	"IfcWindowType",
	"IfcDistributionControlElementType",
	"IfcDistributionChamberElementType",
	"IfcEnergyConversionDeviceType",
	"IfcFlowControllerType",
	"IfcFlowMovingDeviceType",
	"IfcFlowStorageDeviceType",
	"IfcFlowTerminalType",
	"IfcFlowTreatmentDeviceType",
	"IfcElementAssemblyType",
	"IfcBuildingElementPartType",
	"IfcDiscreteAccessoryType",
	"IfcMechanicalFastenerType",
	"IfcReinforcingElementType",
	"IfcVibrationIsolatorType",
	"IfcFurnishingElementType",
	"IfcGeographicElementType",
	"IfcTransportElementType",
	"IfcSpatialZoneType",
	"IfcWindowStyle",
];

// Python: `cobie_component_classes: list[str]`.
const cobieComponentClasses: readonly string[] = [
	"IfcBuildingElementProxy",
	"IfcChimney",
	"IfcCovering",
	"IfcDoor",
	"IfcShadingDevice",
	"IfcWindow",
	"IfcDistributionControlElement",
	"IfcDistributionChamberElement",
	"IfcEnergyConversionDevice",
	"IfcFlowController",
	"IfcFlowMovingDevice",
	"IfcFlowStorageDevice",
	"IfcFlowTerminal",
	"IfcFlowTreatmentDevice",
	"IfcDiscreteAccessory",
	"IfcTendon",
	"IfcTendonAnchor",
	"IfcVibrationIsolator",
	"IfcFurnishingElement",
	"IfcGeographicElement",
	"IfcTransportElement",
];

// Python: `fmhem_classes_ifc4: list[str]`.
const fmhemClassesIfc4: readonly string[] = [
	"IfcDoorType",
	"IfcWindowType",
	"IfcShadingDeviceType",
	"IfcDistributionControlElementType",
	"IfcEnergyConversionDeviceType",
	"IfcFlowControllerType",
	"IfcFlowMovingDeviceType",
	"IfcFlowStorageDeviceType",
	"IfcFlowTerminalType",
	"IfcFlowTreatmentDeviceType",
	"IfcFurnishingElementType",
	"IfcTransportElementType",
];

// Python: `fmhem_classes_ifc2x3: list[str]`.
const fmhemClassesIfc2x3: readonly string[] = [
	"IfcDoorStyle",
	"IfcWindowStyle",
	"IfcShadingDeviceType",
	"IfcDistributionControlElementType",
	"IfcEnergyConversionDeviceType",
	"IfcFlowControllerType",
	"IfcFlowMovingDeviceType",
	"IfcFlowStorageDeviceType",
	"IfcFlowTerminalType",
	"IfcFlowTreatmentDeviceType",
	"IfcFurnishingElementType",
	"IfcTransportElementType",
];

// Python: `fmhem_excluded_classes: list[str]`.
const fmhemExcludedClasses: readonly string[] = ["IfcCooledBeamType", "IfcBurnerType", "IfcCoilType", "IfcLampType"];

/**
 * Python: `get_cobie_types(ifc_file: file) -> list[entity_instance]`.
 *
 * Each class in `cobieTypeClasses` is looked up independently, silently skipping any
 * class name not valid for `ifcFile`'s own schema (Python's bare `except: pass`,
 * needed since the list deliberately mixes IFC2X3-only and IFC4-only class names --
 * see this list's own comment above).
 */
export function getCobieTypes(ifcFile: IfcFile): EntityInstance[] {
	const elements: EntityInstance[] = [];
	for (const ifcClass of cobieTypeClasses) {
		try {
			elements.push(...ifcFile.byType(ifcClass));
		} catch {
			// pass
		}
	}
	return elements;
}

/** Python: `get_cobie_components(ifc_file: file) -> list[entity_instance]`. */
export function getCobieComponents(ifcFile: IfcFile): EntityInstance[] {
	const elements: EntityInstance[] = [];
	for (const ifcClass of cobieComponentClasses) {
		try {
			elements.push(...ifcFile.byType(ifcClass));
		} catch {
			// pass
		}
	}
	return elements;
}

/**
 * Python: `get_fmhem_types(ifc_file: file) -> list[entity_instance]`.
 *
 * Like `getCobieTypes`, but schema-gated up front (`ifcFile.schema`) rather than by
 * per-class try/catch, and additionally excludes any element whose OWN concrete class
 * (not the queried class -- `by_type` includes subtypes) is in `fmhemExcludedClasses`.
 */
export function getFmhemTypes(ifcFile: IfcFile): EntityInstance[] {
	const elements: EntityInstance[] = [];
	const fmhemClasses = ifcFile.schema === "IFC2X3" ? fmhemClassesIfc2x3 : fmhemClassesIfc4;
	for (const ifcClass of fmhemClasses) {
		try {
			elements.push(...ifcFile.byType(ifcClass).filter((e) => !fmhemExcludedClasses.includes(e.isA())));
		} catch {
			// pass
		}
	}
	return elements;
}

/**
 * Python: `get_fmhem_classes(schema: Literal["IFC4", "IFC2X3"] = "IFC4") -> dict[str,
 * list[str]]`.
 *
 * For each of `fmhemClassesIfc4`/`fmhemClassesIfc2x3` (depending on `schema`) and every
 * one of their real subtypes (recursively): records the class's own `PredefinedType`
 * enumeration values (minus `"NOTDEFINED"`), skipping abstract classes and
 * `fmhemExcludedClasses` -- but always still recursing into their subtypes regardless
 * (Python's own `for subtype in declaration.subtypes(): get_fmhem_class(subtype)` sits
 * OUTSIDE the `if`/`elif`/`else` that decides whether to record the CURRENT class,
 * ported with the identical structure below, not accidentally nested inside it).
 *
 * **Unconditionally throws for every real schema/class combination** -- but NOT
 * always via the same error. `"IFC4"`/the default hit this file's own disclosed
 * `getEnumItems` primitive-layer gap on their very first `PredefinedType` attribute;
 * `"IFC2X3"` throws EARLIER, via a different, real upstream-Python bug
 * (`fmhemClassesIfc2x3` names a class, `IfcShadingDeviceType`, that doesn't exist on
 * IFC2X3 at all) -- see this file's own header comment's "CORRECTION" section for the
 * full trace and empirical (real Python) verification.
 */
export function getFmhemClasses(schema: "IFC4" | "IFC2X3" = "IFC4"): Record<string, string[]> {
	const results: Record<string, string[]> = {};

	function getFmhemClass(declaration: NativeEntity, childrenByName: Map<string, NativeEntity[]>): void {
		const name = entityName(declaration);
		if (fmhemExcludedClasses.includes(name)) {
			// pass
		} else if (declaration.is_abstract()) {
			// pass
		} else {
			let types: string[] = [];
			for (const attribute of declaration.all_attributes()) {
				if (attribute.name() === "PredefinedType") {
					// See this file's own header comment: throws here, for real, on
					// every real invocation -- ported as the direct, unguarded call
					// Python itself makes, not proactively stubbed around.
					types = [...getEnumItems(attribute)];
					types = types.filter((t) => t !== "NOTDEFINED");
				}
			}
			results[name] = types;
		}

		for (const subtype of childrenByName.get(name) ?? []) {
			getFmhemClass(subtype, childrenByName);
		}
	}

	const classes = schema === "IFC2X3" ? fmhemClassesIfc2x3 : fmhemClassesIfc4;
	const schemaDefinition = getSchemaDefinition(schema);
	// See this file's own header comment: `directSubtypesOf` (exported from
	// `util/schema.ts` by this chunk) is the same schema-wide-scan workaround
	// `getSubtypes` already established for the same missing `entity::subtypes()`
	// primitive -- computed once here, up front, since `schema` is fixed for the
	// whole call.
	const childrenByName = directSubtypesOf(schemaDefinition);
	for (const ifcClass of classes) {
		// Python's `schema_.declaration_by_name(ifc_class)` returns an already
		// entity-typed declaration (SWIG auto-downcast); this port's own
		// `declaration_by_name_with_name` returns the generic `declaration` base,
		// so `.as_entity()` is needed -- matching `util/doc.ts`'s own identical
		// pattern for the same primitive. Every name in `fmhemClassesIfc4`/
		// `fmhemClassesIfc2x3` is a real entity in its own schema, so this never
		// actually returns `null` in practice; not defensively guarded, matching
		// Python's own equally unguarded access.
		const declaration = schemaDefinition.declaration_by_name_with_name(ifcClass).as_entity() as NativeEntity;
		getFmhemClass(declaration, childrenByName);
	}
	return results;
}
