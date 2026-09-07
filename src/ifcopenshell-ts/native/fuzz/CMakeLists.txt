# This file was generated with the assistance of an AI coding tool.
#
# IfcOpenShell-TS - Phase 1 fuzz target for the file-open/parse primitives.
#
# Builds `ifcopenshell_fuzz_parse`, a standalone libFuzzer executable (see
# fuzz_parse.cpp's own doc comment for the entry point/ownership rationale) -- NOT the
# Node addon (../CMakeLists.txt), which this target has no dependency on. It links
# directly against the same generated C API layer and hand-written shims the addon
# links, and the same installed `IfcOpenShell::IfcParse` library underneath, following
# the same `find_package(IfcOpenShell CONFIG REQUIRED)` pattern ../CMakeLists.txt
# already established (see that file's own comment for why the core is consumed as an
# already-built-and-installed package rather than folded into the shared top-level
# build).
#
# Deliberately a separate CMakeLists.txt / build directory from ../CMakeLists.txt (the
# Node addon), not a second target bolted onto the same one: the two have almost no
# overlapping build inputs (no CMAKE_JS_INC/CMAKE_JS_LIB/N-API, no `.node` output) and,
# more importantly, need *different, incompatible compiler/linker flags* -- this target
# links against `-fsanitize=fuzzer` (see below) and is built with ASan/UBSan flags (see
# .github/workflows/ci-ifcopenshell-ts.yml's `fuzz` job), none of which the ordinary
# addon build must ever pick up by accident. Keeping them as separate CMake projects, each with
# their own `-DCMAKE_PREFIX_PATH=<installed-core>` configure step, makes that isolation
# structural rather than something a shared CMakeLists.txt has to remember to gate.
#
# Expects `-DCMAKE_PREFIX_PATH=<path-to-installed-ifcopenshell>` (matching ../README.md's
# addon build instructions) and, for an actual fuzzing run (as opposed to a plain
# regression build), ASan/UBSan compile+link flags (`-DCMAKE_CXX_FLAGS=-fsanitize=...`,
# `-DCMAKE_EXE_LINKER_FLAGS=-fsanitize=...`) supplied via those two standard CMake
# variables by the caller -- this file has no built-in opinion on those, same reasoning
# as ../CMakeLists.txt has no built-in opinion on CMAKE_BUILD_TYPE.
#
# `-fsanitize=fuzzer` itself is the one exception, deliberately hardcoded below via
# `target_link_options` on `ifcopenshell_fuzz_parse` specifically, rather than left to
# the caller's `-DCMAKE_EXE_LINKER_FLAGS` the way ASan/UBSan are: passing it as a
# *global* linker flag broke this file's own `cmake -S ...` configure step in CI
# (confirmed by reasoning after GitHub's job-log endpoint proved unreachable from the
# sandbox debugging this -- see this PR's own history). `project(... CXX)` above
# triggers CMake's built-in "does the compiler work" check, which compiles and links a
# trivial `int main(){}` probe program using whatever CMAKE_EXE_LINKER_FLAGS is set to
# at that point -- `-fsanitize=fuzzer` requires the linked program to define
# `LLVMFuzzerTestOneInput`, which that probe program doesn't, so the probe link (and
# therefore the whole configure step) fails before this file's own `add_executable`
# below is ever reached. Scoping it to only the one real target that does define
# `LLVMFuzzerTestOneInput` (`fuzz_parse.cpp`) avoids the probe entirely.

cmake_minimum_required(VERSION 3.15...3.31)
project(ifcopenshell_native_fuzz CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(IfcOpenShell CONFIG REQUIRED)

# See ../CMakeLists.txt's own comment on why IfcOpenShell_DIR (not CMAKE_PREFIX_PATH
# directly) is used to recover the installed include tree.
get_filename_component(IFCOPENSHELL_INSTALL_PREFIX "${IfcOpenShell_DIR}/../../.." ABSOLUTE)

set(WRAPPERGEN_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../wrappergen")
set(GENERATED_NAPI_DIR "${WRAPPERGEN_DIR}/generated_napi")
set(SHIM_DIR "${WRAPPERGEN_DIR}/shim")

add_executable(ifcopenshell_fuzz_parse
    fuzz_parse.cpp
    "${GENERATED_NAPI_DIR}/ifcopenshell_native_c_api.cpp"
    "${SHIM_DIR}/attribute_value_shim.cpp"
    "${SHIM_DIR}/file_shim.cpp"
)
target_include_directories(ifcopenshell_fuzz_parse PRIVATE
    "${GENERATED_NAPI_DIR}"
    "${SHIM_DIR}"
    "${IFCOPENSHELL_INSTALL_PREFIX}/include/ifcparse"
)
target_link_libraries(ifcopenshell_fuzz_parse PRIVATE IfcOpenShell::IfcParse)

# See the top-of-file comment for why this is scoped to this one target instead of
# passed via the caller's global -DCMAKE_EXE_LINKER_FLAGS.
target_link_options(ifcopenshell_fuzz_parse PRIVATE -fsanitize=fuzzer)
