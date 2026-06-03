"use client";

import { useState, useEffect } from "react";

interface EmbedUiClientProps {
  orgSlug: string;
  translations: {
    themeLabel: string;
    themeBlue: string;
    themeMono: string;
    embedModeLabel: string;
    embedModeDesc: string;
    copySnippet: string;
    snippetCopied: string;
    snippetInstructions: string;
    livePreview: string;
    noOrgError: string;
    previewWidth: string;
    previewHeight: string;
    viewExternal: string;
  };
}

export function EmbedUiClient({ orgSlug, translations }: EmbedUiClientProps) {
  const [theme, setTheme] = useState<"blue" | "mono">("mono");
  const [embed, setEmbed] = useState<boolean>(true);
  const [width, setWidth] = useState<string>("100%");
  const [height, setHeight] = useState<number>(650);
  const [copied, setCopied] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!orgSlug) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-950/10">
        <p className="text-sm font-medium text-red-800 dark:text-red-300">
          ⚠️ {translations.noOrgError}
        </p>
      </div>
    );
  }

  const embedUrl = `${origin}/org/${orgSlug}?embed=${embed}&theme=${theme}`;
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="${height}px" style="border: none; border-radius: 12px; background: transparent;"></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Settings Panel */}
      <div className="space-y-6 lg:col-span-5">
        {/* Configuration Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
            Widget Settings
          </h2>

          <div className="space-y-5">
            {/* Theme Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {translations.themeLabel}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("blue")}
                  className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                    theme === "blue"
                      ? "border-blue-500 bg-blue-50/50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/20 dark:text-blue-300"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-blue-600 mb-2"></span>
                  <span className="text-xs font-semibold">{translations.themeBlue}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("mono")}
                  className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                    theme === "mono"
                      ? "border-slate-950 bg-slate-50 text-slate-950 dark:border-white dark:bg-slate-900 dark:text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-slate-950 border border-slate-700 mb-2 dark:bg-white"></span>
                  <span className="text-xs font-semibold">{translations.themeMono}</span>
                </button>
              </div>
            </div>

            {/* Embed Toggle */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={embed}
                  onChange={(e) => setEmbed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                />
                <div>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {translations.embedModeLabel}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {translations.embedModeDesc}
                  </span>
                </div>
              </label>
            </div>

            {/* Dimension Adjusters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Width Preview
                </label>
                <select
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="100%">100% (Responsive)</option>
                  <option value="900px">900px (Desktop)</option>
                  <option value="768px">768px (Tablet)</option>
                  <option value="480px">480px (Mobile Large)</option>
                  <option value="375px">375px (Mobile Small)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Widget Height
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="400"
                    max="1200"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-400 font-medium">px</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Snippet Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              HTML Code Snippet
            </h3>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {translations.snippetCopied}
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m9.75-1.5V1.5c0-.621-.504-1.125-1.125-1.125h-9.75a1.125 1.125 0 0 0-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h9.75a1.125 1.125 0 0 0 1.125-1.125V16.5M16.5 4.5h-9.75V1.5H16.5v3M16.5 21h-9.75v-3H16.5v3Z" />
                  </svg>
                  {translations.copySnippet}
                </>
              )}
            </button>
          </div>

          <div className="relative mb-4">
            <textarea
              readOnly
              value={iframeCode}
              rows={4}
              className="w-full font-mono text-xs rounded-xl border border-slate-200 bg-slate-900 p-4 text-slate-300 dark:border-slate-800 focus:outline-hidden"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            ℹ️ {translations.snippetInstructions}
          </p>

          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800 flex justify-end">
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {translations.viewExternal}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {translations.livePreview}
        </h3>

        {/* Mock Browser Container */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-lg dark:border-slate-800 dark:bg-slate-950 flex flex-col">
          {/* Mock Browser Topbar */}
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            {/* Window Dots */}
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400"></span>
              <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
              <span className="h-3 w-3 rounded-full bg-green-400"></span>
            </div>

            {/* URL Bar */}
            <div className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-400 font-mono select-all truncate dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500 max-w-md mx-auto text-center">
              {embedUrl.replace(origin, "https://yourwebsite.com")}
            </div>
          </div>

          {/* Device Resize Preview Wrapper */}
          <div className="flex justify-center bg-slate-100 p-4 dark:bg-slate-900/50 min-h-[500px]">
            <div
              style={{ width: width }}
              className="transition-all duration-300 rounded-xl bg-white border border-slate-200/80 shadow-md dark:bg-slate-950 dark:border-slate-800/80 overflow-hidden"
            >
              {origin && (
                <iframe
                  src={embedUrl}
                  style={{ width: "100%", height: `${height}px`, border: "none" }}
                  key={embedUrl}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
