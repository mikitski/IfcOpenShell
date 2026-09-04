# This file was generated with the assistance of an AI coding tool.
#
# IfcOpenShell-TS - Phase 0 smoke-test native addon.
#
# This is intentionally minimal and disposable: hand-written node-addon-api
# glue built with cmake-js, just enough to open an in-memory IFC-SPF buffer,
# read its schema identifier, and close it - de-risking the native-addon
# build/CI pipeline before any real porting work starts. Phase 1 decides the
# real primitive surface (hand-written vs. generated) and will likely replace
# this file wholesale; see ../../../planning/ifcopenshell-ts/20-roadmap.md.
#
# Unlike src/wrappergen (which is wired into the top-level cmake/CMakeLists.txt
# as an in-tree subdirectory), this addon is built as a standalone CMake
# project driven by cmake-js and consumes an already-built-and-installed
# IfcOpenShell via its exported CMake package config (the same
# `find_package(IfcOpenShell CONFIG REQUIRED)` mechanism src/examples uses to
# demonstrate out-of-tree consumption). This keeps Node/N-API-specific build
# concerns (Windows import-library generation, node-addon-api header
# resolution) out of the shared top-level build that every other package
# depends on.
#
# Expects `-DCMAKE_PREFIX_PATH=<path-to-installed-ifcopenshell>` (cmake-js:
# `--CDCMAKE_PREFIX_PATH=...`); see ../README.md.

cmake_minimum_required(VERSION 3.15...3.31)
project(ifcopenshell_native)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_compile_definitions(NAPI_VERSION=8)

find_package(IfcOpenShell CONFIG REQUIRED)

file(GLOB SOURCE_FILES "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp")

add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC})
target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB} IfcOpenShell::IfcParse)

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET)
  # Generate node.lib, the Windows import library N-API addons link against.
  execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
endif()
