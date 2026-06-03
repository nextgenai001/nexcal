import { cookies } from "next/headers";
import en from "./locales/en.json";
import id from "./locales/id.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dictionaries: Record<string, any> = { en, id };

export async function getLocale() {
  const cookieStore = await cookies();
  return cookieStore.get("NEXT_LOCALE")?.value || "en";
}

export async function getDictionary(locale: string) {
  return dictionaries[locale] || dictionaries.en;
}

export async function setLocaleAction(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: "/",
  });
}

export async function getTranslator() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return {
    locale,
    dictionary,
    t: (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = dictionary;
      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = current[k];
        } else {
          return key;
        }
      }

      if (typeof current !== "string") {
        return key;
      }

      let text = current;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
        });
      }
      return text;
    },
  };
}
