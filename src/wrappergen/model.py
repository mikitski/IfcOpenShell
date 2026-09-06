from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class ParameterModel:
    name: str
    cpp_name: str
    cpp_type: str
    adapter: str
    has_default: bool = False
    default_cpp_value: str | None = None
    default_python_value: str | None = None


@dataclass(slots=True)
class CallableModel:
    kind: str
    owner_cpp_name: str
    owner_py_name: str
    cpp_name: str
    py_name: str
    c_name: str
    return_cpp_type: str
    return_adapter: str
    parameters: list[ParameterModel] = field(default_factory=list)

    @property
    def minimum_arity(self) -> int:
        defaults = 0
        for parameter in reversed(self.parameters):
            if not parameter.has_default:
                break
            defaults += 1
        return len(self.parameters) - defaults


@dataclass(slots=True)
class EnumValueModel:
    name: str
    c_name: str
    value: int


@dataclass(slots=True)
class EnumModel:
    cpp_name: str
    py_name: str
    c_name: str
    values: list[EnumValueModel]


@dataclass(slots=True)
class ClassModel:
    cpp_name: str
    py_name: str
    handle_kind: str
    owner_cpp_name: str | None = None
    owner_py_name: str | None = None
    callables: list[CallableModel] = field(default_factory=list)


@dataclass(slots=True)
class VariantCaseModel:
    """One case of a "variant" adapter's tagged union.

    ``field_kind`` is one of ``"integer"``, ``"double"``, ``"bool"``, ``"string"``
    or ``"handle"`` (in which case ``handle_target`` names the target class, e.g.
    ``"express::base"``) -- the same small vocabulary of primitive shapes the
    rest of the adapter system already understands, just picked per-case by a
    runtime discriminant instead of by the static C++ type of a whole
    parameter/return value.
    """

    kind_name: str
    kind_c_name: str
    # The qualified C++-side enum constant (e.g.
    # "ifcopenshell::wrappergen::ATTRIBUTE_VALUE_KIND_BOOL") that the *native* shim type's
    # `kind` field actually holds -- deliberately a separate name from `kind_c_name` (the
    # *generated* C enum constant): these are two distinct enum types with independently
    # matching integer values, and comparing/switching on one using the other's named
    # constants compiles (by accident, via implicit conversion) but is exactly the kind of
    # thing that silently breaks the moment the two enums' value assignment ever drifts.
    # `emit.py` switches on `native_result.kind` using this name, and only converts to
    # `kind_c_name` at the point of assigning into the generated C struct.
    native_kind_name: str
    field: str
    field_kind: str
    handle_target: str | None = None


@dataclass(slots=True)
class VariantAdapterModel:
    """A config-declared tagged-union type (research/04-wasm-js-infra.md SS1.2's
    "the real gap"): unlike every other adapter kind, this is never discovered
    from a clang cursor -- the real C++ attribute-value representation
    (``ifcopenshell::attribute_value``) has no discriminant of its own, so the
    shape is supplied by hand (mirroring the shim type in
    ``src/wrappergen/shim/attribute_value_shim.h`` that a variant adapter's
    ``cpp_type`` points at) and threaded through the same C-API/N-API/TS
    emission pipeline every other adapter uses.
    """

    cpp_type: str
    c_type_name: str
    kind_enum_c_name: str
    kind_field: str
    cases: list[VariantCaseModel]


@dataclass(slots=True)
class AsyncVariantModel:
    """Marks one already-emitted, ordinary *synchronous* N-API entry point (identified
    by the `CallableVariant.api_name` it was emitted under, e.g. ``"file_new_with_path"``)
    as also needing a Promise-based async sibling
    (planning/ifcopenshell-ts/10-architecture.md's "Async story": a synchronous N-API call
    blocks Node's *entire* event loop, not one thread, so the primitives that can be slow
    on a large/untrusted file -- file open/parse, the bulk attribute-value serializer, and
    `write` -- need a `napi_create_async_work`-based variant alongside the sync one).

    Deliberately a short, hand-picked, explicit list assembled by `napi_binding.py`
    (`ModuleModel.async_variants`) rather than a generic "every callable gets an async
    twin" mechanism -- only the specific operations the architecture doc names as
    correctness-sensitive get one; everything else stays sync-only, matching how
    `napi_spike.py`/`napi_binding.py` already hand-picks which primitives get bound at
    all rather than exposing the full discovered surface uncurated.

    `sync_api_name` is resolved back to its full `CallableVariant` (owner class,
    parameters, return adapter) via `_variant_by_api_name` at emission time -- this model
    only needs to say *which* existing sync entry point to wrap and what to additionally
    call it/attach it as on the TS facade, not re-describe its signature.
    """

    sync_api_name: str
    async_api_name: str
    ts_owner_py_name: str
    ts_method_name: str
    ts_is_static: bool


@dataclass(slots=True)
class ModuleModel:
    module_name: str
    c_prefix: str
    api_header_name: str
    api_implementation_name: str
    extension_source_name: str
    python_source_name: str
    source_headers: list[str]
    classes: list[ClassModel]
    enums: list[EnumModel]
    variant_adapters: list[VariantAdapterModel] = field(default_factory=list)
    async_variants: list[AsyncVariantModel] = field(default_factory=list)
