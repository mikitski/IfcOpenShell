// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/root/create_entity.py` (src/ifcopenshell-python, 140
// lines) -- the single most foundational function in `ifcopenshell.api`: per
// `research/02-python-api-inventory.md` SS3 "Deep dive: root...", "almost every other
// subpackage's `add_*`/`create_*` function calls `ifcopenshell.api.root.create_entity`
// internally." Creates a new rooted entity (any `IfcRoot` subtype): generates a
// GlobalId, records an `IfcOwnerHistory` (via `../owner/createOwnerHistory.ts`), sets
// `Name`, and resolves **predefined-type edge cases** -- if `predefinedType` isn't a
// valid enum value for the class's `PredefinedType` attribute, stores `"USERDEFINED"`
// plus the actual value in whichever of `ObjectType`/`ElementType`/`ProcessType` the
// class has -- then applies two schema-family-dependent default-attribute-population
// passes (`handle2x3Defaults`/`handle4Defaults`) to keep several classes schema-valid.
//
// --- GlobalId/OwnerHistory: positional creation, not post-creation `.set()` calls ---
//
// Real Python creates the element in one call carrying both initial values:
// `self.file.create_entity(ifc_class, **{"GlobalId": ..., "OwnerHistory": ...})`. This
// port does the TS equivalent -- `file.createEntity(ifcClass, guid.new(), ownerHistory)`
// -- rather than `file.createEntity(ifcClass)` followed by two separate `.set()` calls,
// for the same reason `util/migrator.ts`'s `generateDefaultValue` already established
// for synthesizing `IfcOwnerHistory` itself (see that module's own header comment,
// referenced from `planning/ifcopenshell-ts/PROGRESS.md`'s `util.schema` chunk 2 entry):
// `IfcFile.createEntity`'s initial positional args are captured as part of the single
// "create" `Transaction` operation, not recorded as N additional "edit" operations --
// exactly matching Python's own one-call construction. This relies on `GlobalId` being
// attribute index 0 and `OwnerHistory` index 1 for every `IfcRoot` subtype in all 3
// schemas (`IfcRoot` is always the common base, and EXPRESS attribute order always
// places inherited/supertype attributes first) -- confirmed directly against
// `src/generated/ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`'s `IfcRoot`/`IfcWall` interfaces
// (`GlobalId`, `OwnerHistory`, ..., identical order and position in all three), not
// merely assumed. `Name` is set via a separate `.set()` call afterward, matching
// Python's own separate `element.Name = name or None` statement (a real, deliberate
// asymmetry in the Python source, not something this port introduces).
//
// --- The bare `except:` / `try`-around-`.set()` mechanism, investigated not assumed ---
//
// Python's `try: element.PredefinedType = predefined_type except: ...` relies on
// schema-validated attribute assignment raising for an out-of-enum value. This port's
// TS equivalent, `try { element.set("PredefinedType", predefinedType) } catch { ... }`,
// was verified to actually work the same way by reading the real C++ core (not just
// assumed to "probably throw"): `attribute_value_shim.cpp`'s
// `set_attribute_value_variant` resolves an `ATTRIBUTE_VALUE_KIND_ENUMERATION` write via
// `enumeration_type::lookup_enum_offset(value)` (`src/ifcparse/schema.h`), which throws
// `ifcopenshell::exception("Unable to find keyword in schema: " + value)` for a value
// that isn't a declared enum item, *before* the instance's own `set_attribute_value` is
// ever called -- so the attribute is left unset on failure, exactly matching Python's
// own validate-before-assign behavior. This C++ exception is caught and translated to a
// JS exception by the generated N-API wrapper (`src/wrappergen/emit.py`'s
// `catch (const std::exception& exception)` codegen, confirmed by inspection) rather
// than crashing the process, so `EntityInstance.set()` genuinely throws a catchable JS
// error here -- a plain `try`/`catch` (JS has no bare-`except`-equivalent distinction,
// and none is needed: unlike Python's `except:`, which would also swallow e.g. an
// out-of-memory signal, JS's `catch` only ever catches a thrown JS `Error`/exception,
// never an async interrupt or similar -- there is no over-broad-catching concern to
// disclose beyond what's already inherent to `catch {}` in any TS code) is the faithful
// port, not a narrower `catch (e) { if (e instanceof SomeEnumError) ... }` -- Python's
// own `except:` has no narrower type to match either.
//
// --- `hasattr` equivalent ---
//
// Python's `hasattr(element, "PredefinedType")` asks "does this *class* declare this
// attribute at all" (triggering `entity_instance_mixin.__getattr__`, which raises
// `AttributeError` -- caught by `hasattr` -- only when the schema has no such attribute
// for this class; an unset-but-declared attribute returns `None`/falsy without
// raising). This port's local `hasAttribute` helper below reproduces exactly that via
// `EntityInstance.get()`'s own real error path (`entityInstance.ts`: `.get()` throws
// "... has no attribute ..." only when the resolved `AttributeCategory` is neither
// FORWARD nor INVERSE, i.e. truly not declared for this class) -- not a new native
// primitive, just the existing public escape hatch used for its already-correct error
// behavior. No `EntityInstance`-level `hasAttribute` method existed before this chunk;
// this is added here, locally, since `root.create_entity` is (per `research/02`'s own
// deep dive) the only ported usecase so far that needs a `hasattr`-shaped predicate --
// promotable to a shared `util`/`EntityInstance` helper later if another usecase needs
// the same predicate (not preemptively generalized here).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

function hasAttribute(element: EntityInstance, name: string): boolean {
	try {
		element.get(name);
		return true;
	} catch {
		return false;
	}
}

