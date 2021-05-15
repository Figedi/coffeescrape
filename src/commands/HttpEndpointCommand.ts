import { Command, ExecuteCommandArgs } from "@figedi/svc";
import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { RouteOptions } from "fastify/types/route";
import middie from "middie";
import fastifyBasicAuth from "fastify-basic-auth";

export interface IServerOptions {
  port: number;
  address: string;
  defaultUser: {
    user: string;
    pass: string;
  };
}

export type IMiddleware = (
  req: FastifyRequest,
  reply: FastifyReply,
  next: (error?: Error) => void,
) => void | Promise<void>;

export class HttpEndpointCommand implements Command {
  public info = {
    name: "HttpEndpointCommand",
    help: "Starts an http endpoint, serving the api and client",
  };

  public onClose: Promise<void>;

  private server?: FastifyInstance;

  constructor(
    private serverOptions: IServerOptions,
    private routes: RouteOptions[],
    private schemas: Record<string, any>[],
  ) {}

  private validateUser = (
    username: string,
    password: string,
    _req: FastifyRequest,
    _reply: FastifyReply,
    done: (error?: Error) => void,
  ) => {
    if (username === this.serverOptions.defaultUser.user && password === this.serverOptions.defaultUser.pass) {
      done();
    } else {
      done(new Error("Unauthorized"));
    }
  };

  public async preflight() {
    this.server = fastify({
      ignoreTrailingSlash: true,
    });
    await this.server.register(middie);

    this.server.use(require("cors")());
    this.server.use(require("dns-prefetch-control")());
    this.server.use(require("frameguard")());
    this.server.use(require("hsts")());
    this.server.use(require("ienoopen")());
    this.server.use(require("x-xss-protection")());

    this.server.register(fastifyBasicAuth, {
      validate: this.validateUser,
      authenticate: { realm: "coffeescraper" },
    });

    this.server.after(() => {
      this.server!.addHook("onRequest", this.server!.basicAuth);
    });

    this.routes.forEach(route => this.server!.route(route));
    this.schemas.forEach(schema => this.server!.addSchema(schema));
  }

  public async execute({ logger }: ExecuteCommandArgs): Promise<void> {
    if (!this.server) {
      throw new Error("No server found, did you call preflight()?");
    }
    const { port, address } = this.serverOptions;
    await new Promise((resolve, reject) => {
      this.server!.listen(port, address, error => {
        if (error) {
          reject(error);
        }
      });

      logger.info(`HttpEndpointStrategy created a server listening@${address}:${port}`);
      this.server?.server.on("close", resolve);
      this.server?.server.on("error", reject);
    });
  }

  public async shutdown(): Promise<void> {
    return this.server?.close();
  }
}
