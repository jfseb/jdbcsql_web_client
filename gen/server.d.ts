/**
 * A simple webserver serving the interface
 *
 */
/// <reference types="node" />
import { Server } from 'net';
import { Connector } from '../gen/dbconnector';
import * as express from 'express';
export declare class WCServer {
    app: express.Application;
    server: Server;
    connector: Connector;
    GetApp(): express.Application;
    GetServer(): any;
    GetConnector(): any;
    constructor(cfgdata: any, args: any);
}
