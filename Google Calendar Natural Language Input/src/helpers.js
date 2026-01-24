import {en} from 'chrono-node';
import dayjs from 'dayjs';
import {EN} from "./constants.js";

const locales = {en}

function dateRange(start, end, isAllDay) {
  let formatString = 'YYYYMMDD[T]HHmmss';

  if (isAllDay) {
    formatString = 'YYYYMMDD';
  }
  return [start, end].map(t => t.format(formatString)).join('/');
}

//keep testing this function below (parse recurrence - make digit optional (default to 1) and add yearly reccurence)
// add link and description updates

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

// check for d(<text>) to extract details
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

// check for loc(<text>) to extract location
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
  if (!text) {
    throw new Error('invalid input text');
  }

  // Preprocess numeric date ranges like "9/1-9/10" and "9/1 - 9/10" to help chrono-node parse them better
  // Convert various numeric date range formats to "X to Y" for better parsing
  // Handles: M/D-M/D, M/DD-M/DD, MM/D-MM/D, MM/DD-MM/DD, and with years
  // Also handles spaces around the hyphen
  text = text.replace(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*-\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/g, '$1 to $2');

  const locale = locales[lang] || en
  const results = locale.parse(text)

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
  if (recurrenceInfo) {
    text = text.replace(recurrenceInfo.recurrenceText, "").trim();
  }

  const detailInfo = parseDetails(text);
  if (detailInfo) {
    text = text.replace(detailInfo.detailText,"").trim();
  }

  const locationInfo = parseLocation(text);
  if (locationInfo) {
    text = text.replace(locationInfo.locationText,"").trim();
  }

  const eventTitle = text.replace(result.text, "").trim();

  if (!start.isValid()) {
    start = dayjs();
  }

  if (result.end !== null) {
    end = dayjs(result.end.date());
  }

  if (end === null) {
    end = start.add(1, 'hours');
  }

  const dates = dateRange(start, end, isAllDay);
  
  return {
    text: eventTitle,
    dates,
    recur: recurrenceInfo? recurrenceInfo.rrule : null,
    details:detailInfo? detailInfo.details : "",
    location:locationInfo? locationInfo.location : ""
  };
}

export function createEventUrls(text, lang) {
  const events = text.split(';').map(eventText => eventText.trim()).filter(Boolean);
  
  const urls = events.map((eventText) => {
    try {
      const data = parse(eventText, lang);
      data.action = 'TEMPLATE';
      const baseUrl = 'https://www.google.com/calendar/event';
      const params = new URLSearchParams(data);
      return `${baseUrl}?${params}`;
    } catch (err) {
      return null;
    }
  });
  
  return urls.filter(Boolean);
}
