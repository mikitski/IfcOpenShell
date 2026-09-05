// This file was generated with the assistance of an AI coding tool.

// Phase 1 `wrappergen` N-API primitive-binding shim
// (planning/ifcopenshell-ts/research/06-wrappergen-spike-results.md,
// planning/ifcopenshell-ts/research/01-python-core-and-lowlevel.md SS5). This is
// NOT part of the `ifcparse` core -- `src/ifcparse/` is unmodified by this
// work -- it is new, generator-adjacent glue that plays the same role
// `src/ifcwrap/IfcParseWrapper.i`'s `set_attribute_value_py` /
// `convert_cpp_attribute_to_python` play for the SWIG/Python binding: a small
// amount of hand-written C++ that gives wrappergen's clang frontend a
// discriminated-union shape to point its "variant" type adapter at, since the
// real `ifcopenshell::attribute_value` (instance_data.h) has no discriminant
// of its own -- it is read via a set of C++ implicit-conversion operators
// chosen by the caller based on separately-obtained schema metadata, exactly
// like Python's binding has to do by hand.
#ifndef IFCOPENSHELL_WRAPPERGEN_ATTRIBUTE_VALUE_SHIM_H
#define IFCOPENSHELL_WRAPPERGEN_ATTRIBUTE_VALUE_SHIM_H

#include "express.h"

#include <cstdint>
#include <string>
#include <vector>

// Deliberately no IFC_PARSE_API (or any dllexport/dllimport) on the declarations
// below. That macro means "this symbol lives in ifcparse.dll, import/export it
// across that boundary" (ifc_parse_api.h) -- it does not apply here: this shim is
// not part of ifcparse.dll, it is compiled directly into whichever binary
// includes attribute_value_shim.cpp (the native addon, wrappergen's own spike/
// binding targets, etc.), so these symbols never cross a DLL boundary. Tagging
// them dllimport on Windows told the linker to expect an external DLL to provide
// them, producing a real LNK2019 (unresolved external symbol) the first time this
// shim was linked into a real Windows build -- found by this PR's CI, silent on
// Unix, where IFC_PARSE_API's visibility attribute has no import/export
// distinction to get wrong.

