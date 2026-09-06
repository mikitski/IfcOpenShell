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

#include "ifc_parse_api.h"

#include <string>

#ifndef IFCPARSE_UTILS_H
#define IFCPARSE_UTILS_H

namespace ifcopenshell {

/// Replaces spaces and potentially other problem causing characters with underscores.
IFC_PARSE_API void sanitate_material_name(std::string& material_name);

IFC_PARSE_API void escape_xml(std::string& text);
IFC_PARSE_API void unescape_xml(std::string& text);

namespace path {

IFC_PARSE_API bool delete_file(const std::string& filename);
IFC_PARSE_API bool rename_file(const std::string& old_filename, const std::string& new_filename);

/// Atomically renames old_filename onto new_filename, replacing an existing
/// destination in a single filesystem operation. Unlike rename_file(), the
/// destination is never unlinked before the rename, so an interruption can
/// never leave the destination missing. This requires both paths to live on
/// the same filesystem. Returns true on success.
IFC_PARSE_API bool atomic_rename_file(const std::string& old_filename, const std::string& new_filename);

#if defined(_MSC_VER) && defined(_UNICODE)

/// Uses windows.h string conversion functions
IFC_PARSE_API std::string to_utf8(const std::wstring& str);

/// Uses windows.h string conversion functions
IFC_PARSE_API std::wstring from_utf8(const std::string& value);
#else
// Deliberately no IFC_PARSE_API on these two: on MSVC, that macro expands to
// __declspec(dllimport) for any translation unit outside ifcparse.dll itself
// (ifc_parse_api.h) -- combined with `inline`, MSVC treats the function as an
// imported external symbol instead of emitting a local inline body, so any
// out-of-DLL caller (e.g. a native addon consuming this header directly, not
// just other ifcparse .cpp files) fails to link with LNK2019/"unresolved
// external symbol", even though the whole point of an inline identity
// function is that it needs no external definition at all. Not an issue on
// non-MSVC (IFC_PARSE_API is just a visibility attribute there, with no
// import/export distinction to conflict with `inline`) or in the #if branch
// above (those two are real, non-inline, DLL-exported functions).
/// Identity operation
inline std::string to_utf8(const std::string& value) { return value; }

/// Identity operation
inline std::string from_utf8(const std::string& value) { return value; }
#endif

} // namespace path

} // namespace ifcopenshell

#endif
