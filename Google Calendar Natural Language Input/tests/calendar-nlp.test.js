import { createEventUrls } from '../src/helpers.js';
import { processCalendarSubstitutions, validateCalendar, truncateCalendarId } from '../src/shared-utils.js';

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
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log(`${colors.bold}${colors.blue}🧪 Running Google Calendar NLP Tests${colors.reset}\n`);
    
    for (const { name, testFn } of this.tests) {
      try {
        await testFn();
        this.results.passed++;
        console.log(`${colors.green}✅ ${name}${colors.reset}`);
      } catch (error) {
        this.results.failed++;
        console.log(`${colors.red}❌ ${name}${colors.reset}`);
        console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
      }
      this.results.total++;
    }

    this.printSummary();
    return this.results.failed === 0;
  }

  printSummary() {
    console.log(`\n${colors.bold}📊 Test Results:${colors.reset}`);
    console.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    console.log(`Total: ${this.results.total}`);
    
    if (this.results.failed === 0) {
      console.log(`\n${colors.bold}${colors.green}🎉 All tests passed!${colors.reset}`);
    } else {
      console.log(`\n${colors.bold}${colors.red}💥 ${this.results.failed} test(s) failed${colors.reset}`);
    }
  }

  expect(actual, message = '') {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
        }
      },
      toContain(expected) {
        if (!actual.includes(expected)) {
          throw new Error(`${message}\nExpected "${actual}" to contain "${expected}"`);
        }
      },
      toMatch(regex) {
        if (!regex.test(actual)) {
          throw new Error(`${message}\nExpected "${actual}" to match ${regex}`);
        }
      },
      toThrow(expectedError) {
        try {
          if (typeof actual === 'function') {
            actual();
          }
          throw new Error(`${message}\nExpected function to throw, but it didn't`);
        } catch (error) {
          if (expectedError && !error.message.includes(expectedError)) {
            throw new Error(`${message}\nExpected error containing "${expectedError}", got "${error.message}"`);
          }
        }
      },
      toHaveLength(expected) {
        if (actual.length !== expected) {
          throw new Error(`${message}\nExpected array length ${expected}, got ${actual.length}`);
        }
      }
    };
  }
}

