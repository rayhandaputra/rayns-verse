import React, { useEffect, useRef, useState } from "react";

export function PDFViewerClient({ pdfUrl }: { pdfUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const viewerUrl = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`;

  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const blocked =
        (e.ctrlKey || e.metaKey) &&
        ["s", "p", "u", "c", "a"].includes(key);
      const blockedShift =
        (e.ctrlKey || e.metaKey) && e.shiftKey && ["s", "p", "i", "c"].includes(key);
      const printScreen = key === "printscreen" || e.code === "PrintScreen";
      const f12 = key === "f12";

      if (blocked || blockedShift || printScreen || f12) {
        e.preventDefault();
        e.stopPropagation();
        if (printScreen) {
          navigator.clipboard?.writeText("").catch(() => {});
          setIsHidden(true);
          setTimeout(() => setIsHidden(false), 1500);
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") setIsHidden(true);
      else setIsHidden(false);
    };

    const handleBlur = () => setIsHidden(true);
    const handleFocus = () => setIsHidden(false);

    const handleDragStart = (e: DragEvent) => e.preventDefault();
    const handleSelectStart = (e: Event) => e.preventDefault();

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-[80vh] md:h-screen bg-[#0a0a0a] select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="w-full bg-[#141414] border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-violet-600 p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <span className="text-white font-bold text-sm tracking-tight uppercase">Digital Catalog • Kinau.id</span>
        </div>
        <button
          onClick={handleFullscreen}
          className="p-2 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors text-white"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          )}
        </button>
      </div>

      <div className="flex-1 w-full bg-[#0a0a0a] relative overflow-hidden">
        <iframe
          src={viewerUrl}
          className="w-full h-full border-none pdf-protected"
          title="Digital Catalog"
          referrerPolicy="no-referrer"
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(45deg, transparent 0 120px, rgba(139,92,246,0.04) 120px 122px)",
          }}
        />

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <span className="text-white/5 text-6xl font-black uppercase tracking-widest rotate-[-30deg] select-none">
            Kinau.id
          </span>
        </div>

        {isHidden && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
            <span className="text-white/60 text-sm uppercase tracking-widest">
              Content Protected
            </span>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        body { margin: 0; overflow: hidden; }
        .pdf-protected {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          pointer-events: auto;
        }
        @media print {
          body * { display: none !important; visibility: hidden !important; }
          body::after {
            content: "Printing is disabled for this content.";
            display: block !important;
            visibility: visible !important;
            font-size: 24px;
            text-align: center;
            margin-top: 50vh;
          }
        }
      `}} />
    </div>
  );
}
