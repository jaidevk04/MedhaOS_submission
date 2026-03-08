/**
 * DynamoDB Setup Script
 * 
 * Creates DynamoDB tables for local development
 */

import { createTables, configureAutoScaling, configureBackups } from '../src/dynamodb/tables';

async function setup() {
  console.log('🚀 Setting up DynamoDB tables...\n');

  try {
    // Create tables
    await createTables();
    console.log('\n✅ All tables created successfully');

    // Configure auto-scaling (production only)
    await configureAutoScaling();

    // Configure backups (production only)
    await configureBackups();

    console.log('\n✅ DynamoDB setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ DynamoDB setup failed:', error);
    process.exit(1);
  }
}

setup();
