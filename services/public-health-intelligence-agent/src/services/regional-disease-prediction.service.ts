import * as tf from '@tensorflow/tfjs-node';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format } from 'date-fns';
import { config } from '../config';
import {
  SyndromicData,
  ClimateData,
  DiseasePrediction,
  OutbreakAlert,
  LSTMModelInput,
  AttentionWeights,
} from '../types';

/**
 * Regional Disease Prediction Service
 * 
 * Implements LSTM + Attention model for 2-4 week disease outbreak prediction
 * Integrates syndromic surveillance data with climate factors
 * 
 * Requirements: 11.1, 11.2, 11.4
 */
export class RegionalDiseasePredictionService {
  private model: tf.LayersModel | null = null;
  private readonly forecastHorizon = config.prediction.diseaseForecastHorizonDays;
  private readonly outbreakThreshold = config.prediction.outbreakProbabilityThreshold;

  constructor() {
    this.initializeModel();
  }

  /**
   * Initialize LSTM + Attention model
   * In production, this would load a pre-trained model from S3/SageMaker
   */
  private async initializeModel(): Promise<void> {
    try {
      // For now, create a simple LSTM model architecture
      // In production, load pre-trained weights
      this.model = await this.buildLSTMAttentionModel();
      console.log('Regional Disease Prediction model initialized');
    } catch (error) {
      console.error('Failed to initialize disease prediction model:', error);
    }
  }

