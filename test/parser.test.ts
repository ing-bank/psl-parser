import { describe, test } from "node:test";
import * as assert from "node:assert/strict";

import * as parser from "../src/parser";
import * as tokenizer from "../src/tokenizer";


function getMethod(methodString: string): parser.Method | undefined {
	const d = parser.parseText(methodString);
	return d.methods[0];
}
function getParsedDoc(documentString: string): parser.ParsedDocument {
	return parser.parseText(documentString);
}

function toValues(tokens: tokenizer.Token[]): string[] {
	return tokens.map(t => t.value);
}

function argsToValues(args: parser.Parameter[]): string[][] {
	return args.map(a => a.types).map(ts => toValues(ts));
}

function argsToNames(args: parser.Parameter[]): string[] {
	return toValues(args.map(a => a.id));
}

describe("Batch label", () => {
	const batchText = `---------- OPEN ------ Section marker

	type public Boolean ER
	type public Number BRCD
	type public String ET, RM

	do SOURCE^BCHSOURC("BOFF", "ACCUPD", .%UserID, .BRCD, .%UserClass)

	// ~p1 source not set up
	if ER set RM = $$^MSG(1184,"BOFF-ACCUPD"), %BatchExit = 1 do EXC quit`;

	const d = getParsedDoc(batchText);
	assert.strictEqual(d.methods.length, 1);
});

describe("Method Identifiers", () => {
	test("inline label statement symbol", () => {
		const methodString = "label do something^SOMETHING";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		assert.strictEqual(result.id.value, "label");
	});
	test("inline label statement keyword", () => {
		const methodString = "label do something()";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		assert.strictEqual(result.id.value, "label");
	});
	test("1 argument", () => {
		const methodString = "public static void main(String args)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const identifierValues = toValues(result.modifiers);
		assert.deepStrictEqual(identifierValues, ["public", "static"]);
	});

	test("2 arguments", () => {
		const methodString = "public static void main(String arg1, String arg2)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const identifierValues = toValues(result.modifiers);
		assert.deepStrictEqual(identifierValues, ["public", "static"]);
	});

	test("Label", () => {
		const methodString = "main";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		assert.strictEqual(result.id.value, "main");
	});

	test("Label from document", () => {
		const methodString = "main\r\n";
		const result = getParsedDoc(methodString);
		if (!result) {
			assert.fail();
			return;
		}
		assert.strictEqual(result.methods[0].id.value, "main");
	});

	test("Label with line comment", () => {
		const methodString = "main // a comment";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		toValues(result.modifiers);
		assert.strictEqual(result.id.value, "main");
	});

	test("Label with parens", () => {
		const methodString = "main()";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		toValues(result.modifiers);
		assert.strictEqual(result.id.value, "main");
	});

	test("Label with 1 argument", () => {
		const methodString = "main(String x1)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		toValues(result.modifiers);
		assert.strictEqual(result.id.value, "main");
	});

	test("Label with 2 arguments", () => {
		const methodString = "main(String x1, String x2)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		toValues(result.modifiers);
		assert.strictEqual(result.id.value, "main");
	});

	test("Label with 2 arguments multiline", () => {
		const methodString = "main(String x1\n\t, String x2)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		toValues(result.modifiers);
		assert.strictEqual(result.id.value, "main");
	});

	test("percent", () => {
		const methodString = "public %main()";
		const method = getMethod(methodString);
		assert.strictEqual(method.id.value, "%main");
	});
});

