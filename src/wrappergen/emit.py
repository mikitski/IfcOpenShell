from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .conventions import (
    c_identifier_from_cpp_name,
    enum_adapter_target,
    handle_adapter_target,
    is_enum_adapter,
    is_handle_adapter,
    is_sequence_adapter,
    is_sequence_of_variant_adapter,
    is_variant_adapter,
    normalize_cpp_type,
    normalize_identifier,
    pascal_case,
    sequence_adapter_target,
    sequence_of_variant_adapter_target,
    variant_adapter_target,
)
from .model import (
    CallableModel,
    ClassModel,
    EnumModel,
    ModuleModel,
    ParameterModel,
    VariantAdapterModel,
    VariantCaseModel,
)


def _class_index(model: ModuleModel) -> dict[str, ClassModel]:
    return {normalize_cpp_type(class_model.cpp_name): class_model for class_model in model.classes}


def _enum_index(model: ModuleModel) -> dict[str, EnumModel]:
    return {normalize_cpp_type(enum_model.cpp_name): enum_model for enum_model in model.enums}


def _variant_index(model: ModuleModel) -> dict[str, VariantAdapterModel]:
    return {normalize_cpp_type(variant.cpp_type): variant for variant in model.variant_adapters}


def _variant_model(adapter: str, model: ModuleModel) -> VariantAdapterModel:
    variant = _variant_index(model).get(variant_adapter_target(adapter))
    if variant is None:
        raise RuntimeError(f"Unable to resolve variant adapter '{adapter}'")
    return variant


def _sequence_of_variant_model(adapter: str, model: ModuleModel) -> VariantAdapterModel:
    variant = _variant_index(model).get(sequence_of_variant_adapter_target(adapter))
    if variant is None:
        raise RuntimeError(f"Unable to resolve sequence-of-variant adapter '{adapter}'")
    return variant


def _variant_type_base(variant_model: VariantAdapterModel) -> str:
    base = variant_model.c_type_name
    return base[: -len("_t")] if base.endswith("_t") else base


def _variant_list_c_type(variant_model: VariantAdapterModel) -> str:
    return f"{_variant_type_base(variant_model)}_list_t"


def _variant_list_free_name(variant_model: VariantAdapterModel) -> str:
    return f"{_variant_type_base(variant_model)}_list_free"


def _variant_free_contents_name(variant_model: VariantAdapterModel) -> str:
    return f"{_variant_type_base(variant_model)}_free_contents"


def _variant_from_native_name(variant_model: VariantAdapterModel) -> str:
    """`{cpp_type} -> {c_type}`: the GET/return direction (native shim value in, C-ABI
    struct out) -- named for its *input*, mirroring `_variant_to_native_name` below."""
    return f"{_variant_type_base(variant_model)}_from_native"


def _variant_to_native_name(variant_model: VariantAdapterModel) -> str:
    """`{c_type} -> {cpp_type}`: the SET/parameter direction (C-ABI struct in, native
    shim value out) -- named for its *output*."""
    return f"{_variant_type_base(variant_model)}_to_native"


def _variant_owner_case(variant_model: VariantAdapterModel, model: ModuleModel) -> VariantCaseModel | None:
    """The (at most one, today) `field_kind == "handle"` case whose target class
    declares an owner -- e.g. `ENTITY_INSTANCE` -> `express::base`, owned by
    `ifcopenshell::file`. `_variant_from_native_name`'s emitted function needs
    an owner parameter of that type so a returned entity-reference handle
    (however deeply nested inside an AGGREGATE case) is tied to the same owning
    `file` as every other handle this generator emits -- exactly the
    `_owner_expression` propagation ordinary handle/sequence returns already do.
    """
    for case in variant_model.cases:
        if case.field_kind == "handle":
            target = _class_index(model)[case.handle_target]
            if target.owner_cpp_name is not None:
                return case
    return None


def _class_c_type(class_model: ClassModel, model: ModuleModel) -> str:
    return f"{model.c_prefix}_{_class_c_identifier(class_model, model)}_t"


def _list_c_type(class_model: ClassModel, model: ModuleModel) -> str:
    return f"{model.c_prefix}_{_class_c_identifier(class_model, model)}_list_t"


def _class_c_identifier(class_model: ClassModel, model: ModuleModel) -> str:
    return c_identifier_from_cpp_name(class_model.cpp_name, model.c_prefix)


def _capsule_name_symbol(class_model: ClassModel) -> str:
    return f"{normalize_identifier(class_model.cpp_name).upper()}_CAPSULE_NAME"


def _capsule_destructor_name(class_model: ClassModel) -> str:
    return f"{normalize_identifier(class_model.cpp_name)}_capsule_destructor"


def _parameter_names(parameters: list[ParameterModel]) -> str:
    return "_".join(normalize_identifier(parameter.name) for parameter in parameters)


def _api_owner_identifier(owner: ClassModel) -> str:
    root_namespace = owner.cpp_name.split("::", 1)[0] if "::" in owner.cpp_name else None
    return c_identifier_from_cpp_name(owner.cpp_name, root_namespace)


@dataclass(slots=True)
class CallableVariant:
    owner: ClassModel
    callable: CallableModel
    api_name: str
    parameters: list[ParameterModel]


def _expand_variants(owner: ClassModel, callable_model: CallableModel) -> list[CallableVariant]:
    required = callable_model.minimum_arity
    variants: list[CallableVariant] = []
    for arity in range(required, len(callable_model.parameters) + 1):
        included = callable_model.parameters[:arity]
        api_name = f"{_api_owner_identifier(owner)}_{callable_model.c_name}"
        if callable_model.kind == "constructor":
            required_parameters = callable_model.parameters[:required]
            optional_parameters = callable_model.parameters[required:arity]
            if required_parameters:
                api_name += f"_with_{_parameter_names(required_parameters)}"
            if optional_parameters:
                api_name += f"_with_{_parameter_names(optional_parameters)}"
        elif required < len(callable_model.parameters):
            optional_parameters = callable_model.parameters[required:arity]
            if optional_parameters:
                api_name += f"_with_{_parameter_names(optional_parameters)}"
        variants.append(
            CallableVariant(
                owner=owner,
                callable=callable_model,
                api_name=api_name,
                parameters=included,
            )
        )
    return variants or [
        CallableVariant(
            owner=owner,
            callable=callable_model,
            api_name=f"{_api_owner_identifier(owner)}_{callable_model.c_name}",
            parameters=callable_model.parameters,
        )
    ]


def _all_variants(model: ModuleModel) -> list[CallableVariant]:
    variants: list[CallableVariant] = []
    for owner in model.classes:
        for callable_model in owner.callables:
            variants.extend(_expand_variants(owner, callable_model))
    return variants


def _full_variant(owner: ClassModel, callable_model: CallableModel) -> CallableVariant:
    return _expand_variants(owner, callable_model)[-1]


def _sequence_targets(model: ModuleModel) -> list[ClassModel]:
    class_models = _class_index(model)
    seen: set[str] = set()
    results: list[ClassModel] = []
    for owner in model.classes:
        for callable_model in owner.callables:
            if is_sequence_adapter(callable_model.return_adapter):
                target = sequence_adapter_target(callable_model.return_adapter)
                if target not in seen:
                    seen.add(target)
                    results.append(class_models[target])
    return results


def _sequence_of_variant_models(model: ModuleModel) -> list[VariantAdapterModel]:
    variant_models = _variant_index(model)
    seen: set[str] = set()
    results: list[VariantAdapterModel] = []
    for owner in model.classes:
        for callable_model in owner.callables:
            if is_sequence_of_variant_adapter(callable_model.return_adapter):
                target = sequence_of_variant_adapter_target(callable_model.return_adapter)
                if target not in seen:
                    seen.add(target)
                    results.append(variant_models[target])
    return results


def _enum_c_type(adapter: str, model: ModuleModel) -> str:
    enum_model = _enum_index(model).get(enum_adapter_target(adapter))
    if enum_model is None:
        raise RuntimeError(f"Unable to resolve enum adapter '{adapter}'")
    return enum_model.c_name


def _return_c_type(adapter: str, model: ModuleModel) -> str:
    if adapter == "string":
        return "char*"
    if adapter == "integer":
        return "int"
    if adapter == "bool":
        return "bool"
    if adapter == "void":
        return "void"
    if is_enum_adapter(adapter):
        return _enum_c_type(adapter, model)
    if is_handle_adapter(adapter):
        return f"{_class_c_type(_class_index(model)[handle_adapter_target(adapter)], model)}*"
    if is_sequence_adapter(adapter):
        return f"{_list_c_type(_class_index(model)[sequence_adapter_target(adapter)], model)}*"
    if is_variant_adapter(adapter):
        return _variant_model(adapter, model).c_type_name
    if is_sequence_of_variant_adapter(adapter):
        return _variant_list_c_type(_sequence_of_variant_model(adapter, model))
    raise RuntimeError(f"Unsupported return adapter: {adapter}")


def _parameter_c_type(parameter: ParameterModel, model: ModuleModel) -> str:
    if parameter.adapter == "string":
        return "const char*"
    if parameter.adapter == "integer":
        return "int"
    if parameter.adapter == "bool":
        return "bool"
    if parameter.adapter == "buffer":
        # A raw `void* data` parameter paired with an adjacent `int` length parameter
        # (the real C++ signature, e.g. `ifcopenshell::file(void* data, int data_size, ...)`)
        # -- see research/06-wrappergen-spike-results.md for why this is a parameter-adapter
        # addition rather than a new emitted C API function: the length is already the very
        # next ordinary `integer`-adapter parameter, nothing else needs to change.
        return "const char*"
    if is_enum_adapter(parameter.adapter):
        return _enum_c_type(parameter.adapter, model)
    if is_handle_adapter(parameter.adapter):
        target = _class_index(model)[handle_adapter_target(parameter.adapter)]
        return f"{_class_c_type(target, model)}*"
    if is_variant_adapter(parameter.adapter):
        return f"{_variant_model(parameter.adapter, model).c_type_name}"
    raise RuntimeError(f"Unsupported parameter adapter: {parameter.adapter}")


def _class_or_enum_cpp_name(adapter: str, model: ModuleModel) -> str:
    if is_handle_adapter(adapter):
        return _class_index(model)[handle_adapter_target(adapter)].cpp_name
    if is_enum_adapter(adapter):
        return _enum_index(model)[enum_adapter_target(adapter)].cpp_name
    raise RuntimeError(f"Adapter '{adapter}' does not resolve to a named C++ type")


