import axios from "axios";
import cheerio from "cheerio";
import { IScraper, ScrapeStatus } from "../../lib/base/types";

export class Kaffee24Scraper implements IScraper {
  public name = "Kaffee24";

  private baseUrl = "https://www.kaffee24.de";

  private secondGradeUrl = `${this.baseUrl}/b-ware/?p=1&o=5&n=96`;

  public async scrape() {
    const { data } = await axios.get(this.secondGradeUrl);

    const rawProducts = cheerio(".product--box", data).children().toArray();

    const parsed = rawProducts.map(prodItem => {
      const url = cheerio(".product--info > a", prodItem).attr("href");
      const imageUrl = cheerio(".image--media > img", prodItem).attr("srcset")?.split(",")?.[0];
      const title = cheerio(".product--info > a", prodItem).attr("title")?.trim();
      const price = cheerio(".product--price > .price--default", prodItem).text();

      return {
        url,
        imageUrl,
        title,
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
