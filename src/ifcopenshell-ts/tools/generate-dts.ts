// This file was generated with the assistance of an AI coding tool.
//
// Schema-driven `.d.ts` generator -- `planning/ifcopenshell-ts/10-architecture.md` SS6's
// "Type half": one TS interface per IFC entity class per schema version, giving the
// attribute `Proxy` (`entityInstance.ts`) its type-safety half. Run via
// `npm run generate:dts` (`vite-node tools/generate-dts.ts` -- see package.json;
// `vite-node` runs a `.ts` file directly against this package's own compiled native
// addon without a separate `tsc` build step, reusing vitest's own toolchain rather
// than adding a new one). Output is checked into git under `src/generated/`, one file
// per schema version (`ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`) -- matching
// `src/wrappergen/generated_napi/`'s own precedent (generated, but checked in and
// reviewed like hand-written code, not generated at every consumer's build time) --
// regenerate and re-commit after a native primitive or schema build change that could
// affect the output.
//
// Node-based, not `wrappergen`-adjacent Python/clang, despite `10-architecture.md`
// SS6's own suggestion ("most likely as another `wrappergen`-adjacent emitter") --
// investigated, not assumed. `wrappergen` walks C++ *header* ASTs (clang) to generate
// the N-API primitive layer; this generator's actual input is IFC *schema* data
// (entity/attribute/type declarations), which is runtime-queryable data behind the
// exact primitives this package's own native addon already exposes
// (`declaration`/`entity`/`attribute`/`type_declaration`/`schema_definition`, ...) --
// there is no C++ header to parse for this, so a clang-based tool would gain nothing
// and would need its own from-scratch schema-data-extraction logic anyway. A small
// Node script driving the already-built addon through this package's own `IfcFile`/
// schema-introspection classes is simpler, more correct (exercises the exact same
// runtime surface `EntityInstance`/the Proxy consume, so a primitive-layer bug would
// affect both identically, not just the generator), and needs no new tooling
// dependency.
//
// How attribute types are resolved (two primitives combined, no new native surface):
// 1. `entity_instance.attribute_type(index): string` -- already exposed, returns one
//    of a fixed ~20-value taxonomy (`src/ifcparse/utils.cpp`'s
//    `argument_type_string[]`, confirmed by reading the C++ source directly: "NULL" /
//    "DERIVED" / "INT" / "BOOL" / "LOGICAL" / "DOUBLE" / "STRING" / "BINARY" /
//    "ENUMERATION" / "ENTITY INSTANCE" / "EMPTY AGGREGATE" / "AGGREGATE OF *" up to 2
//    levels deep / "UNKNOWN") -- resolved purely from the attribute's *declared*
//    type, not any instance's actual value (verified by reading
//    `attribute_value_shim.cpp`'s `get_attribute_type_name`/`ifcopenshell::
//    from_parameter_type`, `src/ifcparse/utils.cpp`), so calling it on *any* instance
//    of the right declared type is correct regardless of that instance's actual data
//    -- see `schemaIntrospection.ts`'s header comment for how this lets abstract
//    classes (which can never be instantiated directly) still get real answers, via a
//    concrete descendant standing in as the "sample instance."
// 2. For the two taxonomy values that need more than a JS primitive mapping --
//    "ENUMERATION" (needs the enum's own name) and "ENTITY INSTANCE"/"AGGREGATE OF
//    ENTITY INSTANCE"/"AGGREGATE OF AGGREGATE OF ENTITY INSTANCE" (needs the
//    referenced class's, or select union's, name) -- `resolveDeclarationName` walks
//    the attribute's own `type_of_attribute(): parameter_type` schema-declaration
//    chain (`named_type`/`aggregation_type`/`declaration.as_entity()`/
//    `.as_select_type()`/`.as_enumeration_type()`/`.as_type_declaration()`), all
//    already-exposed primitives, no gap here.
//
// Two disclosed, narrow scope cuts (both produce `unknown`/`string` fallbacks with an
// explanatory comment at the call site, never silently wrong output):
// - A SELECT type's constituent members that are themselves simple/defined types
//   (e.g. `IfcValue`'s `IfcSimpleValue` branch, ultimately a raw EXPRESS STRING/
//   NUMBER/etc., not another entity/select/enum) resolve to `unknown`, not their real
//   JS-primitive shape. The `attribute_type(index)` shortcut in (1) above can't help
//   here -- it only resolves the *top-level* attribute's own kind, and a SELECT-typed
//   attribute is *always* reported as `"ENTITY INSTANCE"` regardless of what its
//   members actually are (confirmed by reading `from_parameter_type` itself: every
//   `select_type` branch unconditionally returns `Argument_ENTITY_INSTANCE`) --
//   walking to the *constituent* member's own type needs `simple_type.declared_type()`
//   (the C++ enum: binary/boolean/integer/logical/number/real/string), which C++
//   exposes (`src/ifcparse/schema.h`) but wrappergen never generated a binding for
//   (confirmed: no `simple_type_declared_type` function anywhere in
//   `src/wrappergen/generated_napi/`). A genuine primitive gap, flagged in this
//   chunk's PR rather than assumed a new primitive should be added to close it.
// - Enumeration member *literals* (the TS string-literal union
//   `10-architecture.md`'s illustrative `IfcWallTypeEnum | null` example implies) are
//   not emitted -- `enumeration_type` has no exposed accessor for its member list
//   (`lookup_enum_offset(name)` is a name -> index lookup, useless without already
//   knowing candidate names; the C++ `enumeration_items()`/`lookup_enum_value(index)`
//   accessors that would enumerate them exist but aren't bound). Each enum type gets
//   a real, named `export type IfcWallTypeEnum = string;` alias instead (preserving
//   the semantic name in generated interfaces, matching the illustrative shape) rather
//   than inlining a bare `string` everywhere -- also a genuine, flagged primitive gap,
//   not a design choice. Neither of these two gaps affects this chunk's own required
//   exit-criterion test (`test/generatedTypes.test.ts`'s `wall.Name` check: `Name` is
//   a plain STRING attribute, unaffected by either).
//
// A third, related, already-confirmed gap (not new to this chunk, see
// `schemaIntrospection.ts`'s header comment): `entity.supertype()` carries no
// recoverable name via the current primitive surface, so a TS `extends` chain
// (`10-architecture.md`'s illustrative `IfcWall extends IfcBuildingElement`) cannot be
// built from it. This generator emits flat, fully self-contained interfaces instead
// (every inherited attribute inlined directly, via `entity.all_attributes()`, which
// already returns the complete own+inherited list) -- a deliberate, disclosed design
// choice given that gap, not an oversight; see that file's header comment for the full
// reasoning. This also sidesteps forward-reference ordering entirely (nothing to get
// wrong) and produces MORE self-contained output for a reader (every field visible on
// one interface, no chasing an `extends` chain) at the cost of some duplication across
// closely-related classes -- an acceptable tradeoff for generated code.
//
// Attribute mutability: interfaces below declare fields WITHOUT `readonly` (deviating
// from `10-architecture.md`'s own illustrative `readonly PredefinedType: ...` example)
// -- a deliberate judgment call, not an oversight. `readonly` would make
// `typedWall.Name = "x"` a *compile* error even though the underlying `Proxy`'s `set`
// trap fully supports it at runtime (this chunk's whole point, per that same
// section's own rationale paragraph: "loses the `wall.Name = "x"` ergonomics that are
// the whole point of the 'translate exactly' mandate"). Writable fields let the type
// checker also catch a wrong-typed *assignment* (`wall.Name = 5`), a real benefit
// `readonly` would forgo. Flagged in this chunk's PR description as a deviation from
// the illustrative (explicitly "not fixed") snippet.

