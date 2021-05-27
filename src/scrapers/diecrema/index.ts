import axios from "axios";
import cheerio from "cheerio";
import { flatten } from "lodash";
import { IScraper, IScrapeResult, ScrapeStatus } from "../../lib/base/types";

export class DiecremaScraper implements IScraper {
  public name = "Diecrema";

  private baseUrl = "https://www.diecrema.de";

  private shopGradeUrl = `${this.baseUrl}/angebote/ausstellungsmaschinen`;

  private shopSecondaryGradeUrl = `${this.baseUrl}/angebote/vorfuehrmaschinen`;

  private async scrapeForUrl(url: string): Promise<IScrapeResult[]> {
    const { data } = await axios.get(url);

    const rawProducts = cheerio(".product--box", data).toArray();

    return rawProducts.map(prodItem => {
      const prodUrl = cheerio(".product--info > a", prodItem).attr("href");
      const title = cheerio(".product--info > a", prodItem).attr("title")?.trim();
      const imageUrl = cheerio(".image--media > img", prodItem).attr("srcset")?.split(",")?.[0];
      const price = cheerio(".product--price > .price--default", prodItem).text();

      return {
        url: prodUrl,
        imageUrl,
        title,
        price: parseFloat(price),
      };
    });
  }

  public async scrape() {
    const results = await Promise.all([
      this.scrapeForUrl(this.shopGradeUrl),
      this.scrapeForUrl(this.shopSecondaryGradeUrl),
    ]);

    return {
      providerName: this.name,
      data: flatten(results),
      status: ScrapeStatus.OK,
    };
  }
}
