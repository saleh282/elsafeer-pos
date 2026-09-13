// The shop's operational day runs from 09:00 until 01:00 the following day.
// Dates here are interpreted in the server's configured local timezone
// (Africa/Cairo is set on server startup).
const BUSINESS_DAY_START_HOUR = 9;
const BUSINESS_DAY_END_HOUR = 1;
const MORNING_SHIFT_END_HOUR = 18;

const isValidDateText = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

const businessDayRange = (dateText) => {
  if (!isValidDateText(dateText)) return null;

  const start = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  start.setHours(BUSINESS_DAY_START_HOUR, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(BUSINESS_DAY_END_HOUR - 1, 59, 59, 999);

  return { start, end };
};

const scheduledShiftType = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= BUSINESS_DAY_START_HOUR && hour < MORNING_SHIFT_END_HOUR) return 'morning';
  if (hour >= MORNING_SHIFT_END_HOUR || hour < BUSINESS_DAY_END_HOUR) return 'night';
  return null;
};

module.exports = {
  BUSINESS_DAY_START_HOUR,
  BUSINESS_DAY_END_HOUR,
  MORNING_SHIFT_END_HOUR,
  businessDayRange,
  scheduledShiftType,
};
