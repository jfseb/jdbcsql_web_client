/// <reference types="node" />
export interface IStatRecord {
    time: number;
    QPS: number;
    FAIL: number;
    MEM: number;
    CPU: number;
    DUR: number;
    NP: number;
    PAR: number;
    MAXMEM: number;
}
export interface IMessage {
    conversationID: string;
    sourcedest?: string;
    user: string;
    body: any;
}
export declare class Connector {
    answerHook: any;
    answerHooks: any;
    conversationID: string;
    constructor(options: any);
    setAnswerHook(answerHook: any, id: any): void;
    intervals: any;
    disconnect(conversationID: string): void;
    startParallel(conversationID: string, user: string, statement: string, settings: any): NodeJS.Timer;
    processMessage(msg: IMessage): void;
    send(messages: IMessage[], done?: any): void;
}
