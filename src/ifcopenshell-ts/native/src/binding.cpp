// This file was generated with the assistance of an AI coding tool.
//
// IfcOpenShell-TS - Phase 0 smoke-test native addon.
//
// Intentionally minimal and disposable: exposes just enough of
// ifcopenshell::file to prove the native-addon build/CI pipeline works
// end-to-end (open a file, read its schema identifier, close it). This is
// NOT the Phase 1 primitive surface - see
// ../../../planning/ifcopenshell-ts/20-roadmap.md and 10-architecture.md §2.

#include <napi.h>

#include <memory>

#include "ifcparse/file.h"
#include "ifcparse/logger.h"

namespace {

class NativeIfcFile : public Napi::ObjectWrap<NativeIfcFile> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(
            env,
            "NativeIfcFile",
            {
                InstanceMethod("schemaIdentifier", &NativeIfcFile::SchemaIdentifier),
                InstanceMethod("close", &NativeIfcFile::Close),
            });

        exports.Set("NativeIfcFile", func);
        return exports;
    }

    explicit NativeIfcFile(const Napi::CallbackInfo& info) : Napi::ObjectWrap<NativeIfcFile>(info) {
        Napi::Env env = info.Env();

        if (info.Length() < 1 || !info[0].IsBuffer()) {
            Napi::TypeError::New(env, "expected a Buffer of IFC-SPF data").ThrowAsJavaScriptException();
            return;
        }

        Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();

        try {
            file_ = std::make_unique<ifcopenshell::file>(
                static_cast<void*>(buffer.Data()), static_cast<int>(buffer.Length()));
        } catch (const std::exception& e) {
            Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
            return;
        }

        if (!file_->good()) {
            file_.reset();
            Napi::Error::New(env, "failed to parse IFC-SPF data").ThrowAsJavaScriptException();
            return;
        }
    }

private:
    std::unique_ptr<ifcopenshell::file> file_;

    Napi::Value SchemaIdentifier(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        if (!file_) {
            Napi::Error::New(env, "file is closed").ThrowAsJavaScriptException();
            return env.Undefined();
        }

        const auto* schema = file_->schema();
        if (!schema) {
            Napi::Error::New(env, "file has no schema").ThrowAsJavaScriptException();
            return env.Undefined();
        }

        return Napi::String::New(env, schema->name());
    }

    Napi::Value Close(const Napi::CallbackInfo& info) {
        file_.reset();
        return info.Env().Undefined();
    }
};

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return NativeIfcFile::Init(env, exports);
}

} // namespace

NODE_API_MODULE(ifcopenshell_native, InitAll)
