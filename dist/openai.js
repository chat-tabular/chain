"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCode = exports.chat = exports.decide = exports.toPrompt = exports.CHAT_GPT35_MODEL = exports.CHART_PROMPT = exports.TABLE_PROMPT = exports.DECISION_PROMPT = exports.exportedFuncName = void 0;
const { Configuration, OpenAIApi } = require("openai");
exports.exportedFuncName = 'window.run';
exports.DECISION_PROMPT = `You are acting as decision maker, you should choose which actions should be token based on my question.
Question Context: Give a csv file, columns is \`{HEADERS}\`

Candidate actions list:
1. Chart Function to show chart
2. Table Function to show the result table
3. Unknown & Not Sure

You should not to explain, just show the action number and name.

My Question: {QUESTION}
`;
exports.TABLE_PROMPT = `You are working with javascript program, I will give you a \`table: {column: string[], rows: Row[]}\`, where Rows is {[column key]: value}.
I will ask you question, you should return a javascript function to resolve my question.
- function name should be \`${exports.exportedFuncName}\`
- input parameter as \`table\`, output should also return a table type

You should not to explain the logic, just write the code.

My \`table.columns\` is \`{HEADERS}\`
My table head rows are """
{ROWS}
"""

Question: {QUESTION} `;
exports.CHART_PROMPT = `You are working with javascript program to show me the chart by google chart library,  I will give you a \`table: {column: string[], rows: Row[]}\`, where Rows is {[column key]: value}.
I will ask you question, you should return a javascript function to show chart, powered by google chart libarary
- chart container DOM element id is {CHART_CONTAINER_ID}
- function name should be \`${exports.exportedFuncName}\`
- input parameter as \`table\`
- the second partameter is the chart container dom element id

You should not to explain the logic, not show sample notes or usages, just write the code.

My \`table.columns\` is \`{HEADERS}\`
My table head rows are """
{ROWS}
"""

Question: {QUESTION} `;
exports.CHAT_GPT35_MODEL = "gpt-3.5-turbo";
;
function toPrompt(type, table, question, id) {
    const temp = type === 'chart' ? exports.CHART_PROMPT : exports.TABLE_PROMPT;
    return temp.replace('{HEADERS}', table.columns.join(','))
        .replace('{ROWS}', table.rows.slice(0, 5).map(r => table.columns.map(c => r[c] || '').join(',')).join('\n'))
        .replace('{QUESTION}', question)
        .replace('{CHART_CONTAINER_ID}', id);
}
exports.toPrompt = toPrompt;
function decide(columns, question, openaiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const configuration = new Configuration({
            apiKey: openaiKey,
        });
        const openai = new OpenAIApi(configuration);
        const p = exports.DECISION_PROMPT.replace('{HEADERS}', columns.join(','))
            .replace('{QUESTION}', question);
        const res = yield chat(p, openaiKey);
        if (res.status) {
            return 'unknown';
        }
        else {
            try {
                const rough = res.choices[0].message.content.toLowerCase();
                return ['chart', 'table', 'number'].find(t => rough.split('\n')[0].indexOf(t) >= 0) || 'unknown';
            }
            catch (err) {
                return 'unknown';
            }
        }
        return 'unknown';
    });
}
exports.decide = decide;
function chat(prompt, openaiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const configuration = new Configuration({
            apiKey: openaiKey,
        });
        const openai = new OpenAIApi(configuration);
        const result = yield openai.createChatCompletion({
            model: exports.CHAT_GPT35_MODEL,
            messages: [{ "role": "user", "content": prompt }],
            temperature: 0,
            max_tokens: 1024,
        });
        if (result.status === 200) {
            return result.data;
        }
        else {
            return {
                status: result.status,
                statusText: result.statusText
            };
        }
    });
}
exports.chat = chat;
function parseCode(content, starter) {
    if (!content) {
        return;
    }
    if (starter && content.startsWith(starter)) {
        return content;
    }
    const lines = content.split('\n');
    const startLine = lines.findIndex(l => l.trim().startsWith('```'));
    if (startLine < 0)
        return;
    const endLine = lines.slice(startLine + 1).findIndex(l => l.trim().startsWith('```')) + startLine + 1;
    return lines.slice(startLine + 1, endLine).join('\n');
}
exports.parseCode = parseCode;
//# sourceMappingURL=openai.js.map