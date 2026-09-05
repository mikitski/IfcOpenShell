#include <node_api.h>

#include "ifcopenshell_native_c_api.h"

#include <algorithm>
#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

namespace {

napi_value throw_last_error(napi_env env, const char* fallback_message) {
    const char* message = ifcopenshell_last_error_message();
    napi_throw_error(env, nullptr, message ? message : fallback_message);
    return nullptr;
}

std::string napi_string_value(napi_env env, napi_value value) {
    size_t length = 0;
    napi_get_value_string_utf8(env, value, nullptr, 0, &length);
    std::string result(length, '\0');
    napi_get_value_string_utf8(env, value, result.data(), length + 1, &length);
    return result;
}

char* napi_duplicate_js_string(napi_env env, napi_value value) {
    std::string owned = napi_string_value(env, value);
    auto* buffer = new char[owned.size() + 1];
    std::memcpy(buffer, owned.c_str(), owned.size() + 1);
    return buffer;
}

void ifcopenshell_exception_finalize(napi_env, void* data, void*) {
    ifcopenshell_exception_free(static_cast<ifcopenshell_exception_t*>(data));
}

napi_value wrap_ifcopenshell_exception(napi_env env, ifcopenshell_exception_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_exception_finalize, nullptr, &result);
    return result;
}

ifcopenshell_exception_t* unwrap_ifcopenshell_exception(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_exception_t*>(data);
}

void ifcopenshell_attribute_out_of_range_exception_finalize(napi_env, void* data, void*) {
    ifcopenshell_attribute_out_of_range_exception_free(static_cast<ifcopenshell_attribute_out_of_range_exception_t*>(data));
}

napi_value wrap_ifcopenshell_attribute_out_of_range_exception(napi_env env, ifcopenshell_attribute_out_of_range_exception_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_attribute_out_of_range_exception_finalize, nullptr, &result);
    return result;
}

ifcopenshell_attribute_out_of_range_exception_t* unwrap_ifcopenshell_attribute_out_of_range_exception(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_attribute_out_of_range_exception_t*>(data);
}

void ifcopenshell_invalid_token_exception_finalize(napi_env, void* data, void*) {
    ifcopenshell_invalid_token_exception_free(static_cast<ifcopenshell_invalid_token_exception_t*>(data));
}

napi_value wrap_ifcopenshell_invalid_token_exception(napi_env env, ifcopenshell_invalid_token_exception_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_invalid_token_exception_finalize, nullptr, &result);
    return result;
}

ifcopenshell_invalid_token_exception_t* unwrap_ifcopenshell_invalid_token_exception(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_invalid_token_exception_t*>(data);
}

void ifcopenshell_parameter_type_finalize(napi_env, void* data, void*) {
    ifcopenshell_parameter_type_free(static_cast<ifcopenshell_parameter_type_t*>(data));
}

napi_value wrap_ifcopenshell_parameter_type(napi_env env, ifcopenshell_parameter_type_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_parameter_type_finalize, nullptr, &result);
    return result;
}

ifcopenshell_parameter_type_t* unwrap_ifcopenshell_parameter_type(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_parameter_type_t*>(data);
}

void ifcopenshell_named_type_finalize(napi_env, void* data, void*) {
    ifcopenshell_named_type_free(static_cast<ifcopenshell_named_type_t*>(data));
}

napi_value wrap_ifcopenshell_named_type(napi_env env, ifcopenshell_named_type_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_named_type_finalize, nullptr, &result);
    return result;
}

ifcopenshell_named_type_t* unwrap_ifcopenshell_named_type(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_named_type_t*>(data);
}

void ifcopenshell_simple_type_finalize(napi_env, void* data, void*) {
    ifcopenshell_simple_type_free(static_cast<ifcopenshell_simple_type_t*>(data));
}

napi_value wrap_ifcopenshell_simple_type(napi_env env, ifcopenshell_simple_type_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_simple_type_finalize, nullptr, &result);
    return result;
}

ifcopenshell_simple_type_t* unwrap_ifcopenshell_simple_type(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_simple_type_t*>(data);
}

void ifcopenshell_aggregation_type_finalize(napi_env, void* data, void*) {
    ifcopenshell_aggregation_type_free(static_cast<ifcopenshell_aggregation_type_t*>(data));
}

napi_value wrap_ifcopenshell_aggregation_type(napi_env env, ifcopenshell_aggregation_type_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_aggregation_type_finalize, nullptr, &result);
    return result;
}

ifcopenshell_aggregation_type_t* unwrap_ifcopenshell_aggregation_type(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_aggregation_type_t*>(data);
}

void ifcopenshell_declaration_finalize(napi_env, void* data, void*) {
    ifcopenshell_declaration_free(static_cast<ifcopenshell_declaration_t*>(data));
}

napi_value wrap_ifcopenshell_declaration(napi_env env, ifcopenshell_declaration_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_declaration_finalize, nullptr, &result);
    return result;
}

ifcopenshell_declaration_t* unwrap_ifcopenshell_declaration(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_declaration_t*>(data);
}

void ifcopenshell_type_declaration_finalize(napi_env, void* data, void*) {
    ifcopenshell_type_declaration_free(static_cast<ifcopenshell_type_declaration_t*>(data));
}

napi_value wrap_ifcopenshell_type_declaration(napi_env env, ifcopenshell_type_declaration_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_type_declaration_finalize, nullptr, &result);
    return result;
}

ifcopenshell_type_declaration_t* unwrap_ifcopenshell_type_declaration(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_type_declaration_t*>(data);
}

void ifcopenshell_select_type_finalize(napi_env, void* data, void*) {
    ifcopenshell_select_type_free(static_cast<ifcopenshell_select_type_t*>(data));
}

napi_value wrap_ifcopenshell_select_type(napi_env env, ifcopenshell_select_type_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_select_type_finalize, nullptr, &result);
    return result;
}

ifcopenshell_select_type_t* unwrap_ifcopenshell_select_type(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_select_type_t*>(data);
}

void ifcopenshell_enumeration_type_finalize(napi_env, void* data, void*) {
    ifcopenshell_enumeration_type_free(static_cast<ifcopenshell_enumeration_type_t*>(data));
}

napi_value wrap_ifcopenshell_enumeration_type(napi_env env, ifcopenshell_enumeration_type_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_enumeration_type_finalize, nullptr, &result);
    return result;
}

ifcopenshell_enumeration_type_t* unwrap_ifcopenshell_enumeration_type(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_enumeration_type_t*>(data);
}

void ifcopenshell_attribute_finalize(napi_env, void* data, void*) {
    ifcopenshell_attribute_free(static_cast<ifcopenshell_attribute_t*>(data));
}

napi_value wrap_ifcopenshell_attribute(napi_env env, ifcopenshell_attribute_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_attribute_finalize, nullptr, &result);
    return result;
}

ifcopenshell_attribute_t* unwrap_ifcopenshell_attribute(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_attribute_t*>(data);
}

void ifcopenshell_inverse_attribute_finalize(napi_env, void* data, void*) {
    ifcopenshell_inverse_attribute_free(static_cast<ifcopenshell_inverse_attribute_t*>(data));
}

napi_value wrap_ifcopenshell_inverse_attribute(napi_env env, ifcopenshell_inverse_attribute_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_inverse_attribute_finalize, nullptr, &result);
    return result;
}

ifcopenshell_inverse_attribute_t* unwrap_ifcopenshell_inverse_attribute(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_inverse_attribute_t*>(data);
}

void ifcopenshell_entity_finalize(napi_env, void* data, void*) {
    ifcopenshell_entity_free(static_cast<ifcopenshell_entity_t*>(data));
}

napi_value wrap_ifcopenshell_entity(napi_env env, ifcopenshell_entity_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_entity_finalize, nullptr, &result);
    return result;
}

ifcopenshell_entity_t* unwrap_ifcopenshell_entity(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_entity_t*>(data);
}

void ifcopenshell_schema_definition_finalize(napi_env, void* data, void*) {
    ifcopenshell_schema_definition_free(static_cast<ifcopenshell_schema_definition_t*>(data));
}

napi_value wrap_ifcopenshell_schema_definition(napi_env env, ifcopenshell_schema_definition_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_schema_definition_finalize, nullptr, &result);
    return result;
}

ifcopenshell_schema_definition_t* unwrap_ifcopenshell_schema_definition(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_schema_definition_t*>(data);
}

void ifcopenshell_schema_registry_finalize(napi_env, void* data, void*) {
    ifcopenshell_schema_registry_free(static_cast<ifcopenshell_schema_registry_t*>(data));
}

napi_value wrap_ifcopenshell_schema_registry(napi_env env, ifcopenshell_schema_registry_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_schema_registry_finalize, nullptr, &result);
    return result;
}

ifcopenshell_schema_registry_t* unwrap_ifcopenshell_schema_registry(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_schema_registry_t*>(data);
}

void express_base_finalize(napi_env, void* data, void*) {
    ifcopenshell_express_base_free(static_cast<ifcopenshell_express_base_t*>(data));
}

napi_value wrap_express_base(napi_env env, ifcopenshell_express_base_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, express_base_finalize, nullptr, &result);
    return result;
}

ifcopenshell_express_base_t* unwrap_express_base(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_express_base_t*>(data);
}

void express_entity_finalize(napi_env, void* data, void*) {
    ifcopenshell_express_entity_free(static_cast<ifcopenshell_express_entity_t*>(data));
}

napi_value wrap_express_entity(napi_env env, ifcopenshell_express_entity_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, express_entity_finalize, nullptr, &result);
    return result;
}

ifcopenshell_express_entity_t* unwrap_express_entity(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_express_entity_t*>(data);
}

void express_select_finalize(napi_env, void* data, void*) {
    ifcopenshell_express_select_free(static_cast<ifcopenshell_express_select_t*>(data));
}

napi_value wrap_express_select(napi_env env, ifcopenshell_express_select_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, express_select_finalize, nullptr, &result);
    return result;
}

ifcopenshell_express_select_t* unwrap_express_select(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_express_select_t*>(data);
}

void ifcopenshell_logger_finalize(napi_env, void* data, void*) {
    ifcopenshell_logger_free(static_cast<ifcopenshell_logger_t*>(data));
}

napi_value wrap_ifcopenshell_logger(napi_env env, ifcopenshell_logger_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_logger_finalize, nullptr, &result);
    return result;
}

ifcopenshell_logger_t* unwrap_ifcopenshell_logger(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_logger_t*>(data);
}

void ifcopenshell_full_buffer_impl_finalize(napi_env, void* data, void*) {
    ifcopenshell_full_buffer_impl_free(static_cast<ifcopenshell_full_buffer_impl_t*>(data));
}

napi_value wrap_ifcopenshell_full_buffer_impl(napi_env env, ifcopenshell_full_buffer_impl_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_full_buffer_impl_finalize, nullptr, &result);
    return result;
}

ifcopenshell_full_buffer_impl_t* unwrap_ifcopenshell_full_buffer_impl(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_full_buffer_impl_t*>(data);
}

void ifcopenshell_paged_file_impl_finalize(napi_env, void* data, void*) {
    ifcopenshell_paged_file_impl_free(static_cast<ifcopenshell_paged_file_impl_t*>(data));
}

napi_value wrap_ifcopenshell_paged_file_impl(napi_env env, ifcopenshell_paged_file_impl_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_paged_file_impl_finalize, nullptr, &result);
    return result;
}

ifcopenshell_paged_file_impl_t* unwrap_ifcopenshell_paged_file_impl(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_paged_file_impl_t*>(data);
}

void ifcopenshell_pushed_sequential_impl_finalize(napi_env, void* data, void*) {
    ifcopenshell_pushed_sequential_impl_free(static_cast<ifcopenshell_pushed_sequential_impl_t*>(data));
}

napi_value wrap_ifcopenshell_pushed_sequential_impl(napi_env env, ifcopenshell_pushed_sequential_impl_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_pushed_sequential_impl_finalize, nullptr, &result);
    return result;
}

ifcopenshell_pushed_sequential_impl_t* unwrap_ifcopenshell_pushed_sequential_impl(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_pushed_sequential_impl_t*>(data);
}

void ifcopenshell_character_encoder_finalize(napi_env, void* data, void*) {
    ifcopenshell_character_encoder_free(static_cast<ifcopenshell_character_encoder_t*>(data));
}

napi_value wrap_ifcopenshell_character_encoder(napi_env env, ifcopenshell_character_encoder_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_character_encoder_finalize, nullptr, &result);
    return result;
}

ifcopenshell_character_encoder_t* unwrap_ifcopenshell_character_encoder(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_character_encoder_t*>(data);
}

void ifcopenshell_file_open_status_finalize(napi_env, void* data, void*) {
    ifcopenshell_file_open_status_free(static_cast<ifcopenshell_file_open_status_t*>(data));
}

napi_value wrap_ifcopenshell_file_open_status(napi_env env, ifcopenshell_file_open_status_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_file_open_status_finalize, nullptr, &result);
    return result;
}

ifcopenshell_file_open_status_t* unwrap_ifcopenshell_file_open_status(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_file_open_status_t*>(data);
}

void ifcopenshell_token_finalize(napi_env, void* data, void*) {
    ifcopenshell_token_free(static_cast<ifcopenshell_token_t*>(data));
}

napi_value wrap_ifcopenshell_token(napi_env env, ifcopenshell_token_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_token_finalize, nullptr, &result);
    return result;
}

ifcopenshell_token_t* unwrap_ifcopenshell_token(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_token_t*>(data);
}

void ifcopenshell_enumeration_reference_finalize(napi_env, void* data, void*) {
    ifcopenshell_enumeration_reference_free(static_cast<ifcopenshell_enumeration_reference_t*>(data));
}

napi_value wrap_ifcopenshell_enumeration_reference(napi_env env, ifcopenshell_enumeration_reference_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_enumeration_reference_finalize, nullptr, &result);
    return result;
}

ifcopenshell_enumeration_reference_t* unwrap_ifcopenshell_enumeration_reference(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_enumeration_reference_t*>(data);
}

void ifcopenshell_attribute_value_finalize(napi_env, void* data, void*) {
    ifcopenshell_attribute_value_free(static_cast<ifcopenshell_attribute_value_t*>(data));
}

napi_value wrap_ifcopenshell_attribute_value(napi_env env, ifcopenshell_attribute_value_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_attribute_value_finalize, nullptr, &result);
    return result;
}

ifcopenshell_attribute_value_t* unwrap_ifcopenshell_attribute_value(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_attribute_value_t*>(data);
}

void ifcopenshell_spf_header_finalize(napi_env, void* data, void*) {
    ifcopenshell_spf_header_free(static_cast<ifcopenshell_spf_header_t*>(data));
}

napi_value wrap_ifcopenshell_spf_header(napi_env env, ifcopenshell_spf_header_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_spf_header_finalize, nullptr, &result);
    return result;
}

