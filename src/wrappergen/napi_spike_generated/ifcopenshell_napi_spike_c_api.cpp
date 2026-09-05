#include "ifcopenshell_napi_spike_c_api.h"

#include "argument_type.h"
#include "attribute_value_shim.h"
#include "character_decoder.h"
#include "exception.h"
#include "express.h"
#include "file.h"
#include "file_open_status.h"
#include "file_reader.h"
#include "global_id.h"
#include "instance_data.h"
#include "logger.h"
#include "schema.h"
#include "spf_header.h"
#include "storage.h"

#include <algorithm>
#include <memory>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace {
thread_local std::string g_last_error;

char* duplicate_string(const std::string& value) {
    auto* buffer = new char[value.size() + 1];
    std::copy(value.begin(), value.end(), buffer);
    buffer[value.size()] = '\0';
    return buffer;
}

void set_last_error(const std::exception& exception) {
    g_last_error = exception.what();
}
}

struct ifcopenshell_exception_t {
    ifcopenshell::exception value;
};

struct ifcopenshell_attribute_out_of_range_exception_t {
    ifcopenshell::attribute_out_of_range_exception value;
};

struct ifcopenshell_invalid_token_exception_t {
    ifcopenshell::invalid_token_exception value;
};

struct ifcopenshell_parameter_type_t {
    ifcopenshell::parameter_type* value;
};

struct ifcopenshell_named_type_t {
    ifcopenshell::named_type* value;
};

struct ifcopenshell_simple_type_t {
    ifcopenshell::simple_type* value;
};

struct ifcopenshell_aggregation_type_t {
    ifcopenshell::aggregation_type* value;
};

struct ifcopenshell_declaration_t {
    ifcopenshell::declaration* value;
};

struct ifcopenshell_type_declaration_t {
    ifcopenshell::type_declaration* value;
};

struct ifcopenshell_select_type_t {
    ifcopenshell::select_type* value;
};

struct ifcopenshell_enumeration_type_t {
    ifcopenshell::enumeration_type* value;
};

struct ifcopenshell_attribute_t {
    ifcopenshell::attribute* value;
};

struct ifcopenshell_inverse_attribute_t {
    ifcopenshell::inverse_attribute* value;
};

struct ifcopenshell_entity_t {
    ifcopenshell::entity* value;
};

struct ifcopenshell_schema_definition_t {
    ifcopenshell::schema_definition* value;
};

struct ifcopenshell_schema_registry_t {
    ifcopenshell::schema_registry value;
};

struct ifcopenshell_express_base_t {
    std::shared_ptr<ifcopenshell::file> owner;
    express::base value;
};

struct ifcopenshell_express_entity_t {
    std::shared_ptr<ifcopenshell::file> owner;
    express::entity value;
};

struct ifcopenshell_express_select_t {
    std::shared_ptr<ifcopenshell::file> owner;
    express::select value;
};

struct ifcopenshell_logger_t {
    ifcopenshell::logger value;
};

struct ifcopenshell_full_buffer_impl_t {
    ifcopenshell::full_buffer_impl value;
};

struct ifcopenshell_paged_file_impl_t {
    ifcopenshell::paged_file_impl value;
};

struct ifcopenshell_pushed_sequential_impl_t {
    ifcopenshell::pushed_sequential_impl value;
};

struct ifcopenshell_character_encoder_t {
    ifcopenshell::character_encoder value;
};

struct ifcopenshell_file_open_status_t {
    ifcopenshell::file_open_status value;
};

struct ifcopenshell_token_t {
    ifcopenshell::token value;
};

struct ifcopenshell_enumeration_reference_t {
    ifcopenshell::enumeration_reference value;
};

struct ifcopenshell_attribute_value_t {
    ifcopenshell::attribute_value value;
};

struct ifcopenshell_spf_header_t {
    ifcopenshell::spf_header value;
};

struct ifcopenshell_file_t {
    std::shared_ptr<ifcopenshell::file> value;
};

struct ifcopenshell_global_id_t {
    ifcopenshell::global_id value;
};

struct ifcopenshell_declaration_list_t {
    std::vector<ifcopenshell::declaration*> value;
};

struct ifcopenshell_attribute_list_t {
    std::vector<ifcopenshell::attribute*> value;
};

struct ifcopenshell_inverse_attribute_list_t {
    std::vector<ifcopenshell::inverse_attribute*> value;
};

struct ifcopenshell_type_declaration_list_t {
    std::vector<ifcopenshell::type_declaration*> value;
};

struct ifcopenshell_select_type_list_t {
    std::vector<ifcopenshell::select_type*> value;
};

struct ifcopenshell_enumeration_type_list_t {
    std::vector<ifcopenshell::enumeration_type*> value;
};

struct ifcopenshell_express_entity_list_t {
    std::shared_ptr<ifcopenshell::file> owner;
    std::vector<express::entity> value;
};

struct ifcopenshell_express_base_list_t {
    std::shared_ptr<ifcopenshell::file> owner;
    std::vector<express::base> value;
};

