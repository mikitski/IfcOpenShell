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
src/           the TS package itself (published to npm) - src/native/ holds a checked-in copy
                of the generated TS facade (ifcopenshell_native.ts) plus the hand-written
                addon loader (native_loader.ts) it imports
esm/           thin hand-written ESM wrapper re-exporting the CJS build
test/          Vitest tests, mirrors src/
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

## Linting/formatting

[Biome](https://biomejs.dev), scoped to this package (`npm run lint`, `npm run lint:fix`), 120-char
lines to match the Python side's convention.
