import { Monitor } from './monitor';
import { IParallelExecutor } from '../../jdbcsql_throughput/gen/constants';
export declare function Setup(nrexec: number, explicitconfig?: any): void;
export interface IRecord {
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
export interface ISettings {
    parallel: number;
    continuous: boolean;
}
export interface ResultRec {
    time: number;
    rc: boolean;
}
export interface IConvRec {
    statement?: string;
    settings?: ISettings;
    handle?: string;
    last_stop_t: number;
    delta_t: number;
    lastQPS: number;
    lastFAIL: number;
    results: ResultRec[];
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
    quitHook: any;
    intervals: Map<string, IConvRec>;
    monitor: Monitor;
    constructor(options: any);
    setAnswerHook(answerHook: any, id: any): void;
    setQuitHook(quitHook: any): void;
    /**
     * Expose the parallel executor
     */
    getParallelExecutor(): IParallelExecutor;
    isActive(conversationID: string): boolean;
    disconnect(conversationID: string): void;
    getOneStatement(statement: string): string;
    getConvRecord(conversationID: string): IConvRec;
    getDefaultConvRecord(conversationID: string): IConvRec;
    getQPS(currentRec: IConvRec): number;
    getFAIL(currentRec: IConvRec): number;
    genRec(rc: boolean, currentRec: IConvRec): IRecord;
    stopParallel(conversationID: string): void;
    changeParallel(conversationID: string, statement: string, settings: ISettings): void;
    startParallel(conversationID: string, user: string, statement: string, settings: ISettings): IConvRec;
    tmonitor: any;
    startMonitor(): void;
    stopMonitor(): void;
    adjustMonitor(): void;
    processMessage(msg: IMessage): void;
    onEvent: (handler: any) => void;
    send(messages: IMessage[], done?: any): void;
}
