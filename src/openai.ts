import { Table } from './types';
const { Configuration, OpenAIApi } = require("openai");

export const exportedFuncName = 'window.run';
export const DEFAULT_CHAT_TEMPERATURE = 0;
export const DEFAULT_INSIGHT_TEMPERATURE = 0.5;

export const DECISION_PROMPT = `You are acting as decision maker, you should choose which actions should be token based on my question.
Question Context: Give a csv file, columns is \`{HEADERS}\`

Candidate actions list:
1. Chart Function to show chart
2. Table Function to show the result table
3. Unknown & Not Sure

You should not to explain, just show the action number and name.

My Question: {QUESTION}
`;

export const TABLE_PROMPT = `You are working with javascript program, I will give you a \`table: {columns: string[], rows: Row[]}\`, where Row is dictionary ({[column key]: value}).
I will ask you question, you should return a javascript function to resolve my question.
- function name should be \`${exportedFuncName}\`
- input parameter as \`table\`, output should also return a table type

You should not to explain the logic, just write the code.

My \`table.columns\` is \`{HEADERS}\`
My table head rows are """
{ROWS}
"""

Question: {QUESTION} `

export const CHART_PROMPT = `You are working with javascript program to show me the chart by google chart library,  I will give you a \`table: {column: string[], rows: Row[]}\`, where Row is dictionary ({[column key]: value}).
I will ask you question, you should return a javascript function to show chart, powered by google chart libarary
- function name should be \`${exportedFuncName}\`
- input parameter as \`table\`
- the second parameter is the chart container dom element id

You should write code in the first paragraph (Markdown formatted),  then explain the logic after it.

My \`table.columns\` is \`{HEADERS}\`
My table head rows are """
{ROWS}
"""

Question: {QUESTION} `

const INSIGHT_PROMPT = `You are a data analyzer, who need give some insight questions for my dataset:
 I will give you a \`table: {columns: string[], rows: Row[]}\`, where sample rows is {[column key]: value}
- the question list should bullets listed
- no explains
- at most 5 quesions

You should write code in the first paragraph (Markdown formatted),  then explain the logic after it.

My \`table.columns\` is \`{HEADERS}\`
My table head rows are """
{ROWS}
"""

Insights:
`;

export const CHAT_GPT35_MODEL = "gpt-3.5-turbo";
interface GptChatChoice {
    message: {
      role: string;
      content: string;
    }
};
export interface OpenaiResult {
    choices: GptChatChoice [];
    created: number;
    id: string;
    model: string;
    usage: {
      completion_tokens: number,
      prompt_tokens: number,
      total_tokens: number
    }
    finish_reason: string;
    index: number;
    temperature: number;
}
export interface OpenaiErrorResult {
    status: number;
    statusText: string;
}
export function toPrompt(type: 'table' | 'chart', table: Table, question: string, id: string): string {
    const temp = type === 'chart' ? CHART_PROMPT : TABLE_PROMPT;
    return temp.replace('{HEADERS}', table.columns.join(','))
        .replace('{ROWS}', table.rows.slice(0, 5).map(r => table.columns.map(c => r[c] || '').join(',')).join('\n'))
        .replace('{QUESTION}', question)
        .replace('{CHART_CONTAINER_ID}', id)
        ;
}

export async function decide(columns: string[], question: string, openaiKey: string): Promise<'chart' | 'table' | 'number' | 'unknown'>{
    const configuration = new Configuration({
        apiKey: openaiKey,
    });
    
    const p = DECISION_PROMPT.replace('{HEADERS}', columns.join(','))
        .replace('{QUESTION}', question);
    const res = await chat(p, openaiKey);
    if((res as OpenaiErrorResult).status) {
        return 'unknown';
    } else {
        try{
            const rough = (res as OpenaiResult).choices[0].message.content.toLowerCase();
            return ['chart', 'table'].find(t => rough.split('\n')[0].indexOf(t) >= 0) || 'unknown' as any;
        }catch(err){
            return 'unknown';
        }
    }
    return 'unknown';
}
export async function chat(prompt: string, openaiKey: string, temperature?: number): Promise<OpenaiResult | OpenaiErrorResult>{
    const configuration = new Configuration({
        apiKey: openaiKey,
    });
    temperature = temperature || DEFAULT_CHAT_TEMPERATURE;
    
    const openai = new OpenAIApi(configuration);
    const result = await openai.createChatCompletion({
            model: CHAT_GPT35_MODEL,
            messages: [ {"role": "user", "content": prompt } ],
            temperature: temperature || 0,
            max_tokens: 1024,
        });
        if(result.status === 200) {
        return {...result.data, temperature};
        } else {
        return {
            status: result.status,
            statusText: result.statusText
        }
    }
}

/**
 * step 1: split firstly, pickup the first segment
 * step 2: if start with `starter`, directly return
 * step 3: if not, find the code between ``` and return the content
 */
export function parseCode(content?: string, starter?: string, splitter?: string) {
    if(!content) {
        return;
    }
    if(splitter) {
        const segIndex = content.split('\n').findIndex(c => c === splitter);
        if(segIndex > 0) {
            content = content.split('\n').slice(0, segIndex).join('\n');
        }
    }
    if(starter && content.startsWith(starter)) {
        return content;
    }
    const lines = content.split('\n');
    const startLine = lines.findIndex(l => l.trim().startsWith('```'));
    if(startLine < 0) return ;
    const endLine = lines.slice(startLine + 1).findIndex(l => l.trim().startsWith('```')) + startLine + 1;
    return lines.slice(startLine + 1, endLine).join('\n');
}

export async function insights(table: Table, openaiKey: string, temperature?: number): 
    Promise<{ok: boolean; insights: string[], model: string; prompt: string; temperature: number, respContent?: string; error?: any}> {
    temperature = temperature || DEFAULT_INSIGHT_TEMPERATURE;
    const model = CHAT_GPT35_MODEL;
    const prompt = INSIGHT_PROMPT.replace('{HEADERS}', table.columns.join(',')).replace(
      '{ROWS}',
      table.rows
        .slice(0, 5)
        .map((r) => table.columns.map((c) => r[c] || '').join(','))
        .join('\n')
    );
    const bullet = '- ';
    const res = await chat(prompt, openaiKey, temperature);
    if ((res as OpenaiErrorResult).status) {
      return {temperature, insights: [], ok: false, error: (res as OpenaiErrorResult).statusText,model, prompt};
    } else {
      try {
        const rough = (res as OpenaiResult).choices[0].message.content || '';
        return {
          ok: true,
          insights: rough.split('\n')
          .filter((l) => l.startsWith(bullet))
          .map((l) => l.substring(bullet.length).trim()),
          respContent: rough,
          temperature,
          model,
          prompt
        }
      } catch (err) {
        return {ok: false, temperature, insights:[],
            model, prompt, error: err.message || err};
      }
    }
  }