namespace ifcopenshell {
namespace wrappergen {

enum attribute_value_kind {
    ATTRIBUTE_VALUE_KIND_NULL = 0,
    ATTRIBUTE_VALUE_KIND_BOOL = 1,
    ATTRIBUTE_VALUE_KIND_LOGICAL = 2,
    ATTRIBUTE_VALUE_KIND_INTEGER = 3,
    ATTRIBUTE_VALUE_KIND_DOUBLE = 4,
    ATTRIBUTE_VALUE_KIND_STRING = 5,
    ATTRIBUTE_VALUE_KIND_ENUMERATION = 6,
    ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE = 7,
    // A binary attribute value, represented as a string of '0'/'1' characters --
    // the same textual representation `ifcopenshell::valid_binary_string`/
    // `boost::dynamic_bitset<>(const std::string&)` already use elsewhere in this
    // codebase (`src/ifcwrap/IfcParseWrapper.i`'s `set_attribute_value_py`), so no
    // new field shape is needed: BINARY reuses the STRING case's `string_value` field.
    ATTRIBUTE_VALUE_KIND_BINARY = 8,
    // A homogeneous aggregate (EXPRESS LIST/SET/BAG/ARRAY), one level or two levels
    // deep (`ifcopenshell::argument_type`'s `AGGREGATE_OF_*`/
    // `AGGREGATE_OF_AGGREGATE_OF_*` cases, `EMPTY_AGGREGATE`/
    // `AGGREGATE_OF_EMPTY_AGGREGATE` -- research/01-python-core-and-lowlevel.md SS5).
    // Deliberately a single, generic, recursive kind rather than one case per
    // element type: `aggregate_value` holds a `std::vector<attribute_value_variant>`
    // whose elements are themselves ordinary `attribute_value_variant`s (each with
    // its own `kind` -- INTEGER/DOUBLE/STRING/BINARY/ENTITY_INSTANCE for a one-level
    // aggregate, or AGGREGATE again for a two-level one). This covers every
    // aggregate case in `ifcopenshell::argument_type` with one mechanism: the
    // generator's variant-adapter emitters (`emit.py`) walk this recursively via a
    // new "sequence" `VariantCaseModel.field_kind`, and `set_attribute_value_variant`
    // (below) recovers the concrete `std::vector<T>`/`std::vector<std::vector<T>>`
    // C++ type to construct by inspecting the (assumed-homogeneous) element kinds at
    // runtime -- see the .cpp for the exact dispatch, and
    // planning/ifcopenshell-ts/research/06-wrappergen-spike-results.md SS2.2 for why
    // this shape (rather than 8 separate AGGREGATE_OF_* cases) was chosen.
    ATTRIBUTE_VALUE_KIND_AGGREGATE = 9,
};

// A flattened, one-of-N representation of `ifcopenshell::attribute_value`.
// `emit_c_api_header`/`emit_c_api_implementation` (emit.py) map this 1:1 onto
// a plain, POD, extern "C" struct (`ifcopenshell_attribute_value_variant_t`), and
// `emit_napi_extension` maps *that* onto a plain JS value of the
// corresponding type (number/boolean/string/EntityInstance-handle/array/null) --
// matching Python's `get_argument`/`set_attribute_value_py` ergonomics, where
// callers get back a plain value, not a wrapper object they have to unwrap.
class attribute_value_variant {
  public:
    attribute_value_kind kind = ATTRIBUTE_VALUE_KIND_NULL;
    int64_t integer_value = 0;
    double double_value = 0.0;
    int logical_value = 2; // 0 = false, 1 = true, 2 = unknown
    std::string string_value;
    express::base entity_value;
    std::vector<attribute_value_variant> aggregate_value;
};

// Reads attribute `attribute_index` off `instance`, consulting
// `ifcopenshell::attribute_value::type()` (instance_data.h) to decide which
// implicit-conversion operator to invoke -- the same job
// `IfcParseWrapper.i`'s `helper_fn_attribute_type` does by hand for the
// Python binding. Covers the full ~15-way `ifcopenshell::argument_type`
// dispatch (research/01-python-core-and-lowlevel.md SS5): BOOL, LOGICAL,
// INTEGER, DOUBLE, STRING, BINARY, ENUMERATION, ENTITY_INSTANCE, every
// AGGREGATE_OF_*/AGGREGATE_OF_AGGREGATE_OF_* case (via the recursive
// ATTRIBUTE_VALUE_KIND_AGGREGATE case), and NULL for an unset attribute.
attribute_value_variant get_attribute_value_variant(const express::base& instance, int attribute_index);

// Inverse: dispatches on `value.kind` and calls the correctly-typed
// `express::base::set_attribute_value` overload. A `kind` of
// ATTRIBUTE_VALUE_KIND_NULL unsets the attribute, matching Python's `None`
// -> `unset_attribute_value` short-circuit (research/01-python-core-and-lowlevel.md SS5).
// For ATTRIBUTE_VALUE_KIND_AGGREGATE, the concrete `std::vector<T>` (or
// `std::vector<std::vector<T>>`) to construct is inferred from the kind of the
// aggregate's own elements (assumed homogeneous, matching real EXPRESS
// aggregate typing) -- an empty aggregate is written as an empty
// `std::vector<express::base>` (`Argument_EMPTY_AGGREGATE`'s usual role: an
// untyped placeholder for an unset list-typed attribute).
void set_attribute_value_variant(express::base& instance, int attribute_index, const attribute_value_variant& value);

// Re-derives the *declared* argument type of attribute `attribute_index` from
// schema metadata (`ifcopenshell::from_parameter_type`, argument_type.h) --
// independent of whether the attribute currently holds a value -- collapsed
// into the same small `attribute_value_kind` vocabulary the get/set functions
// above use. This is the free function
// planning/ifcopenshell-ts/research/06-wrappergen-spike-results.md SS2.4 designed
// to close the SET-side ergonomic gap: JS's `typeof` cannot disambiguate
// INTEGER vs. DOUBLE (one JS `number`) or STRING vs. ENUMERATION (one JS
// `string`) without first knowing the attribute's declared type, exactly the
// schema lookup Python's `set_attribute_value_py` does by hand before ever
// looking at the incoming value. The Phase 2 TS mixin layer (not this PR) is
// expected to call this before converting a bare `wall.Name = "x"` assignment
// into the structured `{kind, ...}` value `set_attribute_value_variant` expects.
attribute_value_kind attribute_kind_of(const express::base& instance, int attribute_index);

// --- entity_instance primitives (research/01-python-core-and-lowlevel.md SS5 point 3) ---
//
// The real, unmodified `express::base` (express.h) is deliberately thin --
// `get_argument`/`get_argument_index`/`attribute_name`/`attribute_type`/
// `get_attribute_category`/`get_attribute_names`/`get_inverse_attribute_names`/
// `is_a` all exist only as SWIG `%extend` blocks in
// `src/ifcwrap/IfcParseWrapper.i` today, not as real C++ methods -- there is
// nothing for wrappergen's clang frontend to discover. These free functions
// are the N-API binding's equivalent of that `%extend` glue: hand-written
// once, here, exactly like `get_attribute_value_variant`/
// `set_attribute_value_variant` above already are.

// `entity_instance.get_argument_index(name)` -- `ifcopenshell::entity::attribute_index`
// (schema.h) already does the real lookup; this just requires the instance to
// be an entity (not a defined/simple-type value) and surfaces a clear error
// for an unknown attribute name rather than the sentinel `0xFFFFFFFF` SWIG's
// Python binding returns (`research/01` SS5) -- matches this project's decided
// last-error-string / thrown-JS-Error contract (`10-architecture.md` SS2)
// instead of replicating the sentinel-return convention.
int get_argument_index(const express::base& instance, const std::string& name);

// `entity_instance.attribute_name(index)`.
std::string get_attribute_name(const express::base& instance, int attribute_index);

// `entity_instance.attribute_type(index)` -- the ~20-value string union
// (`ifcopenshell::argument_type_to_string`, argument.h) research/01 SS3.1 flags as
// "the canonical IFC attribute type taxonomy an [N-API] layer must mirror".
std::string get_attribute_type_name(const express::base& instance, int attribute_index);

// `entity_instance.get_attribute_category(name)` -> 0=invalid, 1=forward,
// 2=inverse, 3=derived -- mirrors `IfcParseWrapper.i`'s `%extend
// express::base { get_attribute_category }` linear scan over
// `all_attributes()`/`derived()`/`all_inverse_attributes()`.
int get_attribute_category(const express::base& instance, const std::string& name);

// `entity_instance.get_attribute_names()` / `get_inverse_attribute_names()`.
std::vector<std::string> get_attribute_names(const express::base& instance);
std::vector<std::string> get_inverse_attribute_names(const express::base& instance);

// `entity_instance.is_a(name)`.
bool is_a(const express::base& instance, const std::string& name);

// The bulk, single-call attribute-value fetch this PR's Phase 1 primitive
// layer offers in place of Python's fully-recursive `get_info_cpp`
// (research/01-python-core-and-lowlevel.md SS2.3, SS5 point 3;
// research/06-wrappergen-spike-results.md SS4's "not yet built" gap). Returns
// every *forward* attribute's value, in declaration order (index 0..count-1,
// the same order `get_attribute_names` enumerates) -- one native call
// fetching N attribute values instead of N native calls, closing the
// dominant, measurable cost of a per-attribute JS<->native crossing. This is
// a deliberately narrower, disclosed slice of Python's real `get_info_cpp`:
// it does not recurse into referenced entities' own attributes (an
// ENTITY_INSTANCE-kind element is returned as a handle, not inlined) --
// multi-level graph recursion (Python's `recursive=True` inlining) is left to
// the Phase 2 TS mixin layer, which can call this same bulk primitive once
// per nested entity_instance handle it encounters, still avoiding
// per-attribute (as opposed to per-instance) boundary crossings.
std::vector<attribute_value_variant> get_all_attribute_values(const express::base& instance);

} // namespace wrappergen
} // namespace ifcopenshell

#endif
