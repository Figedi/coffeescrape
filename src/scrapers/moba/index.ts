import axios from "axios";
import cheerio from "cheerio";
import { flatten } from "lodash";
import { IScraper, ScrapeStatus } from "../../lib/base/types";

export class MobaScraper implements IScraper {
  public name = "Moba";

  private baseUrl = "https://www.mobacoffee.de";

  private secondGradeUrl = `${this.baseUrl}/Sale-Retouren`;

  private shopUrl = `${this.baseUrl}/Sale-Ausstellungsstuecke`;

  private specialSaleUrl = `${this.baseUrl}/Sale-Sonderangebote`;

  private async scrapeRetouren() {
    const { data } = await axios.get(this.secondGradeUrl);

    const rawProducts = cheerio(".product-wrapper", data).toArray();

    return Promise.all(
      rawProducts.map(async prodItem => {
        const url = cheerio(".image-wrapper", prodItem).attr("href");
        const imageUrl = cheerio(".image-wrapper .image-content img", prodItem).attr("data-src");
        const title = cheerio(".caption .title > a", prodItem).html()!;
        const price = cheerio(".price_wrapper > .price > span:first", prodItem).text();

        return {
          url: `${this.baseUrl}/${url}`,
          imageUrl: `${this.baseUrl}/${imageUrl}`,
          title,
          price: parseFloat(price),
        };
      }),
    );
  }

  private async scrapeAusstellungsStücke() {
    const { data } = await axios.get(this.shopUrl);

    const rawProducts = cheerio(".product-wrapper", data).toArray();

    return Promise.all(
      rawProducts.map(async prodItem => {
        const url = cheerio(".image-wrapper", prodItem).attr("href");
        const imageUrl = cheerio(".image-wrapper .image-content img", prodItem).attr("data-src");
        const title = cheerio(".caption .title > a", prodItem).html()!;
        const price = cheerio(".price_wrapper > .price > span:first", prodItem).text();

        return {
          url: `${this.baseUrl}/${url}`,
          imageUrl: `${this.baseUrl}/${imageUrl}`,
          title,
          price: parseFloat(price),
        };
      }),
    );
  }

  private async scrapeSale() {
    const { data } = await axios.get(this.specialSaleUrl);

    const rawProducts = cheerio(".product-wrapper", data).toArray();

    return Promise.all(
      rawProducts.map(async prodItem => {
        const imageUrl = cheerio(".image-wrapper .image-content img", prodItem).attr("data-src");
        const title = cheerio(".caption .title > a", prodItem).html()!;
        const price = cheerio(".price_wrapper > .price > span:first", prodItem).text();

        return {
          imageUrl: `${this.baseUrl}/${imageUrl}`,
          title,
          price: parseFloat(price),
        };
      }),
    );
  }

  public async scrape() {
    const scrapeResults = await Promise.all([
      this.scrapeAusstellungsStücke(),
      this.scrapeRetouren(),
      this.scrapeSale(),
    ]);

    return {
      providerName: this.name,
      data: flatten(scrapeResults),
      status: ScrapeStatus.OK,
    };
  }
}
