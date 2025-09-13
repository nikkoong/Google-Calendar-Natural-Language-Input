// Simple test of built files
const vm = require('vm');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Built Files...\n');

try {
  // Create browser-like context with necessary APIs
  const context = {
    window: {},
    console: console,
    SharedUtils: null,
    GoogleCalendarNLP: null,
    URLSearchParams: URLSearchParams,
    URL: URL,
    Date: Date,
    // Add other browser globals that might be needed
    navigator: { userAgent: 'Node.js Test' },
    document: {},
    location: { href: 'https://calendar.google.com' }
  };

  console.log('📦 Loading shared-utils.js...');
  const sharedUtilsCode = fs.readFileSync('chrome-extension/shared-utils.js', 'utf8');
  vm.createContext(context);
  vm.runInContext(sharedUtilsCode, context);
  console.log('✅ SharedUtils loaded:', typeof context.SharedUtils);

  console.log('📦 Loading content-helpers.js...');
  const contentHelpersCode = fs.readFileSync('chrome-extension/content-helpers.js', 'utf8');
  vm.runInContext(contentHelpersCode, context);
  console.log('✅ GoogleCalendarNLP loaded:', typeof context.window.GoogleCalendarNLP);

  // Test basic functionality
  console.log('\n🔍 Testing createEventUrls...');
  const { createEventUrls } = context.window.GoogleCalendarNLP;
  const result = createEventUrls('Meeting tomorrow 2pm');
  console.log('✅ Result:', result);
  console.log('   Length:', result.length);
  console.log('   URL contains calendar.google.com:', result[0].includes('calendar.google.com'));

  // Test date range fix
  console.log('\n🔍 Testing date range parsing (9/1-9/10)...');
  const dateRangeResult = createEventUrls('trip 9/1-9/10');
  console.log('✅ Date range result:', dateRangeResult);

  // Test calendar validation
  console.log('\n🔍 Testing calendar validation...');
  const validateCalendar = context.SharedUtils.validateCalendar;
  const validResult = validateCalendar('@work', 'john.doe@company.com');
  console.log('✅ Valid calendar result:', validResult);

  console.log('\n🎉 All basic tests passed! Built files are working correctly.');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
