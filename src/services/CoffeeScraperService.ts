import { differenceBy, fromPairs, isNil, mapValues } from "lodash";
import { IPublisher, IScrapeCollection, IScraper, IScrapeResult, ScrapeStatus } from "../lib/base/types";
import { ScraperStore } from "../stores/scraperStore";

export class CoffeeScraperService {
  constructor(private publisher: IPublisher, private store: ScraperStore, private scrapers: IScraper[]) {}

  private get emptyScrapeResults(): Record<string, IScrapeResult[]> {
    return this.scrapers.reduce((acc, scraper) => ({ ...acc, [scraper.name]: [] }), {});
  }

  private filterScrapeResults(collection: IScrapeCollection, results: IScrapeResult[]): IScrapeResult[] {
    if (!collection.keywords?.length) {
      return results;
    }

    return results.filter(result => {
      const searchVal = result.title || result.url;
      if (!searchVal) {
        return true;
      }
      return collection.keywords.some(keyword => searchVal.toLowerCase().includes(keyword.toLowerCase()));
    });
  }

  public async saveCollection(coll: IScrapeCollection): Promise<IScrapeCollection> {
    let insertableCollection = coll;
    if (insertableCollection.scrapers?.[0] === "all") {
      insertableCollection = { ...insertableCollection, scrapers: this.scrapers.map(s => s.name) };
    }
    return this.store.upsertCollection(insertableCollection);
  }

  public async scrapeAndPublish(collectionId: number): Promise<IScrapeCollection> {
    const collection = await this.store.getCollectionById(collectionId);
    if (!collection) {
      throw new Error(`Did not find a collection by id ${collectionId}`);
    }
    const collectionScrapers = collection.scrapers.map(s => [s, this.scrapers.find(scrpr => scrpr.name === s)]);
    if (collectionScrapers.some(([, scrpr]) => isNil(scrpr))) {
      throw new Error("Not all scrapers from collection available. This should not happen :/");
    }

    if (!collection.active) {
      throw new Error("Scrape is not set to active, cannot publish");
    }

    const rawScrapeResults = await Promise.all(
      collectionScrapers.map(([, scraper]) => (scraper as IScraper)!.scrape()),
    );

    const faultyScrapeResults = rawScrapeResults.filter(result => result.status === ScrapeStatus.FAILED);
    if (faultyScrapeResults.length) {
      throw new Error(
        `Not all scrapers returned 'OK', please verify the scrapers '${faultyScrapeResults
          .map(s => s.providerName)
          .join(",")}'`,
      );
    }
    const rawScrapeResultsByProvider = fromPairs(rawScrapeResults.map(s => [s.providerName, s.data])) as Record<
      string,
      IScrapeResult[]
    >;

    // outputs new and total results (diffing)
    const newScrapeResults = Object.entries({ ...this.emptyScrapeResults, ...(collection.scrapeResults || {}) }).reduce(
      (acc, [providerName, existingScrapeResults]) => {
        const providerRawResults = rawScrapeResultsByProvider[providerName];

        if (!providerRawResults || !providerRawResults.length) {
          return { ...acc, [providerName]: { totalResults: existingScrapeResults, newResults: [] } };
        }
        const newResults = differenceBy(providerRawResults, existingScrapeResults, r => r.url);
        const filteredResults = this.filterScrapeResults(collection, newResults);
        return {
          ...acc,
          [providerName]: { newResults: filteredResults, totalResults: [...existingScrapeResults, ...filteredResults] },
        };
      },
      {} as Record<string, { newResults: IScrapeResult[]; totalResults: IScrapeResult[] }>,
    );

    // if enabled, publishes to a publisher
    const scrapeResultsWithNewValues = mapValues(newScrapeResults, r => r.newResults);
    if (collection.publishingActive) {
      await this.publisher.publish(scrapeResultsWithNewValues);
    }

    // saves the total result-set in the store for later diffing
    await this.store.upsertCollection({
      ...collection,
      scrapeResults: mapValues(newScrapeResults, r => r.totalResults),
    });

    // only return the new results, not the total ones
    return { ...collection, scrapeResults: scrapeResultsWithNewValues };
  }
}
