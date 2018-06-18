import { Constants } from 'jdbcsql_throughput';
export declare var MONITOR_SYSTABLE_NAME: string;
import { IRecord } from './dbconnector';
export interface IResult {
    TAG: string;
    QPM: number;
    BAD: number;
    PAR: number;
    DUR: number;
    DDP: number;
    MAXMEM: number;
    CPU: number;
    MEM: number;
    MEU: number;
    PAR_N: number;
    QPM_N: number;
    DUR_N: number;
}
export declare class IAvgRecord {
    MAX_MEM_USAGE_30s: number;
    MEM_USAGE: number;
    AGGR_PLAN_EXEC_DURATION: number;
    QUERY_PER_MIN: number;
    CPU_UTILIZATION: number;
    MEM_UTILIZATION: number;
    MAX_MEM_EVER: number;
    NR_PARALLEL_PLAN: number;
    PLAN_EXEC_DURATION: number;
    constructor();
}
export declare const Keys: string[];
export declare function dumpNice(v: any, len: number): string;
export declare class Monitor {
    constructor(parexec: Constants.IParallelExecutor);
    para_exec: Constants.IParallelExecutor;
    stopMonitor(): void;
    startMonitor(): void;
    lastRecord: IRecord;
    updateAverages(res: any): void;
    getLastRecord(): IRecord;
    makeTimingRecord(res: any): Constants.ITimingMap;
    getBestSingleAvg(record: Constants.ITimingMap): IAvgRecord;
    toRecord(values: IAvgRecord): IRecord;
    dumpAllResults(allresult: IRecord[]): void;
}
