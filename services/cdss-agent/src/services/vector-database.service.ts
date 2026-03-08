import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config';
import { MedicalDocument, VectorSearchResult, RAGQuery } from '../types';

/**
 * Vector Database Service for Medical Knowledge Base
 * Manages embeddings and semantic search using Pinecone
 */
export class VectorDatabaseService {
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: config.pinecone.apiKey,
      environment: config.pinecone.environment
    });
    this.indexName = config.pinecone.indexName;
  }

  /**
   * Initialize the vector database index
   */
  async initialize(): Promise<void> {
    try {
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some(idx => idx.name === this.indexName);

      if (!indexExists) {
        console.log(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // OpenAI ada-002 or AWS Titan embeddings dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-west-2'
            }
          }
        });
        console.log('Index created successfully');
      } else {
        console.log(`Index ${this.indexName} already exists`);
      }
    } catch (error) {
      console.error('Error initializing vector database:', error);
      throw error;
    }
  }

  /**
   * Store a medical document with its embedding
   */
  async storeDocument(document: MedicalDocument, embedding: number[]): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      await index.upsert([{
        id: document.id,
        values: embedding,
        metadata: {
          title: document.title,
          source: document.source,
          content: document.content.substring(0, 40000), // Pinecone metadata limit
          specialty: document.metadata.specialty || '',
          publicationDate: document.metadata.publicationDate || '',
          authors: document.metadata.authors?.join(', ') || '',
          journal: document.metadata.journal || '',
          doi: document.metadata.doi || '',
          pmid: document.metadata.pmid || '',
          keywords: document.metadata.keywords?.join(', ') || ''
        }
      }]);

      console.log(`Stored document: ${document.id}`);
    } catch (error) {
      console.error('Error storing document:', error);
      throw error;
    }
  }

  /**
   * Store multiple documents in batch
   */
  async storeBatch(documents: Array<{ document: MedicalDocument; embedding: number[] }>): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      const vectors = documents.map(({ document, embedding }) => ({
        id: document.id,
        values: embedding,
        metadata: {
          title: document.title,
          source: document.source,
          content: document.content.substring(0, 40000),
          specialty: document.metadata.specialty || '',
          publicationDate: document.metadata.publicationDate || '',
          authors: document.metadata.authors?.join(', ') || '',
          journal: document.metadata.journal || '',
          doi: document.metadata.doi || '',
          pmid: document.metadata.pmid || '',
          keywords: document.metadata.keywords?.join(', ') || ''
        }
      }));

      // Pinecone batch upsert limit is 100
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
        console.log(`Stored batch ${i / batchSize + 1} of ${Math.ceil(vectors.length / batchSize)}`);
      }
    } catch (error) {
      console.error('Error storing batch:', error);
      throw error;
    }
  }

  /**
   * Search for similar documents using vector similarity
   */
  async search(query: RAGQuery, queryEmbedding: number[]): Promise<VectorSearchResult[]> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      // Build filter
      const filter: any = {};
      if (query.filter?.source && query.filter.source.length > 0) {
        filter.source = { $in: query.filter.source };
      }
      if (query.filter?.specialty && query.filter.specialty.length > 0) {
        filter.specialty = { $in: query.filter.specialty };
      }

      const searchResults = await index.query({
        vector: queryEmbedding,
        topK: query.topK || 10,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        includeMetadata: true
      });

      const results: VectorSearchResult[] = searchResults.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        document: {
          id: match.id,
          title: (match.metadata?.title as string) || '',
          content: (match.metadata?.content as string) || '',
          source: (match.metadata?.source as any) || 'pubmed',
          metadata: {
            authors: (match.metadata?.authors as string)?.split(', ').filter(Boolean) || [],
            publicationDate: (match.metadata?.publicationDate as string) || '',
            journal: (match.metadata?.journal as string) || '',
            doi: (match.metadata?.doi as string) || '',
            pmid: (match.metadata?.pmid as string) || '',
            specialty: (match.metadata?.specialty as string) || '',
            keywords: (match.metadata?.keywords as string)?.split(', ').filter(Boolean) || []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })) || [];

      return results;
    } catch (error) {
      console.error('Error searching vector database:', error);
      throw error;
    }
  }

  /**
   * Delete a document from the vector database
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteOne(documentId);
      console.log(`Deleted document: ${documentId}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get statistics about the vector database
   */
  async getStats(): Promise<any> {
    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
}
