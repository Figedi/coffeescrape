import { flatten } from "lodash";
import TelegramBot from "node-telegram-bot-api";
import { IPublisher, IScrapeResult, PublishStatus } from "../../lib/base/types";

export class TelegramPublisher implements IPublisher {
  private bot!: TelegramBot;

  constructor(apiToken: string, private targetUserId: string) {
    this.bot = new TelegramBot(apiToken);
  }

  private sanitizeString(str: string): string {
    return str.replace(/\|/g, "").replace(/-/g, "").replace(/\./g, ",").replace(/\+/g, "").trim();
  }

  private sendMessage = async (message: string): Promise<TelegramBot.Message> =>
    this.bot.sendMessage(this.targetUserId, message, { parse_mode: "MarkdownV2" });

  private sendProvider = async (providerName: string, results: IScrapeResult[]): Promise<void> => {
    await this.sendMessage(`🛍 Provider ${providerName}:\n`);
    for (const result of results) {
      await this.bot.sendPhoto(this.targetUserId, result.imageUrl!, {
        caption: [
          this.sanitizeString(result.title || "[no title]"),
          `${result.price?.toString().replace(".", ",")}€`,
        ].join("\n"),
        parse_mode: "MarkdownV2",
      });
    }
  };

  private sendProviderResponses = async (providers: Record<string, IScrapeResult[]>): Promise<void> => {
    const providersWithResults = Object.entries(providers).reduce(
      (acc, [provider, results]) => (results.length ? { ...acc, [provider]: results } : acc),
      {} as Record<string, IScrapeResult[]>,
    );
    const allResults = flatten(Object.values(providersWithResults));
    if (!allResults.length) {
      return;
    }

    await this.sendMessage(
      `☕️ The coffeebot© found ${allResults.length} new offers for ${
        Object.keys(providersWithResults).length
      } providers:`,
    );
    for (const [providerName, results] of Object.entries(providersWithResults)) {
      await this.sendProvider(providerName, results);
    }
  };

  public async publish(data: Record<string, IScrapeResult[]>): Promise<PublishStatus> {
    await this.sendProviderResponses(data);

    return PublishStatus.SUCCESS;
  }
}
