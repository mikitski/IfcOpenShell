// This file was generated with the assistance of an AI coding tool.

// Spike-only C++ shim for the `wrappergen` N-API validation spike
// (planning/ifcopenshell-ts/research/06-wrappergen-spike-results.md). This is
// NOT part of the `ifcparse` core -- `src/ifcparse/` is unmodified by this
// spike -- it is new, generator-adjacent glue that plays the same role
// `src/ifcwrap/IfcParseWrapper.i`'s `set_attribute_value_py` /
// `convert_cpp_attribute_to_python` play for the SWIG/Python binding: a small
// amount of hand-written C++ that gives wrappergen's clang frontend a
// discriminated-union shape to point its new "variant" type adapter at,
// since the real `ifcopenshell::attribute_value` (instance_data.h) has no
// discriminant of its own -- it is read via a set of C++ implicit-conversion
// operators chosen by the caller based on separately-obtained schema
// metadata, exactly like Python's binding has to do by hand.
#ifndef IFCOPENSHELL_WRAPPERGEN_ATTRIBUTE_VALUE_SHIM_H
#define IFCOPENSHELL_WRAPPERGEN_ATTRIBUTE_VALUE_SHIM_H

#include "express.h"
#include "ifc_parse_api.h"

#include <cstdint>
#include <string>

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
};

// A flattened, one-of-N representation of `ifcopenshell::attribute_value`.
// `emit_c_api_header`/`emit_c_api_implementation` (emit.py) map this 1:1 onto
// a plain, POD, extern "C" struct (`ifcopenshell_attribute_value_t`), and
// `emit_napi_extension` maps *that* onto a plain JS value of the
// corresponding type (number/boolean/string/EntityInstance-handle/null) --
// matching Python's `get_argument`/`set_attribute_value_py` ergonomics,
// where callers get back a plain value, not a wrapper object they have to
// unwrap.
//
// Deliberately out of scope for this spike (see
// planning/ifcopenshell-ts/research/06-wrappergen-spike-results.md): BINARY
// and the aggregate cases (`AGGREGATE_OF_*`, nested up to 2 levels). Those
// are real, additional cases a non-spike Phase 1 implementation still needs
// to add to both this shim and the corresponding case tables in
// `conventions.py`/`emit.py` -- the point of this shim is to prove the
// *mechanism* (a config-declared variant adapter, threaded through the C
// API / N-API / TS emitters) holds up, not to re-implement every branch of
// the real ~15-way dispatch table.
class IFC_PARSE_API attribute_value_variant {
  public:
    attribute_value_kind kind = ATTRIBUTE_VALUE_KIND_NULL;
    int64_t integer_value = 0;
    double double_value = 0.0;
    int logical_value = 2; // 0 = false, 1 = true, 2 = unknown
    std::string string_value;
    express::base entity_value;
};

// Reads attribute `attribute_index` off `instance`, consulting
// `ifcopenshell::attribute_value::type()` (instance_data.h) to decide which
// implicit-conversion operator to invoke -- the same job
// `IfcParseWrapper.i`'s `helper_fn_attribute_type` does by hand for the
// Python binding.
IFC_PARSE_API attribute_value_variant get_attribute_value_variant(const express::base& instance, int attribute_index);

// Inverse: dispatches on `value.kind` and calls the correctly-typed
// `express::base::set_attribute_value` overload. A `kind` of
// ATTRIBUTE_VALUE_KIND_NULL unsets the attribute, matching Python's `None`
// -> `unset_attribute_value` short-circuit (research/01-python-core-and-lowlevel.md SS5).
IFC_PARSE_API void set_attribute_value_variant(express::base& instance, int attribute_index, const attribute_value_variant& value);

} // namespace wrappergen
} // namespace ifcopenshell

#endif
