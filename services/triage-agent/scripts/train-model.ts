#!/usr/bin/env ts-node
/**
 * Training Script for Urgency Scoring Model
 * Generates synthetic data and trains XGBoost model
 */

import { SyntheticDataGenerator } from '../src/ml/synthetic-data-generator';
import { UrgencyModel } from '../src/ml/urgency-model';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('=== Urgency Scoring Model Training ===\n');
  
  // Step 1: Generate synthetic training dataset
  console.log('Step 1: Generating synthetic training dataset...');
  const generator = new SyntheticDataGenerator();
  const trainingSize = 500000; // 500K cases as per requirements
  const validationSize = 50000; // 50K for validation
  
  console.log(`Generating ${trainingSize} training cases...`);
  const trainingData = generator.generateDataset(trainingSize);
  console.log(`✓ Generated ${trainingData.length} training cases\n`);
  
  console.log(`Generating ${validationSize} validation cases...`);
  const validationData = generator.generateDataset(validationSize);
  console.log(`✓ Generated ${validationData.length} validation cases\n`);
  
  // Step 2: Analyze dataset statistics
  console.log('Step 2: Dataset Statistics');
  analyzeDataset(trainingData);
  
  // Step 3: Train model
  console.log('\nStep 3: Training XGBoost model...');
  const model = new UrgencyModel();
  await model.train(trainingData);
  console.log('✓ Model training complete\n');
  
  // Step 4: Validate model
  console.log('Step 4: Validating model...');
  const metrics = validateModel(model, validationData);
  console.log('Validation Metrics:');
  console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`  MAE: ${metrics.mae.toFixed(2)}`);
  console.log(`  RMSE: ${metrics.rmse.toFixed(2)}`);
  console.log(`  R²: ${metrics.r2.toFixed(3)}\n`);
  
  // Step 5: Save model
  console.log('Step 5: Saving model...');
  const modelPath = path.join(__dirname, '../models/urgency-model.json');
  await model.saveModel(modelPath);
  console.log(`✓ Model saved to ${modelPath}\n`);
  
  // Step 6: Save sample data for testing
  console.log('Step 6: Saving sample data...');
  const sampleData = trainingData.slice(0, 100);
  const samplePath = path.join(__dirname, '../models/sample-data.json');
  fs.writeFileSync(samplePath, JSON.stringify(sampleData, null, 2));
  console.log(`✓ Sample data saved to ${samplePath}\n`);
  
  console.log('=== Training Complete ===');
  console.log('\nModel is ready for deployment to AWS SageMaker');
  console.log('Next steps:');
  console.log('  1. Upload model to S3');
  console.log('  2. Create SageMaker endpoint');
  console.log('  3. Configure model monitoring');
  console.log('  4. Set up retraining pipeline');
}


function analyzeDataset(data: any[]) {
  const urgencyScores = data.map(d => d.urgencyScore);
  const outcomes = data.map(d => d.actualOutcome);
  
  let sum = 0;
  for (const score of urgencyScores) {
    sum += score;
  }
  const avgScore = sum / urgencyScores.length;
  
  let minScore = urgencyScores[0];
  let maxScore = urgencyScores[0];
  for (const score of urgencyScores) {
    if (score < minScore) minScore = score;
    if (score > maxScore) maxScore = score;
  }
  
  const outcomeCounts: Record<string, number> = {};
  for (const outcome of outcomes) {
    outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
  }
  
  console.log(`  Total cases: ${data.length}`);
  console.log(`  Urgency score range: ${minScore} - ${maxScore}`);
  console.log(`  Average urgency score: ${avgScore.toFixed(2)}`);
  console.log(`  Outcome distribution:`);
  Object.entries(outcomeCounts).forEach(([outcome, count]) => {
    const percentage = ((count / data.length) * 100).toFixed(1);
    console.log(`    ${outcome}: ${count} (${percentage}%)`);
  });
}

function validateModel(model: UrgencyModel, validationData: any[]) {
  let totalError = 0;
  let totalSquaredError = 0;
  let correctPredictions = 0;
  
  const actualScores: number[] = [];
  const predictedScores: number[] = [];
  
  // Sample validation data for performance (use first 1000 cases)
  const sampleSize = Math.min(1000, validationData.length);
  const sampledData = validationData.slice(0, sampleSize);
  
  for (const case_ of sampledData) {
    const features = {
      age: case_.age,
      symptomSeverity: case_.symptomSeverity,
      temperature: case_.temperature,
      bloodPressureSystolic: case_.bloodPressureSystolic,
      bloodPressureDiastolic: case_.bloodPressureDiastolic,
      heartRate: case_.heartRate,
      respiratoryRate: case_.respiratoryRate,
      oxygenSaturation: case_.oxygenSaturation,
      chronicConditionsCount: case_.chronicConditions.length,
      previousHospitalizations: case_.previousHospitalizations,
      currentMedications: case_.currentMedications,
      hasRedFlags: case_.hasRedFlags ? 1 : 0,
      redFlagCount: case_.redFlagCount,
      symptomOnsetHours: convertOnsetToHours(case_.symptomOnset),
    };
    
    const prediction = model.predict(features);
    const actual = case_.urgencyScore;
    
    actualScores.push(actual);
    predictedScores.push(prediction.urgencyScore);
    
    const error = Math.abs(prediction.urgencyScore - actual);
    totalError += error;
    totalSquaredError += error * error;
    
    // Consider prediction correct if within 10 points
    if (error <= 10) {
      correctPredictions++;
    }
  }
  
  const mae = totalError / sampledData.length;
  const rmse = Math.sqrt(totalSquaredError / sampledData.length);
  const accuracy = correctPredictions / sampledData.length;
  
  // Calculate R²
  let sumActual = 0;
  for (const val of actualScores) {
    sumActual += val;
  }
  const meanActual = sumActual / actualScores.length;
  
  let ssTotal = 0;
  let ssResidual = 0;
  for (let i = 0; i < actualScores.length; i++) {
    ssTotal += Math.pow(actualScores[i] - meanActual, 2);
    ssResidual += Math.pow(actualScores[i] - predictedScores[i], 2);
  }
  const r2 = 1 - (ssResidual / ssTotal);
  
  return { accuracy, mae, rmse, r2 };
}

function convertOnsetToHours(onset: string): number {
  const mapping: Record<string, number> = {
    'just_now': 0.5,
    '2_6_hours': 4,
    '6_24_hours': 12,
    '1_3_days': 48,
    '3_7_days': 120,
    'over_week': 240,
  };
  return mapping[onset] || 24;
}

// Run training
main().catch(console.error);
