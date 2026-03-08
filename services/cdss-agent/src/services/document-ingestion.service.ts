import axios from 'axios';
import { config } from '../config';
import { MedicalDocument } from '../types';
import { EmbeddingService } from './embedding.service';
import { VectorDatabaseService } from './vector-database.service';

/**
 * Document Ingestion Service
 * Fetches medical literature from PubMed and other sources,
 * generates embeddings, and stores in vector database
 */
export class DocumentIngestionService {
  private embeddingService: EmbeddingService;
  private vectorDbService: VectorDatabaseService;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.vectorDbService = new VectorDatabaseService();
  }

  /**
   * Search PubMed for articles
   */
  async searchPubMed(query: string, maxResults: number = 100): Promise<string[]> {
    try {
      const searchUrl = `${config.pubmed.baseUrl}/esearch.fcgi`;
      const params = {
        db: 'pubmed',
        term: query,
        retmax: maxResults,
        retmode: 'json',
        api_key: config.pubmed.apiKey
      };

      const response = await axios.get(searchUrl, { params });
      const pmids = response.data.esearchresult?.idlist || [];
      
      console.log(`Found ${pmids.length} PubMed articles for query: ${query}`);
      return pmids;
    } catch (error) {
      console.error('Error searching PubMed:', error);
      throw error;
    }
  }

  /**
   * Fetch article details from PubMed
   */
  async fetchPubMedArticles(pmids: string[]): Promise<MedicalDocument[]> {
    try {
      const fetchUrl = `${config.pubmed.baseUrl}/efetch.fcgi`;
      const params = {
        db: 'pubmed',
        id: pmids.join(','),
        retmode: 'xml',
        api_key: config.pubmed.apiKey
      };

      const response = await axios.get(fetchUrl, { params });
      const xmlData = response.data;

      // Parse XML and extract article information
      // This is a simplified version - in production, use a proper XML parser
      const documents: MedicalDocument[] = pmids.map((pmid, index) => ({
        id: `pubmed_${pmid}`,
        title: this.extractFromXML(xmlData, 'ArticleTitle', index) || 'Unknown Title',
        content: this.extractFromXML(xmlData, 'AbstractText', index) || 'No abstract available',
        source: 'pubmed' as const,
        metadata: {
          pmid,
          authors: this.extractAuthorsFromXML(xmlData, index),
          publicationDate: this.extractFromXML(xmlData, 'PubDate', index),
          journal: this.extractFromXML(xmlData, 'Title', index),
          doi: this.extractFromXML(xmlData, 'ELocationID', index),
          keywords: this.extractKeywordsFromXML(xmlData, index)
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      console.log(`Fetched ${documents.length} PubMed articles`);
      return documents;
    } catch (error) {
      console.error('Error fetching PubMed articles:', error);
      throw error;
    }
  }

  /**
   * Ingest documents into the knowledge base
   */
  async ingestDocuments(documents: MedicalDocument[]): Promise<void> {
    try {
      console.log(`Ingesting ${documents.length} documents...`);

      // Generate embeddings for all documents
      const texts = documents.map(doc => `${doc.title}\n\n${doc.content}`);
      const embeddings = await this.embeddingService.generateBatchEmbeddings(texts);

      // Store documents with embeddings in vector database
      const documentsWithEmbeddings = documents.map((doc, index) => ({
        document: doc,
        embedding: embeddings[index]
      }));

      await this.vectorDbService.storeBatch(documentsWithEmbeddings);

      console.log(`Successfully ingested ${documents.length} documents`);
    } catch (error) {
      console.error('Error ingesting documents:', error);
      throw error;
    }
  }

  /**
   * Ingest medical guidelines
   */
  async ingestGuidelines(guidelines: Array<{ title: string; content: string; organization: string; url: string }>): Promise<void> {
    try {
      const documents: MedicalDocument[] = guidelines.map((guideline, index) => ({
        id: `guideline_${Date.now()}_${index}`,
        title: guideline.title,
        content: guideline.content,
        source: 'guideline' as const,
        metadata: {
          specialty: this.extractSpecialtyFromTitle(guideline.title),
          keywords: this.extractKeywordsFromText(guideline.content)
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await this.ingestDocuments(documents);
      console.log(`Ingested ${guidelines.length} guidelines`);
    } catch (error) {
      console.error('Error ingesting guidelines:', error);
      throw error;
    }
  }

  /**
   * Ingest from PubMed by search query
   */
  async ingestFromPubMed(query: string, maxResults: number = 100): Promise<void> {
    try {
      const pmids = await this.searchPubMed(query, maxResults);
      
      if (pmids.length === 0) {
        console.log('No articles found for query');
        return;
      }

      // Fetch in batches to avoid overwhelming the API
      const batchSize = 20;
      for (let i = 0; i < pmids.length; i += batchSize) {
        const batch = pmids.slice(i, i + batchSize);
        const documents = await this.fetchPubMedArticles(batch);
        await this.ingestDocuments(documents);
        
        // Rate limiting - wait 1 second between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`Completed ingestion from PubMed for query: ${query}`);
    } catch (error) {
      console.error('Error ingesting from PubMed:', error);
      throw error;
    }
  }

  // Helper methods for XML parsing (simplified)
  private extractFromXML(xml: string, tag: string, index: number): string {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'g');
    const matches = xml.match(regex);
    if (matches && matches[index]) {
      return matches[index].replace(/<[^>]*>/g, '').trim();
    }
    return '';
  }

  private extractAuthorsFromXML(xml: string, index: number): string[] {
    // Simplified author extraction
    const authorRegex = /<Author[^>]*>.*?<LastName>([^<]*)<\/LastName>.*?<ForeName>([^<]*)<\/ForeName>.*?<\/Author>/gs;
    const matches = [...xml.matchAll(authorRegex)];
    return matches.slice(index * 5, (index + 1) * 5).map(match => `${match[2]} ${match[1]}`);
  }

  private extractKeywordsFromXML(xml: string, index: number): string[] {
    const keywordRegex = /<Keyword[^>]*>([^<]*)<\/Keyword>/g;
    const matches = xml.match(keywordRegex);
    if (matches) {
      return matches.slice(index * 10, (index + 1) * 10).map(kw => kw.replace(/<[^>]*>/g, '').trim());
    }
    return [];
  }

  private extractSpecialtyFromTitle(title: string): string {
    const specialties = ['cardiology', 'neurology', 'oncology', 'pediatrics', 'surgery', 'psychiatry'];
    const lowerTitle = title.toLowerCase();
    for (const specialty of specialties) {
      if (lowerTitle.includes(specialty)) {
        return specialty;
      }
    }
    return 'general';
  }

  private extractKeywordsFromText(text: string): string[] {
    // Simple keyword extraction - in production, use NLP techniques
    const words = text.toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    const keywords = words.filter(word => word.length > 4 && !commonWords.has(word));
    return [...new Set(keywords)].slice(0, 10);
  }
}
