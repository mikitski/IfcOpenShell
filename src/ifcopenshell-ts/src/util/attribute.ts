// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/attribute.py` (src/ifcopenshell-python,
// 81 lines, 3 functions) -- planning/ifcopenshell-ts/research/03-python-util-inventory.md.
// Ported in full as a small, self-contained prerequisite for `util/schema.ts`'s
// `reassignClass` (Phase 3, `util.schema` chunk), which needs `getPrimitiveType` and
// `getEnumItems`. `getSelectItems` is ported too for completeness/future chunks, even
// though nothing in this chunk's own scope calls it (confirmed: `util/schema.ts` only
// calls `getPrimitiveType`; `getEnumItems`'s own membership-check use inside
// `reassignClass` is done via a local, fully-working helper instead -- see that file's
// header comment and `getEnumItems`'s own doc comment below for why).
//
// *** Investigation finding: `get_primitive_type`'s string-parsing mechanism does NOT
// carry over, and its *behavior* only partially does -- two real, disclosed
// primitive-layer gaps, both verified directly against the C++ core source
// (`src/ifcparse/schema.h`) and the generated N-API surface (the C API header
// `src/wrappergen/generated_napi/ifcopenshell_native_c_api.h`, not just the TS
// facade), not assumed: ***
//
// Python's `get_primitive_type` parses `str(attribute_or_data_type.type_of_attribute())`
// -- a SWIG `__str__` dump of the C++ `parameter_type` tree (`"<type NAME <inner>>"`,
// `"<list <inner>>"`, `"<select (A|B|...)>"`, `"<real>"`, ...) via string-prefix
// matching. This TS port instead walks the *structured* `parameter_type`/`named_type`/
// `aggregation_type`/`declaration` object graph directly (`as_named_type()`/
// `as_aggregation_type()`/`as_entity()`/`as_enumeration_type()`/`as_select_type()`/
// `as_type_declaration()`, all real, already-bound primitives) -- no string parsing at
// all, a strictly cleaner mechanism, confirming the task brief's anticipated "or
// something more structured" branch for the outer shape (entity/enum/select/
// list-of-X/array-of-X/set-of-X).
//
// Gap 1 (list vs. array vs. set): `aggregation_type::type_of_aggregation()` (the C++
// enum distinguishing EXPRESS LIST/ARRAY/SET/BAG) is a real accessor
// (`src/ifcparse/schema.h`) but is NOT exposed anywhere in the N-API surface (the TS
// `aggregation_type` class only has `bound1()`/`bound2()`/`type_of_element()`/
// `as_aggregation_type()`) -- the *exact same* gap `util/element.ts` chunk 3's
// `isSetAttribute` already found and disclosed for a different function. This port
// makes the *same* choice that precedent established: always classify an aggregate as
// `"list"` (the common case), never `"array"`/`"set"`, clearly disclosed rather than
// silently wrong.
//
// Gap 2 (real vs. integer vs. boolean vs. string vs. binary vs. logical, at the
// terminal leaf): `simple_type::declared_type()` (the C++ enum distinguishing
// `real_type`/`integer_type`/`boolean_type`/`logical_type`/`number_type`/
// `string_type`/`binary_type` -- exactly the classification Python's string parsing
// ultimately bottoms out on) is a real accessor (`src/ifcparse/schema.h`) but has NO
// N-API binding at all -- confirmed by reading both the TS `simple_type` class (only
// `as_simple_type()`) and the C API header (`ifcopenshell_simple_type_declared_type`
// does not exist as a symbol anywhere in `ifcopenshell_native_c_api.h`). Investigated
// and ruled out as workaroundable without a new native primitive:
//   - `entity_instance.attribute_type(index)`/`attribute_kind_of(index)` (the
//     instance-level shim methods that DO classify this, via
//     `ifcopenshell::from_parameter_type`) require an actual *instance* of the
//     attribute's owning entity at the specific attribute index -- `getPrimitiveType`'s
//     signature (matching Python's) only ever receives a bare `attribute`/
//     `parameter_type` object, with no owning-entity/index/file context recoverable
//     from it, so there's no instance to probe with. This also wouldn't help the
//     *nested* element-type case (a list's element `parameter_type` isn't tied to any
//     single attribute index at all).
//   - No named declaration exists at the very bottom of the chain to fall back to a
//     name-based check either: EXPRESS's raw built-in primitives (REAL/INTEGER/
//     BOOLEAN/LOGICAL/STRING/BINARY) are anonymous `simple_type` objects (`class
//     simple_type : public parameter_type`, NOT `: public declaration`) with no
//     `.name()` -- confirmed ~130 distinct named `type_declaration`s in IFC4 alone
//     (`IfcLengthMeasure`, `IfcLabel`, `IfcBoolean`, ...) each independently wrap a raw
//     `simple_type` *directly* (no shared "canonical base type" indirection to key a
//     lookup off), so there's no small closed name-based table to lean on either.
// Per this chunk's explicit instructions ("if you genuinely cannot find something on
// the existing surface after real investigation, stop and flag it clearly... rather
// than assuming you should add a primitive yourself"), this port does NOT add a new
// native primitive for this. `getPrimitiveType` below returns `null` for this specific,
// narrow, terminal case -- type-legal (Python's own `PrimitiveTypeOutput` already
// permits `None`) and honest, rather than a fabricated guess. Entity/enum/select
// classification (the only thing `util/schema.ts`'s `reassignClass` actually branches
// on) is fully, correctly resolvable via the structural walk and is NOT affected by
// this gap -- see `reassignClass`'s own doc comment for confirmation. See
// `test/util/attribute.test.ts` for the dedicated tests proving this real, disclosed
// divergence from Python's `test_attribute.py::TestGetPrimitiveType` on exactly the
// two directly-tested leaf cases (`OverallHeight` float, `Description` string).
//
// One further, faithfully-*preserved* Python quirk (not a gap, a deliberate verbatim
// port of Python's own behavior): for a `<select (A|B|...)>` attribute, Python's own
// `get_primitive_type` recurses with `get_primitive_type(d.strip())` on each select
// member's *bare class name string* (e.g. `"IfcAxis2Placement2D"`) -- which, since a
// bare name never starts with `"<"`, never matches any of Python's own string checks
// and always falls through to an implicit `None`. So Python's own `("select", (...))`
// tuple is *always* `("select", (None, None, ...))` in practice, never real per-member
// classifications -- ported here as exactly that (`null` per member), not "fixed" to
// be more useful, per this project's verbatim-translation mandate (see `getSubtypes`'s
// own doc comment in `util/schema.ts` for the same "port the documented quirk, don't
// improve it" instruction applied elsewhere in this chunk).