extern "C" {

const char* ifcopenshell_last_error_message(void) {
    return g_last_error.empty() ? nullptr : g_last_error.c_str();
}

void ifcopenshell_last_error_clear(void) {
    g_last_error.clear();
}

void ifcopenshell_string_free(char* value) {
    delete[] value;
}

ifcopenshell_exception_t* ifcopenshell_exception_new_with_message(const char* message) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::exception(std::string(message ? message : ""));
        return new ifcopenshell_exception_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_attribute_out_of_range_exception_t* ifcopenshell_attribute_out_of_range_exception_new_with_message(const char* message) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::attribute_out_of_range_exception(std::string(message ? message : ""));
        return new ifcopenshell_attribute_out_of_range_exception_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_invalid_token_exception_t* ifcopenshell_invalid_token_exception_new_with_token_start_token_string_expected_type(int token_start, const char* token_string, const char* expected_type) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::invalid_token_exception(token_start, std::string(token_string ? token_string : ""), std::string(expected_type ? expected_type : ""));
        return new ifcopenshell_invalid_token_exception_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_named_type_t* ifcopenshell_parameter_type_as_named_type(ifcopenshell_parameter_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_named_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_named_type_t{ const_cast<ifcopenshell::named_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_simple_type_t* ifcopenshell_parameter_type_as_simple_type(ifcopenshell_parameter_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_simple_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_simple_type_t{ const_cast<ifcopenshell::simple_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_aggregation_type_t* ifcopenshell_parameter_type_as_aggregation_type(ifcopenshell_parameter_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_aggregation_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_aggregation_type_t{ const_cast<ifcopenshell::aggregation_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

bool ifcopenshell_parameter_type_is_with_arg0_overload_1(ifcopenshell_parameter_type_t* handle, const char* arg0) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->is(std::string(arg0 ? arg0 : ""));
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_parameter_type_is_with_arg0_overload_2(ifcopenshell_parameter_type_t* handle, ifcopenshell_declaration_t* arg0) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (arg0 == nullptr) {
            throw std::runtime_error("Null handle parameter received for arg0");
        }
        return handle->value->is(*arg0->value);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_named_type_t* ifcopenshell_named_type_new_with_declared_type(ifcopenshell_declaration_t* declared_type) {
    ifcopenshell_last_error_clear();
    try {
        if (declared_type == nullptr) {
            throw std::runtime_error("Null handle parameter received for declared_type");
        }
        auto constructed_value = ifcopenshell::named_type(declared_type->value);
        return new ifcopenshell_named_type_t{ new ifcopenshell::named_type(std::move(constructed_value)) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_declaration_t* ifcopenshell_named_type_declared_type(ifcopenshell_named_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->declared_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_declaration_t{ const_cast<ifcopenshell::declaration*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_named_type_t* ifcopenshell_named_type_as_named_type(ifcopenshell_named_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_named_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_named_type_t{ const_cast<ifcopenshell::named_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

bool ifcopenshell_named_type_is_with_name(ifcopenshell_named_type_t* handle, const char* name) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->is(std::string(name ? name : ""));
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_named_type_is_with_decl(ifcopenshell_named_type_t* handle, ifcopenshell_declaration_t* decl) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (decl == nullptr) {
            throw std::runtime_error("Null handle parameter received for decl");
        }
        return handle->value->is(*decl->value);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_simple_type_t* ifcopenshell_simple_type_as_simple_type(ifcopenshell_simple_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_simple_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_simple_type_t{ const_cast<ifcopenshell::simple_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

int ifcopenshell_aggregation_type_bound1(ifcopenshell_aggregation_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->bound1();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_aggregation_type_bound2(ifcopenshell_aggregation_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->bound2();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_parameter_type_t* ifcopenshell_aggregation_type_type_of_element(ifcopenshell_aggregation_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->type_of_element();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_parameter_type_t{ const_cast<ifcopenshell::parameter_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_aggregation_type_t* ifcopenshell_aggregation_type_as_aggregation_type(ifcopenshell_aggregation_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_aggregation_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_aggregation_type_t{ const_cast<ifcopenshell::aggregation_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_declaration_t* ifcopenshell_declaration_new_with_name_index_in_schema(const char* name, int index_in_schema) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::declaration(std::string(name ? name : ""), index_in_schema);
        return new ifcopenshell_declaration_t{ new ifcopenshell::declaration(std::move(constructed_value)) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

char* ifcopenshell_declaration_name(ifcopenshell_declaration_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->name();
        return duplicate_string(result);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

char* ifcopenshell_declaration_name_uc(ifcopenshell_declaration_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->name_uc();
        return duplicate_string(result);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_type_declaration_t* ifcopenshell_declaration_as_type_declaration(ifcopenshell_declaration_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_type_declaration();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_type_declaration_t{ const_cast<ifcopenshell::type_declaration*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_select_type_t* ifcopenshell_declaration_as_select_type(ifcopenshell_declaration_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_select_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_select_type_t{ const_cast<ifcopenshell::select_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_enumeration_type_t* ifcopenshell_declaration_as_enumeration_type(ifcopenshell_declaration_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_enumeration_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_enumeration_type_t{ const_cast<ifcopenshell::enumeration_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

bool ifcopenshell_declaration_is_with_name(ifcopenshell_declaration_t* handle, const char* name) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->is(std::string(name ? name : ""));
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_declaration_is_with_decl(ifcopenshell_declaration_t* handle, ifcopenshell_declaration_t* decl) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (decl == nullptr) {
            throw std::runtime_error("Null handle parameter received for decl");
        }
        return handle->value->is(*decl->value);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_declaration_index_in_schema(ifcopenshell_declaration_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->index_in_schema();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_declaration_type(ifcopenshell_declaration_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->type();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_schema_definition_t* ifcopenshell_declaration_schema(ifcopenshell_declaration_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->schema();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_schema_definition_t{ const_cast<ifcopenshell::schema_definition*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_type_declaration_t* ifcopenshell_type_declaration_new_with_name_index_in_schema_declared_type(const char* name, int index_in_schema, ifcopenshell_parameter_type_t* declared_type) {
    ifcopenshell_last_error_clear();
    try {
        if (declared_type == nullptr) {
            throw std::runtime_error("Null handle parameter received for declared_type");
        }
        auto constructed_value = ifcopenshell::type_declaration(std::string(name ? name : ""), index_in_schema, declared_type->value);
        return new ifcopenshell_type_declaration_t{ new ifcopenshell::type_declaration(std::move(constructed_value)) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_parameter_type_t* ifcopenshell_type_declaration_declared_type(ifcopenshell_type_declaration_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->declared_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_parameter_type_t{ const_cast<ifcopenshell::parameter_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_type_declaration_t* ifcopenshell_type_declaration_as_type_declaration(ifcopenshell_type_declaration_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_type_declaration();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_type_declaration_t{ const_cast<ifcopenshell::type_declaration*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_declaration_list_t* ifcopenshell_select_type_select_list(ifcopenshell_select_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        const auto& source_result = handle->value->select_list();
        std::vector<ifcopenshell::declaration*> result;
        result.reserve(source_result.size());
        for (const auto* item : source_result) {
            result.push_back(const_cast<ifcopenshell::declaration*>(item));
        }
        return new ifcopenshell_declaration_list_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_select_type_t* ifcopenshell_select_type_as_select_type(ifcopenshell_select_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_select_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_select_type_t{ const_cast<ifcopenshell::select_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

int ifcopenshell_enumeration_type_lookup_enum_offset(ifcopenshell_enumeration_type_t* handle, const char* value_name) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->lookup_enum_offset(std::string(value_name ? value_name : ""));
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_enumeration_type_t* ifcopenshell_enumeration_type_as_enumeration_type(ifcopenshell_enumeration_type_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->as_enumeration_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_enumeration_type_t{ const_cast<ifcopenshell::enumeration_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_attribute_t* ifcopenshell_attribute_new_with_name_type_of_attribute_optional(const char* name, ifcopenshell_parameter_type_t* type_of_attribute, bool optional) {
    ifcopenshell_last_error_clear();
    try {
        if (type_of_attribute == nullptr) {
            throw std::runtime_error("Null handle parameter received for type_of_attribute");
        }
        auto constructed_value = ifcopenshell::attribute(std::string(name ? name : ""), type_of_attribute->value, optional);
        return new ifcopenshell_attribute_t{ new ifcopenshell::attribute(std::move(constructed_value)) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

char* ifcopenshell_attribute_name(ifcopenshell_attribute_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->name();
        return duplicate_string(result);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_parameter_type_t* ifcopenshell_attribute_type_of_attribute(ifcopenshell_attribute_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->type_of_attribute();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_parameter_type_t{ const_cast<ifcopenshell::parameter_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

bool ifcopenshell_attribute_optional(ifcopenshell_attribute_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->optional();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

char* ifcopenshell_inverse_attribute_name(ifcopenshell_inverse_attribute_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->name();
        return duplicate_string(result);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

int ifcopenshell_inverse_attribute_bound1(ifcopenshell_inverse_attribute_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->bound1();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_inverse_attribute_bound2(ifcopenshell_inverse_attribute_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->bound2();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_attribute_t* ifcopenshell_inverse_attribute_attribute_reference(ifcopenshell_inverse_attribute_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->attribute_reference();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_attribute_t{ const_cast<ifcopenshell::attribute*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

bool ifcopenshell_entity_is_abstract(ifcopenshell_entity_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->is_abstract();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_attribute_list_t* ifcopenshell_entity_attributes(ifcopenshell_entity_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        const auto& source_result = handle->value->attributes();
        std::vector<ifcopenshell::attribute*> result;
        result.reserve(source_result.size());
        for (const auto* item : source_result) {
            result.push_back(const_cast<ifcopenshell::attribute*>(item));
        }
        return new ifcopenshell_attribute_list_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_inverse_attribute_list_t* ifcopenshell_entity_inverse_attributes(ifcopenshell_entity_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        const auto& source_result = handle->value->inverse_attributes();
        std::vector<ifcopenshell::inverse_attribute*> result;
        result.reserve(source_result.size());
        for (const auto* item : source_result) {
            result.push_back(const_cast<ifcopenshell::inverse_attribute*>(item));
        }
        return new ifcopenshell_inverse_attribute_list_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_attribute_list_t* ifcopenshell_entity_all_attributes(ifcopenshell_entity_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        const auto& source_result = handle->value->all_attributes();
        std::vector<ifcopenshell::attribute*> result;
        result.reserve(source_result.size());
        for (const auto* item : source_result) {
            result.push_back(const_cast<ifcopenshell::attribute*>(item));
        }
        return new ifcopenshell_attribute_list_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_inverse_attribute_list_t* ifcopenshell_entity_all_inverse_attributes(ifcopenshell_entity_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        const auto& source_result = handle->value->all_inverse_attributes();
        std::vector<ifcopenshell::inverse_attribute*> result;
        result.reserve(source_result.size());
        for (const auto* item : source_result) {
            result.push_back(const_cast<ifcopenshell::inverse_attribute*>(item));
        }
        return new ifcopenshell_inverse_attribute_list_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_attribute_t* ifcopenshell_entity_attribute_by_index(ifcopenshell_entity_t* handle, int index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->attribute_by_index(index);
        return result_ptr == nullptr ? nullptr : new ifcopenshell_attribute_t{ const_cast<ifcopenshell::attribute*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

int ifcopenshell_entity_attribute_count(ifcopenshell_entity_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->attribute_count();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_declaration_t* ifcopenshell_schema_definition_declaration_by_name_with_name(ifcopenshell_schema_definition_t* handle, const char* name) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->declaration_by_name(std::string(name ? name : ""));
        return result_ptr == nullptr ? nullptr : new ifcopenshell_declaration_t{ const_cast<ifcopenshell::declaration*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_declaration_t* ifcopenshell_schema_definition_declaration_by_name_with_declaration_index(ifcopenshell_schema_definition_t* handle, int declaration_index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->declaration_by_name(declaration_index);
        return result_ptr == nullptr ? nullptr : new ifcopenshell_declaration_t{ const_cast<ifcopenshell::declaration*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_declaration_list_t* ifcopenshell_schema_definition_declarations(ifcopenshell_schema_definition_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        const auto& source_result = handle->value->declarations();
        std::vector<ifcopenshell::declaration*> result;
        result.reserve(source_result.size());
        for (const auto* item : source_result) {
            result.push_back(const_cast<ifcopenshell::declaration*>(item));
        }
        return new ifcopenshell_declaration_list_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_type_declaration_list_t* ifcopenshell_schema_definition_type_declarations(ifcopenshell_schema_definition_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        const auto& source_result = handle->value->type_declarations();
        std::vector<ifcopenshell::type_declaration*> result;
        result.reserve(source_result.size());
        for (const auto* item : source_result) {
            result.push_back(const_cast<ifcopenshell::type_declaration*>(item));
        }
        return new ifcopenshell_type_declaration_list_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_select_type_list_t* ifcopenshell_schema_definition_select_types(ifcopenshell_schema_definition_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        const auto& source_result = handle->value->select_types();
        std::vector<ifcopenshell::select_type*> result;
        result.reserve(source_result.size());
        for (const auto* item : source_result) {
            result.push_back(const_cast<ifcopenshell::select_type*>(item));
        }
        return new ifcopenshell_select_type_list_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_enumeration_type_list_t* ifcopenshell_schema_definition_enumeration_types(ifcopenshell_schema_definition_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        const auto& source_result = handle->value->enumeration_types();
        std::vector<ifcopenshell::enumeration_type*> result;
        result.reserve(source_result.size());
        for (const auto* item : source_result) {
            result.push_back(const_cast<ifcopenshell::enumeration_type*>(item));
        }
        return new ifcopenshell_enumeration_type_list_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

char* ifcopenshell_schema_definition_name(ifcopenshell_schema_definition_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->name();
        return duplicate_string(result);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_schema_registry_bind(ifcopenshell_schema_registry_t* handle, ifcopenshell_schema_definition_t* schema) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (schema == nullptr) {
            throw std::runtime_error("Null handle parameter received for schema");
        }
        handle->value.bind(*schema->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_schema_definition_t* ifcopenshell_schema_registry_get(ifcopenshell_schema_registry_t* handle, const char* schema_name) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value.get(std::string(schema_name ? schema_name : ""));
        return result_ptr == nullptr ? nullptr : new ifcopenshell_schema_definition_t{ const_cast<ifcopenshell::schema_definition*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_schema_registry_clear(ifcopenshell_schema_registry_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.clear();
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_express_base_t* ifcopenshell_base_new() {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = express::base();
        return new ifcopenshell_express_base_t{ {}, std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_declaration_t* ifcopenshell_base_declaration(ifcopenshell_express_base_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        const auto& result_ref = handle->value.declaration();
        auto* result_ptr = &result_ref;
        return result_ptr == nullptr ? nullptr : new ifcopenshell_declaration_t{ const_cast<ifcopenshell::declaration*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_base_set_attribute_value_with_attribute_index_value(ifcopenshell_express_base_t* handle, int attribute_index, ifcopenshell_express_base_t* value) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (value == nullptr) {
            throw std::runtime_error("Null handle parameter received for value");
        }
        handle->value.set_attribute_value(attribute_index, value->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_base_set_attribute_value_with_attribute_name_value(ifcopenshell_express_base_t* handle, const char* attribute_name, ifcopenshell_express_base_t* value) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (value == nullptr) {
            throw std::runtime_error("Null handle parameter received for value");
        }
        handle->value.set_attribute_value(std::string(attribute_name ? attribute_name : ""), value->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_base_unset_attribute_value(ifcopenshell_express_base_t* handle, int attribute_index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.unset_attribute_value(attribute_index);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

int ifcopenshell_base_identity(ifcopenshell_express_base_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.identity();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_base_id(ifcopenshell_express_base_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.id();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_attribute_value_variant_t ifcopenshell_base_get_attribute_value_variant(ifcopenshell_express_base_t* handle, int attribute_index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto native_result = ifcopenshell::wrappergen::get_attribute_value_variant(handle->value, attribute_index);
        ifcopenshell_attribute_value_variant_t c_result{};
        c_result.kind = static_cast<decltype(c_result.kind)>(native_result.kind);
        switch (native_result.kind) {
        case ifcopenshell::wrappergen::ATTRIBUTE_VALUE_KIND_NULL:
            c_result.integer_value = native_result.integer_value;
            break;
        case ifcopenshell::wrappergen::ATTRIBUTE_VALUE_KIND_BOOL:
            c_result.integer_value = native_result.integer_value;
            break;
        case ifcopenshell::wrappergen::ATTRIBUTE_VALUE_KIND_LOGICAL:
            c_result.logical_value = native_result.logical_value;
            break;
        case ifcopenshell::wrappergen::ATTRIBUTE_VALUE_KIND_INTEGER:
            c_result.integer_value = native_result.integer_value;
            break;
        case ifcopenshell::wrappergen::ATTRIBUTE_VALUE_KIND_DOUBLE:
            c_result.double_value = native_result.double_value;
            break;
        case ifcopenshell::wrappergen::ATTRIBUTE_VALUE_KIND_STRING:
            c_result.string_value = duplicate_string(native_result.string_value);
            break;
        case ifcopenshell::wrappergen::ATTRIBUTE_VALUE_KIND_ENUMERATION:
            c_result.string_value = duplicate_string(native_result.string_value);
            break;
        case ifcopenshell::wrappergen::ATTRIBUTE_VALUE_KIND_ENTITY_INSTANCE:
            c_result.entity_value = new ifcopenshell_express_base_t{ handle->owner, native_result.entity_value };
            break;
        default:
            break;
        }
        return c_result;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return {};
    }
}

void ifcopenshell_base_set_attribute_value_variant(ifcopenshell_express_base_t* handle, int attribute_index, ifcopenshell_attribute_value_variant_t value) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        ifcopenshell::wrappergen::attribute_value_variant value_native;
        value_native.kind = static_cast<decltype(value_native.kind)>(value.kind);
        value_native.integer_value = value.integer_value;
        value_native.integer_value = value.integer_value;
        value_native.logical_value = value.logical_value;
        value_native.integer_value = value.integer_value;
        value_native.double_value = value.double_value;
        if (value.string_value != nullptr) {
            value_native.string_value = value.string_value;
        }
        if (value.string_value != nullptr) {
            value_native.string_value = value.string_value;
        }
        if (value.entity_value != nullptr) {
            value_native.entity_value = value.entity_value->value;
        }
        ifcopenshell::wrappergen::set_attribute_value_variant(handle->value, attribute_index, value_native);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_express_entity_list_t* ifcopenshell_entity_get_inverse(ifcopenshell_express_entity_t* handle, const char* attribute_name) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value.get_inverse(std::string(attribute_name ? attribute_name : ""));
        return new ifcopenshell_express_entity_list_t{ handle->owner, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_select_t* ifcopenshell_select_new() {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = express::select();
        return new ifcopenshell_express_select_t{ {}, std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_select_t* ifcopenshell_select_new_with_value(ifcopenshell_express_base_t* value) {
    ifcopenshell_last_error_clear();
    try {
        if (value == nullptr) {
            throw std::runtime_error("Null handle parameter received for value");
        }
        auto constructed_value = express::select(value->value);
        return new ifcopenshell_express_select_t{ {}, std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_base_t* ifcopenshell_select_concrete(ifcopenshell_express_select_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value.concrete();
        return new ifcopenshell_express_base_t{ handle->owner, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_logger_set_product(ifcopenshell_logger_t* handle, ifcopenshell_express_base_t* product) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (product == nullptr) {
            throw std::runtime_error("Null handle parameter received for product");
        }
        handle->value.set_product(product->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_notice_with_message_instance(ifcopenshell_logger_t* handle, const char* message) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.notice(std::string(message ? message : ""));
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_notice_with_message_instance_with_instance(ifcopenshell_logger_t* handle, const char* message, ifcopenshell_express_base_t* instance) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (instance == nullptr) {
            throw std::runtime_error("Null handle parameter received for instance");
        }
        handle->value.notice(std::string(message ? message : ""), instance->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_warning_with_message_instance(ifcopenshell_logger_t* handle, const char* message) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.warning(std::string(message ? message : ""));
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_warning_with_message_instance_with_instance(ifcopenshell_logger_t* handle, const char* message, ifcopenshell_express_base_t* instance) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (instance == nullptr) {
            throw std::runtime_error("Null handle parameter received for instance");
        }
        handle->value.warning(std::string(message ? message : ""), instance->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_error_with_message_instance(ifcopenshell_logger_t* handle, const char* message) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.error(std::string(message ? message : ""));
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_error_with_message_instance_with_instance(ifcopenshell_logger_t* handle, const char* message, ifcopenshell_express_base_t* instance) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (instance == nullptr) {
            throw std::runtime_error("Null handle parameter received for instance");
        }
        handle->value.error(std::string(message ? message : ""), instance->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_notice_with_exception_instance(ifcopenshell_logger_t* handle, ifcopenshell_exception_t* exception) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (exception == nullptr) {
            throw std::runtime_error("Null handle parameter received for exception");
        }
        handle->value.notice(exception->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_notice_with_exception_instance_with_instance(ifcopenshell_logger_t* handle, ifcopenshell_exception_t* exception, ifcopenshell_express_base_t* instance) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (exception == nullptr) {
            throw std::runtime_error("Null handle parameter received for exception");
        }
        if (instance == nullptr) {
            throw std::runtime_error("Null handle parameter received for instance");
        }
        handle->value.notice(exception->value, instance->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_warning_with_exception_instance(ifcopenshell_logger_t* handle, ifcopenshell_exception_t* exception) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (exception == nullptr) {
            throw std::runtime_error("Null handle parameter received for exception");
        }
        handle->value.warning(exception->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_warning_with_exception_instance_with_instance(ifcopenshell_logger_t* handle, ifcopenshell_exception_t* exception, ifcopenshell_express_base_t* instance) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (exception == nullptr) {
            throw std::runtime_error("Null handle parameter received for exception");
        }
        if (instance == nullptr) {
            throw std::runtime_error("Null handle parameter received for instance");
        }
        handle->value.warning(exception->value, instance->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_error_with_exception_instance(ifcopenshell_logger_t* handle, ifcopenshell_exception_t* exception) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (exception == nullptr) {
            throw std::runtime_error("Null handle parameter received for exception");
        }
        handle->value.error(exception->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_error_with_exception_instance_with_instance(ifcopenshell_logger_t* handle, ifcopenshell_exception_t* exception, ifcopenshell_express_base_t* instance) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (exception == nullptr) {
            throw std::runtime_error("Null handle parameter received for exception");
        }
        if (instance == nullptr) {
            throw std::runtime_error("Null handle parameter received for instance");
        }
        handle->value.error(exception->value, instance->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_status(ifcopenshell_logger_t* handle, const char* message) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.status(std::string(message ? message : ""));
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_status_with_new_line(ifcopenshell_logger_t* handle, const char* message, bool new_line) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.status(std::string(message ? message : ""), new_line);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_progress_bar(ifcopenshell_logger_t* handle, int progress) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.progress_bar(progress);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

char* ifcopenshell_logger_get_log(ifcopenshell_logger_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value.get_log();
        return duplicate_string(result);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

int ifcopenshell_logger_count(ifcopenshell_logger_t* handle, const char* code) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.count(std::string(code ? code : ""));
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

void ifcopenshell_logger_clear(ifcopenshell_logger_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.clear();
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_append(ifcopenshell_logger_t* handle, ifcopenshell_logger_t* other) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (other == nullptr) {
            throw std::runtime_error("Null handle parameter received for other");
        }
        handle->value.append(other->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_print_performance_stats(ifcopenshell_logger_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.print_performance_stats();
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_logger_print_performance_stats_on_element_with_enabled(ifcopenshell_logger_t* handle, bool enabled) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.print_performance_stats_on_element(enabled);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

bool ifcopenshell_logger_print_performance_stats_on_element_overload_2(ifcopenshell_logger_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.print_performance_stats_on_element();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_full_buffer_impl_t* ifcopenshell_full_buffer_impl_new() {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::full_buffer_impl();
        return new ifcopenshell_full_buffer_impl_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_full_buffer_impl_t* ifcopenshell_full_buffer_impl_new_with_path(const char* path) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::full_buffer_impl(std::string(path ? path : ""));
        return new ifcopenshell_full_buffer_impl_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

int ifcopenshell_full_buffer_impl_size(ifcopenshell_full_buffer_impl_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.size();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_full_buffer_impl_get_u32(ifcopenshell_full_buffer_impl_t* handle, int position) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.get_u32(position);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

void ifcopenshell_full_buffer_impl_push_next_page(ifcopenshell_full_buffer_impl_t* handle, const char* page_data) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.push_next_page(std::string(page_data ? page_data : ""));
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_full_buffer_impl_drop_pages(ifcopenshell_full_buffer_impl_t* handle, int up_to_position) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.drop_pages(up_to_position);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_paged_file_impl_t* ifcopenshell_paged_file_impl_new_with_path_page_size_page_capacity(const char* path, int page_size, int page_capacity) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::paged_file_impl(std::string(path ? path : ""), page_size, page_capacity);
        return new ifcopenshell_paged_file_impl_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

int ifcopenshell_paged_file_impl_size(ifcopenshell_paged_file_impl_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.size();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_paged_file_impl_get_u32(ifcopenshell_paged_file_impl_t* handle, int position) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.get_u32(position);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

void ifcopenshell_paged_file_impl_push_next_page(ifcopenshell_paged_file_impl_t* handle, const char* page_data) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.push_next_page(std::string(page_data ? page_data : ""));
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_paged_file_impl_drop_pages(ifcopenshell_paged_file_impl_t* handle, int up_to_position) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.drop_pages(up_to_position);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

int ifcopenshell_pushed_sequential_impl_size(ifcopenshell_pushed_sequential_impl_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.size();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_pushed_sequential_impl_get_u32(ifcopenshell_pushed_sequential_impl_t* handle, int position) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.get_u32(position);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

void ifcopenshell_pushed_sequential_impl_push_next_page(ifcopenshell_pushed_sequential_impl_t* handle, const char* page_data) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.push_next_page(std::string(page_data ? page_data : ""));
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_pushed_sequential_impl_drop_pages(ifcopenshell_pushed_sequential_impl_t* handle, int up_to_position) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value.drop_pages(up_to_position);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_character_encoder_t* ifcopenshell_character_encoder_new_with_input(const char* input) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::character_encoder(std::string(input ? input : ""));
        return new ifcopenshell_character_encoder_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_token_t* ifcopenshell_token_new() {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::token();
        return new ifcopenshell_token_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

bool ifcopenshell_token_is_string(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.is_string();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_token_is_identifier(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.is_identifier();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_token_is_operator(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.is_operator();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_token_is_enumeration(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.is_enumeration();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_token_is_keyword(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.is_keyword();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_token_is_int(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.is_int();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_token_is_bool(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.is_bool();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_token_is_logical(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.is_logical();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_token_is_float(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.is_float();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_token_is_binary(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.is_binary();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_token_as_identifier(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.as_identifier();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_token_as_bool(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.as_bool();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

char* ifcopenshell_token_as_string(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value.as_string();
        return duplicate_string(result);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

char* ifcopenshell_token_to_string(ifcopenshell_token_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value.to_string();
        return duplicate_string(result);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_enumeration_reference_t* ifcopenshell_enumeration_reference_new() {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::enumeration_reference();
        return new ifcopenshell_enumeration_reference_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_enumeration_reference_t* ifcopenshell_enumeration_reference_new_with_enumeration(ifcopenshell_enumeration_type_t* enumeration) {
    ifcopenshell_last_error_clear();
    try {
        if (enumeration == nullptr) {
            throw std::runtime_error("Null handle parameter received for enumeration");
        }
        auto constructed_value = ifcopenshell::enumeration_reference(enumeration->value);
        return new ifcopenshell_enumeration_reference_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_enumeration_reference_t* ifcopenshell_enumeration_reference_new_with_enumeration_index(ifcopenshell_enumeration_type_t* enumeration, int index) {
    ifcopenshell_last_error_clear();
    try {
        if (enumeration == nullptr) {
            throw std::runtime_error("Null handle parameter received for enumeration");
        }
        auto constructed_value = ifcopenshell::enumeration_reference(enumeration->value, index);
        return new ifcopenshell_enumeration_reference_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

int ifcopenshell_enumeration_reference_index(ifcopenshell_enumeration_reference_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.index();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_enumeration_type_t* ifcopenshell_enumeration_reference_enumeration(ifcopenshell_enumeration_reference_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value.enumeration();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_enumeration_type_t{ const_cast<ifcopenshell::enumeration_type*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_attribute_value_t* ifcopenshell_attribute_value_new() {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::attribute_value();
        return new ifcopenshell_attribute_value_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

bool ifcopenshell_attribute_value_is_null(ifcopenshell_attribute_value_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.isNull();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_attribute_value_size(ifcopenshell_attribute_value_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value.size();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_argument_type_t ifcopenshell_attribute_value_type(ifcopenshell_attribute_value_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return static_cast<ifcopenshell_argument_type_t>(handle->value.type());
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return static_cast<ifcopenshell_argument_type_t>(0);
    }
}

ifcopenshell_spf_header_t* ifcopenshell_spf_header_new() {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::spf_header();
        return new ifcopenshell_spf_header_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_spf_header_t* ifcopenshell_spf_header_new_with_file(ifcopenshell_file_t* file) {
    ifcopenshell_last_error_clear();
    try {
        if (file == nullptr) {
            throw std::runtime_error("Null handle parameter received for file");
        }
        auto constructed_value = ifcopenshell::spf_header(file->value.get());
        return new ifcopenshell_spf_header_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_spf_header_t* ifcopenshell_spf_header_new_with_file_logger(ifcopenshell_file_t* file, ifcopenshell_logger_t* logger) {
    ifcopenshell_last_error_clear();
    try {
        if (file == nullptr) {
            throw std::runtime_error("Null handle parameter received for file");
        }
        if (logger == nullptr) {
            throw std::runtime_error("Null handle parameter received for logger");
        }
        auto constructed_value = ifcopenshell::spf_header(file->value.get(), &logger->value);
        return new ifcopenshell_spf_header_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_spf_header_owner_file(ifcopenshell_spf_header_t* handle, ifcopenshell_file_t* file) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (file == nullptr) {
            throw std::runtime_error("Null handle parameter received for file");
        }
        handle->value.owner_file(file->value.get());
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_spf_header_assign(ifcopenshell_spf_header_t* handle, ifcopenshell_spf_header_t* other) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (other == nullptr) {
            throw std::runtime_error("Null handle parameter received for other");
        }
        handle->value.assign(other->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new_with_path(const char* path) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = std::make_shared<ifcopenshell::file>(std::string(path ? path : ""));
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new_with_path_with_filetype(const char* path, ifcopenshell_file_type_t filetype) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = std::make_shared<ifcopenshell::file>(std::string(path ? path : ""), static_cast<ifcopenshell::filetype>(filetype));
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new_with_path_with_filetype_readonly(const char* path, ifcopenshell_file_type_t filetype, bool readonly) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = std::make_shared<ifcopenshell::file>(std::string(path ? path : ""), static_cast<ifcopenshell::filetype>(filetype), readonly);
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new_with_path_with_filetype_readonly_logger(const char* path, ifcopenshell_file_type_t filetype, bool readonly, ifcopenshell_logger_t* logger) {
    ifcopenshell_last_error_clear();
    try {
        if (logger == nullptr) {
            throw std::runtime_error("Null handle parameter received for logger");
        }
        auto constructed_value = std::make_shared<ifcopenshell::file>(std::string(path ? path : ""), static_cast<ifcopenshell::filetype>(filetype), readonly, logger->value);
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new_with_data_data_size(const char* data, int data_size) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = std::make_shared<ifcopenshell::file>(static_cast<void*>(const_cast<char*>(data)), data_size);
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new_with_data_data_size_with_logger(const char* data, int data_size, ifcopenshell_logger_t* logger) {
    ifcopenshell_last_error_clear();
    try {
        if (logger == nullptr) {
            throw std::runtime_error("Null handle parameter received for logger");
        }
        auto constructed_value = std::make_shared<ifcopenshell::file>(static_cast<void*>(const_cast<char*>(data)), data_size, logger->value);
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new() {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = std::make_shared<ifcopenshell::file>();
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new_with_schema(ifcopenshell_schema_definition_t* schema) {
    ifcopenshell_last_error_clear();
    try {
        if (schema == nullptr) {
            throw std::runtime_error("Null handle parameter received for schema");
        }
        auto constructed_value = std::make_shared<ifcopenshell::file>(schema->value);
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new_with_schema_filetype(ifcopenshell_schema_definition_t* schema, ifcopenshell_file_type_t filetype) {
    ifcopenshell_last_error_clear();
    try {
        if (schema == nullptr) {
            throw std::runtime_error("Null handle parameter received for schema");
        }
        auto constructed_value = std::make_shared<ifcopenshell::file>(schema->value, static_cast<ifcopenshell::filetype>(filetype));
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new_with_schema_filetype_path(ifcopenshell_schema_definition_t* schema, ifcopenshell_file_type_t filetype, const char* path) {
    ifcopenshell_last_error_clear();
    try {
        if (schema == nullptr) {
            throw std::runtime_error("Null handle parameter received for schema");
        }
        auto constructed_value = std::make_shared<ifcopenshell::file>(schema->value, static_cast<ifcopenshell::filetype>(filetype), std::string(path ? path : ""));
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_file_t* ifcopenshell_file_new_with_schema_filetype_path_logger(ifcopenshell_schema_definition_t* schema, ifcopenshell_file_type_t filetype, const char* path, ifcopenshell_logger_t* logger) {
    ifcopenshell_last_error_clear();
    try {
        if (schema == nullptr) {
            throw std::runtime_error("Null handle parameter received for schema");
        }
        if (logger == nullptr) {
            throw std::runtime_error("Null handle parameter received for logger");
        }
        auto constructed_value = std::make_shared<ifcopenshell::file>(schema->value, static_cast<ifcopenshell::filetype>(filetype), std::string(path ? path : ""), logger->value);
        return new ifcopenshell_file_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

bool ifcopenshell_file_initialize(ifcopenshell_file_t* handle, const char* path) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->initialize(std::string(path ? path : ""));
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_file_initialize_with_filetype(ifcopenshell_file_t* handle, const char* path, ifcopenshell_file_type_t filetype) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->initialize(std::string(path ? path : ""), static_cast<ifcopenshell::filetype>(filetype));
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

bool ifcopenshell_file_initialize_with_filetype_readonly(ifcopenshell_file_t* handle, const char* path, ifcopenshell_file_type_t filetype, bool readonly) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->initialize(std::string(path ? path : ""), static_cast<ifcopenshell::filetype>(filetype), readonly);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

void ifcopenshell_file_bypass_type(ifcopenshell_file_t* handle, const char* type_name) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value->bypass_type(std::string(type_name ? type_name : ""));
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_file_open_status_t* ifcopenshell_file_good(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->good();
        return new ifcopenshell_file_open_status_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_base_list_t* ifcopenshell_file_instances_by_type_with_declaration(ifcopenshell_file_t* handle, ifcopenshell_declaration_t* declaration) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (declaration == nullptr) {
            throw std::runtime_error("Null handle parameter received for declaration");
        }
        auto result = handle->value->instances_by_type(declaration->value);
        return new ifcopenshell_express_base_list_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_base_list_t* ifcopenshell_file_instances_by_type_excl_subtypes_with_declaration(ifcopenshell_file_t* handle, ifcopenshell_declaration_t* declaration) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (declaration == nullptr) {
            throw std::runtime_error("Null handle parameter received for declaration");
        }
        auto result = handle->value->instances_by_type_excl_subtypes(declaration->value);
        return new ifcopenshell_express_base_list_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_base_list_t* ifcopenshell_file_instances_by_type_with_type_name(ifcopenshell_file_t* handle, const char* type_name) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->instances_by_type(std::string(type_name ? type_name : ""));
        return new ifcopenshell_express_base_list_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_base_list_t* ifcopenshell_file_instances_by_type_excl_subtypes_with_type_name(ifcopenshell_file_t* handle, const char* type_name) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->instances_by_type_excl_subtypes(std::string(type_name ? type_name : ""));
        return new ifcopenshell_express_base_list_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_base_list_t* ifcopenshell_file_instances_by_reference(ifcopenshell_file_t* handle, int reference_id) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->instances_by_reference(reference_id);
        return new ifcopenshell_express_base_list_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_base_t* ifcopenshell_file_instance_by_id(ifcopenshell_file_t* handle, int instance_id) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->instance_by_id(instance_id);
        return new ifcopenshell_express_base_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_base_t* ifcopenshell_file_instance_by_guid(ifcopenshell_file_t* handle, const char* global_id) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->instance_by_guid(std::string(global_id ? global_id : ""));
        return new ifcopenshell_express_base_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_entity_list_t* ifcopenshell_file_get_inverse(ifcopenshell_file_t* handle, int instance_id, ifcopenshell_declaration_t* declaration, int attribute_index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (declaration == nullptr) {
            throw std::runtime_error("Null handle parameter received for declaration");
        }
        auto result = handle->value->get_inverse(instance_id, declaration->value, attribute_index);
        return new ifcopenshell_express_entity_list_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

int ifcopenshell_file_get_total_inverses(ifcopenshell_file_t* handle, int instance_id) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->get_total_inverses(instance_id);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_file_fresh_id(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->fresh_id();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

int ifcopenshell_file_get_max_id(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        return handle->value->get_max_id();
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_declaration_t* ifcopenshell_file_ifcroot_type(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->ifcroot_type();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_declaration_t{ const_cast<ifcopenshell::declaration*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_file_recalculate_id_counter(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value->recalculate_id_counter();
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_express_base_t* ifcopenshell_file_add_entity(ifcopenshell_file_t* handle, ifcopenshell_express_base_t* entity) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (entity == nullptr) {
            throw std::runtime_error("Null handle parameter received for entity");
        }
        auto result = handle->value->add_entity(entity->value);
        return new ifcopenshell_express_base_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_base_t* ifcopenshell_file_add_entity_with_instance_id(ifcopenshell_file_t* handle, ifcopenshell_express_base_t* entity, int instance_id) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (entity == nullptr) {
            throw std::runtime_error("Null handle parameter received for entity");
        }
        auto result = handle->value->add_entity(entity->value, instance_id);
        return new ifcopenshell_express_base_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_file_remove_entity(ifcopenshell_file_t* handle, ifcopenshell_express_base_t* entity) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (entity == nullptr) {
            throw std::runtime_error("Null handle parameter received for entity");
        }
        handle->value->remove_entity(entity->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_spf_header_t* ifcopenshell_file_header(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value->header();
        return new ifcopenshell_spf_header_t{ std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_schema_definition_t* ifcopenshell_file_schema(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto* result_ptr = handle->value->schema();
        return result_ptr == nullptr ? nullptr : new ifcopenshell_schema_definition_t{ const_cast<ifcopenshell::schema_definition*>(result_ptr) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_file_build_inverses_overload_1(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value->build_inverses();
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_file_register_inverse(ifcopenshell_file_t* handle, int referenced_id, ifcopenshell_entity_t* from_entity, int instance_id, int attribute_index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (from_entity == nullptr) {
            throw std::runtime_error("Null handle parameter received for from_entity");
        }
        handle->value->register_inverse(referenced_id, from_entity->value, instance_id, attribute_index);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_file_unregister_inverse(ifcopenshell_file_t* handle, int referenced_id, ifcopenshell_entity_t* from_entity, ifcopenshell_express_base_t* entity, int attribute_index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (from_entity == nullptr) {
            throw std::runtime_error("Null handle parameter received for from_entity");
        }
        if (entity == nullptr) {
            throw std::runtime_error("Null handle parameter received for entity");
        }
        handle->value->unregister_inverse(referenced_id, from_entity->value, entity->value, attribute_index);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_file_add_type_ref(ifcopenshell_file_t* handle, ifcopenshell_express_base_t* new_entity) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (new_entity == nullptr) {
            throw std::runtime_error("Null handle parameter received for new_entity");
        }
        handle->value->add_type_ref(new_entity->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_file_remove_type_ref(ifcopenshell_file_t* handle, ifcopenshell_express_base_t* new_entity) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (new_entity == nullptr) {
            throw std::runtime_error("Null handle parameter received for new_entity");
        }
        handle->value->remove_type_ref(new_entity->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_file_process_deletion_inverse(ifcopenshell_file_t* handle, ifcopenshell_express_base_t* entity) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (entity == nullptr) {
            throw std::runtime_error("Null handle parameter received for entity");
        }
        handle->value->process_deletion_inverse(entity->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_file_build_inverses_with_entity(ifcopenshell_file_t* handle, ifcopenshell_express_base_t* entity) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (entity == nullptr) {
            throw std::runtime_error("Null handle parameter received for entity");
        }
        handle->value->build_inverses_(entity->value);
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_express_base_t* ifcopenshell_file_create_with_declaration_instance_id(ifcopenshell_file_t* handle, ifcopenshell_declaration_t* declaration) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (declaration == nullptr) {
            throw std::runtime_error("Null handle parameter received for declaration");
        }
        auto result = handle->value->create(declaration->value);
        return new ifcopenshell_express_base_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_express_base_t* ifcopenshell_file_create_with_declaration_instance_id_with_instance_id(ifcopenshell_file_t* handle, ifcopenshell_declaration_t* declaration, int instance_id) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        if (declaration == nullptr) {
            throw std::runtime_error("Null handle parameter received for declaration");
        }
        auto result = handle->value->create(declaration->value, instance_id);
        return new ifcopenshell_express_base_t{ handle->value, std::move(result) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_file_batch(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value->batch();
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_file_unbatch(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value->unbatch();
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

void ifcopenshell_file_reset_identity_cache(ifcopenshell_file_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        handle->value->reset_identity_cache();
        return;
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return;
    }
}

ifcopenshell_global_id_t* ifcopenshell_global_id_new() {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::global_id();
        return new ifcopenshell_global_id_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_global_id_t* ifcopenshell_global_id_new_with_logger(ifcopenshell_logger_t* logger) {
    ifcopenshell_last_error_clear();
    try {
        if (logger == nullptr) {
            throw std::runtime_error("Null handle parameter received for logger");
        }
        auto constructed_value = ifcopenshell::global_id(logger->value);
        return new ifcopenshell_global_id_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_global_id_t* ifcopenshell_global_id_new_with_value(const char* value) {
    ifcopenshell_last_error_clear();
    try {
        auto constructed_value = ifcopenshell::global_id(std::string(value ? value : ""));
        return new ifcopenshell_global_id_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

ifcopenshell_global_id_t* ifcopenshell_global_id_new_with_value_with_logger(const char* value, ifcopenshell_logger_t* logger) {
    ifcopenshell_last_error_clear();
    try {
        if (logger == nullptr) {
            throw std::runtime_error("Null handle parameter received for logger");
        }
        auto constructed_value = ifcopenshell::global_id(std::string(value ? value : ""), logger->value);
        return new ifcopenshell_global_id_t{ std::move(constructed_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

char* ifcopenshell_global_id_formatted(ifcopenshell_global_id_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null handle received");
        }
        auto result = handle->value.formatted();
        return duplicate_string(result);
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

int ifcopenshell_declaration_list_size(const ifcopenshell_declaration_list_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        return static_cast<int>(handle->value.size());
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_declaration_t* ifcopenshell_declaration_list_get(const ifcopenshell_declaration_list_t* handle, int index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        if (index < 0 || static_cast<size_t>(index) >= handle->value.size()) {
            throw std::out_of_range("List index out of range");
        }
        return new ifcopenshell_declaration_t{ handle->value.at(static_cast<size_t>(index)) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_declaration_list_free(ifcopenshell_declaration_list_t* handle) {
    delete handle;
}

int ifcopenshell_attribute_list_size(const ifcopenshell_attribute_list_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        return static_cast<int>(handle->value.size());
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_attribute_t* ifcopenshell_attribute_list_get(const ifcopenshell_attribute_list_t* handle, int index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        if (index < 0 || static_cast<size_t>(index) >= handle->value.size()) {
            throw std::out_of_range("List index out of range");
        }
        return new ifcopenshell_attribute_t{ handle->value.at(static_cast<size_t>(index)) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_attribute_list_free(ifcopenshell_attribute_list_t* handle) {
    delete handle;
}

int ifcopenshell_inverse_attribute_list_size(const ifcopenshell_inverse_attribute_list_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        return static_cast<int>(handle->value.size());
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_inverse_attribute_t* ifcopenshell_inverse_attribute_list_get(const ifcopenshell_inverse_attribute_list_t* handle, int index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        if (index < 0 || static_cast<size_t>(index) >= handle->value.size()) {
            throw std::out_of_range("List index out of range");
        }
        return new ifcopenshell_inverse_attribute_t{ handle->value.at(static_cast<size_t>(index)) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_inverse_attribute_list_free(ifcopenshell_inverse_attribute_list_t* handle) {
    delete handle;
}

int ifcopenshell_type_declaration_list_size(const ifcopenshell_type_declaration_list_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        return static_cast<int>(handle->value.size());
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_type_declaration_t* ifcopenshell_type_declaration_list_get(const ifcopenshell_type_declaration_list_t* handle, int index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        if (index < 0 || static_cast<size_t>(index) >= handle->value.size()) {
            throw std::out_of_range("List index out of range");
        }
        return new ifcopenshell_type_declaration_t{ handle->value.at(static_cast<size_t>(index)) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_type_declaration_list_free(ifcopenshell_type_declaration_list_t* handle) {
    delete handle;
}

int ifcopenshell_select_type_list_size(const ifcopenshell_select_type_list_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        return static_cast<int>(handle->value.size());
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_select_type_t* ifcopenshell_select_type_list_get(const ifcopenshell_select_type_list_t* handle, int index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        if (index < 0 || static_cast<size_t>(index) >= handle->value.size()) {
            throw std::out_of_range("List index out of range");
        }
        return new ifcopenshell_select_type_t{ handle->value.at(static_cast<size_t>(index)) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_select_type_list_free(ifcopenshell_select_type_list_t* handle) {
    delete handle;
}

int ifcopenshell_enumeration_type_list_size(const ifcopenshell_enumeration_type_list_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        return static_cast<int>(handle->value.size());
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_enumeration_type_t* ifcopenshell_enumeration_type_list_get(const ifcopenshell_enumeration_type_list_t* handle, int index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        if (index < 0 || static_cast<size_t>(index) >= handle->value.size()) {
            throw std::out_of_range("List index out of range");
        }
        return new ifcopenshell_enumeration_type_t{ handle->value.at(static_cast<size_t>(index)) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_enumeration_type_list_free(ifcopenshell_enumeration_type_list_t* handle) {
    delete handle;
}

int ifcopenshell_express_entity_list_size(const ifcopenshell_express_entity_list_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        return static_cast<int>(handle->value.size());
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_express_entity_t* ifcopenshell_express_entity_list_get(const ifcopenshell_express_entity_list_t* handle, int index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        if (index < 0 || static_cast<size_t>(index) >= handle->value.size()) {
            throw std::out_of_range("List index out of range");
        }
        auto item_value = handle->value.at(static_cast<size_t>(index));
        return new ifcopenshell_express_entity_t{ handle->owner, std::move(item_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_express_entity_list_free(ifcopenshell_express_entity_list_t* handle) {
    delete handle;
}

int ifcopenshell_express_base_list_size(const ifcopenshell_express_base_list_t* handle) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        return static_cast<int>(handle->value.size());
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return 0;
    }
}

ifcopenshell_express_base_t* ifcopenshell_express_base_list_get(const ifcopenshell_express_base_list_t* handle, int index) {
    ifcopenshell_last_error_clear();
    try {
        if (handle == nullptr) {
            throw std::runtime_error("Null list handle received");
        }
        if (index < 0 || static_cast<size_t>(index) >= handle->value.size()) {
            throw std::out_of_range("List index out of range");
        }
        auto item_value = handle->value.at(static_cast<size_t>(index));
        return new ifcopenshell_express_base_t{ handle->owner, std::move(item_value) };
    } catch (const std::exception& exception) {
        set_last_error(exception);
        return nullptr;
    }
}

void ifcopenshell_express_base_list_free(ifcopenshell_express_base_list_t* handle) {
    delete handle;
}

void ifcopenshell_exception_free(ifcopenshell_exception_t* handle) {
    delete handle;
}

void ifcopenshell_attribute_out_of_range_exception_free(ifcopenshell_attribute_out_of_range_exception_t* handle) {
    delete handle;
}

void ifcopenshell_invalid_token_exception_free(ifcopenshell_invalid_token_exception_t* handle) {
    delete handle;
}

void ifcopenshell_parameter_type_free(ifcopenshell_parameter_type_t* handle) {
    delete handle;
}

void ifcopenshell_named_type_free(ifcopenshell_named_type_t* handle) {
    delete handle;
}

void ifcopenshell_simple_type_free(ifcopenshell_simple_type_t* handle) {
    delete handle;
}

void ifcopenshell_aggregation_type_free(ifcopenshell_aggregation_type_t* handle) {
    delete handle;
}

void ifcopenshell_declaration_free(ifcopenshell_declaration_t* handle) {
    delete handle;
}

void ifcopenshell_type_declaration_free(ifcopenshell_type_declaration_t* handle) {
    delete handle;
}

void ifcopenshell_select_type_free(ifcopenshell_select_type_t* handle) {
    delete handle;
}

void ifcopenshell_enumeration_type_free(ifcopenshell_enumeration_type_t* handle) {
    delete handle;
}

void ifcopenshell_attribute_free(ifcopenshell_attribute_t* handle) {
    delete handle;
}

void ifcopenshell_inverse_attribute_free(ifcopenshell_inverse_attribute_t* handle) {
    delete handle;
}

void ifcopenshell_entity_free(ifcopenshell_entity_t* handle) {
    delete handle;
}

void ifcopenshell_schema_definition_free(ifcopenshell_schema_definition_t* handle) {
    delete handle;
}

void ifcopenshell_schema_registry_free(ifcopenshell_schema_registry_t* handle) {
    delete handle;
}

void ifcopenshell_express_base_free(ifcopenshell_express_base_t* handle) {
    delete handle;
}

void ifcopenshell_express_entity_free(ifcopenshell_express_entity_t* handle) {
    delete handle;
}

void ifcopenshell_express_select_free(ifcopenshell_express_select_t* handle) {
    delete handle;
}

void ifcopenshell_logger_free(ifcopenshell_logger_t* handle) {
    delete handle;
}

void ifcopenshell_full_buffer_impl_free(ifcopenshell_full_buffer_impl_t* handle) {
    delete handle;
}

void ifcopenshell_paged_file_impl_free(ifcopenshell_paged_file_impl_t* handle) {
    delete handle;
}

void ifcopenshell_pushed_sequential_impl_free(ifcopenshell_pushed_sequential_impl_t* handle) {
    delete handle;
}

void ifcopenshell_character_encoder_free(ifcopenshell_character_encoder_t* handle) {
    delete handle;
}

void ifcopenshell_file_open_status_free(ifcopenshell_file_open_status_t* handle) {
    delete handle;
}

void ifcopenshell_token_free(ifcopenshell_token_t* handle) {
    delete handle;
}

void ifcopenshell_enumeration_reference_free(ifcopenshell_enumeration_reference_t* handle) {
    delete handle;
}

void ifcopenshell_attribute_value_free(ifcopenshell_attribute_value_t* handle) {
    delete handle;
}

void ifcopenshell_spf_header_free(ifcopenshell_spf_header_t* handle) {
    delete handle;
}

void ifcopenshell_file_free(ifcopenshell_file_t* handle) {
    delete handle;
}

void ifcopenshell_global_id_free(ifcopenshell_global_id_t* handle) {
    delete handle;
}

}
