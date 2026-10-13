/** A display/calculation default, NOT a change to the user's archived original birth record.
 * The user has chosen solar as Palja's default calendar for legacy imported rows.
 * Explicitly confirmed lunar dates always take precedence. Never infer from +/- source symbols.
 */
export function isDefaultSolar(birth) {
  return birth?.calendar_type == null && !birth?.pillar_input;
}
export function effectiveCalendar(birth) {
  return birth?.calendar_type === 'lunar' ? 'lunar' : 'solar';
}
export function birthForCalculation(birth) {
  if (!isDefaultSolar(birth)) return birth;
  return { ...birth, calendar_type: 'solar', lunar_leap_month: false };
}