describe("Argument Names", () => {

	test("1 argument", () => {
		const methodString = "public static void main(String x1)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argNameValues = argsToNames(result.parameters);
		assert.deepStrictEqual(argNameValues, ["x1"]);
	});

	test("2 arguments", () => {
		const methodString = "public static void main(String x1, String x2)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argNameValues = argsToNames(result.parameters);
		assert.deepStrictEqual(argNameValues, ["x1", "x2"]);
	});

	test("1 argument multiline", () => {
		const methodString = "public static void main(\n\tString x1)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argNameValues = argsToNames(result.parameters);
		assert.deepStrictEqual(argNameValues, ["x1"]);
	});

	test("2 argument multiline", () => {
		const methodString = "public static void main(String x1,\n\tString x2)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argNameValues = argsToNames(result.parameters);
		assert.deepStrictEqual(argNameValues, ["x1", "x2"]);
	});

	test("1 argument multi type", () => {
		const methodString = "public static void main(void x1(Integer, Record))";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argNameValues = argsToNames(result.parameters);
		assert.deepStrictEqual(argNameValues, ["x1"]);
	});

	test("2 argument multi type", () => {
		const methodString =
			"public static void main(void x1(Integer, Record), void x2(void, String))";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argNameValues = argsToNames(result.parameters);
		assert.deepStrictEqual(argNameValues, ["x1", "x2"]);
	});

	test("2 argument multiline and multi type", () => {
		const methodString =
			"public static void main(void x1(Integer, Record)\n" +
			"\t, void x2(void, String))";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argNameValues = argsToNames(result.parameters);
		assert.deepStrictEqual(argNameValues, ["x1", "x2"]);
	});

	test("test label with parens 1 arg", () => {
		const methodString = "main(String x1)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argNameValues = argsToNames(result.parameters);
		assert.deepStrictEqual(argNameValues, ["x1"]);
	});

	test("Label no args", () => {
		const methodString = "main";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const args = result.parameters;
		assert.strictEqual(args.length, 0);
	});

	test("Label with parens no args", () => {
		const methodString = "main()";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const args = result.parameters;
		assert.strictEqual(args.length, 0);
	});

	test("Label with multiline parens no args", () => {
		const methodString = "main(\n\t)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const args = result.parameters;
		assert.strictEqual(args.length, 0);
	});
});

describe("Argument Types", () => {
	test("1 argument", () => {
		const methodString = "public static void main(String x1)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argValues = argsToValues(result.parameters);
		assert.deepStrictEqual(argValues, [["String"]]);
	});

	test("1 argument multi type", () => {
		const methodString = "public static void main(String x1(Number))";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argValues = argsToValues(result.parameters);
		assert.deepStrictEqual(argValues, [["String", "Number"]]);
	});

	test("test 2 argument types newline", () => {
		const methodString = "public static void main(String x1 \n\t, Number x2)";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail();
		}
		const argValues = argsToValues(result.parameters);
		assert.deepStrictEqual(argValues, [["String"], ["Number"]]);
	});

	test("test 1 argument 3 types newline", () => {
		const methodString = "public static void main(void x1(Integer, Record))";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail("Did not parse");
		}
		const argValues = argsToValues(result.parameters);
		assert.deepStrictEqual(argValues, [["void", "Integer", "Record"]]);
	});

	test("test 2 argument 3 types newline", () => {
		const methodString =
			"public static void main(void x1(Integer, Record), void x2(void, String))";
		const result = getMethod(methodString);
		if (!result) {
			assert.fail("Did not parse");
		}
		const argValues = argsToValues(result.parameters);
		assert.deepStrictEqual(
			argValues,
			[
				["void", "Integer", "Record"],
				["void", "void", "String"]
			]
		);
	});
});

describe("Propertydefs", () => {
	test("empty propertydef", () => {
		const propertyString = "\t#PROPERTYDEF";
		const doc = getParsedDoc(propertyString);
		assert.strictEqual(doc.properties.length, 0);
	});

	test("one word propertydef", () => {
		const propertyString = "\t#PROPERTYDEF test";
		const doc = getParsedDoc(propertyString);
		assert.strictEqual(doc.properties.length, 1);
	});
});

test("parse document method count", () => {
	const documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
public final Number toNumber()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
public final String toString(String vMask)
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`;

	const doc = getParsedDoc(documentString);
	assert.strictEqual(doc.methods.length, 3);
});

test("parse extends", () => {
	const documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit
`;

	const doc = getParsedDoc(documentString);
	assert.strictEqual(doc.extending.value, "Primitive");
});

test("parse psl package", () => {
	const documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit
`;

	const doc = getParsedDoc(documentString);
	assert.strictEqual(doc.pslPackage, "custom.core");
});

test("parse numerical method", () => {
	const documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */


	// --------------------------------------------------------------------
public final Integer 900()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit
`;

	const doc = getParsedDoc(documentString);
	assert.strictEqual(doc.methods[0].id.value, "900");
});

