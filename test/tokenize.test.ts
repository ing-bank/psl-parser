import { test } from "node:test";
import * as assert from "node:assert/strict";

import {getTokens, Type, Token, Position} from "../src/tokenizer";

test("pipe token", () => {
	const tokenizer = getTokens("|");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Pipe, "|", new Position(0, 0))
	);
	assert.strictEqual(tokenizer.next().value, undefined);
});

test("property def", () => {
	const tokenizer = getTokens("#PROPERTYDEF");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.NumberSign, "#", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Alphanumeric, "PROPERTYDEF", new Position(0, 1))
	);
	assert.strictEqual(tokenizer.next().value, undefined);
});

test("property def full", () => {
	const tokenizer = getTokens(
		"\t#PROPERTYDEF dummy\t\t\tclass = String\tpublic position = 2"
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Tab, "\t", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.NumberSign, "#", new Position(0, 1))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Alphanumeric, "PROPERTYDEF", new Position(0, 2))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Space, " ", new Position(0, 13))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Alphanumeric, "dummy", new Position(0, 14))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Tab, "\t", new Position(0, 19))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Tab, "\t", new Position(0, 20))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Tab, "\t", new Position(0, 21))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Alphanumeric, "class", new Position(0, 22))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Space, " ", new Position(0, 27))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.EqualSign, "=", new Position(0, 28))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Space, " ", new Position(0, 29))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Alphanumeric, "String", new Position(0, 30))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Tab, "\t", new Position(0, 36))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Alphanumeric, "public", new Position(0, 37))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Space, " ", new Position(0, 43))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Alphanumeric, "position", new Position(0, 44))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Space, " ", new Position(0, 52))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.EqualSign, "=", new Position(0, 53))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Space, " ", new Position(0, 54))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Numeric, "2", new Position(0, 55))
	);
	assert.strictEqual(tokenizer.next().value, undefined);
});

test("numeric", () => {
	const tokenizer = getTokens("1");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Numeric, "1", new Position(0, 0))
	);
	assert.strictEqual(tokenizer.next().value, undefined);
});

test("whitespace", () => {
	const tabTokenizer = getTokens("\t");
	assert.deepStrictEqual(
		tabTokenizer.next().value,
		new Token(Type.Tab, "\t", new Position(0, 0))
	);
	assert.strictEqual(tabTokenizer.next().value, undefined);

	const spaceTokenizer = getTokens("  ");
	assert.deepStrictEqual(
		spaceTokenizer.next().value,
		new Token(Type.Space, " ", new Position(0, 0))
	);
	assert.deepStrictEqual(
		spaceTokenizer.next().value,
		new Token(Type.Space, " ", new Position(0, 1))
	);
	assert.strictEqual(spaceTokenizer.next().value, undefined);
});

test("line comment", () => {
	let tokenizer = getTokens("//line comment");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.LineCommentInit, "//", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.LineComment, "line comment", new Position(0, 2))
	);
	assert.strictEqual(tokenizer.next().value, undefined);

	tokenizer = getTokens("//line comment\nword");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.LineCommentInit, "//", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.LineComment, "line comment", new Position(0, 2))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.NewLine, "\n", new Position(0, 14))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Alphanumeric, "word", new Position(1, 0))
	);
	assert.strictEqual(tokenizer.next().value, undefined);

	tokenizer = getTokens("///*line comment*/");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.LineCommentInit, "//", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.LineComment, "/*line comment*/", new Position(0, 2))
	);
	assert.strictEqual(tokenizer.next().value, undefined);

	tokenizer = getTokens("//\n");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.LineCommentInit, "//", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.LineComment, "", new Position(0, 2))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.NewLine, "\n", new Position(0, 2))
	);
	assert.strictEqual(tokenizer.next().value, undefined);
});

