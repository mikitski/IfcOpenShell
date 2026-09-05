// This file was generated with the assistance of an AI coding tool.

#include "attribute_value_shim.h"

#include "argument_type.h"
#include "instance_data.h"
#include "schema.h"

#include <boost/logic/tribool.hpp>

#include <stdexcept>

namespace ifcopenshell {
namespace wrappergen {

namespace {

const ifcopenshell::attribute* attribute_declaration_at(const express::base& instance, int attribute_index) {
    const auto* entity_declaration = instance.declaration().as_entity();
    if (entity_declaration == nullptr) {
        throw std::runtime_error("Attribute access is only supported on entity instances");
    }
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
    default:
        // BINARY and every AGGREGATE_OF_* case (research/01-python-core-and-lowlevel.md SS5's
        // remaining ~7 branches) are out of scope for this spike -- see
        // planning/ifcopenshell-ts/research/06-wrappergen-spike-results.md.
        throw std::runtime_error(
            "This spike's variant adapter only covers BOOL/LOGICAL/INT/DOUBLE/STRING/ENUMERATION/"
            "ENTITY_INSTANCE -- binary and aggregate attribute types need a full Phase 1 implementation");
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
    case ATTRIBUTE_VALUE_KIND_ENUMERATION: {
        const auto* enumeration_type = enumeration_type_at(instance, attribute_index);
        ifcopenshell::enumeration_reference reference(enumeration_type, enumeration_type->lookup_enum_offset(value.string_value));
        instance.set_attribute_value(static_cast<size_t>(attribute_index), reference);
        return;
    }
    case ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE:
        instance.set_attribute_value(static_cast<size_t>(attribute_index), value.entity_value);
        return;
    default:
        throw std::runtime_error("Unsupported attribute_value_variant kind");
    }
}

} // namespace wrappergen
} // namespace ifcopenshell