def _cpp_argument(parameter: ParameterModel, model: ModuleModel) -> str:
    if parameter.adapter == "string":
        return f'std::string({parameter.name} ? {parameter.name} : "")'
    if parameter.adapter == "buffer":
        return f"static_cast<void*>(const_cast<char*>({parameter.name}))"
    if is_enum_adapter(parameter.adapter):
        return f"static_cast<{_class_or_enum_cpp_name(parameter.adapter, model)}>({parameter.name})"
    if is_handle_adapter(parameter.adapter):
        target = _class_index(model)[handle_adapter_target(parameter.adapter)]
        actual_type = normalize_cpp_type(parameter.cpp_type)
        if target.handle_kind == "borrowed":
            # `handle->value` is already the raw pointer this class wraps (see
            # `_emit_handle_return_lines`/`emit_c_api_implementation`'s struct body).
            return f"{parameter.name}->value" if actual_type.endswith("*") else f"*{parameter.name}->value"
        if actual_type.endswith("*"):
            if target.handle_kind == "shared_ptr":
                return f"{parameter.name}->value.get()"
            return f"&{parameter.name}->value"
        if target.handle_kind == "shared_ptr":
            return f"*{parameter.name}->value"
        return f"{parameter.name}->value"
    if is_variant_adapter(parameter.adapter):
        # The real conversion is multi-statement (a switch over `.kind`), emitted just
        # above the call expression by `_emit_variant_parameter_conversion` into a local
        # named exactly this -- see `emit_c_api_implementation`.
        return f"{parameter.name}_native"
    return parameter.name


def _call_expression(variant: CallableVariant, model: ModuleModel) -> str:
    arguments = ", ".join(_cpp_argument(parameter, model) for parameter in variant.parameters)
    if variant.callable.kind == "constructor":
        if variant.owner.handle_kind == "shared_ptr":
            return f"std::make_shared<{variant.owner.cpp_name}>({arguments})"
        return f"{variant.owner.cpp_name}({arguments})"
    if variant.callable.kind == "free_function":
        # A hand-written free function taking the owning instance explicitly as its first
        # argument (e.g. `ifcopenshell::wrappergen::get_attribute_value_variant(instance, index)`)
        # rather than being an actual C++ method of `variant.owner` -- see
        # `research/06-wrappergen-spike-results.md` for why the real attribute-value accessors
        # can't be discovered as ordinary methods.
        self_expression = (
            "*handle->value" if variant.owner.handle_kind in {"shared_ptr", "borrowed"} else "handle->value"
        )
        all_arguments = ", ".join([self_expression, arguments]) if arguments else self_expression
        return f"{variant.callable.cpp_name}({all_arguments})"
    access = "handle->value->" if variant.owner.handle_kind in {"shared_ptr", "borrowed"} else "handle->value."
    return f"{access}{variant.callable.cpp_name}({arguments})"


def _vector_inner_type(cpp_type: str) -> str | None:
    canonical = normalize_cpp_type(cpp_type)
    prefix = "std::vector<"
    if not canonical.startswith(prefix) or not canonical.endswith(">"):
        return None
    return canonical[len(prefix) : -1]


def _owner_expression(source: ClassModel, target: ClassModel) -> str:
    if target.owner_cpp_name is None:
        raise RuntimeError(f"Class '{target.cpp_name}' does not declare an owner relationship")
    if normalize_cpp_type(source.cpp_name) == normalize_cpp_type(target.owner_cpp_name):
        if source.handle_kind != "shared_ptr":
            raise RuntimeError(f"Owner class '{source.cpp_name}' must use shared_ptr handle storage")
        return "handle->value"
    if source.owner_cpp_name and normalize_cpp_type(source.owner_cpp_name) == normalize_cpp_type(target.owner_cpp_name):
        return "handle->owner"
    raise RuntimeError(
        f"Unable to propagate owner '{target.owner_cpp_name}' from '{source.cpp_name}' to '{target.cpp_name}'"
    )


def _emit_handle_return_lines(
    lines: list[str],
    source_owner: ClassModel,
    target: ClassModel,
    callable_model: CallableModel,
    call_expression: str,
    model: ModuleModel,
) -> None:
    normalized_return = normalize_cpp_type(callable_model.return_cpp_type)
    if target.handle_kind == "borrowed":
        # A "borrowed" handle wraps a raw, non-owning pointer directly -- no dereference,
        # no copy, no delete. Needed for classes whose lifetime is tied to something with
        # no representable owner in `class_owner_types`' single-parent model (e.g. a
        # process-wide schema registry singleton), and whose destructor deletes the
        # objects it points to on the assumption that it's the unique owner
        # (`schema_definition::~schema_definition()` deletes every `declaration*` it
        # holds). Copying such a class BY VALUE (the "value" handle_kind's pointer-return
        # handling, below) compiles cleanly -- it isn't a deleted/non-copyable type -- but
        # is a real double-free/use-after-free: the wrapper's copy's destructor and the
        # singleton's own destructor both free the same underlying declarations. Found by
        # this spike via an actual runtime crash, not just a compile check -- see
        # `06-wrappergen-spike-results.md`.
        if normalized_return.endswith("*"):
            lines.append(f"        auto* result_ptr = {call_expression};")
        else:
            # A reference return (e.g. `express::base::declaration() const` returns
            # `const ifcopenshell::declaration&`) -- take its address to get the same
            # "just store the pointer" handling as the pointer-return case. Always safe:
            # a C++ reference is never null, and (per this handle_kind's whole premise)
            # the referent already outlives this call.
            lines.append(f"        const auto& result_ref = {call_expression};")
            lines.append("        auto* result_ptr = &result_ref;")
        lines.append(
            f"        return result_ptr == nullptr ? nullptr : new {_class_c_type(target, model)}{{ const_cast<{target.cpp_name}*>(result_ptr) }};"
        )
        return
    if normalized_return.endswith("*"):
        lines.append(f"        auto result_ptr = {call_expression};")
        lines.append("        if (result_ptr == nullptr) {")
        lines.append("            return nullptr;")
        lines.append("        }")
        lines.append("        auto result = *result_ptr;")
    else:
        lines.append(f"        auto result = {call_expression};")
    if target.handle_kind == "shared_ptr":
        lines.append(f"        auto wrapped_value = std::make_shared<{target.cpp_name}>(std::move(result));")
        lines.append(f"        return new {_class_c_type(target, model)}{{ std::move(wrapped_value) }};")
        return
    if target.owner_cpp_name is not None:
        owner_expression = "{}" if callable_model.kind == "constructor" else _owner_expression(source_owner, target)
        lines.append(f"        return new {_class_c_type(target, model)}{{ {owner_expression}, std::move(result) }};")
        return
    lines.append(f"        return new {_class_c_type(target, model)}{{ std::move(result) }};")


def _emit_sequence_return_lines(
    lines: list[str],
    source_owner: ClassModel,
    target: ClassModel,
    callable_model: CallableModel,
    call_expression: str,
    model: ModuleModel,
) -> None:
    vector_inner = _vector_inner_type(callable_model.return_cpp_type)
    if target.handle_kind == "borrowed":
        # Same rationale as the single-handle "borrowed" case: a vector of raw pointers,
        # copied as pointers (cheap, and safe regardless of what `target.cpp_name`'s own
        # destructor does), never a vector of by-value copies of the pointees.
        lines.append(f"        const auto& source_result = {call_expression};")
        lines.append(f"        std::vector<{target.cpp_name}*> result;")
        lines.append("        result.reserve(source_result.size());")
        lines.append("        for (const auto* item : source_result) {")
        lines.append(f"            result.push_back(const_cast<{target.cpp_name}*>(item));")
        lines.append("        }")
    elif vector_inner is not None and vector_inner.endswith("*"):
        lines.append(f"        auto source_result = {call_expression};")
        lines.append(f"        std::vector<{target.cpp_name}> result;")
        lines.append("        result.reserve(source_result.size());")
        lines.append("        for (const auto* item : source_result) {")
        lines.append("            if (item != nullptr) {")
        lines.append("                result.push_back(*item);")
        lines.append("            }")
        lines.append("        }")
    else:
        lines.append(f"        auto result = {call_expression};")
    if target.owner_cpp_name is not None:
        owner_expression = _owner_expression(source_owner, target)
        lines.append(f"        return new {_list_c_type(target, model)}{{ {owner_expression}, std::move(result) }};")
        return
    lines.append(f"        return new {_list_c_type(target, model)}{{ std::move(result) }};")


def _emit_variant_parameter_conversion(lines: list[str], parameter: ParameterModel, model: ModuleModel) -> None:
    """Converts an incoming C `<variant>_t` value into the C++ shim type the real call
    expects, storing it in a `{name}_native` local (`_cpp_argument` references that name
    directly), by delegating to the variant model's generated `..._to_native` helper
    (`_emit_variant_helper_functions`) -- the return direction is
    `_emit_variant_return_lines`, below."""
    variant_model = _variant_model(parameter.adapter, model)
    native_type = variant_adapter_target(parameter.adapter)
    local_name = f"{parameter.name}_native"
    lines.append(f"        {native_type} {local_name} = {_variant_to_native_name(variant_model)}({parameter.name});")


def _variant_owner_argument(owner: ClassModel, variant_model: VariantAdapterModel, model: ModuleModel) -> str:
    """The `, <owner-expression>` suffix `_emit_variant_helper_functions`'ss `..._from_native`
    helper needs whenever the variant has a handle-kind case whose target declares an
    owner (see `_variant_owner_case`) -- empty when it doesn't."""
    owner_case = _variant_owner_case(variant_model, model)
    if owner_case is None:
        return ""
    target = _class_index(model)[owner_case.handle_target]
    return f", {_owner_expression(owner, target)}"


def _emit_variant_return_lines(
    lines: list[str],
    owner: ClassModel,
    return_adapter: str,
    call_expression: str,
    model: ModuleModel,
) -> None:
    """The return-direction half of the variant adapter: builds the C `<variant>_t` value
    from the C++ shim value `call_expression` evaluates to, by delegating to the variant
    model's generated `..._from_native` helper (`_emit_variant_helper_functions`), which
    propagates the same owner-expression ordinary handle/sequence returns use
    (`_owner_expression`) so a returned entity-reference handle's lifetime is tied to the
    same owning `file` as everything else -- however deeply nested inside an
    ATTRIBUTE_VALUE_KIND_AGGREGATE case."""
    variant_model = _variant_model(return_adapter, model)
    owner_argument = _variant_owner_argument(owner, variant_model, model)
    lines.append(f"        auto native_result = {call_expression};")
    lines.append(f"        return {_variant_from_native_name(variant_model)}(native_result{owner_argument});")


def _emit_sequence_of_variant_return_lines(
    lines: list[str],
    owner: ClassModel,
    return_adapter: str,
    call_expression: str,
    model: ModuleModel,
) -> None:
    """The `sequence_of_variant:` return adapter (`get_all_attribute_values`'s bulk
    fetch, research/06-wrappergen-spike-results.md SS4): eagerly converts every element of
    the returned `std::vector<...>` via the same per-element `..._from_native` helper the
    single-value case uses, into a `{count, items}` struct returned by value."""
    variant_model = _sequence_of_variant_model(return_adapter, model)
    list_type = _variant_list_c_type(variant_model)
    owner_argument = _variant_owner_argument(owner, variant_model, model)
    from_native = _variant_from_native_name(variant_model)
    lines.append(f"        auto native_result = {call_expression};")
    lines.append(f"        {list_type} c_result{{}};")
    lines.append("        c_result.count = static_cast<int>(native_result.size());")
    lines.append(
        f"        c_result.items = c_result.count > 0 ? new {variant_model.c_type_name}[static_cast<size_t>(c_result.count)] : nullptr;"
    )
    lines.append("        for (int index = 0; index < c_result.count; ++index) {")
    lines.append(
        f"            c_result.items[index] = {from_native}(native_result[static_cast<size_t>(index)]{owner_argument});"
    )
    lines.append("        }")
    lines.append("        return c_result;")