import * as fs from "node:fs";
import * as path from "node:path";
import { AttributeCategory } from "../src/attributeCache";
import type { EntityInstance } from "../src/entityInstance";
import type { IfcFile } from "../src/file";
import {
	type attribute as NativeAttribute,
	type declaration as NativeDeclaration,
	type entity_instance as NativeEntityInstance,
	entity_instance as NativeEntityInstanceCtor,
	type parameter_type as NativeParameterType,
} from "../src/native/ifcopenshell_native";
import * as template from "../src/template";
import { type EntityCatalogEntry, buildEntityCatalog, buildRepresentatives } from "./schemaIntrospection";

interface SchemaTarget {
	/** Filename stem under `src/generated/` and the doc-comment label used in the header. */
	readonly label: string;
	/** The identifier `template.create({ schemaIdentifier })` needs -- matches `test/bootstrap.ts`'s own mapping (IFC4X3 registers as "IFC4X3_ADD2" in this repo's current build). */
	readonly schemaIdentifier: string;
}

const SCHEMA_TARGETS: readonly SchemaTarget[] = [
	{ label: "ifc2x3", schemaIdentifier: "IFC2X3" },
	{ label: "ifc4", schemaIdentifier: "IFC4" },
	{ label: "ifc4x3", schemaIdentifier: "IFC4X3_ADD2" },
];

