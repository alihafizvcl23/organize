import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const euro = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(value || 0);

export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(value) ? "Europe/Amsterdam" : "UTC",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(value) ? value : `${value}Z`));

export const dateOnly = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T12:00:00Z`));

export const todayInAmsterdam = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());

export const localDateInAmsterdam = (value: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date(value));

export function amsterdamDayBounds(day = todayInAmsterdam()) {
  const [year, month, date] = day.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, date + 1));
  const next = [nextDate.getUTCFullYear(), String(nextDate.getUTCMonth() + 1).padStart(2, "0"), String(nextDate.getUTCDate()).padStart(2, "0")].join("-");
  const start = localMidnightUtc(day);
  const end = localMidnightUtc(next);
  return { start: start.toISOString(), end: end.toISOString() };
}

function localMidnightUtc(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  const localNoonUtc = new Date(Date.UTC(year, month - 1, date, 12));
  const offsetText = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Amsterdam",
    timeZoneName: "shortOffset",
  }).formatToParts(localNoonUtc).find((part) => part.type === "timeZoneName")?.value ?? "GMT+0";
  const offset = offsetText.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!offset) throw new Error(`Could not determine the Amsterdam time zone: ${offsetText}`);
  const minutes = (Number(offset[2]) * 60 + Number(offset[3] ?? 0)) * (offset[1] === "-" ? -1 : 1);
  return new Date(Date.UTC(year, month - 1, date) - minutes * 60_000);
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}