export interface CreateEntitySettings {
	/** Any rooted IFC class. Python default: `"IfcBuildingElementProxy"`. */
	ifcClass?: string;
	/**
	 * Any built-in or user-defined predefined type applicable to that IFC class. Any
	 * value is accepted for a user-defined predefined type -- this function handles
	 * the `"USERDEFINED"`/`ObjectType`/`ElementType`/`ProcessType` bookkeeping
	 * automatically.
	 */
	predefinedType?: string | null;
	/** The name of the new element. */
	name?: string | null;
}

/**
 * Python: `Usecase.handle_2x3_defaults(element)`.
 *
 * Defaults several IFC2X3 classes' mandatory attributes to keep the model
 * schema-valid, ported verbatim including the exact `if`/`elif` branch shape (a
 * class matches at most one of `IfcSpatialStructureElement`/`IfcRoof`/
 * `IfcFurnitureType`/`IfcDoorStyle`-or-`IfcWindowStyle`, in addition to the
 * independent `IfcElementType` check above it).
 */
function handle2x3Defaults(element: EntityInstance): void {
	if (element.isA("IfcElementType")) {
		if (hasAttribute(element, "PredefinedType") && !element.get("PredefinedType")) {
			element.set("PredefinedType", "NOTDEFINED");
		}
	}

	if (element.isA("IfcSpatialStructureElement")) {
		element.set("CompositionType", "ELEMENT");
	} else if (element.isA("IfcRoof")) {
		element.set("ShapeType", "NOTDEFINED");
	} else if (element.isA("IfcFurnitureType")) {
		element.set("AssemblyPlace", "NOTDEFINED");
	} else if (element.isA("IfcDoorStyle") || element.isA("IfcWindowStyle")) {
		element.set("OperationType", "NOTDEFINED");
		element.set("ConstructionType", "NOTDEFINED");
		element.set("ParameterTakesPrecedence", false);
		element.set("Sizeable", false);
	}
}

/**
 * Python: `Usecase.handle_4_defaults(element)`. Ported verbatim, including the
 * `element.file.schema == "IFC4"` guard that (per real Python) only applies to the
 * `IfcDoorStyle`/`IfcWindowStyle` branch -- these two classes are IFC4-only
 * deprecated leftovers, still present in the schema but not meant to be created on
 * IFC4X3, whereas `IfcDoorType`/`IfcWindowType`/`IfcFurnitureType` apply on any
 * non-IFC2X3 schema.
 */
function handle4Defaults(element: EntityInstance): void {
	if (element.isA("IfcElementType")) {
		if (hasAttribute(element, "PredefinedType") && !element.get("PredefinedType")) {
			element.set("PredefinedType", "NOTDEFINED");
		}
	}

	if (element.file?.schema === "IFC4" && (element.isA("IfcDoorStyle") || element.isA("IfcWindowStyle"))) {
		element.set("OperationType", "NOTDEFINED");
		element.set("ConstructionType", "NOTDEFINED");
		element.set("ParameterTakesPrecedence", false);
		element.set("Sizeable", false);
	} else if (element.isA("IfcDoorType")) {
		element.set("OperationType", "NOTDEFINED");
	} else if (element.isA("IfcWindowType")) {
		element.set("PartitioningType", "NOTDEFINED");
	} else if (element.isA("IfcFurnitureType")) {
		element.set("AssemblyPlace", "NOTDEFINED");
	}
}

function createEntityUsecase(file: IfcFile, settings: CreateEntitySettings = {}): EntityInstance {
	const ifcClass = settings.ifcClass ?? "IfcBuildingElementProxy";
	const predefinedType = settings.predefinedType ?? null;
	const name = settings.name ?? null;

	const ownerHistory = createOwnerHistory(file, {});
	// GlobalId/OwnerHistory as initial positional attributes -- see this file's header
	// comment for why (single "create" Transaction operation, matching Python's own
	// one-call `create_entity(ifc_class, GlobalId=..., OwnerHistory=...)`).
	const element = file.createEntity(ifcClass, guid.new(), ownerHistory);
	element.set("Name", name || null);

	if (predefinedType) {
		if (hasAttribute(element, "PredefinedType")) {
			try {
				element.set("PredefinedType", predefinedType);
			} catch {
				element.set("PredefinedType", "USERDEFINED");
				if (hasAttribute(element, "ObjectType")) {
					element.set("ObjectType", predefinedType);
				} else if (hasAttribute(element, "ElementType")) {
					element.set("ElementType", predefinedType);
				} else if (hasAttribute(element, "ProcessType")) {
					element.set("ProcessType", predefinedType);
				}
			}
		} else if (hasAttribute(element, "ObjectType")) {
			element.set("ObjectType", predefinedType);
		}
	}

	if (file.schema === "IFC2X3") {
		handle2x3Defaults(element);
	} else {
		handle4Defaults(element);
	}

	return element;
}

/**
 * Create a new rooted product (Python: `ifcopenshell.api.root.create_entity`).
 *
 * This is a critical function used to create almost any rooted product or product
 * type. If you want to create walls, spaces, buildings, wall types, and so on, use
 * this function.
 *
 * Just specify the class you want to create, as well as the predefined type and
 * name. It will handle the storage of the predefined type and check whether the
 * predefined type is built-in or custom. It will also generate a valid GlobalId and
 * store ownership history. It will also handle some edge cases for default validity
 * where users might forget to populate some mandatory attributes -- for example,
 * doors must define an operation type but many people forget.
 *
 * @example
 * ```ts
 * // We have a project.
 * api.root.createEntity(model, { ifcClass: "IfcProject" });
 *
 * // We have a wall.
 * api.root.createEntity(model, { ifcClass: "IfcWall" });
 * ```
 */
export const createEntity = wrapUsecase("root.create_entity", createEntityUsecase);
