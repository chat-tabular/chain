"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("./openai");
const chai_1 = require("chai");
describe('openai', () => {
    it('should parse code from response message', () => {
        (0, chai_1.expect)((0, openai_1.parseCode)('window.run=aaa', 'window.run')).to.be.eq('window.run=aaa');
        (0, chai_1.expect)((0, openai_1.parseCode)("```\n\
window.run=function() {}\n\
    ```", 'window.run')).to.be.eq('window.run=function() {}');
        (0, chai_1.expect)((0, openai_1.parseCode)("Here is some explain\n\
        ```\n\
window.run=function() {}\n\
        ```\n\
    the end", 'window.run')).to.be.eq('window.run=function() {}');
    });
});
//# sourceMappingURL=openai.spec.js.map