// Helper function to extract date range from URL
function extractDateRange(url) {
  const match = url.match(/dates=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Helper function to extract event text from URL
function extractEventText(url) {
  const match = url.match(/text=([^&]+)/);
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
}

// Helper function to extract calendar source from URL
function extractCalendarSource(url) {
  const match = url.match(/src=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const runner = new TestRunner();

// =============================================================================
// DATE PARSING TESTS
// =============================================================================

runner.test('Numeric date ranges - Original issue fix', () => {
  const urls = createEventUrls('trip 9/1-9/10');
  runner.expect(urls).toHaveLength(1);
  
  const eventText = extractEventText(urls[0]);
  const dateRange = extractDateRange(urls[0]);
  
  runner.expect(eventText).toBe('trip');
  runner.expect(dateRange).toContain('20250901');
  runner.expect(dateRange).toContain('20250910');
});

runner.test('Numeric date ranges with spaces - Space handling fix', () => {
  const urls = createEventUrls('trip 9/1 - 9/10');
  runner.expect(urls).toHaveLength(1);
  
  const eventText = extractEventText(urls[0]);
  const dateRange = extractDateRange(urls[0]);
  
  runner.expect(eventText).toBe('trip');
  runner.expect(dateRange).toContain('20250901');
  runner.expect(dateRange).toContain('20250910');
});

runner.test('Various numeric date range formats', () => {
  const testCases = [
    { input: 'vacation 12/25-12/26', expectedText: 'vacation' },
    { input: 'conference 1/1/2026-1/7/2026', expectedText: 'conference' },
    { input: 'workshop 3/15-3/17', expectedText: 'workshop' },
    { input: 'meeting 12/1/25-12/3/25', expectedText: 'meeting' }
  ];

  testCases.forEach(({ input, expectedText }) => {
    const urls = createEventUrls(input);
    runner.expect(urls).toHaveLength(1);
    runner.expect(extractEventText(urls[0])).toBe(expectedText);
  });
});

runner.test('Text-based date ranges still work', () => {
  const urls = createEventUrls('trip sep 1 - sep 10');
  runner.expect(urls).toHaveLength(1);
  
  const eventText = extractEventText(urls[0]);
  const dateRange = extractDateRange(urls[0]);
  
  runner.expect(eventText).toBe('trip');
  runner.expect(dateRange).toContain('20250901');
  runner.expect(dateRange).toContain('20250910');
});

runner.test('Single dates not affected by fix', () => {
  const urls = createEventUrls('meeting 9/1');
  runner.expect(urls).toHaveLength(1);
  runner.expect(extractEventText(urls[0])).toBe('meeting');
});

// =============================================================================
// SINGLE NUMERIC DATE TESTS (M/D FORMAT)
// =============================================================================

runner.test('Single numeric date - basic M/D format (2/2)', () => {
  const urls = createEventUrls('meeting 2/2');
  runner.expect(urls).toHaveLength(1);
  
  const eventText = extractEventText(urls[0]);
  const dateRange = extractDateRange(urls[0]);
  
  runner.expect(eventText).toBe('meeting');
  runner.expect(dateRange).toContain('0202'); // February 2nd
});

runner.test('Single numeric date - M/DD format (7/13)', () => {
  const urls = createEventUrls('dinner 7/13');
  runner.expect(urls).toHaveLength(1);
  
  const eventText = extractEventText(urls[0]);
  const dateRange = extractDateRange(urls[0]);
  
  runner.expect(eventText).toBe('dinner');
  runner.expect(dateRange).toContain('0713'); // July 13th
});

runner.test('Single numeric date - MM/DD format (12/25)', () => {
  const urls = createEventUrls('holiday 12/25');
  runner.expect(urls).toHaveLength(1);
  
  const eventText = extractEventText(urls[0]);
  const dateRange = extractDateRange(urls[0]);
  
  runner.expect(eventText).toBe('holiday');
  runner.expect(dateRange).toContain('1225'); // December 25th
});

runner.test('Single numeric date with time (2/14 7pm)', () => {
  const urls = createEventUrls('dinner 2/14 7pm');
  runner.expect(urls).toHaveLength(1);
  
  const eventText = extractEventText(urls[0]);
  const dateRange = extractDateRange(urls[0]);
  
  runner.expect(eventText).toBe('dinner');
  runner.expect(dateRange).toContain('0214'); // February 14th
  runner.expect(dateRange).toContain('T19'); // 7pm = 19:00
});

runner.test('Single numeric date with description (3/17)', () => {
  const urls = createEventUrls('party 3/17 d(St Patricks Day)');
  runner.expect(urls).toHaveLength(1);
  
  const eventText = extractEventText(urls[0]);
  const dateRange = extractDateRange(urls[0]);
  
  runner.expect(eventText).toBe('party');
  runner.expect(dateRange).toContain('0317'); // March 17th
  runner.expect(urls[0]).toContain('details=St+Patricks+Day');
});

runner.test('Single numeric date with location (5/5)', () => {
  const urls = createEventUrls('lunch 5/5 l(Mexican Restaurant)');
  runner.expect(urls).toHaveLength(1);
  
  const eventText = extractEventText(urls[0]);
  const dateRange = extractDateRange(urls[0]);
  
  runner.expect(eventText).toBe('lunch');
  runner.expect(dateRange).toContain('0505'); // May 5th
  runner.expect(urls[0]).toContain('location=Mexican+Restaurant');
});

runner.test('Single numeric date with recurrence (1/1 every year)', () => {
  const urls = createEventUrls('new year celebration 1/1 every year');
  runner.expect(urls).toHaveLength(1);
  
  const eventText = extractEventText(urls[0]);
  const dateRange = extractDateRange(urls[0]);
  
  runner.expect(eventText).toBe('new year celebration');
  runner.expect(dateRange).toContain('0101'); // January 1st
  runner.expect(urls[0]).toContain('recur=RRULE%3AFREQ%3DYEARLY');
});

runner.test('Multiple events with single numeric dates', () => {
  const urls = createEventUrls('meeting 2/2 3pm; lunch 2/14');
  runner.expect(urls).toHaveLength(2);
  
  runner.expect(extractEventText(urls[0])).toBe('meeting');
  runner.expect(extractDateRange(urls[0])).toContain('0202');
  
  runner.expect(extractEventText(urls[1])).toBe('lunch');
  runner.expect(extractDateRange(urls[1])).toContain('0214');
});

runner.test('Time ranges not affected by fix', () => {
  const urls = createEventUrls('lunch 1pm-2pm');
  runner.expect(urls).toHaveLength(1);
  runner.expect(extractEventText(urls[0])).toBe('lunch');
});

runner.test('Hyphenated words not affected', () => {
  const urls = createEventUrls('co-op meeting tomorrow');
  runner.expect(urls).toHaveLength(1);
  runner.expect(extractEventText(urls[0])).toBe('co-op meeting');
});

// =============================================================================
// DESCRIPTION AND LOCATION TESTS
// =============================================================================

runner.test('Event descriptions with d()', () => {
  const urls = createEventUrls('Meeting tomorrow d(discuss project timeline)');
  runner.expect(urls).toHaveLength(1);
  
  const url = urls[0];
  runner.expect(extractEventText(url)).toBe('Meeting');
  runner.expect(url).toContain('details=discuss+project+timeline');
});

runner.test('Event locations with l()', () => {
  const urls = createEventUrls('Dinner tomorrow l(Applebees)');
  runner.expect(urls).toHaveLength(1);
  
  const url = urls[0];
  runner.expect(extractEventText(url)).toBe('Dinner');
  runner.expect(url).toContain('location=Applebees');
});

runner.test('Combined description and location', () => {
  const urls = createEventUrls('Team meeting tomorrow d(sprint planning) l(Conference Room A)');
  runner.expect(urls).toHaveLength(1);
  
  const url = urls[0];
  runner.expect(extractEventText(url)).toBe('Team meeting');
  runner.expect(url).toContain('details=sprint+planning');
  runner.expect(url).toContain('location=Conference+Room+A');
});

runner.test('Complex descriptions with special characters', () => {
  const urls = createEventUrls('Project review tomorrow d(Review Q3 metrics & discuss next steps)');
  runner.expect(urls).toHaveLength(1);
  
  const url = urls[0];
  runner.expect(extractEventText(url)).toBe('Project review');
  runner.expect(url).toContain('details=Review+Q3+metrics+%26+discuss+next+steps');
});

// =============================================================================
// RECURRENCE TESTS
// =============================================================================

runner.test('Daily recurrence', () => {
  const urls = createEventUrls('Standup every day 9am');
  runner.expect(urls).toHaveLength(1);
  
  const url = urls[0];
  runner.expect(extractEventText(url)).toBe('Standup');
  runner.expect(url).toContain('recur=RRULE%3AFREQ%3DDAILY%3BINTERVAL%3D1');
});

runner.test('Weekly recurrence', () => {
  const urls = createEventUrls('Team meeting tomorrow every week');
  runner.expect(urls).toHaveLength(1);
  
  const url = urls[0];
  runner.expect(extractEventText(url)).toBe('Team meeting');
  runner.expect(url).toContain('recur=RRULE%3AFREQ%3DWEEKLY%3BINTERVAL%3D1');
});

runner.test('Monthly recurrence', () => {
  const urls = createEventUrls('Board meeting tomorrow every month');
  runner.expect(urls).toHaveLength(1);
  
  const url = urls[0];
  runner.expect(url).toContain('recur=RRULE%3AFREQ%3DMONTHLY%3BINTERVAL%3D1');
});

runner.test('Yearly recurrence', () => {
  const urls = createEventUrls('Birthday party tomorrow every year');
  runner.expect(urls).toHaveLength(1);
  
  const url = urls[0];
  runner.expect(url).toContain('recur=RRULE%3AFREQ%3DYEARLY%3BINTERVAL%3D1');
});

runner.test('Custom interval recurrence', () => {
  const urls = createEventUrls('Dentist appointment tomorrow every 6 weeks');
  runner.expect(urls).toHaveLength(1);
  
  const url = urls[0];
  runner.expect(url).toContain('recur=RRULE%3AFREQ%3DWEEKLY%3BINTERVAL%3D6');
});

// =============================================================================
// MULTIPLE EVENTS TESTS
// =============================================================================

runner.test('Multiple events separated by semicolon', () => {
  const urls = createEventUrls('Meeting 2pm; Lunch 5pm');
  runner.expect(urls).toHaveLength(2);
  
  runner.expect(extractEventText(urls[0])).toBe('Meeting');
  runner.expect(extractEventText(urls[1])).toBe('Lunch');
});

runner.test('Multiple events with different features', () => {
  const urls = createEventUrls('Meeting d(important) 2pm; Lunch l(cafe) 1pm; Workout every day 6am');
  runner.expect(urls).toHaveLength(3);
  
  // Check first event has description
  runner.expect(urls[0]).toContain('details=important');
  
  // Check second event has location
  runner.expect(urls[1]).toContain('location=cafe');
  
  // Check third event has recurrence
  runner.expect(urls[2]).toContain('recur=RRULE%3AFREQ%3DDAILY');
});

runner.test('Multiple events with date ranges', () => {
  const urls = createEventUrls('Vacation 9/1-9/10; Conference 10/15-10/17');
  runner.expect(urls).toHaveLength(2);
  
  runner.expect(extractEventText(urls[0])).toBe('Vacation');
  runner.expect(extractEventText(urls[1])).toBe('Conference');
});

// =============================================================================
// CALENDAR SUBSTITUTION TESTS
// =============================================================================

runner.test('Calendar substitution - basic nickname', async () => {
  const result = await processCalendarSubstitutions('Meeting tomorrow 2pm @work', mockSavedCalendars);
  
  runner.expect(result.processedText).toBe('Meeting tomorrow 2pm');
  runner.expect(result.calendarId).toBe('john.doe@company.com');
});

runner.test('Calendar substitution - multiple nicknames uses first', async () => {
  const result = await processCalendarSubstitutions('Meeting @work and @personal', mockSavedCalendars);
  
  runner.expect(result.processedText).toBe('Meeting  and @personal');
  runner.expect(result.calendarId).toBe('john.doe@company.com');
});

runner.test('Calendar substitution - no nickname returns null', async () => {
  const result = await processCalendarSubstitutions('Meeting tomorrow 2pm', mockSavedCalendars);
  
  runner.expect(result.processedText).toBe('Meeting tomorrow 2pm');
  runner.expect(result.calendarId).toBe(null);
});

runner.test('Calendar substitution - unknown nickname throws error', async () => {
  try {
    await processCalendarSubstitutions('Meeting @unknown', mockSavedCalendars);
    throw new Error('Should have thrown an error');
  } catch (error) {
    runner.expect(error.message).toContain('Calendar nickname "@unknown" not found');
  }
});

runner.test('Calendar substitution - with date ranges', async () => {
  const result = await processCalendarSubstitutions('Vacation 9/1-9/10 @personal', mockSavedCalendars);
  
  runner.expect(result.processedText).toBe('Vacation 9/1-9/10');
  runner.expect(result.calendarId).toBe('john.doe@gmail.com');
});

runner.test('Calendar substitution - with description and location', async () => {
  const result = await processCalendarSubstitutions('Meeting d(important) l(office) @work', mockSavedCalendars);
  
  runner.expect(result.processedText).toBe('Meeting d(important) l(office)');
  runner.expect(result.calendarId).toBe('john.doe@company.com');
});

// =============================================================================
// VALIDATION TESTS
// =============================================================================

runner.test('Calendar validation - valid email and nickname', () => {
  const result = validateCalendar('@work', 'john.doe@company.com');
  runner.expect(result).toBe('@work');
});

runner.test('Calendar validation - auto-adds @ to nickname', () => {
  const result = validateCalendar('work', 'john.doe@company.com');
  runner.expect(result).toBe('@work');
});

runner.test('Calendar validation - invalid email throws error', () => {
  runner.expect(() => validateCalendar('@work', 'invalid-email')).toThrow('Invalid calendar ID format');
});

runner.test('Calendar validation - invalid nickname throws error', () => {
  runner.expect(() => validateCalendar('@work-team', 'john@company.com')).toThrow('Invalid nickname format');
});

runner.test('Calendar validation - missing fields throws error', () => {
  runner.expect(() => validateCalendar('', 'john@company.com')).toThrow('Please enter both nickname and calendar ID');
  runner.expect(() => validateCalendar('@work', '')).toThrow('Please enter both nickname and calendar ID');
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

runner.test('Truncate calendar ID - short IDs unchanged', () => {
  const shortId = 'test@example.com';
  runner.expect(truncateCalendarId(shortId)).toBe(shortId);
});

runner.test('Truncate calendar ID - long IDs truncated', () => {
  const longId = 'very.long.calendar.name.that.exceeds.thirty.characters@example.com';
  const truncated = truncateCalendarId(longId);
  
  runner.expect(truncated).toHaveLength(33); // 30 chars + '...'
  runner.expect(truncated).toContain('...');
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

runner.test('Full integration - complex event with all features', () => {
  const urls = createEventUrls('Team sprint planning tomorrow d(Plan next 2 weeks of work) l(Conference Room B) every 2 weeks');
  runner.expect(urls).toHaveLength(1);
  
  const url = urls[0];
  runner.expect(extractEventText(url)).toBe('Team sprint planning');
  runner.expect(url).toContain('details=Plan+next+2+weeks+of+work');
  runner.expect(url).toContain('location=Conference+Room+B');
  runner.expect(url).toContain('recur=RRULE%3AFREQ%3DWEEKLY%3BINTERVAL%3D2');
});

runner.test('Full integration - multiple complex events', () => {
  const urls = createEventUrls('Project kickoff tomorrow d(Initial planning) l(Main office); Daily standup tomorrow every day; Retrospective tomorrow every 2 weeks');
  runner.expect(urls).toHaveLength(3);
  
  // Kickoff event
  runner.expect(urls[0]).toContain('details=Initial+planning');
  runner.expect(urls[0]).toContain('location=Main+office');
  
  // Daily standup
  runner.expect(urls[1]).toContain('recur=RRULE%3AFREQ%3DDAILY');
  
  // Retrospective  
  runner.expect(urls[2]).toContain('recur=RRULE%3AFREQ%3DWEEKLY%3BINTERVAL%3D2');
});

runner.test('Edge case - empty input', () => {
  const urls = createEventUrls('');
  runner.expect(urls).toHaveLength(0);
});

runner.test('Edge case - only semicolons', () => {
  const urls = createEventUrls(';;;');
  runner.expect(urls).toHaveLength(0);
});

runner.test('Edge case - whitespace only', () => {
  const urls = createEventUrls('   ');
  runner.expect(urls).toHaveLength(0);
});

// =============================================================================
// ADDITIONAL EDGE CASE TESTS
// =============================================================================

runner.test('Edge case - calendar nickname with numbers', async () => {
  const testCalendars = { '@gym123': 'fitness123@example.com' };
  const result = await processCalendarSubstitutions('Workout @gym123', testCalendars);
  
  runner.expect(result.processedText).toBe('Workout');
  runner.expect(result.calendarId).toBe('fitness123@example.com');
});

runner.test('Edge case - mixed date formats work correctly', () => {
  const urls = createEventUrls('Meeting 9/1 2pm; Conference sep 15 - sep 17; Daily standup tomorrow every day');
  runner.expect(urls).toHaveLength(3);
  
  // First event should have single date
  runner.expect(extractEventText(urls[0])).toBe('Meeting');
  
  // Second event should have date range  
  runner.expect(extractEventText(urls[1])).toBe('Conference');
  
  // Third event should have recurrence
  runner.expect(urls[2]).toContain('recur=RRULE%3AFREQ%3DDAILY');
});

runner.test('Edge case - special characters in event names', () => {
  const urls = createEventUrls('Mom & Dad\'s anniversary dinner tomorrow');
  runner.expect(urls).toHaveLength(1);
  runner.expect(extractEventText(urls[0])).toBe("Mom & Dad's anniversary dinner");
});

runner.test('Edge case - very long event text', () => {
  const longText = 'Quarterly business review meeting to discuss Q3 performance metrics, analyze market trends, review budget allocations, and plan strategic initiatives for Q4 tomorrow';
  const urls = createEventUrls(longText);
  runner.expect(urls).toHaveLength(1);
  runner.expect(extractEventText(urls[0])).toContain('Quarterly business review meeting');
});

runner.test('Regression - recurrence parsing order fix', () => {
  // Ensure "every month" is parsed as MONTHLY, not WEEKLY
  const urls = createEventUrls('Board meeting tomorrow every month');
  runner.expect(urls).toHaveLength(1);
  runner.expect(urls[0]).toContain('recur=RRULE%3AFREQ%3DMONTHLY%3BINTERVAL%3D1');
  
  // Ensure actual day names still work as WEEKLY
  const urls2 = createEventUrls('Team sync tomorrow every monday');
  runner.expect(urls2).toHaveLength(1);
  runner.expect(urls2[0]).toContain('recur=RRULE%3AFREQ%3DWEEKLY%3BINTERVAL%3D1');
});

// =============================================================================
// REGRESSION TESTS
// =============================================================================

runner.test('Regression - per-event calendar targeting', async () => {
  // Test that @nickname only applies to the specific event, not all events
  const event1Result = await processCalendarSubstitutions('Meeting @work', mockSavedCalendars);
  const event2Result = await processCalendarSubstitutions('Lunch', mockSavedCalendars);
  
  runner.expect(event1Result.calendarId).toBe('john.doe@company.com');
  runner.expect(event2Result.calendarId).toBe(null);
});

runner.test('Regression - numeric date parsing', () => {
  // Ensure the original bug fix still works
  const originalProblem = createEventUrls('trip 9/1-9/10');
  runner.expect(originalProblem).toHaveLength(1);
  runner.expect(extractEventText(originalProblem[0])).toBe('trip');
  
  const dateRange = extractDateRange(originalProblem[0]);
  runner.expect(dateRange).toContain('20250901');
  runner.expect(dateRange).toContain('20250910');
});

// Export the test runner for external use
export { runner };

// Run tests if this file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  const success = await runner.run();
  process.exit(success ? 0 : 1);
}
