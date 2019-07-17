import jsdom from "mocha-jsdom";
const expect = require("chai").expect;

describe("mocha test", () => {
  jsdom({
    url: "http://localhost"
  });

  it("has document", () => {
    const div = document.createElement("div");
    expect(div.nodeName).eql("DIV");
  });
});
