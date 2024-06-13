import {en, fr, nl, ja, ru, pt, uk, zh, de, es} from 'chrono-node';
import dayjs from 'dayjs';
import {EN} from "./constants.js";

const locales = {en, fr, nl, ja, pt, zh, de, es, ru, uk}

function dateRange(start, end, isAllDay) {
  let formatString = 'YYYYMMDD[T]HHmmss';

  if (isAllDay) {
    formatString = 'YYYYMMDD';
  }
  return [start, end].map(t => t.format(formatString)).join('/');
}

function parseRecurrence(text) {
  const recurrencePattern = /every (\d+) (\w+)/;
  const match = text.match(recurrencePattern);
  if (match) {
    const interval = match[1];
    var frequency = match[2].toUpperCase();
    if (frequency.includes('W')) {
      frequency = 'WEEKLY';
    } else if (frequency.includes('M')) {
      frequency = 'MONTHLY';
    } else if (frequency.includes('D')) {
      frequency = 'DAILY';
    } else {
      return null
    }
    let rrule = `RRULE:FREQ=${frequency};INTERVAL=${interval}`;
    return {rrule, recurrenceText: match[0]};
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
  return {text: eventTitle, dates, recur: recurrenceInfo? recurrenceInfo.rrule : null}
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