function findInnermostNamedDeclaration(parameterType: NativeParameterType): NativeDeclaration | null {
	const named = parameterType.as_named_type();
	if (named !== null) return named.declared_type();
	const aggregation = parameterType.as_aggregation_type();
	if (aggregation !== null) return findInnermostNamedDeclaration(aggregation.type_of_element());
	return null; // a bare simple_type with no named_type wrapper -- see this file's header comment.
}

/**
 * Resolves a schema `declaration` to a TS type-name string: the referenced entity
 * class's own generated interface name, a real, named alias for an enumeration type
 * (registers it into `enumNames` so the caller emits `export type <name> = string;`
 * once), a parenthesized union of a SELECT type's constituent members (recursively
 * resolved, deduplicated), or `unknown` for a defined/simple-type constituent this
 * generator can't resolve further (see this file's header comment's first scope cut).
 */
function resolveDeclarationName(declaration: NativeDeclaration, enumNames: Set<string>): string {
	if (declaration.as_entity() !== null) {
		return declaration.name();
	}
	if (declaration.as_enumeration_type() !== null) {
		enumNames.add(declaration.name());
		return declaration.name();
	}
	const select = declaration.as_select_type();
	if (select !== null) {
		const members = Array.from(
			new Set(select.select_list().map((member) => resolveDeclarationName(member, enumNames))),
		);
		return members.length === 1 ? members[0] : `(${members.join(" | ")})`;
	}
	const typeDeclaration = declaration.as_type_declaration();
	if (typeDeclaration !== null) {
		const inner = findInnermostNamedDeclaration(typeDeclaration.declared_type());
		return inner === null ? "unknown" : resolveDeclarationName(inner, enumNames);
	}
	return "unknown";
}

/**
 * Maps `attribute_type(index)`'s fixed taxonomy string (see this file's header
 * comment) to a TS type. `attribute`/`enumNames` are only consulted for the two kinds
 * that need more than a fixed JS-primitive mapping (ENUMERATION, and any ENTITY
 * INSTANCE shape).
 */
function mapAttributeType(kind: string, attribute: NativeAttribute, enumNames: Set<string>): string {
	const entityElement = (): string => {
		const inner = findInnermostNamedDeclaration(attribute.type_of_attribute());
		return inner === null ? "unknown" : resolveDeclarationName(inner, enumNames);
	};
	switch (kind) {
		case "INT":
		case "DOUBLE":
			return "number";
		case "BOOL":
			return "boolean";
		case "LOGICAL":
			// EXPRESS LOGICAL is tri-state (TRUE/FALSE/UNKNOWN); UNKNOWN round-trips as
			// `null` through `entityInstance.ts`'s `valueToVariant`/`wrapValue`.
			return "boolean | null";
		case "STRING":
		case "BINARY":
			return "string";
		case "ENUMERATION":
			return entityElement();
		case "ENTITY INSTANCE":
			return entityElement();
		case "EMPTY AGGREGATE":
			return "unknown[]";
		case "AGGREGATE OF INT":
		case "AGGREGATE OF DOUBLE":
			return "number[]";
		case "AGGREGATE OF STRING":
		case "AGGREGATE OF BINARY":
			return "string[]";
		case "AGGREGATE OF ENTITY INSTANCE":
			return `${entityElement()}[]`;
		case "AGGREGATE OF EMPTY AGGREGATE":
			return "unknown[][]";
		case "AGGREGATE OF AGGREGATE OF INT":
		case "AGGREGATE OF AGGREGATE OF DOUBLE":
			return "number[][]";
		case "AGGREGATE OF AGGREGATE OF ENTITY INSTANCE":
			return `${entityElement()}[][]`;
		// "NULL" / "DERIVED" / "UNKNOWN": DERIVED-category attributes are excluded
		// before this function is ever called (see `emitInterface` below); NULL/UNKNOWN
		// are not expected to occur for a real forward attribute in a compiled-in
		// schema, but degrade to `unknown` rather than throwing if one ever does.
		default:
			return "unknown";
	}
}

