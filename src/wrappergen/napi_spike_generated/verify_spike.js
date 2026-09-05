// This file was generated with the assistance of an AI coding tool.
//
// Manual local verification script for the wrappergen N-API validation spike
// (planning/ifcopenshell-ts/research/06-wrappergen-spike-results.md). Not wired into any
// automated test runner -- there is no CMake/node-gyp/cmake-js build for this spike (see
// the research doc for why, and for the exact manual compile/link commands used to
// produce the `.node` file this script requires).
//
// Usage: node verify_spike.js /path/to/ifcopenshell_napi_spike.node
'use strict';

const path = process.argv[2];
if (!path) {
  console.error('usage: node verify_spike.js /path/to/ifcopenshell_napi_spike.node');
  process.exit(1);
}
const native = require(path);

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
  console.log('OK:', msg);
}

// --- 1. Open a file from an in-memory buffer (the new "buffer-based file open" primitive) ---
const minimalIfc4 = Buffer.from(
  "ISO-10303-21;\n" +
  "HEADER;\n" +
  "FILE_DESCRIPTION((''),'2;1');\n" +
  "FILE_NAME('','',(''),(''),'','','');\n" +
  "FILE_SCHEMA(('IFC4'));\n" +
  "ENDSEC;\n" +
  "DATA;\n" +
  "ENDSEC;\n" +
  "END-ISO-10303-21;\n",
  'utf-8'
);
const fileFromBuffer = native.file_new_with_data_data_size(minimalIfc4, minimalIfc4.length);
assert(fileFromBuffer !== null, 'file opened from an in-memory buffer');

const schemaFromBuffer = native.file_schema(fileFromBuffer);
assert(native.schema_definition_name(schemaFromBuffer) === 'IFC4', 'buffer-opened file has schema IFC4');

// --- 2. Create an entity, and 3. query its declaration ---
const file = native.file_new(); // blank IFC4 file (schema defaults to IFC4), for the rest of the test
const schema = native.file_schema(file);
assert(native.schema_definition_name(schema) === 'IFC4', 'blank file has schema IFC4');

const wallDeclaration = native.schema_definition_declaration_by_name_with_name(schema, 'IfcWall');
assert(wallDeclaration !== null, 'looked up the IfcWall declaration from the schema');
assert(native.declaration_name(wallDeclaration) === 'IfcWall', 'declaration name is IfcWall');

const wall = native.file_create_with_declaration_instance_id(file, wallDeclaration);
assert(wall !== null, 'created an IfcWall entity via file.create(declaration)');

const wallDecl = native.base_declaration(wall);
assert(native.declaration_name(wallDecl) === 'IfcWall', "wall.declaration().name() === 'IfcWall'");

// --- 4. Write/set one attribute (the variant adapter, SET direction) ---
// Attribute 0 on IfcWall (via IfcRoot) is GlobalId (STRING).
native.base_set_attribute_value_variant(wall, 0, {
  kind: native.STRING,
  string_value: '3xhrZ$4XvA0v3iZQ8gGvOa',
});
console.log('OK: set attribute 0 (GlobalId) via the variant adapter');

// --- 5. Read one attribute (the variant adapter, GET direction) ---
const globalId = native.base_get_attribute_value_variant(wall, 0);
assert(globalId === '3xhrZ$4XvA0v3iZQ8gGvOa', 'read back GlobalId as a plain JS string: ' + JSON.stringify(globalId));

// Round-trip a second, different value, to make sure the first result wasn't a fluke.
native.base_set_attribute_value_variant(wall, 0, {
  kind: native.STRING,
  string_value: '0FieluTLnDW8lIXQNz2mYZ',
});
const globalId2 = native.base_get_attribute_value_variant(wall, 0);
assert(globalId2 === '0FieluTLnDW8lIXQNz2mYZ', 'GlobalId round-trips a second, different value');

// Unsetting (kind NULL) matches Python's `None` -> unset_attribute_value short-circuit.
native.base_set_attribute_value_variant(wall, 0, { kind: native.NULL });
const unsetValue = native.base_get_attribute_value_variant(wall, 0);
assert(unsetValue === null, 'unsetting an attribute (kind NULL) reads back as null');

console.log('\nALL SPIKE EXIT-CRITERIA CHECKS PASSED');