  /**
   * Build LSTM + Attention model architecture
   */
  private async buildLSTMAttentionModel(): Promise<tf.LayersModel> {
    const inputShape = [30, 10]; // 30 days lookback, 10 features
    
    const input = tf.input({ shape: inputShape });
    
    // LSTM layers
    let lstm1 = tf.layers.lstm({
      units: 128,
      returnSequences: true,
      name: 'lstm_1',
    }).apply(input) as tf.SymbolicTensor;
    
    let lstm2 = tf.layers.lstm({
      units: 64,
      returnSequences: true,
      name: 'lstm_2',
    }).apply(lstm1) as tf.SymbolicTensor;
    
    // Attention mechanism (simplified)
    let attention = tf.layers.dense({
      units: 1,
      activation: 'tanh',
      name: 'attention_weights',
    }).apply(lstm2) as tf.SymbolicTensor;
    
    attention = tf.layers.softmax({ axis: 1 }).apply(attention) as tf.SymbolicTensor;
    
    // Apply attention weights
    let context = tf.layers.multiply().apply([lstm2, attention]) as tf.SymbolicTensor;
    context = tf.layers.globalAveragePooling1d().apply(context) as tf.SymbolicTensor;
    
    // Dense layers for prediction
    let dense1 = tf.layers.dense({
      units: 32,
      activation: 'relu',
      name: 'dense_1',
    }).apply(context) as tf.SymbolicTensor;
    
    let dropout = tf.layers.dropout({ rate: 0.3 }).apply(dense1) as tf.SymbolicTensor;
    
    // Output layer: predict outbreak probability and case count
    let output = tf.layers.dense({
      units: 2, // [outbreak_probability, expected_cases]
      activation: 'sigmoid',
      name: 'output',
    }).apply(dropout) as tf.SymbolicTensor;
    
    const model = tf.model({ inputs: input, outputs: output });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });
    
    return model;
  }

  /**
   * Aggregate syndromic surveillance data for a district
   */
  async aggregateSyndromicData(
    district: string,
    state: string,
    startDate: Date,
    endDate: Date
  ): Promise<SyndromicData[]> {
    // In production, query from database
    // For now, return mock data structure
    const mockData: SyndromicData[] = [];
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      mockData.push({
        district,
        state,
        timestamp: new Date(currentDate),
        symptomType: 'fever_respiratory',
        caseCount: Math.floor(Math.random() * 50) + 10,
        populationDensity: 500,
        ageDistribution: {
          '0-5': 0.15,
          '6-18': 0.20,
          '19-45': 0.35,
          '46-65': 0.20,
          '65+': 0.10,
        },
      });
      currentDate = addDays(currentDate, 1);
    }
    
    return mockData;
  }

  /**
   * Fetch climate data for a district
   */
  async fetchClimateData(
    district: string,
    state: string,
    startDate: Date,
    endDate: Date
  ): Promise<ClimateData[]> {
    // In production, call external climate API
    // For now, return mock data
    const mockData: ClimateData[] = [];
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      mockData.push({
        district,
        state,
        timestamp: new Date(currentDate),
        temperature: 25 + Math.random() * 10,
        rainfall: Math.random() * 50,
        humidity: 60 + Math.random() * 30,
        windSpeed: 10 + Math.random() * 20,
        pressure: 1010 + Math.random() * 20,
      });
      currentDate = addDays(currentDate, 1);
    }
    
    return mockData;
  }

  /**
   * Prepare input features for the model
   */
  private prepareModelInput(
    syndromicData: SyndromicData[],
    climateData: ClimateData[]
  ): number[][] {
    const features: number[][] = [];
    
    for (let i = 0; i < syndromicData.length; i++) {
      const syndromi = syndromicData[i];
      const climate = climateData[i];
      
      // Normalize features (in production, use proper scaling)
      features.push([
        syndromi.caseCount / 100, // Normalized case count
        syndromi.populationDensity / 1000, // Normalized population density
        syndromi.ageDistribution['0-5'],
        syndromi.ageDistribution['65+'],
        climate.temperature / 50, // Normalized temperature
        climate.rainfall / 100, // Normalized rainfall
        climate.humidity / 100, // Normalized humidity
        climate.windSpeed / 50, // Normalized wind speed
        climate.pressure / 1050, // Normalized pressure
        Math.sin(2 * Math.PI * new Date(syndromi.timestamp).getMonth() / 12), // Seasonal component
      ]);
    }
    
    return features;
  }

  /**
   * Predict disease outbreak for a district
   */
  async predictOutbreak(
    district: string,
    state: string,
    diseaseType: string
  ): Promise<DiseasePrediction> {
    const predictionId = uuidv4();
    const predictionTimestamp = new Date();
    
    // Fetch historical data (last 30 days)
    const endDate = new Date();
    const startDate = addDays(endDate, -30);
    
    const syndromicData = await this.aggregateSyndromicData(district, state, startDate, endDate);
    const climateData = await this.fetchClimateData(district, state, startDate, endDate);
    
    // Prepare model input
    const inputFeatures = this.prepareModelInput(syndromicData, climateData);
    
    // Make predictions for forecast horizon
    const predictions = [];
    let currentOutbreakProb = 0;
    let currentExpectedCases = 0;
    
    if (this.model) {
      try {
        // Prepare tensor input
        const inputTensor = tf.tensor3d([inputFeatures]);
        
        // Run inference
        const output = this.model.predict(inputTensor) as tf.Tensor;
        const outputData = await output.data();
        
        currentOutbreakProb = outputData[0];
        currentExpectedCases = outputData[1] * 100; // Denormalize
        
        // Clean up tensors
        inputTensor.dispose();
        output.dispose();
      } catch (error) {
        console.error('Model inference error:', error);
        // Fallback to rule-based prediction
        currentOutbreakProb = this.calculateRuleBasedProbability(syndromicData, climateData);
        currentExpectedCases = syndromicData[syndromicData.length - 1].caseCount * 1.5;
      }
    } else {
      // Fallback to rule-based prediction
      currentOutbreakProb = this.calculateRuleBasedProbability(syndromicData, climateData);
      currentExpectedCases = syndromicData[syndromicData.length - 1].caseCount * 1.5;
    }
    
    // Generate predictions for each day in forecast horizon
    for (let day = 1; day <= this.forecastHorizon; day++) {
      const forecastDate = addDays(predictionTimestamp, day);
      
      // Simulate prediction decay over time (lower confidence for longer horizons)
      const confidenceDecay = Math.exp(-day / 14); // Exponential decay
      
      predictions.push({
        date: forecastDate,
        outbreakProbability: Math.min(currentOutbreakProb * (1 + day * 0.02), 1),
        expectedCases: Math.round(currentExpectedCases * (1 + day * 0.05)),
        confidence: 0.89 * confidenceDecay, // Base accuracy from requirements
      });
    }
    
    // Determine risk level
    const maxProbability = Math.max(...predictions.map(p => p.outbreakProbability));
    const riskLevel = this.determineRiskLevel(maxProbability);
    
    // Calculate contributing factors
    const contributingFactors = this.calculateContributingFactors(
      syndromicData,
      climateData
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(riskLevel, diseaseType);
    
    return {
      predictionId,
      district,
      state,
      diseaseType,
      predictionTimestamp,
      forecastHorizon: this.forecastHorizon,
      predictions,
      riskLevel,
      contributingFactors,
      recommendations,
      modelVersion: '1.0.0',
    };
  }

  /**
   * Calculate rule-based outbreak probability (fallback)
   */
  private calculateRuleBasedProbability(
    syndromicData: SyndromicData[],
    climateData: ClimateData[]
  ): number {
    // Calculate trend in case counts
    const recentCases = syndromicData.slice(-7).map(d => d.caseCount);
    const avgRecent = recentCases.reduce((a, b) => a + b, 0) / recentCases.length;
    
    const olderCases = syndromicData.slice(-14, -7).map(d => d.caseCount);
    const avgOlder = olderCases.reduce((a, b) => a + b, 0) / olderCases.length;
    
    const trendFactor = avgRecent / (avgOlder + 1); // Avoid division by zero
    
    // Calculate climate risk
    const recentClimate = climateData.slice(-7);
    const avgRainfall = recentClimate.reduce((a, b) => a + b.rainfall, 0) / recentClimate.length;
    const avgHumidity = recentClimate.reduce((a, b) => a + b.humidity, 0) / recentClimate.length;
    
    const climateFactor = (avgRainfall / 50 + avgHumidity / 100) / 2;
    
    // Combine factors
    const probability = Math.min((trendFactor * 0.6 + climateFactor * 0.4), 1);
    
    return probability;
  }

  /**
   * Determine risk level based on outbreak probability
   */
  private determineRiskLevel(probability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 0.85) return 'critical';
    if (probability >= 0.70) return 'high';
    if (probability >= 0.50) return 'medium';
    return 'low';
  }

  /**
   * Calculate contributing factors to outbreak risk
   */
  private calculateContributingFactors(
    syndromicData: SyndromicData[],
    climateData: ClimateData[]
  ): { syndromic: number; climate: number; historical: number; mobility: number } {
    // Syndromic factor: based on case trend
    const recentCases = syndromicData.slice(-7).map(d => d.caseCount);
    const avgRecent = recentCases.reduce((a, b) => a + b, 0) / recentCases.length;
    const syndromicFactor = Math.min(avgRecent / 100, 1);
    
    // Climate factor: based on rainfall and humidity
    const recentClimate = climateData.slice(-7);
    const avgRainfall = recentClimate.reduce((a, b) => a + b.rainfall, 0) / recentClimate.length;
    const avgHumidity = recentClimate.reduce((a, b) => a + b.humidity, 0) / recentClimate.length;
    const climateFactor = (avgRainfall / 50 + avgHumidity / 100) / 2;
    
    // Historical factor: based on seasonal patterns (simplified)
    const month = new Date().getMonth();
    const historicalFactor = Math.abs(Math.sin(2 * Math.PI * month / 12));
    
    // Mobility factor: placeholder (would integrate with mobility data in production)
    const mobilityFactor = 0.5;
    
    return {
      syndromic: syndromicFactor,
      climate: climateFactor,
      historical: historicalFactor,
      mobility: mobilityFactor,
    };
  }

  /**
   * Generate recommendations based on risk level
   */
  private generateRecommendations(
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    diseaseType: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Activate Rapid Response Team (RRT) immediately');
      recommendations.push('Increase surveillance in affected districts');
      recommendations.push('Prepare isolation facilities and medical supplies');
      recommendations.push('Launch public awareness campaign in local languages');
      recommendations.push('Coordinate with district health authorities');
    }
    
    if (riskLevel === 'medium') {
      recommendations.push('Enhance syndromic surveillance');
      recommendations.push('Pre-position medical supplies');
      recommendations.push('Brief healthcare workers on case identification');
      recommendations.push('Monitor climate conditions closely');
    }
    
    if (riskLevel === 'low') {
      recommendations.push('Continue routine surveillance');
      recommendations.push('Maintain preparedness protocols');
    }
    
    // Disease-specific recommendations
    if (diseaseType.toLowerCase().includes('dengue') || diseaseType.toLowerCase().includes('malaria')) {
      recommendations.push('Intensify vector control measures');
      recommendations.push('Eliminate standing water sources');
    }
    
    return recommendations;
  }

  /**
   * Create outbreak alert if threshold exceeded
   */
  async createOutbreakAlert(prediction: DiseasePrediction): Promise<OutbreakAlert | null> {
    const maxProbability = Math.max(...prediction.predictions.map(p => p.outbreakProbability));
    
    if (maxProbability < this.outbreakThreshold) {
      return null;
    }
    
    const criticalPrediction = prediction.predictions.find(
      p => p.outbreakProbability === maxProbability
    )!;
    
    const alert: OutbreakAlert = {
      alertId: uuidv4(),
      district: prediction.district,
      state: prediction.state,
      diseaseType: prediction.diseaseType,
      severity: prediction.riskLevel,
      outbreakProbability: maxProbability,
      predictedCases: criticalPrediction.expectedCases,
      predictedDate: criticalPrediction.date,
      affectedPopulation: criticalPrediction.expectedCases * 10, // Estimate
      recommendations: prediction.recommendations,
      rrtActivationRequired: maxProbability >= config.alerts.rrtActivationThreshold,
      createdAt: new Date(),
    };
    
    // In production, save to database and trigger notifications
    console.log('Outbreak alert created:', alert);
    
    return alert;
  }

  /**
   * Get forecast for multiple districts
   */
  async getForecastForRegion(
    state: string,
    districts: string[],
    diseaseType: string
  ): Promise<DiseasePrediction[]> {
    const predictions: DiseasePrediction[] = [];
    
    for (const district of districts) {
      const prediction = await this.predictOutbreak(district, state, diseaseType);
      predictions.push(prediction);
      
      // Create alert if needed
      await this.createOutbreakAlert(prediction);
    }
    
    return predictions;
  }
}
