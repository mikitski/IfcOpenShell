// This file was generated with the assistance of an AI coding tool.
//
// Pure compile-time fixture -- no runtime assertions, nothing here is ever executed.
// This is this chunk's own stated exit criterion, quoted verbatim from
// `planning/ifcopenshell-ts/10-architecture.md` SS6: "generated types compile cleanly
// against a hand-written test asserting `wall.Name` type-checks as `string | null`
// for a known `IfcWall` instance, across all three schema versions." Verified by
// `tsc --noEmit -p tsconfig.typecheck.json` against this exact file -- wired into the
// normal `npm test` run by `test/generatedTypes.test.ts`, which shells out to that
// command -- so this actually exercises the type checker (a `// @ts-expect-error`
// that stops being an error, e.g. because the generated types regressed to `any`,
// itself fails `tsc` with an "unused '@ts-expect-error' directive" error), not a
// runtime assertion that merely happens to also compile.

import type { EntityInstance } from "../src/entityInstance";
import type * as IFC2X3 from "../src/generated/ifc2x3";
import type * as IFC4 from "../src/generated/ifc4";
import type * as IFC4X3 from "../src/generated/ifc4x3";

function assertType<T>(_value: T): void {}

declare const wallIfc2x3: EntityInstance & IFC2X3.IfcWall;
declare const wallIfc4: EntityInstance & IFC4.IfcWall;
declare const wallIfc4x3: EntityInstance & IFC4X3.IfcWall;

// The exit criterion, verbatim, across all three schema versions.
assertType<string | null>(wallIfc2x3.Name);
assertType<string | null>(wallIfc4.Name);
assertType<string | null>(wallIfc4x3.Name);

// @ts-expect-error Name is `string | null`, not `number` -- must fail to compile; if
// generated types ever regressed (e.g. to `any`), this line would stop erroring and
// `tsc` would instead fail on the now-unused `@ts-expect-error` directive itself.
assertType<number>(wallIfc4.Name);

// The `.as<T>()` typed-accessor helper (10-architecture.md SS6's "typed accessor
// helper") produces the same intersection type from a plain, untyped `EntityInstance`.
declare const rawWall: EntityInstance;
assertType<string | null>(rawWall.as<IFC4.IfcWall>().Name);

// A round-trip write also type-checks -- this chunk's own deliberate deviation from
// the design doc's illustrative `readonly` example (see `generate-dts.ts`'s header
// comment for the justification): the whole point of the Proxy is that
// `wall.Name = "x"` works, both at runtime and, with the generated types, at
// compile time too.
wallIfc4.Name = "New Name";
// @ts-expect-error assigning the wrong type to a writable field must fail to compile.
wallIfc4.Name = 5;

// A known ENUMERATION-typed attribute resolves to its own named alias, not a bare
// `string` (even though the alias itself is `string`-shaped -- see this project's
// disclosed enum-member-literal gap, `generate-dts.ts`'s header comment).
assertType<IFC4.IfcWallTypeEnum | null>(wallIfc4.PredefinedType);

// A known ENTITY_INSTANCE-typed attribute resolves to the referenced class's own
// generated interface, intersected with `EntityInstance` at the value site.
declare const ownerHistory: EntityInstance & IFC4.IfcOwnerHistory;
wallIfc4.OwnerHistory = ownerHistory;
