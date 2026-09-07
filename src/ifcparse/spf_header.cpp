#include "spf_header.h"

#include "file.h"
#include "logger.h"

static const char* const ISO_10303_21 = "ISO-10303-21";
static const char* const HEADER = "HEADER";
static const char* const ENDSEC = "ENDSEC";
static const char* const DATA = "DATA";

using namespace ifcopenshell;

namespace {

shared_pointer_type make_header_entity(ifcopenshell::file* file, const ifcopenshell::entity& decl, ifcopenshell::logger& logger) {
    static_cast<void>(logger);
    const bool in_memory = file == nullptr || std::visit([](auto& storage) {
        return std::is_same_v<std::decay_t<decltype(storage)>, ifcopenshell::impl::in_memory_file_storage>;
    }, file->storage_);

    if (in_memory) {
        return ifcopenshell::make_pointer_type<instance_data>(file, &decl, 0, in_memory_attribute_storage(decl.attribute_count()));
    }

    return ifcopenshell::make_pointer_type<instance_data>(file, &decl, 0, rocks_db_attribute_storage{});
}

// Frees a header-entity pointer. In the default (non-IFOPSH_SAFE_INSTANCE) build,
// `shared_pointer_type` is a raw, owning `instance_data*` (see express.h) -- unlike
// regular DATA-section entities (id != 0), which get registered in the owning file's
// own storage map, header entities are constructed with id 0 and are never inserted
// anywhere else (`instance_data::populate_derived_` only sets derived-attribute
// defaults, nothing file-storage-related), so `spf_header` is their sole owner and
// must free them explicitly. Found as a real LeakSanitizer report from the
// ifcopenshell-ts `fuzz` CI job: every `spf_header` construction (i.e. every file
// parse, including on the plain seed corpus, not just mutated input) allocates 3
// placeholder header entities, `parse_header` (parse.cpp) then replaces them with the
// real parsed ones via set_file_description/name/schema below without freeing the
// placeholders first, and neither the replacement entities nor any leftover
// placeholders were ever freed on `spf_header` destruction (`~spf_header()` was
// `= default`, a no-op for a `std::array` of raw pointers). Scoped deliberately to
// just this leak, not the broader question of whether/how regular (non-header,
// id != 0) entity lifetimes are managed elsewhere -- out of scope here. Under
// IFOPSH_SAFE_INSTANCE (not wired into any build currently), `shared_pointer_type` is
// a `std::shared_ptr`, which already frees itself on overwrite/destruction, so this is
// a no-op there.
void free_header_entity(shared_pointer_type& entity) {
#ifndef IFOPSH_SAFE_INSTANCE
    delete entity;
    entity = nullptr;
#else
    static_cast<void>(entity);
#endif
}

} // namespace

ifcopenshell::spf_header::spf_header(ifcopenshell::file* file, ifcopenshell::logger* logger)
    : file_(file)
    , logger_(logger_or_root(logger)) {
    Header_section_schema::get_schema();

    header_entities_[0] = make_header_entity(file_, Header_section_schema::file_description::Class(), logger_);
    header_entities_[1] = make_header_entity(file_, Header_section_schema::file_name::Class(), logger_);
    header_entities_[2] = make_header_entity(file_, Header_section_schema::file_schema::Class(), logger_);
}

// Deep copy, not a pointer copy: constructs 3 fresh header entities of its own (same
// as the default constructor), then clones `other`'s attribute values into them via
// the pre-existing assign() (below) - this is exactly the mechanism assign() already
// provides for copying header values between two independently-owned spf_headers
// (previously only reachable via the generated ifcopenshell_spf_header_assign C API,
// now also the basis for real copy semantics). Deliberately NOT a shallow pointer
// copy: `ifcopenshell::file::header()` returns a reference to the file's own
// persistent `header_` member, and callers that copy that reference into a value
// (e.g. the generated `ifcopenshell_file_header` C API's `auto result = ...`) must get
// an independent snapshot, not aliased ownership of the file's own header entities -
// a shallow copy here previously produced exactly that aliasing, which was harmless
// only because ~spf_header() used to be a no-op; fixing the leak (see
// free_header_entity's own comment above) turned that latent aliasing into a real
// double-free/use-after-free once one of the two aliased copies was destroyed first.
ifcopenshell::spf_header::spf_header(const spf_header& other)
    : file_(other.file_)
    , logger_(other.logger_) {
    Header_section_schema::get_schema();

    header_entities_[0] = make_header_entity(file_, Header_section_schema::file_description::Class(), logger_);
    header_entities_[1] = make_header_entity(file_, Header_section_schema::file_name::Class(), logger_);
    header_entities_[2] = make_header_entity(file_, Header_section_schema::file_schema::Class(), logger_);

    assign(other);
}

