/**
 * A simple webserver serving the interface
 *
 */
/// <reference types="node" />
import { Server } from 'net';
import * as express from 'express';
export declare class WCServer {
    app: express.Application;
    server: Server;
    GetApp(): express.Application;
    GetServer(): any;
    constructor(cfgdata: any, args: any);
}
