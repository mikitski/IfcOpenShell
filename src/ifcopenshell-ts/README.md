# ifcopenshell-ts

TypeScript port of [`ifcopenshell-python`](../ifcopenshell-python), running against a native Node.js
binding onto the IfcOpenShell C++ core (`src/ifcparse`, `src/ifcgeom`, ...) - the same relationship
`ifcopenshell-python` has to its SWIG-generated `ifcopenshell_wrapper` extension.

**Status: Phase 0 (scaffolding).** There is no real API surface yet. This package currently exists
to prove the native-addon build/CI pipeline works end-to-end: open an in-memory IFC-SPF buffer, read
its schema identifier, close it. See `planning/ifcopenshell-ts/` at the repository root for the full
design and phased roadmap.

## Layout

```
native/        the N-API addon (node-addon-api), built with cmake-js against an
                already-built-and-installed IfcOpenShell CMake package
src/           the TS package itself (published to npm)
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

[Vitest](https://vitest.dev). `npm test` runs the suite once; `test/native/` holds the Phase 0
smoke test.

## Linting/formatting

[Biome](https://biomejs.dev), scoped to this package (`npm run lint`, `npm run lint:fix`), 120-char
lines to match the Python side's convention.