ifcopenshell_spf_header_t* unwrap_ifcopenshell_spf_header(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_spf_header_t*>(data);
}

void ifcopenshell_file_finalize(napi_env, void* data, void*) {
    ifcopenshell_file_free(static_cast<ifcopenshell_file_t*>(data));
}

napi_value wrap_ifcopenshell_file(napi_env env, ifcopenshell_file_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_file_finalize, nullptr, &result);
    return result;
}

ifcopenshell_file_t* unwrap_ifcopenshell_file(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_file_t*>(data);
}

void ifcopenshell_global_id_finalize(napi_env, void* data, void*) {
    ifcopenshell_global_id_free(static_cast<ifcopenshell_global_id_t*>(data));
}

napi_value wrap_ifcopenshell_global_id(napi_env env, ifcopenshell_global_id_t* handle) {
    if (handle == nullptr) {
        napi_value null_value;
        napi_get_null(env, &null_value);
        return null_value;
    }
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_global_id_finalize, nullptr, &result);
    return result;
}

ifcopenshell_global_id_t* unwrap_ifcopenshell_global_id(napi_env env, napi_value value) {
    void* data = nullptr;
    napi_get_value_external(env, value, &data);
    return static_cast<ifcopenshell_global_id_t*>(data);
}

napi_value ifcopenshell_attribute_value_variant_to_js(napi_env env, const ifcopenshell_attribute_value_variant_t& value) {
    napi_value js_result;
    switch (value.kind) {
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_BOOL:
        napi_get_boolean(env, value.integer_value != 0, &js_result);
        break;
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_LOGICAL:
        napi_create_int64(env, value.logical_value, &js_result);
        break;
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_INTEGER:
        napi_create_int64(env, value.integer_value, &js_result);
        break;
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_DOUBLE:
        napi_create_double(env, value.double_value, &js_result);
        break;
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_STRING:
        napi_create_string_utf8(env, value.string_value, NAPI_AUTO_LENGTH, &js_result);
        break;
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_ENUMERATION:
        napi_create_string_utf8(env, value.string_value, NAPI_AUTO_LENGTH, &js_result);
        break;
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE:
        js_result = wrap_express_base(env, value.entity_value);
        break;
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_BINARY:
        napi_create_string_utf8(env, value.string_value, NAPI_AUTO_LENGTH, &js_result);
        break;
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_AGGREGATE:
        napi_create_array_with_length(env, value.aggregate_value_count, &js_result);
        for (int index = 0; index < value.aggregate_value_count; ++index) {
            napi_set_element(env, js_result, index, ifcopenshell_attribute_value_variant_to_js(env, value.aggregate_value[index]));
        }
        break;
    default:
        napi_get_null(env, &js_result);
        break;
    }
    return js_result;
}

ifcopenshell_attribute_value_variant_t ifcopenshell_attribute_value_variant_from_js(napi_env env, napi_value value) {
    ifcopenshell_attribute_value_variant_t result{};
    napi_value kind_prop;
    napi_get_named_property(env, value, "kind", &kind_prop);
    int32_t kind_int = 0;
    napi_get_value_int32(env, kind_prop, &kind_int);
    result.kind = static_cast<decltype(result.kind)>(kind_int);
    switch (kind_int) {
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_NULL: {
        napi_value prop;
        napi_get_named_property(env, value, "integer_value", &prop);
        int64_t element_value = 0;
        napi_get_value_int64(env, prop, &element_value);
        result.integer_value = element_value;
        break;
    }
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_BOOL: {
        napi_value prop;
        napi_get_named_property(env, value, "integer_value", &prop);
        int64_t element_value = 0;
        napi_get_value_int64(env, prop, &element_value);
        result.integer_value = element_value;
        break;
    }
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_LOGICAL: {
        napi_value prop;
        napi_get_named_property(env, value, "logical_value", &prop);
        int64_t element_value = 0;
        napi_get_value_int64(env, prop, &element_value);
        result.logical_value = element_value;
        break;
    }
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_INTEGER: {
        napi_value prop;
        napi_get_named_property(env, value, "integer_value", &prop);
        int64_t element_value = 0;
        napi_get_value_int64(env, prop, &element_value);
        result.integer_value = element_value;
        break;
    }
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_DOUBLE: {
        napi_value prop;
        napi_get_named_property(env, value, "double_value", &prop);
        double element_value = 0;
        napi_get_value_double(env, prop, &element_value);
        result.double_value = element_value;
        break;
    }
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_STRING: {
        napi_value prop;
        napi_get_named_property(env, value, "string_value", &prop);
        result.string_value = napi_duplicate_js_string(env, prop);
        break;
    }
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_ENUMERATION: {
        napi_value prop;
        napi_get_named_property(env, value, "string_value", &prop);
        result.string_value = napi_duplicate_js_string(env, prop);
        break;
    }
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE: {
        napi_value prop;
        napi_get_named_property(env, value, "entity_value", &prop);
        result.entity_value = unwrap_express_base(env, prop);
        break;
    }
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_BINARY: {
        napi_value prop;
        napi_get_named_property(env, value, "string_value", &prop);
        result.string_value = napi_duplicate_js_string(env, prop);
        break;
    }
    case IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_AGGREGATE: {
        napi_value prop;
        napi_get_named_property(env, value, "aggregate_value", &prop);
        uint32_t length = 0;
        napi_get_array_length(env, prop, &length);
        result.aggregate_value_count = static_cast<int>(length);
        result.aggregate_value = length > 0 ? new ifcopenshell_attribute_value_variant_t[length] : nullptr;
        for (uint32_t index = 0; index < length; ++index) {
            napi_value element;
            napi_get_element(env, prop, index, &element);
            result.aggregate_value[index] = ifcopenshell_attribute_value_variant_from_js(env, element);
        }
        break;
    }
    default:
        break;
    }
    return result;
}

napi_value napi_exception_new_with_message(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_message = napi_string_value(env, argv[0]);
    auto* result = ifcopenshell_exception_new_with_message(js_message.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_exception(env, result);
}

napi_value napi_attribute_out_of_range_exception_new_with_message(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_message = napi_string_value(env, argv[0]);
    auto* result = ifcopenshell_attribute_out_of_range_exception_new_with_message(js_message.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_attribute_out_of_range_exception(env, result);
}

napi_value napi_invalid_token_exception_new_with_token_start_token_string_expected_type(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    int32_t js_token_start = 0;
    napi_get_value_int32(env, argv[0], &js_token_start);
    std::string js_token_string = napi_string_value(env, argv[1]);
    std::string js_expected_type = napi_string_value(env, argv[2]);
    auto* result = ifcopenshell_invalid_token_exception_new_with_token_start_token_string_expected_type(js_token_start, js_token_string.c_str(), js_expected_type.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_invalid_token_exception(env, result);
}

napi_value napi_parameter_type_as_named_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_parameter_type(env, argv[0]);
    auto* result = ifcopenshell_parameter_type_as_named_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_named_type(env, result);
}

napi_value napi_parameter_type_as_simple_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_parameter_type(env, argv[0]);
    auto* result = ifcopenshell_parameter_type_as_simple_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_simple_type(env, result);
}

napi_value napi_parameter_type_as_aggregation_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_parameter_type(env, argv[0]);
    auto* result = ifcopenshell_parameter_type_as_aggregation_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_aggregation_type(env, result);
}

napi_value napi_parameter_type_is_with_arg0_overload_1(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_parameter_type(env, argv[0]);
    std::string js_arg0 = napi_string_value(env, argv[1]);
    bool result = ifcopenshell_parameter_type_is_with_arg0_overload_1(handle, js_arg0.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_parameter_type_is_with_arg0_overload_2(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_parameter_type(env, argv[0]);
    auto* js_arg0 = unwrap_ifcopenshell_declaration(env, argv[1]);
    bool result = ifcopenshell_parameter_type_is_with_arg0_overload_2(handle, js_arg0);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_named_type_new_with_declared_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_declared_type = unwrap_ifcopenshell_declaration(env, argv[0]);
    auto* result = ifcopenshell_named_type_new_with_declared_type(js_declared_type);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_named_type(env, result);
}

napi_value napi_named_type_declared_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_named_type(env, argv[0]);
    auto* result = ifcopenshell_named_type_declared_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_declaration(env, result);
}

napi_value napi_named_type_as_named_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_named_type(env, argv[0]);
    auto* result = ifcopenshell_named_type_as_named_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_named_type(env, result);
}

