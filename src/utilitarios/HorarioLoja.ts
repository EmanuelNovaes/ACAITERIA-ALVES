export function isStoreOpenAt(date = new Date()) {
  const minute = date.getHours() * 60 + date.getMinutes();
  return minute >= 15 * 60 && minute < 23 * 60 + 30;
}
