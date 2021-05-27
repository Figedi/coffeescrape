import axios from "axios";
import cheerio from "cheerio";

import { IScraper, ScrapeStatus } from "../../lib/base/types";

export class MoemaScraper implements IScraper {
  public name = "Moema";

  private baseUrl = "https://www.moema-espresso.com";

  private secondGradeUrl = `${this.baseUrl}/sonderangebote/bware`;

  public async scrape() {
    const { data } = await axios.get(this.secondGradeUrl);

    const rawProducts = cheerio(".products-grid", data).children().toArray();

    const parsed = rawProducts.map(prodItem => {
      const url = cheerio("a.actions", prodItem).attr("href");
      const imageUrl = cheerio("img", prodItem).attr("src");
      const title = cheerio(".product-name > a", prodItem).html()!;
      const price = cheerio(".price-box .price", prodItem).text();

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
