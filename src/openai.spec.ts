import { parseCode } from './openai'
import { expect } from 'chai';

describe('openai', () => {
    it('should parse code from response message', () => {
        expect(parseCode('window.run=aaa', 'window.run')).to.be.eq('window.run=aaa');
        expect(parseCode("```\n\
window.run=function() {}\n\
    ```", 'window.run')).to.be.eq('window.run=function() {}');

        expect(parseCode("Here is some explain\n\
        ```\n\
window.run=function() {}\n\
        ```\n\
    the end", 'window.run')).to.be.eq('window.run=function() {}');
    });
})
