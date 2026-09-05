// This file was generated with the assistance of an AI coding tool.

#include "attribute_value_shim.h"

#include "argument.h"
#include "argument_type.h"
#include "instance_data.h"
#include "schema.h"

#include <boost/dynamic_bitset.hpp>
#include <boost/logic/tribool.hpp>

#include <stdexcept>

namespace ifcopenshell {
namespace wrappergen {

namespace {

const ifcopenshell::entity* entity_declaration_of(const express::base& instance) {
    const auto* entity_declaration = instance.declaration().as_entity();
    if (entity_declaration == nullptr) {
        throw std::runtime_error("Attribute access is only supported on entity instances");
    }
    return entity_declaration;
}

const ifcopenshell::attribute* attribute_declaration_at(const express::base& instance, int attribute_index) {
    const auto* entity_declaration = entity_declaration_of(instance);
    if (attribute_index < 0 || static_cast<size_t>(attribute_index) >= entity_declaration->attribute_count()) {
        throw std::out_of_range("Attribute index out of range");
    }
    return entity_declaration->attribute_by_index(static_cast<size_t>(attribute_index));
}

const ifcopenshell::enumeration_type* enumeration_type_at(const express::base& instance, int attribute_index) {
    const auto* attribute_declaration = attribute_declaration_at(instance, attribute_index);
    const auto* parameter_type = attribute_declaration->type_of_attribute();
    const auto* named_type = parameter_type != nullptr ? parameter_type->as_named_type() : nullptr;
    const auto* declared_type = named_type != nullptr ? named_type->declared_type() : nullptr;
    const auto* enumeration_type = declared_type != nullptr ? declared_type->as_enumeration_type() : nullptr;
    if (enumeration_type == nullptr) {
        throw std::runtime_error("Attribute is not an enumeration-typed attribute");
    }
    return enumeration_type;
}

// Wraps a raw C++ scalar value read off `raw` into a variant -- the leaf-level
// building block `get_attribute_value_variant` uses both directly (for a
// scalar attribute) and recursively, one nesting level at a time, to build up
// an ATTRIBUTE_VALUE_KIND_AGGREGATE's elements (research/06-wrappergen-spike-results.md
// SS2.2: a single generic aggregate case rather than one per element type).
attribute_value_variant make_scalar(int64_t value) {
    attribute_value_variant result;
    result.kind = ATTRIBUTE_VALUE_KIND_INTEGER;
    result.integer_value = value;
    return result;
}

attribute_value_variant make_scalar(double value) {
    attribute_value_variant result;
    result.kind = ATTRIBUTE_VALUE_KIND_DOUBLE;
    result.double_value = value;
    return result;
}

attribute_value_variant make_scalar(const std::string& value) {
    attribute_value_variant result;
    result.kind = ATTRIBUTE_VALUE_KIND_STRING;
    result.string_value = value;
    return result;
}

attribute_value_variant make_scalar(const boost::dynamic_bitset<>& value) {
    attribute_value_variant result;
    result.kind = ATTRIBUTE_VALUE_KIND_BINARY;
    boost::to_string(value, result.string_value);
    return result;
}

attribute_value_variant make_scalar(const express::base& value) {
    attribute_value_variant result;
    result.kind = ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE;
    result.entity_value = value;
    return result;
}

template <typename T>
attribute_value_variant make_aggregate(const std::vector<T>& values) {
    attribute_value_variant result;
    result.kind = ATTRIBUTE_VALUE_KIND_AGGREGATE;
    result.aggregate_value.reserve(values.size());
    for (const auto& value : values) {
        result.aggregate_value.push_back(make_scalar(value));
    }
    return result;
}

template <typename T>
attribute_value_variant make_aggregate(const std::vector<std::vector<T>>& values) {
    attribute_value_variant result;
    result.kind = ATTRIBUTE_VALUE_KIND_AGGREGATE;
    result.aggregate_value.reserve(values.size());
    for (const auto& inner : values) {
        result.aggregate_value.push_back(make_aggregate(inner));
    }
    return result;
}

// Inverse of `make_aggregate`/`make_scalar`: given a homogeneous vector of
// already-tagged elements (all with the same `.kind`), recovers the concrete
// `std::vector<T>` (or `std::vector<std::vector<T>>`, one recursion level
// deeper) `express::base::set_attribute_value` needs and applies it.
void set_flat_aggregate(express::base& instance, size_t attribute_index, attribute_value_kind element_kind, const std::vector<attribute_value_variant>& elements) {
    switch (element_kind) {
    case ATTRIBUTE_VALUE_KIND_INTEGER:
    case ATTRIBUTE_VALUE_KIND_BOOL: {
        std::vector<int64_t> values;
        values.reserve(elements.size());
        for (const auto& element : elements) {
            values.push_back(element.integer_value);
        }
        instance.set_attribute_value(attribute_index, values);
        return;
    }
    case ATTRIBUTE_VALUE_KIND_DOUBLE: {
        std::vector<double> values;
        values.reserve(elements.size());
        for (const auto& element : elements) {
            values.push_back(element.double_value);
        }
        instance.set_attribute_value(attribute_index, values);
        return;
    }
    case ATTRIBUTE_VALUE_KIND_STRING:
    case ATTRIBUTE_VALUE_KIND_ENUMERATION: {
        std::vector<std::string> values;
        values.reserve(elements.size());
        for (const auto& element : elements) {
            values.push_back(element.string_value);
        }
        instance.set_attribute_value(attribute_index, values);
        return;
    }
    case ATTRIBUTE_VALUE_KIND_BINARY: {
        std::vector<boost::dynamic_bitset<>> values;
        values.reserve(elements.size());
        for (const auto& element : elements) {
            if (!ifcopenshell::valid_binary_string(element.string_value)) {
                throw std::runtime_error("Invalid binary attribute value string (expected only '0'/'1')");
            }
            values.emplace_back(element.string_value);
        }
        instance.set_attribute_value(attribute_index, values);
        return;
    }
    case ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE: {
        std::vector<express::base> values;
        values.reserve(elements.size());
        for (const auto& element : elements) {
            values.push_back(element.entity_value);
        }
        instance.set_attribute_value(attribute_index, values);
        return;
    }
    default:
        throw std::runtime_error("Unsupported homogeneous aggregate element kind");
    }
}

// Two-level nested aggregate (`AGGREGATE_OF_AGGREGATE_OF_*`) -- only INT,
// DOUBLE and ENTITY_INSTANCE exist at this nesting depth in the real schema
// (`ifcopenshell::argument_type`), matching the explicit template
// instantiations in `parse.cpp`.
void set_nested_aggregate(express::base& instance, size_t attribute_index, attribute_value_kind inner_kind, const std::vector<attribute_value_variant>& outer_elements) {
    switch (inner_kind) {
    case ATTRIBUTE_VALUE_KIND_INTEGER:
    case ATTRIBUTE_VALUE_KIND_BOOL: {
        std::vector<std::vector<int64_t>> values;
        values.reserve(outer_elements.size());
        for (const auto& outer : outer_elements) {
            std::vector<int64_t> inner_values;
            inner_values.reserve(outer.aggregate_value.size());
            for (const auto& inner : outer.aggregate_value) {
                inner_values.push_back(inner.integer_value);
            }
            values.push_back(std::move(inner_values));
        }
        instance.set_attribute_value(attribute_index, values);
        return;
    }
    case ATTRIBUTE_VALUE_KIND_DOUBLE: {
        std::vector<std::vector<double>> values;
        values.reserve(outer_elements.size());
        for (const auto& outer : outer_elements) {
            std::vector<double> inner_values;
            inner_values.reserve(outer.aggregate_value.size());
            for (const auto& inner : outer.aggregate_value) {
                inner_values.push_back(inner.double_value);
            }
            values.push_back(std::move(inner_values));
        }
        instance.set_attribute_value(attribute_index, values);
        return;
    }
    case ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE: {
        std::vector<std::vector<express::base>> values;
        values.reserve(outer_elements.size());
        for (const auto& outer : outer_elements) {
            std::vector<express::base> inner_values;
            inner_values.reserve(outer.aggregate_value.size());
            for (const auto& inner : outer.aggregate_value) {
                inner_values.push_back(inner.entity_value);
            }
            values.push_back(std::move(inner_values));
        }
        instance.set_attribute_value(attribute_index, values);
        return;
    }
    default:
        throw std::runtime_error("Unsupported two-level nested aggregate element kind");
    }
}

} // namespace

attribute_value_variant get_attribute_value_variant(const express::base& instance, int attribute_index) {
    attribute_value_variant result;
    ifcopenshell::attribute_value raw = instance.get_attribute_value(static_cast<size_t>(attribute_index));
    if (raw.isNull()) {
        result.kind = ATTRIBUTE_VALUE_KIND_NULL;
        return result;
    }
    switch (raw.type()) {
    case ifcopenshell::Argument_BOOL:
        result.kind = ATTRIBUTE_VALUE_KIND_BOOL;
        result.integer_value = static_cast<bool>(raw) ? 1 : 0;
        break;
    case ifcopenshell::Argument_LOGICAL: {
        result.kind = ATTRIBUTE_VALUE_KIND_LOGICAL;
        boost::logic::tribool value = static_cast<boost::logic::tribool>(raw);
        result.logical_value = boost::logic::indeterminate(value) ? 2 : (value ? 1 : 0);
        break;
    }
    case ifcopenshell::Argument_INT:
        result.kind = ATTRIBUTE_VALUE_KIND_INTEGER;
        result.integer_value = static_cast<int64_t>(raw);
        break;
    case ifcopenshell::Argument_DOUBLE:
        result.kind = ATTRIBUTE_VALUE_KIND_DOUBLE;
        result.double_value = static_cast<double>(raw);
        break;
    case ifcopenshell::Argument_STRING:
        result.kind = ATTRIBUTE_VALUE_KIND_STRING;
        result.string_value = static_cast<std::string>(raw);
        break;
    case ifcopenshell::Argument_BINARY:
        result.kind = ATTRIBUTE_VALUE_KIND_BINARY;
        boost::to_string(static_cast<boost::dynamic_bitset<>>(raw), result.string_value);
        break;
    case ifcopenshell::Argument_ENUMERATION: {
        result.kind = ATTRIBUTE_VALUE_KIND_ENUMERATION;
        ifcopenshell::enumeration_reference reference = static_cast<ifcopenshell::enumeration_reference>(raw);
        result.string_value = reference.value();
        break;
    }
    case ifcopenshell::Argument_ENTITY_INSTANCE:
        result.kind = ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE;
        result.entity_value = static_cast<express::base>(raw);
        break;
    case ifcopenshell::Argument_EMPTY_AGGREGATE:
    case ifcopenshell::Argument_AGGREGATE_OF_EMPTY_AGGREGATE:
        result.kind = ATTRIBUTE_VALUE_KIND_AGGREGATE;
        break;
    case ifcopenshell::Argument_AGGREGATE_OF_INT:
        result = make_aggregate(static_cast<std::vector<int64_t>>(raw));
        break;
    case ifcopenshell::Argument_AGGREGATE_OF_DOUBLE:
        result = make_aggregate(static_cast<std::vector<double>>(raw));
        break;
    case ifcopenshell::Argument_AGGREGATE_OF_STRING:
        result = make_aggregate(static_cast<std::vector<std::string>>(raw));
        break;
    case ifcopenshell::Argument_AGGREGATE_OF_BINARY:
        result = make_aggregate(static_cast<std::vector<boost::dynamic_bitset<>>>(raw));
        break;
    case ifcopenshell::Argument_AGGREGATE_OF_ENTITY_INSTANCE:
        result = make_aggregate(static_cast<std::vector<express::base>>(raw));
        break;
    case ifcopenshell::Argument_AGGREGATE_OF_AGGREGATE_OF_INT:
        result = make_aggregate(static_cast<std::vector<std::vector<int64_t>>>(raw));
        break;
    case ifcopenshell::Argument_AGGREGATE_OF_AGGREGATE_OF_DOUBLE:
        result = make_aggregate(static_cast<std::vector<std::vector<double>>>(raw));
        break;
    case ifcopenshell::Argument_AGGREGATE_OF_AGGREGATE_OF_ENTITY_INSTANCE:
        result = make_aggregate(static_cast<std::vector<std::vector<express::base>>>(raw));
        break;
    default:
        // Argument_DERIVED / Argument_UNKNOWN -- not a value this dispatch can
        // meaningfully read or write; matches Python's own treatment (derived
        // attributes are computed via the EXPRESS rule interpreter, not read
        // through `get_argument`/`set_attribute_value_py` -- research/01 SS2.3,
        // explicitly out of scope for this Phase 1 primitive layer).
        result.kind = ATTRIBUTE_VALUE_KIND_NULL;
        break;
    }
    return result;
}

void set_attribute_value_variant(express::base& instance, int attribute_index, const attribute_value_variant& value) {
    switch (value.kind) {
    case ATTRIBUTE_VALUE_KIND_NULL:
        instance.unset_attribute_value(static_cast<size_t>(attribute_index));
        return;
    case ATTRIBUTE_VALUE_KIND_BOOL:
        instance.set_attribute_value(static_cast<size_t>(attribute_index), static_cast<bool>(value.integer_value != 0));
        return;
    case ATTRIBUTE_VALUE_KIND_LOGICAL: {
        boost::logic::tribool tribool_value = boost::logic::indeterminate;
        if (value.logical_value == 0) {
            tribool_value = false;
        } else if (value.logical_value == 1) {
            tribool_value = true;
        }
        instance.set_attribute_value(static_cast<size_t>(attribute_index), tribool_value);
        return;
    }
    case ATTRIBUTE_VALUE_KIND_INTEGER:
        instance.set_attribute_value(static_cast<size_t>(attribute_index), static_cast<int64_t>(value.integer_value));
        return;
    case ATTRIBUTE_VALUE_KIND_DOUBLE:
        instance.set_attribute_value(static_cast<size_t>(attribute_index), static_cast<double>(value.double_value));
        return;
    case ATTRIBUTE_VALUE_KIND_STRING:
        instance.set_attribute_value(static_cast<size_t>(attribute_index), value.string_value);
        return;
    case ATTRIBUTE_VALUE_KIND_BINARY:
        if (!ifcopenshell::valid_binary_string(value.string_value)) {
            throw std::runtime_error("Invalid binary attribute value string (expected only '0'/'1')");
        }
        instance.set_attribute_value(static_cast<size_t>(attribute_index), boost::dynamic_bitset<>(value.string_value));
        return;
    case ATTRIBUTE_VALUE_KIND_ENUMERATION: {
        const auto* enumeration_type = enumeration_type_at(instance, attribute_index);
        ifcopenshell::enumeration_reference reference(enumeration_type, enumeration_type->lookup_enum_offset(value.string_value));
        instance.set_attribute_value(static_cast<size_t>(attribute_index), reference);
        return;
    }
    case ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE:
        instance.set_attribute_value(static_cast<size_t>(attribute_index), value.entity_value);
        return;
    case ATTRIBUTE_VALUE_KIND_AGGREGATE: {
        if (value.aggregate_value.empty()) {
            // Argument_EMPTY_AGGREGATE's usual role: an untyped placeholder for
            // an unset list-typed attribute. `express::base` is the most
            // permissive (any concrete aggregate element type converts to it
            // trivially) empty-vector instantiation available.
            instance.set_attribute_value(static_cast<size_t>(attribute_index), std::vector<express::base>{});
            return;
        }
        const attribute_value_kind element_kind = value.aggregate_value.front().kind;
        if (element_kind == ATTRIBUTE_VALUE_KIND_AGGREGATE) {
            const auto& first_inner = value.aggregate_value.front().aggregate_value;
            const attribute_value_kind inner_kind = first_inner.empty() ? ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE : first_inner.front().kind;
            set_nested_aggregate(instance, static_cast<size_t>(attribute_index), inner_kind, value.aggregate_value);
            return;
        }
        set_flat_aggregate(instance, static_cast<size_t>(attribute_index), element_kind, value.aggregate_value);
        return;
    }
    default:
        throw std::runtime_error("Unsupported attribute_value_variant kind");
    }
}

attribute_value_kind attribute_kind_of(const express::base& instance, int attribute_index) {
    const auto* attribute_declaration = attribute_declaration_at(instance, attribute_index);
    const ifcopenshell::argument_type declared_type = ifcopenshell::from_parameter_type(attribute_declaration->type_of_attribute());
    switch (declared_type) {
    case ifcopenshell::Argument_BOOL:
        return ATTRIBUTE_VALUE_KIND_BOOL;
    case ifcopenshell::Argument_LOGICAL:
        return ATTRIBUTE_VALUE_KIND_LOGICAL;
    case ifcopenshell::Argument_INT:
        return ATTRIBUTE_VALUE_KIND_INTEGER;
    case ifcopenshell::Argument_DOUBLE:
        return ATTRIBUTE_VALUE_KIND_DOUBLE;
    case ifcopenshell::Argument_STRING:
        return ATTRIBUTE_VALUE_KIND_STRING;
    case ifcopenshell::Argument_BINARY:
        return ATTRIBUTE_VALUE_KIND_BINARY;
    case ifcopenshell::Argument_ENUMERATION:
        return ATTRIBUTE_VALUE_KIND_ENUMERATION;
    case ifcopenshell::Argument_ENTITY_INSTANCE:
        return ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE;
    case ifcopenshell::Argument_EMPTY_AGGREGATE:
    case ifcopenshell::Argument_AGGREGATE_OF_INT:
    case ifcopenshell::Argument_AGGREGATE_OF_DOUBLE:
    case ifcopenshell::Argument_AGGREGATE_OF_STRING:
    case ifcopenshell::Argument_AGGREGATE_OF_BINARY:
    case ifcopenshell::Argument_AGGREGATE_OF_ENTITY_INSTANCE:
    case ifcopenshell::Argument_AGGREGATE_OF_EMPTY_AGGREGATE:
    case ifcopenshell::Argument_AGGREGATE_OF_AGGREGATE_OF_INT:
    case ifcopenshell::Argument_AGGREGATE_OF_AGGREGATE_OF_DOUBLE:
    case ifcopenshell::Argument_AGGREGATE_OF_AGGREGATE_OF_ENTITY_INSTANCE:
        return ATTRIBUTE_VALUE_KIND_AGGREGATE;
    default:
        // Argument_DERIVED / Argument_UNKNOWN.
        return ATTRIBUTE_VALUE_KIND_NULL;
    }
}

int get_argument_index(const express::base& instance, const std::string& name) {
    const auto* entity_declaration = entity_declaration_of(instance);
    const ptrdiff_t index = entity_declaration->attribute_index(name);
    if (index < 0) {
        throw std::runtime_error("Unknown attribute name: " + name);
    }
    return static_cast<int>(index);
}

std::string get_attribute_name(const express::base& instance, int attribute_index) {
    return attribute_declaration_at(instance, attribute_index)->name();
}

std::string get_attribute_type_name(const express::base& instance, int attribute_index) {
    const auto* attribute_declaration = attribute_declaration_at(instance, attribute_index);
    return ifcopenshell::argument_type_to_string(ifcopenshell::from_parameter_type(attribute_declaration->type_of_attribute()));
}

int get_attribute_category(const express::base& instance, const std::string& name) {
    const auto* entity_declaration = entity_declaration_of(instance);
    const auto& forward_attributes = entity_declaration->all_attributes();
    const auto& derived_flags = entity_declaration->derived();
    for (size_t index = 0; index < forward_attributes.size(); ++index) {
        if (forward_attributes[index]->name() == name) {
            return (index < derived_flags.size() && derived_flags[index]) ? 3 : 1;
        }
    }
    for (const auto* inverse_attribute : entity_declaration->all_inverse_attributes()) {
        if (inverse_attribute->name() == name) {
            return 2;
        }
    }
    return 0;
}

std::vector<std::string> get_attribute_names(const express::base& instance) {
    const auto* entity_declaration = entity_declaration_of(instance);
    std::vector<std::string> names;
    for (const auto* attribute_declaration : entity_declaration->all_attributes()) {
        names.push_back(attribute_declaration->name());
    }
    return names;
}

std::vector<std::string> get_inverse_attribute_names(const express::base& instance) {
    const auto* entity_declaration = entity_declaration_of(instance);
    std::vector<std::string> names;
    for (const auto* inverse_attribute : entity_declaration->all_inverse_attributes()) {
        names.push_back(inverse_attribute->name());
    }
    return names;
}

bool is_a(const express::base& instance, const std::string& name) {
    return instance.declaration().is(name);
}

std::vector<attribute_value_variant> get_all_attribute_values(const express::base& instance) {
    const auto* entity_declaration = entity_declaration_of(instance);
    const size_t count = entity_declaration->attribute_count();
    std::vector<attribute_value_variant> values;
    values.reserve(count);
    for (size_t index = 0; index < count; ++index) {
        values.push_back(get_attribute_value_variant(instance, static_cast<int>(index)));
    }
    return values;
}

} // namespace wrappergen
} // namespace ifcopenshell
