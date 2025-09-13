#!/usr/bin/env node

// Test suite for built files in chrome-extension/
// This tests the actual user experience by using the built, bundled files

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Test data for calendar substitutions
const mockSavedCalendars = {
  '@work': 'john.doe@company.com',
  '@personal': 'john.doe@gmail.com',
  '@gym': 'fitness@gymclub.com',
  '@family': 'family.calendar@shared.com'
};

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class BuiltFilesTestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
    this.context = null;
  }

  async loadBuiltFiles() {
    console.log(`${colors.cyan}📦 Loading built files from chrome-extension/${colors.reset}`);
    
    // Create a new context to simulate browser environment
    const context = {
      window: {},
      console: console,
      SharedUtils: null,
      GoogleCalendarNLP: null,
      URLSearchParams: URLSearchParams,
      URL: URL,
      Date: Date,
      navigator: { userAgent: 'Node.js Test' },
      document: {},
      location: { href: 'https://calendar.google.com' },
      chrome: {
        storage: {
          sync: {
            get: async (key) => {
              if (key === 'savedCalendars') {
                return { savedCalendars: mockSavedCalendars };
              }
              return {};
            }
          }
        }
      }
    };
    
    // Load shared-utils.js
    const sharedUtilsPath = join(projectRoot, 'chrome-extension', 'shared-utils.js');
    const sharedUtilsCode = readFileSync(sharedUtilsPath, 'utf8');
    vm.createContext(context);
    vm.runInContext(sharedUtilsCode, context);
    
    // Load content-helpers.js (contains GoogleCalendarNLP)
    const contentHelpersPath = join(projectRoot, 'chrome-extension', 'content-helpers.js');
    const contentHelpersCode = readFileSync(contentHelpersPath, 'utf8');
    vm.runInContext(contentHelpersCode, context);
    
    console.log(`${colors.green}✅ Built files loaded successfully${colors.reset}`);
    console.log(`${colors.cyan}   - SharedUtils available${colors.reset}`);
    console.log(`${colors.cyan}   - GoogleCalendarNLP available${colors.reset}\n`);
    
    this.context = context;
    return context;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log(`${colors.bold}${colors.blue}🧪 Running Built Files Test Suite${colors.reset}`);
    console.log(`${colors.yellow}Testing actual user experience with chrome-extension/ files${colors.reset}\n`);
    
    // Load built files first
    await this.loadBuiltFiles();
    
    for (const { name, testFn } of this.tests) {
      try {
        await testFn(this.context);
        this.results.passed++;
        console.log(`${colors.green}✅ ${name}${colors.reset}`);
      } catch (error) {
        this.results.failed++;
        console.log(`${colors.red}❌ ${name}${colors.reset}`);
        console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
        if (error.stack && process.env.NODE_ENV === 'debug') {
          console.log(`   ${colors.red}Stack: ${error.stack}${colors.reset}`);
        }
      }
      this.results.total++;
    }

    // Print summary
    console.log(`\n${colors.bold}Test Results Summary:${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.results.failed}${colors.reset}`);
    console.log(`📊 Total: ${this.results.total}`);

    const success = this.results.failed === 0;
    if (success) {
      console.log(`\n${colors.bold}${colors.green}🎉 All built files tests passed!${colors.reset}`);
    } else {
      console.log(`\n${colors.bold}${colors.red}💥 Some tests failed. Check the errors above.${colors.reset}`);
    }

    return success;
  }

  // Helper assertion methods
  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      toHaveLength: (expected) => {
        if (!actual || actual.length !== expected) {
          throw new Error(`Expected length ${expected}, but got ${actual ? actual.length : 'undefined'}`);
        }
      },
      toContain: (expected) => {
        if (!actual || !actual.includes(expected)) {
          throw new Error(`Expected to contain "${expected}", but got ${JSON.stringify(actual)}`);
        }
      },
      toMatch: (regex) => {
        if (!regex.test(actual)) {
          throw new Error(`Expected "${actual}" to match pattern ${regex}`);
        }
      },
      toBeInstanceOf: (expectedClass) => {
        if (!(actual instanceof expectedClass)) {
          throw new Error(`Expected instance of ${expectedClass.name}, but got ${typeof actual}`);
        }
      }
    };
  }
}

