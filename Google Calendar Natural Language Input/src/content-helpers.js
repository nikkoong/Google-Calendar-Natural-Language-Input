import {en} from 'chrono-node';
import dayjs from 'dayjs';

const EN = "en";
const locales = {en};

function dateRange(start, end, isAllDay) {
  let formatString = 'YYYYMMDD[T]HHmmss';

  if (isAllDay) {
    formatString = 'YYYYMMDD';
  }
  return [start, end].map(t => t.format(formatString)).join('/');
}

function parseRecurrence(text) {
  const recurrencePattern = /every\s*(\d+)?\s*(\w+)/;
  const match = text.match(recurrencePattern);
  if (match) {
    let interval = match[1] ? match[1]: 1;
    let frequency = match[2].toUpperCase();
    let daysOfWeek = [
      "MONDAY",
      "TUESDAY", 
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
      "MON",
      "TUES",
      "WED", 
      "THUR",
      "FRI",
      "SAT",
      "SUN"
    ];
    if (frequency.includes('WEEK')) {
      frequency = 'WEEKLY';
    } else if (frequency.includes('MONTH')) {
      frequency = 'MONTHLY';
    } else if (frequency.includes('YEAR')) {
      frequency = 'YEARLY';
    } else if (daysOfWeek.some(day => frequency === day)) {
      frequency = 'WEEKLY';
    } else if (frequency.includes('DAY')) {
      frequency = 'DAILY';
    } else {
      return null;
    }
    let rrule = `RRULE:FREQ=${frequency};INTERVAL=${interval}`;
    return {rrule, recurrenceText: match[0]};
  }
  return null;
}

function parseDetails(text) {
  const detailsPattern = /d\(([^)]*)\)/;
  const detailsMatch = text.match(detailsPattern);
  let details = null;
  if (detailsMatch) {
    details = detailsMatch[1];
    return {details, detailText: detailsMatch[0]};
  }
  return null;
}

function parseLocation(text) {
  const locationPattern = /l\(([^)]*)\)/;
  const locationMatch = text.match(locationPattern);
  let location = null;
  if (locationMatch) {
    location = locationMatch[1];
    return {location, locationText: locationMatch[0]};
  }
  return null;
}