def _emit_variant_helper_functions(lines: list[str], model: ModuleModel) -> None:
    """Emits, per variant adapter, a recursive pair of private conversion helpers plus
    the two extern-"C" cleanup functions declared in the header
    (`emit_c_api_header`'s `_variant_free_contents_name`/`_variant_list_free_name`):

    - `{variant}_from_native(const {cpp_type}&, [owner])  -> {c_type}` -- native shim
      value to C-ABI struct (the GET direction).
    - `{variant}_to_native(const {c_type}&) -> {cpp_type}` -- C-ABI struct to native shim
      value (the SET/parameter direction).
    - `{variant}_free_contents({c_type})` -- releases the heap-allocated strings and
      nested `ATTRIBUTE_VALUE_KIND_AGGREGATE` arrays a `{c_type}` value owns, in either
      direction. Deliberately never touches a `handle`-kind field: a GET-direction
      handle's ownership transfers to JS via `napi_create_external`'s finalizer once
      `emit_napi_extension` wraps it, and a SET-direction handle is always borrowed from
      the caller -- freeing it here would be a use-after-free/double-free on the live
      handle the JS side still owns (see `attribute_value_shim.h`'s doc comment).
    - `{variant}_list_free({list_type})` -- same, for a `sequence_of_variant:` return's
      `{count, items}` struct.

    Placed (by `emit_c_api_implementation`) after every class C struct is fully defined
    (the `handle`-kind case needs `->value` field access, not just the header's opaque
    forward declaration) and before the `extern "C"` block those cleanup functions live
    in -- called recursively for the "sequence" field_kind case
    (`ATTRIBUTE_VALUE_KIND_AGGREGATE`), one nesting level at a time, so the same pair of
    functions handles the whole ~15-way `ifcopenshell::argument_type` dispatch
    (research/01-python-core-and-lowlevel.md SS5) without one case per aggregate element
    type.
    """
    for variant_model in model.variant_adapters:
        c_type = variant_model.c_type_name
        cpp_type = variant_model.cpp_type
        from_native = _variant_from_native_name(variant_model)
        to_native = _variant_to_native_name(variant_model)
        owner_case = _variant_owner_case(variant_model, model)
        owner_cpp_name = _class_index(model)[owner_case.handle_target].owner_cpp_name if owner_case is not None else None
        owner_parameter = f", std::shared_ptr<{owner_cpp_name}> owner" if owner_cpp_name is not None else ""
        owner_argument = ", owner" if owner_cpp_name is not None else ""

        # `{variant}_from_native`: native shim value -> C-ABI struct (GET direction).
        lines.append(f"{c_type} {from_native}(const {cpp_type}& native{owner_parameter}) {{")
        lines.append(f"    {c_type} result{{}};")
        lines.append(
            f"    result.{variant_model.kind_field} = static_cast<decltype(result.{variant_model.kind_field})>(native.{variant_model.kind_field});"
        )
        lines.append(f"    switch (native.{variant_model.kind_field}) {{")
        for case in variant_model.cases:
            lines.append(f"    case {case.native_kind_name}:")
            if case.field_kind == "handle":
                target = _class_index(model)[case.handle_target]
                if target.owner_cpp_name is not None:
                    lines.append(
                        f"        result.{case.field} = new {_class_c_type(target, model)}{{ owner, native.{case.field} }};"
                    )
                else:
                    lines.append(
                        f"        result.{case.field} = new {_class_c_type(target, model)}{{ native.{case.field} }};"
                    )
            elif case.field_kind == "string":
                lines.append(f"        result.{case.field} = duplicate_string(native.{case.field});")
            elif case.field_kind == "sequence":
                lines.append(f"        result.{case.field}_count = static_cast<int>(native.{case.field}.size());")
                lines.append(
                    f"        result.{case.field} = result.{case.field}_count > 0 ? new {c_type}[static_cast<size_t>(result.{case.field}_count)] : nullptr;"
                )
                lines.append(f"        for (int index = 0; index < result.{case.field}_count; ++index) {{")
                lines.append(
                    f"            result.{case.field}[index] = {from_native}(native.{case.field}[static_cast<size_t>(index)]{owner_argument});"
                )
                lines.append("        }")
            else:
                lines.append(f"        result.{case.field} = native.{case.field};")
            lines.append("        break;")
        lines.append("    default:")
        lines.append("        break;")
        lines.append("    }")
        lines.append("    return result;")
        lines.append("}")
        lines.append("")

        # `{variant}_to_native`: C-ABI struct -> native shim value (SET/parameter direction).
        lines.append(f"{cpp_type} {to_native}(const {c_type}& value) {{")
        lines.append(f"    {cpp_type} result;")
        lines.append(
            f"    result.{variant_model.kind_field} = static_cast<decltype(result.{variant_model.kind_field})>(value.{variant_model.kind_field});"
        )
        lines.append(f"    switch (value.{variant_model.kind_field}) {{")
        for case in variant_model.cases:
            lines.append(f"    case {case.kind_c_name}:")
            if case.field_kind == "handle":
                target = _class_index(model)[case.handle_target]
                deref = f"*value.{case.field}->value" if target.handle_kind == "shared_ptr" else f"value.{case.field}->value"
                lines.append(f"        if (value.{case.field} != nullptr) {{")
                lines.append(f"            result.{case.field} = {deref};")
                lines.append("        }")
            elif case.field_kind == "string":
                lines.append(f"        if (value.{case.field} != nullptr) {{")
                lines.append(f"            result.{case.field} = value.{case.field};")
                lines.append("        }")
            elif case.field_kind == "sequence":
                lines.append(f"        result.{case.field}.reserve(static_cast<size_t>(value.{case.field}_count));")
                lines.append(f"        for (int index = 0; index < value.{case.field}_count; ++index) {{")
                lines.append(f"            result.{case.field}.push_back({to_native}(value.{case.field}[index]));")
                lines.append("        }")
            else:
                lines.append(f"        result.{case.field} = value.{case.field};")
            lines.append("        break;")
        lines.append("    default:")
        lines.append("        break;")
        lines.append("    }")
        lines.append("    return result;")
        lines.append("}")
        lines.append("")


def emit_c_api_header(model: ModuleModel) -> str:
    sequence_targets = _sequence_targets(model)
    lines = [
        "#ifndef IFCOPENSHELL_EXPERIMENTAL_C_API_H",
        "#define IFCOPENSHELL_EXPERIMENTAL_C_API_H",
        "",
        "#include <stdbool.h>",
        "#include <stddef.h>",
        "#include <stdint.h>",
        "",
        "#ifdef __cplusplus",
        'extern "C" {',
        "#endif",
        "",
    ]
    for class_model in model.classes:
        lines.append(f"typedef struct {_class_c_type(class_model, model)} {_class_c_type(class_model, model)};")
    if model.classes:
        lines.append("")
    for class_model in sequence_targets:
        lines.append(f"typedef struct {_list_c_type(class_model, model)} {_list_c_type(class_model, model)};")
    if sequence_targets:
        lines.append("")
    for enum_model in model.enums:
        lines.append(f"typedef enum {enum_model.c_name} {{")
        for value in enum_model.values:
            lines.append(f"    {value.c_name} = {value.value},")
        lines.append(f"}} {enum_model.c_name};")
        lines.append("")
    sequence_of_variant_models = _sequence_of_variant_models(model)
    for variant_model in model.variant_adapters:
        lines.append(f"typedef enum {variant_model.kind_enum_c_name} {{")
        for case in variant_model.cases:
            lines.append(f"    {case.kind_c_name},")
        lines.append(f"}} {variant_model.kind_enum_c_name};")
        lines.append("")
        lines.append(f"typedef struct {variant_model.c_type_name} {{")
        lines.append(f"    {variant_model.kind_enum_c_name} {variant_model.kind_field};")
        seen_fields: set[str] = set()
        for case in variant_model.cases:
            if case.field in seen_fields:
                continue
            seen_fields.add(case.field)
            if case.field_kind == "integer":
                field_type = "int64_t"
            elif case.field_kind == "double":
                field_type = "double"
            elif case.field_kind == "string":
                field_type = "char*"
            elif case.field_kind == "handle":
                field_type = f"{_class_c_type(_class_index(model)[case.handle_target], model)}*"
            elif case.field_kind == "sequence":
                # A homogeneous nested aggregate (research/01-python-core-and-lowlevel.md SS5's
                # AGGREGATE_OF_*/AGGREGATE_OF_AGGREGATE_OF_* cases, folded into one generic,
                # recursive case -- see `attribute_value_shim.h`): a self-referential
                # heap array (legal in C, same idiom as a linked-list node's `struct X*
                # next`) paired with an element count. `emit_c_api_implementation`'s
                # `{variant}_from_native`/`{variant}_to_native`/`{variant}_free_contents`
                # walk this recursively.
                lines.append(f"    struct {variant_model.c_type_name}* {case.field};")
                lines.append(f"    int {case.field}_count;")
                continue
            else:
                raise RuntimeError(f"Unsupported variant case field_kind: {case.field_kind}")
            lines.append(f"    {field_type} {case.field};")
        lines.append(f"}} {variant_model.c_type_name};")
        lines.append("")
        if variant_model in sequence_of_variant_models:
            list_type = _variant_list_c_type(variant_model)
            lines.append(f"typedef struct {list_type} {{")
            lines.append(f"    {variant_model.c_type_name}* items;")
            lines.append("    int count;")
            lines.append(f"}} {list_type};")
            lines.append("")
    lines.extend(
        [
            "const char* ifcopenshell_last_error_message(void);",
            "void ifcopenshell_last_error_clear(void);",
            "void ifcopenshell_string_free(char* value);",
            "",
        ]
    )
    for variant_model in model.variant_adapters:
        # Exposed (unlike the private, recursive native<->C conversion helpers
        # `emit_c_api_implementation` emits) because the N-API extension --
        # a separate translation unit -- needs to release the heap-allocated
        # strings/nested arrays a variant value (in either direction: a GET
        # result once copied into a JS value, or a SET parameter once parsed
        # out of one) owns. Never touches `handle`-kind fields: a GET-direction
        # handle's ownership transfers to JS via `napi_create_external`'s
        # finalizer, and a SET-direction handle is always borrowed from the
        # caller -- see `attribute_value_shim.h`'s `attribute_value_kind`
        # doc-comment and `emit_napi_extension`.
        lines.append(f"void {_variant_free_contents_name(variant_model)}({variant_model.c_type_name} value);")
        if variant_model in sequence_of_variant_models:
            lines.append(f"void {_variant_list_free_name(variant_model)}({_variant_list_c_type(variant_model)} list);")
    if model.variant_adapters:
        lines.append("")
    for variant in _all_variants(model):
        return_type = _return_c_type(variant.callable.return_adapter, model)
        parameters = ", ".join(
            f"{_parameter_c_type(parameter, model)} {parameter.name}" for parameter in variant.parameters
        )
        if variant.callable.kind in {"method", "free_function"}:
            self_type = f"{_class_c_type(variant.owner, model)}* handle"
            parameters = f"{self_type}, {parameters}" if parameters else self_type
        lines.append(f"{return_type} {model.c_prefix}_{variant.api_name}({parameters});")
    if _all_variants(model):
        lines.append("")
    for class_model in sequence_targets:
        list_prefix = f"{model.c_prefix}_{_class_c_identifier(class_model, model)}_list"
        lines.append(f"int {list_prefix}_size(const {_list_c_type(class_model, model)}* handle);")
        lines.append(
            f"{_class_c_type(class_model, model)}* {list_prefix}_get(const {_list_c_type(class_model, model)}* handle, int index);"
        )
        lines.append(f"void {list_prefix}_free({_list_c_type(class_model, model)}* handle);")
        lines.append("")
    for class_model in model.classes:
        lines.append(
            f"void {model.c_prefix}_{_class_c_identifier(class_model, model)}_free({_class_c_type(class_model, model)}* handle);"
        )
    lines.extend(
        [
            "",
            "#ifdef __cplusplus",
            "}",
            "#endif",
            "",
            "#endif",
            "",
        ]
    )
    return "\n".join(lines)


