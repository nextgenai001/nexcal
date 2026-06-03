"use server";

import { setLocaleAction as setLocale } from "@/lib/i18n/server";

export async function setLocaleAction(locale: string) {
  await setLocale(locale);
}
