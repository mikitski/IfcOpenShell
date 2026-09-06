// This file was generated with the assistance of an AI coding tool.

// Phase 1 `wrappergen` N-API primitive-binding shim, file-level counterpart to
// `attribute_value_shim.h` (which covers the `express::base`/entity_instance surface
// that only exists as SWIG `%extend` glue in `src/ifcwrap/IfcParseWrapper.i`, not as
// real C++ methods). `ifcopenshell::file` has the same gap for a handful of
// operations -- see TODOS.md's "Phase 1 primitive binding: real, disclosed gaps left
// for follow-up" entry #2, which lists `file_pointer()`/`to_string()`/`from_string()`/
// `_write(fn)`/`entity_names()`/`schema_identifier()`/`storage_mode()` as deferred.
//
// This PR needs exactly one of those -- `write` (per
// planning/ifcopenshell-ts/10-architecture.md's "Async story": `write` is one of the
// three primitives named as needing an async variant, and an async variant needs a
// sync primitive to wrap) -- and adds only that one, leaving the rest of the disclosed
// list deferred exactly as TODOS.md already describes. `write_file` reproduces
// `IfcParseWrapper.i`'s `helper_fn_atomic_write` (issue #4797: write to a temp file
// next to the destination, then atomically rename it into place, so an interrupted
// write can never leave the destination truncated or corrupted) rather than reusing
// that function directly, since it is a private template defined inside the SWIG `.i`
// file, not a linkable symbol this addon can call.
#ifndef IFCOPENSHELL_WRAPPERGEN_FILE_SHIM_H
#define IFCOPENSHELL_WRAPPERGEN_FILE_SHIM_H

#include "file.h"

#include <string>

namespace ifcopenshell {
namespace wrappergen {

// `file.write(path)` / `file.write_async(path)` -- serializes `file_obj` to IFC-SPF
// text at `path`. Throws (via this project's decided last-error-string / thrown-JS-Error
// contract, `10-architecture.md` SS2) on any I/O failure, leaving the existing
// destination (if any) untouched.
void write_file(const ifcopenshell::file& file_obj, const std::string& path);

} // namespace wrappergen
} // namespace ifcopenshell

#endif
