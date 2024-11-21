import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class VectorService {
  weaponReportsCollection = 'WEAPON_REPORTS';
  private client: QdrantClient;

  constructor(configService: ConfigService) {
    this.client = new QdrantClient({
      url: configService.get<string>('QDRANT_URL'),
      apiKey: configService.get<string>('QDRANT_API_KEY')
    });
  }

  async addPoints(
    collectionName: string,
    points: { id: string; vector: number[]; payload: Record<string, unknown> }[]
  ): Promise<void> {
    await this.client.upsert(collectionName, { points });
  }

  async deleteAllPoints(collectionName: string): Promise<void> {
    await this.client.delete(collectionName, { filter: {} });
  }

  async initializeCollections(): Promise<void> {
    const collections = (await this.client.getCollections()).collections;
    await this.initializeWeaponReportsCollection(collections);
  }

  private async initializeWeaponReportsCollection(collections: { name: string }[]): Promise<void> {
    if (collections.some(collection => collection.name === this.weaponReportsCollection)) return;
    await this.client.createCollection(this.weaponReportsCollection, {
      vectors: { size: 1024, distance: 'Cosine' }
    });
  }
}
