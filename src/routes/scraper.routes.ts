import { RouteOptions } from "fastify";
import { omit } from "lodash";
import { v4 as uuid } from "uuid";
import { CoffeeScraperService } from "../services/CoffeeScraperService";

export const createScraperRoutes = (coffeeScraperService: CoffeeScraperService): RouteOptions[] => [
  {
    method: "POST",
    url: "/collections/:collectionId/scrape",

    handler: async (request: any, reply) => {
      const result = await coffeeScraperService.scrapeAndPublish(request.params.collectionId);

      reply.status(200).send(result);
    },
  },
  {
    method: "PATCH",
    url: "/collections/:collectionId",
    schema: {
      body: { $ref: "https://webscraper.figedi.com/schemas/collection-patch.json" },
    },
    handler: async (request: any, reply) => {
      const result = await coffeeScraperService.saveCollection({
        id: request.params.collectionId,
        ...request.body,
      });

      reply.status(200).send(omit(result, "scrapeResults"));
    },
  },
  {
    method: "POST",
    url: "/collections",
    schema: {
      body: { $ref: "https://webscraper.figedi.com/schemas/collection-post.json" },
    },
    handler: async (request: any, reply) => {
      const result = await coffeeScraperService.saveCollection({ ...request.body, id: request.body.id ?? uuid() });

      reply.status(200).send(omit(result, "scrapeResults"));
    },
  },
];
