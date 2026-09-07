/********************************************************************************
 *                                                                              *
 * This file is part of IfcOpenShell.                                           *
 *                                                                              *
 * IfcOpenShell is free software: you can redistribute it and/or modify         *
 * it under the terms of the Lesser GNU General Public License as published by  *
 * the Free Software Foundation, either version 3.0 of the License, or          *
 * (at your option) any later version.                                          *
 *                                                                              *
 * IfcOpenShell is distributed in the hope that it will be useful,              *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of               *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
 * Lesser GNU General Public License for more details.                          *
 *                                                                              *
 * You should have received a copy of the Lesser GNU General Public License     *
 * along with this program. If not, see <http://www.gnu.org/licenses/>.         *
 *                                                                              *
 ********************************************************************************/

#ifndef IFCSPFHEADER_H
#define IFCSPFHEADER_H

#include "ifc_parse_api.h"
#include "instance_data.h"
#include "schemas/Header_section_schema.h"
#include <functional>

namespace ifcopenshell {

class file;

class IFC_PARSE_API spf_header {
  private:
    ifcopenshell::file* file_;
    std::reference_wrapper<ifcopenshell::logger> logger_;

    std::array<shared_pointer_type, 3> header_entities_;

  public:
    explicit spf_header(ifcopenshell::file* file = nullptr, ifcopenshell::logger* logger = nullptr);
    // Rule-of-five: header_entities_ holds 3 heap-owned instance_data* (see
    // spf_header.cpp's own comments) that ~spf_header() now actually frees (a real
    // LeakSanitizer-caught leak fix) - copy/move must be defined explicitly instead of
    // relying on the (now dangerous) implicitly-generated ones. Copy performs a real
    // deep clone via assign() (each copy gets its own independent header entities, so
    // e.g. `file::header()`'s caller-owned snapshot never aliases the file's own
    // persistent header_ member); move transfers ownership of the 3 pointers and nulls
    // the source so its destructor becomes a no-op.
    spf_header(const spf_header& other);
    spf_header& operator=(const spf_header& other);
    spf_header(spf_header&& other) noexcept;
    spf_header& operator=(spf_header&& other) noexcept;
    ~spf_header();

    void write(std::ostream& stream) const;

    ifcopenshell::file* owner_file() { return file_; }
    void owner_file(ifcopenshell::file* file);
    ifcopenshell::logger& logger() const { return logger_.get(); }

    void set_file_description(const shared_pointer_type& description_data);
    void set_file_name(const shared_pointer_type& name_data);
    void set_file_schema(const shared_pointer_type& schema_data);

    Header_section_schema::file_description file_description();
    Header_section_schema::file_name file_name();
    Header_section_schema::file_schema file_schema();

    const Header_section_schema::file_description file_description() const;
    const Header_section_schema::file_name file_name() const;
    const Header_section_schema::file_schema file_schema() const;

    void assign(const spf_header& other);
};

} // namespace ifcopenshell

#endif
