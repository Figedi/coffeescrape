export enum ScrapeStatus {
  OK = "OK",
  FAILED = "FAILED",
}
export interface IScrapeResult {
  imageUrl?: string;
  price?: number;
  title?: string;
  url?: string;
  description?: string;
  raw?: string;

  createdAt?: Date | string;
}

export interface IScrapeResponse {
  providerName: string;
  data: IScrapeResult[];
  status: ScrapeStatus;
}

export interface IScraper {
  name: string;
  scrape: () => Promise<IScrapeResponse>;
}

export interface IScrapeCollection {
  id?: string;
  keywords: string[];
  scrapers: string[];
  active: boolean;
  publishingActive: boolean;

  scrapeResults: Record<string, IScrapeResult[]>;
}

// ========== helpers

export enum PublishStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export interface IPublisher {
  publish: (data: Record<string, IScrapeResult[]>) => Promise<PublishStatus>;
}
