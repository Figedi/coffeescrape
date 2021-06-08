import axios from "axios";
import cheerio from "cheerio";
import { flatten } from "lodash";
import { IScraper, IScrapeResult, ScrapeStatus } from "../../lib/base/types";

export class BarestaScraper implements IScraper {
  public name = "Baresta";

  private baseUrl = "https://www.baresta.com";

  private shopGradeUrl = `${this.baseUrl}/sale-sale-lost-and-found/`;

  private async scrapeForUrl(url: string): Promise<IScrapeResult[]> {
    const { data } = await axios.get(url);

    const rawProducts = cheerio(".product-item", data).toArray();

    return rawProducts.map(prodItem => {
      const prodUrl = cheerio(".product-image-link", prodItem).attr("href");
      const title = cheerio(".product-name > span ", prodItem).html()?.trim();
      const imageUrl = cheerio(".product-image-link > img", prodItem).attr("src");
      const price = cheerio(".product_price_discount", prodItem).text();

      const brand = cheerio("span", title).text();
      const desc = cheerio(title).text();

      return {
        url: prodUrl,
        imageUrl: `${this.baseUrl}${imageUrl}`,
        title: `${brand.trim()} ${desc.replace(new RegExp(brand, "g"), "").trim()}`.toLowerCase(),
        price: parseFloat(price),
      };
    });
  }

  public async scrape() {
    const results = await Promise.all([this.scrapeForUrl(this.shopGradeUrl)]);

    return {
      providerName: this.name,
      data: flatten(results),
      status: ScrapeStatus.OK,
    };
  }
}