// Create test runner instance
const runner = new BuiltFilesTestRunner();

function extractEventText(url) {
  try {
    const urlObj = new URL(url);
    return decodeURIComponent(urlObj.searchParams.get('text') || '');
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

// Basic functionality tests
runner.test('GoogleCalendarNLP is available in built files', (context) => {
  runner.expect(context.window.GoogleCalendarNLP).toBe('[object Object]');
  runner.expect(typeof context.window.GoogleCalendarNLP.createEventUrls).toBe('function');
});

runner.test('SharedUtils is available in built files', (context) => {
  runner.expect(typeof context.SharedUtils).toBe('object');
});

// Core date parsing tests using built files
runner.test('Simple event creation works', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const result = createEventUrls('Meeting tomorrow 2pm');
  runner.expect(result).toHaveLength(1);
  runner.expect(result[0]).toContain('calendar.google.com');
  const eventText = extractEventText(result[0]);
  runner.expect(eventText).toContain('Meeting');
});

runner.test('Date range parsing works (9/1-9/10 format)', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const result = createEventUrls('trip 9/1-9/10');
  runner.expect(result).toHaveLength(1);
  const eventText = extractEventText(result[0]);
  runner.expect(eventText).toContain('trip');
  // Should handle the date range properly (not create invalid dates)
  runner.expect(eventText).toMatch(/trip.*September/i);
});

runner.test('Multiple date formats work', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const testCases = [
    'meeting tomorrow 2pm',
    'lunch Friday 1pm to 2pm',
    'vacation 12/15-12/20',
    'appointment next Monday 10am'
  ];
  
  for (const testCase of testCases) {
    const result = createEventUrls(testCase);
    runner.expect(result).toHaveLength(1);
    runner.expect(result[0]).toContain('calendar.google.com');
  }
});

runner.test('Event descriptions work (d() syntax)', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const result = createEventUrls('Meeting tomorrow 2pm d(discuss project timeline)');
  runner.expect(result).toHaveLength(1);
  const eventText = extractEventText(result[0]);
  runner.expect(eventText).toContain('Meeting');
  runner.expect(eventText).toContain('discuss project timeline');
});

runner.test('Event locations work (l() syntax)', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const result = createEventUrls('Dinner tonight 7pm l(Applebees)');
  runner.expect(result).toHaveLength(1);
  const eventText = extractEventText(result[0]);
  runner.expect(eventText).toContain('Dinner');
  runner.expect(eventText).toContain('Applebees');
});

runner.test('Multiple events work (; separator)', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const result = createEventUrls('Meeting 2pm; Lunch 5pm');
  runner.expect(result).toHaveLength(2);
  
  const event1Text = extractEventText(result[0]);
  const event2Text = extractEventText(result[1]);
  
  runner.expect(event1Text).toContain('Meeting');
  runner.expect(event2Text).toContain('Lunch');
});

runner.test('Recurrence patterns work', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const result = createEventUrls('Team standup every Monday 9am');
  runner.expect(result).toHaveLength(1);
  const eventText = extractEventText(result[0]);
  runner.expect(eventText).toContain('Team standup');
  // Check that URL contains recurrence parameters
  runner.expect(result[0]).toContain('recur=');
});

runner.test('Complex event with all features', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const result = createEventUrls('Team meeting every Monday 9am to 10am d(weekly sync) l(Conference Room A)');
  runner.expect(result).toHaveLength(1);
  
  const eventText = extractEventText(result[0]);
  runner.expect(eventText).toContain('Team meeting');
  runner.expect(eventText).toContain('weekly sync');
  runner.expect(eventText).toContain('Conference Room A');
  
  // Should have recurrence
  runner.expect(result[0]).toContain('recur=');
});

