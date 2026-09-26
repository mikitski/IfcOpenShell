// This file was generated with the assistance of an AI coding tool.

// Phase EX-3 chunk 1 `wrappergen` N-API primitive-binding shim
// (planning/ifcopenshell-ts/70-express-rules-plan.md's "f.header sub-entity
// accessors" gap): `ifcopenshell::spf_header::file_description()`/`file_name()`/
// `file_schema()` return ordinary, plain-getter `Header_section_schema::file_description`/
// `file_name`/`file_schema` C++ classes (`src/ifcparse/schemas/Header_section_schema.h`)
// -- but exposing THOSE classes as their own wrappergen-discovered handle types hits two
// real, structural blockers this shim sidesteps entirely instead of solving head-on:
//
// 1. Ownership: `Header_section_schema::file_description`/`file_name`/`file_schema` are
//    thin, non-owning *views* into whichever `ifcopenshell::spf_header` produced them
//    (its own `header_entities_` storage, `spf_header.h`/`.cpp`) -- exactly like
//    `express::base`/`entity_instance` is a view into an `ifcopenshell::file`'s storage.
//    But this generator's owner-propagation mechanism (`emit.py`'s `_owner_expression`)
//    requires the *owning* class to use `shared_ptr` handle storage (`ifcopenshell::file`
//    is the only class that does today) -- `ifcopenshell::spf_header` is (and, short of a
//    much larger, separately-scoped change touching every existing `spf_header` call site,
//    should remain) a plain "value" handle_kind class, so wrappergen has no way to keep a
//    `spf_header`-owned sub-entity handle's underlying memory alive past its owning
//    `spf_header` JS wrapper's own garbage collection. Real Python's own SWIG binding
//    (`src/ifcwrap/IfcParseWrapper.i` lines 76-90, 944-965) hits the identical problem and
//    solves it by hand-written `%extend` glue that upcasts the result to a generic
//    `express::base` owned by the *file* -- but that path is unavailable here too, for the
//    same structural reason (`express::base`'s own `class_owner_types` entry is hardwired
//    to `ifcopenshell::file`, and a `spf_header` handle has no `shared_ptr<file>` chain to
//    propagate: a `spf_header` value can be entirely standalone, e.g.
//    `spf_header.create(file, logger)`/`spf_header.with_other(other)`, with no live file
//    behind it at all).
// 2. Real Python's `validate.py` (the only real consumer,
//    planning/ifcopenshell-ts/70-express-rules-plan.md) only ever reads these fields as
//    plain scalar/list-of-string values (`getattr(header.file_description, "description")`
//    etc, `IfcParseWrapper.i` lines 944-965's `file_description_py`/`file_name_py`/
//    `file_schema_py` properties feeding straight into that) -- never anything requiring a
//    live handle back to the sub-entity itself (no further attribute-index introspection,
//    no mutation).
//
// Given both of the above, these free functions read straight through to the final
// scalar/`vector<string>` value in one synchronous C++ call -- no intermediate
// `file_description`/`file_name`/`file_schema` handle is ever created or exposed to JS, so
// there is no dangling-pointer/owner-chain problem to solve at all. `header` is bound by
// const reference, which resolves `spf_header::file_description()`/`file_name()`/
// `file_schema()` to their `const`-qualified overloads (`spf_header.h`) -- avoiding the
// const/non-const overload-name collision wrappergen's generic discovery would otherwise
// hit if pointed at these same accessors directly (both overloads share the same by-value
// return type and empty parameter list, differing only in the implicit object parameter's
// constness -- `wrappergen`'s `_finalize_overload_names` already has an established,
// if unergonomic, `_overload_1`/`_overload_2` convention for exactly this shape elsewhere,
// e.g. `ifcopenshell::file::build_inverses`/`logger::print_performance_stats_on_element`,
// but a single, explicitly-const-qualified free function avoids needing it here).
//
// `description()`/`author()`/`organization()`/`schema_identifiers()` return
// `std::vector<std::string>`, which needed a new, small, ownerless
// `sequence_of_string` wrappergen return adapter (`conventions.py`/`emit.py`) --
// distinct from the existing `sequence_of_variant:` adapter precisely because that one's
// discriminated-union element type has an ENTITY_INSTANCE case needing the same
// unavailable file-owner chain described above, even when (as here) no element ever
// actually uses it: the conversion helper's *shape* still requires an owner expression at
// code-gen time, not just at runtime.
#ifndef IFCOPENSHELL_WRAPPERGEN_HEADER_SHIM_H
#define IFCOPENSHELL_WRAPPERGEN_HEADER_SHIM_H

#include "spf_header.h"

#include <string>
#include <vector>

namespace ifcopenshell {
namespace wrappergen {

// `spf_header.file_description_description()` -- `file_description::description()`, the
// SPF header's free-text description lines (`validate_ifc_header`'s
// `validate_attribute(file_description, "description", 0, aggregate=True)`).
std::vector<std::string> header_file_description_description(const ifcopenshell::spf_header& header);

// `spf_header.file_description_implementation_level()` -- `file_description
// ::implementation_level()`.
std::string header_file_description_implementation_level(const ifcopenshell::spf_header& header);

// `spf_header.file_name_name()` -- `file_name::name()`.
std::string header_file_name_name(const ifcopenshell::spf_header& header);

// `spf_header.file_name_time_stamp()` -- `file_name::time_stamp()`.
std::string header_file_name_time_stamp(const ifcopenshell::spf_header& header);

// `spf_header.file_name_author()` -- `file_name::author()`.
std::vector<std::string> header_file_name_author(const ifcopenshell::spf_header& header);

// `spf_header.file_name_organization()` -- `file_name::organization()`.
std::vector<std::string> header_file_name_organization(const ifcopenshell::spf_header& header);

// `spf_header.file_name_preprocessor_version()` -- `file_name::preprocessor_version()`.
std::string header_file_name_preprocessor_version(const ifcopenshell::spf_header& header);

// `spf_header.file_name_originating_system()` -- `file_name::originating_system()`.
std::string header_file_name_originating_system(const ifcopenshell::spf_header& header);

// `spf_header.file_name_authorization()` -- `file_name::authorization()`.
std::string header_file_name_authorization(const ifcopenshell::spf_header& header);

// `spf_header.file_schema_schema_identifiers()` -- `file_schema::schema_identifiers()`,
// `file_schema`'s only attribute (e.g. `["IFC4"]`).
std::vector<std::string> header_file_schema_schema_identifiers(const ifcopenshell::spf_header& header);

} // namespace wrappergen
} // namespace ifcopenshell

#endif
