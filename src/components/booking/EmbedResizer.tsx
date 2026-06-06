"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function EmbedResizer() {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const [hasAddedClass, setHasAddedClass] = useState(false);

  useEffect(() => {
    if (!isEmbed) return;

    if (!hasAddedClass) {
      document.body.classList.add("nexcal-embed");
      setHasAddedClass(true);
    }

    const sendHeight = () => {
      window.parent.postMessage(
        { type: "nexcal-resize", height: document.body.scrollHeight },
        "*"
      );
    };

    // Initial check
    sendHeight();

    // Use ResizeObserver to detect changes
    const resizeObserver = new ResizeObserver(() => {
      sendHeight();
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      if (hasAddedClass) {
        document.body.classList.remove("nexcal-embed");
      }
    };
  }, [isEmbed, hasAddedClass]);

  // Render a tiny style block to remove default margins/paddings or background
  if (!isEmbed) return null;

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      body.nexcal-embed {
        background: transparent !important;
      }
      body.nexcal-embed main {
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }
    `}} />
  );
}