def emit_c_api_implementation(model: ModuleModel) -> str:
    sequence_targets = _sequence_targets(model)
    lines = [
        f'#include "{model.api_header_name}"',
        "",
    ]
    for header in sorted(dict.fromkeys(model.source_headers)):
        lines.append(f'#include "{header}"')
    lines.extend(
        [
            "",
            "#include <algorithm>",
            "#include <memory>",
            "#include <stdexcept>",
            "#include <string>",
            "#include <utility>",
            "#include <vector>",
            "",
            "namespace {",
            "thread_local std::string g_last_error;",
            "",
            "char* duplicate_string(const std::string& value) {",
            "    auto* buffer = new char[value.size() + 1];",
            "    std::copy(value.begin(), value.end(), buffer);",
            "    buffer[value.size()] = '\\0';",
            "    return buffer;",
            "}",
            "",
            "void set_last_error(const std::exception& exception) {",
            "    g_last_error = exception.what();",
            "}",
            "}",
            "",
        ]
    )
    for class_model in model.classes:
        lines.append(f"struct {_class_c_type(class_model, model)} {{")
        if class_model.owner_cpp_name is not None:
            lines.append(f"    std::shared_ptr<{class_model.owner_cpp_name}> owner;")
        if class_model.handle_kind == "shared_ptr":
            lines.append(f"    std::shared_ptr<{class_model.cpp_name}> value;")
        elif class_model.handle_kind == "borrowed":
            # A raw, non-owning pointer -- see `_emit_handle_return_lines`. `_free`'s
            # generic `delete handle;` only destroys this wrapper struct; a raw pointer
            # member has no destructor of its own to run, so the pointee is untouched.
            # Deliberately non-const: the real API is inconsistent about const-ness for
            # these types (e.g. `named_type`'s constructor takes a non-const
            # `declaration*` while `express::base::declaration()` returns a const
            # reference) -- a non-const pointer converts implicitly wherever a const one
            # is needed, so this avoids a combinatorial const-matching problem for a
            # class of object this generator otherwise treats as logically immutable
            # once constructed.
            lines.append(f"    {class_model.cpp_name}* value;")
        else:
            lines.append(f"    {class_model.cpp_name} value;")
        lines.append("};")
        lines.append("")
    for class_model in sequence_targets:
        lines.append(f"struct {_list_c_type(class_model, model)} {{")
        if class_model.owner_cpp_name is not None:
            lines.append(f"    std::shared_ptr<{class_model.owner_cpp_name}> owner;")
        if class_model.handle_kind == "borrowed":
            # Same rationale as the single-handle "borrowed" struct field: a vector of
            # raw, non-owning pointers, never a vector of by-value copies.
            lines.append(f"    std::vector<{class_model.cpp_name}*> value;")
        else:
            lines.append(f"    std::vector<{class_model.cpp_name}> value;")
        lines.append("};")
        lines.append("")
    if model.variant_adapters:
        # Private (internal-linkage-by-convention, though not itself wrapped in an
        # anonymous namespace since `_variant_owner_case`'s handle case needs the class
        # C structs defined above) native<->C-ABI conversion helpers -- see
        # `_emit_variant_helper_functions`'s own docstring for the full rationale.
        _emit_variant_helper_functions(lines, model)
    lines.extend(
        [
            'extern "C" {',
            "",
            "const char* ifcopenshell_last_error_message(void) {",
            "    return g_last_error.empty() ? nullptr : g_last_error.c_str();",
            "}",
            "",
            "void ifcopenshell_last_error_clear(void) {",
            "    g_last_error.clear();",
            "}",
            "",
            "void ifcopenshell_string_free(char* value) {",
            "    delete[] value;",
            "}",
            "",
        ]
    )
    sequence_of_variant_models = _sequence_of_variant_models(model)
    for variant_model in model.variant_adapters:
        free_contents = _variant_free_contents_name(variant_model)
        lines.append(f"void {free_contents}({variant_model.c_type_name} value) {{")
        lines.append(f"    switch (value.{variant_model.kind_field}) {{")
        emitted_sequence_case = False
        for case in variant_model.cases:
            if case.field_kind not in {"string", "sequence"}:
                continue
            lines.append(f"    case {case.kind_c_name}:")
            if case.field_kind == "string":
                lines.append(f"        ifcopenshell_string_free(value.{case.field});")
                lines.append("        break;")
            elif not emitted_sequence_case:
                # Only one "sequence" case exists per variant adapter today
                # (ATTRIBUTE_VALUE_KIND_AGGREGATE) -- guarded rather than assumed, so a
                # future second one doesn't silently duplicate this loop's free/delete.
                emitted_sequence_case = True
                lines.append(f"        for (int index = 0; index < value.{case.field}_count; ++index) {{")
                lines.append(f"            {free_contents}(value.{case.field}[index]);")
                lines.append("        }")
                lines.append(f"        delete[] value.{case.field};")
                lines.append("        break;")
        lines.append("    default:")
        lines.append("        break;")
        lines.append("    }")
        lines.append("}")
        lines.append("")
        if variant_model in sequence_of_variant_models:
            list_type = _variant_list_c_type(variant_model)
            lines.append(f"void {_variant_list_free_name(variant_model)}({list_type} list) {{")
            lines.append("    for (int index = 0; index < list.count; ++index) {")
            lines.append(f"        {free_contents}(list.items[index]);")
            lines.append("    }")
            lines.append("    delete[] list.items;")
            lines.append("}")
            lines.append("")
    for variant in _all_variants(model):
        return_type = _return_c_type(variant.callable.return_adapter, model)
        parameter_list = ", ".join(
            f"{_parameter_c_type(parameter, model)} {parameter.name}" for parameter in variant.parameters
        )
        if variant.callable.kind in {"method", "free_function"}:
            self_type = f"{_class_c_type(variant.owner, model)}* handle"
            parameter_list = f"{self_type}, {parameter_list}" if parameter_list else self_type
        lines.append(f"{return_type} {model.c_prefix}_{variant.api_name}({parameter_list}) {{")
        lines.append("    ifcopenshell_last_error_clear();")
        lines.append("    try {")
        if variant.callable.kind in {"method", "free_function"}:
            lines.append("        if (handle == nullptr) {")
            lines.append('            throw std::runtime_error("Null handle received");')
            lines.append("        }")
        for parameter in variant.parameters:
            if is_handle_adapter(parameter.adapter):
                lines.append(f"        if ({parameter.name} == nullptr) {{")
                lines.append(
                    f'            throw std::runtime_error("Null handle parameter received for {parameter.name}");'
                )
                lines.append("        }")
            if is_variant_adapter(parameter.adapter):
                _emit_variant_parameter_conversion(lines, parameter, model)
        call_expression = _call_expression(variant, model)
        if variant.callable.kind == "constructor":
            lines.append(f"        auto constructed_value = {call_expression};")
            if variant.owner.handle_kind == "borrowed":
                # Heap-allocate so the wrapper's `const T*` field has something valid (and
                # non-dangling past this function) to point at. This intentionally leaks
                # (matching the lifetime model every other genuinely "borrowed" instance of
                # this class already has -- schema-owned objects are never freed piecemeal)
                # rather than risk a dangling pointer; constructing new schema-introspection
                # objects directly isn't part of this spike's file/entity_instance/
                # declaration exit criteria, so this path isn't exercised by the spike's own
                # verification, only left correctly-typed for completeness.
                lines.append(
                    f"        return new {_class_c_type(variant.owner, model)}{{ new {variant.owner.cpp_name}(std::move(constructed_value)) }};"
                )
            elif variant.owner.handle_kind == "shared_ptr":
                lines.append(
                    f"        return new {_class_c_type(variant.owner, model)}{{ std::move(constructed_value) }};"
                )
            elif variant.owner.owner_cpp_name is not None:
                lines.append(
                    f"        return new {_class_c_type(variant.owner, model)}{{ {{}}, std::move(constructed_value) }};"
                )
            else:
                lines.append(
                    f"        return new {_class_c_type(variant.owner, model)}{{ std::move(constructed_value) }};"
                )
        elif variant.callable.return_adapter == "string":
            lines.append(f"        auto result = {call_expression};")
            lines.append("        return duplicate_string(result);")
        elif variant.callable.return_adapter in {"integer", "bool", "void"} or is_enum_adapter(
            variant.callable.return_adapter
        ):
            if variant.callable.return_adapter == "void":
                lines.append(f"        {call_expression};")
                lines.append("        return;")
            elif is_enum_adapter(variant.callable.return_adapter):
                # Not exercised by any callable in the checked-in `generated/` snapshot
                # (every enum there is parameter-only) until this spike's broader,
                # full-header-set model started returning one directly -- an
                # un-cross-cast return of a C++ enum where the function signature
                # promises the *generated* C enum type doesn't reliably compile (found
                # by this spike; see 06-wrappergen-spike-results.md).
                lines.append(f"        return static_cast<{return_type}>({call_expression});")
            else:
                lines.append(f"        return {call_expression};")
        elif is_handle_adapter(variant.callable.return_adapter):
            target = _class_index(model)[handle_adapter_target(variant.callable.return_adapter)]
            _emit_handle_return_lines(lines, variant.owner, target, variant.callable, call_expression, model)
        elif is_sequence_adapter(variant.callable.return_adapter):
            target = _class_index(model)[sequence_adapter_target(variant.callable.return_adapter)]
            _emit_sequence_return_lines(lines, variant.owner, target, variant.callable, call_expression, model)
        elif is_variant_adapter(variant.callable.return_adapter):
            _emit_variant_return_lines(lines, variant.owner, variant.callable.return_adapter, call_expression, model)
        elif is_sequence_of_variant_adapter(variant.callable.return_adapter):
            _emit_sequence_of_variant_return_lines(
                lines, variant.owner, variant.callable.return_adapter, call_expression, model
            )
        else:
            raise RuntimeError(f"Unsupported return adapter in C API emitter: {variant.callable.return_adapter}")
        lines.append("    } catch (const std::exception& exception) {")
        lines.append("        set_last_error(exception);")
        if return_type == "void":
            lines.append("        return;")
        elif is_enum_adapter(variant.callable.return_adapter):
            # Same "0 doesn't implicitly become an enum" issue as the success path above --
            # again unreachable in the checked-in `generated/` snapshot until this spike's
            # broader model returned an enum directly for the first time.
            lines.append(f"        return static_cast<{return_type}>(0);")
        elif return_type in {"int", "bool"}:
            lines.append("        return 0;")
        elif is_variant_adapter(variant.callable.return_adapter) or is_sequence_of_variant_adapter(
            variant.callable.return_adapter
        ):
            lines.append("        return {};")
        else:
            lines.append("        return nullptr;")
        lines.append("    }")
        lines.append("}")
        lines.append("")
    for class_model in sequence_targets:
        list_prefix = f"{model.c_prefix}_{_class_c_identifier(class_model, model)}_list"
        lines.extend(
            [
                f"int {list_prefix}_size(const {_list_c_type(class_model, model)}* handle) {{",
                "    ifcopenshell_last_error_clear();",
                "    try {",
                "        if (handle == nullptr) {",
                '            throw std::runtime_error("Null list handle received");',
                "        }",
                "        return static_cast<int>(handle->value.size());",
                "    } catch (const std::exception& exception) {",
                "        set_last_error(exception);",
                "        return 0;",
                "    }",
                "}",
                "",
                f"{_class_c_type(class_model, model)}* {list_prefix}_get(const {_list_c_type(class_model, model)}* handle, int index) {{",
                "    ifcopenshell_last_error_clear();",
                "    try {",
                "        if (handle == nullptr) {",
                '            throw std::runtime_error("Null list handle received");',
                "        }",
                "        if (index < 0 || static_cast<size_t>(index) >= handle->value.size()) {",
                '            throw std::out_of_range("List index out of range");',
                "        }",
            ]
        )
        if class_model.handle_kind == "borrowed":
            # `handle->value.at(index)` is already the raw pointer this class wraps.
            lines.append(
                f"        return new {_class_c_type(class_model, model)}{{ handle->value.at(static_cast<size_t>(index)) }};"
            )
        elif class_model.handle_kind == "shared_ptr":
            lines.append(
                f"        auto item_value = std::make_shared<{class_model.cpp_name}>(handle->value.at(static_cast<size_t>(index)));"
            )
            lines.append(f"        return new {_class_c_type(class_model, model)}{{ std::move(item_value) }};")
        elif class_model.owner_cpp_name is not None:
            lines.append(f"        auto item_value = handle->value.at(static_cast<size_t>(index));")
            lines.append(
                f"        return new {_class_c_type(class_model, model)}{{ handle->owner, std::move(item_value) }};"
            )
        else:
            lines.append(f"        auto item_value = handle->value.at(static_cast<size_t>(index));")
            lines.append(f"        return new {_class_c_type(class_model, model)}{{ std::move(item_value) }};")
        lines.extend(
            [
                "    } catch (const std::exception& exception) {",
                "        set_last_error(exception);",
                "        return nullptr;",
                "    }",
                "}",
                "",
                f"void {list_prefix}_free({_list_c_type(class_model, model)}* handle) {{",
                "    delete handle;",
                "}",
                "",
            ]
        )
    for class_model in model.classes:
        lines.append(
            f"void {model.c_prefix}_{_class_c_identifier(class_model, model)}_free({_class_c_type(class_model, model)}* handle) {{"
        )
        lines.append("    delete handle;")
        lines.append("}")
        lines.append("")
    lines.extend(["}", ""])
    return "\n".join(lines)


