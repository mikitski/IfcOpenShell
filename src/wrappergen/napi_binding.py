# This file was generated with the assistance of an AI coding tool.

"""Entry point for IfcOpenShell-TS's Phase 1 primitive binding
(planning/ifcopenshell-ts/20-roadmap.md's Phase 1, planning/ifcopenshell-ts/
research/06-wrappergen-spike-results.md).

This supersedes `napi_spike.py`'s scope in every way that matters: the spike deliberately
narrowed the variant adapter to 7 of the ~15 `ifcopenshell::argument_type` cases (no
BINARY, no aggregates) and only *verified* file/entity_instance/declaration end-to-end,
even though its `WrapperConfig` already pointed clang at the full `src/ifcparse/*.h`
header set. This module:

- Completes the variant adapter (`attribute_value_shim.h`/`.cpp`): BINARY plus a single,
  generic, recursive `AGGREGATE` case that covers every `AGGREGATE_OF_*`/
  `AGGREGATE_OF_AGGREGATE_OF_*`/`EMPTY_AGGREGATE` case in one mechanism -- see
  `attribute_value_shim.h`'s doc comment for why one case suffices instead of one per
  element type.
- Injects the full `entity_instance` (`express::base`) primitive surface that only
  exists today as SWIG `%extend` glue in `src/ifcwrap/IfcParseWrapper.i`, not as real
  C++ methods clang can discover: `get_argument_index`, `attribute_name`,
  `attribute_type`, `get_attribute_category`, `is_a`, plus `attribute_kind_of` (the
  SET-side ergonomic helper research/06 SS2.4 designed) and `get_all_attribute_values`
  (the bulk fetch standing in for Python's fully-recursive `get_info_cpp` -- see
  `attribute_value_shim.h`'s doc comment for the disclosed scope of that stand-in).
- Points at the real, full `src/ifcparse/*.h` header set (already true of the spike's
  config, carried over here) -- `entity`/`attribute`/`inverse_attribute`/
  `schema_definition`/the `parameter_type` hierarchy/`type_declaration`/
  `enumeration_type`/`select_type` are all clang-discovered generically, not
  hand-listed; `class_handle_kinds` below only needs to override the ones whose
  *ownership* isn't the generic "value" default.

Generated output goes to `src/wrappergen/generated_napi/` (checked in, like the
existing `generated/` and `napi_spike_generated/` snapshots) -- see that directory's
own note on why this is checked-in rather than generated at CI/build time.
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
    from wrappergen.model import (
        AsyncVariantModel,
        CallableModel,
        ParameterModel,
        VariantAdapterModel,
        VariantCaseModel,
    )
else:
    from .clang_frontend import build_module_model
    from .config import CompilationConfig, IgnoreConfig, WrapperConfig
    from .emit import emit_c_api_header, emit_c_api_implementation, emit_napi_extension, emit_typescript_facade
    from .model import AsyncVariantModel, CallableModel, ParameterModel, VariantAdapterModel, VariantCaseModel

# See `napi_spike.py`'s identical constant for the full rationale: a real, pre-existing
# `src/ifcparse/rocksdb_map_adapter.h` header-hygiene bug (missing `<vector>`/
# `<string>`/`<sstream>` includes), independent of wrappergen, filed as a follow-up
# rather than fixed here (out of this PR's `src/wrappergen/`-only scope).
_ROCKSDB_HEADER_ORDERING_WORKAROUND = ["-include", "vector", "-include", "string", "-include", "sstream"]


def build_napi_binding_config(repo_root: Path) -> WrapperConfig:
    src_ifcparse = repo_root / "src" / "ifcparse"
    shim_header = repo_root / "src" / "wrappergen" / "shim" / "attribute_value_shim.h"
    file_shim_header = repo_root / "src" / "wrappergen" / "shim" / "file_shim.h"
    headers = [str(path.resolve()) for path in sorted(src_ifcparse.glob("*.h")) if path.parent.name != "schemas"]
    headers = [header for header in headers if not header.endswith(("rocksdb_map_adapter.h", "rocksdb_set_view.h"))]
    headers.append(str(shim_header.resolve()))
    headers.append(str(file_shim_header.resolve()))

    include_dirs = [str(src_ifcparse.resolve())]

    return WrapperConfig(
        module_name="ifcopenshell_native",
        c_prefix="ifcopenshell",
        api_header_name="ifcopenshell_native_c_api.h",
        api_implementation_name="ifcopenshell_native_c_api.cpp",
        extension_source_name="ifcopenshell_native.cpp",
        python_source_name="ifcopenshell_native_unused.py",
        allowed_namespaces=["ifcopenshell", "express"],
        enum_names={"ifcopenshell::filetype": "FileType"},
        # See `napi_spike.py`'s identical entry: `express::entity` (a `base` narrowed to
        # "definitely an ENTITY_INSTANCE") would otherwise collide 1:1 on the py_name
        # "entity" with the unrelated `ifcopenshell::entity` schema-declaration class.
        class_names={"express::base": "entity_instance", "express::entity": "typed_entity_instance"},
        parameter_names={"type": "filetype", "read_only": "readonly"},
        class_handle_kinds={
            "ifcopenshell::file": "shared_ptr",
            # Every one of these is a long-lived object owned by the process-wide
            # schema-registry singleton (`Ifc4::get_schema()` etc.), reached only by raw
            # pointer, and never safe to copy-by-value through the generic "value"
            # handle_kind (research/06-wrappergen-spike-results.md SS3.5's confirmed
            # double-free/use-after-free finding -- `schema_definition`'s and several
            # siblings' destructors `delete` pointers they assume they alone own).
            # Verified per-class, not copy-pasted blind: every one of these types is
            # reached exclusively through `schema_definition`'s owned vectors (or, for
            # `attribute`/`inverse_attribute`, through `entity`'s owned vectors) --
            # none has a public, non-deleted constructor this generator would ever call
            # to independently allocate a *new*, generator-owned instance (the
            # constructors clang discovers for them are used internally by the schema
            # *building* code, `ifcparse`'s own `.cpp`, not by anything this addon
            # exposes as a primitive) -- so "borrowed" (raw pointer, no copy, no delete)
            # is the correct ownership model for all of them, not just a convenient
            # default.
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
        # Native memory accounting for V8's GC (planning/ifcopenshell-ts/10-architecture.md's
        # "Native object lifetime" section, `20-roadmap.md`'s "Native memory accounting" Phase
        # 1 task) -- a per-class hint, in bytes, of how much off-heap memory each class's JS
        # wrapper represents, reported via `napi_adjust_external_memory` (`emit.py`'s
        # `_native_memory_size_hint`/wrap+finalizer emission). Only `ifcopenshell::file` is
        # overridden here: it owns an entire parsed IFC model (every entity, attribute value,
        # and string in the file), whose real size is unknowable from this generator's side --
        # it depends entirely on the specific file opened, from empty to hundreds of MB, and
        # nothing in the C++ API exposes a byte-accurate "how much memory does this model use"
        # query for the generator to call. 1 MiB is a deliberately coarse, documented
        # order-of-magnitude stand-in (real-world parsed models commonly land in the single-
        # to double-digit-MB range): the goal is giving V8's GC *some* signal that a `file`
        # handle is meaningfully heavier than an ordinary small wrapper, not billing it
        # precisely -- V8's own docs describe this API as a GC-pressure hint, not a precise
        # accounting requirement. Every other class either keeps `WrapperConfig`'s generic
        # 64-byte default (small metadata/handle wrapper objects -- e.g. `entity_instance`
        # itself only stores a pointer/index into data actually owned by its `file`, per
        # `class_owner_types` above) or is `"borrowed"` handle_kind (schema-registry-owned
        # singletons; `emit.py` accounts only for their tiny wrapper struct, never the
        # singleton's own memory -- see `_native_memory_size_hint`'s doc comment).
        class_native_size_hints={
            "ifcopenshell::file": 1024 * 1024,
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
            # The buffer-based file-open constructor's `void* data` parameter -- see
            # `research/06-wrappergen-spike-results.md` SS1 item 2.
            "void*": "buffer",
        },
        ignore=IgnoreConfig(
            namespaces=["ifcopenshell::impl"],
            classes=[
                "ifcopenshell::log_message",
                "ifcopenshell::instance_data",
                "ifcopenshell::rocks_db_attribute_storage",
            ],
            methods=[
                # The real, unmodified `express::base`/`express::entity` methods this
                # config's injected variant adapter (`_inject_entity_instance_primitives`
                # below) replaces -- both return the real `ifcopenshell::attribute_value`
                # (instance_data.h), which clang discovers as an ordinary (mostly
                # useless -- its accessors are C++ implicit-conversion operators clang
                # doesn't discover, research/01 SS5) handle class. Left in, these would
                # collide on the `get_attribute_value` py_name with the injected methods
                # of the same name.
                "express::base::get_attribute_value",
                "express::entity::get",
                # `ifcopenshell::logger` has a deleted copy constructor and an
                # implicitly-deleted move constructor (see `no_constructors` below) --
                # breaks the generic "wrap a by-value handle" emission path shared by
                # every class-returning method. Only `file::logger()`/
                # `spf_header::logger()` (methods that *return* one) hit this -- `logger`
                # still needs to stay a resolvable *parameter* type, since every `file`
                # constructor takes an optional trailing `logger&`.
                "ifcopenshell::file::logger",
                "ifcopenshell::spf_header::logger",
            ],
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
    """The full ~15-way `ifcopenshell::argument_type` dispatch
    (research/01-python-core-and-lowlevel.md SS5), completing the spike's 7-case subset:
    BINARY (reusing the STRING case's field -- a string of '0'/'1' characters, matching
    `ifcopenshell::valid_binary_string`'s own textual convention) and the single,
    generic, recursive AGGREGATE case (a "sequence" field_kind -- see
    `attribute_value_shim.h`'s class doc comment) covering every
    `AGGREGATE_OF_*`/`AGGREGATE_OF_AGGREGATE_OF_*`/`EMPTY_AGGREGATE` case in one
    mechanism instead of one adapter case per element type.
    """
    return VariantAdapterModel(
        cpp_type="ifcopenshell::wrappergen::attribute_value_variant",
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
            _case("BINARY", "string_value", "string"),
            _case("AGGREGATE", "aggregate_value", "sequence"),
        ],
    )


def _free_function(
    entity_instance,
    cpp_name: str,
    py_name: str,
    c_name: str,
    parameters: list[ParameterModel],
    return_cpp_type: str = "void",
    return_adapter: str = "void",
) -> CallableModel:
    return CallableModel(
        kind="free_function",
        owner_cpp_name=entity_instance.cpp_name,
        owner_py_name=entity_instance.py_name,
        cpp_name=cpp_name,
        py_name=py_name,
        c_name=c_name,
        return_cpp_type=return_cpp_type,
        return_adapter=return_adapter,
        parameters=parameters,
    )


def _inject_entity_instance_primitives(model, variant_adapter: VariantAdapterModel) -> None:
    """Appends every `entity_instance` (`express::base`) primitive that only exists as
    SWIG `%extend` glue today (research/01-python-core-and-lowlevel.md SS5 point 3), as
    `free_function`-kind `CallableModel`s -- the same technique
    `napi_spike.py`/`research/06` already established for
    `get_attribute_value_variant`/`set_attribute_value_variant`, extended to the rest of
    the entity_instance surface `attribute_value_shim.h`/`.cpp` now also implements:
    `attribute_kind_of`, `get_argument_index`, `attribute_name`, `attribute_type`,
    `get_attribute_category`, `is_a`, `get_all_attribute_values`.

    Deliberately NOT injected here (disclosed scope cut, not an oversight):
    `get_attribute_names`/`get_inverse_attribute_names` (`std::vector<std::string>`
    returns) -- doing so would need a third new adapter kind ("sequence of scalar",
    distinct from both `sequence:` (sequence of class handle) and the
    `sequence_of_variant:` adapter this PR already adds) purely for enumerating
    attribute *names* in bulk. The *capability* is not missing: `entity_attribute_count`
    + `attribute_name(index)` (an ordinary, already-working `attribute` class method) or
    this module's own `get_argument_index`/`base_attribute_name`-equivalent already let a
    caller enumerate every attribute name one at a time -- just not in a single bulk
    call. Left for a follow-up alongside the "sequence of variant" mechanism this PR
    does add for `get_all_attribute_values`.
    """
    entity_instance = next(class_model for class_model in model.classes if class_model.cpp_name == "express::base")
    variant_adapter_name = f"variant:{variant_adapter.cpp_type}"
    sequence_of_variant_adapter_name = f"sequence_of_variant:{variant_adapter.cpp_type}"

    index_parameter = ParameterModel(
        name="attribute_index", cpp_name="attribute_index", cpp_type="int", adapter="integer"
    )
    name_parameter = ParameterModel(name="name", cpp_name="name", cpp_type="std::string", adapter="string")

    get_value = _free_function(
        entity_instance,
        "ifcopenshell::wrappergen::get_attribute_value_variant",
        "get_attribute_value",
        "get_attribute_value_variant",
        [index_parameter],
        return_cpp_type=variant_adapter.cpp_type,
        return_adapter=variant_adapter_name,
    )
    set_value = _free_function(
        entity_instance,
        "ifcopenshell::wrappergen::set_attribute_value_variant",
        "set_attribute_value",
        "set_attribute_value_variant",
        [
            index_parameter,
            ParameterModel(
                name="value", cpp_name="value", cpp_type=variant_adapter.cpp_type, adapter=variant_adapter_name
            ),
        ],
    )
    attribute_kind_of = _free_function(
        entity_instance,
        "ifcopenshell::wrappergen::attribute_kind_of",
        "attribute_kind_of",
        "attribute_kind_of",
        [index_parameter],
        return_cpp_type="int",
        return_adapter="integer",
    )
    get_argument_index = _free_function(
        entity_instance,
        "ifcopenshell::wrappergen::get_argument_index",
        "get_argument_index",
        "get_argument_index",
        [name_parameter],
        return_cpp_type="int",
        return_adapter="integer",
    )
    attribute_name = _free_function(
        entity_instance,
        "ifcopenshell::wrappergen::get_attribute_name",
        "attribute_name",
        "attribute_name",
        [index_parameter],
        return_cpp_type="std::string",
        return_adapter="string",
    )
    attribute_type = _free_function(
        entity_instance,
        "ifcopenshell::wrappergen::get_attribute_type_name",
        "attribute_type",
        "attribute_type",
        [index_parameter],
        return_cpp_type="std::string",
        return_adapter="string",
    )
    get_attribute_category = _free_function(
        entity_instance,
        "ifcopenshell::wrappergen::get_attribute_category",
        "get_attribute_category",
        "get_attribute_category",
        [name_parameter],
        return_cpp_type="int",
        return_adapter="integer",
    )
    is_a = _free_function(
        entity_instance,
        "ifcopenshell::wrappergen::is_a",
        "is_a",
        "is_a",
        [name_parameter],
        return_cpp_type="bool",
        return_adapter="bool",
    )
    get_all_attribute_values = _free_function(
        entity_instance,
        "ifcopenshell::wrappergen::get_all_attribute_values",
        "get_all_attribute_values",
        "get_all_attribute_values",
        [],
        return_cpp_type=f"std::vector<{variant_adapter.cpp_type}>",
        return_adapter=sequence_of_variant_adapter_name,
    )

    entity_instance.callables.extend(
        [
            get_value,
            set_value,
            attribute_kind_of,
            get_argument_index,
            attribute_name,
            attribute_type,
            get_attribute_category,
            is_a,
            get_all_attribute_values,
        ]
    )


def _inject_file_primitives(model) -> None:
    """Appends the one `ifcopenshell::file`-level primitive this PR's async work needs
    that only exists as SWIG `%extend` glue today (`file_shim.h`/`.cpp`'s `write_file`,
    TODOS.md's "Phase 1 primitive binding" gap #2): `write`. Same injection technique
    `_inject_entity_instance_primitives` already established for `express::base`.
    """
    file_class = next(class_model for class_model in model.classes if class_model.cpp_name == "ifcopenshell::file")
    path_parameter = ParameterModel(name="path", cpp_name="path", cpp_type="std::string", adapter="string")
    write = _free_function(
        file_class,
        "ifcopenshell::wrappergen::write_file",
        "write",
        "write",
        [path_parameter],
    )
    file_class.callables.append(write)


def _inject_async_variants(model) -> None:
    """The three primitives planning/ifcopenshell-ts/10-architecture.md's "Async story"
    section names as needing a `napi_create_async_work`-based sibling alongside their
    sync counterpart: file open/parse (path- and buffer-based), the bulk
    `get_all_attribute_values` serializer, and `write` (see `_inject_file_primitives`
    above for the sync primitive this last one needed first). Each entry names an
    already-emitted sync `CallableVariant` by its `api_name` -- resolved back to its full
    signature by `emit.py`'s `_variant_by_api_name` at emission time -- plus where/how the
    TS facade should additionally expose it.

    File open only gets an async sibling for its *minimal*-arity sync entry point
    (`file_new_with_path`/`file_new_with_data_data_size`, i.e. no explicit filetype/
    readonly/logger) -- the same disclosed, bounded scope the sync facade's own
    constructors already have (TODOS.md gap #4: the TS facade doesn't support C++
    default-argument parameters, so only the maximal-arity overload of each constructor
    family gets a class-level convenience method; the minimal-arity ones are only
    reachable via the raw `native.*` function either way). Extending async file-open to
    the fuller-arity overloads is the same bounded follow-up as that existing gap, not a
    new one this PR introduces.
    """
    model.async_variants.extend(
        [
            AsyncVariantModel(
                sync_api_name="file_new_with_path",
                async_api_name="file_new_with_path_async",
                ts_owner_py_name="file",
                ts_method_name="open_path_async",
                ts_is_static=True,
            ),
            AsyncVariantModel(
                sync_api_name="file_new_with_data_data_size",
                async_api_name="file_new_with_data_data_size_async",
                ts_owner_py_name="file",
                ts_method_name="open_buffer_async",
                ts_is_static=True,
            ),
            AsyncVariantModel(
                sync_api_name="base_get_all_attribute_values",
                async_api_name="base_get_all_attribute_values_async",
                ts_owner_py_name="entity_instance",
                ts_method_name="get_all_attribute_values_async",
                ts_is_static=False,
            ),
            AsyncVariantModel(
                sync_api_name="file_write",
                async_api_name="file_write_async",
                ts_owner_py_name="file",
                ts_method_name="write_async",
                ts_is_static=False,
            ),
        ]
    )


def build_napi_binding_model(repo_root: Path):
    config = build_napi_binding_config(repo_root)
    model = build_module_model(config)
    variant_adapter = _attribute_value_variant_model()
    model.variant_adapters.append(variant_adapter)
    _inject_entity_instance_primitives(model, variant_adapter)
    _inject_file_primitives(model)
    _inject_async_variants(model)
    # The injected free functions above aren't discovered from any clang cursor, so
    # `build_module_model`'s `source_headers` computation (which only walks
    # *discovered* classes' cursor locations) never has a reason to include the shim
    # header that declares them -- see `napi_spike.py`'s identical fix.
    if "attribute_value_shim.h" not in model.source_headers:
        model.source_headers.append("attribute_value_shim.h")
    if "file_shim.h" not in model.source_headers:
        model.source_headers.append("file_shim.h")
    return model


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=str(Path(__file__).resolve().parents[2]))
    parser.add_argument("--output-dir", default=str(Path(__file__).resolve().parent / "generated_napi"))
    return parser.parse_args()


def main() -> int:
    arguments = parse_args()
    repo_root = Path(arguments.repo_root).resolve()
    output_dir = Path(arguments.output_dir).resolve()
    model = build_napi_binding_model(repo_root)

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / model.api_header_name).write_text(emit_c_api_header(model), encoding="utf-8")
    (output_dir / model.api_implementation_name).write_text(emit_c_api_implementation(model), encoding="utf-8")
    (output_dir / model.extension_source_name).write_text(emit_napi_extension(model), encoding="utf-8")
    (output_dir / "ifcopenshell_native.ts").write_text(emit_typescript_facade(model), encoding="utf-8")

    print(f"Generated {len(model.classes)} classes, {sum(len(c.callables) for c in model.classes)} callables")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
