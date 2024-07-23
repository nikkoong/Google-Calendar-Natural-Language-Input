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
    if (frequency.includes('WEEK')) {
      frequency = 'WEEKLY';
    } else if (frequency.includes('MO')) {
      frequency = 'MONTHLY';
    } else if (frequency.includes('DAY')) {
      frequency = 'DAILY';
    } else if (frequency.includes('YEAR')) {
      frequency = 'YEARLY';
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



function parse(text, lang = EN) {
  if (!text) {
    throw new Error('invalid input text');
  }

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

  const recurrenceInfo = parseRecurrence(text);
  if (recurrenceInfo) {
    text = text.replace(recurrenceInfo.recurrenceText, "").trim();
  }

  const detailInfo = parseDetails(text);
  if (detailInfo) {
    text = text.replace(detailInfo.detailText,"").trim();
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
  return {text: eventTitle, dates, recur: recurrenceInfo? recurrenceInfo.rrule : null, details:detailInfo? detailInfo.details : ""};
}

export function createEventUrl(text, lang) {
  let data;
  try {
    data = parse(text, lang);
    console.log(data);
  } catch (err) {
    console.log(err);
    return null;
  }

  data.action = 'TEMPLATE';

  const baseUrl = 'https://www.google.com/calendar/event';
  const params = new URLSearchParams(data);
  return `${baseUrl}?${params}`;
}
