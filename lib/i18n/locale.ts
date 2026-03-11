import { enUS } from "date-fns/locale/en-US";
import { th } from "date-fns/locale/th";
import type { Locale } from "date-fns";
import type { Language } from "@/lib/i18n/translations";

const THAI_TIME_ZONE = "Asia/Bangkok";

export function getDateFnsLocale(language: Language): Locale {
  return language === "th" ? th : enUS;
}

export function getIntlLocale(language: Language): string {
  return language === "th" ? "th-TH" : "en-US";
}

export function getTimeZoneByLanguage(language: Language): string | undefined {
  return language === "th" ? THAI_TIME_ZONE : undefined;
}

export function formatNumberByLanguage(
  value: number,
  language: Language,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getIntlLocale(language), options).format(value);
}

export function formatCurrencyByLanguage(
  value: number,
  language: Language,
  currency = "USD",
): string {
  return new Intl.NumberFormat(getIntlLocale(language), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTimeByLanguage(
  value: Date | number,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  const timeZone = getTimeZoneByLanguage(language);

  return new Intl.DateTimeFormat(
    getIntlLocale(language),
    timeZone ? { ...options, timeZone } : options,
  ).format(value);
}

function getCalendarPartsByLanguage(value: Date | number, language: Language) {
  const timeZone = getTimeZoneByLanguage(language);
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(value);

  return parts.reduce<Record<string, string>>((result, part) => {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }

    return result;
  }, {});
}

export function getDisplayDateByLanguage(
  value: Date | number,
  language: Language,
): Date {
  const parts = getCalendarPartsByLanguage(value, language);

  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
}

function getDayKeyByLanguage(value: Date | number, language: Language): string {
  const parts = getCalendarPartsByLanguage(value, language);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isDateTodayByLanguage(
  value: Date | number,
  language: Language,
  referenceDate: Date | number = new Date(),
): boolean {
  return getDayKeyByLanguage(value, language) === getDayKeyByLanguage(referenceDate, language);
}

export function isDateTomorrowByLanguage(
  value: Date | number,
  language: Language,
  referenceDate: Date | number = new Date(),
): boolean {
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getDayKeyByLanguage(value, language) === getDayKeyByLanguage(tomorrow, language);
}
