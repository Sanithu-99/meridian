"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Diagram } from "@/lib/diagrams";

const MermaidRenderer = dynamic(() => import("./MermaidRenderer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 text-sm text-gray-400 dark:text-gray-600">
      Loading renderer…
    </div>
  ),
});

const APP_TITLE = "Meridian";
const MIN_SCALE = 0.05;
const MAX_SCALE = 8;
const PADDING = 64; // px padding inside the canvas before the diagram

export function DiagramViewer({ diagrams }: { diagrams: Diagram[] }) {
  const [selected, setSelected] = useState<Diagram | null>(
    diagrams[0] ?? null
  );
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Apply class-based dark mode to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Auto-fit: called by MermaidRenderer once SVG is in the DOM
  const handleDiagramReady = useCallback(
    (svgW: number, svgH: number) => {
      if (!canvasRef.current) return;
      const { width: cw, height: ch } =
        canvasRef.current.getBoundingClientRect();
      if (!cw || !ch) return;
      const contentW = svgW + PADDING * 2;
      const contentH = svgH + PADDING * 2;
      const s = Math.min(cw / contentW, ch / contentH) * 0.9;
      setScale(s);
      setOffset({
        x: (cw - contentW * s) / 2,
        y: (ch - contentH * s) / 2,
      });
    },
    [] // stable: uses only refs and state setters
  );

  // Imperative event listeners — wheel/touch need passive:false; dragstart
  // prevention stops Chrome from treating SVG elements as draggable images.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault(); // stops browser native SVG drag (the pan-break culprit)
      dragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      setOffset((o) => ({
        x: o.x + e.clientX - lastPos.current.x,
        y: o.y + e.clientY - lastPos.current.y,
      }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      canvas.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      // Zoom toward the cursor position
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setScale((s) => {
        const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * factor));
        setOffset((o) => ({
          x: mx - (mx - o.x) * (ns / s),
          y: my - (my - o.y) * (ns / s),
        }));
        return ns;
      });
    };

    const onDragStart = (e: DragEvent) => e.preventDefault();

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      dragging.current = true;
      lastPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || e.touches.length !== 1) return;
      e.preventDefault();
      setOffset((o) => ({
        x: o.x + e.touches[0].clientX - lastPos.current.x,
        y: o.y + e.touches[0].clientY - lastPos.current.y,
      }));
      lastPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const onTouchEnd = () => {
      dragging.current = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dragstart", onDragStart);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("dragstart", onDragStart);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const selectDiagram = (d: Diagram) => {
    setSelected(d);
    setSidebarOpen(false);
  };

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const zoom = (factor: number) =>
    setScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * factor)));

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        aria-label="Diagram list"
        className={[
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col shrink-0",
          "bg-white dark:bg-gray-900",
          "border-r border-gray-200 dark:border-gray-800",
          "transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-12 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <span className="text-sm font-semibold tracking-tight truncate">
            {APP_TITLE}
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-1">
          {diagrams.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-gray-400 dark:text-gray-600">
              No .mmd files found in{" "}
              <code className="font-mono text-xs">diagrams/</code>
            </p>
          ) : (
            diagrams.map((d) => (
              <button
                key={d.filename}
                onClick={() => selectDiagram(d)}
                title={d.filename}
                className={[
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  selected?.filename === d.filename
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
                ].join(" ")}
              >
                {d.title}
              </button>
            ))
          )}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Main pane ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex h-12 items-center gap-2 px-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {selected ? selected.title : "Select a diagram"}
          </h1>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => zoom(1 / 1.2)}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-lg leading-none"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              onClick={resetZoom}
              className="h-7 px-1.5 rounded text-xs font-mono tabular-nums text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[3.5rem] text-center"
              aria-label="Reset zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={() => zoom(1.2)}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-lg leading-none"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark((d) => !d)}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 17a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm8-8a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5 12a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm12.95-6.364a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM7.172 16.828a1 1 0 010 1.415l-.707.707a1 1 0 01-1.414-1.415l.707-.707a1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.415l-.707-.707a1 1 0 010-1.415zM5.636 6.343a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden bg-[#f7f7f7] dark:bg-[#0c0c0c] cursor-grab"
          style={{ userSelect: "none" }}
        >
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: "0 0",
              display: "inline-block",
              padding: `${PADDING}px`,
              // pointer-events:none so SVG elements don't absorb mousedown
              pointerEvents: "none",
            }}
          >
            {selected ? (
              <MermaidRenderer
                key={selected.filename}
                content={selected.content}
                filename={selected.filename}
                theme={dark ? "dark" : "default"}
                onReady={handleDiagramReady}
              />
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600">
                Select a diagram from the sidebar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
