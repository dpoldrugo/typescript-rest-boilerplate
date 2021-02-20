import * as cors from 'cors';
import * as express from 'express';
import * as http from 'http';
import * as morgan from 'morgan';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import * as path from 'path';
import { PassportAuthenticator, Server } from 'typescript-rest';
import {HttpError} from "typescript-rest/dist/server/model/errors";
import * as mongoose from "mongoose";
import {MongoError} from "mongodb";
import {ApiError} from "./model/ApiError";

export class ApiServer {
    init = initEnvFile();

    public PORT: number = +process.env.PORT || 3000;

    private readonly app: express.Application;
    private server: http.Server = null;

    constructor() {
        this.app = express();
        this.config();

        Server.loadServices(this.app, 'controller/*', __dirname);
        Server.loadServices(this.app, 'api/potres2020/*', __dirname);
        Server.swagger(this.app, { filePath: './dist/swagger.json' });
        this.configureErrorHandling();
    }

    /**
     * Start the server
     */
    public async start() {
        return new Promise<any>((resolve, reject) => {
            // @ts-ignore
            this.server = this.app.listen(this.PORT, (err: any) => {
                if (err) {
                    return reject(err);
                }

                // TODO: replace with Morgan call
                // tslint:disable-next-line:no-console
                console.log(`Listening to http://127.0.0.1:${this.PORT}`);

                return resolve();
            });
        });

    }

    /**
     * Stop the server (if running).
     * @returns {Promise<boolean>}
     */
    public async stop(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    return resolve(true);
                });
            } else {
                return resolve(true);
            }
        });
    }

    /**
     * Configure the express app.
     */
    private config(): void {
        // Native Express configuration
        this.app.use(express.static(path.resolve(__dirname, 'public_content'), { maxAge: 31557600000 }));
        this.app.use('/test-coverage',express.static(path.resolve(__dirname, '../reports/coverage'), { maxAge: 31557600000 }));
        //this.app.use(express.static(path.resolve(__dirname, '../reports/coverage'), { maxAge: 31557600000 }));
        this.app.use(cors());
        this.app.use(morgan('combined'));
        //this.app.use(morgan('dev'));
        this.configureAuthenticator();
    }

    private configureErrorHandling() {
        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (res.headersSent) { // important to allow default error handler to close connection if headers already sent
                return next(err)
            }

            if (err instanceof HttpError){
                res.set("Content-Type", "application/json")
                res.status(err.statusCode)
                res.send(new ApiError(err.message,err.statusCode));
            }
            else if (err instanceof mongoose.Error.ValidationError) {
                res.set("Content-Type", "application/json")
                res.status(400);
                res.send(new ApiError(err.message, 400));
            }
            else if (err instanceof MongoError) {
                res.set("Content-Type", "application/json")
                res.status(400);
                res.send(new ApiError(err.message, 400));
            }
            else {
                next(err);
            }
        });
    }

    private configureAuthenticator() {
        const JWT_SECRET: string = process.env.JWT_SECRET;
        const jwtConfig: StrategyOptions = {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: Buffer.from(JWT_SECRET)
        };
        const strategy = new Strategy(jwtConfig, (payload: any, done: (err: any, user: any) => void) => {
            done(null, payload);
        });
        const authenticator = new PassportAuthenticator(strategy, {
            deserializeUser: (user: string) => JSON.parse(user),
            serializeUser: (user: any) => {
                return JSON.stringify(user);
            }
        });
        Server.registerAuthenticator(authenticator);
        Server.registerAuthenticator(authenticator, 'secondAuthenticator');
    }
}

function initEnvFile() {
    if (process.env.NODE_ENV) {
        require('dotenv').config({path: `./.env.${process.env.NODE_ENV}`});
    }
    else {
        require('dotenv').config({path: `./.env`});
    }
    console.log(`ENV:\n${process.env}`);
}