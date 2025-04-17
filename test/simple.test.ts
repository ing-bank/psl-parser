import { test } from "node:test";
import * as assert from "node:assert";

import * as fsExtra from "fs-extra";

test(async () => {
	console.log(fsExtra);
	const fileContents = await fsExtra.readFile(
		"/Users/mreitsma/repos/psl-parser/test/files/ZChild.PROC"
	);

	assert.notStrictEqual(fileContents.length, 0);
});
