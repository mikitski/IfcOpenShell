// This file was generated with the assistance of an AI coding tool.
//
// Wires `test/generatedTypes.typecheck.ts` (a pure compile-time fixture -- see its own
// header comment) into the normal `npm test` run, so a regression in the generated
// `.d.ts` output (`src/generated/*.d.ts`, produced by `tools/generate-dts.ts`) is
// caught by CI like any other test failure, not only by someone remembering to run
// `tsc --noEmit -p tsconfig.typecheck.json` by hand. This is this chunk's own stated
// exit criterion (`10-architecture.md` SS6): "generated types compile cleanly against
// a hand-written test asserting `wall.Name` type-checks as `string | null` for a
// known `IfcWall` instance, across all three schema versions."
//
// Deliberately shells out to the real `tsc` binary rather than using vitest's own
// `expectTypeOf`/typecheck mode: this project's `vitest.config.ts` doesn't currently
// enable vitest's separate `--typecheck` test-collection pass (a config change with
// its own tradeoffs, out of scope to introduce here for one fixture), and a plain
// child-process `tsc --noEmit` is simpler, needs no new test-runner configuration, and
// is exactly the verification method `10-architecture.md`'s own exit-criterion text
// names ("tsc --noEmit/vitest's own type-checking").

import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { describe, expect, test } from "vitest";

describe("Generated .d.ts type-checking (10-architecture.md SS6 exit criterion)", () => {
	test("wall.Name type-checks as string | null across all three schema versions (tsc --noEmit)", () => {
		const packageRoot = path.join(__dirname, "..");
		let failureOutput: string | undefined;
		try {
			execFileSync("npx", ["tsc", "--noEmit", "-p", "tsconfig.typecheck.json"], {
				cwd: packageRoot,
				stdio: ["ignore", "pipe", "pipe"],
				encoding: "utf-8",
			});
		} catch (e) {
			const err = e as { stdout?: string; stderr?: string; message?: string };
			failureOutput = `${err.stdout ?? ""}${err.stderr ?? ""}` || err.message || String(e);
		}
		expect(failureOutput, `tsc --noEmit -p tsconfig.typecheck.json reported errors:\n${failureOutput}`).toBeUndefined();
	}, 30000);
});