test("parse document method location", () => {
	const documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
public final Number toNumber()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
public final String toString(String vMask)
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`;

	const doc = getParsedDoc(documentString);
	assert.deepStrictEqual(doc.methods.map(method => method.line), [9, 18, 27]);
});

test("labels in document", () => {
	const documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */



toInteger
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
toNumber
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
toString
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`;

	const doc = getParsedDoc(documentString);
	assert.deepStrictEqual(
		doc.methods.map(method => method.id.value),
		["toInteger", "toNumber", "toString"]
	);
	assert.deepStrictEqual(
		doc.methods.map(method => method.line),
		[9, 18, 27]
	);
});

test("parse methods with propertydef", () => {
	const documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */

	#PROPERTYDEF test class = String node = 1 public


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
public final Number toNumber()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
public final String toString(String vMask)
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`;

	const doc = getParsedDoc(documentString);
	assert.strictEqual(doc.methods.length, 3);
});

test("parse methods with propertydef count", () => {
	const documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */

	#PROPERTYDEF test class = String node = 1 public


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
public final Number toNumber()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
public final String toString(String vMask)
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`;

	const doc = getParsedDoc(documentString);
	assert.strictEqual(doc.properties.length, 1);

});

test("parse methods with propertydef count", () => {
	const documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */

	#PROPERTYDEF test class = String node = 1 public


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
public final Number toNumber()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
public final String toString(String vMask)
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`;

	const doc = getParsedDoc(documentString);
	assert.deepStrictEqual(toValues(doc.properties[0].modifiers), ["public"]);
	assert.strictEqual(doc.properties[0].id.value, "test");

});

describe("type declarations", () => {
	test("basic type declaration", () => {
		const declarationString = "\ttype public literal String x = \"hi there\"";
		const doc = getParsedDoc(declarationString);
		assert.strictEqual(doc.declarations[0].types[0].value, "String");
		assert.strictEqual(doc.declarations[0].id.value, "x");
	});
	test("multiple type declaration", () => {
		const declarationString = "\ttype public literal String x,y";
		const doc = getParsedDoc(declarationString);
		assert.strictEqual(doc.declarations[0].types[0].value, "String");
		assert.strictEqual(doc.declarations[0].id.value, "x");
		assert.strictEqual(doc.declarations[1].types[0].value, "String");
		assert.strictEqual(doc.declarations[1].id.value, "y");
	});
	test("multiple multi type type declaration", () => {
		const declarationString = "\ttype public literal String x(Number,Boolean),y";
		const doc = getParsedDoc(declarationString);
		assert.strictEqual(doc.declarations[0].types[0].value, "String");
		assert.strictEqual(doc.declarations[0].types[1].value, "Number");
		assert.strictEqual(doc.declarations[0].types[2].value, "Boolean");
		assert.strictEqual(doc.declarations[0].id.value, "x");
		assert.strictEqual(doc.declarations[1].types[0].value, "String");
		assert.strictEqual(doc.declarations[1].id.value, "y");
	});
	test("multiple type declaration equal sign", () => {
		const declarationString = "\ttype String x = \"hi\", y = \"hi\"";
		const doc = getParsedDoc(declarationString);
		assert.strictEqual(doc.declarations[0].types[0].value, "String");
		assert.strictEqual(doc.declarations[0].id.value, "x");
		assert.strictEqual(doc.declarations[1].types[0].value, "String");
		assert.strictEqual(doc.declarations[1].id.value, "y");
	});
	test("static type declaration", () => {
		const declarationString = "\ttype static x";
		const doc = getParsedDoc(declarationString);
		assert.strictEqual(doc.declarations[0].types[0].value, "x");
		assert.strictEqual(doc.declarations[0].id.value, "x");
	});
	test("type type declaration", () => {
		const declarationString = "\ttype String type";
		const doc = getParsedDoc(declarationString);
		assert.strictEqual(doc.declarations[0].types[0].value, "String");
		assert.strictEqual(doc.declarations[0].id.value, "type");
	});

	test("method declarations", () => {
		const documentString = `
public static void main()
	type String x
	quit

public static void main2()
	type Number y
	quit
`;
		const doc = getParsedDoc(documentString);
		assert.strictEqual(doc.methods[0].declarations[0].id.value, "x");
		assert.strictEqual(doc.methods[1].declarations[0].id.value, "y");
	});
});
