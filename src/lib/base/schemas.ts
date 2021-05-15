export const scrapeResultSchema = {
  $id: "https://webscraper.figedi.com/schemas/scrape-result.json",
  type: "object",
  properties: {
    imageUrl: { type: "string" },
    price: { type: "number", minimum: 0.01 },
    title: { type: "string" },
    url: { type: "string" },
    description: { type: "string" },
    raw: { type: "string" },
    createdAt: { type: "string" },
  },
  required: ["raw"],
};

export const collectionSchema = {
  $id: "https://webscraper.figedi.com/schemas/collection.json",
  type: "object",
  properties: {
    id: { type: "string" },
    keywords: { type: "array", items: { type: "string" }, minItems: 1 },
    scrapers: { type: "array", items: { type: "string" }, minItems: 1 },
    active: { type: "boolean" },
    publishingActive: { type: "boolean" },

    scrapeResults: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: scrapeResultSchema,
      },
      required: [],
    },
  },
  required: ["keywords", "scrapers", "publishingActive"],
};

export const postCollectionSchema = {
  ...collectionSchema,
  $id: "https://webscraper.figedi.com/schemas/collection-post.json",
  required: ["keywords", "scrapers", "active", "publishingActive"],
};

export const patchCollectionSchema = {
  ...collectionSchema,
  $id: "https://webscraper.figedi.com/schemas/collection-patch.json",
  required: [],
  minProperties: 1,
};
