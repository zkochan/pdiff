var pdiff = require('../lib/main');

var assert = require('assert');
var chai = require("chai");
chai.should();

describe("pdiff", function() {
  describe('#diff', function() {
    it("should diff on word boundaries.", function() {
      var result = pdiff.diff("var x = 10;", "var x = 20;");

      result.should.deep.equal([
        {
          value: "var x = "
        },
        {
          added: undefined,
          removed: true,
          value: "10"
        },
        {
          added: true,
          removed: undefined,
          value: "20"
        },
        {
          value: ";"
        }
      ])
    })
    it("should diff lines when a delta is large.", function() {
      var result = pdiff.diff(
        [
          "function fib(n)",
          "  if (n <= 1) return 1;",
          "  else return fib(n-1) + fib(n-2);",
          "}",
          "",
          "function initialize() {",
          "  alert('foo');",
          "}"
        ].join("\n"),
        [
          "function initialize() {",
          "  alert('foo');",
          "}"
        ].join("\n")
      );

      result.should.deep.equal([
        {
          added: undefined,
          removed: true,
          value: [
            "function fib(n)",
            "  if (n <= 1) return 1;",
            "  else return fib(n-1) + fib(n-2);",
            "}",
            "",
            ""
          ].join("\n")
        },
        {
          value: [
            "function initialize() {",
            "  alert('foo');",
            "}"
          ].join("\n")
        }
      ])
    })
  })
  describe("#addLineNumbers", () => {
    it("should return a diff data with line numbers when words are replaced.", () => {
      var diff = pdiff.addLineNumbers(pdiff.diff(
        "test: 10\n",
        "test: 20\n"
      ));
      diff.should.deep.equal([
        {
          lineNumberOfLhs: 0,
          lineNumberOfRhs: 0,
          values: [{
            value: "test: "
          },
          {
            removed: true,
            value: "10"
          },
          {
            added: true,
            value: "20"
          }]
        },
        {
          lineNumberOfLhs: 1,
          lineNumberOfRhs: 1,
          values: [{
            value: ""
          }]
        }
      ])
    })
    it("should return a diff data with line numbers when lines are inserted.", () => {
      var diff = pdiff.addLineNumbers(pdiff.diff(
        "test: 10\n",
        "test: 10\ntest: 20\n"
      ));
      diff.should.deep.equal([
        {
          lineNumberOfLhs: 0,
          lineNumberOfRhs: 0,
          values: [{
            value: "test: 10"
          }]
        },
        {
          lineNumberOfLhs: 1,
          lineNumberOfRhs: 1,
          values: [
            {
              added: true,
              value: "test: 20"
            }
          ]
        },
        {
          lineNumberOfRhs: 2,
          values: [
            {
              added: true,
              value: ""
            }
          ]
        }
      ])
    })
    it("should return a diff data with line numbers when lines are removed.", () => {
      var diff = pdiff.addLineNumbers(pdiff.diff(
        "test: 10\ntest: 20\n",
        "test: 10\n"
      ));
      diff.should.deep.equal([
        {
          lineNumberOfLhs: 0,
          lineNumberOfRhs: 0,
          values: [{
            value: "test: 10"
          }]
        },
        {
          lineNumberOfLhs: 1,
          lineNumberOfRhs: 1,
          values: [{
            removed: true,
            value: "test: 20"
          }]
        },
        {
          lineNumberOfLhs: 2,
          values: [{
            removed: true,
            value: ""
          }]
        }
      ])
    })
    it("should return a diff data with line numbers when lines are replaced.", () => {
      var diff = pdiff.addLineNumbers(pdiff.diff(
        "foo\n",
        "bar\ntest: 10\n"
      ));
      diff.should.deep.equal([
        {
          lineNumberOfLhs: 0,
          values: [{
            removed: true,
            value: "foo"
          }]
        },
        {
          lineNumberOfRhs: 0,
          values: [{
            added: true,
            value: "bar"
          }]
        },
        {
          lineNumberOfRhs: 1,
          values: [
            {
              added: true,
              value: "test: 10"
            }
          ]
        },
        {
          lineNumberOfLhs: 1,
          lineNumberOfRhs: 2,
          values: [
            {
              value: ""
            }
          ]
        }
      ])
    })
  })
})
