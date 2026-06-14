"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  content: string;
  filename: string;
  theme: "default" | "dark";
  onReady?: (width: number, height: number) => void;
}

export default function MermaidRenderer({
  content,
  filename,
  theme,
  onReady,
}: Props) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const cancelled = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cancelled.current = false;
    setLoading(true);
    setSvg("");
    setError("");

    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        if (cancelled.current) return;

        mermaid.initialize({
          startOnLoad: false,
          theme,
          securityLevel: "loose",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Helvetica, Arial, sans-serif",
        });

        const id = `mmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg: rendered } = await mermaid.render(id, content);
        if (cancelled.current) return;
        setSvg(rendered);
      } catch (e) {
        if (cancelled.current) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    })();

    return () => {
      cancelled.current = true;
    };
  }, [content, theme]);

  // Report rendered SVG dimensions to parent for auto-fit
  useEffect(() => {
    if (!svg || !onReady) return;
    requestAnimationFrame(() => {
      const svgEl = containerRef.current?.querySelector("svg");
      if (!svgEl) return;
      const { width, height } = svgEl.getBoundingClientRect();
      if (width > 0 && height > 0) onReady(width, height);
    });
  }, [svg, onReady]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400 dark:text-gray-600">
        Rendering…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl font-mono text-xs">
        <p className="mb-3 font-sans text-sm font-medium text-red-600 dark:text-red-400">
          <span className="font-bold">{filename}</span> — This diagram failed to
          render.
        </p>
        <pre className="mb-4 p-3 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 overflow-auto whitespace-pre-wrap break-words">
          {error}
        </pre>
        <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Raw source
        </p>
        <pre className="p-4 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 overflow-auto max-h-96 whitespace-pre text-xs leading-5">
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-output"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