ifcopenshell::spf_header& ifcopenshell::spf_header::operator=(const spf_header& other) {
    if (this != &other) {
        file_ = other.file_;
        logger_ = other.logger_;
        // Values only, not pointers - this->header_entities_ already holds valid,
        // independently-owned entities (either from construction or a prior
        // assignment), same as assign()'s existing contract.
        assign(other);
    }
    return *this;
}

// Cheap ownership transfer (not a clone): takes over `other`'s 3 pointers directly and
// nulls `other`'s array so its destructor becomes a no-op instead of double-freeing
// what this object now owns. Safe specifically because `other` is guaranteed to be an
// rvalue (about to be destroyed or reassigned) - unlike the copy constructor above,
// this must never alias a still-live object's entities.
ifcopenshell::spf_header::spf_header(spf_header&& other) noexcept
    : file_(other.file_)
    , logger_(other.logger_)
    , header_entities_(other.header_entities_) {
    other.header_entities_.fill(nullptr);
}

ifcopenshell::spf_header& ifcopenshell::spf_header::operator=(spf_header&& other) noexcept {
    if (this != &other) {
        for (auto& entity : header_entities_) {
            free_header_entity(entity);
        }
        file_ = other.file_;
        logger_ = other.logger_;
        header_entities_ = other.header_entities_;
        other.header_entities_.fill(nullptr);
    }
    return *this;
}

ifcopenshell::spf_header::~spf_header() {
    for (auto& entity : header_entities_) {
        free_header_entity(entity);
    }
}

void spf_header::write(std::ostream& out) const {
    out << ISO_10303_21 << ";"
        << "\n";
    out << HEADER << ";"
        << "\n";
    file_description().to_string(out, true);
    out << ";"
        << "\n";
    file_name().to_string(out, true);
    out << ";"
        << "\n";
    file_schema().to_string(out, true);
    out << ";"
        << "\n";
    out << ENDSEC << ";"
        << "\n";
    out << DATA << ";"
        << "\n";
}

void ifcopenshell::spf_header::owner_file(ifcopenshell::file* file) {
    file_ = file;
}

// See free_header_entity's own comment above (in the anonymous namespace at the top
// of this file) for why the previous entity must be freed here: parse_header
// (parse.cpp) calls these to replace spf_header's 3 placeholder header entities with
// the real parsed ones, and without this, the placeholder each one replaces leaks.
void ifcopenshell::spf_header::set_file_description(const shared_pointer_type& data) {
    if (header_entities_[0] != data) {
        free_header_entity(header_entities_[0]);
    }
    header_entities_[0] = data;
}

void ifcopenshell::spf_header::set_file_name(const shared_pointer_type& data) {
    if (header_entities_[1] != data) {
        free_header_entity(header_entities_[1]);
    }
    header_entities_[1] = data;
}

void ifcopenshell::spf_header::set_file_schema(const shared_pointer_type& data) {
    if (header_entities_[2] != data) {
        free_header_entity(header_entities_[2]);
    }
    header_entities_[2] = data;
}

const Header_section_schema::file_description ifcopenshell::spf_header::file_description() const {
    return Header_section_schema::file_description(header_entities_[0]);
}

const Header_section_schema::file_name ifcopenshell::spf_header::file_name() const {
    return Header_section_schema::file_name(header_entities_[1]);
}

const Header_section_schema::file_schema ifcopenshell::spf_header::file_schema() const {
    return Header_section_schema::file_schema(header_entities_[2]);
}

Header_section_schema::file_description ifcopenshell::spf_header::file_description() {
    return Header_section_schema::file_description(header_entities_[0]);
}

Header_section_schema::file_name ifcopenshell::spf_header::file_name() {
    return Header_section_schema::file_name(header_entities_[1]);
}

Header_section_schema::file_schema ifcopenshell::spf_header::file_schema() {
    return Header_section_schema::file_schema(header_entities_[2]);
}

void ifcopenshell::spf_header::assign(const spf_header& other) {
    if (this != &other) {
        auto copy_inst = [](express::entity& new_entity, const express::entity& entity) {
            for (size_t i = 0; i < entity.declaration().as_entity()->attribute_count(); ++i) {
                entity.get_attribute_value(i).apply_visitor([i, &entity, &new_entity](const auto& v) {
                    using u = std::decay_t<decltype(v)>;
                    if constexpr (std::is_same_v<u, express::base>) {
                    } else if constexpr (std::is_same_v<u, std::vector<express::base>>) {
                    } else if constexpr (std::is_same_v<u, std::vector<std::vector<express::base>>>) {
                    } else if constexpr (std::is_same_v<u, empty_aggregate>) {
                    } else if constexpr (std::is_same_v<u, empty_aggregate_of_aggregate>) {
                    } else {
                        new_entity.set_attribute_value(i, v);
                    }
                });
            }
        };

        for (size_t i = 0; i < header_entities_.size(); ++i) {
            express::entity tmp(header_entities_[i]);
            copy_inst(tmp, express::entity(other.header_entities_[i]));
        }
    }
}