import type {
	attribute as NativeAttribute,
	declaration as NativeDeclaration,
	parameter_type as NativeParameterType,
} from "../native/ifcopenshell_native";
import { attribute as NativeAttributeCtor } from "../native/ifcopenshell_native";

/** Python: `PrimitiveType = Literal["entity", "string", "float", "integer", "boolean", "enum", "binary"]`. */
export type PrimitiveType = "entity" | "string" | "float" | "integer" | "boolean" | "enum" | "binary";

/** Python: `ComplexPrimitiveType = Literal["list", "array", "set"]`. */
export type ComplexPrimitiveType = "list" | "array" | "set";

/**
 * Python: `PrimitiveTypeOutput = Union[PrimitiveType, tuple[ComplexPrimitiveType,
 * "PrimitiveTypeOutput"], tuple[Literal["select"], tuple["PrimitiveTypeOutput", ...]],
 * None]`. TS has no tuple-of-two-with-a-literal-discriminant-in-first-position
 * distinct from a tuple-of-N type alias the way Python's `Union` of two `tuple[...]`
 * shapes reads naturally -- ported as a union of two `readonly` tuple shapes, which is
 * the closest direct TS equivalent.
 */
export type PrimitiveTypeOutput =
	| PrimitiveType
	| readonly [ComplexPrimitiveType, PrimitiveTypeOutput]
	| readonly ["select", readonly PrimitiveTypeOutput[]]
	| null;

/**
 * Python: `get_primitive_type(attribute_or_data_type) -> PrimitiveTypeOutput`.
 *
 * See this file's header comment for the full investigation: structurally walks the
 * `parameter_type`/`named_type`/`aggregation_type`/`declaration` object graph (not a
 * string-parsing port -- the primitive layer exposes something cleaner for the outer
 * shape) but returns `null` for the one narrow, disclosed, genuinely-unavailable case
 * (the terminal scalar `simple_type`'s specific kind), and `null` per `"select"`
 * member (faithfully preserving Python's own always-`None`-per-member quirk, not a
 * gap).
 */
export function getPrimitiveType(attributeOrDataType: NativeAttribute | NativeParameterType): PrimitiveTypeOutput {
	const dataType =
		attributeOrDataType instanceof NativeAttributeCtor ? attributeOrDataType.type_of_attribute() : attributeOrDataType;
	return classifyParameterType(dataType);
}

