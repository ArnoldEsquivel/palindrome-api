// Test Setup Configuration
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/store';
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Global test timeout
jest.setTimeout(30000);
