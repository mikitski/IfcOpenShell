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

#include <cstdint>
#include <string>

namespace ifcopenshell {
namespace wrappergen {

// `file.write(path)` / `file.write_async(path)` -- serializes `file_obj` to IFC-SPF
// text at `path`. Throws (via this project's decided last-error-string / thrown-JS-Error
// contract, `10-architecture.md` SS2) on any I/O failure, leaving the existing
// destination (if any) untouched.
void write_file(const ifcopenshell::file& file_obj, const std::string& path);

// `file.file_pointer()` -- `ifcopenshell::file`'s counterpart to `express::base`'s
// `identity()`: a stable, cross-call identity key for the underlying
// `ifcopenshell::file` object, used by Phase 2's `IfcFile`-level identity-keyed
// registry (`Transaction`/undo-redo state) exactly the way Python's
// `file_mixin.registry` is keyed by `int(self.this)`
// (planning/ifcopenshell-ts/research/01-python-core-and-lowlevel.md SS5 point 3,
// research/07-fresh-wrapper-per-access.md). `file_obj` is bound by reference from
// the addon's `shared_ptr<ifcopenshell::file>` handle, so `&file_obj` is the
// pointee's address -- stable across every fresh JS wrapper N-API mints for the
// same underlying file, and distinct per underlying file, which is exactly the
// "same underlying object" identity this needs (not the shared_ptr control block,
// not any particular JS wrapper struct).
//
// Returned as a decimal string, not a native integer: wrappergen's generic
// "integer" adapter (used throughout this generator, e.g. `identity()`/`id()`)
// marshals through a plain 32-bit C `int` end-to-end
// (`emit.py`'s `_return_c_type`/`_parameter_c_type`), which would silently
// truncate a real 64-bit pointer value -- a correctness bug for an identity key,
// not just a precision nicety. The "string" adapter is already 64-bit-clean (a
// `char*`/JS string, no native-width ceiling), so reusing it here needs no new
// generator machinery.
std::string file_pointer(const ifcopenshell::file& file_obj);

} // namespace wrappergen
} // namespace ifcopenshell

#endif
