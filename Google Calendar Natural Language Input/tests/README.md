# Google Calendar NLP Tests

This folder contains comprehensive test cases for the Google Calendar Natural Language Input extension.

## Test Coverage

### Source Files Testing (`npm test`)
- ✅ **Date parsing** - Various date formats including the "9/1-9/10" fix
- ✅ **Event descriptions** - Using `d(description)` syntax
- ✅ **Event locations** - Using `l(location)` syntax  
- ✅ **Recurrence patterns** - Daily, weekly, monthly, yearly with intervals
- ✅ **Multiple events** - Semicolon-separated events
- ✅ **Calendar targeting** - Using `@nickname` syntax

### Built Files Testing (`npm run test:built`)
- 🧪 **Real User Experience** - Tests actual chrome-extension/ files users interact with
- ✅ **End-to-end URL generation** - Complete Google Calendar URLs
- ✅ **Built bundle validation** - Ensures Rollup output works correctly
- ✅ **Browser environment simulation** - Tests with URLSearchParams, etc.
- ✅ **Calendar substitution integration** - Tests SharedUtils integration
- ✅ **Edge cases and performance** - Unicode, long text, special characters

### Validation & Security
- ✅ **Input sanitization** - XSS prevention
- ✅ **Calendar validation** - Email format and nickname validation
- ✅ **Edge cases** - Empty inputs, whitespace, malformed data

### Integration Tests
- ✅ **Complex events** - Multiple features combined
- ✅ **Full workflow** - End-to-end functionality

### Regression Tests
- ✅ **Per-event calendar targeting** - Bug fix verification
- ✅ **Numeric date parsing** - Original issue verification

## Running Tests

### Source file tests (development):
```bash
npm test
```

### Built files tests (user experience):
```bash
npm run test:built
```

### All tests (comprehensive):
```bash
npm run test:all
```

### Watch mode (auto-runs on file changes):
```bash
npm run test:watch
```

## Test Structure

The test suite uses a custom lightweight test framework with:
- ✅ Colorized console output
- 📊 Test result summaries  
- 🎯 Detailed assertion failures
- 🧪 Comprehensive coverage

## Adding New Tests

To add new tests, edit `calendar-nlp.test.js`:

```javascript
runner.test('Test description', () => {
  const result = createEventUrls('your test input');
  runner.expect(result).toHaveLength(1);
  runner.expect(extractEventText(result[0])).toBe('expected text');
});
```

## Test Data

Mock calendar data is available for testing calendar substitutions:
- `@work` → `john.doe@company.com`
- `@personal` → `john.doe@gmail.com`  
- `@gym` → `fitness@gymclub.com`
- `@family` → `family.calendar@shared.com`

## Continuous Integration

Tests automatically run on every:
- `npm run build`
- `npm run build:dev`
- `npm run build:patch/minor/major`

This ensures no regressions are introduced during development.
