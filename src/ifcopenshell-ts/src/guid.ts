// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/guid.py` (src/ifcopenshell-python) --
// planning/ifcopenshell-ts/research/01-python-core-and-lowlevel.md SS2.4: "100% pure,
// portable string/byte logic". Reads and writes encoded GlobalIds: IFC entities may be
// identified using a unique ID (a UUID/GUID), a 128-bit label usually represented as
// `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`, but stored in IFC as a 22-character base64
// encoded string using a non-standard alphabet
// (https://technical.buildingsmart.org/resources/ifcimplementationguidance/ifc-guid).

// standard base64 convention: A-Z a-z 0-9 + /
const CHARS64_STD = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
// ifc convention: 0-9 A-Z a-z _ $
const CHARS64_IFC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";

function translate(value: string, from: string, to: string): string {
	let result = "";
	for (const char of value) {
		const index = from.indexOf(char);
		result += index === -1 ? char : to[index];
	}
	return result;
}

/**
 * Converts a hex-encoded UUID to a base64-encoded GUID in IFC-format.
 *
 * See https://technical.buildingsmart.org/resources/ifcimplementationguidance/ifc-guid
 */
export function compress(uuid: string): string {
	// remove possible separators
	const stripped = uuid.toLowerCase().replace(/\W/g, "");

	// pad with hex "zeroes"
	const padded = `0000${stripped}`;

	// convert to standard base 64
	const uuidBytes = Buffer.from(padded, "hex");
	let guid = uuidBytes.toString("base64");

	// remove result of padding
	guid = guid.slice(2);

	// translate from standard-convention to ifc-convention
	return translate(guid, CHARS64_STD, CHARS64_IFC);
}

/**
 * Converts a base64-encoded GUID in IFC-format to a hex-encoded UUID.
 *
 * See https://technical.buildingsmart.org/resources/ifcimplementationguidance/ifc-guid
 */
export function expand(guid: string): string {
	// translate from ifc-convention to standard-convention
	let translated = translate(guid, CHARS64_IFC, CHARS64_STD);

	// pad with base64 "zeroes"
	translated = `AA${translated}`;

	// convert to hex
	let uuid = Buffer.from(translated, "base64").toString("hex");

	// remove result of padding
	uuid = uuid.slice(4);

	return uuid;
}

/**
 * Formats a UUID as `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.
 */
export function split(uuid: string): string {
	return [uuid.slice(0, 8), uuid.slice(8, 12), uuid.slice(12, 16), uuid.slice(16, 20), uuid.slice(20)].join("-");
}

function generate(): string {
	const uuid = crypto.randomUUID().replace(/-/g, "");
	return compress(uuid);
}

// `new` is a reserved word and can't be a `function` declaration's name, unlike
// Python's `guid.new()` -- exported under its real name via an export-alias instead,
// so callers still write `guid.new()` matching the Python API exactly
// (`export { name as new }`'s target may be any IdentifierName, reserved words
// included -- this is the module's actual public name, not a workaround renaming it).
export { generate as new };
