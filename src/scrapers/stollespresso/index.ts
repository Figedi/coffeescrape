import axios from "axios";
import cheerio from "cheerio";

import { IScraper, ScrapeStatus } from "../../lib/base/types";

export class StollEspressoScraper implements IScraper {
  public name = "Stollespresso";

  private baseUrl = "https://www.stoll-espresso.de";

  private secondGradeUrl = `${this.baseUrl}/espressomaschinen/aktionen/vorfuehrgeraete-und-gebrauchte/`;

  public async scrape() {
    const { data } = await axios.get(this.secondGradeUrl);

    const rawProducts = cheerio(".product--info", data).toArray();

    const parsed = rawProducts.map(prodItem => {
      const url = cheerio("a", prodItem).attr("href");
      const imageUrl = cheerio(".image--media > picture > img", prodItem).attr("data-srcset")?.split(",")[0];
      const title = cheerio(".product--title-heading > a > span", prodItem).text()!;
      const description = cheerio(".product--description", prodItem).html()!;
      const price = cheerio(".product--price > .price--default", prodItem).text();

      return {
        description,
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
