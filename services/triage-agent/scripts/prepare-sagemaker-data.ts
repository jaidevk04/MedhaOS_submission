#!/usr/bin/env ts-node
/**
 * Prepare Training Data for AWS SageMaker
 * Converts synthetic data to CSV format and uploads to S3
 */

import { SyntheticDataGenerator } from '../src/ml/synthetic-data-generator';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('=== Preparing Data for AWS SageMaker ===\n');
  
  // Configuration
  const trainingSize = 500000;
  const validationSize = 50000;
  const s3Bucket = process.env.S3_TRAINING_BUCKET || 'medhaos-training-data';
  const s3Prefix = 'urgency-scoring/';
  
  // Step 1: Generate synthetic data
  console.log('Step 1: Generating synthetic data...');
  const generator = new SyntheticDataGenerator();
  
  console.log(`  Generating ${trainingSize} training cases...`);
  const trainingData = generator.generateDataset(trainingSize);
  
  console.log(`  Generating ${validationSize} validation cases...`);
  const validationData = generator.generateDataset(validationSize);
  
  console.log('  ✓ Data generation complete\n');
  
  // Step 2: Convert to CSV format
  console.log('Step 2: Converting to CSV format...');
  const trainingCSV = convertToCSV(trainingData);
  const validationCSV = convertToCSV(validationData);
  console.log('  ✓ CSV conversion complete\n');
  
  // Step 3: Save locally
  console.log('Step 3: Saving CSV files locally...');
  const modelsDir = path.join(__dirname, '../models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
  
  const trainingPath = path.join(modelsDir, 'training-data.csv');
  const validationPath = path.join(modelsDir, 'validation-data.csv');
  
  fs.writeFileSync(trainingPath, trainingCSV);
  fs.writeFileSync(validationPath, validationCSV);
  
  console.log(`  ✓ Training data saved: ${trainingPath}`);
  console.log(`  ✓ Validation data saved: ${validationPath}\n`);
  
  // Step 4: Upload to S3
  console.log('Step 4: Uploading to S3...');
  
  if (!process.env.AWS_REGION) {
    console.log('  ⚠ AWS_REGION not set, skipping S3 upload');
    console.log('  To upload manually, run:');
    console.log(`    aws s3 cp ${trainingPath} s3://${s3Bucket}/${s3Prefix}train/training-data.csv`);
    console.log(`    aws s3 cp ${validationPath} s3://${s3Bucket}/${s3Prefix}validation/validation-data.csv`);
  } else {
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    
    // Upload training data
    console.log(`  Uploading training data to s3://${s3Bucket}/${s3Prefix}train/...`);
    await uploadToS3(s3Client, s3Bucket, `${s3Prefix}train/training-data.csv`, trainingCSV);
    console.log('  ✓ Training data uploaded');
    
    // Upload validation data
    console.log(`  Uploading validation data to s3://${s3Bucket}/${s3Prefix}validation/...`);
    await uploadToS3(s3Client, s3Bucket, `${s3Prefix}validation/validation-data.csv`, validationCSV);
    console.log('  ✓ Validation data uploaded');
  }
  
  console.log('\n=== Data Preparation Complete ===');
  console.log('\nNext steps:');
  console.log('  1. Verify data in S3');
  console.log('  2. Create SageMaker training job');
  console.log('  3. Deploy model to endpoint');
}

function convertToCSV(data: any[]): string {
  // CSV header
  const header = [
    'age',
    'symptomSeverity',
    'temperature',
    'bloodPressureSystolic',
    'bloodPressureDiastolic',
    'heartRate',
    'respiratoryRate',
    'oxygenSaturation',
    'chronicConditionsCount',
    'previousHospitalizations',
    'currentMedications',
    'hasRedFlags',
    'redFlagCount',
    'symptomOnsetHours',
    'urgencyScore', // Target variable (last column for XGBoost)
  ].join(',');
  
  // CSV rows
  const rows = data.map(case_ => {
    const symptomOnsetHours = convertOnsetToHours(case_.symptomOnset);
    
    return [
      case_.age,
      case_.symptomSeverity,
      case_.temperature,
      case_.bloodPressureSystolic,
      case_.bloodPressureDiastolic,
      case_.heartRate,
      case_.respiratoryRate,
      case_.oxygenSaturation,
      case_.chronicConditions.length,
      case_.previousHospitalizations,
      case_.currentMedications,
      case_.hasRedFlags ? 1 : 0,
      case_.redFlagCount,
      symptomOnsetHours,
      case_.urgencyScore,
    ].join(',');
  });
  
  return [header, ...rows].join('\n');
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

async function uploadToS3(
  client: S3Client,
  bucket: string,
  key: string,
  data: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: 'text/csv',
  });
  
  await client.send(command);
}

// Run the script
main().catch(console.error);
