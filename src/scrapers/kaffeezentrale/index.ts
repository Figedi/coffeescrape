import axios from "axios";
import cheerio from "cheerio";
import { IScraper, ScrapeStatus } from "../../lib/base/types";

export class KaffeeZentraleScraper implements IScraper {
  public name = "KaffeeZentrale";

  private baseUrl = "https://www.kaffeezentrale.de";

  private secondGradeUrl = `${this.baseUrl}/maschinen/b-ware/`;

  public async scrape() {
    const { data } = await axios.get(this.secondGradeUrl);

    const rawProducts = cheerio(".listing", data).children().toArray();

    const parsed = rawProducts.map(prodItem => {
      const url = cheerio(".overall-link", prodItem).attr("href");
      const imageUrl = cheerio(".product--info picture > img", prodItem).attr("data-srcset")?.split(",")?.[0];
      const title = cheerio(".product--info .product--title", prodItem).html()?.trim();
      const description = cheerio(".product--info .teaser-text:last", prodItem).html()!;
      const price = cheerio(".product--info .product--price > .price--default", prodItem).text();

      return {
        url,
        imageUrl,
        title,
        description,
        price: parseFloat(price),
      };
    });

    return {
      providerName: this.name,
      data: parsed,
      status: ScrapeStatus.OK,
    };
  }
}
