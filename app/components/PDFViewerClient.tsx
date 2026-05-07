import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Lock, AlertCircle, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";

// Set worker from CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PDFViewerClient({ pdfUrl }: { pdfUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Deterrent for screenshots (CSS-based)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "p" || e.key === "s" || e.key === "u")
      ) {
        e.preventDefault();
        alert("Aksi ini tidak diizinkan untuk melindungi hak cipta.");
      }

      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("");
        alert("Screenshot tidak diizinkan.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => Math.min(numPages, Math.max(1, prevPageNumber + offset)));
  };

  return (
    <div 
      className="min-h-screen bg-[#121212] flex flex-col items-center select-none w-full"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header / Toolbar */}
      <div className="w-full bg-[#1a1a1a] border-b border-gray-800 p-4 sticky top-0 z-50 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-violet-600 p-2 rounded-xl">
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight uppercase">KATALOG PRODUK</h1>
            <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest">Digital Catalog • Protected Content</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#242424] rounded-xl flex items-center p-1 border border-gray-700">
            <button 
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 text-xs font-bold text-violet-400 min-w-[80px] text-center">
              {pageNumber} / {numPages || "--"}
            </span>
            <button 
              onClick={() => changePage(1)}
              disabled={pageNumber >= numPages}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="hidden md:flex bg-[#242424] rounded-xl items-center p-1 border border-gray-700">
            <button 
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ZoomOut size={18} />
            </button>
            <span className="px-2 text-[10px] font-bold text-gray-500">{Math.round(scale * 100)}%</span>
            <button 
              onClick={() => setScale(s => Math.min(2.5, s + 0.1))}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ZoomIn size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
          <Lock className="text-red-500" size={12} />
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Read Only</span>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="flex-1 w-full flex flex-col items-center p-4 md:p-8 overflow-auto">
        <div className="relative group max-w-full">
          <div className="absolute inset-0 z-10 bg-transparent cursor-default" />
          
          <div className="bg-white shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-gray-800 max-w-full">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="w-[300px] h-[400px] md:w-[600px] md:h-[800px] bg-[#1a1a1a] flex flex-col items-center justify-center gap-4">
                  <Loader2 className="text-violet-500 animate-spin" size={48} />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Memuat Katalog...</p>
                </div>
              }
              error={
                <div className="w-[300px] h-[400px] md:w-[600px] md:h-[800px] bg-[#1a1a1a] flex flex-col items-center justify-center p-10 text-center">
                  <AlertCircle className="text-red-500 mb-4" size={48} />
                  <h3 className="text-white font-bold mb-2">Gagal Memuat PDF</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    Pastikan file <b>/public/catalog.pdf</b> sudah tersedia di server atau periksa koneksi internet Anda.
                  </p>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={typeof window !== 'undefined' ? (window.innerWidth < 768 ? window.innerWidth - 40 : undefined) : undefined}
              />
            </Document>
          </div>
        </div>

        {/* Floating Security Banner */}
        <div className="mt-12 max-w-lg w-full bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl flex items-start gap-4 shadow-xl">
          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            <AlertCircle className="text-amber-500" size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-tight mb-1">Proteksi Konten Digital</h4>
            <p className="text-gray-500 text-xs leading-relaxed">
              Katalog ini dilindungi hak cipta. Sistem memantau aktivitas yang tidak sah termasuk upaya unduhan dan tangkapan layar. Harap hubungi admin untuk mendapatkan salinan resmi.
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { display: none !important; }
        }
        ::selection {
          background: transparent;
        }
      `}} />
    </div>
  );
}