test("block comment", () => {
	let tokenizer = getTokens("/*a block* / comment*/ alphanumeric");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.BlockCommentInit, "/*", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.BlockComment, "a block* / comment", new Position(0, 2))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.BlockCommentTerm, "*/", new Position(0, 20))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Space, " ", new Position(0, 22))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Alphanumeric, "alphanumeric", new Position(0, 23))
	);
	assert.strictEqual(tokenizer.next().value, undefined);

	tokenizer = getTokens("/**/");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.BlockCommentInit, "/*", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.BlockComment, "", new Position(0, 2))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.BlockCommentTerm, "*/", new Position(0, 2))
	);
	assert.strictEqual(tokenizer.next().value, undefined);
});

test("documentation block comment", () => {
	const tokenizer = getTokens(
		"\t/*DOC -----------------------------------------------------------------\n" +
		"\tdocumentation\n\t** ENDDOC */"
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Tab, "\t", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.BlockCommentInit, "/*", new Position(0, 1))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(
			Type.BlockComment,
			"DOC -----------------------------------------------------------" +
			"------\n\tdocumentation\n\t** ENDDOC ",
			new Position(0, 3)
		)
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.BlockCommentTerm, "*/", new Position(2, 11))
	);
	assert.strictEqual(tokenizer.next().value, undefined);
});

test("string", () => {
	let tokenizer = getTokens("\"this is a string\"");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.DoubleQuotes, "\"", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.String, "this is a string", new Position(0, 1))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.DoubleQuotes, "\"", new Position(0, 17))
	);
	assert.strictEqual(tokenizer.next().value, undefined);

	tokenizer = getTokens("\"string\"alphanumeric\"");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.DoubleQuotes, "\"", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.String, "string", new Position(0, 1))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.DoubleQuotes, "\"", new Position(0, 7))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.Alphanumeric, "alphanumeric", new Position(0, 8))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.DoubleQuotes, "\"", new Position(0, 20))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.String, "", new Position(0, 21))
	);
	assert.strictEqual(tokenizer.next().value, undefined);

	tokenizer = getTokens("\"\"");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.DoubleQuotes, "\"", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.String, "", new Position(0, 1))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.DoubleQuotes, "\"", new Position(0, 1))
	);
	assert.strictEqual(tokenizer.next().value, undefined);

	tokenizer = getTokens("\"eggs\nflour\nmilk\"");
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.DoubleQuotes, "\"", new Position(0, 0))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.String, "eggs\nflour\nmilk", new Position(0, 1))
	);
	assert.deepStrictEqual(
		tokenizer.next().value,
		new Token(Type.DoubleQuotes, "\"", new Position(2, 4))
	);
	assert.strictEqual(tokenizer.next().value, undefined);
});

test("carriage return line feed", () => {
	const tokenizer = getTokens("\r\n");
	const tokens = [];
	for (const token of tokenizer) {
		tokens.push(token);
	}
	assert.strictEqual(tokens.length, 2);
	assert.strictEqual(tokens[0].value, "\r");
});

test("comment newline", () => {
	const tokenizer = getTokens("// this is a psl comment\n");
	const tokens = [];
	for (const token of tokenizer) {
		tokens.push(token);
	}
	assert.strictEqual(tokens[0].type, Type.LineCommentInit);
	assert.strictEqual(tokens[1].type, Type.LineComment);
	assert.strictEqual(tokens[1].value, " this is a psl comment");
	assert.strictEqual(tokens[2].type, Type.NewLine);
});

test("comment with semicolon", () => {
	const tokenizer = getTokens("; this is a mumps comment\n");
	const tokens = [];
	for (const token of tokenizer) {
		tokens.push(token);
	}
	assert.strictEqual(tokens[0].type, Type.LineCommentInit);
	assert.strictEqual(tokens[1].type, Type.LineComment);
	assert.strictEqual(tokens[1].value, " this is a mumps comment");
	assert.strictEqual(tokens[2].type, Type.NewLine);
});
