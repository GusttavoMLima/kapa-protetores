/** Calendar dates only; eligibility follows the shelter's São Paulo time zone. */
export function ageFromBirthDate(value: string | null | undefined, now = new Date()): number | null {
  if (!value || value.length !== 10 || value[4] !== '-' || value[7] !== '-') return null;
  for (let index = 0; index < value.length; index += 1) {
    if (index === 4 || index === 7) continue;
    const digit = value.charCodeAt(index);
    if (digit < 48 || digit > 57) return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1900 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now);
  const currentYear = Number(parts.find((part) => part.type === 'year')?.value);
  const currentMonth = Number(parts.find((part) => part.type === 'month')?.value);
  const currentDay = Number(parts.find((part) => part.type === 'day')?.value);
  const age = currentYear - year - (currentMonth < month || (currentMonth === month && currentDay < day) ? 1 : 0);
  return age < 0 || value > `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}` ? null : age;
}

export function isAdult(value: string | null | undefined, now = new Date()): boolean {
  const age = ageFromBirthDate(value, now);
  return age !== null && age >= 18;
}

export function isValidPhone(value: string | null | undefined): boolean {
  return Boolean(value && /^[+\d()\s-]+$/.test(value) && /^\d{10,15}$/.test(value.replace(/\D/g, '')));
}
