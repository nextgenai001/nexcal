"use client";

import { useState, useMemo } from "react";

interface EventType {
  id: string;
  slug: string;
  name: string;
}

interface EmbedPreviewClientProps {
  username: string;
  eventTypes: EventType[];
}

export default function EmbedPreviewClient({ username, eventTypes }: EmbedPreviewClientProps) {
  const [selectedType, setSelectedType] = useState<string>("profile"); // 'profile' or event type slug
  const [copied, setCopied] = useState(false);
  
  // Layout presets
  const [preset, setPreset] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [customWidth, setCustomWidth] = useState<string>("100%");
  const [customHeight, setCustomHeight] = useState<number>(650);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Calculate target URL for preview (WITHOUT ?embed=true)
  const previewUrl = useMemo(() => {
    if (selectedType === "profile") {
      return `${appUrl}/${username}`;
    }
    return `${appUrl}/${username}/${selectedType}`;
  }, [appUrl, username, selectedType]);

  // Calculate target URL for final embed code (WITH ?embed=true)
  const embedUrl = useMemo(() => {
    if (selectedType === "profile") {
      return `${appUrl}/${username}?embed=true`;
    }
    return `${appUrl}/${username}/${selectedType}?embed=true`;
  }, [appUrl, username, selectedType]);

  // Dimensions based on preset or custom values
  const dims = useMemo(() => {
    switch (preset) {
      case "mobile":
        return { width: "375px", height: `${customHeight}px` };
      case "tablet":
        return { width: "768px", height: `${customHeight}px` };
      case "desktop":
      default:
        return { width: customWidth, height: `${customHeight}px` };
    }
  }, [preset, customWidth, customHeight]);

  const embedCode = useMemo(() => {
    const w = preset === "desktop" ? customWidth : dims.width;
    return `<iframe src="${embedUrl}" width="${w}" height="${customHeight}" frameborder="0"></iframe>`;
  }, [embedUrl, preset, customWidth, customHeight, dims.width]);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Configuration Column */}
      <div className="space-y-6 lg:col-span-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <h3 className="text-base font-semibold text-white">Embed Configuration</h3>
          
          {/* Target Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Page to Embed
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            >
              <option value="profile">Profile Page (All Event Types)</option>
              {eventTypes.map((type) => (
                <option key={type.id} value={type.slug}>
                  {type.name} (/{type.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Size / Preset Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Device Preview
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-black/30 p-1">
              {(["desktop", "tablet", "mobile"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPreset(mode)}
                  className={`rounded-md py-1.5 text-xs font-medium capitalize transition-all duration-150 ${
                    preset === mode
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Height Adjuster */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Height
              </label>
              <span className="text-xs text-slate-500 font-mono">{customHeight}px</span>
            </div>
            <input
              type="range"
              min={450}
              max={1000}
              step={50}
              value={customHeight}
              onChange={(e) => setCustomHeight(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Generated Embed Code Section */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Embed Code</h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                  Copy Code
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3.5 text-xs text-slate-400 border border-slate-900">
            <code className="whitespace-pre-wrap font-mono break-all">{embedCode}</code>
          </pre>
        </div>
      </div>

      {/* Preview Column */}
      <div className="flex flex-col items-center justify-start lg:col-span-8">
        <div className="w-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col h-full">
          {/* Mock Browser Header */}
          <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-3 shrink-0">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <div className="ml-4 flex-1 max-w-lg rounded bg-slate-950 px-3 py-1 text-center text-xs text-slate-500 truncate select-all">
              {previewUrl}
            </div>
          </div>

          {/* Iframe Viewport wrapper */}
          <div className="flex-1 bg-slate-900/10 p-6 flex justify-center items-start overflow-y-auto">
            <div
              style={{
                width: dims.width,
                height: dims.height,
                transition: "width 0.2s ease-in-out, height 0.2s ease-in-out",
              }}
              className="rounded-lg border border-slate-800 bg-white shadow-xl overflow-hidden"
            >
              <iframe
                src={previewUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