napi_value napi_named_type_is_with_name(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_named_type(env, argv[0]);
    std::string js_name = napi_string_value(env, argv[1]);
    bool result = ifcopenshell_named_type_is_with_name(handle, js_name.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_named_type_is_with_decl(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_named_type(env, argv[0]);
    auto* js_decl = unwrap_ifcopenshell_declaration(env, argv[1]);
    bool result = ifcopenshell_named_type_is_with_decl(handle, js_decl);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_simple_type_as_simple_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_simple_type(env, argv[0]);
    auto* result = ifcopenshell_simple_type_as_simple_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_simple_type(env, result);
}

napi_value napi_aggregation_type_bound1(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_aggregation_type(env, argv[0]);
    int result = ifcopenshell_aggregation_type_bound1(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_aggregation_type_bound2(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_aggregation_type(env, argv[0]);
    int result = ifcopenshell_aggregation_type_bound2(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_aggregation_type_type_of_element(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_aggregation_type(env, argv[0]);
    auto* result = ifcopenshell_aggregation_type_type_of_element(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_parameter_type(env, result);
}

napi_value napi_aggregation_type_as_aggregation_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_aggregation_type(env, argv[0]);
    auto* result = ifcopenshell_aggregation_type_as_aggregation_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_aggregation_type(env, result);
}

napi_value napi_declaration_new_with_name_index_in_schema(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_name = napi_string_value(env, argv[0]);
    int32_t js_index_in_schema = 0;
    napi_get_value_int32(env, argv[1], &js_index_in_schema);
    auto* result = ifcopenshell_declaration_new_with_name_index_in_schema(js_name.c_str(), js_index_in_schema);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_declaration(env, result);
}

napi_value napi_declaration_name(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    char* result = ifcopenshell_declaration_name(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value napi_declaration_name_uc(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    char* result = ifcopenshell_declaration_name_uc(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value napi_declaration_as_type_declaration(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    auto* result = ifcopenshell_declaration_as_type_declaration(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_type_declaration(env, result);
}

napi_value napi_declaration_as_select_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    auto* result = ifcopenshell_declaration_as_select_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_select_type(env, result);
}

napi_value napi_declaration_as_enumeration_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    auto* result = ifcopenshell_declaration_as_enumeration_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_enumeration_type(env, result);
}

napi_value napi_declaration_as_entity(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    auto* result = ifcopenshell_declaration_as_entity(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_entity(env, result);
}

napi_value napi_declaration_is_with_name(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    std::string js_name = napi_string_value(env, argv[1]);
    bool result = ifcopenshell_declaration_is_with_name(handle, js_name.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_declaration_is_with_decl(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    auto* js_decl = unwrap_ifcopenshell_declaration(env, argv[1]);
    bool result = ifcopenshell_declaration_is_with_decl(handle, js_decl);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_declaration_index_in_schema(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    int result = ifcopenshell_declaration_index_in_schema(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_declaration_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    int result = ifcopenshell_declaration_type(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_declaration_schema(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_declaration(env, argv[0]);
    auto* result = ifcopenshell_declaration_schema(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_schema_definition(env, result);
}

napi_value napi_type_declaration_new_with_name_index_in_schema_declared_type(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_name = napi_string_value(env, argv[0]);
    int32_t js_index_in_schema = 0;
    napi_get_value_int32(env, argv[1], &js_index_in_schema);
    auto* js_declared_type = unwrap_ifcopenshell_parameter_type(env, argv[2]);
    auto* result = ifcopenshell_type_declaration_new_with_name_index_in_schema_declared_type(js_name.c_str(), js_index_in_schema, js_declared_type);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_type_declaration(env, result);
}

napi_value napi_type_declaration_declared_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_type_declaration(env, argv[0]);
    auto* result = ifcopenshell_type_declaration_declared_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_parameter_type(env, result);
}

napi_value napi_type_declaration_as_type_declaration(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_type_declaration(env, argv[0]);
    auto* result = ifcopenshell_type_declaration_as_type_declaration(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_type_declaration(env, result);
}

napi_value napi_select_type_select_list(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_select_type(env, argv[0]);
    auto* result = ifcopenshell_select_type_select_list(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_declaration_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_declaration_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_ifcopenshell_declaration(env, item));
    }
    ifcopenshell_declaration_list_free(result);
    return js_result;
}

napi_value napi_select_type_as_select_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_select_type(env, argv[0]);
    auto* result = ifcopenshell_select_type_as_select_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_select_type(env, result);
}

napi_value napi_enumeration_type_lookup_enum_offset(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_enumeration_type(env, argv[0]);
    std::string js_value_name = napi_string_value(env, argv[1]);
    int result = ifcopenshell_enumeration_type_lookup_enum_offset(handle, js_value_name.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_enumeration_type_as_enumeration_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_enumeration_type(env, argv[0]);
    auto* result = ifcopenshell_enumeration_type_as_enumeration_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_enumeration_type(env, result);
}

napi_value napi_attribute_new_with_name_type_of_attribute_optional(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_name = napi_string_value(env, argv[0]);
    auto* js_type_of_attribute = unwrap_ifcopenshell_parameter_type(env, argv[1]);
    bool js_optional = false;
    napi_get_value_bool(env, argv[2], &js_optional);
    auto* result = ifcopenshell_attribute_new_with_name_type_of_attribute_optional(js_name.c_str(), js_type_of_attribute, js_optional);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_attribute(env, result);
}

napi_value napi_attribute_name(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_attribute(env, argv[0]);
    char* result = ifcopenshell_attribute_name(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value napi_attribute_type_of_attribute(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_attribute(env, argv[0]);
    auto* result = ifcopenshell_attribute_type_of_attribute(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_parameter_type(env, result);
}

napi_value napi_attribute_optional(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_attribute(env, argv[0]);
    bool result = ifcopenshell_attribute_optional(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_inverse_attribute_name(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_inverse_attribute(env, argv[0]);
    char* result = ifcopenshell_inverse_attribute_name(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value napi_inverse_attribute_bound1(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_inverse_attribute(env, argv[0]);
    int result = ifcopenshell_inverse_attribute_bound1(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_inverse_attribute_bound2(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_inverse_attribute(env, argv[0]);
    int result = ifcopenshell_inverse_attribute_bound2(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_inverse_attribute_entity_reference(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_inverse_attribute(env, argv[0]);
    auto* result = ifcopenshell_inverse_attribute_entity_reference(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_entity(env, result);
}

napi_value napi_inverse_attribute_attribute_reference(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_inverse_attribute(env, argv[0]);
    auto* result = ifcopenshell_inverse_attribute_attribute_reference(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_attribute(env, result);
}

napi_value napi_entity_new_with_name_is_abstract_index_in_schema_supertype(napi_env env, napi_callback_info info) {
    size_t argc = 4;
    napi_value argv[4];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_name = napi_string_value(env, argv[0]);
    bool js_is_abstract = false;
    napi_get_value_bool(env, argv[1], &js_is_abstract);
    int32_t js_index_in_schema = 0;
    napi_get_value_int32(env, argv[2], &js_index_in_schema);
    auto* js_supertype = unwrap_ifcopenshell_entity(env, argv[3]);
    auto* result = ifcopenshell_entity_new_with_name_is_abstract_index_in_schema_supertype(js_name.c_str(), js_is_abstract, js_index_in_schema, js_supertype);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_entity(env, result);
}

napi_value napi_entity_is_abstract(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_entity(env, argv[0]);
    bool result = ifcopenshell_entity_is_abstract(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_entity_attributes(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_entity(env, argv[0]);
    auto* result = ifcopenshell_entity_attributes(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_attribute_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_attribute_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_ifcopenshell_attribute(env, item));
    }
    ifcopenshell_attribute_list_free(result);
    return js_result;
}

napi_value napi_entity_inverse_attributes(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_entity(env, argv[0]);
    auto* result = ifcopenshell_entity_inverse_attributes(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_inverse_attribute_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_inverse_attribute_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_ifcopenshell_inverse_attribute(env, item));
    }
    ifcopenshell_inverse_attribute_list_free(result);
    return js_result;
}

napi_value napi_entity_all_attributes(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_entity(env, argv[0]);
    auto* result = ifcopenshell_entity_all_attributes(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_attribute_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_attribute_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_ifcopenshell_attribute(env, item));
    }
    ifcopenshell_attribute_list_free(result);
    return js_result;
}

napi_value napi_entity_all_inverse_attributes(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_entity(env, argv[0]);
    auto* result = ifcopenshell_entity_all_inverse_attributes(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_inverse_attribute_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_inverse_attribute_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_ifcopenshell_inverse_attribute(env, item));
    }
    ifcopenshell_inverse_attribute_list_free(result);
    return js_result;
}

napi_value napi_entity_attribute_by_index(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_entity(env, argv[0]);
    int32_t js_index = 0;
    napi_get_value_int32(env, argv[1], &js_index);
    auto* result = ifcopenshell_entity_attribute_by_index(handle, js_index);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_attribute(env, result);
}

napi_value napi_entity_attribute_count(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_entity(env, argv[0]);
    int result = ifcopenshell_entity_attribute_count(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_entity_supertype(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_entity(env, argv[0]);
    auto* result = ifcopenshell_entity_supertype(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_entity(env, result);
}

napi_value napi_entity_as_entity(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_entity(env, argv[0]);
    auto* result = ifcopenshell_entity_as_entity(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_entity(env, result);
}

napi_value napi_schema_definition_declaration_by_name_with_name(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    std::string js_name = napi_string_value(env, argv[1]);
    auto* result = ifcopenshell_schema_definition_declaration_by_name_with_name(handle, js_name.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_declaration(env, result);
}

napi_value napi_schema_definition_declaration_by_name_with_declaration_index(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    int32_t js_declaration_index = 0;
    napi_get_value_int32(env, argv[1], &js_declaration_index);
    auto* result = ifcopenshell_schema_definition_declaration_by_name_with_declaration_index(handle, js_declaration_index);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_declaration(env, result);
}

napi_value napi_schema_definition_declarations(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    auto* result = ifcopenshell_schema_definition_declarations(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_declaration_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_declaration_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_ifcopenshell_declaration(env, item));
    }
    ifcopenshell_declaration_list_free(result);
    return js_result;
}

napi_value napi_schema_definition_type_declarations(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    auto* result = ifcopenshell_schema_definition_type_declarations(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_type_declaration_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_type_declaration_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_ifcopenshell_type_declaration(env, item));
    }
    ifcopenshell_type_declaration_list_free(result);
    return js_result;
}

napi_value napi_schema_definition_select_types(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    auto* result = ifcopenshell_schema_definition_select_types(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_select_type_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_select_type_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_ifcopenshell_select_type(env, item));
    }
    ifcopenshell_select_type_list_free(result);
    return js_result;
}

napi_value napi_schema_definition_enumeration_types(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    auto* result = ifcopenshell_schema_definition_enumeration_types(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_enumeration_type_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_enumeration_type_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_ifcopenshell_enumeration_type(env, item));
    }
    ifcopenshell_enumeration_type_list_free(result);
    return js_result;
}

napi_value napi_schema_definition_name(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    char* result = ifcopenshell_schema_definition_name(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value napi_schema_registry_bind(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_schema_registry(env, argv[0]);
    auto* js_schema = unwrap_ifcopenshell_schema_definition(env, argv[1]);
    ifcopenshell_schema_registry_bind(handle, js_schema);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_schema_registry_get(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_schema_registry(env, argv[0]);
    std::string js_schema_name = napi_string_value(env, argv[1]);
    auto* result = ifcopenshell_schema_registry_get(handle, js_schema_name.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_schema_definition(env, result);
}

napi_value napi_schema_registry_clear(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_schema_registry(env, argv[0]);
    ifcopenshell_schema_registry_clear(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_base_new(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* result = ifcopenshell_base_new();
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_express_base(env, result);
}

napi_value napi_base_declaration(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    auto* result = ifcopenshell_base_declaration(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_declaration(env, result);
}

napi_value napi_base_set_attribute_value_with_attribute_index_value(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    int32_t js_attribute_index = 0;
    napi_get_value_int32(env, argv[1], &js_attribute_index);
    auto* js_value = unwrap_express_base(env, argv[2]);
    ifcopenshell_base_set_attribute_value_with_attribute_index_value(handle, js_attribute_index, js_value);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_base_set_attribute_value_with_attribute_name_value(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    std::string js_attribute_name = napi_string_value(env, argv[1]);
    auto* js_value = unwrap_express_base(env, argv[2]);
    ifcopenshell_base_set_attribute_value_with_attribute_name_value(handle, js_attribute_name.c_str(), js_value);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_base_unset_attribute_value(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    int32_t js_attribute_index = 0;
    napi_get_value_int32(env, argv[1], &js_attribute_index);
    ifcopenshell_base_unset_attribute_value(handle, js_attribute_index);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_base_identity(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    int result = ifcopenshell_base_identity(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_base_id(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    int result = ifcopenshell_base_id(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_base_get_attribute_value_variant(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    int32_t js_attribute_index = 0;
    napi_get_value_int32(env, argv[1], &js_attribute_index);
    ifcopenshell_attribute_value_variant_t result = ifcopenshell_base_get_attribute_value_variant(handle, js_attribute_index);
    if (ifcopenshell_last_error_message() != nullptr) {
        ifcopenshell_attribute_value_variant_free_contents(result);
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result = ifcopenshell_attribute_value_variant_to_js(env, result);
    ifcopenshell_attribute_value_variant_free_contents(result);
    return js_result;
}

napi_value napi_base_set_attribute_value_variant(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    int32_t js_attribute_index = 0;
    napi_get_value_int32(env, argv[1], &js_attribute_index);
    ifcopenshell_attribute_value_variant_t js_value = ifcopenshell_attribute_value_variant_from_js(env, argv[2]);
    ifcopenshell_base_set_attribute_value_variant(handle, js_attribute_index, js_value);
    ifcopenshell_attribute_value_variant_free_contents(js_value);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_base_attribute_kind_of(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    int32_t js_attribute_index = 0;
    napi_get_value_int32(env, argv[1], &js_attribute_index);
    int result = ifcopenshell_base_attribute_kind_of(handle, js_attribute_index);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_base_get_argument_index(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    std::string js_name = napi_string_value(env, argv[1]);
    int result = ifcopenshell_base_get_argument_index(handle, js_name.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_base_attribute_name(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    int32_t js_attribute_index = 0;
    napi_get_value_int32(env, argv[1], &js_attribute_index);
    char* result = ifcopenshell_base_attribute_name(handle, js_attribute_index);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value napi_base_attribute_type(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    int32_t js_attribute_index = 0;
    napi_get_value_int32(env, argv[1], &js_attribute_index);
    char* result = ifcopenshell_base_attribute_type(handle, js_attribute_index);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value napi_base_get_attribute_category(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    std::string js_name = napi_string_value(env, argv[1]);
    int result = ifcopenshell_base_get_attribute_category(handle, js_name.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_base_is_a(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    std::string js_name = napi_string_value(env, argv[1]);
    bool result = ifcopenshell_base_is_a(handle, js_name.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_base_get_all_attribute_values(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_base(env, argv[0]);
    ifcopenshell_attribute_value_variant_list_t result = ifcopenshell_base_get_all_attribute_values(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        ifcopenshell_attribute_value_variant_list_free(result);
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_array_with_length(env, result.count, &js_result);
    for (int index = 0; index < result.count; ++index) {
        napi_set_element(env, js_result, index, ifcopenshell_attribute_value_variant_to_js(env, result.items[index]));
    }
    ifcopenshell_attribute_value_variant_list_free(result);
    return js_result;
}

napi_value napi_entity_get_inverse(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_entity(env, argv[0]);
    std::string js_attribute_name = napi_string_value(env, argv[1]);
    auto* result = ifcopenshell_entity_get_inverse(handle, js_attribute_name.c_str());
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_express_entity_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_express_entity_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_express_entity(env, item));
    }
    ifcopenshell_express_entity_list_free(result);
    return js_result;
}

napi_value napi_select_new(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* result = ifcopenshell_select_new();
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_express_select(env, result);
}

napi_value napi_select_new_with_value(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_value = unwrap_express_base(env, argv[0]);
    auto* result = ifcopenshell_select_new_with_value(js_value);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_express_select(env, result);
}

napi_value napi_select_concrete(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_express_select(env, argv[0]);
    auto* result = ifcopenshell_select_concrete(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_express_base(env, result);
}

napi_value napi_logger_set_product(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    auto* js_product = unwrap_express_base(env, argv[1]);
    ifcopenshell_logger_set_product(handle, js_product);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_notice_with_message_instance(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    std::string js_message = napi_string_value(env, argv[1]);
    ifcopenshell_logger_notice_with_message_instance(handle, js_message.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_notice_with_message_instance_with_instance(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    std::string js_message = napi_string_value(env, argv[1]);
    auto* js_instance = unwrap_express_base(env, argv[2]);
    ifcopenshell_logger_notice_with_message_instance_with_instance(handle, js_message.c_str(), js_instance);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_warning_with_message_instance(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    std::string js_message = napi_string_value(env, argv[1]);
    ifcopenshell_logger_warning_with_message_instance(handle, js_message.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_warning_with_message_instance_with_instance(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    std::string js_message = napi_string_value(env, argv[1]);
    auto* js_instance = unwrap_express_base(env, argv[2]);
    ifcopenshell_logger_warning_with_message_instance_with_instance(handle, js_message.c_str(), js_instance);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_error_with_message_instance(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    std::string js_message = napi_string_value(env, argv[1]);
    ifcopenshell_logger_error_with_message_instance(handle, js_message.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_error_with_message_instance_with_instance(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    std::string js_message = napi_string_value(env, argv[1]);
    auto* js_instance = unwrap_express_base(env, argv[2]);
    ifcopenshell_logger_error_with_message_instance_with_instance(handle, js_message.c_str(), js_instance);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_notice_with_exception_instance(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    auto* js_exception = unwrap_ifcopenshell_exception(env, argv[1]);
    ifcopenshell_logger_notice_with_exception_instance(handle, js_exception);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_notice_with_exception_instance_with_instance(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    auto* js_exception = unwrap_ifcopenshell_exception(env, argv[1]);
    auto* js_instance = unwrap_express_base(env, argv[2]);
    ifcopenshell_logger_notice_with_exception_instance_with_instance(handle, js_exception, js_instance);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_warning_with_exception_instance(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    auto* js_exception = unwrap_ifcopenshell_exception(env, argv[1]);
    ifcopenshell_logger_warning_with_exception_instance(handle, js_exception);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_warning_with_exception_instance_with_instance(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    auto* js_exception = unwrap_ifcopenshell_exception(env, argv[1]);
    auto* js_instance = unwrap_express_base(env, argv[2]);
    ifcopenshell_logger_warning_with_exception_instance_with_instance(handle, js_exception, js_instance);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_error_with_exception_instance(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    auto* js_exception = unwrap_ifcopenshell_exception(env, argv[1]);
    ifcopenshell_logger_error_with_exception_instance(handle, js_exception);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_error_with_exception_instance_with_instance(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    auto* js_exception = unwrap_ifcopenshell_exception(env, argv[1]);
    auto* js_instance = unwrap_express_base(env, argv[2]);
    ifcopenshell_logger_error_with_exception_instance_with_instance(handle, js_exception, js_instance);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_status(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    std::string js_message = napi_string_value(env, argv[1]);
    ifcopenshell_logger_status(handle, js_message.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_status_with_new_line(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    std::string js_message = napi_string_value(env, argv[1]);
    bool js_new_line = false;
    napi_get_value_bool(env, argv[2], &js_new_line);
    ifcopenshell_logger_status_with_new_line(handle, js_message.c_str(), js_new_line);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_progress_bar(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    int32_t js_progress = 0;
    napi_get_value_int32(env, argv[1], &js_progress);
    ifcopenshell_logger_progress_bar(handle, js_progress);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_get_log(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    char* result = ifcopenshell_logger_get_log(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value napi_logger_count(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    std::string js_code = napi_string_value(env, argv[1]);
    int result = ifcopenshell_logger_count(handle, js_code.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_logger_clear(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    ifcopenshell_logger_clear(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_append(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    auto* js_other = unwrap_ifcopenshell_logger(env, argv[1]);
    ifcopenshell_logger_append(handle, js_other);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_print_performance_stats(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    ifcopenshell_logger_print_performance_stats(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_print_performance_stats_on_element_with_enabled(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    bool js_enabled = false;
    napi_get_value_bool(env, argv[1], &js_enabled);
    ifcopenshell_logger_print_performance_stats_on_element_with_enabled(handle, js_enabled);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_logger_print_performance_stats_on_element_overload_2(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_logger(env, argv[0]);
    bool result = ifcopenshell_logger_print_performance_stats_on_element_overload_2(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_full_buffer_impl_new(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* result = ifcopenshell_full_buffer_impl_new();
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_full_buffer_impl(env, result);
}

napi_value napi_full_buffer_impl_new_with_path(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_path = napi_string_value(env, argv[0]);
    auto* result = ifcopenshell_full_buffer_impl_new_with_path(js_path.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_full_buffer_impl(env, result);
}

napi_value napi_full_buffer_impl_size(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_full_buffer_impl(env, argv[0]);
    int result = ifcopenshell_full_buffer_impl_size(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_full_buffer_impl_get_u32(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_full_buffer_impl(env, argv[0]);
    int32_t js_position = 0;
    napi_get_value_int32(env, argv[1], &js_position);
    int result = ifcopenshell_full_buffer_impl_get_u32(handle, js_position);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_full_buffer_impl_push_next_page(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_full_buffer_impl(env, argv[0]);
    std::string js_page_data = napi_string_value(env, argv[1]);
    ifcopenshell_full_buffer_impl_push_next_page(handle, js_page_data.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_full_buffer_impl_drop_pages(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_full_buffer_impl(env, argv[0]);
    int32_t js_up_to_position = 0;
    napi_get_value_int32(env, argv[1], &js_up_to_position);
    ifcopenshell_full_buffer_impl_drop_pages(handle, js_up_to_position);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_paged_file_impl_new_with_path_page_size_page_capacity(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_path = napi_string_value(env, argv[0]);
    int32_t js_page_size = 0;
    napi_get_value_int32(env, argv[1], &js_page_size);
    int32_t js_page_capacity = 0;
    napi_get_value_int32(env, argv[2], &js_page_capacity);
    auto* result = ifcopenshell_paged_file_impl_new_with_path_page_size_page_capacity(js_path.c_str(), js_page_size, js_page_capacity);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_paged_file_impl(env, result);
}

napi_value napi_paged_file_impl_size(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_paged_file_impl(env, argv[0]);
    int result = ifcopenshell_paged_file_impl_size(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_paged_file_impl_get_u32(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_paged_file_impl(env, argv[0]);
    int32_t js_position = 0;
    napi_get_value_int32(env, argv[1], &js_position);
    int result = ifcopenshell_paged_file_impl_get_u32(handle, js_position);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_paged_file_impl_push_next_page(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_paged_file_impl(env, argv[0]);
    std::string js_page_data = napi_string_value(env, argv[1]);
    ifcopenshell_paged_file_impl_push_next_page(handle, js_page_data.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_paged_file_impl_drop_pages(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_paged_file_impl(env, argv[0]);
    int32_t js_up_to_position = 0;
    napi_get_value_int32(env, argv[1], &js_up_to_position);
    ifcopenshell_paged_file_impl_drop_pages(handle, js_up_to_position);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_pushed_sequential_impl_size(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_pushed_sequential_impl(env, argv[0]);
    int result = ifcopenshell_pushed_sequential_impl_size(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_pushed_sequential_impl_get_u32(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_pushed_sequential_impl(env, argv[0]);
    int32_t js_position = 0;
    napi_get_value_int32(env, argv[1], &js_position);
    int result = ifcopenshell_pushed_sequential_impl_get_u32(handle, js_position);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_pushed_sequential_impl_push_next_page(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_pushed_sequential_impl(env, argv[0]);
    std::string js_page_data = napi_string_value(env, argv[1]);
    ifcopenshell_pushed_sequential_impl_push_next_page(handle, js_page_data.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_pushed_sequential_impl_drop_pages(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_pushed_sequential_impl(env, argv[0]);
    int32_t js_up_to_position = 0;
    napi_get_value_int32(env, argv[1], &js_up_to_position);
    ifcopenshell_pushed_sequential_impl_drop_pages(handle, js_up_to_position);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_character_encoder_new_with_input(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_input = napi_string_value(env, argv[0]);
    auto* result = ifcopenshell_character_encoder_new_with_input(js_input.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_character_encoder(env, result);
}

napi_value napi_token_new(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* result = ifcopenshell_token_new();
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_token(env, result);
}

napi_value napi_token_is_string(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_is_string(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_is_identifier(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_is_identifier(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_is_operator(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_is_operator(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_is_enumeration(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_is_enumeration(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_is_keyword(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_is_keyword(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_is_int(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_is_int(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_is_bool(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_is_bool(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_is_logical(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_is_logical(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_is_float(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_is_float(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_is_binary(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_is_binary(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_as_identifier(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    int result = ifcopenshell_token_as_identifier(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_token_as_bool(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    bool result = ifcopenshell_token_as_bool(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_token_as_string(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    char* result = ifcopenshell_token_as_string(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value napi_token_to_string(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_token(env, argv[0]);
    char* result = ifcopenshell_token_to_string(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value napi_enumeration_reference_new(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* result = ifcopenshell_enumeration_reference_new();
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_enumeration_reference(env, result);
}

napi_value napi_enumeration_reference_new_with_enumeration(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_enumeration = unwrap_ifcopenshell_enumeration_type(env, argv[0]);
    auto* result = ifcopenshell_enumeration_reference_new_with_enumeration(js_enumeration);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_enumeration_reference(env, result);
}

napi_value napi_enumeration_reference_new_with_enumeration_index(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_enumeration = unwrap_ifcopenshell_enumeration_type(env, argv[0]);
    int32_t js_index = 0;
    napi_get_value_int32(env, argv[1], &js_index);
    auto* result = ifcopenshell_enumeration_reference_new_with_enumeration_index(js_enumeration, js_index);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_enumeration_reference(env, result);
}

napi_value napi_enumeration_reference_index(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_enumeration_reference(env, argv[0]);
    int result = ifcopenshell_enumeration_reference_index(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_enumeration_reference_enumeration(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_enumeration_reference(env, argv[0]);
    auto* result = ifcopenshell_enumeration_reference_enumeration(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_enumeration_type(env, result);
}

napi_value napi_attribute_value_new(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* result = ifcopenshell_attribute_value_new();
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_attribute_value(env, result);
}

napi_value napi_attribute_value_is_null(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_attribute_value(env, argv[0]);
    bool result = ifcopenshell_attribute_value_is_null(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_attribute_value_size(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_attribute_value(env, argv[0]);
    int result = ifcopenshell_attribute_value_size(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_attribute_value_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_attribute_value(env, argv[0]);
    int result = ifcopenshell_attribute_value_type(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int32(env, result, &js_result);
    return js_result;
}

napi_value napi_spf_header_new(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* result = ifcopenshell_spf_header_new();
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_spf_header(env, result);
}

napi_value napi_spf_header_new_with_file(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_file = unwrap_ifcopenshell_file(env, argv[0]);
    auto* result = ifcopenshell_spf_header_new_with_file(js_file);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_spf_header(env, result);
}

napi_value napi_spf_header_new_with_file_logger(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_file = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_logger = unwrap_ifcopenshell_logger(env, argv[1]);
    auto* result = ifcopenshell_spf_header_new_with_file_logger(js_file, js_logger);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_spf_header(env, result);
}

napi_value napi_spf_header_owner_file(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_spf_header(env, argv[0]);
    auto* js_file = unwrap_ifcopenshell_file(env, argv[1]);
    ifcopenshell_spf_header_owner_file(handle, js_file);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_spf_header_assign(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_spf_header(env, argv[0]);
    auto* js_other = unwrap_ifcopenshell_spf_header(env, argv[1]);
    ifcopenshell_spf_header_assign(handle, js_other);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_new_with_path(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_path = napi_string_value(env, argv[0]);
    auto* result = ifcopenshell_file_new_with_path(js_path.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_new_with_path_with_filetype(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_path = napi_string_value(env, argv[0]);
    int32_t js_filetype = 0;
    napi_get_value_int32(env, argv[1], &js_filetype);
    auto* result = ifcopenshell_file_new_with_path_with_filetype(js_path.c_str(), static_cast<ifcopenshell_file_type_t>(js_filetype));
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_new_with_path_with_filetype_readonly(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_path = napi_string_value(env, argv[0]);
    int32_t js_filetype = 0;
    napi_get_value_int32(env, argv[1], &js_filetype);
    bool js_readonly = false;
    napi_get_value_bool(env, argv[2], &js_readonly);
    auto* result = ifcopenshell_file_new_with_path_with_filetype_readonly(js_path.c_str(), static_cast<ifcopenshell_file_type_t>(js_filetype), js_readonly);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_new_with_path_with_filetype_readonly_logger(napi_env env, napi_callback_info info) {
    size_t argc = 4;
    napi_value argv[4];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_path = napi_string_value(env, argv[0]);
    int32_t js_filetype = 0;
    napi_get_value_int32(env, argv[1], &js_filetype);
    bool js_readonly = false;
    napi_get_value_bool(env, argv[2], &js_readonly);
    auto* js_logger = unwrap_ifcopenshell_logger(env, argv[3]);
    auto* result = ifcopenshell_file_new_with_path_with_filetype_readonly_logger(js_path.c_str(), static_cast<ifcopenshell_file_type_t>(js_filetype), js_readonly, js_logger);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_new_with_data_data_size(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    void* js_data = nullptr;
    size_t js_data_length = 0;
    napi_get_buffer_info(env, argv[0], &js_data, &js_data_length);
    int32_t js_data_size = 0;
    napi_get_value_int32(env, argv[1], &js_data_size);
    auto* result = ifcopenshell_file_new_with_data_data_size(static_cast<const char*>(js_data), js_data_size);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_new_with_data_data_size_with_logger(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    void* js_data = nullptr;
    size_t js_data_length = 0;
    napi_get_buffer_info(env, argv[0], &js_data, &js_data_length);
    int32_t js_data_size = 0;
    napi_get_value_int32(env, argv[1], &js_data_size);
    auto* js_logger = unwrap_ifcopenshell_logger(env, argv[2]);
    auto* result = ifcopenshell_file_new_with_data_data_size_with_logger(static_cast<const char*>(js_data), js_data_size, js_logger);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_new(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* result = ifcopenshell_file_new();
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_new_with_schema(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_schema = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    auto* result = ifcopenshell_file_new_with_schema(js_schema);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_new_with_schema_filetype(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_schema = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    int32_t js_filetype = 0;
    napi_get_value_int32(env, argv[1], &js_filetype);
    auto* result = ifcopenshell_file_new_with_schema_filetype(js_schema, static_cast<ifcopenshell_file_type_t>(js_filetype));
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_new_with_schema_filetype_path(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_schema = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    int32_t js_filetype = 0;
    napi_get_value_int32(env, argv[1], &js_filetype);
    std::string js_path = napi_string_value(env, argv[2]);
    auto* result = ifcopenshell_file_new_with_schema_filetype_path(js_schema, static_cast<ifcopenshell_file_type_t>(js_filetype), js_path.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_new_with_schema_filetype_path_logger(napi_env env, napi_callback_info info) {
    size_t argc = 4;
    napi_value argv[4];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_schema = unwrap_ifcopenshell_schema_definition(env, argv[0]);
    int32_t js_filetype = 0;
    napi_get_value_int32(env, argv[1], &js_filetype);
    std::string js_path = napi_string_value(env, argv[2]);
    auto* js_logger = unwrap_ifcopenshell_logger(env, argv[3]);
    auto* result = ifcopenshell_file_new_with_schema_filetype_path_logger(js_schema, static_cast<ifcopenshell_file_type_t>(js_filetype), js_path.c_str(), js_logger);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file(env, result);
}

napi_value napi_file_initialize(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    std::string js_path = napi_string_value(env, argv[1]);
    bool result = ifcopenshell_file_initialize(handle, js_path.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_file_initialize_with_filetype(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    std::string js_path = napi_string_value(env, argv[1]);
    int32_t js_filetype = 0;
    napi_get_value_int32(env, argv[2], &js_filetype);
    bool result = ifcopenshell_file_initialize_with_filetype(handle, js_path.c_str(), static_cast<ifcopenshell_file_type_t>(js_filetype));
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_file_initialize_with_filetype_readonly(napi_env env, napi_callback_info info) {
    size_t argc = 4;
    napi_value argv[4];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    std::string js_path = napi_string_value(env, argv[1]);
    int32_t js_filetype = 0;
    napi_get_value_int32(env, argv[2], &js_filetype);
    bool js_readonly = false;
    napi_get_value_bool(env, argv[3], &js_readonly);
    bool result = ifcopenshell_file_initialize_with_filetype_readonly(handle, js_path.c_str(), static_cast<ifcopenshell_file_type_t>(js_filetype), js_readonly);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

napi_value napi_file_bypass_type(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    std::string js_type_name = napi_string_value(env, argv[1]);
    ifcopenshell_file_bypass_type(handle, js_type_name.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_good(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* result = ifcopenshell_file_good(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_file_open_status(env, result);
}

napi_value napi_file_instances_by_type_with_declaration(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_declaration = unwrap_ifcopenshell_declaration(env, argv[1]);
    auto* result = ifcopenshell_file_instances_by_type_with_declaration(handle, js_declaration);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_express_base_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_express_base_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_express_base(env, item));
    }
    ifcopenshell_express_base_list_free(result);
    return js_result;
}

napi_value napi_file_instances_by_type_excl_subtypes_with_declaration(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_declaration = unwrap_ifcopenshell_declaration(env, argv[1]);
    auto* result = ifcopenshell_file_instances_by_type_excl_subtypes_with_declaration(handle, js_declaration);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_express_base_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_express_base_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_express_base(env, item));
    }
    ifcopenshell_express_base_list_free(result);
    return js_result;
}

napi_value napi_file_instances_by_type_with_type_name(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    std::string js_type_name = napi_string_value(env, argv[1]);
    auto* result = ifcopenshell_file_instances_by_type_with_type_name(handle, js_type_name.c_str());
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_express_base_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_express_base_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_express_base(env, item));
    }
    ifcopenshell_express_base_list_free(result);
    return js_result;
}

napi_value napi_file_instances_by_type_excl_subtypes_with_type_name(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    std::string js_type_name = napi_string_value(env, argv[1]);
    auto* result = ifcopenshell_file_instances_by_type_excl_subtypes_with_type_name(handle, js_type_name.c_str());
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_express_base_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_express_base_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_express_base(env, item));
    }
    ifcopenshell_express_base_list_free(result);
    return js_result;
}

napi_value napi_file_instances_by_reference(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    int32_t js_reference_id = 0;
    napi_get_value_int32(env, argv[1], &js_reference_id);
    auto* result = ifcopenshell_file_instances_by_reference(handle, js_reference_id);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_express_base_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_express_base_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_express_base(env, item));
    }
    ifcopenshell_express_base_list_free(result);
    return js_result;
}

napi_value napi_file_instance_by_id(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    int32_t js_instance_id = 0;
    napi_get_value_int32(env, argv[1], &js_instance_id);
    auto* result = ifcopenshell_file_instance_by_id(handle, js_instance_id);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_express_base(env, result);
}

napi_value napi_file_instance_by_guid(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    std::string js_global_id = napi_string_value(env, argv[1]);
    auto* result = ifcopenshell_file_instance_by_guid(handle, js_global_id.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_express_base(env, result);
}

napi_value napi_file_get_inverse(napi_env env, napi_callback_info info) {
    size_t argc = 4;
    napi_value argv[4];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    int32_t js_instance_id = 0;
    napi_get_value_int32(env, argv[1], &js_instance_id);
    auto* js_declaration = unwrap_ifcopenshell_declaration(env, argv[2]);
    int32_t js_attribute_index = 0;
    napi_get_value_int32(env, argv[3], &js_attribute_index);
    auto* result = ifcopenshell_file_get_inverse(handle, js_instance_id, js_declaration, js_attribute_index);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    int size = ifcopenshell_express_entity_list_size(result);
    napi_value js_result;
    napi_create_array_with_length(env, size, &js_result);
    for (int index = 0; index < size; ++index) {
        auto* item = ifcopenshell_express_entity_list_get(result, index);
        napi_set_element(env, js_result, index, wrap_express_entity(env, item));
    }
    ifcopenshell_express_entity_list_free(result);
    return js_result;
}

napi_value napi_file_get_total_inverses(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    int32_t js_instance_id = 0;
    napi_get_value_int32(env, argv[1], &js_instance_id);
    int result = ifcopenshell_file_get_total_inverses(handle, js_instance_id);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_file_fresh_id(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    int result = ifcopenshell_file_fresh_id(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_file_get_max_id(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    int result = ifcopenshell_file_get_max_id(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_int64(env, result, &js_result);
    return js_result;
}

napi_value napi_file_ifcroot_type(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* result = ifcopenshell_file_ifcroot_type(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_declaration(env, result);
}

napi_value napi_file_recalculate_id_counter(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    ifcopenshell_file_recalculate_id_counter(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_add_entity(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_entity = unwrap_express_base(env, argv[1]);
    auto* result = ifcopenshell_file_add_entity(handle, js_entity);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_express_base(env, result);
}

napi_value napi_file_add_entity_with_instance_id(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_entity = unwrap_express_base(env, argv[1]);
    int32_t js_instance_id = 0;
    napi_get_value_int32(env, argv[2], &js_instance_id);
    auto* result = ifcopenshell_file_add_entity_with_instance_id(handle, js_entity, js_instance_id);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_express_base(env, result);
}

napi_value napi_file_remove_entity(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_entity = unwrap_express_base(env, argv[1]);
    ifcopenshell_file_remove_entity(handle, js_entity);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_header(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* result = ifcopenshell_file_header(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_spf_header(env, result);
}

napi_value napi_file_schema(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* result = ifcopenshell_file_schema(handle);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_schema_definition(env, result);
}

napi_value napi_file_build_inverses_overload_1(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    ifcopenshell_file_build_inverses_overload_1(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_register_inverse(napi_env env, napi_callback_info info) {
    size_t argc = 5;
    napi_value argv[5];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    int32_t js_referenced_id = 0;
    napi_get_value_int32(env, argv[1], &js_referenced_id);
    auto* js_from_entity = unwrap_ifcopenshell_entity(env, argv[2]);
    int32_t js_instance_id = 0;
    napi_get_value_int32(env, argv[3], &js_instance_id);
    int32_t js_attribute_index = 0;
    napi_get_value_int32(env, argv[4], &js_attribute_index);
    ifcopenshell_file_register_inverse(handle, js_referenced_id, js_from_entity, js_instance_id, js_attribute_index);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_unregister_inverse(napi_env env, napi_callback_info info) {
    size_t argc = 5;
    napi_value argv[5];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    int32_t js_referenced_id = 0;
    napi_get_value_int32(env, argv[1], &js_referenced_id);
    auto* js_from_entity = unwrap_ifcopenshell_entity(env, argv[2]);
    auto* js_entity = unwrap_express_base(env, argv[3]);
    int32_t js_attribute_index = 0;
    napi_get_value_int32(env, argv[4], &js_attribute_index);
    ifcopenshell_file_unregister_inverse(handle, js_referenced_id, js_from_entity, js_entity, js_attribute_index);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_add_type_ref(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_new_entity = unwrap_express_base(env, argv[1]);
    ifcopenshell_file_add_type_ref(handle, js_new_entity);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_remove_type_ref(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_new_entity = unwrap_express_base(env, argv[1]);
    ifcopenshell_file_remove_type_ref(handle, js_new_entity);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_process_deletion_inverse(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_entity = unwrap_express_base(env, argv[1]);
    ifcopenshell_file_process_deletion_inverse(handle, js_entity);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_build_inverses_with_entity(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_entity = unwrap_express_base(env, argv[1]);
    ifcopenshell_file_build_inverses_with_entity(handle, js_entity);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_create_with_declaration_instance_id(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_declaration = unwrap_ifcopenshell_declaration(env, argv[1]);
    auto* result = ifcopenshell_file_create_with_declaration_instance_id(handle, js_declaration);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_express_base(env, result);
}

napi_value napi_file_create_with_declaration_instance_id_with_instance_id(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value argv[3];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    auto* js_declaration = unwrap_ifcopenshell_declaration(env, argv[1]);
    int32_t js_instance_id = 0;
    napi_get_value_int32(env, argv[2], &js_instance_id);
    auto* result = ifcopenshell_file_create_with_declaration_instance_id_with_instance_id(handle, js_declaration, js_instance_id);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_express_base(env, result);
}

napi_value napi_file_batch(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    ifcopenshell_file_batch(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_unbatch(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    ifcopenshell_file_unbatch(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_reset_identity_cache(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    ifcopenshell_file_reset_identity_cache(handle);
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_file_write(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_file(env, argv[0]);
    std::string js_path = napi_string_value(env, argv[1]);
    ifcopenshell_file_write(handle, js_path.c_str());
    if (ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_undefined;
    napi_get_undefined(env, &js_undefined);
    return js_undefined;
}

napi_value napi_global_id_new(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* result = ifcopenshell_global_id_new();
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_global_id(env, result);
}

napi_value napi_global_id_new_with_logger(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* js_logger = unwrap_ifcopenshell_logger(env, argv[0]);
    auto* result = ifcopenshell_global_id_new_with_logger(js_logger);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_global_id(env, result);
}

napi_value napi_global_id_new_with_value(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_value = napi_string_value(env, argv[0]);
    auto* result = ifcopenshell_global_id_new_with_value(js_value.c_str());
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_global_id(env, result);
}

napi_value napi_global_id_new_with_value_with_logger(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    std::string js_value = napi_string_value(env, argv[0]);
    auto* js_logger = unwrap_ifcopenshell_logger(env, argv[1]);
    auto* result = ifcopenshell_global_id_new_with_value_with_logger(js_value.c_str(), js_logger);
    if (result == nullptr && ifcopenshell_last_error_message() != nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    return wrap_ifcopenshell_global_id(env, result);
}

napi_value napi_global_id_formatted(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* handle = unwrap_ifcopenshell_global_id(env, argv[0]);
    char* result = ifcopenshell_global_id_formatted(handle);
    if (result == nullptr) {
        return throw_last_error(env, "Native call failed");
    }
    napi_value js_result;
    napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &js_result);
    ifcopenshell_string_free(result);
    return js_result;
}

napi_value make_async_error(napi_env env, const std::string& message) {
    napi_value error_message;
    napi_create_string_utf8(env, message.c_str(), NAPI_AUTO_LENGTH, &error_message);
    napi_value error;
    napi_create_error(env, nullptr, error_message, &error);
    return error;
}

struct file_new_with_path_async_data_t {
    std::string path;
    ifcopenshell_file_t* result = nullptr;
    std::string error;
    napi_deferred deferred = nullptr;
    napi_async_work work = nullptr;
};

void file_new_with_path_async_execute(napi_env, void* raw_data) {
    auto* data = static_cast<file_new_with_path_async_data_t*>(raw_data);
    data->result = ifcopenshell_file_new_with_path(data->path.c_str());
    const char* message = ifcopenshell_last_error_message();
    if (message != nullptr) {
        data->error = message;
    }
}

void file_new_with_path_async_complete(napi_env env, napi_status status, void* raw_data) {
    auto* data = static_cast<file_new_with_path_async_data_t*>(raw_data);
    if (status != napi_ok) {
        napi_reject_deferred(env, data->deferred, make_async_error(env, "Async work did not complete"));
    } else if (!data->error.empty()) {
        napi_reject_deferred(env, data->deferred, make_async_error(env, data->error));
    } else {
        napi_resolve_deferred(env, data->deferred, wrap_ifcopenshell_file(env, data->result));
    }
    napi_delete_async_work(env, data->work);
    delete data;
}

// Async sibling of `napi_file_new_with_path`: the file path is copied into an owned
// `std::string` here on the main thread, then the parse itself
// (`ifcopenshell_file_new_with_path` -- the exact same, already-emitted synchronous
// C-ABI function, pure C++ with no V8/N-API calls inside it) runs on a libuv worker
// thread via `napi_create_async_work`, so a large file's parse no longer blocks the
// event loop for every other concurrent request (planning/ifcopenshell-ts/
// 10-architecture.md's "Async story").
napi_value napi_file_new_with_path_async(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* data = new file_new_with_path_async_data_t();
    data->path = napi_string_value(env, argv[0]);
    napi_value promise;
    napi_create_promise(env, &data->deferred, &promise);
    napi_value resource_name;
    napi_create_string_utf8(env, "file_new_with_path_async", NAPI_AUTO_LENGTH, &resource_name);
    napi_create_async_work(env, nullptr, resource_name, file_new_with_path_async_execute, file_new_with_path_async_complete, data, &data->work);
    napi_queue_async_work(env, data->work);
    return promise;
}

struct file_new_with_data_data_size_async_data_t {
    std::vector<char> data;
    ifcopenshell_file_t* result = nullptr;
    std::string error;
    napi_deferred deferred = nullptr;
    napi_async_work work = nullptr;
};

void file_new_with_data_data_size_async_execute(napi_env, void* raw_data) {
    auto* data = static_cast<file_new_with_data_data_size_async_data_t*>(raw_data);
    data->result = ifcopenshell_file_new_with_data_data_size(data->data.data(), static_cast<int>(data->data.size()));
    const char* message = ifcopenshell_last_error_message();
    if (message != nullptr) {
        data->error = message;
    }
}

void file_new_with_data_data_size_async_complete(napi_env env, napi_status status, void* raw_data) {
    auto* data = static_cast<file_new_with_data_data_size_async_data_t*>(raw_data);
    if (status != napi_ok) {
        napi_reject_deferred(env, data->deferred, make_async_error(env, "Async work did not complete"));
    } else if (!data->error.empty()) {
        napi_reject_deferred(env, data->deferred, make_async_error(env, data->error));
    } else {
        napi_resolve_deferred(env, data->deferred, wrap_ifcopenshell_file(env, data->result));
    }
    napi_delete_async_work(env, data->work);
    delete data;
}

// Async sibling of `napi_file_new_with_data_data_size`. The input `Buffer`'s bytes are
// copied into an owned `std::vector<char>` on the main thread (not just its raw pointer
// captured across the async boundary): the underlying C++ constructor
// (`ifcopenshell::file(void* data, int data_size, ...)`, parse.cpp) already copies the
// bytes it needs into its own internal storage before returning, so this isn't required
// for *that* call's own correctness -- it's required because nothing may assume a
// JS-managed `Buffer` allocation survives untouched while a GC pass can run
// concurrently on the main thread during the worker thread's (possibly lengthy) parse.
// The caller-supplied `data_size` is clamped to the copied buffer's actual length so an
// out-of-range value can't read past the copy.
napi_value napi_file_new_with_data_data_size_async(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* data = new file_new_with_data_data_size_async_data_t();
    {
        void* buffer_data = nullptr;
        size_t buffer_length = 0;
        napi_get_buffer_info(env, argv[0], &buffer_data, &buffer_length);
        data->data.assign(static_cast<const char*>(buffer_data), static_cast<const char*>(buffer_data) + buffer_length);
    }
    int32_t js_data_size = 0;
    napi_get_value_int32(env, argv[1], &js_data_size);
    data->data.resize(static_cast<size_t>(std::max(0, std::min<int32_t>(js_data_size, static_cast<int32_t>(data->data.size())))));
    napi_value promise;
    napi_create_promise(env, &data->deferred, &promise);
    napi_value resource_name;
    napi_create_string_utf8(env, "file_new_with_data_data_size_async", NAPI_AUTO_LENGTH, &resource_name);
    napi_create_async_work(env, nullptr, resource_name, file_new_with_data_data_size_async_execute, file_new_with_data_data_size_async_complete, data, &data->work);
    napi_queue_async_work(env, data->work);
    return promise;
}

struct base_get_all_attribute_values_async_data_t {
    ifcopenshell_express_base_t* self = nullptr;
    napi_ref self_ref = nullptr;
    ifcopenshell_attribute_value_variant_list_t result{};
    std::string error;
    napi_deferred deferred = nullptr;
    napi_async_work work = nullptr;
};

void base_get_all_attribute_values_async_execute(napi_env, void* raw_data) {
    auto* data = static_cast<base_get_all_attribute_values_async_data_t*>(raw_data);
    data->result = ifcopenshell_base_get_all_attribute_values(data->self);
    const char* message = ifcopenshell_last_error_message();
    if (message != nullptr) {
        data->error = message;
    }
}

void base_get_all_attribute_values_async_complete(napi_env env, napi_status status, void* raw_data) {
    auto* data = static_cast<base_get_all_attribute_values_async_data_t*>(raw_data);
    napi_delete_reference(env, data->self_ref);
    if (status != napi_ok) {
        napi_reject_deferred(env, data->deferred, make_async_error(env, "Async work did not complete"));
    } else if (!data->error.empty()) {
        napi_reject_deferred(env, data->deferred, make_async_error(env, data->error));
        ifcopenshell_attribute_value_variant_list_free(data->result);
    } else {
        napi_value js_result;
        napi_create_array_with_length(env, data->result.count, &js_result);
        for (int index = 0; index < data->result.count; ++index) {
            napi_set_element(env, js_result, index, ifcopenshell_attribute_value_variant_to_js(env, data->result.items[index]));
        }
        ifcopenshell_attribute_value_variant_list_free(data->result);
        napi_resolve_deferred(env, data->deferred, js_result);
    }
    napi_delete_async_work(env, data->work);
    delete data;
}

// Async sibling of `napi_base_get_all_attribute_values` -- the Phase 1 stand-in for
// Python's fully-recursive `get_info_cpp` bulk serializer named explicitly in
// `10-architecture.md`'s "Async story". `argv[0]`'s already-unwrapped C-ABI pointer
// (`data->self`) is used directly by the worker thread rather than copied: the
// generated `ifcopenshell_express_base_t` struct is only forward-declared here (its
// full definition, needed to copy-construct one, lives in
// `ifcopenshell_native_c_api.cpp`, a separate translation unit), so instead a
// `napi_ref` pins the original JS wrapper object alive (and therefore its finalizer
// un-run, and therefore `self` un-freed) for the exact duration of the async work --
// released in the "complete" callback once the worker thread is done dereferencing it.
napi_value napi_base_get_all_attribute_values_async(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* data = new base_get_all_attribute_values_async_data_t();
    data->self = unwrap_express_base(env, argv[0]);
    napi_create_reference(env, argv[0], 1, &data->self_ref);
    napi_value promise;
    napi_create_promise(env, &data->deferred, &promise);
    napi_value resource_name;
    napi_create_string_utf8(env, "base_get_all_attribute_values_async", NAPI_AUTO_LENGTH, &resource_name);
    napi_create_async_work(env, nullptr, resource_name, base_get_all_attribute_values_async_execute, base_get_all_attribute_values_async_complete, data, &data->work);
    napi_queue_async_work(env, data->work);
    return promise;
}

struct file_write_async_data_t {
    ifcopenshell_file_t* self = nullptr;
    napi_ref self_ref = nullptr;
    std::string path;
    std::string error;
    napi_deferred deferred = nullptr;
    napi_async_work work = nullptr;
};

void file_write_async_execute(napi_env, void* raw_data) {
    auto* data = static_cast<file_write_async_data_t*>(raw_data);
    ifcopenshell_file_write(data->self, data->path.c_str());
    const char* message = ifcopenshell_last_error_message();
    if (message != nullptr) {
        data->error = message;
    }
}

void file_write_async_complete(napi_env env, napi_status status, void* raw_data) {
    auto* data = static_cast<file_write_async_data_t*>(raw_data);
    napi_delete_reference(env, data->self_ref);
    if (status != napi_ok) {
        napi_reject_deferred(env, data->deferred, make_async_error(env, "Async work did not complete"));
    } else if (!data->error.empty()) {
        napi_reject_deferred(env, data->deferred, make_async_error(env, data->error));
    } else {
        napi_value js_undefined;
        napi_get_undefined(env, &js_undefined);
        napi_resolve_deferred(env, data->deferred, js_undefined);
    }
    napi_delete_async_work(env, data->work);
    delete data;
}

// Async sibling of `napi_file_write`, per `10-architecture.md`'s "Async story" mandate
// (file open/parse, the bulk attribute-value serializer, and `write` are the three
// primitives named as needing one). Same `napi_ref`-pinning technique as
// `napi_base_get_all_attribute_values_async` above: `data->self` is the original,
// already-unwrapped `ifcopenshell_file_t*`, kept alive (and therefore the underlying
// `ifcopenshell::file` it shares ownership of, via its `shared_ptr`) for the exact
// duration of the worker thread's serialization by a `napi_ref` on `argv[0]`, not by
// copying the (here-incomplete) C-ABI struct.
napi_value napi_file_write_async(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    auto* data = new file_write_async_data_t();
    data->self = unwrap_ifcopenshell_file(env, argv[0]);
    napi_create_reference(env, argv[0], 1, &data->self_ref);
    data->path = napi_string_value(env, argv[1]);
    napi_value promise;
    napi_create_promise(env, &data->deferred, &promise);
    napi_value resource_name;
    napi_create_string_utf8(env, "file_write_async", NAPI_AUTO_LENGTH, &resource_name);
    napi_create_async_work(env, nullptr, resource_name, file_write_async_execute, file_write_async_complete, data, &data->work);
    napi_queue_async_work(env, data->work);
    return promise;
}

}  // namespace

napi_value Init(napi_env env, napi_value exports) {
    {
        napi_value fn;
        napi_create_function(env, "exception_new_with_message", NAPI_AUTO_LENGTH, napi_exception_new_with_message, nullptr, &fn);
        napi_set_named_property(env, exports, "exception_new_with_message", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "attribute_out_of_range_exception_new_with_message", NAPI_AUTO_LENGTH, napi_attribute_out_of_range_exception_new_with_message, nullptr, &fn);
        napi_set_named_property(env, exports, "attribute_out_of_range_exception_new_with_message", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "invalid_token_exception_new_with_token_start_token_string_expected_type", NAPI_AUTO_LENGTH, napi_invalid_token_exception_new_with_token_start_token_string_expected_type, nullptr, &fn);
        napi_set_named_property(env, exports, "invalid_token_exception_new_with_token_start_token_string_expected_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "parameter_type_as_named_type", NAPI_AUTO_LENGTH, napi_parameter_type_as_named_type, nullptr, &fn);
        napi_set_named_property(env, exports, "parameter_type_as_named_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "parameter_type_as_simple_type", NAPI_AUTO_LENGTH, napi_parameter_type_as_simple_type, nullptr, &fn);
        napi_set_named_property(env, exports, "parameter_type_as_simple_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "parameter_type_as_aggregation_type", NAPI_AUTO_LENGTH, napi_parameter_type_as_aggregation_type, nullptr, &fn);
        napi_set_named_property(env, exports, "parameter_type_as_aggregation_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "parameter_type_is_with_arg0_overload_1", NAPI_AUTO_LENGTH, napi_parameter_type_is_with_arg0_overload_1, nullptr, &fn);
        napi_set_named_property(env, exports, "parameter_type_is_with_arg0_overload_1", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "parameter_type_is_with_arg0_overload_2", NAPI_AUTO_LENGTH, napi_parameter_type_is_with_arg0_overload_2, nullptr, &fn);
        napi_set_named_property(env, exports, "parameter_type_is_with_arg0_overload_2", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "named_type_new_with_declared_type", NAPI_AUTO_LENGTH, napi_named_type_new_with_declared_type, nullptr, &fn);
        napi_set_named_property(env, exports, "named_type_new_with_declared_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "named_type_declared_type", NAPI_AUTO_LENGTH, napi_named_type_declared_type, nullptr, &fn);
        napi_set_named_property(env, exports, "named_type_declared_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "named_type_as_named_type", NAPI_AUTO_LENGTH, napi_named_type_as_named_type, nullptr, &fn);
        napi_set_named_property(env, exports, "named_type_as_named_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "named_type_is_with_name", NAPI_AUTO_LENGTH, napi_named_type_is_with_name, nullptr, &fn);
        napi_set_named_property(env, exports, "named_type_is_with_name", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "named_type_is_with_decl", NAPI_AUTO_LENGTH, napi_named_type_is_with_decl, nullptr, &fn);
        napi_set_named_property(env, exports, "named_type_is_with_decl", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "simple_type_as_simple_type", NAPI_AUTO_LENGTH, napi_simple_type_as_simple_type, nullptr, &fn);
        napi_set_named_property(env, exports, "simple_type_as_simple_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "aggregation_type_bound1", NAPI_AUTO_LENGTH, napi_aggregation_type_bound1, nullptr, &fn);
        napi_set_named_property(env, exports, "aggregation_type_bound1", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "aggregation_type_bound2", NAPI_AUTO_LENGTH, napi_aggregation_type_bound2, nullptr, &fn);
        napi_set_named_property(env, exports, "aggregation_type_bound2", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "aggregation_type_type_of_element", NAPI_AUTO_LENGTH, napi_aggregation_type_type_of_element, nullptr, &fn);
        napi_set_named_property(env, exports, "aggregation_type_type_of_element", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "aggregation_type_as_aggregation_type", NAPI_AUTO_LENGTH, napi_aggregation_type_as_aggregation_type, nullptr, &fn);
        napi_set_named_property(env, exports, "aggregation_type_as_aggregation_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_new_with_name_index_in_schema", NAPI_AUTO_LENGTH, napi_declaration_new_with_name_index_in_schema, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_new_with_name_index_in_schema", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_name", NAPI_AUTO_LENGTH, napi_declaration_name, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_name", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_name_uc", NAPI_AUTO_LENGTH, napi_declaration_name_uc, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_name_uc", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_as_type_declaration", NAPI_AUTO_LENGTH, napi_declaration_as_type_declaration, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_as_type_declaration", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_as_select_type", NAPI_AUTO_LENGTH, napi_declaration_as_select_type, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_as_select_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_as_enumeration_type", NAPI_AUTO_LENGTH, napi_declaration_as_enumeration_type, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_as_enumeration_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_as_entity", NAPI_AUTO_LENGTH, napi_declaration_as_entity, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_as_entity", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_is_with_name", NAPI_AUTO_LENGTH, napi_declaration_is_with_name, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_is_with_name", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_is_with_decl", NAPI_AUTO_LENGTH, napi_declaration_is_with_decl, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_is_with_decl", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_index_in_schema", NAPI_AUTO_LENGTH, napi_declaration_index_in_schema, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_index_in_schema", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_type", NAPI_AUTO_LENGTH, napi_declaration_type, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "declaration_schema", NAPI_AUTO_LENGTH, napi_declaration_schema, nullptr, &fn);
        napi_set_named_property(env, exports, "declaration_schema", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "type_declaration_new_with_name_index_in_schema_declared_type", NAPI_AUTO_LENGTH, napi_type_declaration_new_with_name_index_in_schema_declared_type, nullptr, &fn);
        napi_set_named_property(env, exports, "type_declaration_new_with_name_index_in_schema_declared_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "type_declaration_declared_type", NAPI_AUTO_LENGTH, napi_type_declaration_declared_type, nullptr, &fn);
        napi_set_named_property(env, exports, "type_declaration_declared_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "type_declaration_as_type_declaration", NAPI_AUTO_LENGTH, napi_type_declaration_as_type_declaration, nullptr, &fn);
        napi_set_named_property(env, exports, "type_declaration_as_type_declaration", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "select_type_select_list", NAPI_AUTO_LENGTH, napi_select_type_select_list, nullptr, &fn);
        napi_set_named_property(env, exports, "select_type_select_list", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "select_type_as_select_type", NAPI_AUTO_LENGTH, napi_select_type_as_select_type, nullptr, &fn);
        napi_set_named_property(env, exports, "select_type_as_select_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "enumeration_type_lookup_enum_offset", NAPI_AUTO_LENGTH, napi_enumeration_type_lookup_enum_offset, nullptr, &fn);
        napi_set_named_property(env, exports, "enumeration_type_lookup_enum_offset", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "enumeration_type_as_enumeration_type", NAPI_AUTO_LENGTH, napi_enumeration_type_as_enumeration_type, nullptr, &fn);
        napi_set_named_property(env, exports, "enumeration_type_as_enumeration_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "attribute_new_with_name_type_of_attribute_optional", NAPI_AUTO_LENGTH, napi_attribute_new_with_name_type_of_attribute_optional, nullptr, &fn);
        napi_set_named_property(env, exports, "attribute_new_with_name_type_of_attribute_optional", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "attribute_name", NAPI_AUTO_LENGTH, napi_attribute_name, nullptr, &fn);
        napi_set_named_property(env, exports, "attribute_name", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "attribute_type_of_attribute", NAPI_AUTO_LENGTH, napi_attribute_type_of_attribute, nullptr, &fn);
        napi_set_named_property(env, exports, "attribute_type_of_attribute", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "attribute_optional", NAPI_AUTO_LENGTH, napi_attribute_optional, nullptr, &fn);
        napi_set_named_property(env, exports, "attribute_optional", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "inverse_attribute_name", NAPI_AUTO_LENGTH, napi_inverse_attribute_name, nullptr, &fn);
        napi_set_named_property(env, exports, "inverse_attribute_name", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "inverse_attribute_bound1", NAPI_AUTO_LENGTH, napi_inverse_attribute_bound1, nullptr, &fn);
        napi_set_named_property(env, exports, "inverse_attribute_bound1", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "inverse_attribute_bound2", NAPI_AUTO_LENGTH, napi_inverse_attribute_bound2, nullptr, &fn);
        napi_set_named_property(env, exports, "inverse_attribute_bound2", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "inverse_attribute_entity_reference", NAPI_AUTO_LENGTH, napi_inverse_attribute_entity_reference, nullptr, &fn);
        napi_set_named_property(env, exports, "inverse_attribute_entity_reference", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "inverse_attribute_attribute_reference", NAPI_AUTO_LENGTH, napi_inverse_attribute_attribute_reference, nullptr, &fn);
        napi_set_named_property(env, exports, "inverse_attribute_attribute_reference", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_new_with_name_is_abstract_index_in_schema_supertype", NAPI_AUTO_LENGTH, napi_entity_new_with_name_is_abstract_index_in_schema_supertype, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_new_with_name_is_abstract_index_in_schema_supertype", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_is_abstract", NAPI_AUTO_LENGTH, napi_entity_is_abstract, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_is_abstract", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_attributes", NAPI_AUTO_LENGTH, napi_entity_attributes, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_attributes", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_inverse_attributes", NAPI_AUTO_LENGTH, napi_entity_inverse_attributes, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_inverse_attributes", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_all_attributes", NAPI_AUTO_LENGTH, napi_entity_all_attributes, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_all_attributes", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_all_inverse_attributes", NAPI_AUTO_LENGTH, napi_entity_all_inverse_attributes, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_all_inverse_attributes", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_attribute_by_index", NAPI_AUTO_LENGTH, napi_entity_attribute_by_index, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_attribute_by_index", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_attribute_count", NAPI_AUTO_LENGTH, napi_entity_attribute_count, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_attribute_count", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_supertype", NAPI_AUTO_LENGTH, napi_entity_supertype, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_supertype", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_as_entity", NAPI_AUTO_LENGTH, napi_entity_as_entity, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_as_entity", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "schema_definition_declaration_by_name_with_name", NAPI_AUTO_LENGTH, napi_schema_definition_declaration_by_name_with_name, nullptr, &fn);
        napi_set_named_property(env, exports, "schema_definition_declaration_by_name_with_name", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "schema_definition_declaration_by_name_with_declaration_index", NAPI_AUTO_LENGTH, napi_schema_definition_declaration_by_name_with_declaration_index, nullptr, &fn);
        napi_set_named_property(env, exports, "schema_definition_declaration_by_name_with_declaration_index", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "schema_definition_declarations", NAPI_AUTO_LENGTH, napi_schema_definition_declarations, nullptr, &fn);
        napi_set_named_property(env, exports, "schema_definition_declarations", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "schema_definition_type_declarations", NAPI_AUTO_LENGTH, napi_schema_definition_type_declarations, nullptr, &fn);
        napi_set_named_property(env, exports, "schema_definition_type_declarations", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "schema_definition_select_types", NAPI_AUTO_LENGTH, napi_schema_definition_select_types, nullptr, &fn);
        napi_set_named_property(env, exports, "schema_definition_select_types", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "schema_definition_enumeration_types", NAPI_AUTO_LENGTH, napi_schema_definition_enumeration_types, nullptr, &fn);
        napi_set_named_property(env, exports, "schema_definition_enumeration_types", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "schema_definition_name", NAPI_AUTO_LENGTH, napi_schema_definition_name, nullptr, &fn);
        napi_set_named_property(env, exports, "schema_definition_name", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "schema_registry_bind", NAPI_AUTO_LENGTH, napi_schema_registry_bind, nullptr, &fn);
        napi_set_named_property(env, exports, "schema_registry_bind", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "schema_registry_get", NAPI_AUTO_LENGTH, napi_schema_registry_get, nullptr, &fn);
        napi_set_named_property(env, exports, "schema_registry_get", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "schema_registry_clear", NAPI_AUTO_LENGTH, napi_schema_registry_clear, nullptr, &fn);
        napi_set_named_property(env, exports, "schema_registry_clear", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_new", NAPI_AUTO_LENGTH, napi_base_new, nullptr, &fn);
        napi_set_named_property(env, exports, "base_new", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_declaration", NAPI_AUTO_LENGTH, napi_base_declaration, nullptr, &fn);
        napi_set_named_property(env, exports, "base_declaration", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_set_attribute_value_with_attribute_index_value", NAPI_AUTO_LENGTH, napi_base_set_attribute_value_with_attribute_index_value, nullptr, &fn);
        napi_set_named_property(env, exports, "base_set_attribute_value_with_attribute_index_value", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_set_attribute_value_with_attribute_name_value", NAPI_AUTO_LENGTH, napi_base_set_attribute_value_with_attribute_name_value, nullptr, &fn);
        napi_set_named_property(env, exports, "base_set_attribute_value_with_attribute_name_value", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_unset_attribute_value", NAPI_AUTO_LENGTH, napi_base_unset_attribute_value, nullptr, &fn);
        napi_set_named_property(env, exports, "base_unset_attribute_value", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_identity", NAPI_AUTO_LENGTH, napi_base_identity, nullptr, &fn);
        napi_set_named_property(env, exports, "base_identity", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_id", NAPI_AUTO_LENGTH, napi_base_id, nullptr, &fn);
        napi_set_named_property(env, exports, "base_id", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_get_attribute_value_variant", NAPI_AUTO_LENGTH, napi_base_get_attribute_value_variant, nullptr, &fn);
        napi_set_named_property(env, exports, "base_get_attribute_value_variant", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_set_attribute_value_variant", NAPI_AUTO_LENGTH, napi_base_set_attribute_value_variant, nullptr, &fn);
        napi_set_named_property(env, exports, "base_set_attribute_value_variant", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_attribute_kind_of", NAPI_AUTO_LENGTH, napi_base_attribute_kind_of, nullptr, &fn);
        napi_set_named_property(env, exports, "base_attribute_kind_of", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_get_argument_index", NAPI_AUTO_LENGTH, napi_base_get_argument_index, nullptr, &fn);
        napi_set_named_property(env, exports, "base_get_argument_index", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_attribute_name", NAPI_AUTO_LENGTH, napi_base_attribute_name, nullptr, &fn);
        napi_set_named_property(env, exports, "base_attribute_name", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_attribute_type", NAPI_AUTO_LENGTH, napi_base_attribute_type, nullptr, &fn);
        napi_set_named_property(env, exports, "base_attribute_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_get_attribute_category", NAPI_AUTO_LENGTH, napi_base_get_attribute_category, nullptr, &fn);
        napi_set_named_property(env, exports, "base_get_attribute_category", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_is_a", NAPI_AUTO_LENGTH, napi_base_is_a, nullptr, &fn);
        napi_set_named_property(env, exports, "base_is_a", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_get_all_attribute_values", NAPI_AUTO_LENGTH, napi_base_get_all_attribute_values, nullptr, &fn);
        napi_set_named_property(env, exports, "base_get_all_attribute_values", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "entity_get_inverse", NAPI_AUTO_LENGTH, napi_entity_get_inverse, nullptr, &fn);
        napi_set_named_property(env, exports, "entity_get_inverse", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "select_new", NAPI_AUTO_LENGTH, napi_select_new, nullptr, &fn);
        napi_set_named_property(env, exports, "select_new", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "select_new_with_value", NAPI_AUTO_LENGTH, napi_select_new_with_value, nullptr, &fn);
        napi_set_named_property(env, exports, "select_new_with_value", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "select_concrete", NAPI_AUTO_LENGTH, napi_select_concrete, nullptr, &fn);
        napi_set_named_property(env, exports, "select_concrete", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_set_product", NAPI_AUTO_LENGTH, napi_logger_set_product, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_set_product", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_notice_with_message_instance", NAPI_AUTO_LENGTH, napi_logger_notice_with_message_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_notice_with_message_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_notice_with_message_instance_with_instance", NAPI_AUTO_LENGTH, napi_logger_notice_with_message_instance_with_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_notice_with_message_instance_with_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_warning_with_message_instance", NAPI_AUTO_LENGTH, napi_logger_warning_with_message_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_warning_with_message_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_warning_with_message_instance_with_instance", NAPI_AUTO_LENGTH, napi_logger_warning_with_message_instance_with_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_warning_with_message_instance_with_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_error_with_message_instance", NAPI_AUTO_LENGTH, napi_logger_error_with_message_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_error_with_message_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_error_with_message_instance_with_instance", NAPI_AUTO_LENGTH, napi_logger_error_with_message_instance_with_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_error_with_message_instance_with_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_notice_with_exception_instance", NAPI_AUTO_LENGTH, napi_logger_notice_with_exception_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_notice_with_exception_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_notice_with_exception_instance_with_instance", NAPI_AUTO_LENGTH, napi_logger_notice_with_exception_instance_with_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_notice_with_exception_instance_with_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_warning_with_exception_instance", NAPI_AUTO_LENGTH, napi_logger_warning_with_exception_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_warning_with_exception_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_warning_with_exception_instance_with_instance", NAPI_AUTO_LENGTH, napi_logger_warning_with_exception_instance_with_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_warning_with_exception_instance_with_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_error_with_exception_instance", NAPI_AUTO_LENGTH, napi_logger_error_with_exception_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_error_with_exception_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_error_with_exception_instance_with_instance", NAPI_AUTO_LENGTH, napi_logger_error_with_exception_instance_with_instance, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_error_with_exception_instance_with_instance", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_status", NAPI_AUTO_LENGTH, napi_logger_status, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_status", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_status_with_new_line", NAPI_AUTO_LENGTH, napi_logger_status_with_new_line, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_status_with_new_line", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_progress_bar", NAPI_AUTO_LENGTH, napi_logger_progress_bar, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_progress_bar", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_get_log", NAPI_AUTO_LENGTH, napi_logger_get_log, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_get_log", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_count", NAPI_AUTO_LENGTH, napi_logger_count, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_count", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_clear", NAPI_AUTO_LENGTH, napi_logger_clear, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_clear", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_append", NAPI_AUTO_LENGTH, napi_logger_append, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_append", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_print_performance_stats", NAPI_AUTO_LENGTH, napi_logger_print_performance_stats, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_print_performance_stats", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_print_performance_stats_on_element_with_enabled", NAPI_AUTO_LENGTH, napi_logger_print_performance_stats_on_element_with_enabled, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_print_performance_stats_on_element_with_enabled", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "logger_print_performance_stats_on_element_overload_2", NAPI_AUTO_LENGTH, napi_logger_print_performance_stats_on_element_overload_2, nullptr, &fn);
        napi_set_named_property(env, exports, "logger_print_performance_stats_on_element_overload_2", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "full_buffer_impl_new", NAPI_AUTO_LENGTH, napi_full_buffer_impl_new, nullptr, &fn);
        napi_set_named_property(env, exports, "full_buffer_impl_new", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "full_buffer_impl_new_with_path", NAPI_AUTO_LENGTH, napi_full_buffer_impl_new_with_path, nullptr, &fn);
        napi_set_named_property(env, exports, "full_buffer_impl_new_with_path", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "full_buffer_impl_size", NAPI_AUTO_LENGTH, napi_full_buffer_impl_size, nullptr, &fn);
        napi_set_named_property(env, exports, "full_buffer_impl_size", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "full_buffer_impl_get_u32", NAPI_AUTO_LENGTH, napi_full_buffer_impl_get_u32, nullptr, &fn);
        napi_set_named_property(env, exports, "full_buffer_impl_get_u32", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "full_buffer_impl_push_next_page", NAPI_AUTO_LENGTH, napi_full_buffer_impl_push_next_page, nullptr, &fn);
        napi_set_named_property(env, exports, "full_buffer_impl_push_next_page", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "full_buffer_impl_drop_pages", NAPI_AUTO_LENGTH, napi_full_buffer_impl_drop_pages, nullptr, &fn);
        napi_set_named_property(env, exports, "full_buffer_impl_drop_pages", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "paged_file_impl_new_with_path_page_size_page_capacity", NAPI_AUTO_LENGTH, napi_paged_file_impl_new_with_path_page_size_page_capacity, nullptr, &fn);
        napi_set_named_property(env, exports, "paged_file_impl_new_with_path_page_size_page_capacity", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "paged_file_impl_size", NAPI_AUTO_LENGTH, napi_paged_file_impl_size, nullptr, &fn);
        napi_set_named_property(env, exports, "paged_file_impl_size", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "paged_file_impl_get_u32", NAPI_AUTO_LENGTH, napi_paged_file_impl_get_u32, nullptr, &fn);
        napi_set_named_property(env, exports, "paged_file_impl_get_u32", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "paged_file_impl_push_next_page", NAPI_AUTO_LENGTH, napi_paged_file_impl_push_next_page, nullptr, &fn);
        napi_set_named_property(env, exports, "paged_file_impl_push_next_page", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "paged_file_impl_drop_pages", NAPI_AUTO_LENGTH, napi_paged_file_impl_drop_pages, nullptr, &fn);
        napi_set_named_property(env, exports, "paged_file_impl_drop_pages", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "pushed_sequential_impl_size", NAPI_AUTO_LENGTH, napi_pushed_sequential_impl_size, nullptr, &fn);
        napi_set_named_property(env, exports, "pushed_sequential_impl_size", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "pushed_sequential_impl_get_u32", NAPI_AUTO_LENGTH, napi_pushed_sequential_impl_get_u32, nullptr, &fn);
        napi_set_named_property(env, exports, "pushed_sequential_impl_get_u32", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "pushed_sequential_impl_push_next_page", NAPI_AUTO_LENGTH, napi_pushed_sequential_impl_push_next_page, nullptr, &fn);
        napi_set_named_property(env, exports, "pushed_sequential_impl_push_next_page", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "pushed_sequential_impl_drop_pages", NAPI_AUTO_LENGTH, napi_pushed_sequential_impl_drop_pages, nullptr, &fn);
        napi_set_named_property(env, exports, "pushed_sequential_impl_drop_pages", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "character_encoder_new_with_input", NAPI_AUTO_LENGTH, napi_character_encoder_new_with_input, nullptr, &fn);
        napi_set_named_property(env, exports, "character_encoder_new_with_input", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_new", NAPI_AUTO_LENGTH, napi_token_new, nullptr, &fn);
        napi_set_named_property(env, exports, "token_new", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_is_string", NAPI_AUTO_LENGTH, napi_token_is_string, nullptr, &fn);
        napi_set_named_property(env, exports, "token_is_string", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_is_identifier", NAPI_AUTO_LENGTH, napi_token_is_identifier, nullptr, &fn);
        napi_set_named_property(env, exports, "token_is_identifier", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_is_operator", NAPI_AUTO_LENGTH, napi_token_is_operator, nullptr, &fn);
        napi_set_named_property(env, exports, "token_is_operator", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_is_enumeration", NAPI_AUTO_LENGTH, napi_token_is_enumeration, nullptr, &fn);
        napi_set_named_property(env, exports, "token_is_enumeration", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_is_keyword", NAPI_AUTO_LENGTH, napi_token_is_keyword, nullptr, &fn);
        napi_set_named_property(env, exports, "token_is_keyword", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_is_int", NAPI_AUTO_LENGTH, napi_token_is_int, nullptr, &fn);
        napi_set_named_property(env, exports, "token_is_int", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_is_bool", NAPI_AUTO_LENGTH, napi_token_is_bool, nullptr, &fn);
        napi_set_named_property(env, exports, "token_is_bool", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_is_logical", NAPI_AUTO_LENGTH, napi_token_is_logical, nullptr, &fn);
        napi_set_named_property(env, exports, "token_is_logical", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_is_float", NAPI_AUTO_LENGTH, napi_token_is_float, nullptr, &fn);
        napi_set_named_property(env, exports, "token_is_float", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_is_binary", NAPI_AUTO_LENGTH, napi_token_is_binary, nullptr, &fn);
        napi_set_named_property(env, exports, "token_is_binary", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_as_identifier", NAPI_AUTO_LENGTH, napi_token_as_identifier, nullptr, &fn);
        napi_set_named_property(env, exports, "token_as_identifier", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_as_bool", NAPI_AUTO_LENGTH, napi_token_as_bool, nullptr, &fn);
        napi_set_named_property(env, exports, "token_as_bool", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_as_string", NAPI_AUTO_LENGTH, napi_token_as_string, nullptr, &fn);
        napi_set_named_property(env, exports, "token_as_string", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "token_to_string", NAPI_AUTO_LENGTH, napi_token_to_string, nullptr, &fn);
        napi_set_named_property(env, exports, "token_to_string", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "enumeration_reference_new", NAPI_AUTO_LENGTH, napi_enumeration_reference_new, nullptr, &fn);
        napi_set_named_property(env, exports, "enumeration_reference_new", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "enumeration_reference_new_with_enumeration", NAPI_AUTO_LENGTH, napi_enumeration_reference_new_with_enumeration, nullptr, &fn);
        napi_set_named_property(env, exports, "enumeration_reference_new_with_enumeration", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "enumeration_reference_new_with_enumeration_index", NAPI_AUTO_LENGTH, napi_enumeration_reference_new_with_enumeration_index, nullptr, &fn);
        napi_set_named_property(env, exports, "enumeration_reference_new_with_enumeration_index", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "enumeration_reference_index", NAPI_AUTO_LENGTH, napi_enumeration_reference_index, nullptr, &fn);
        napi_set_named_property(env, exports, "enumeration_reference_index", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "enumeration_reference_enumeration", NAPI_AUTO_LENGTH, napi_enumeration_reference_enumeration, nullptr, &fn);
        napi_set_named_property(env, exports, "enumeration_reference_enumeration", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "attribute_value_new", NAPI_AUTO_LENGTH, napi_attribute_value_new, nullptr, &fn);
        napi_set_named_property(env, exports, "attribute_value_new", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "attribute_value_is_null", NAPI_AUTO_LENGTH, napi_attribute_value_is_null, nullptr, &fn);
        napi_set_named_property(env, exports, "attribute_value_is_null", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "attribute_value_size", NAPI_AUTO_LENGTH, napi_attribute_value_size, nullptr, &fn);
        napi_set_named_property(env, exports, "attribute_value_size", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "attribute_value_type", NAPI_AUTO_LENGTH, napi_attribute_value_type, nullptr, &fn);
        napi_set_named_property(env, exports, "attribute_value_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "spf_header_new", NAPI_AUTO_LENGTH, napi_spf_header_new, nullptr, &fn);
        napi_set_named_property(env, exports, "spf_header_new", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "spf_header_new_with_file", NAPI_AUTO_LENGTH, napi_spf_header_new_with_file, nullptr, &fn);
        napi_set_named_property(env, exports, "spf_header_new_with_file", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "spf_header_new_with_file_logger", NAPI_AUTO_LENGTH, napi_spf_header_new_with_file_logger, nullptr, &fn);
        napi_set_named_property(env, exports, "spf_header_new_with_file_logger", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "spf_header_owner_file", NAPI_AUTO_LENGTH, napi_spf_header_owner_file, nullptr, &fn);
        napi_set_named_property(env, exports, "spf_header_owner_file", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "spf_header_assign", NAPI_AUTO_LENGTH, napi_spf_header_assign, nullptr, &fn);
        napi_set_named_property(env, exports, "spf_header_assign", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_path", NAPI_AUTO_LENGTH, napi_file_new_with_path, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_path", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_path_with_filetype", NAPI_AUTO_LENGTH, napi_file_new_with_path_with_filetype, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_path_with_filetype", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_path_with_filetype_readonly", NAPI_AUTO_LENGTH, napi_file_new_with_path_with_filetype_readonly, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_path_with_filetype_readonly", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_path_with_filetype_readonly_logger", NAPI_AUTO_LENGTH, napi_file_new_with_path_with_filetype_readonly_logger, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_path_with_filetype_readonly_logger", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_data_data_size", NAPI_AUTO_LENGTH, napi_file_new_with_data_data_size, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_data_data_size", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_data_data_size_with_logger", NAPI_AUTO_LENGTH, napi_file_new_with_data_data_size_with_logger, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_data_data_size_with_logger", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new", NAPI_AUTO_LENGTH, napi_file_new, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_schema", NAPI_AUTO_LENGTH, napi_file_new_with_schema, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_schema", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_schema_filetype", NAPI_AUTO_LENGTH, napi_file_new_with_schema_filetype, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_schema_filetype", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_schema_filetype_path", NAPI_AUTO_LENGTH, napi_file_new_with_schema_filetype_path, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_schema_filetype_path", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_schema_filetype_path_logger", NAPI_AUTO_LENGTH, napi_file_new_with_schema_filetype_path_logger, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_schema_filetype_path_logger", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_initialize", NAPI_AUTO_LENGTH, napi_file_initialize, nullptr, &fn);
        napi_set_named_property(env, exports, "file_initialize", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_initialize_with_filetype", NAPI_AUTO_LENGTH, napi_file_initialize_with_filetype, nullptr, &fn);
        napi_set_named_property(env, exports, "file_initialize_with_filetype", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_initialize_with_filetype_readonly", NAPI_AUTO_LENGTH, napi_file_initialize_with_filetype_readonly, nullptr, &fn);
        napi_set_named_property(env, exports, "file_initialize_with_filetype_readonly", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_bypass_type", NAPI_AUTO_LENGTH, napi_file_bypass_type, nullptr, &fn);
        napi_set_named_property(env, exports, "file_bypass_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_good", NAPI_AUTO_LENGTH, napi_file_good, nullptr, &fn);
        napi_set_named_property(env, exports, "file_good", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_instances_by_type_with_declaration", NAPI_AUTO_LENGTH, napi_file_instances_by_type_with_declaration, nullptr, &fn);
        napi_set_named_property(env, exports, "file_instances_by_type_with_declaration", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_instances_by_type_excl_subtypes_with_declaration", NAPI_AUTO_LENGTH, napi_file_instances_by_type_excl_subtypes_with_declaration, nullptr, &fn);
        napi_set_named_property(env, exports, "file_instances_by_type_excl_subtypes_with_declaration", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_instances_by_type_with_type_name", NAPI_AUTO_LENGTH, napi_file_instances_by_type_with_type_name, nullptr, &fn);
        napi_set_named_property(env, exports, "file_instances_by_type_with_type_name", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_instances_by_type_excl_subtypes_with_type_name", NAPI_AUTO_LENGTH, napi_file_instances_by_type_excl_subtypes_with_type_name, nullptr, &fn);
        napi_set_named_property(env, exports, "file_instances_by_type_excl_subtypes_with_type_name", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_instances_by_reference", NAPI_AUTO_LENGTH, napi_file_instances_by_reference, nullptr, &fn);
        napi_set_named_property(env, exports, "file_instances_by_reference", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_instance_by_id", NAPI_AUTO_LENGTH, napi_file_instance_by_id, nullptr, &fn);
        napi_set_named_property(env, exports, "file_instance_by_id", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_instance_by_guid", NAPI_AUTO_LENGTH, napi_file_instance_by_guid, nullptr, &fn);
        napi_set_named_property(env, exports, "file_instance_by_guid", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_get_inverse", NAPI_AUTO_LENGTH, napi_file_get_inverse, nullptr, &fn);
        napi_set_named_property(env, exports, "file_get_inverse", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_get_total_inverses", NAPI_AUTO_LENGTH, napi_file_get_total_inverses, nullptr, &fn);
        napi_set_named_property(env, exports, "file_get_total_inverses", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_fresh_id", NAPI_AUTO_LENGTH, napi_file_fresh_id, nullptr, &fn);
        napi_set_named_property(env, exports, "file_fresh_id", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_get_max_id", NAPI_AUTO_LENGTH, napi_file_get_max_id, nullptr, &fn);
        napi_set_named_property(env, exports, "file_get_max_id", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_ifcroot_type", NAPI_AUTO_LENGTH, napi_file_ifcroot_type, nullptr, &fn);
        napi_set_named_property(env, exports, "file_ifcroot_type", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_recalculate_id_counter", NAPI_AUTO_LENGTH, napi_file_recalculate_id_counter, nullptr, &fn);
        napi_set_named_property(env, exports, "file_recalculate_id_counter", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_add_entity", NAPI_AUTO_LENGTH, napi_file_add_entity, nullptr, &fn);
        napi_set_named_property(env, exports, "file_add_entity", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_add_entity_with_instance_id", NAPI_AUTO_LENGTH, napi_file_add_entity_with_instance_id, nullptr, &fn);
        napi_set_named_property(env, exports, "file_add_entity_with_instance_id", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_remove_entity", NAPI_AUTO_LENGTH, napi_file_remove_entity, nullptr, &fn);
        napi_set_named_property(env, exports, "file_remove_entity", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_header", NAPI_AUTO_LENGTH, napi_file_header, nullptr, &fn);
        napi_set_named_property(env, exports, "file_header", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_schema", NAPI_AUTO_LENGTH, napi_file_schema, nullptr, &fn);
        napi_set_named_property(env, exports, "file_schema", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_build_inverses_overload_1", NAPI_AUTO_LENGTH, napi_file_build_inverses_overload_1, nullptr, &fn);
        napi_set_named_property(env, exports, "file_build_inverses_overload_1", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_register_inverse", NAPI_AUTO_LENGTH, napi_file_register_inverse, nullptr, &fn);
        napi_set_named_property(env, exports, "file_register_inverse", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_unregister_inverse", NAPI_AUTO_LENGTH, napi_file_unregister_inverse, nullptr, &fn);
        napi_set_named_property(env, exports, "file_unregister_inverse", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_add_type_ref", NAPI_AUTO_LENGTH, napi_file_add_type_ref, nullptr, &fn);
        napi_set_named_property(env, exports, "file_add_type_ref", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_remove_type_ref", NAPI_AUTO_LENGTH, napi_file_remove_type_ref, nullptr, &fn);
        napi_set_named_property(env, exports, "file_remove_type_ref", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_process_deletion_inverse", NAPI_AUTO_LENGTH, napi_file_process_deletion_inverse, nullptr, &fn);
        napi_set_named_property(env, exports, "file_process_deletion_inverse", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_build_inverses_with_entity", NAPI_AUTO_LENGTH, napi_file_build_inverses_with_entity, nullptr, &fn);
        napi_set_named_property(env, exports, "file_build_inverses_with_entity", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_create_with_declaration_instance_id", NAPI_AUTO_LENGTH, napi_file_create_with_declaration_instance_id, nullptr, &fn);
        napi_set_named_property(env, exports, "file_create_with_declaration_instance_id", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_create_with_declaration_instance_id_with_instance_id", NAPI_AUTO_LENGTH, napi_file_create_with_declaration_instance_id_with_instance_id, nullptr, &fn);
        napi_set_named_property(env, exports, "file_create_with_declaration_instance_id_with_instance_id", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_batch", NAPI_AUTO_LENGTH, napi_file_batch, nullptr, &fn);
        napi_set_named_property(env, exports, "file_batch", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_unbatch", NAPI_AUTO_LENGTH, napi_file_unbatch, nullptr, &fn);
        napi_set_named_property(env, exports, "file_unbatch", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_reset_identity_cache", NAPI_AUTO_LENGTH, napi_file_reset_identity_cache, nullptr, &fn);
        napi_set_named_property(env, exports, "file_reset_identity_cache", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_write", NAPI_AUTO_LENGTH, napi_file_write, nullptr, &fn);
        napi_set_named_property(env, exports, "file_write", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "global_id_new", NAPI_AUTO_LENGTH, napi_global_id_new, nullptr, &fn);
        napi_set_named_property(env, exports, "global_id_new", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "global_id_new_with_logger", NAPI_AUTO_LENGTH, napi_global_id_new_with_logger, nullptr, &fn);
        napi_set_named_property(env, exports, "global_id_new_with_logger", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "global_id_new_with_value", NAPI_AUTO_LENGTH, napi_global_id_new_with_value, nullptr, &fn);
        napi_set_named_property(env, exports, "global_id_new_with_value", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "global_id_new_with_value_with_logger", NAPI_AUTO_LENGTH, napi_global_id_new_with_value_with_logger, nullptr, &fn);
        napi_set_named_property(env, exports, "global_id_new_with_value_with_logger", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "global_id_formatted", NAPI_AUTO_LENGTH, napi_global_id_formatted, nullptr, &fn);
        napi_set_named_property(env, exports, "global_id_formatted", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_path_async", NAPI_AUTO_LENGTH, napi_file_new_with_path_async, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_path_async", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_new_with_data_data_size_async", NAPI_AUTO_LENGTH, napi_file_new_with_data_data_size_async, nullptr, &fn);
        napi_set_named_property(env, exports, "file_new_with_data_data_size_async", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "base_get_all_attribute_values_async", NAPI_AUTO_LENGTH, napi_base_get_all_attribute_values_async, nullptr, &fn);
        napi_set_named_property(env, exports, "base_get_all_attribute_values_async", fn);
    }
    {
        napi_value fn;
        napi_create_function(env, "file_write_async", NAPI_AUTO_LENGTH, napi_file_write_async, nullptr, &fn);
        napi_set_named_property(env, exports, "file_write_async", fn);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_NULL, &value);
        napi_set_named_property(env, exports, "Argument_NULL", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_DERIVED, &value);
        napi_set_named_property(env, exports, "Argument_DERIVED", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_INT, &value);
        napi_set_named_property(env, exports, "Argument_INT", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_BOOL, &value);
        napi_set_named_property(env, exports, "Argument_BOOL", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_LOGICAL, &value);
        napi_set_named_property(env, exports, "Argument_LOGICAL", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_DOUBLE, &value);
        napi_set_named_property(env, exports, "Argument_DOUBLE", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_STRING, &value);
        napi_set_named_property(env, exports, "Argument_STRING", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_BINARY, &value);
        napi_set_named_property(env, exports, "Argument_BINARY", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_ENUMERATION, &value);
        napi_set_named_property(env, exports, "Argument_ENUMERATION", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_ENTITY_INSTANCE, &value);
        napi_set_named_property(env, exports, "Argument_ENTITY_INSTANCE", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_EMPTY_AGGREGATE, &value);
        napi_set_named_property(env, exports, "Argument_EMPTY_AGGREGATE", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_AGGREGATE_OF_INT, &value);
        napi_set_named_property(env, exports, "Argument_AGGREGATE_OF_INT", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_AGGREGATE_OF_DOUBLE, &value);
        napi_set_named_property(env, exports, "Argument_AGGREGATE_OF_DOUBLE", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_AGGREGATE_OF_STRING, &value);
        napi_set_named_property(env, exports, "Argument_AGGREGATE_OF_STRING", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_AGGREGATE_OF_BINARY, &value);
        napi_set_named_property(env, exports, "Argument_AGGREGATE_OF_BINARY", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_AGGREGATE_OF_ENTITY_INSTANCE, &value);
        napi_set_named_property(env, exports, "Argument_AGGREGATE_OF_ENTITY_INSTANCE", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_AGGREGATE_OF_EMPTY_AGGREGATE, &value);
        napi_set_named_property(env, exports, "Argument_AGGREGATE_OF_EMPTY_AGGREGATE", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_AGGREGATE_OF_AGGREGATE_OF_INT, &value);
        napi_set_named_property(env, exports, "Argument_AGGREGATE_OF_AGGREGATE_OF_INT", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_AGGREGATE_OF_AGGREGATE_OF_DOUBLE, &value);
        napi_set_named_property(env, exports, "Argument_AGGREGATE_OF_AGGREGATE_OF_DOUBLE", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_AGGREGATE_OF_AGGREGATE_OF_ENTITY_INSTANCE, &value);
        napi_set_named_property(env, exports, "Argument_AGGREGATE_OF_AGGREGATE_OF_ENTITY_INSTANCE", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ARGUMENT_TYPE_T_Argument_UNKNOWN, &value);
        napi_set_named_property(env, exports, "Argument_UNKNOWN", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_FILE_TYPE_T_FT_IFCSPF, &value);
        napi_set_named_property(env, exports, "FT_IFCSPF", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_FILE_TYPE_T_FT_IFCXML, &value);
        napi_set_named_property(env, exports, "FT_IFCXML", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_FILE_TYPE_T_FT_IFCZIP, &value);
        napi_set_named_property(env, exports, "FT_IFCZIP", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_FILE_TYPE_T_FT_ROCKSDB, &value);
        napi_set_named_property(env, exports, "FT_ROCKSDB", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_FILE_TYPE_T_FT_UNKNOWN, &value);
        napi_set_named_property(env, exports, "FT_UNKNOWN", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_FILE_TYPE_T_FT_AUTODETECT, &value);
        napi_set_named_property(env, exports, "FT_AUTODETECT", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_NULL, &value);
        napi_set_named_property(env, exports, "NULL", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_BOOL, &value);
        napi_set_named_property(env, exports, "BOOL", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_LOGICAL, &value);
        napi_set_named_property(env, exports, "LOGICAL", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_INTEGER, &value);
        napi_set_named_property(env, exports, "INTEGER", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_DOUBLE, &value);
        napi_set_named_property(env, exports, "DOUBLE", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_STRING, &value);
        napi_set_named_property(env, exports, "STRING", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_ENUMERATION, &value);
        napi_set_named_property(env, exports, "ENUMERATION", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE, &value);
        napi_set_named_property(env, exports, "ENTITY_INSTANCE", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_BINARY, &value);
        napi_set_named_property(env, exports, "BINARY", value);
    }
    {
        napi_value value;
        napi_create_int32(env, IFCOPENSHELL_ATTRIBUTE_VALUE_KIND_AGGREGATE, &value);
        napi_set_named_property(env, exports, "AGGREGATE", value);
    }
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
