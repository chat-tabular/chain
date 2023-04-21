
export type Table = {
    columns: string[],
    rows: Row[];
}
export type Row = {[key: string]: string};

export interface LLM {
    openaiKey: string;
}