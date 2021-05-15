import axios from "axios";
import cheerio from "cheerio";
import { flatten } from "lodash";
import { IScraper, ScrapeStatus } from "../../lib/base/types";

export class EspressoPerfettoScraper implements IScraper {
  public name = "EspressoPerfetto";

  private baseUrl = "https://espressoperfetto.de";

  private secondGradeUrl = `${this.baseUrl}/B-WARE`;

  private blowoutSaleUrl = `${this.baseUrl}/Ausverkauf`;

  private async scrapeBWare() {
    const { data } = await axios.get(this.secondGradeUrl);

    const rawProducts = cheerio(".product-wrapper", data).toArray();

    return Promise.all(
      rawProducts.map(async prodItem => {
        let url = cheerio(".image-wrapper", prodItem).attr("href");
        if (!url) {
          url = cheerio(".title > a", prodItem).attr("href");
        }
        const imageUrl = cheerio(".image-wrapper img", prodItem).attr("data-src");
        const title = cheerio(".caption .title a", prodItem).html()!;
        const price = cheerio(".price_wrapper .price > span:first", prodItem).text();

        return {
          url: url?.startsWith(this.baseUrl) ? url : `${this.baseUrl}/${url}`,
          imageUrl: `${this.baseUrl}/${imageUrl}`,
          title,
          price: parseFloat(price),
        };
      }),
    );
  }

  private async scrapeAusverkauf() {
    const { data } = await axios.get(this.blowoutSaleUrl);

    const rawProducts = cheerio(".product-wrapper", data).toArray();

    return Promise.all(
      rawProducts.map(async prodItem => {
        let url = cheerio(".image-wrapper", prodItem).attr("href");
        if (!url) {
          url = cheerio(".title > a", prodItem).attr("href");
        }
        const imageUrl = cheerio(".image-wrapper img", prodItem).attr("data-src");
        const title = cheerio(".caption .title a", prodItem).html()!;
        const price = cheerio(".price_wrapper .price > span:first", prodItem).text();

        return {
          url: url?.startsWith(this.baseUrl) ? url : `${this.baseUrl}/${url}`,
          imageUrl: `${this.baseUrl}/${imageUrl}`,
          title,
          price: parseFloat(price),
        };
      }),
    );
  }

  public async scrape() {
    const scrapeResults = await Promise.all([this.scrapeBWare(), this.scrapeAusverkauf()]);

    return {
      providerName: this.name,
      data: flatten(scrapeResults),
      status: ScrapeStatus.OK,
    };
  }
}
