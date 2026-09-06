// This file was generated with the assistance of an AI coding tool.

#include "file_shim.h"

#include "utils.h"

#include <fstream>
#include <random>
#include <stdexcept>

namespace ifcopenshell {
namespace wrappergen {

void write_file(const ifcopenshell::file& file_obj, const std::string& path) {
    // Same technique as src/ifcwrap/IfcParseWrapper.i's helper_fn_atomic_write
    // (issue #4797): write to a temp file next to the destination, then atomically
    // rename it into place, so a process interrupted mid-write can never leave the
    // destination truncated or with dangling STEP references -- at most a stray temp
    // file remains. Keeping the temp file in the same directory keeps the rename on a
    // single filesystem, which is what makes it atomic. `ifcopenshell::path::*` (not
    // std::rename/std::remove) is used throughout for correct UTF-8/Windows path
    // handling, matching the SWIG binding's own choice here.
    std::random_device random_device;
    const std::string temp_path = path + "." + std::to_string(random_device()) + ".tmp";
    {
        std::ofstream stream(ifcopenshell::path::from_utf8(temp_path).c_str());
        if (!stream.good()) {
            throw std::runtime_error("Failed to write to path: '" + path + "', check folder and file permissions.");
        }
        stream << file_obj;
        stream.flush();
        if (!stream.good()) {
            stream.close();
            ifcopenshell::path::delete_file(temp_path);
            throw std::runtime_error("Failed to write to path: '" + path + "', the file may be incomplete.");
        }
        // The ofstream destructor at the end of this scope closes the stream. On
        // Windows the file must be closed before it can be renamed.
    }
    if (!ifcopenshell::path::atomic_rename_file(temp_path, path)) {
        ifcopenshell::path::delete_file(temp_path);
        throw std::runtime_error("Failed to write to path: '" + path + "', could not replace the existing file.");
    }
}

} // namespace wrappergen
} // namespace ifcopenshell
