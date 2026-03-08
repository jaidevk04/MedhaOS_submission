import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config';
import { RAGQuery, RAGResponse, VectorSearchResult } from '../types';
import { EmbeddingService } from './embedding.service';
import { VectorDatabaseService } from './vector-database.service';

/**
 * Retrieval-Augmented Generation (RAG) Service
 * Combines vector search with LLM generation for medical literature queries
 */
export class RAGService {
  private embeddingService: EmbeddingService;
  private vectorDbService: VectorDatabaseService;
  private bedrockClient: BedrockRuntimeClient;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.vectorDbService = new VectorDatabaseService();
    this.bedrockClient = new BedrockRuntimeClient({
      region: config.aws.region,
      credentials: config.aws.accessKeyId && config.aws.secretAccessKey ? {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      } : undefined
    });
  }

  /**
   * Perform RAG query: retrieve relevant documents and generate summary
   */
  async query(ragQuery: RAGQuery): Promise<RAGResponse> {
    try {
      const startTime = Date.now();

      // Step 1: Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(ragQuery.query);

      // Step 2: Search vector database for relevant documents
      const searchResults = await this.vectorDbService.search(ragQuery, queryEmbedding);

      if (searchResults.length === 0) {
        return {
          query: ragQuery.query,
          results: [],
          summary: 'No relevant medical literature found for this query.',
          sources: [],
          confidence: 0
        };
      }

      // Step 3: Prepare context from retrieved documents
      const context = this.prepareContext(searchResults);

      // Step 4: Generate summary using LLM
      const summary = await this.generateSummary(ragQuery.query, context);

      // Step 5: Extract sources
      const sources = this.extractSources(searchResults);

      // Step 6: Calculate confidence based on relevance scores
      const confidence = this.calculateConfidence(searchResults);

      const processingTime = Date.now() - startTime;
      console.log(`RAG query completed in ${processingTime}ms`);

      return {
        query: ragQuery.query,
        results: searchResults,
        summary,
        sources,
        confidence
      };
    } catch (error) {
      console.error('Error in RAG query:', error);
      throw error;
    }
  }

  /**
   * Prepare context from search results for LLM
   */
  private prepareContext(results: VectorSearchResult[]): string {
    const contextParts = results.slice(0, 5).map((result, index) => {
      const doc = result.document;
      return `
[Document ${index + 1}] (Relevance: ${(result.score * 100).toFixed(1)}%)
Title: ${doc.title}
Source: ${doc.source}
${doc.metadata.journal ? `Journal: ${doc.metadata.journal}` : ''}
${doc.metadata.publicationDate ? `Date: ${doc.metadata.publicationDate}` : ''}
Content: ${doc.content.substring(0, 1000)}...
      `.trim();
    });

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * Generate summary using Claude via Bedrock
   */
  private async generateSummary(query: string, context: string): Promise<string> {
    try {
      const prompt = `You are a medical AI assistant helping clinicians with evidence-based information.

User Query: ${query}

Relevant Medical Literature:
${context}

Based on the above medical literature, provide a comprehensive, evidence-based answer to the query. Include:
1. Direct answer to the question
2. Key findings from the literature
3. Clinical recommendations
4. Any important caveats or limitations

Keep the response concise but thorough, suitable for a practicing clinician.`;

      const input = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.9
      };

      const command = new InvokeModelCommand({
        modelId: config.bedrock.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(input)
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.content[0].text;
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Unable to generate summary at this time.';
    }
  }

  /**
   * Extract source citations from search results
   */
  private extractSources(results: VectorSearchResult[]): string[] {
    return results.slice(0, 5).map(result => {
      const doc = result.document;
      const authors = doc.metadata.authors?.slice(0, 3).join(', ') || 'Unknown';
      const year = doc.metadata.publicationDate?.substring(0, 4) || 'n.d.';
      const journal = doc.metadata.journal || doc.source;
      
      let citation = `${authors} (${year}). ${doc.title}. ${journal}.`;
      
      if (doc.metadata.doi) {
        citation += ` DOI: ${doc.metadata.doi}`;
      } else if (doc.metadata.pmid) {
        citation += ` PMID: ${doc.metadata.pmid}`;
      }
      
      return citation;
    });
  }

  /**
   * Calculate confidence score based on relevance scores
   */
  private calculateConfidence(results: VectorSearchResult[]): number {
    if (results.length === 0) return 0;

    // Average of top 3 results, weighted by position
    const topResults = results.slice(0, 3);
    const weights = [0.5, 0.3, 0.2];
    
    let weightedSum = 0;
    let totalWeight = 0;

    topResults.forEach((result, index) => {
      const weight = weights[index] || 0.1;
      weightedSum += result.score * weight;
      totalWeight += weight;
    });

    const confidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
    return Math.min(Math.max(confidence, 0), 1); // Clamp between 0 and 1
  }

  /**
   * Search medical literature with natural language query
   */
  async searchLiterature(query: string, options?: {
    topK?: number;
    specialty?: string[];
    source?: string[];
  }): Promise<RAGResponse> {
    const ragQuery: RAGQuery = {
      query,
      topK: options?.topK || 10,
      filter: {
        specialty: options?.specialty,
        source: options?.source
      }
    };

    return this.query(ragQuery);
  }

  /**
   * Get clinical recommendations for a specific condition
   */
  async getClinicalRecommendations(condition: string, patientContext?: string): Promise<RAGResponse> {
    const query = patientContext
      ? `Clinical management recommendations for ${condition} in a patient with: ${patientContext}`
      : `Evidence-based clinical management recommendations for ${condition}`;

    return this.searchLiterature(query, {
      topK: 10,
      source: ['guideline', 'pubmed']
    });
  }

  /**
   * Get drug information and evidence
   */
  async getDrugInformation(drugName: string, indication?: string): Promise<RAGResponse> {
    const query = indication
      ? `${drugName} for ${indication}: efficacy, safety, dosing, and clinical evidence`
      : `${drugName}: mechanism of action, indications, contraindications, and clinical evidence`;

    return this.searchLiterature(query, {
      topK: 8,
      specialty: ['pharmacology']
    });
  }
}
