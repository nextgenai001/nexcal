"use client";

import React, { createContext, useContext } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Translations = Record<string, any>;

const I18nContext = createContext<{
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
} | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: string;
  dictionary: Translations;
  children: React.ReactNode;
}) {
  const t = (key: string, params?: Record<string, string | number>): string => {
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
  };

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
