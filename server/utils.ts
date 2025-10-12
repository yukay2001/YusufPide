/**
 * Get current date in YYYY-MM-DD format using Turkish timezone (Europe/Istanbul)
 * This ensures consistency with session creation and validation
 */
export function getTurkishDate(): string {
  const now = new Date();
  const turkishTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  return turkishTime.toISOString().split('T')[0];
}