def emit_python_extension(model: ModuleModel) -> str:
    class_models = _class_index(model)
    lines = [
        "#define PY_SSIZE_T_CLEAN",
        "#include <Python.h>",
        "",
        f'#include "{model.api_header_name}"',
        "",
    ]
    for class_model in model.classes:
        lines.append(
            f'static const char* {_capsule_name_symbol(class_model)} = "{model.module_name}.{_class_c_identifier(class_model, model)}";'
        )
    lines.extend(
        [
            "",
            "static PyObject* raise_last_error(const char* fallback_message) {",
            "    const char* message = ifcopenshell_last_error_message();",
            "    PyErr_SetString(PyExc_RuntimeError, message ? message : fallback_message);",
            "    return nullptr;",
            "}",
            "",
        ]
    )
    for class_model in model.classes:
        lines.extend(
            [
                f"static void {_capsule_destructor_name(class_model)}(PyObject* capsule) {{",
                f"    auto* handle = static_cast<{_class_c_type(class_model, model)}*>(PyCapsule_GetPointer(capsule, {_capsule_name_symbol(class_model)}));",
                "    if (handle != nullptr) {",
                f"        {model.c_prefix}_{_class_c_identifier(class_model, model)}_free(handle);",
                "    }",
                "    PyErr_Clear();",
                "}",
                "",
            ]
        )
    for variant in _all_variants(model):
        lines.append(f"static PyObject* py_{variant.api_name}(PyObject*, PyObject* args) {{")
        parse_format: list[str] = []
        parse_targets: list[str] = []
        call_arguments: list[str] = []
        if variant.callable.kind == "method":
            lines.append("    PyObject* self_capsule = nullptr;")
            lines.append(f"    auto* handle = static_cast<{_class_c_type(variant.owner, model)}*>(nullptr);")
            parse_format.append("O")
            parse_targets.append("&self_capsule")
        for parameter in variant.parameters:
            if parameter.adapter == "string":
                lines.append(f"    const char* {parameter.name} = nullptr;")
                parse_format.append("s")
                parse_targets.append(f"&{parameter.name}")
            elif parameter.adapter == "bool":
                lines.append(f"    int {parameter.name} = 0;")
                parse_format.append("p")
                parse_targets.append(f"&{parameter.name}")
            elif parameter.adapter == "integer" or is_enum_adapter(parameter.adapter):
                lines.append(f"    int {parameter.name} = 0;")
                parse_format.append("i")
                parse_targets.append(f"&{parameter.name}")
            elif is_handle_adapter(parameter.adapter):
                target = class_models[handle_adapter_target(parameter.adapter)]
                lines.append(f"    PyObject* {parameter.name}_capsule = nullptr;")
                lines.append(f"    auto* {parameter.name} = static_cast<{_class_c_type(target, model)}*>(nullptr);")
                parse_format.append("O")
                parse_targets.append(f"&{parameter.name}_capsule")
            else:
                raise RuntimeError(f"Unsupported parameter adapter in Python extension emitter: {parameter.adapter}")
        if parse_targets:
            lines.append(f'    if (!PyArg_ParseTuple(args, "{"".join(parse_format)}", {", ".join(parse_targets)})) {{')
        else:
            lines.append('    if (!PyArg_ParseTuple(args, "")) {')
        lines.append("        return nullptr;")
        lines.append("    }")
        if variant.callable.kind == "method":
            lines.append(
                f"    handle = static_cast<{_class_c_type(variant.owner, model)}*>(PyCapsule_GetPointer(self_capsule, {_capsule_name_symbol(variant.owner)}));"
            )
            lines.append("    if (handle == nullptr) {")
            lines.append("        return nullptr;")
            lines.append("    }")
            call_arguments.append("handle")
        for parameter in variant.parameters:
            if is_handle_adapter(parameter.adapter):
                target = class_models[handle_adapter_target(parameter.adapter)]
                lines.append(
                    f"    {parameter.name} = static_cast<{_class_c_type(target, model)}*>(PyCapsule_GetPointer({parameter.name}_capsule, {_capsule_name_symbol(target)}));"
                )
                lines.append(f"    if ({parameter.name} == nullptr) {{")
                lines.append("        return nullptr;")
                lines.append("    }")
            call_arguments.append(_extension_native_argument(parameter, model))
        native_call = f"{model.c_prefix}_{variant.api_name}({', '.join(call_arguments)})"
        if variant.callable.return_adapter == "string":
            lines.append(f"    char* result = {native_call};")
            lines.append("    if (result == nullptr) {")
            lines.append('        return raise_last_error("Native call failed");')
            lines.append("    }")
            lines.append("    PyObject* value = PyUnicode_FromString(result);")
            lines.append("    ifcopenshell_string_free(result);")
            lines.append("    return value;")
        elif variant.callable.return_adapter == "integer":
            lines.append(f"    int result = {native_call};")
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append('        return raise_last_error("Native call failed");')
            lines.append("    }")
            lines.append("    return PyLong_FromLong(result);")
        elif variant.callable.return_adapter == "bool":
            lines.append(f"    bool result = {native_call};")
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append('        return raise_last_error("Native call failed");')
            lines.append("    }")
            lines.append("    return PyBool_FromLong(result ? 1 : 0);")
        elif variant.callable.return_adapter == "void":
            lines.append(f"    {native_call};")
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append('        return raise_last_error("Native call failed");')
            lines.append("    }")
            lines.append("    Py_RETURN_NONE;")
        elif is_enum_adapter(variant.callable.return_adapter):
            lines.append(f"    int result = {native_call};")
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append('        return raise_last_error("Native call failed");')
            lines.append("    }")
            lines.append("    return PyLong_FromLong(result);")
        elif is_handle_adapter(variant.callable.return_adapter):
            target = class_models[handle_adapter_target(variant.callable.return_adapter)]
            lines.append(f"    auto* result = {native_call};")
            lines.append("    if (result == nullptr) {")
            lines.append('        return raise_last_error("Native call failed");')
            lines.append("    }")
            lines.append(
                f"    return PyCapsule_New(result, {_capsule_name_symbol(target)}, {_capsule_destructor_name(target)});"
            )
        elif is_sequence_adapter(variant.callable.return_adapter):
            target = class_models[sequence_adapter_target(variant.callable.return_adapter)]
            list_prefix = f"{model.c_prefix}_{_class_c_identifier(target, model)}_list"
            lines.append(f"    auto* result = {native_call};")
            lines.append("    if (result == nullptr) {")
            lines.append('        return raise_last_error("Native call failed");')
            lines.append("    }")
            lines.append(f"    int size = {list_prefix}_size(result);")
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append(f"        {list_prefix}_free(result);")
            lines.append('        return raise_last_error("Native call failed");')
            lines.append("    }")
            lines.append("    PyObject* values = PyList_New(size);")
            lines.append("    if (values == nullptr) {")
            lines.append(f"        {list_prefix}_free(result);")
            lines.append("        return nullptr;")
            lines.append("    }")
            lines.append("    for (int index = 0; index < size; ++index) {")
            lines.append(f"        auto* item = {list_prefix}_get(result, index);")
            lines.append("        if (item == nullptr) {")
            lines.append("            Py_DECREF(values);")
            lines.append(f"            {list_prefix}_free(result);")
            lines.append('            return raise_last_error("Native call failed");')
            lines.append("        }")
            lines.append(
                f"        PyObject* capsule = PyCapsule_New(item, {_capsule_name_symbol(target)}, {_capsule_destructor_name(target)});"
            )
            lines.append("        if (capsule == nullptr) {")
            lines.append(f"            {model.c_prefix}_{_class_c_identifier(target, model)}_free(item);")
            lines.append("            Py_DECREF(values);")
            lines.append(f"            {list_prefix}_free(result);")
            lines.append("            return nullptr;")
            lines.append("        }")
            lines.append("        PyList_SET_ITEM(values, index, capsule);")
            lines.append("    }")
            lines.append(f"    {list_prefix}_free(result);")
            lines.append("    return values;")
        else:
            raise RuntimeError(
                f"Unsupported return adapter in Python extension emitter: {variant.callable.return_adapter}"
            )
        lines.append("}")
        lines.append("")
    lines.extend(["static PyMethodDef MODULE_METHODS[] = {"])
    for variant in _all_variants(model):
        lines.append(f'    {{"{variant.api_name}", py_{variant.api_name}, METH_VARARGS, nullptr}},')
    lines.extend(
        [
            "    {nullptr, nullptr, 0, nullptr},",
            "};",
            "",
            "static PyModuleDef MODULE_DEF = {",
            "    PyModuleDef_HEAD_INIT,",
            f'    "_{model.module_name}",',
            "    nullptr,",
            "    -1,",
            "    MODULE_METHODS,",
            "};",
            "",
            f"PyMODINIT_FUNC PyInit__{model.module_name}(void) {{",
            "    PyObject* module = PyModule_Create(&MODULE_DEF);",
            "    if (module == nullptr) {",
            "        return nullptr;",
            "    }",
        ]
    )
    for enum_model in model.enums:
        for value in enum_model.values:
            lines.append(f'    if (PyModule_AddIntConstant(module, "{value.name}", {value.c_name}) < 0) {{')
            lines.append("        Py_DECREF(module);")
            lines.append("        return nullptr;")
            lines.append("    }")
    lines.extend(["    return module;", "}", ""])
    return "\n".join(lines)


