// Behavior evidence: docs/original-apk-age-notation.md. No birth record is modified.
export const AGE_NOTATIONS = Object.freeze({
  korean: '옛 한국 나이', international: '만(표준) 나이',
});
export const DEFAULT_AGE_NOTATION = 'korean';

export function solarAge(birth, today, notation) {
  if (!Object.hasOwn(AGE_NOTATIONS, notation) || !(today instanceof Date) || !Number.isFinite(today.getTime())) return null;
  const {input_year: year, input_month: month, input_day: day} = birth;
  if (![year, month, day].every(Number.isInteger) || year < 1 || month < 1 || month > 12) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > days[month - 1]) return null;
  const current = [today.getFullYear(), today.getMonth() + 1, today.getDate()];
  if (year > current[0] || (year === current[0] && (month > current[1] || (month === current[1] && day > current[2])))) return null;
  const years = current[0] - year;
  // The original comparison normalizes both month/day pairs into year 1000.
  // That year is not a leap year, so February 29 compares as March 1.
  const [birthMonth, birthDay] = month === 2 && day === 29 ? [3, 1] : [month, day];
  const [currentMonth, currentDay] = current[1] === 2 && current[2] === 29 ? [3, 1] : current.slice(1);
  return notation === 'korean' ? years + 1
    : years - (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay) ? 1 : 0);
}
