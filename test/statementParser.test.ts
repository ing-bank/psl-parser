import { describe, test } from "node:test";
import * as assert from "node:assert/strict";

import {
	BinaryOperator, DeclarationStatement, Identifier, MultiSet, NumericLiteral,
	PostCondition, StatementParser, StringLiteral, SyntaxKind, Value,
} from "../src";
import { getTokens } from "../src/tokenizer";

function parse(text: string) {
	return new StatementParser(getTokens(text));
}

describe("recursive tests", () => {
	test("parse value", () => {
		const parser = parse("alex");
		const value = parser.parseValue() as Identifier;
		assert.strictEqual(value.id.value, "alex");
		assert.strictEqual(value.args, undefined);
		assert.strictEqual(value.openParen, undefined);
		assert.strictEqual(value.closeParen, undefined);
	});
	test("parse string value", () => {
		const parser = parse("\"alex\"");
		const value = parser.parseValue() as StringLiteral;
		assert.strictEqual(value.id.value, "alex");
	});
	test("parse number value", () => {
		const parser = parse("42");
		const value = parser.parseValue() as NumericLiteral;
		assert.strictEqual(value.id.value, "42");
	});
	test("parse complex value", () => {
		const parser = parse("(a.b()_c)");
		const value = parser.parseValue() as BinaryOperator;
		assert.strictEqual(value.operator[0].value, "_");
	});
	test("parse value with 0 args", () => {
		const parser = parse("alex()");
		const alex = parser.parseValue() as Identifier;
		const args = alex.args as Value[];
		assert.strictEqual(alex.id.value, "alex");
		assert.strictEqual(args.length, 0);
		assert.notStrictEqual(alex.openParen, undefined);
		assert.notStrictEqual(alex.closeParen, undefined);
	});
	test("parse value with 1 arg", () => {
		const parser = parse("alex(ioana)");
		const alex = parser.parseValue() as Identifier;
		const args = alex.args as Value[];
		assert.strictEqual(alex.id.value, "alex");
		assert.strictEqual(args[0].id.value, "ioana");
	});
	test("parse value with 1 arg as expression", () => {
		const parser = parse("alex(ioana)");
		const alex = parser.parseExpression() as Identifier;
		const args = alex.args as Value[];
		assert.strictEqual(alex.id.value, "alex");
		assert.strictEqual(args[0].id.value, "ioana");
	});
	test("parse value with 2 args", () => {
		const parser = parse("alex(ioana,chris)");
		const alex = parser.parseExpression() as Identifier;
		const args = alex.args as Identifier[];
		assert.strictEqual(alex.id.value, "alex");
		assert.strictEqual(args[0].id.value, "ioana");
		assert.strictEqual(args[1].id.value, "chris");
	});
	test("parse args", () => {
		const parser = parse("  a,  b  ");
		const args = parser.parseArgs() as Value[];
		assert.strictEqual(args[0].id.value, "a");
		assert.strictEqual(args[1].id.value, "b");
	});
	test("parse arg", () => {
		const parser = parse("a");
		const args = parser.parseArgs() as Value[];
		assert.strictEqual(args[0].id.value, "a");
	});
	test("parse value with 2 args with spaces", () => {
		const parser = parse("alex( ioana , chris)");
		const alex = parser.parseValue() as Identifier;
		const args = alex.args as Value[];
		assert.strictEqual(alex.id.value, "alex");
		assert.strictEqual(args[0].id.value, "ioana");
		assert.strictEqual(args[1].id.value, "chris");
	});
	test("child", () => {
		const parser = parse("a + b");
		const plus = parser.parseExpression() as BinaryOperator;
		const a = plus.left as Identifier;
		const b = plus.right as Identifier;
		assert.strictEqual(plus.operator[0].value, "+");
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(b.id.value, "b");
	});
	test("double token operator", () => {
		const parser = parse("a <= b");
		const plus = parser.parseExpression() as BinaryOperator;
		const a = plus.left as Identifier;
		const b = plus.right as Identifier;
		assert.strictEqual(plus.operator[0].value, "<");
		assert.strictEqual(plus.operator[1].value, "=");
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(b.id.value, "b");
	});
	test("dot operator precedence", () => {
		const parser = parse("a.b < x.y");
		const lessThan = parser.parseExpression() as BinaryOperator;
		const aDot = lessThan.left as BinaryOperator;
		const a = aDot.left as Identifier;
		const b = aDot.right as Identifier;
		const xDot = lessThan.right as BinaryOperator;
		const x = xDot.left as Identifier;
		const y = xDot.right as Identifier;
		assert.strictEqual(lessThan.operator[0].value, "<");
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(b.id.value, "b");
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(y.id.value, "y");
	});
	test("child", () => {
		const parser = parse("Runtime.start");
		const dotNode = parser.parseExpression() as BinaryOperator;
		const runtime = dotNode.left as Identifier;
		const start = dotNode.right as Identifier;
		assert.strictEqual(dotNode.operator[0], parser.tokens[1]);
		assert.strictEqual(runtime.id, parser.tokens[0]);
		assert.strictEqual(start.id, parser.tokens[2]);
	});
	test("Runtime start", () => {
		const parser = parse("Runtime.start(\"BA\",varList)");
		const dotNode = parser.parseExpression() as BinaryOperator;
		const runtime = dotNode.left as Identifier;
		const start = dotNode.right as Identifier;
		const args = start.args as Value[];
		const ba = args[0];
		const varList = args[1];
		assert.strictEqual(dotNode.kind, SyntaxKind.BINARY_OPERATOR);
		assert.strictEqual(runtime.id, parser.tokens[0]);
		assert.strictEqual((start).id, parser.tokens[2]);
		assert.strictEqual(ba.id, parser.tokens[5]);
		assert.strictEqual(varList.id, parser.tokens[8]);
	});
	test("grandchild", () => {
		const parser = parse("a.b.c");
		const rootNode = parser.parseExpression() as BinaryOperator;
		const leftTree = rootNode.left as BinaryOperator;
		const a = leftTree.left as Identifier;
		const b = leftTree.right as Identifier;
		const c = rootNode.right as Identifier;
		assert.strictEqual(rootNode.kind, SyntaxKind.BINARY_OPERATOR);
		assert.strictEqual(leftTree.kind, SyntaxKind.BINARY_OPERATOR);
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(b.id.value, "b");
		assert.strictEqual(c.id.value, "c");
	});
	test("grandchild with args", () => {
		const parser = parse("a(x).b(y).c(z)");
		const rootNode = parser.parseExpression() as BinaryOperator;
		const leftTree = rootNode.left as BinaryOperator;
		const a = leftTree.left as Identifier;
		const b = leftTree.right as Identifier;
		const c = rootNode.right as Identifier;
		assert.strictEqual(rootNode.kind,  SyntaxKind.BINARY_OPERATOR);
		assert.strictEqual(leftTree.kind,  SyntaxKind.BINARY_OPERATOR);
		assert.strictEqual(a.id, parser.tokens[0]);
		assert.strictEqual(b.id, parser.tokens[5]);
		assert.strictEqual(c.id, parser.tokens[10]);
	});
	test("grandchild with Numeric args", () => {
		const parser = parse("a(1).b(1).c(1)");
		const rootNode = parser.parseExpression() as BinaryOperator;
		const leftTree = rootNode.left as BinaryOperator;
		const a = leftTree.left as Identifier;
		const b = leftTree.right as Identifier;
		const c = rootNode.right as Identifier;
		assert.strictEqual(rootNode.kind, SyntaxKind.BINARY_OPERATOR);
		assert.strictEqual(leftTree.kind, SyntaxKind.BINARY_OPERATOR);
		assert.strictEqual(a.id, parser.tokens[0]);
		assert.strictEqual(b.id, parser.tokens[5]);
		assert.strictEqual(c.id, parser.tokens[10]);
	});
	test("parse do statement", () => {
		const parser = parse("do x(y.z)");

		const statement = parser.parseStatement();
		const x = statement.expressions[0] as Identifier;
		const args = x.args;
		const dot = args[0] as BinaryOperator;
		const y = dot.left as Identifier;
		const z = dot.right as Identifier;

		assert.strictEqual(statement.action.value, "do");
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(y.id.value, "y");
		assert.strictEqual(z.id.value, "z");
	});
	test("parse set statement", () => {
		const parser = parse("set x = y");

		const statement = parser.parseStatement();
		const equal = statement.expressions[0] as BinaryOperator;
		const x = equal.left as Identifier;
		const y = equal.right as Identifier;

		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(y.id.value, "y");
	});
	test("parse set statement2", () => {
		const parser = parse("set x = y");

		const statement = parser.parseStatement();
		const equal = statement.expressions[0] as BinaryOperator;
		const x = equal.left as Identifier;
		const y = equal.right as Identifier;

		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(y.id.value, "y");
	});
	test("parse set prop statement", () => {
		const parser = parse("set x.y = z");

		const statement = parser.parseStatement();
		const equal = statement.expressions[0] as BinaryOperator;
		const dot = equal.left as BinaryOperator;
		const x = dot.left as Identifier;
		const y = dot.right as Identifier;
		const z = equal.right as Identifier;

		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(y.id.value, "y");
		assert.strictEqual(z.id.value, "z");
	});
	test("parse multi set", () => {
		const parser = parse("set a = b, x = y");

		const setStatement = parser.parseStatement();
		const aEqual = setStatement.expressions[0] as BinaryOperator;
		const a = aEqual.left as Identifier;
		const b = aEqual.right as Identifier;
		const xEqual = setStatement.expressions[1] as BinaryOperator;
		const x = xEqual.left as Identifier;
		const y = xEqual.right as Identifier;

		assert.strictEqual(setStatement.action.value, "set");
		assert.strictEqual(aEqual.kind, SyntaxKind.ASSIGNMENT);
		assert.strictEqual(xEqual.kind, SyntaxKind.ASSIGNMENT);
		assert.strictEqual(aEqual.operator[0].value, "=");
		assert.strictEqual(xEqual.operator[0].value, "=");
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(b.id.value, "b");
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(y.id.value, "y");
	});
	test("parse set to complex expression", () => {
		const parser = parse("set a = x(y,z)");

		const statement = parser.parseStatement();
		const equal1 = statement.expressions[0] as BinaryOperator;

		const a = equal1.left as Identifier;
		const x = equal1.right as Identifier;
		const xArgs = x.args as Identifier[];
		const y = xArgs[0];
		const z = xArgs[1];

		assert.strictEqual(statement.action.value, "set");
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(xArgs.length, 2);
		assert.strictEqual(y.id.value, "y");
		assert.strictEqual(z.id.value, "z");
	});
	test("multi variable set", () => {
		const parser = parse("set (a,b) = c");

		const statement = parser.parseStatement();
		const equal = statement.expressions[0] as BinaryOperator;
		const variables = equal.left as MultiSet;
		const a = variables.variables[0] as Identifier;
		const b = variables.variables[1] as Identifier;
		const c = equal.right as Identifier;

		assert.strictEqual(statement.action.value, "set");
		assert.strictEqual(equal.operator[0].value, "=");
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(b.id.value, "b");
		assert.strictEqual(c.id.value, "c");
	});
	test("multi variable set", () => {
		const parser = parse("set (a.x,b.y) = c, i = j");

		const statement = parser.parseStatement();
		const equal1 = statement.expressions[0] as BinaryOperator;
		const variables = equal1.left as MultiSet;
		const dot1 = variables.variables[0] as BinaryOperator;
		const a = dot1.left as Identifier;
		const x = dot1.right as Identifier;
		const dot2 = variables.variables[1] as BinaryOperator;
		const b = dot2.left as Identifier;
		const y = dot2.right as Identifier;
		const c = equal1.right as Identifier;

		const equal2 = statement.expressions[1] as BinaryOperator;
		const i = equal2.left as Identifier;
		const j = equal2.right as Identifier;

		assert.strictEqual(statement.action.value, "set");
		assert.strictEqual(equal1.operator[0].value, "=");
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(b.id.value, "b");
		assert.strictEqual(y.id.value, "y");
		assert.strictEqual(c.id.value, "c");
		assert.strictEqual(i.id.value, "i");
		assert.strictEqual(j.id.value, "j");

		assert.strictEqual(c.id.value, "c");
	});
	test("parse set and do", () => {
		const parser = parse("set a = b do c()");

		const statements = parser.parseLine();
		const setStatement = statements[0];
		const equal = setStatement.expressions[0] as BinaryOperator;
		const a = equal.left as Identifier;
		const b = equal.right as Identifier;
		const doStatement = statements[1];
		const c = doStatement.expressions[0] as Identifier;

		assert.strictEqual(setStatement.action.value, "set");
		assert.strictEqual(equal.operator[0].value, "=");
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(b.id.value, "b");
		assert.strictEqual(c.id.value, "c");
	});
	test("parse if set", () => {
		const parser = parse("if x set y = z");

		const statements = parser.parseLine();
		const ifStatement = statements[0];
		const setStatement = statements[1];
		const x = ifStatement.expressions[0] as Identifier;
		const equal = setStatement.expressions[0] as BinaryOperator;
		const y = equal.left as Identifier;
		const z = equal.right as Identifier;
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(y.id.value, "y");
		assert.strictEqual(z.id.value, "z");
	});
	test("parse if with comma and set", () => {
		const parser = parse("if a,b!c set y = z");

		const statements = parser.parseLine();
		const ifStatement = statements[0];
		const setStatement = statements[1];
		assert.strictEqual(ifStatement.kind, SyntaxKind.IF_STATEMENT);
		assert.strictEqual(setStatement.kind, SyntaxKind.SET_STATEMENT);
	});
	test("parse complex if set", () => {
		const parser = parse("if ((x > y) and z.isNotNull()) set a = b");

		const statements = parser.parseLine();
		const ifStatement = statements[0];
		const setStatement = statements[1];
		const and = ifStatement.expressions[0] as BinaryOperator;
		const greaterThan = and.left as BinaryOperator;
		const x = greaterThan.left as Identifier;
		const y = greaterThan.right as Identifier;
		const dot = and.right as BinaryOperator;
		const z = dot.left as Identifier;
		const isNotNull = dot.right as Identifier;
		const equal = setStatement.expressions[0] as BinaryOperator;
		const a = equal.left as Identifier;
		const b = equal.right as Identifier;

		assert.strictEqual(and.operator[0].value, "and");
		assert.strictEqual(greaterThan.operator[0].value, ">");
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(y.id.value, "y");
		assert.strictEqual(dot.operator[0].value, ".");
		assert.strictEqual(z.id.value, "z");
		assert.strictEqual(isNotNull.id.value, "isNotNull");
		assert.strictEqual(equal.operator[0].value, "=");
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(b.id.value, "b");
	});
	test("test unary operator", () => {
		const parser = parse("set x = $$LABEL^PROC");
		const statement = parser.parseStatement();
		const equal = statement.expressions[0] as BinaryOperator;
		const carrot = equal.right as BinaryOperator;
		const label = carrot.left as Identifier;
		const unaryOperator = label.unaryOperator;
		const proc = carrot.right as Identifier;

		assert.strictEqual(equal.operator[0].value, "=");
		assert.strictEqual(carrot.operator[0].value, "^");
		assert.strictEqual(label.id.value, "LABEL");
		assert.strictEqual(unaryOperator.map(o => o.value).join(""), "$$");
		assert.strictEqual(proc.id.value, "PROC");
	});
	test("test unary and operator", () => {
		const parser = parse("if x and not y");
		const statement = parser.parseStatement();
		const and = statement.expressions[0] as BinaryOperator;
		const y = and.right as Identifier;
		const unaryOperator = y.unaryOperator;
		assert.strictEqual(and.operator.map(o => o.value).join(" "), "and");
		assert.strictEqual(y.id.value, "y");
		assert.strictEqual(unaryOperator.map(o => o.value).join(" "), "not");
	});
	test("many statements", () => {
		const parser = parse(
			"if x.isNotNull() and (y <= (z+3)) set a = \"19900415\".toDate()" +
			" do b.func()"
		);

		const statements = parser.parseLine();
		const ifStatement = statements[0];
		const setStatement = statements[1];
		const doStatement = statements[2];
		const and = ifStatement.expressions[0] as BinaryOperator;
		const xDot = and.left as BinaryOperator;
		const x = xDot.left as Identifier;
		const isNotNull = xDot.right as Identifier;
		const lessThanEqualTo = and.right as BinaryOperator;
		const y = lessThanEqualTo.left as Identifier;
		const plus = lessThanEqualTo.right as BinaryOperator;
		const z = plus.left as Identifier;
		const three = plus.right as NumericLiteral;
		const equal = setStatement.expressions[0] as BinaryOperator;
		const a = equal.left as Identifier;
		const stringDot = equal.right as BinaryOperator;
		const dobString = stringDot.left as StringLiteral;
		const toDate = stringDot.right as Identifier;
		const bDot = doStatement.expressions[0] as BinaryOperator;
		const b = bDot.left as Identifier;
		const func = bDot.right as Identifier;

		assert.strictEqual(ifStatement.action.value, "if");
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(xDot.operator.map(o => o.value).join(""), ".");
		assert.strictEqual(isNotNull.id.value, "isNotNull");
		assert.strictEqual(and.operator.map(o => o.value).join(""), "and");
		assert.strictEqual(y.id.value, "y");
		assert.strictEqual(lessThanEqualTo.operator.map(o => o.value).join(""), "<=");
		assert.strictEqual(z.id.value, "z");
		assert.strictEqual(plus.operator.map(o => o.value).join(""), "+");
		assert.strictEqual(three.id.value, "3");
		assert.strictEqual(setStatement.action.value, "set");
		assert.strictEqual(a.id.value, "a");
		assert.strictEqual(equal.operator.map(o => o.value).join(""), "=");
		assert.strictEqual(dobString.id.value, "19900415");
		assert.strictEqual(stringDot.operator.map(o => o.value).join(""), ".");
		assert.strictEqual(toDate.id.value, "toDate");
		assert.strictEqual(doStatement.action.value, "do");
		assert.strictEqual(b.id.value, "b");
		assert.strictEqual(bDot.operator.map(o => o.value).join(""), ".");
		assert.strictEqual(func.id.value, "func");
	});
	test("catch with colon", () => {
		const parser = parse("catch a@\"b\":c = d");
		const catchStatement = parser.parseStatement();
		const colon = catchStatement.expressions[0] as BinaryOperator;
		assert.strictEqual(colon.operator.map(o => o.value).join(""), ":");
	});
	test("set with colon", () => {
		const parser = parse("set:x=ER (x,y)=1");
		const setStatement = parser.parseStatement();
		const postCondition = setStatement.expressions[0] as PostCondition;
		const postEqual = postCondition.condition as BinaryOperator;
		const assignEqual = postCondition.expression as BinaryOperator;
		assert.strictEqual(postEqual.operator.map(o => o.value).join(""), "=");
		assert.strictEqual(postEqual.kind, SyntaxKind.BINARY_OPERATOR);
		assert.strictEqual(assignEqual.operator.map(o => o.value).join(""), "=");
		assert.strictEqual(assignEqual.kind, SyntaxKind.ASSIGNMENT);
	});
	test("set with colon and assignment", () => {
		const parser = parse("set:EVENT.isNull() EVENT = \"No \"");
		const setStatement = parser.parseStatement();
		const postCondition = setStatement.expressions[0] as PostCondition;
		const postDot = postCondition.condition as BinaryOperator;
		const postEvent = postDot.left as Identifier;
		const isNull = postDot.right as Identifier;
		const assignEqual = postCondition.expression as BinaryOperator;
		const assignEvent = assignEqual.left as Identifier;
		const no = assignEqual.right as StringLiteral;
		assert.strictEqual(postEvent.id.value, "EVENT");
		assert.strictEqual(isNull.id.value, "isNull");
		assert.strictEqual(no.id.value, "No ");
		assert.strictEqual(assignEvent.id.value, "EVENT");
	});
	test("set with colon not contain and assignment", () => {
		const parser = parse("set:VAL '[ \".\" VAL = VAL_ \".\"");
		const setStatement = parser.parseStatement();
		const postCondition = setStatement.expressions[0] as PostCondition;
		const notContain = postCondition.condition as BinaryOperator;
		const val1 = notContain.left as Identifier;
		const dot1 = notContain.right as StringLiteral;
		const assignment = postCondition.expression as BinaryOperator;
		const val2 = assignment.left as Identifier;
		const underscore = assignment.right as BinaryOperator;
		const val3 = underscore.left as Identifier;
		const dot2 = underscore.right as StringLiteral;
		assert.strictEqual(notContain.operator.map(o => o.value).join(""), "'[");
		assert.strictEqual(val1.id.value, "VAL");
		assert.strictEqual(val2.id.value, "VAL");
		assert.strictEqual(val3.id.value, "VAL");
		assert.strictEqual(dot1.id.value, ".");
		assert.strictEqual(dot2.id.value, ".");
	});
	test("do with colon", () => {
		const parser = parse("do:x=ER logErr^LOG(msg)");
		const setStatement = parser.parseStatement();
		const postCondition = setStatement.expressions[0] as PostCondition;
		const postEqual = postCondition.condition as BinaryOperator;
		const carrot = postCondition.expression as BinaryOperator;
		assert.strictEqual(postEqual.operator.map(o => o.value).join(""), "=");
		assert.strictEqual(postEqual.kind, SyntaxKind.BINARY_OPERATOR);
		assert.strictEqual(carrot.operator.map(o => o.value).join(""), "^");
		assert.strictEqual(carrot.kind, SyntaxKind.BINARY_OPERATOR);
	});
	test("$select", () => {
		const parser = parse("set x = $select(ER:\"error\",true:\"ok\")");
		const setStatement = parser.parseStatement();
		const equal = setStatement.expressions[0] as BinaryOperator;
		const select = equal.right as Identifier;
		const args = select.args;
		const arg1 = args[0] as BinaryOperator;
		assert.strictEqual(equal.operator.map(o => o.value).join(""), "=");
		assert.strictEqual(arg1.operator.map(o => o.value).join(""), ":");
	});
	test("for loop", () => {
		const parser = parse("for i=1:1:100");
		const setStatement = parser.parseStatement();
		const outsideColon = setStatement.expressions[0] as BinaryOperator;
		const oneHundred = outsideColon.right as NumericLiteral;
		const insideColon = outsideColon.left as BinaryOperator;
		const equal = insideColon.left as BinaryOperator;
		const increment = insideColon.right as NumericLiteral;
		const i = equal.left as Identifier;
		const initial = equal.right as NumericLiteral;
		assert.strictEqual(outsideColon.operator.map(o => o.value).join(""), ":");
		assert.strictEqual(insideColon.operator.map(o => o.value).join(""), ":");
		assert.strictEqual(oneHundred.id.value, "100");
		assert.strictEqual(equal.operator.map(o => o.value).join(""), "=");
		// assert.strictEqual(equal.kind, SyntaxKind.ASSIGNMENT);
		assert.strictEqual(increment.id.value, "1");
		assert.strictEqual(i.id.value, "i");
		assert.strictEqual(initial.id.value, "1");
	});
	test("argument less for loop", () => {
		const parser = parse("for  set x = 1");
		const statements = parser.parseLine();
		const forStatement = statements[0];
		const setStatement = statements[1];
		const equal = setStatement.expressions[0] as BinaryOperator;
		assert.strictEqual(forStatement.expressions.length, 0);
		assert.strictEqual(equal.operator.map(o => o.value).join(""), "=");
	});
	test("empty arg", () => {
		const parser = parse("do Runtime.start(\"CS\",,ALERT)");
		const doStatement = parser.parseStatement();
		const dot = doStatement.expressions[0] as BinaryOperator;
		const start = dot.right as Identifier;
		const args = start.args as Identifier[];
		assert.strictEqual(args.length, 3);
	});
	test("for order", () => {
		const parser = parse(
			"for  set seq=array(seq).order() quit:seq.isNull()  do set(array(seq))"
		);
		const statements = parser.parseLine();
		const setStatement = statements[1];
		const equal = setStatement.expressions[0] as BinaryOperator;
		assert.strictEqual(equal.kind, SyntaxKind.ASSIGNMENT);
	});
	test("ret identifier", () => {
		const parser = parse("set ret.x = y");
		const statements = parser.parseLine();
		const setStatement = statements[0];
		const equal = setStatement.expressions[0] as BinaryOperator;
		const dot = equal.left as BinaryOperator;
		const ret = dot.left as Identifier;
		assert.strictEqual(equal.kind, SyntaxKind.ASSIGNMENT);
		assert.strictEqual(ret.id.value, "ret");
	});
	test("ret in args", () => {
		const parser = parse("do f(ret x)");
		const statements = parser.parseLine();
		const doStatement = statements[0];
		const f = doStatement.expressions[0] as Identifier;
		const args = f.args;
		const x = args[0] as Identifier;
		const unaryOperator = x.unaryOperator;
		assert.strictEqual(f.id.value, "f");
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(unaryOperator[0].value, "ret");
	});
	test("robust do", () => {
		const parser = parse("do x.");
		const statements = parser.parseLine();
		const doStatement = statements[0];
		const dot = doStatement.expressions[0] as BinaryOperator;
		const x = dot.left as Identifier;
		assert.strictEqual(dot.operator[0].value, ".");
		assert.strictEqual(x.id.value, "x");
	});
	test("robust set", () => {
		const parser = parse("set x.");
		const statements = parser.parseLine();
		const setStatement = statements[0];
		const dot = setStatement.expressions[0] as BinaryOperator;
		const x = dot.left as Identifier;
		assert.strictEqual(dot.operator[0].value, ".");
		assert.strictEqual(x.id.value, "x");
	});
	test("robust set", () => {
		const parser = parse("set x.");
		const statements = parser.parseLine();
		const setStatement = statements[0];
		const dot = setStatement.expressions[0] as BinaryOperator;
		const x = dot.left as Identifier;
		assert.strictEqual(dot.operator[0].value, ".");
		assert.strictEqual(x.id.value, "x");
	});
	test("robust binary", () => {
		const parser = parse("do x_");
		const statements = parser.parseLine();
		const doStatement = statements[0];
		const _ = doStatement.expressions[0] as BinaryOperator;
		const x = _.left as Identifier;
		assert.strictEqual(_.operator[0].value, "_");
		assert.strictEqual(x.id.value, "x");
	});

	test("empty quit", () => {
		const parser = parse("quit");
		const statements = parser.parseLine();
		const quitStatement = statements[0];
		assert.strictEqual(quitStatement.kind, SyntaxKind.QUIT_STATEMENT);
		assert.strictEqual(quitStatement.expressions.length, 0);
	});
	test("empty quit with colon", () => {
		const parser = parse("quit:");
		const statements = parser.parseLine();
		const quitStatement = statements[0];
		assert.strictEqual(quitStatement.kind, SyntaxKind.QUIT_STATEMENT);
		assert.strictEqual(quitStatement.expressions.length, 1);
	});
	test("colon quit with expression", () => {
		const parser = parse("quit:x x+y");
		const statements = parser.parseLine();
		const quitStatement = statements[0];
		const conditionalExpression = quitStatement.expressions[0] as PostCondition;
		const x = conditionalExpression.condition as Identifier;
		const xPlusY = conditionalExpression.expression as BinaryOperator;
		assert.strictEqual(quitStatement.kind, SyntaxKind.QUIT_STATEMENT);
		assert.strictEqual(quitStatement.expressions.length, 1);
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(xPlusY.kind, SyntaxKind.BINARY_OPERATOR);
	});
	test("return expression", () => {
		const parser = parse("return x+y");
		const statements = parser.parseLine();
		const returnStatement = statements[0];
		const plus = returnStatement.expressions[0] as BinaryOperator;
		const x = plus.left as Identifier;
		const y = plus.right as Identifier;
		assert.strictEqual(returnStatement.kind, SyntaxKind.RETURN_STATEMENT);
		assert.strictEqual(returnStatement.expressions.length, 1);
		assert.strictEqual(plus.operator[0].value, "+");
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(y.id.value, "y");
	});
	test("empty set", () => {
		const parser = parse("set");
		const statements = parser.parseLine();
		const setStatement = statements[0];
		assert.strictEqual(setStatement.kind, SyntaxKind.SET_STATEMENT);
		assert.strictEqual(setStatement.expressions.length, 0);
	});
	test("empty do", () => {
		const parser = parse("do");
		const statements = parser.parseLine();
		const doStatement = statements[0];
		assert.strictEqual(doStatement.kind, SyntaxKind.DO_STATEMENT);
		assert.strictEqual(doStatement.expressions.length, 0);
	});
	test("empty set with new line", () => {
		const parser = parse("set\r\n");
		const statements = parser.parseLine();
		const setStatement = statements[0];
		assert.strictEqual(setStatement.kind, SyntaxKind.SET_STATEMENT);
		assert.strictEqual(setStatement.expressions.length, 0);
	});
	test("empty quit with new line", () => {
		const parser = parse("quit\r\n");
		const statements = parser.parseLine();
		const quitStatement = statements[0];
		assert.strictEqual(quitStatement.kind, SyntaxKind.QUIT_STATEMENT);
		assert.strictEqual(quitStatement.expressions.length, 0);
	});
	test("empty do with new line", () => {
		const parser = parse("do\r\n");
		const statements = parser.parseLine();
		const doStatement = statements[0];
		assert.strictEqual(doStatement.kind, SyntaxKind.DO_STATEMENT);
		assert.strictEqual(doStatement.expressions.length, 0);
	});
	test("do with only post condition", () => {
		const parser = parse("do:x");
		const statements = parser.parseLine();
		const doStatement = statements[0];
		assert.strictEqual(doStatement.kind, SyntaxKind.DO_STATEMENT);
		assert.strictEqual(doStatement.expressions.length, 1);
	});
	test("do with post condition and expression", () => {
		const parser = parse("do:x f(x)");
		const statements = parser.parseLine();
		const doStatement = statements[0];
		const conditionalExpression = doStatement.expressions[0] as PostCondition;
		const x = conditionalExpression.condition as Identifier;
		const fOfX = conditionalExpression.expression as Identifier;
		assert.strictEqual(doStatement.kind, SyntaxKind.DO_STATEMENT);
		assert.strictEqual(doStatement.expressions.length, 1);
		assert.strictEqual(x.id.value, "x");
		assert.strictEqual(fOfX.id.value, "f");
	});
	test("set with only post condition", () => {
		const parser = parse("set:x");
		const statements = parser.parseLine();
		const setStatement = statements[0];
		assert.strictEqual(setStatement.kind, SyntaxKind.SET_STATEMENT);
		assert.strictEqual(setStatement.expressions.length, 1);
	});
	test("set with only unary", () => {
		const parser = parse("set x = ^");
		const statements = parser.parseLine();
		const setStatement = statements[0];
		assert.strictEqual(setStatement.kind, SyntaxKind.SET_STATEMENT);
		assert.strictEqual(setStatement.expressions.length, 1);
	});
	test("set partial expression", () => {
		const parser = parse("set x. = \"something\" do");
		const statements = parser.parseLine();
		const setStatement = statements[0];
		const doStatement = statements[1];
		assert.strictEqual(setStatement.kind, SyntaxKind.SET_STATEMENT);
		assert.strictEqual(setStatement.expressions.length, 1);
		assert.strictEqual(doStatement.kind, SyntaxKind.DO_STATEMENT);
	});
	test("do partial expression", () => {
		const parser = parse("do x. set y = \"\"");
		const statements = parser.parseLine();
		const doStatement = statements[0];
		const setStatement = statements[1];
		assert.strictEqual(doStatement.kind, SyntaxKind.DO_STATEMENT);
		assert.strictEqual(doStatement.expressions.length, 1);
		assert.strictEqual(setStatement.kind, SyntaxKind.SET_STATEMENT);
	});
	test("type statement", () => {
		const parser = parse("type String x");
		const statement = parser.parseTypeStatement();
		const declaration = statement.expressions[0] as DeclarationStatement;
		const typeIdentifier = declaration.type;
		assert.strictEqual(typeIdentifier.id.value, "String");
		assert.strictEqual(declaration.id.value, "x");
		assert.strictEqual(declaration.args, undefined);
	});
	test("type statement with arg", () => {
		const parser = parse("type void x(Number)");
		const statement = parser.parseTypeStatement();
		const declaration = statement.expressions[0] as DeclarationStatement;
		const args = declaration.args as Identifier[];
		const arrayTypeNumber = args[0];
		const typeIdentifier = declaration.type;
		assert.strictEqual(typeIdentifier.id.value, "void");
		assert.strictEqual(declaration.id.value, "x");
		assert.strictEqual(args.length, 1);
		assert.strictEqual(arrayTypeNumber.id.value, "Number");
	});
	test("type statement with 2 arg", () => {
		const parser = parse("type void x(Number, String)");
		const statement = parser.parseTypeStatement();
		const declaration = statement.expressions[0] as DeclarationStatement;
		const args = declaration.args as Identifier[];
		const arrayTypeNumber = args[0];
		const arrayTypeString = args[1];
		const typeIdentifier = declaration.type;
		assert.strictEqual(typeIdentifier.id.value, "void");
		assert.strictEqual(declaration.id.value, "x");
		assert.strictEqual(args.length, 2);
		assert.strictEqual(arrayTypeNumber.id.value, "Number");
		assert.strictEqual(arrayTypeString.id.value, "String");
	});
	test("type statement with no arg", () => {
		const parser = parse("type void x()");
		const statement = parser.parseTypeStatement();
		const declaration = statement.expressions[0] as DeclarationStatement;
		const args = declaration.args as Identifier[];
		const typeIdentifier = declaration.type;
		assert.strictEqual(typeIdentifier.id.value, "void");
		assert.strictEqual(declaration.id.value, "x");
		assert.strictEqual(args.length, 0);
	});
	test("type statement with 2 empty args", () => {
		const parser = parse("type void x(,)");
		const statement = parser.parseTypeStatement();
		const declaration = statement.expressions[0] as DeclarationStatement;
		const args = declaration.args as Identifier[];
		const typeIdentifier = declaration.type;
		assert.strictEqual(typeIdentifier.id.value, "void");
		assert.strictEqual(declaration.id.value, "x");
		assert.strictEqual(args.length, 2);
	});
	test("type statement with assignment", () => {
		const parser = parse("type String x = \"something\"");
		const statement = parser.parseTypeStatement();
		const assignment = statement.expressions[0] as BinaryOperator;
		const declaration = assignment.left as DeclarationStatement;
		const something = assignment.right as StringLiteral;
		const typeIdentifier = declaration.type;
		assert.strictEqual(typeIdentifier.id.value, "String");
		assert.strictEqual(declaration.id.value, "x");
		assert.strictEqual(declaration.args, undefined);
		assert.strictEqual(something.id.value, "something");
	});
	test("type statement with keywords", () => {
		const parser = parse("type public new String x");
		const statement = parser.parseTypeStatement();
		const declaration = statement.expressions[0] as DeclarationStatement;
		const publicToken = declaration.publicToken;
		const newToken = declaration.newToken;
		const typeIdentifier = declaration.type;
		assert.strictEqual(typeIdentifier.id.value, "String");
		assert.strictEqual(publicToken.value, "public");
		assert.strictEqual(newToken.value, "new");
		assert.strictEqual(declaration.id.value, "x");
		assert.strictEqual(declaration.args, undefined);
	});
	test("complex multi line set", () => {
		const parser = parse("type Number x = 1, y = 2");
		const statement = parser.parseStatement();
		const xAssign = statement.expressions[0] as BinaryOperator;
		const yAssign = statement.expressions[1] as BinaryOperator;
		assert.strictEqual(statement.expressions.length, 2);
		assert.strictEqual(xAssign.kind, SyntaxKind.ASSIGNMENT);
		assert.strictEqual(yAssign.kind, SyntaxKind.ASSIGNMENT);
	});
	test("static declaration", () => {
		const parser = parse("type static ZTest");
		const statement = parser.parseStatement();
		const declaration = statement.expressions[0] as DeclarationStatement;
		assert.strictEqual(declaration.type.id.value, "ZTest");
		assert.strictEqual(declaration.staticToken.value, "static");
	});
	test("only type", () => {
		const parser = parse("type");
		const statement = parser.parseStatement();
		assert.strictEqual(statement.kind, SyntaxKind.TYPE_STATEMENT);
		assert.strictEqual(statement.expressions.length, 0);
	});
	test("type String", () => {
		const parser = parse("type String");
		const statement = parser.parseStatement();
		const declaration = statement.expressions[0] as DeclarationStatement;
		const stringType = declaration.type;
		assert.strictEqual(statement.kind, SyntaxKind.TYPE_STATEMENT);
		assert.strictEqual(stringType.id.value, "String");
		assert.strictEqual(declaration.id, undefined);
	});
	test("type static", () => {
		const parser = parse("type static");
		const statement = parser.parseStatement();
		const declaration = statement.expressions[0] as DeclarationStatement;
		assert.strictEqual(declaration.type, undefined);
		assert.strictEqual(declaration.staticToken.value, "static");
	});
});