def _python_type_for_parameter(parameter: ParameterModel, model: ModuleModel) -> str:
    if parameter.adapter == "string":
        return "str"
    if parameter.adapter == "integer":
        return "int"
    if parameter.adapter == "bool":
        return "bool"
    if is_enum_adapter(parameter.adapter):
        return _enum_index(model)[enum_adapter_target(parameter.adapter)].py_name
    if is_handle_adapter(parameter.adapter):
        return _class_index(model)[handle_adapter_target(parameter.adapter)].py_name
    return "object"


def _python_type_for_return(adapter: str, model: ModuleModel) -> str:
    if adapter == "string":
        return "str"
    if adapter == "integer":
        return "int"
    if adapter == "bool":
        return "bool"
    if adapter == "void":
        return "None"
    if is_enum_adapter(adapter):
        return _enum_index(model)[enum_adapter_target(adapter)].py_name
    if is_handle_adapter(adapter):
        return _class_index(model)[handle_adapter_target(adapter)].py_name
    if is_sequence_adapter(adapter):
        target = _class_index(model)[sequence_adapter_target(adapter)]
        return f"list[{target.py_name}]"
    return "object"


def _python_parameter_signature(parameter: ParameterModel, model: ModuleModel) -> str:
    signature = f"{parameter.name}: {_python_type_for_parameter(parameter, model)}"
    if parameter.default_python_value is not None:
        signature += f" = {parameter.default_python_value}"
    return signature


def _python_native_argument(parameter: ParameterModel) -> str:
    if is_enum_adapter(parameter.adapter):
        return f"int({parameter.name})"
    if is_handle_adapter(parameter.adapter):
        return f"{parameter.name}._handle"
    return parameter.name


def _extension_native_argument(parameter: ParameterModel, model: ModuleModel) -> str:
    if is_enum_adapter(parameter.adapter):
        return f"static_cast<{_enum_c_type(parameter.adapter, model)}>({parameter.name})"
    return parameter.name


def _emit_python_return(
    lines: list[str],
    call_expression: str,
    adapter: str,
    model: ModuleModel,
    indent: str,
) -> None:
    if adapter in {"string", "integer", "bool"}:
        lines.append(f"{indent}return {call_expression}")
        return
    if adapter == "void":
        lines.append(f"{indent}{call_expression}")
        lines.append(f"{indent}return None")
        return
    if is_enum_adapter(adapter):
        enum_model = _enum_index(model)[enum_adapter_target(adapter)]
        lines.append(f"{indent}return {enum_model.py_name}({call_expression})")
        return
    if is_handle_adapter(adapter):
        target = _class_index(model)[handle_adapter_target(adapter)]
        lines.append(f"{indent}return {target.py_name}({call_expression})")
        return
    if is_sequence_adapter(adapter):
        target = _class_index(model)[sequence_adapter_target(adapter)]
        lines.append(f"{indent}return [{target.py_name}(item) for item in {call_expression}]")
        return
    raise RuntimeError(f"Unsupported return adapter in Python facade emitter: {adapter}")


def emit_python_facade(model: ModuleModel) -> str:
    lines = [
        "from __future__ import annotations",
        "",
        "from enum import IntEnum",
        "",
        f"import _{model.module_name} as _native",
        "",
    ]
    for enum_model in model.enums:
        lines.append(f"class {enum_model.py_name}(IntEnum):")
        for value in enum_model.values:
            lines.append(f"    {value.name} = _native.{value.name}")
        lines.append("")
    for class_model in model.classes:
        lines.append(f"class {class_model.py_name}:")
        lines.append('    __slots__ = ("_handle",)')
        lines.append("")
        lines.append("    def __init__(self, handle) -> None:")
        lines.append("        self._handle = handle")
        lines.append("")
        for callable_model in class_model.callables:
            parameters = ", ".join(
                _python_parameter_signature(parameter, model) for parameter in callable_model.parameters
            )
            full_variant = _full_variant(class_model, callable_model)
            call_arguments = ", ".join(_python_native_argument(parameter) for parameter in callable_model.parameters)
            return_annotation = _python_type_for_return(callable_model.return_adapter, model)
            if callable_model.kind == "constructor":
                lines.append("    @staticmethod")
                lines.append(f"    def {callable_model.py_name}({parameters}) -> {class_model.py_name}:")
                native_call = f"_native.{full_variant.api_name}({call_arguments})"
                _emit_python_return(lines, native_call, callable_model.return_adapter, model, "        ")
            else:
                signature = f"self, {parameters}" if parameters else "self"
                separator = ", " if call_arguments else ""
                native_call = f"_native.{full_variant.api_name}(self._handle{separator}{call_arguments})"
                lines.append(f"    def {callable_model.py_name}({signature}) -> {return_annotation}:")
                _emit_python_return(lines, native_call, callable_model.return_adapter, model, "        ")
            lines.append("")
        if not class_model.callables:
            lines.append("    pass")
            lines.append("")
    return "\n".join(lines)


def _napi_finalizer_name(class_model: ClassModel) -> str:
    return f"{normalize_identifier(class_model.cpp_name)}_finalize"


def _napi_wrap_name(class_model: ClassModel) -> str:
    return f"wrap_{normalize_identifier(class_model.cpp_name)}"


def _napi_unwrap_name(class_model: ClassModel) -> str:
    return f"unwrap_{normalize_identifier(class_model.cpp_name)}"


def _napi_variant_to_js_name(variant_model: VariantAdapterModel) -> str:
    return f"{_variant_type_base(variant_model)}_to_js"


def _napi_variant_from_js_name(variant_model: VariantAdapterModel) -> str:
    return f"{_variant_type_base(variant_model)}_from_js"


def _emit_napi_variant_helpers(lines: list[str], model: ModuleModel, class_models: dict[str, ClassModel]) -> None:
    """Recursive JS<->C-ABI-struct conversion helpers, one pair per variant adapter --
    the N-API-layer counterpart to `_emit_variant_helper_functions` (which handles the
    C-ABI-struct<->native-shim-value conversion one layer further down). Replaces what
    used to be inline, per-callable code duplicated at every call site; recursion (the
    "sequence" field_kind case, i.e. `ATTRIBUTE_VALUE_KIND_AGGREGATE`) is exactly why
    that inline approach stopped being tenable -- a JS array of arbitrarily-nested JS
    arrays needs a function that can call itself, not a flat per-case switch.
    """
    for variant_model in model.variant_adapters:
        c_type = variant_model.c_type_name
        to_js = _napi_variant_to_js_name(variant_model)
        from_js = _napi_variant_from_js_name(variant_model)

        # GET direction: C-ABI struct -> plain JS value (a JS array for the AGGREGATE
        # case, matching Python's `get_argument` ergonomics -- a real list, not a
        # wrapper object the caller has to unpack).
        lines.append(f"napi_value {to_js}(napi_env env, const {c_type}& value) {{")
        lines.append("    napi_value js_result;")
        lines.append(f"    switch (value.{variant_model.kind_field}) {{")
        for case in variant_model.cases:
            if case.kind_name == "NULL":
                # Deliberately falls through to `default:` below (`napi_get_null`) -- a
                # JS `null`, matching Python's `None`, is exactly what an unset/blank
                # attribute value should read back as (see the historical note this
                # replaces, `06-wrappergen-spike-results.md`).
                continue
            lines.append(f"    case {case.kind_c_name}:")
            if case.field_kind == "string":
                lines.append(f"        napi_create_string_utf8(env, value.{case.field}, NAPI_AUTO_LENGTH, &js_result);")
            elif case.field_kind == "handle":
                target = class_models[case.handle_target]
                lines.append(f"        js_result = {_napi_wrap_name(target)}(env, value.{case.field});")
            elif case.field_kind == "double":
                lines.append(f"        napi_create_double(env, value.{case.field}, &js_result);")
            elif case.field_kind == "sequence":
                lines.append(f"        napi_create_array_with_length(env, value.{case.field}_count, &js_result);")
                lines.append(f"        for (int index = 0; index < value.{case.field}_count; ++index) {{")
                lines.append(f"            napi_set_element(env, js_result, index, {to_js}(env, value.{case.field}[index]));")
                lines.append("        }")
            elif case.kind_name == "BOOL":
                lines.append(f"        napi_get_boolean(env, value.{case.field} != 0, &js_result);")
            else:
                lines.append(f"        napi_create_int64(env, value.{case.field}, &js_result);")
            lines.append("        break;")
        lines.append("    default:")
        lines.append("        napi_get_null(env, &js_result);")
        lines.append("        break;")
        lines.append("    }")
        lines.append("    return js_result;")
        lines.append("}")
        lines.append("")

        # SET/parameter direction: a `{kind, ...}` JS object -> C-ABI struct. String
        # fields are heap-duplicated (not borrowed from a temporary) so the *same*
        # `{variant}_free_contents` (emit_c_api_implementation) safely releases them
        # regardless of which direction produced the value -- see that function's
        # doc comment for why a `handle`-kind field is never freed here either
        # (borrowed from the caller, who still owns and will keep using it).
        lines.append(f"{c_type} {from_js}(napi_env env, napi_value value) {{")
        lines.append(f"    {c_type} result{{}};")
        lines.append("    napi_value kind_prop;")
        lines.append('    napi_get_named_property(env, value, "kind", &kind_prop);')
        lines.append("    int32_t kind_int = 0;")
        lines.append("    napi_get_value_int32(env, kind_prop, &kind_int);")
        lines.append(
            f"    result.{variant_model.kind_field} = static_cast<decltype(result.{variant_model.kind_field})>(kind_int);"
        )
        lines.append("    switch (kind_int) {")
        for case in variant_model.cases:
            prop_name = normalize_identifier(case.field)
            lines.append(f"    case {case.kind_c_name}: {{")
            lines.append("        napi_value prop;")
            lines.append(f'        napi_get_named_property(env, value, "{prop_name}", &prop);')
            if case.field_kind == "string":
                lines.append(f"        result.{case.field} = napi_duplicate_js_string(env, prop);")
            elif case.field_kind == "handle":
                target = class_models[case.handle_target]
                lines.append(f"        result.{case.field} = {_napi_unwrap_name(target)}(env, prop);")
            elif case.field_kind == "double":
                lines.append(f"        double element_value = 0;")
                lines.append("        napi_get_value_double(env, prop, &element_value);")
                lines.append(f"        result.{case.field} = element_value;")
            elif case.field_kind == "sequence":
                lines.append("        uint32_t length = 0;")
                lines.append("        napi_get_array_length(env, prop, &length);")
                lines.append(f"        result.{case.field}_count = static_cast<int>(length);")
                lines.append(
                    f"        result.{case.field} = length > 0 ? new {c_type}[length] : nullptr;"
                )
                lines.append("        for (uint32_t index = 0; index < length; ++index) {")
                lines.append("            napi_value element;")
                lines.append("            napi_get_element(env, prop, index, &element);")
                lines.append(f"            result.{case.field}[index] = {from_js}(env, element);")
                lines.append("        }")
            else:
                lines.append("        int64_t element_value = 0;")
                lines.append("        napi_get_value_int64(env, prop, &element_value);")
                lines.append(f"        result.{case.field} = element_value;")
            lines.append("        break;")
            lines.append("    }")
        lines.append("    default:")
        lines.append("        break;")
        lines.append("    }")
        lines.append("    return result;")
        lines.append("}")
        lines.append("")


