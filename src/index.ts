import { ApplicationBuilder, ShutdownHandle } from "@figedi/svc";
import { RouteOptions } from "fastify";
import { serializeError } from "serialize-error";
import { TelegramPublisher } from "./publishers/telegram";
import { HttpEndpointCommand } from "./commands/HttpEndpointCommand";
import { createScraperRoutes } from "./routes";
import { MoemaScraper } from "./scrapers/moema";
import { KaffeeZentraleScraper } from "./scrapers/kaffeezentrale";
import { EspressoPerfettoScraper } from "./scrapers/espressoperfetto";
import { MobaScraper } from "./scrapers/moba";
import { MccScraper } from "./scrapers/mcc";
import { IPublisher, IScraper } from "./lib/base/types";
import { ScraperStore } from "./stores/scraperStore";
import { CoffeeScraperService } from "./services/CoffeeScraperService";
import { patchCollectionSchema, postCollectionSchema } from "./lib/base/schemas";
import { Kaffee24Scraper } from "./scrapers/kaffee24";
import { DiecremaScraper } from "./scrapers/diecrema";

/**
 * @todo price comparsion api for comparsion of current price
 */
ApplicationBuilder.create()
  .setEnv(({ env }) => ({
    port: env(parseInt, 8080),
    host: env(undefined, "0.0.0.0"),
    telegram: {
      token: env(),
      defaultUserId: env(),
    },
    auth: {
      user: env(),
      pass: env(),
    },
    db: {
      uri: env(),
      name: env(),
      collection: env(),
    },
  }))

  .registerDependency(
    "telegramPublisher",
    ({ config }) => new TelegramPublisher(config.telegram.token, config.telegram.defaultUserId),
  )
  .registerDependency(
    "scraperStore",
    ({ config }) => new ScraperStore(config.db.uri, config.db.name, config.db.collection),
  )
  .registerDependency(
    "coffeeScraperService",
    ({ resolve }) =>
      new CoffeeScraperService(
        resolve<IPublisher>("telegramPublisher"),
        resolve<ScraperStore>("scraperStore"),
        resolve<IScraper[]>("scrapers"),
      ),
  )
  .registerDependency("scrapers", () => [
    new MoemaScraper(),
    new KaffeeZentraleScraper(),
    new EspressoPerfettoScraper(),
    new MobaScraper(),
    new MccScraper(),
    new Kaffee24Scraper(),
    new DiecremaScraper(),
  ])
  .registerDependency("routes", ({ resolve }) => [
    ...createScraperRoutes(resolve<CoffeeScraperService>("coffeeScraperService")),
  ])

  .onError(({ logger }, e) => {
    logger.error({ error: serializeError(e) }, `Uncaught error: ${e ? e.message : "Something went wrong"}`);
    process.exit(1);
  })
  .onShutdown(({ logger }) => {
    logger.info("Shutting down...");
    return ShutdownHandle.FORCE;
  })

  .registerDefaultCommand(
    "httpEndpointCommand",
    ({ resolve, config }) =>
      new HttpEndpointCommand(
        { port: config.port, address: config.host, defaultUser: { user: config.auth.user, pass: config.auth.pass } },
        resolve<RouteOptions[]>("routes"),
        [postCollectionSchema, patchCollectionSchema],
      ),
  )
  .run();
