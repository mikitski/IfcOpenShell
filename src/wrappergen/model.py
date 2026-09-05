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