def emit_napi_extension(model: ModuleModel) -> str:
    """N-API C++ glue -- structurally parallel to `emit_python_extension`: the same
    per-class/per-callable walk over the same `ModuleModel`/`_all_variants(model)`,
    replacing `PyArg_ParseTuple`/`PyCapsule_New`/`PyCapsule_GetPointer` with N-API's
    `napi_get_cb_info`/`napi_create_external`/`napi_get_value_external`. Handles are kept
    as flat opaque JS "external" values (N-API's PyCapsule analogue, including a
    finalizer callback for cleanup) rather than real JS classes -- exactly like the
    Python extension, the friendly per-language class shape is the facade's job
    (`emit_typescript_facade`), not this layer's.
    """
    class_models = _class_index(model)
    lines = [
        "#include <node_api.h>",
        "",
        f'#include "{model.api_header_name}"',
        "",
        "#include <cstring>",
        "#include <string>",
        "",
        "namespace {",
        "",
        "napi_value throw_last_error(napi_env env, const char* fallback_message) {",
        "    const char* message = ifcopenshell_last_error_message();",
        "    napi_throw_error(env, nullptr, message ? message : fallback_message);",
        "    return nullptr;",
        "}",
        "",
        "std::string napi_string_value(napi_env env, napi_value value) {",
        "    size_t length = 0;",
        "    napi_get_value_string_utf8(env, value, nullptr, 0, &length);",
        "    std::string result(length, '\\0');",
        "    napi_get_value_string_utf8(env, value, result.data(), length + 1, &length);",
        "    return result;",
        "}",
        "",
        "char* napi_duplicate_js_string(napi_env env, napi_value value) {",
        "    std::string owned = napi_string_value(env, value);",
        "    auto* buffer = new char[owned.size() + 1];",
        "    std::memcpy(buffer, owned.c_str(), owned.size() + 1);",
        "    return buffer;",
        "}",
        "",
    ]
    for class_model in model.classes:
        lines.extend(
            [
                f"void {_napi_finalizer_name(class_model)}(napi_env, void* data, void*) {{",
                f"    {model.c_prefix}_{_class_c_identifier(class_model, model)}_free(static_cast<{_class_c_type(class_model, model)}*>(data));",
                "}",
                "",
                f"napi_value {_napi_wrap_name(class_model)}(napi_env env, {_class_c_type(class_model, model)}* handle) {{",
                "    if (handle == nullptr) {",
                "        napi_value null_value;",
                "        napi_get_null(env, &null_value);",
                "        return null_value;",
                "    }",
                "    napi_value result;",
                f"    napi_create_external(env, handle, {_napi_finalizer_name(class_model)}, nullptr, &result);",
                "    return result;",
                "}",
                "",
                f"{_class_c_type(class_model, model)}* {_napi_unwrap_name(class_model)}(napi_env env, napi_value value) {{",
                "    void* data = nullptr;",
                "    napi_get_value_external(env, value, &data);",
                f"    return static_cast<{_class_c_type(class_model, model)}*>(data);",
                "}",
                "",
            ]
        )
    if model.variant_adapters:
        _emit_napi_variant_helpers(lines, model, class_models)
    for variant in _all_variants(model):
        lines.append(f"napi_value napi_{variant.api_name}(napi_env env, napi_callback_info info) {{")
        argument_count = len(variant.parameters) + (1 if variant.callable.kind in {"method", "free_function"} else 0)
        lines.append(f"    size_t argc = {max(argument_count, 1)};")
        lines.append(f"    napi_value argv[{max(argument_count, 1)}];")
        lines.append("    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);")
        argument_index = 0
        call_arguments: list[str] = []
        variant_parameters_to_free: list[tuple[str, VariantAdapterModel]] = []
        if variant.callable.kind in {"method", "free_function"}:
            lines.append(
                f"    auto* handle = {_napi_unwrap_name(class_models[variant.owner.cpp_name])}(env, argv[{argument_index}]);"
            )
            call_arguments.append("handle")
            argument_index += 1
        for parameter in variant.parameters:
            js_name = f"js_{parameter.name}"
            if parameter.adapter == "string":
                lines.append(f"    std::string {js_name} = napi_string_value(env, argv[{argument_index}]);")
                call_arguments.append(f"{js_name}.c_str()")
            elif parameter.adapter == "buffer":
                lines.append(f"    void* {js_name} = nullptr;")
                lines.append(f"    size_t {js_name}_length = 0;")
                lines.append(f"    napi_get_buffer_info(env, argv[{argument_index}], &{js_name}, &{js_name}_length);")
                call_arguments.append(f"static_cast<const char*>({js_name})")
            elif parameter.adapter == "integer":
                lines.append(f"    int32_t {js_name} = 0;")
                lines.append(f"    napi_get_value_int32(env, argv[{argument_index}], &{js_name});")
                call_arguments.append(js_name)
            elif parameter.adapter == "bool":
                lines.append(f"    bool {js_name} = false;")
                lines.append(f"    napi_get_value_bool(env, argv[{argument_index}], &{js_name});")
                call_arguments.append(js_name)
            elif is_enum_adapter(parameter.adapter):
                lines.append(f"    int32_t {js_name} = 0;")
                lines.append(f"    napi_get_value_int32(env, argv[{argument_index}], &{js_name});")
                call_arguments.append(f"static_cast<{_enum_c_type(parameter.adapter, model)}>({js_name})")
            elif is_handle_adapter(parameter.adapter):
                target = class_models[handle_adapter_target(parameter.adapter)]
                lines.append(f"    auto* {js_name} = {_napi_unwrap_name(target)}(env, argv[{argument_index}]);")
                call_arguments.append(js_name)
            elif is_variant_adapter(parameter.adapter):
                variant_model = _variant_model(parameter.adapter, model)
                lines.append(
                    f"    {variant_model.c_type_name} {js_name} = {_napi_variant_from_js_name(variant_model)}(env, argv[{argument_index}]);"
                )
                call_arguments.append(js_name)
                variant_parameters_to_free.append((js_name, variant_model))
            else:
                raise RuntimeError(f"Unsupported parameter adapter in N-API extension emitter: {parameter.adapter}")
            argument_index += 1
        native_call = f"{model.c_prefix}_{variant.api_name}({', '.join(call_arguments)})"
        # Freed right after `native_call` runs, in every branch below, regardless of
        # outcome: the C API function received these C-ABI structs *by value*, so by
        # the time it has returned it has already deep-copied anything it needed
        # (`_variant_to_native_name`'s helper) -- the heap strings/nested arrays this
        # N-API function allocated while parsing `argv` (`{variant}_from_js`) are safe
        # to release immediately, whether or not the call itself threw.
        free_variant_parameter_lines = [
            f"    {_variant_free_contents_name(variant_model)}({js_name});"
            for js_name, variant_model in variant_parameters_to_free
        ]
        if variant.callable.return_adapter == "string":
            lines.append(f"    char* result = {native_call};")
            lines.extend(free_variant_parameter_lines)
            lines.append("    if (result == nullptr) {")
            lines.append('        return throw_last_error(env, "Native call failed");')
            lines.append("    }")
            lines.append("    napi_value js_result;")
            lines.append("    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);")
            lines.append("    ifcopenshell_string_free(result);")
            lines.append("    return js_result;")
        elif variant.callable.return_adapter == "integer":
            lines.append(f"    int result = {native_call};")
            lines.extend(free_variant_parameter_lines)
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append('        return throw_last_error(env, "Native call failed");')
            lines.append("    }")
            lines.append("    napi_value js_result;")
            lines.append("    napi_create_int64(env, result, &js_result);")
            lines.append("    return js_result;")
        elif variant.callable.return_adapter == "bool":
            lines.append(f"    bool result = {native_call};")
            lines.extend(free_variant_parameter_lines)
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append('        return throw_last_error(env, "Native call failed");')
            lines.append("    }")
            lines.append("    napi_value js_result;")
            lines.append("    napi_get_boolean(env, result, &js_result);")
            lines.append("    return js_result;")
        elif variant.callable.return_adapter == "void":
            lines.append(f"    {native_call};")
            lines.extend(free_variant_parameter_lines)
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append('        return throw_last_error(env, "Native call failed");')
            lines.append("    }")
            lines.append("    napi_value js_undefined;")
            lines.append("    napi_get_undefined(env, &js_undefined);")
            lines.append("    return js_undefined;")
        elif is_enum_adapter(variant.callable.return_adapter):
            lines.append(f"    int result = {native_call};")
            lines.extend(free_variant_parameter_lines)
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append('        return throw_last_error(env, "Native call failed");')
            lines.append("    }")
            lines.append("    napi_value js_result;")
            lines.append("    napi_create_int32(env, result, &js_result);")
            lines.append("    return js_result;")
        elif is_handle_adapter(variant.callable.return_adapter):
            target = class_models[handle_adapter_target(variant.callable.return_adapter)]
            lines.append(f"    auto* result = {native_call};")
            lines.extend(free_variant_parameter_lines)
            lines.append("    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {")
            lines.append('        return throw_last_error(env, "Native call failed");')
            lines.append("    }")
            lines.append(f"    return {_napi_wrap_name(target)}(env, result);")
        elif is_sequence_adapter(variant.callable.return_adapter):
            target = class_models[sequence_adapter_target(variant.callable.return_adapter)]
            list_prefix = f"{model.c_prefix}_{_class_c_identifier(target, model)}_list"
            lines.append(f"    auto* result = {native_call};")
            lines.extend(free_variant_parameter_lines)
            lines.append("    if (result == nullptr) {")
            lines.append('        return throw_last_error(env, "Native call failed");')
            lines.append("    }")
            lines.append(f"    int size = {list_prefix}_size(result);")
            lines.append("    napi_value js_result;")
            lines.append("    napi_create_array_with_length(env, size, &js_result);")
            lines.append("    for (int index = 0; index < size; ++index) {")
            lines.append(f"        auto* item = {list_prefix}_get(result, index);")
            lines.append(f"        napi_set_element(env, js_result, index, {_napi_wrap_name(target)}(env, item));")
            lines.append("    }")
            lines.append(f"    {list_prefix}_free(result);")
            lines.append("    return js_result;")
        elif is_variant_adapter(variant.callable.return_adapter):
            variant_model = _variant_model(variant.callable.return_adapter, model)
            free_contents = _variant_free_contents_name(variant_model)
            lines.append(f"    {variant_model.c_type_name} result = {native_call};")
            lines.extend(free_variant_parameter_lines)
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append(f"        {free_contents}(result);")
            lines.append('        return throw_last_error(env, "Native call failed");')
            lines.append("    }")
            lines.append(f"    napi_value js_result = {_napi_variant_to_js_name(variant_model)}(env, result);")
            lines.append(f"    {free_contents}(result);")
            lines.append("    return js_result;")
        elif is_sequence_of_variant_adapter(variant.callable.return_adapter):
            variant_model = _sequence_of_variant_model(variant.callable.return_adapter, model)
            list_type = _variant_list_c_type(variant_model)
            list_free = _variant_list_free_name(variant_model)
            to_js = _napi_variant_to_js_name(variant_model)
            lines.append(f"    {list_type} result = {native_call};")
            lines.extend(free_variant_parameter_lines)
            lines.append("    if (ifcopenshell_last_error_message() != nullptr) {")
            lines.append(f"        {list_free}(result);")
            lines.append('        return throw_last_error(env, "Native call failed");')
            lines.append("    }")
            lines.append("    napi_value js_result;")
            lines.append("    napi_create_array_with_length(env, result.count, &js_result);")
            lines.append("    for (int index = 0; index < result.count; ++index) {")
            lines.append(f"        napi_set_element(env, js_result, index, {to_js}(env, result.items[index]));")
            lines.append("    }")
            lines.append(f"    {list_free}(result);")
            lines.append("    return js_result;")
        else:
            raise RuntimeError(
                f"Unsupported return adapter in N-API extension emitter: {variant.callable.return_adapter}"
            )
        lines.append("}")
        lines.append("")
    lines.append("}  // namespace")
    lines.append("")
    lines.append("napi_value Init(napi_env env, napi_value exports) {")
    for variant in _all_variants(model):
        lines.append(f"    {{")
        lines.append("        napi_value fn;")
        lines.append(
            f'        napi_create_function(env, "{variant.api_name}", NAPI_AUTO_LENGTH, napi_{variant.api_name}, nullptr, &fn);'
        )
        lines.append(f'        napi_set_named_property(env, exports, "{variant.api_name}", fn);')
        lines.append("    }")
    for enum_model in model.enums:
        for value in enum_model.values:
            lines.append("    {")
            lines.append("        napi_value value;")
            lines.append(f"        napi_create_int32(env, {value.c_name}, &value);")
            lines.append(f'        napi_set_named_property(env, exports, "{value.name}", value);')
            lines.append("    }")
    for variant_model in model.variant_adapters:
        for case in variant_model.cases:
            lines.append("    {")
            lines.append("        napi_value value;")
            lines.append(f"        napi_create_int32(env, {case.kind_c_name}, &value);")
            lines.append(f'        napi_set_named_property(env, exports, "{case.kind_name}", value);')
            lines.append("    }")
    lines.append("    return exports;")
    lines.append("}")
    lines.append("")
    lines.append("NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)")
    lines.append("")
    return "\n".join(lines)


