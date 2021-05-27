import axios from "axios";
import cheerio from "cheerio";
import { IScraper, ScrapeStatus } from "../../lib/base/types";

export class KaffeetechnikShopScraper implements IScraper {
  public name = "KaffeetechnikShop";

  private baseUrl = "https://www.kaffeetechnik-shop.de";

  private secondGradeUrl = `${this.baseUrl}/siebtraeger__gebrauchtgeraete-gebraucht`;

  public async scrape() {
    const { data } = await axios.get(this.secondGradeUrl);

    const rawProducts = cheerio(".product-wrapper", data).toArray();

    const parsed = rawProducts.map(prodItem => {
      const url = cheerio("a.image-wrapper", prodItem).attr("href");
      const imageUrl = cheerio(".image-content > img", prodItem).attr("data-src");
      const title = cheerio(".caption > .title > a", prodItem).html()?.trim();
      const price = cheerio(".price_wrapper_uebersicht > .price > span", prodItem).text();

      return {
        url: `${this.baseUrl}/${url}`,
        imageUrl: `${this.baseUrl}/${imageUrl}`,
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
