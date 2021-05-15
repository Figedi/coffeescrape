import { MongoClient, ObjectId } from "mongodb";
import { IScrapeCollection } from "../lib/base/types";

export class ScraperStore {
  private client!: MongoClient;

  constructor(connectionUri: string, private dbName: string, private collectionName: string) {
    this.client = new MongoClient(connectionUri, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  public async preflight() {
    await this.client.connect();
  }

  public async shutdown() {
    await this.client.close();
  }

  public async getCollectionById(collectionId: number | string): Promise<IScrapeCollection | undefined> {
    if (typeof collectionId === "string") {
      return this.client
        .db(this.dbName)
        .collection(this.collectionName)
        .findOne({ id: { $eq: collectionId } });
    }
    return this.client
      .db(this.dbName)
      .collection(this.collectionName)
      .findOne({ _id: new ObjectId(collectionId) });
  }

  public async upsertCollection(collection: IScrapeCollection) {
    let insertableCollection = collection;
    if (insertableCollection.id) {
      const dbCollection = await await this.client
        .db(this.dbName)
        .collection(this.collectionName)
        .findOne({ id: { $eq: collection.id } });

      insertableCollection = { ...dbCollection, ...collection };
    }
    const result = await this.client
      .db(this.dbName)
      .collection(this.collectionName)
      .replaceOne({ id: { $eq: insertableCollection.id } }, insertableCollection, { upsert: true });

    return { ...insertableCollection, _id: result.upsertedId };
  }
}
