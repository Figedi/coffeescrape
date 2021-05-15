import axios from "axios";
import cheerio from "cheerio";
import { IScraper, ScrapeStatus } from "../../lib/base/types";

export class MccScraper implements IScraper {
  public name = "Mcc";

  private baseUrl = "https://www.mcc.ag";

  private secondGradeUrl = `${this.baseUrl}/angebote/b-ware/?p=1&o=3&n=30&f=147%7C148`;

  public async scrape() {
    const { data } = await axios.get(this.secondGradeUrl);

    const rawProducts = cheerio(".product--box", data).toArray();

    const parsed = await Promise.all(
      rawProducts.map(async prodItem => {
        const imageUrl = cheerio(".product--image img", prodItem).attr("srcset");
        const url = cheerio(".product--title", prodItem).attr("href");
        const title = cheerio(".product--title", prodItem).html()?.trim();
        const price = cheerio(".product--price > .price--default", prodItem).text();

        return {
          url,
          imageUrl,
          title,
          price: parseFloat(price),
        };
      }),
    );

    return {
      providerName: this.name,
      data: parsed,
      status: ScrapeStatus.OK,
    };
  }
}