function parse(text, lang = EN) {
  console.log('=== PARSE START ===');
  console.log('Original input:', JSON.stringify(text));
  console.log('Language:', lang);
  
  if (!text) {
    throw new Error('invalid input text');
  }

  // Preprocess numeric date ranges like "9/1-9/10" and "9/1 - 9/10" to help chrono-node parse them better
  // Convert various numeric date range formats to "X to Y" for better parsing
  // Handles: M/D-M/D, M/DD-M/DD, MM/D-MM/D, MM/DD-MM/DD, and with years
  // Also handles spaces around the hyphen
  const originalText = text;
  text = text.replace(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*-\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/g, '$1 to $2');
  
  if (originalText !== text) {
    console.log('Date preprocessing applied:');
    console.log('  Before:', JSON.stringify(originalText));
    console.log('  After:', JSON.stringify(text));
  } else {
    console.log('No date preprocessing needed');
  }

  const locale = locales[lang] || en
  console.log('Using locale:', locale === en ? 'en' : 'other');
  console.log('Text going to chrono-node:', JSON.stringify(text));
  
  const results = locale.parse(text)
  console.log('Chrono-node results:', results.length, 'result(s)');
  if (results.length > 0) {
    console.log('First result:', {
      text: results[0].text,
      start: results[0].start?.date(),
      end: results[0].end?.date(),
      refDate: results[0].refDate
    });
  }

  if (results.length === 0) {
    throw new Error('could not find time data');
  }

  const result = results[0];

  const refDate = result.refDate;
  const startDate = result.start;
  let start = startDate? dayjs(startDate.date()) : dayjs();
  const isAllDay = false;
  let end = null;

  // if the parsed start date is before today, and in the last week, and has the text "day" in it, then:
  // tldr, if the text is something on Monday, and today is tuesday, then make sure we're creating an event for the following Monday.
  if (start.isBefore(dayjs(),'day') && start.isAfter(dayjs().subtract(1,'week')) && text.toUpperCase().includes('DAY') ) {
    start = start.add(1,'week');
  }

  const recurrenceInfo = parseRecurrence(text);
  console.log('Recurrence parsing:', recurrenceInfo || 'none');
  if (recurrenceInfo) {
    text = text.replace(recurrenceInfo.recurrenceText, "").trim();
    console.log('Text after removing recurrence:', JSON.stringify(text));
  }

  const detailInfo = parseDetails(text);
  console.log('Details parsing:', detailInfo || 'none');
  if (detailInfo) {
    text = text.replace(detailInfo.detailText,"").trim();
    console.log('Text after removing details:', JSON.stringify(text));
  }

  const locationInfo = parseLocation(text);
  console.log('Location parsing:', locationInfo || 'none');
  if (locationInfo) {
    text = text.replace(locationInfo.locationText,"").trim();
    console.log('Text after removing location:', JSON.stringify(text));
  }

  const eventTitle = text.replace(result.text, "").trim();
  console.log('Event title extraction:');
  console.log('  Text before title extraction:', JSON.stringify(text));
  console.log('  Chrono result.text:', JSON.stringify(result.text));
  console.log('  Final event title:', JSON.stringify(eventTitle));

  if (!start.isValid()) {
    start = dayjs();
  }

  if (result.end !== null) {
    end = dayjs(result.end.date());
  }

  if (end === null) {
    end = start.add(1, 'hours');
  }

  console.log('Date calculations:');
  console.log('  Start date:', start.format('YYYY-MM-DD HH:mm:ss'));
  console.log('  End date:', end.format('YYYY-MM-DD HH:mm:ss'));
  console.log('  Is all day:', isAllDay);

  const dates = dateRange(start, end, isAllDay);
  console.log('Generated date range:', dates);
  
  const finalResult = {
    text: eventTitle,
    dates,
    recur: recurrenceInfo? recurrenceInfo.rrule : null,
    details:detailInfo? detailInfo.details : "",
    location:locationInfo? locationInfo.location : ""
  };
  
  console.log('=== PARSE RESULT ===');
  console.log('Final result:', JSON.stringify(finalResult, null, 2));
  console.log('=== PARSE END ===');
  
  return finalResult;
}

function createEventUrls(text, lang) {
  console.log('🔗 CREATE EVENT URLS START');
  console.log('Input text:', JSON.stringify(text));
  console.log('Language:', lang);
  
  const events = text.split(';').map(eventText => eventText.trim()).filter(Boolean);
  console.log('Split into', events.length, 'event(s):', events);
  
  const urls = events.map((eventText, index) => {
    console.log(`\n--- Processing event ${index + 1}: ${JSON.stringify(eventText)} ---`);
    try {
      const data = parse(eventText, lang);
      data.action = 'TEMPLATE';
      const baseUrl = 'https://www.google.com/calendar/event';
      const params = new URLSearchParams(data);
      const finalUrl = `${baseUrl}?${params}`;
      console.log(`✅ Event ${index + 1} URL generated:`, finalUrl);
      return finalUrl;
    } catch (err) {
      console.log(`❌ Event ${index + 1} failed:`, err.message);
      console.log(`Error parsing event: ${err.message}`);
      return null;
    }
  });
  
  const validUrls = urls.filter(Boolean);
  console.log(`\n🔗 CREATE EVENT URLS END - Generated ${validUrls.length}/${events.length} URLs`);
  
  return validUrls;
}

// Export functions for use in content script
window.GoogleCalendarNLP = {
  parse,
  createEventUrls,
  parseRecurrence
};

console.log('Google Calendar NLP helpers loaded');
