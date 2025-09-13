#!/usr/bin/env node

// Simple test runner for the calendar NLP tests
import { runner } from './calendar-nlp.test.js';

console.log('Starting Calendar NLP Test Suite...\n');

try {
  const success = await runner.run();
  
  if (!success) {
    console.log('\n💡 Tip: Check the error messages above for details on failed tests.');
    process.exit(1);
  }
} catch (error) {
  console.error('Test runner failed:', error);
  process.exit(1);
}