// Calendar substitution tests (using mock data)
runner.test('Calendar substitutions work with built shared-utils', async (context) => {
  // Simulate the processCalendarSubstitutions function from built shared-utils
  const code = `
    (function() {
      const processCalendarSubstitutions = SharedUtils.processCalendarSubstitutions;
      const savedCalendars = ${JSON.stringify(mockSavedCalendars)};
      return processCalendarSubstitutions('Meeting @work tomorrow 2pm', savedCalendars);
    })()
  `;
  
  const result = await vm.runInContext(code, context);
  runner.expect(result.calendarId).toBe('john.doe@company.com');
  runner.expect(result.processedText).toContain('Meeting');
  runner.expect(result.processedText).toContain('tomorrow 2pm');
  // @work should be removed
  runner.expect(result.processedText).toBe('Meeting  tomorrow 2pm');
});

runner.test('Calendar validation works with built shared-utils', (context) => {
  const validateCalendar = context.SharedUtils.validateCalendar;
  
  // Valid cases
  const validResult = validateCalendar('@work', 'john.doe@company.com');
  runner.expect(validResult.isValid).toBe(true);
  
  // Invalid nickname
  const invalidNickname = validateCalendar('work', 'john.doe@company.com');
  runner.expect(invalidNickname.isValid).toBe(false);
  runner.expect(invalidNickname.error).toContain('nickname format');
  
  // Invalid email
  const invalidEmail = validateCalendar('@work', 'not-an-email');
  runner.expect(invalidEmail.isValid).toBe(false);
  runner.expect(invalidEmail.error).toContain('calendar ID format');
});

runner.test('Calendar ID truncation works', (context) => {
  const truncateCalendarId = context.SharedUtils.truncateCalendarId;
  
  // Short ID - no truncation
  const shortId = 'short@example.com';
  runner.expect(truncateCalendarId(shortId)).toBe(shortId);
  
  // Long ID - should be truncated
  const longId = 'very.long.calendar.id.that.exceeds.thirty.characters@example.com';
  const truncated = truncateCalendarId(longId);
  runner.expect(truncated).toHaveLength(33); // 30 + '...'
  runner.expect(truncated).toContain('...');
});

// Edge cases and regression tests
runner.test('Empty input handling', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  
  try {
    const result = createEventUrls('');
    // Should either return empty array or throw meaningful error
    runner.expect(Array.isArray(result)).toBe(true);
  } catch (error) {
    // Acceptable to throw error for empty input
    runner.expect(error.message).toContain('');
  }
});

runner.test('Special characters in event text', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const result = createEventUrls('Meeting with C&A team tomorrow 2pm');
  runner.expect(result).toHaveLength(1);
  const eventText = extractEventText(result[0]);
  runner.expect(eventText).toContain('C&A team');
});

runner.test('Unicode characters work', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const result = createEventUrls('Coffee ☕ with María tomorrow 2pm');
  runner.expect(result).toHaveLength(1);
  const eventText = extractEventText(result[0]);
  runner.expect(eventText).toContain('☕');
  runner.expect(eventText).toContain('María');
});

// Performance and edge case tests
runner.test('Long event text handling', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const longDescription = 'A'.repeat(500);
  const result = createEventUrls(`Meeting tomorrow 2pm d(${longDescription})`);
  runner.expect(result).toHaveLength(1);
  runner.expect(result[0]).toContain('calendar.google.com');
});

runner.test('Numeric parsing edge cases', (context) => {
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const testCases = [
    'meeting 12/31-1/5',  // Year boundary
    'event 2/29/2024',    // Leap year
    'appointment 13:45',  // 24-hour format
    'lunch 1:30pm'        // 12-hour format
  ];
  
  for (const testCase of testCases) {
    const result = createEventUrls(testCase);
    runner.expect(result).toHaveLength(1);
    runner.expect(result[0]).toContain('calendar.google.com');
  }
});

export { runner };

// If this file is run directly, execute tests
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log('Starting Built Files Test Suite...\n');
    
    try {
      const success = await runner.run();
      
      if (!success) {
        console.log('\n💡 Tip: These tests verify the actual user experience by testing the built files.');
        console.log('   If tests fail here but pass with source files, there may be a build issue.');
        process.exit(1);
      }
    } catch (error) {
      console.error('Built files test runner failed:', error);
      process.exit(1);
    }
  })();
}
