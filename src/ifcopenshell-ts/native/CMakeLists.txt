# This file was generated with the assistance of an AI coding tool.
#
# IfcOpenShell-TS - Phase 1 primitive-binding native addon.
#
# Replaces Phase 0's hand-written smoke-test addon (native/src/binding.cpp,
# removed) with the real, generated primitive surface: the checked-in
# wrappergen output under ../../wrappergen/generated_napi/ (produced by
# ../../wrappergen/napi_binding.py -- see that file and
# planning/ifcopenshell-ts/research/06-wrappergen-spike-results.md for why
# this is generated, and checked in rather than generated at build/CI time:
# no libclang/Boost-dev toolchain is set up for this CI leg, and a
# deterministic, reviewable diff is preferable to a codegen step every
# consumer's build would otherwise need to reproduce) plus the hand-written
# variant/entity_instance shim (../../wrappergen/shim/attribute_value_shim.*)
# that gives the generator's variant adapter something to point at -- see
# that file's own doc comment for why this one piece has to be hand-written
# regardless of binding technology (SWIG's `.i` typemaps solve the identical
# problem by hand for Python).
#
# Unlike src/wrappergen (gated behind BUILD_IFCPARSE_EXPERIMENTAL_WRAPPER,
# off by default, not wired into any CI workflow), this addon is a normal,
# always-built part of the ifcopenshell-ts package -- it consumes an
# already-built-and-installed IfcOpenShell via its exported CMake package
# config, exactly like Phase 0's addon did (see this file's git history for
# that version's fuller rationale on staying out of the shared top-level
# build).
#
# Expects `-DCMAKE_PREFIX_PATH=<path-to-installed-ifcopenshell>` (cmake-js:
# `--CDCMAKE_PREFIX_PATH=...`); see ../README.md.

cmake_minimum_required(VERSION 3.15...3.31)
project(ifcopenshell_native)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_compile_definitions(NAPI_VERSION=8)

find_package(IfcOpenShell CONFIG REQUIRED)

# `IfcOpenShell::IfcParse`'s exported INTERFACE_INCLUDE_DIRECTORIES resolves
# `#include "ifcparse/file.h"` (prefixed -- the convention its own public
# consumers, e.g. src/examples, use). The generated primitive binding and the
# hand-written shim instead `#include "file.h"`/`#include "express.h"`
# unprefixed, matching how wrappergen itself compiles against
# src/ifcparse directly (`-I src/ifcparse`, no `ifcparse/` subdirectory
# component) -- so both include styles need to resolve here. `IfcOpenShell_DIR`
# (set by the successful find_package(CONFIG) above, pointing at
# <prefix>/lib/cmake/IfcOpenShell) is a more robust way to recover
# <prefix>/include/ifcparse than assuming CMAKE_PREFIX_PATH is a single,
# unlisted path -- it can legitimately be a list (e.g. also carrying a vcpkg
# toolchain prefix on Windows).
get_filename_component(IFCOPENSHELL_INSTALL_PREFIX "${IfcOpenShell_DIR}/../../.." ABSOLUTE)

set(WRAPPERGEN_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../wrappergen")
set(GENERATED_NAPI_DIR "${WRAPPERGEN_DIR}/generated_napi")
set(SHIM_DIR "${WRAPPERGEN_DIR}/shim")

add_library(${PROJECT_NAME} SHARED
    "${GENERATED_NAPI_DIR}/ifcopenshell_native_c_api.cpp"
    "${GENERATED_NAPI_DIR}/ifcopenshell_native.cpp"
    "${SHIM_DIR}/attribute_value_shim.cpp"
    "${SHIM_DIR}/file_shim.cpp"
    ${CMAKE_JS_SRC}
)
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_JS_INC}
    "${GENERATED_NAPI_DIR}"
    "${SHIM_DIR}"
    "${IFCOPENSHELL_INSTALL_PREFIX}/include/ifcparse"
)
target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB} IfcOpenShell::IfcParse)

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET)
  # Generate node.lib, the Windows import library N-API addons link against.
  execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
endif()
