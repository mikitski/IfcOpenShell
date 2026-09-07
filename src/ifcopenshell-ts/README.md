# ifcopenshell-ts

TypeScript port of [`ifcopenshell-python`](../ifcopenshell-python), running against a native Node.js
binding onto the IfcOpenShell C++ core (`src/ifcparse`, `src/ifcgeom`, ...) - the same relationship
`ifcopenshell-python` has to its SWIG-generated `ifcopenshell_wrapper` extension.

**Status: Phase 1 (low-level binding).** The public surface is still the *raw* primitive layer
(`file`, `entity_instance`, and the full schema-introspection class set — `declaration`, `entity`,
`attribute`, `schema_definition`, ...), named and shaped mechanically after their C++/Python
counterparts, generated from the real C++ core by `src/wrappergen/napi_binding.py`. There is no
friendly `IfcFile`/`EntityInstance` API yet (Phase 2's `file_mixin`/`entity_instance_mixin` port) —
see `planning/ifcopenshell-ts/` at the repository root for the full design and phased roadmap.

## Layout

```
native/        the N-API addon: the generated primitive binding
                (../wrappergen/generated_napi/, from src/wrappergen/napi_binding.py) plus the
                hand-written variant/entity_instance shim (../wrappergen/shim/) it depends on,
                built with cmake-js against an already-built-and-installed IfcOpenShell CMake
                package
native/fuzz/   a standalone libFuzzer target for the file-open/parse primitives (own
                CMakeLists.txt, own executable - not part of the Node addon build), see
                "Fuzzing" below
src/           the TS package itself (published to npm) - src/native/ holds a checked-in copy
                of the generated TS facade (ifcopenshell_native.ts) plus the hand-written
                addon loader (native_loader.ts) it imports
esm/           thin hand-written ESM wrapper re-exporting the CJS build
test/          Vitest tests, mirrors src/ - test/fixtures/ holds `.ifc` files copied from
                `../ifcopenshell-python/test/fixtures/`, also used as the fuzz target's seed
                corpus (see "Fuzzing" below)
```

## Building

The native addon links against an installed IfcOpenShell (via `find_package(IfcOpenShell CONFIG
REQUIRED)`), so the C++ core needs to be built and installed first. From the repository root:

```sh
mkdir build && cd build
cmake ../cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=<install-prefix> \
  -DSCHEMA_VERSIONS=4 \
  -DBUILD_IFCGEOM=OFF \
  -DBUILD_IFCPYTHON=OFF \
  -DBUILD_CONVERT=OFF \
  -DBUILD_GEOMSERVER=OFF \
  -DBUILD_EXAMPLES=OFF
cmake --build . --target install
```

Then, from `src/ifcopenshell-ts/`:

```sh
npm install
CMAKE_PREFIX_PATH=<install-prefix> npm run build
npm test
```

At test/run time, the installed IfcOpenShell's library directory (containing both `IfcParse` and its
schema plugin shared libraries) must be on the platform's shared-library search path
(`LD_LIBRARY_PATH` on Linux, `DYLD_LIBRARY_PATH` on macOS, `PATH` on Windows) - see
`.github/workflows/ci-ifcopenshell-ts.yml` for a worked example.

## Testing

[Vitest](https://vitest.dev). `npm test` runs the suite once; `test/native/primitives.test.ts` is
the Phase 1 integration test (creates an `IfcWall`, sets/gets every attribute-type category once,
reads it back via schema introspection - see `planning/ifcopenshell-ts/20-roadmap.md`'s Phase 1
exit criterion).

## Memory safety (AddressSanitizer/UndefinedBehaviorSanitizer)

`.github/workflows/ci-ifcopenshell-ts.yml`'s `asan-ubsan` job (Linux x64 only - see that job's
own comment for why) builds both the C++ core and the native addon with
`-fsanitize=address,undefined` at compile *and* link time, then runs `npm test` against that
build with the ASan runtime preloaded (`LD_PRELOAD`, since `node` itself isn't
sanitizer-instrumented - only the addon `.node` file loaded into it is). A native memory bug
here (use-after-free, double-free, OOB read/write, ...) doesn't throw catchably like a JS
exception - it segfaults the whole process - so this needs a dedicated CI job rather than
relying on the ordinary test suite to notice.

## Fuzzing

`native/fuzz/` builds `ifcopenshell_fuzz_parse`, a standalone
[libFuzzer](https://llvm.org/docs/LibFuzzer.html) target for the file-open/parse primitives
(`ifcopenshell_file_new_with_data_data_size` and friends, see `native/fuzz/fuzz_parse.cpp`) -
a Node-only (server-side) library's most plausible untrusted-input attack surface is a web
service parsing user-uploaded `.ifc` files, the same class of surface that routinely produces
CVEs in PDF/image parsers. It links directly against the generated C API and the installed
C++ core, with no Node/N-API/V8 involvement (libFuzzer needs a plain C++ executable, not a
Node process), and is a separate CMake project from the addon (`native/CMakeLists.txt`) rather
than a second target bolted onto it, since it needs incompatible build flags
(`-fsanitize=fuzzer,...`) the ordinary addon build must never pick up by accident.

`.github/workflows/ci-ifcopenshell-ts.yml`'s `fuzz` job (Linux x64 + clang only - libFuzzer has
no GCC equivalent) builds it against `-fsanitize=fuzzer-no-link,address,undefined`-instrumented
core libraries, seeds it from `test/fixtures/**/*.ifc`, and runs it for a bounded time budget
(`FUZZ_TIME_BUDGET_SECONDS`, currently 90s) on every PR as a regression check, not a fuzzing
campaign - see `TODOS.md` for a disclosed follow-up on a longer/scheduled campaign.

To run it locally on a system with clang + libFuzzer support:

```sh
cmake -S native/fuzz -B build-fuzz \
  -DCMAKE_PREFIX_PATH=<install-prefix> \
  -DCMAKE_CXX_FLAGS="-fsanitize=fuzzer-no-link,address,undefined -g -O1" \
  -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=fuzzer,address,undefined"
cmake --build build-fuzz

# libFuzzer scans a corpus directory non-recursively, but test/fixtures/ nests some
# seeds under subdirectories (geom/, mvd_parsing/, units/, validate/) - flatten first
# (same reason the CI `fuzz` job's own "Flatten seed corpus" step exists) or those
# seeds are silently skipped.
mkdir -p /tmp/fuzz-corpus && find test/fixtures -iname '*.ifc' -exec cp {} /tmp/fuzz-corpus/ \;
./build-fuzz/ifcopenshell_fuzz_parse /tmp/fuzz-corpus -max_total_time=60
```

## Linting/formatting

[Biome](https://biomejs.dev), scoped to this package (`npm run lint`, `npm run lint:fix`), 120-char
lines to match the Python side's convention.
