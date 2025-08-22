#!/usr/bin/env bun
import { initializeDatabase } from './database.js';

// Simple migration runner - just initialize the database for MVP
try {
  initializeDatabase();
  console.log('✅ Database migration completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Database migration failed:', error);
  process.exit(1);
}