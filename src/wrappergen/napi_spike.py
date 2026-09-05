# This file was generated with the assistance of an AI coding tool.

"""Entry point for the Phase 1 `wrappergen` N-API validation spike
(planning/ifcopenshell-ts/research/06-wrappergen-spike-results.md).

Builds a `WrapperConfig` narrowed to `file` + `entity_instance` (`express::base`) +
`declaration`, adds the "variant" adapter and its two hand-written accessor
functions (`src/wrappergen/shim/attribute_value_shim.h`), and emits an N-API
extension + TypeScript facade alongside the existing C API layer.

This is spike output, not a production entry point -- it is not wired into
`src/wrappergen/CMakeLists.txt`'s default build (see that file's
`wrappergen_napi_spike` target, which is opt-in like the rest of this
experimental tool) and does not touch the checked-in `generated/` snapshot
that `generate.py --repo-root ... --output-dir ...` (the *existing*,
Python-facade-producing entry point) produces.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from wrappergen.clang_frontend import build_module_model
    from wrappergen.config import CompilationConfig, IgnoreConfig, WrapperConfig
    from wrappergen.emit import (
        emit_c_api_header,
        emit_c_api_implementation,
        emit_napi_extension,
        emit_typescript_facade,
    )
    from wrappergen.model import CallableModel, ParameterModel, VariantAdapterModel, VariantCaseModel
else:
    from .clang_frontend import build_module_model
    from .config import CompilationConfig, IgnoreConfig, WrapperConfig
    from .emit import emit_c_api_header, emit_c_api_implementation, emit_napi_extension, emit_typescript_facade
    from .model import CallableModel, ParameterModel, VariantAdapterModel, VariantCaseModel

# `_HEADERS_REQUIRING_ROCKSDB`-style workaround, but for the header-ordering bug this
# spike also had to route around: `rocksdb_map_adapter.h` (pulled in transitively via
# `storage.h`, which `file.h`/`instance_data.h` both include) uses `std::vector`/
# `std::string`/`std::ostringstream` as ordinary, unguarded member/return types --
# `#ifdef IFOPSH_WITH_ROCKSDB` only wraps the *method bodies* that reference `rocksdb::`
# symbols, not these standard-library type usages -- and the file relies on an earlier
# includer having already pulled in `<vector>`/`<string>`/`<sstream>` (relying on strict
# libc++ tolerating this by luck, which it doesn't; libstdc++ often does, by luck, which
# is almost certainly why this was never caught). See
# `06-wrappergen-spike-results.md` for the full writeup -- this is a real, pre-existing
# `src/ifcparse` header-hygiene bug, independent of wrappergen, out of scope to fix here.
_ROCKSDB_HEADER_ORDERING_WORKAROUND = ["-include", "vector", "-include", "string", "-include", "sstream"]


def build_napi_spike_config(repo_root: Path) -> WrapperConfig:
    src_ifcparse = repo_root / "src" / "ifcparse"
    shim_header = repo_root / "src" / "wrappergen" / "shim" / "attribute_value_shim.h"
    headers = [str(path.resolve()) for path in sorted(src_ifcparse.glob("*.h")) if path.parent.name != "schemas"]
    headers = [header for header in headers if not header.endswith(("rocksdb_map_adapter.h", "rocksdb_set_view.h"))]
    headers.append(str(shim_header.resolve()))

    include_dirs = [str(src_ifcparse.resolve())]

    return WrapperConfig(
        module_name="ifcopenshell_napi_spike",
        c_prefix="ifcopenshell",
        api_header_name="ifcopenshell_napi_spike_c_api.h",
        api_implementation_name="ifcopenshell_napi_spike_c_api.cpp",
        extension_source_name="ifcopenshell_napi_spike.cpp",
        python_source_name="ifcopenshell_napi_spike_unused.py",
        allowed_namespaces=["ifcopenshell", "express"],
        enum_names={"ifcopenshell::filetype": "FileType"},
        # `express::entity` (a `base` narrowed to "this is definitely an ENTITY_INSTANCE,
        # not a defined-type value") would otherwise collide 1:1 with the *unrelated*
        # `ifcopenshell::entity` schema-declaration class -- both default to the py_name
        # "entity" (`cpp_leaf_name`), which `_python_class_name`/`_class_index` has no
        # collision detection for. A real, general finding from this spike (not spike-
        # specific): see `06-wrappergen-spike-results.md`.
        class_names={"express::base": "entity_instance", "express::entity": "typed_entity_instance"},
        parameter_names={"type": "filetype", "read_only": "readonly"},
        class_handle_kinds={
            "ifcopenshell::file": "shared_ptr",
            # These are all long-lived objects owned by the schema they belong to (in
            # practice, the process-wide singleton `Ifc4::get_schema()` etc. return),
            # reached only via raw pointer, and never meant to be copied -- several
            # (`attribute`, `type_declaration`, `aggregation_type`, `entity`, and
            # `schema_definition` itself) have destructors that `delete` pointers they
            # think they alone own. The generic "value" handle_kind's pointer-return
            # handling (`_emit_handle_return_lines`: dereference the returned pointer and
            # copy it into the wrapper) compiles cleanly against all of these -- none is a
            # deleted/non-copyable type -- but is a real double-free/use-after-free
            # confirmed by an actual runtime crash during this spike (schema_definition's
            # destructor deleting `declaration*`s the process-wide singleton still
            # references) -- see 06-wrappergen-spike-results.md. "borrowed" is a new,
            # third handle_kind this spike adds precisely for this shape: store the raw
            # pointer, never copy or delete the pointee.
            "ifcopenshell::declaration": "borrowed",
            "ifcopenshell::type_declaration": "borrowed",
            "ifcopenshell::select_type": "borrowed",
            "ifcopenshell::enumeration_type": "borrowed",
            "ifcopenshell::entity": "borrowed",
            "ifcopenshell::attribute": "borrowed",
            "ifcopenshell::inverse_attribute": "borrowed",
            "ifcopenshell::schema_definition": "borrowed",
            "ifcopenshell::parameter_type": "borrowed",
            "ifcopenshell::named_type": "borrowed",
            "ifcopenshell::simple_type": "borrowed",
            "ifcopenshell::aggregation_type": "borrowed",
        },
        class_owner_types={
            "express::base": "ifcopenshell::file",
            "express::entity": "ifcopenshell::file",
            "express::select": "ifcopenshell::file",
        },
        type_adapters={
            "std::string": "string",
            "int": "integer",
            "size_t": "integer",
            "std::size_t": "integer",
            "unsigned int": "integer",
            "uint32_t": "integer",
            "bool": "bool",
            "void": "void",
            # The buffer-based file-open constructor's `void* data` parameter (the real
            # `ifcopenshell::file(void* data, int data_size, ...)` ctor in file.h already
            # supports this -- wrappergen just wasn't pointed at it before this spike, per
            # `10-architecture.md` SS3's fallback condition). The paired length is the
            # existing, ordinary `int data_size` parameter right after it -- no separate
            # length-carrying mechanism is needed.
            "void*": "buffer",
        },
        ignore=IgnoreConfig(
            namespaces=["ifcopenshell::impl"],
            # `ifcopenshell::logger` has a deleted copy constructor and (because it likely
            # holds a non-movable member -- a mutex or similar -- for thread safety) an
            # implicitly-deleted move constructor too, which breaks the generic "wrap a
            # by-value handle" emission path shared by every class-returning method
            # (`_emit_handle_return_lines`'s `new {c_type}{ std::move(result) }` needs at
            # least a move constructor). Not needed for this spike's file/entity_instance/
            # declaration surface -- see `06-wrappergen-spike-results.md` for the
            # non-movable-value-type generator gap this surfaced.
            classes=[
                "ifcopenshell::log_message",
                # Storage-layer internals (`instance_data`'s own constructor takes an
                # `in_memory_attribute_storage&&`/`rocks_db_attribute_storage&&`
                # rvalue-reference parameter that `_cpp_argument`'s handle-argument
                # unwrapping can't satisfy -- another generic-pipeline gap this spike
                # found rather than something specific to file/entity_instance/
                # declaration, see `06-wrappergen-spike-results.md`) that this spike's
                # primitive surface has no need to expose directly.
                "ifcopenshell::instance_data",
                "ifcopenshell::rocks_db_attribute_storage",
            ],
            # These are the *real*, unmodified `express::base`/`express::entity` methods
            # this spike's variant adapter replaces -- both return the real
            # `ifcopenshell::attribute_value` (instance_data.h), which clang discovers as an
            # ordinary (mostly useless, since its accessors are C++ implicit-conversion
            # operators clang_frontend.py doesn't discover -- see research/01 SS5) handle
            # class. Left in, these would collide on the `get_attribute_value` py_name with
            # this spike's injected variant-adapter methods of the same name.
            methods=[
                "express::base::get_attribute_value",
                "express::entity::get",
                # `ifcopenshell::logger` has a deleted copy constructor and (likely because
                # it holds a non-movable member -- a mutex or similar -- for thread safety)
                # an implicitly-deleted move constructor too, which breaks the generic
                # "wrap a by-value handle" emission path shared by every class-returning
                # method (`_emit_handle_return_lines`'s `new {c_type}{ std::move(result) }`
                # needs at least a move constructor). Only `file::logger()` (a method that
                # *returns* one) hits this -- `logger` still needs to stay a resolvable
                # *parameter* type, since every `file` constructor takes an optional
                # trailing `logger&` and dereferencing an existing handle for a parameter
                # never needs to move/copy it. See `06-wrappergen-spike-results.md` for the
                # non-movable-value-type generator gap this surfaced.
                "ifcopenshell::file::logger",
                "ifcopenshell::spf_header::logger",
            ],
            # `logger` must stay resolvable as a *parameter* type (see above), but its own
            # constructors hit the same non-movable-value-type gap as the methods above --
            # `ignore.methods` can't suppress constructors, hence this separate list.
            no_constructors=["ifcopenshell::logger"],
        ),
        compilation=CompilationConfig(
            headers=headers,
            include_dirs=include_dirs,
            clang_args=["-x", "c++", "-std=c++17", *_ROCKSDB_HEADER_ORDERING_WORKAROUND],
        ),
    )


def _case(kind_name: str, field: str, field_kind: str, handle_target: str | None = None) -> VariantCaseModel:
    return VariantCaseModel(
        kind_name=kind_name,
        kind_c_name=f"IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_{kind_name}",
        native_kind_name=f"ifcopenshell::wrappergen::ATTRIBUTE_VALUE_KIND_{kind_name}",
        field=field,
        field_kind=field_kind,
        handle_target=handle_target,
    )


def _attribute_value_variant_model() -> VariantAdapterModel:
    return VariantAdapterModel(
        cpp_type="ifcopenshell::wrappergen::attribute_value_variant",
        # Not `ifcopenshell_attribute_value_t` -- `express::base::get_attribute_value()`
        # (the real, unmodified `ifcparse` method) is independently discovered by clang
        # as an ordinary handle-returning method (it returns `ifcopenshell::attribute_value`,
        # a legitimate, if not very useful without its C++ implicit-conversion-operator
        # accessors -- see `_shim_ignored_methods` below), which would otherwise claim the
        # same generated C type name. A real naming-collision finding from this spike; see
        # `06-wrappergen-spike-results.md`.
        c_type_name="ifcopenshell_attribute_value_variant_t",
        kind_enum_c_name="ifcopenshell_attribute_value_kind_t",
        kind_field="kind",
        cases=[
            _case("NULL", "integer_value", "integer"),
            _case("BOOL", "integer_value", "integer"),
            _case("LOGICAL", "logical_value", "integer"),
            _case("INTEGER", "integer_value", "integer"),
            _case("DOUBLE", "double_value", "double"),
            _case("STRING", "string_value", "string"),
            _case("ENUMERATION", "string_value", "string"),
            _case("ENTITY_INSTANCE", "entity_value", "handle", handle_target="express::base"),
        ],
    )


def _inject_attribute_value_accessors(model, variant_adapter: VariantAdapterModel) -> None:
    """Appends the two hand-written accessor functions
    (`src/wrappergen/shim/attribute_value_shim.h`) as `free_function`-kind
    `CallableModel`s on the `express::base` class. These can't be discovered by
    the clang frontend as ordinary methods -- see
    `06-wrappergen-spike-results.md` for why -- so, like `class_owner_types`/
    `class_handle_kinds`, this is config-declared rather than discovered,
    mirroring how `IfcParseWrapper.i`'s equivalent glue is hand-written too.
    """
    entity_instance = next(class_model for class_model in model.classes if class_model.cpp_name == "express::base")
    variant_adapter_name = f"variant:{variant_adapter.cpp_type}"

    get_value = CallableModel(
        kind="free_function",
        owner_cpp_name=entity_instance.cpp_name,
        owner_py_name=entity_instance.py_name,
        cpp_name="ifcopenshell::wrappergen::get_attribute_value_variant",
        py_name="get_attribute_value",
        c_name="get_attribute_value_variant",
        return_cpp_type=variant_adapter.cpp_type,
        return_adapter=variant_adapter_name,
        parameters=[
            ParameterModel(name="attribute_index", cpp_name="attribute_index", cpp_type="int", adapter="integer"),
        ],
    )
    set_value = CallableModel(
        kind="free_function",
        owner_cpp_name=entity_instance.cpp_name,
        owner_py_name=entity_instance.py_name,
        cpp_name="ifcopenshell::wrappergen::set_attribute_value_variant",
        py_name="set_attribute_value",
        c_name="set_attribute_value_variant",
        return_cpp_type="void",
        return_adapter="void",
        parameters=[
            ParameterModel(name="attribute_index", cpp_name="attribute_index", cpp_type="int", adapter="integer"),
            ParameterModel(
                name="value", cpp_name="value", cpp_type=variant_adapter.cpp_type, adapter=variant_adapter_name
            ),
        ],
    )
    entity_instance.callables.extend([get_value, set_value])


def build_napi_spike_model(repo_root: Path):
    config = build_napi_spike_config(repo_root)
    model = build_module_model(config)
    variant_adapter = _attribute_value_variant_model()
    model.variant_adapters.append(variant_adapter)
    _inject_attribute_value_accessors(model, variant_adapter)
    # `get_attribute_value_variant`/`set_attribute_value_variant` aren't discovered from
    # any clang cursor (they're config-injected, see `_inject_attribute_value_accessors`),
    # so `build_module_model`'s `source_headers` computation -- which only walks *discovered*
    # classes' cursor locations -- never has a reason to include the shim header that
    # declares them. Add it explicitly so `emit_c_api_implementation` `#include`s it.
    if "attribute_value_shim.h" not in model.source_headers:
        model.source_headers.append("attribute_value_shim.h")
    return model


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=str(Path(__file__).resolve().parents[2]))
    parser.add_argument("--output-dir", default=str(Path(__file__).resolve().parent / "napi_spike_generated"))
    return parser.parse_args()


def main() -> int:
    arguments = parse_args()
    repo_root = Path(arguments.repo_root).resolve()
    output_dir = Path(arguments.output_dir).resolve()
    model = build_napi_spike_model(repo_root)

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / model.api_header_name).write_text(emit_c_api_header(model), encoding="utf-8")
    (output_dir / model.api_implementation_name).write_text(emit_c_api_implementation(model), encoding="utf-8")
    (output_dir / model.extension_source_name).write_text(emit_napi_extension(model), encoding="utf-8")
    (output_dir / "ifcopenshell_napi_spike.ts").write_text(emit_typescript_facade(model), encoding="utf-8")

    print(f"Generated {len(model.classes)} classes, {sum(len(c.callables) for c in model.classes)} callables")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