function emitInterface(entry: EntityCatalogEntry, representative: EntityInstance, enumNames: Set<string>): string {
	const nativeRepresentative: NativeEntityInstance = new NativeEntityInstanceCtor(representative._handle);
	const attributes = entry.entity.all_attributes();
	const fields: string[] = [];
	for (let index = 0; index < attributes.length; index++) {
		const attribute = attributes[index];
		const name = attribute.name();
		// Excludes EXPRESS *derived* attribute slots, matching attributeCache.ts's own
		// exclusion (both work around the same disclosed gap: `entity.derived()` isn't
		// exposed, so this asks the representative instance directly instead).
		if (nativeRepresentative.get_attribute_category(name) !== AttributeCategory.FORWARD) continue;
		const kind = nativeRepresentative.attribute_type(index);
		const tsType = mapAttributeType(kind, attribute, enumNames);
		const nullable = attribute.optional() ? " | null" : "";
		fields.push(`\t${name}: ${tsType}${nullable};`);
	}
	const body = fields.length ? `\n${fields.join("\n")}\n` : "";
	return `export interface ${entry.name} {${body}}`;
}

function generateSchemaModule(
	file: IfcFile,
	target: SchemaTarget,
): { content: string; entityCount: number; skipped: readonly string[] } {
	const catalog = buildEntityCatalog(file);
	const { representatives, unresolved } = buildRepresentatives(file, catalog);
	const enumNames = new Set<string>();
	const interfaceBlocks: string[] = [];
	for (const entry of catalog.entries) {
		const representative = representatives.get(entry.name);
		if (!representative) continue; // in `unresolved`, reported by the caller.
		interfaceBlocks.push(emitInterface(entry, representative, enumNames));
	}
	const enumAliases = Array.from(enumNames)
		.sort()
		.map((name) => `export type ${name} = string;`);

	const header = `// This file was generated with the assistance of an AI coding tool.
//
// AUTO-GENERATED by \`npm run generate:dts\` (\`tools/generate-dts.ts\`) against the
// ${target.schemaIdentifier} schema -- do not hand-edit, regenerate instead.
// One flat, self-contained interface per entity class (own + inherited attributes
// inlined; no \`extends\` chain -- see \`tools/generate-dts.ts\`'s header comment for
// why). Enumeration-typed attributes reference a real, named \`string\` alias below
// (member literals are not derivable from the current native primitive surface, see
// that same header comment).
`;

	const content = `${header}\n${enumAliases.join("\n")}\n\n${interfaceBlocks.join("\n\n")}\n`;
	return { content, entityCount: interfaceBlocks.length, skipped: unresolved };
}

function main(): void {
	const outDir = path.join(__dirname, "..", "src", "generated");
	fs.mkdirSync(outDir, { recursive: true });

	let totalEntities = 0;
	for (const target of SCHEMA_TARGETS) {
		let file: IfcFile;
		try {
			file = template.create({ schemaIdentifier: target.schemaIdentifier });
			// Matches `test/bootstrap.ts`'s own `isSchemaAvailable` check: surfaces "no
			// schema loaded" for a schema this build doesn't have compiled in, rather
			// than silently generating an empty/wrong file for it.
			void file.schema;
		} catch {
			console.warn(
				`generate-dts: schema '${target.schemaIdentifier}' is not available in this build -- skipping ${target.label}.d.ts`,
			);
			continue;
		}

		const { content, entityCount, skipped } = generateSchemaModule(file, target);
		const outFile = path.join(outDir, `${target.label}.d.ts`);
		fs.writeFileSync(outFile, content);
		totalEntities += entityCount;
		console.log(`generate-dts: wrote ${outFile} (${entityCount} entity interfaces)`);
		if (skipped.length) {
			console.warn(
				`generate-dts: ${target.label}: ${skipped.length} class(es) with no reachable concrete representative, skipped: ${skipped.join(", ")}`,
			);
		}
		file.dispose();
	}
	console.log(
		`generate-dts: done, ${totalEntities} entity interfaces total across ${SCHEMA_TARGETS.length} schema targets.`,
	);
}

main();