function classifyParameterType(dataType: NativeParameterType): PrimitiveTypeOutput {
	const aggregation = dataType.as_aggregation_type();
	if (aggregation !== null) {
		// Gap 1 (see header comment): can't distinguish list/array/set/bag -- always
		// "list", matching `util/element.ts` chunk 3's `isSetAttribute` precedent for
		// the identical underlying primitive gap.
		return ["list", classifyParameterType(aggregation.type_of_element())];
	}

	const named = dataType.as_named_type();
	if (named !== null) {
		const declared = named.declared_type();
		return declared === null ? null : classifyDeclaredType(declared);
	}

	// `dataType.as_simple_type() !== null` here in practice (a bare EXPRESS
	// REAL/INTEGER/BOOLEAN/LOGICAL/STRING/BINARY primitive). Gap 2 (see header
	// comment): its specific kind can't be determined via the current primitive
	// surface -- disclosed, honest `null` rather than a guess.
	return null;
}

function classifyDeclaredType(declared: NativeDeclaration): PrimitiveTypeOutput {
	if (declared.as_entity() !== null) {
		return "entity";
	}
	const selectType = declared.as_select_type();
	if (selectType !== null) {
		// Faithfully-preserved Python quirk (see header comment) -- always `null` per
		// member, not a real per-member classification.
		return ["select", selectType.select_list().map(() => null)];
	}
	if (declared.as_enumeration_type() !== null) {
		return "enum";
	}
	const typeDeclaration = declared.as_type_declaration();
	if (typeDeclaration !== null) {
		return classifyParameterType(typeDeclaration.declared_type());
	}
	// Unreachable in practice -- every `declaration` returned by `named_type
	// .declared_type()` is one of the four `as_*` branches above (entity, select,
	// enumeration, or type_declaration).
	return null;
}

/**
 * Python: `get_enum_items(attribute) -> tuple[str, ...]`.
 *
 * A real, disclosed primitive-layer gap, distinct from `getPrimitiveType`'s own (see
 * this file's header comment): `enumeration_type::enumeration_items()` (the C++
 * accessor returning the full `vector<string>` of an enum's declared value names) has
 * NO N-API binding at all -- confirmed via both the TS `enumeration_type` class (only
 * `lookup_enum_offset(name)`, a *reverse* name -> index lookup that throws for an
 * unknown name, and `as_enumeration_type()`) and the C API header (no
 * `ifcopenshell_enumeration_type_lookup_enum_value`/`_enumeration_items` symbol
 * exists). There is no *forward* index -> name (or bulk "all names") lookup exposed
 * anywhere on this primitive surface, so the actual list of enum item strings this
 * function must return genuinely cannot be produced.
 *
 * Rather than fabricate a wrong (empty or partial) list -- which would silently make
 * every membership check against it (`value in get_enum_items(...)`) incorrectly
 * report "not a member" -- this throws a clear, disclosed error instead, matching this
 * project's established precedent for a genuinely-unavailable capability
 * (`entityInstance.ts`'s own non-entity-attribute-access gap: "throws for it -- a
 * real, disclosed primitive-layer gap ... not silently worked around"). Because of
 * this, `util/schema.ts`'s `reassignClass` -- this chunk's one real caller that needs
 * an enum *membership* check -- deliberately does NOT call this function; it uses
 * `enumeration_type.lookup_enum_offset(value)` directly (try/catch: throws == not a
 * member), which answers the single-value membership question this primitive layer
 * *can* actually answer, without needing the full list at all. See `reassignClass`'s
 * own doc comment.
 */
export function getEnumItems(attribute: NativeAttribute): readonly string[] {
	const namedType = attribute.type_of_attribute().as_named_type();
	if (namedType === null) {
		throw new Error("get_enum_items: attribute's type is not a named type");
	}
	const enumeration = namedType.declared_type().as_enumeration_type();
	if (enumeration === null) {
		throw new Error("get_enum_items: attribute's declared type is not an enumeration");
	}
	throw new Error(
		"get_enum_items: the current N-API primitive layer has no forward enum-item-name " +
			"lookup (enumeration_type::enumeration_items() is not bound) -- a real, disclosed " +
			"primitive-layer gap, see util/attribute.ts's own doc comment for this function. " +
			"For a single-value membership check, use enumeration_type.lookup_enum_offset(value) " +
			"directly (try/catch) instead of this function.",
	);
}

/**
 * Python: `get_select_items(attribute) -> tuple[declaration, ...]`.
 *
 * Fully portable -- `select_type.select_list()` is already a real, working primitive
 * (unlike `get_enum_items`'s gap above). No caller within this chunk's own scope uses
 * this (disclosed in this file's header comment), ported for completeness per the
 * task brief, matching `util/attribute.py`'s own small, complete module shape.
 */
export function getSelectItems(attribute: NativeAttribute): readonly NativeDeclaration[] {
	const namedType = attribute.type_of_attribute().as_named_type();
	if (namedType === null) {
		throw new Error("get_select_items: attribute's type is not a named type");
	}
	const selectType = namedType.declared_type().as_select_type();
	if (selectType === null) {
		throw new Error("get_select_items: attribute's declared type is not a select type");
	}
	return selectType.select_list();
}
