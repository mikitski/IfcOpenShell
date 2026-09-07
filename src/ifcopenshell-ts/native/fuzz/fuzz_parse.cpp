// This file was generated with the assistance of an AI coding tool.
//
// Phase 1 exit criterion (planning/ifcopenshell-ts/20-roadmap.md, "(b)"): fuzz test the
// file-open/parse primitives, corpus-seeded from `test/fixtures/**/*.ifc`, against
// malformed input -- this is a Node-only (server-side) library, and a plausible real
// deployment is a web service parsing user-uploaded `.ifc` files, the same
// untrusted-file-parsing attack surface that routinely produces CVEs in PDF/image
// parsers (see 40-testing-strategy.md SS7, "Malformed/hostile input").
//
// This is a standalone libFuzzer target (`LLVMFuzzerTestOneInput`), NOT a Node addon --
// it links directly against the same generated C API layer
// (../../../wrappergen/generated_napi/ifcopenshell_native_c_api.cpp) and hand-written
// shims (../../../wrappergen/shim/) the real addon (../CMakeLists.txt) links, and the
// same installed `IfcOpenShell::IfcParse` library underneath, but with no N-API/Node/V8
// involvement at all -- libFuzzer needs a plain C++ executable, not a Node process. See
// this directory's own CMakeLists.txt for how it's built and linked, and
// .github/workflows/ci-ifcopenshell-ts.yml's `fuzz` job for how it's run in CI (corpus,
// time budget, sanitizer flags).
//
// Entry point picked: `ifcopenshell_file_new_with_data_data_size` (the raw C API for
// `ifcopenshell::file(void* data, int size)` -- an in-memory-buffer SPF/XML/zip parse,
// auto-detected by content, matching how `file.open_buffer_async()`'s sync counterpart
// on the TS side ultimately calls the same primitive). This is deliberately the
// *minimal*-arity entry point (no explicit filetype/logger), same disclosed, bounded
// scope choice TODOS.md's "Async primitive variants" entry already made for the async
// file-open siblings -- fuzzing the full parse/tokenize/schema-instantiate pipeline for
// every corpus/mutated input doesn't need every constructor overload exercised, just
// the one that's actually reachable from untrusted bytes.

#include "ifcopenshell_native_c_api.h"

#include <cstddef>
#include <cstdint>

extern "C" int LLVMFuzzerTestOneInput(const uint8_t* data, size_t size) {
    // `data_size` is a C `int` in the generated C API (mirrors the underlying
    // `ifcopenshell::file(void*, int)` constructor) -- libFuzzer can in principle hand
    // back inputs larger than INT_MAX on 64-bit builds; guard rather than let a
    // narrowing conversion wrap negative and misbehave. Not expected to ever trigger in
    // practice (the corpus and any bounded mutation of it stay far under 2 GiB), but
    // it's the kind of boundary a fuzzer is specifically good at finding if left
    // unguarded, and guarding it here is the harness's own responsibility, not
    // something to lean on the parser to reject.
    if (size > static_cast<size_t>(INT32_MAX)) {
        return 0;
    }

    ifcopenshell_file_t* file = ifcopenshell_file_new_with_data_data_size(
        reinterpret_cast<const char*>(data), static_cast<int>(size));
    if (file == nullptr) {
        // Malformed input rejected via the normal thrown-exception/last-error path --
        // exactly the well-behaved case this harness is confirming stays well-behaved
        // under mutation (a crash or sanitizer report anywhere in this call is the bug
        // this job exists to catch, not a null return here).
        ifcopenshell_last_error_clear();
        return 0;
    }

    // Exercise a little past construction alone -- `good()` walks the parsed header/
    // token stream's recorded status, and `schema()`/`header()` touch the
    // schema-lookup and SPF-header paths a real caller (e.g. Phase 2's `file_mixin`
    // port, or this package's own `open_buffer_async`) would hit immediately after
    // opening a file, so the fuzzer's mutations get a chance to reach those code paths
    // too, not just the constructor.
    ifcopenshell_file_open_status_t* status = ifcopenshell_file_good(file);
    if (status != nullptr) {
        ifcopenshell_file_open_status_free(status);
    }
    // The returned wrapper struct only *borrows* the pointee (`schema_definition*`,
    // owned by the global schema registry, not by this call) but the small wrapper
    // struct itself is a fresh heap allocation each call and must still be freed --
    // otherwise every single fuzzer iteration leaks one, which would drown real
    // LeakSanitizer signal (ASAN_OPTIONS=detect_leaks=1 in CI) under thousands of
    // false positives for a leak this harness itself introduced, not one the parser
    // has.
    ifcopenshell_schema_definition_t* schema = ifcopenshell_file_schema(file);
    if (schema != nullptr) {
        ifcopenshell_schema_definition_free(schema);
    }
    ifcopenshell_spf_header_t* header = ifcopenshell_file_header(file);
    if (header != nullptr) {
        ifcopenshell_spf_header_free(header);
    }

    ifcopenshell_file_free(file);
    ifcopenshell_last_error_clear();
    return 0;
}
