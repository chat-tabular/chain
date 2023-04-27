import { Table } from './types';
export declare const exportedFuncName = "window.run";
export declare const DECISION_PROMPT = "You are acting as decision maker, you should choose which actions should be token based on my question.\nQuestion Context: Give a csv file, columns is `{HEADERS}`\n\nCandidate actions list:\n1. Chart Function to show chart\n2. Table Function to show the result table\n3. Unknown & Not Sure\n\nYou should not to explain, just show the action number and name.\n\nMy Question: {QUESTION}\n";
export declare const TABLE_PROMPT: string;
export declare const CHART_PROMPT: string;
export declare const CHAT_GPT35_MODEL = "gpt-3.5-turbo";
interface GptChatChoice {
    message: {
        role: string;
        content: string;
    };
}
export interface OpenaiResult {
    choices: GptChatChoice[];
    created: number;
    id: string;
    model: string;
    usage: {
        completion_tokens: number;
        prompt_tokens: number;
        total_tokens: number;
    };
    finish_reason: string;
    index: number;
}
export interface OpenaiErrorResult {
    status: number;
    statusText: string;
}
export declare function toPrompt(type: 'table' | 'chart', table: Table, question: string, id: string): string;
export declare function decide(columns: string[], question: string, openaiKey: string): Promise<'chart' | 'table' | 'number' | 'unknown'>;
export declare function chat(prompt: string, openaiKey: string, temperature?: number): Promise<OpenaiResult | OpenaiErrorResult>;
export declare function parseCode(content?: string, starter?: string): string;
export declare function insights(table: Table, openaiKey: string, temperature?: number): Promise<{
    ok: boolean;
    insights: string[];
    temperature: number;
    respContent?: string;
    error?: any;
}>;
export {};