def _ts_type_for_parameter(parameter: ParameterModel, model: ModuleModel) -> str:
    if parameter.adapter == "string":
        return "string"
    if parameter.adapter in {"integer"} or is_enum_adapter(parameter.adapter):
        return "number"
    if parameter.adapter == "bool":
        return "boolean"
    if parameter.adapter == "buffer":
        return "Buffer"
    if is_handle_adapter(parameter.adapter):
        return _class_index(model)[handle_adapter_target(parameter.adapter)].py_name
    if is_variant_adapter(parameter.adapter):
        return pascal_case(_variant_model(parameter.adapter, model).c_type_name)
    return "unknown"


def _ts_type_for_return(adapter: str, model: ModuleModel) -> str:
    if adapter == "string":
        return "string"
    if adapter == "integer" or is_enum_adapter(adapter):
        return "number"
    if adapter == "bool":
        return "boolean"
    if adapter == "void":
        return "void"
    if is_handle_adapter(adapter):
        return _class_index(model)[handle_adapter_target(adapter)].py_name
    if is_sequence_adapter(adapter):
        target = _class_index(model)[sequence_adapter_target(adapter)]
        return f"{target.py_name}[]"
    if is_variant_adapter(adapter):
        # Faithful to Python's `get_argument`/`set_attribute_value_py` ergonomics on the
        # *return* side (research/01-python-core-and-lowlevel.md SS5): a plain value of
        # whatever JS type the attribute's runtime kind actually is, not a wrapper object.
        variant_model = _variant_model(adapter, model)
        handle_case_types = {
            _class_index(model)[case.handle_target].py_name
            for case in variant_model.cases
            if case.field_kind == "handle"
        }
        alternatives = ["string", "number", "boolean", *sorted(handle_case_types), "null"]
        return " | ".join(alternatives)
    return "unknown"


def _ts_native_argument(parameter: ParameterModel) -> str:
    """Mirrors `_python_native_argument`: a handle-typed parameter's *facade* value is
    a class instance (`{ _handle, ... }`), not the raw native external the underlying
    N-API function actually expects -- must be unwrapped via `._handle` before the
    call, exactly like the Python facade already does. Found missing by actually
    running a generated facade through `vitest` (not by compiling it -- TypeScript
    has no way to catch "passed the wrong shape of object to an untyped `native.*`
    call" on its own): every facade method taking another class as a parameter
    (e.g. `file.create_with_declaration_instance_id(declaration, ...)`) was passing
    the whole wrapper object through, and the N-API layer's `napi_get_value_external`
    fails non-fatally on a non-external value, producing a null handle and "Null
    handle parameter received" at the C API boundary -- a real, disclosed
    generator bug this PR fixes, not a pre-existing, deliberately-scoped-out gap.
    """
    if is_handle_adapter(parameter.adapter):
        return f"{parameter.name}._handle"
    return parameter.name


def emit_typescript_facade(model: ModuleModel) -> str:
    """TypeScript facade -- structurally parallel to `emit_python_facade`: the same
    per-`ClassModel`/`CallableModel` walk, replacing Python's `__slots__` class
    generation with a TS class-with-a-private-handle-field, emitting `.d.ts`-friendly
    signatures directly rather than Python type hints.

    Imports the raw native module from a sibling `./native_loader` rather than a
    literal relative path to the compiled `.node` file itself: a real npm package has
    at least two different layouts the compiled addon can live under relative to this
    file (a source tree used directly by a test runner vs. a `tsc`-compiled `dist/`
    tree, which may not even preserve this file's directory depth) -- exactly the
    problem Phase 0's hand-written `native.ts` already solved with an absolute,
    package-root-relative `require()` rather than a relative import. `./native_loader`
    is a fixed, small integration contract: whoever places this generated file into a
    real package provides one small hand-written sibling module exporting `native`
    (the loaded addon) however is correct for that package's own layout -- this
    generated file itself stays honestly reusable across different consumers instead
    of baking in one specific (and, per the spike, untested-in-a-real-package)
    assumption.
    """
    lines = [
        "// AUTO-GENERATED by wrappergen's `emit_typescript_facade` -- do not edit by hand.",
        'import { native } from "./native_loader";',
        "",
    ]
    for variant_model in model.variant_adapters:
        lines.append(f"export type {pascal_case(variant_model.c_type_name)} = {{")
        lines.append(f"    kind: number;")
        seen_fields: set[str] = set()
        for case in variant_model.cases:
            if case.field in seen_fields:
                continue
            seen_fields.add(case.field)
            # A "sequence" field_kind case (ATTRIBUTE_VALUE_KIND_AGGREGATE) is a JS
            # array of the same recursive shape, potentially nested -- the exact
            # element type isn't expressible without a self-referential alias, so
            # `unknown[]` (still distinguishing "array" from every scalar field
            # below) is as precise as this generated type gets without one.
            field_type = f"{pascal_case(variant_model.c_type_name)}[]" if case.field_kind == "sequence" else "unknown"
            lines.append(f"    {normalize_identifier(case.field)}?: {field_type};")
        lines.append("};")
        lines.append("")
    for class_model in model.classes:
        lines.append(f"export class {class_model.py_name} {{")
        lines.append("    /** @internal */ readonly _handle: unknown;")
        lines.append("    /** @internal */ constructor(handle: unknown) {")
        lines.append("        this._handle = handle;")
        lines.append("    }")
        lines.append("")
        for callable_model in class_model.callables:
            full_variant = _full_variant(class_model, callable_model)
            parameters = ", ".join(
                f"{parameter.name}: {_ts_type_for_parameter(parameter, model)}"
                for parameter in callable_model.parameters
            )
            call_arguments = ", ".join(_ts_native_argument(parameter) for parameter in callable_model.parameters)
            if callable_model.kind == "constructor":
                lines.append(f"    static {callable_model.py_name}({parameters}): {class_model.py_name} {{")
                lines.append(
                    f"        return new {class_model.py_name}(native.{full_variant.api_name}({call_arguments}));"
                )
                lines.append("    }")
            else:
                return_type = _ts_type_for_return(callable_model.return_adapter, model)
                lines.append(f"    {callable_model.py_name}({parameters}): {return_type} {{")
                separator = ", " if call_arguments else ""
                native_call = f"native.{full_variant.api_name}(this._handle{separator}{call_arguments})"
                if callable_model.return_adapter == "void":
                    lines.append(f"        {native_call};")
                elif is_handle_adapter(callable_model.return_adapter):
                    target = _class_index(model)[handle_adapter_target(callable_model.return_adapter)]
                    lines.append(f"        const result = {native_call};")
                    lines.append(
                        f"        return result === null ? null as unknown as {target.py_name} : new {target.py_name}(result);"
                    )
                elif is_sequence_adapter(callable_model.return_adapter):
                    target = _class_index(model)[sequence_adapter_target(callable_model.return_adapter)]
                    lines.append(f"        const result = {native_call} as unknown[];")
                    lines.append(f"        return result.map((item) => new {target.py_name}(item));")
                else:
                    lines.append(f"        return {native_call};")
                lines.append("    }")
            lines.append("")
        lines.append("}")
        lines.append("")
    return "\n".join(lines)


def write_module_outputs(model: ModuleModel, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / model.api_header_name).write_text(emit_c_api_header(model), encoding="utf-8")
    (output_dir / model.api_implementation_name).write_text(emit_c_api_implementation(model), encoding="utf-8")
    (output_dir / model.extension_source_name).write_text(emit_python_extension(model), encoding="utf-8")
    (output_dir / model.python_source_name).write_text(emit_python_facade(model), encoding="utf-8")
