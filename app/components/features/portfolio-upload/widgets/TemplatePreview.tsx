import { X, Plus, Move, ZoomIn } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

interface TemplatePreviewProps {
  images: (string | null)[];
  onDelete: (index: number) => void;
  onReplace: (index: number) => void;
  positions?: SlotTransform[];
  onPositionChange?: (index: number, pos: SlotTransform) => void;
}

/** Transform state for each image slot */
export interface SlotTransform {
  x: number; // translate X in percentage of image overflow (0 = centered)
  y: number; // translate Y in percentage of image overflow (0 = centered)
  scale: number; // zoom level (1 = cover-fit, >1 = zoomed in)
}

export type ImagePosition = SlotTransform;

const DEFAULT_TRANSFORM: SlotTransform = { x: 0, y: 0, scale: 1 };

export default function TemplatePreview({
  images,
  onDelete,
  onReplace,
  positions: externalPositions,
  onPositionChange: externalOnPositionChange,
}: TemplatePreviewProps) {
  const slotLabels = ["Foto 1", "Foto 2", "Foto 3", "Foto 4"];
  const [internalPositions, setInternalPositions] = useState<SlotTransform[]>([
    { ...DEFAULT_TRANSFORM },
    { ...DEFAULT_TRANSFORM },
    { ...DEFAULT_TRANSFORM },
    { ...DEFAULT_TRANSFORM },
  ]);

  const positions = externalPositions || internalPositions;

  const handlePositionChange = useCallback(
    (index: number, pos: SlotTransform) => {
      if (externalOnPositionChange) {
        externalOnPositionChange(index, pos);
      } else {
        setInternalPositions((prev) => {
          const next = [...prev];
          next[index] = pos;
          return next;
        });
      }
    },
    [externalOnPositionChange]
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--customer-primary)]">Preview Template</h3>
      <p className="text-[11px] text-[var(--customer-text-muted)]">
        Geser foto untuk atur posisi. Pinch/scroll untuk zoom. Klik slot kosong untuk upload.
      </p>

      {/* Template Canvas — 4:5 aspect ratio (matches LayoutCanva.png 2500x3125) */}
      <div className="w-full mx-auto" style={{ maxWidth: "min(100%, 360px)" }}>
        <div
          className="relative w-full rounded-2xl overflow-hidden border-2 border-[var(--customer-border)] shadow-lg"
          style={{ aspectRatio: "4/5" }}
        >
          {/* Frame overlay — on top of photos */}
          <img
            src="/LayoutCanva.png"
            alt="Template Frame"
            className="absolute inset-0 w-full h-full object-fill z-10 pointer-events-none"
          />

          {/* Photo slots — behind the frame */}
          <div className="absolute inset-0 z-0">
            {/* Slot 0 — top-left (landscape, short) */}
            <div className="absolute" style={{ top: "7.5%", left: "4%", width: "44%", height: "27%" }}>
              <SlotCell image={images[0]} label={slotLabels[0]} index={0} transform={positions[0]} onTransformChange={handlePositionChange} onDelete={onDelete} onReplace={onReplace} />
            </div>
            {/* Slot 1 — top-right (portrait, tall) */}
            <div className="absolute" style={{ top: "7.5%", left: "52%", width: "44%", height: "50%" }}>
              <SlotCell image={images[1]} label={slotLabels[1]} index={1} transform={positions[1]} onTransformChange={handlePositionChange} onDelete={onDelete} onReplace={onReplace} />
            </div>
            {/* Slot 2 — bottom-left (portrait, tall) */}
            <div className="absolute" style={{ top: "37%", left: "4%", width: "44%", height: "50%" }}>
              <SlotCell image={images[2]} label={slotLabels[2]} index={2} transform={positions[2]} onTransformChange={handlePositionChange} onDelete={onDelete} onReplace={onReplace} />
            </div>
            {/* Slot 3 — bottom-right (landscape, short) */}
            <div className="absolute" style={{ top: "60%", left: "52%", width: "44%", height: "27%" }}>
              <SlotCell image={images[3]} label={slotLabels[3]} index={3} transform={positions[3]} onTransformChange={handlePositionChange} onDelete={onDelete} onReplace={onReplace} />
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-center text-[var(--customer-text-muted)] italic">
        Geser = atur posisi • Pinch/scroll = zoom • Foto tidak akan melewati batas slot
      </p>
    </div>
  );
}

/**
 * SlotCell — Individual photo slot with pan + pinch-zoom
 *
 * Approach: The image is rendered larger than the container (scaled up),
 * then translated within bounds. overflow:hidden on the container clips it
 * so the image never exceeds the slot boundary.
 *
 * At scale=1, the image exactly covers the slot (object-cover equivalent).
 * At scale>1, the image is zoomed in and can be panned.
 */
function SlotCell({
  image,
  label,
  index,
  transform,
  onTransformChange,
  onDelete,
  onReplace,
}: {
  image: string | null;
  label: string;
  index: number;
  transform: SlotTransform;
  onTransformChange: (index: number, t: SlotTransform) => void;
  onDelete: (i: number) => void;
  onReplace: (i: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number } | null>(null);

  // Drag state
  const dragRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);

  // Pinch state
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const activeTouchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  const MIN_SCALE = 1;
  const MAX_SCALE = 3;

  /** Clamp translation so image always fills the slot */
  const clampTranslation = useCallback(
    (tx: number, ty: number, scale: number): { x: number; y: number } => {
      if (!containerRef.current || !imgNaturalSize) return { x: tx, y: ty };

      const rect = containerRef.current.getBoundingClientRect();
      const slotW = rect.width;
      const slotH = rect.height;

      // Compute how the image fills the slot at current scale
      const imgRatio = imgNaturalSize.w / imgNaturalSize.h;
      const slotRatio = slotW / slotH;

      let renderW: number, renderH: number;
      if (imgRatio > slotRatio) {
        // Image is wider — height fits, width overflows
        renderH = slotH * scale;
        renderW = renderH * imgRatio;
      } else {
        // Image is taller — width fits, height overflows
        renderW = slotW * scale;
        renderH = renderW / imgRatio;
      }

      // Max allowed translation (image edge must not enter the slot)
      const maxTx = Math.max(0, (renderW - slotW) / 2);
      const maxTy = Math.max(0, (renderH - slotH) / 2);

      return {
        x: Math.max(-maxTx, Math.min(maxTx, tx)),
        y: Math.max(-maxTy, Math.min(maxTy, ty)),
      };
    },
    [imgNaturalSize]
  );

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  // ── Single pointer drag ──
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!image) return;
    e.preventDefault();
    e.stopPropagation();

    activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activeTouchesRef.current.size === 1) {
      setIsDragging(true);
      dragRef.current = { startX: e.clientX, startY: e.clientY, startTx: transform.x, startTy: transform.y };
    } else if (activeTouchesRef.current.size === 2) {
      // Start pinch
      const points = Array.from(activeTouchesRef.current.values());
      const dist = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      pinchRef.current = { startDist: dist, startScale: transform.scale };
      dragRef.current = null;
      setIsDragging(false);
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!image) return;
    e.preventDefault();

    activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activeTouchesRef.current.size === 2 && pinchRef.current) {
      // Pinch zoom
      const points = Array.from(activeTouchesRef.current.values());
      const dist = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      const scaleRatio = dist / pinchRef.current.startDist;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchRef.current.startScale * scaleRatio));
      const clamped = clampTranslation(transform.x, transform.y, newScale);
      onTransformChange(index, { ...clamped, scale: newScale });
    } else if (activeTouchesRef.current.size === 1 && dragRef.current && isDragging) {
      // Pan
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      const newX = dragRef.current.startTx + deltaX;
      const newY = dragRef.current.startTy + deltaY;
      const clamped = clampTranslation(newX, newY, transform.scale);
      onTransformChange(index, { ...clamped, scale: transform.scale });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activeTouchesRef.current.delete(e.pointerId);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (activeTouchesRef.current.size < 2) {
      pinchRef.current = null;
    }
    if (activeTouchesRef.current.size === 0) {
      setIsDragging(false);
      dragRef.current = null;
    }
  };

  // ── Mouse wheel zoom ──
  const handleWheel = (e: React.WheelEvent) => {
    if (!image) return;
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale + delta));
    const clamped = clampTranslation(transform.x, transform.y, newScale);
    onTransformChange(index, { ...clamped, scale: newScale });
  };

  // Compute image style
  const getImageStyle = (): React.CSSProperties => {
    if (!containerRef.current || !imgNaturalSize) {
      return { width: "100%", height: "100%", objectFit: "cover" };
    }

    const rect = containerRef.current.getBoundingClientRect();
    const slotW = rect.width;
    const slotH = rect.height;
    const imgRatio = imgNaturalSize.w / imgNaturalSize.h;
    const slotRatio = slotW / slotH;

    let baseW: number, baseH: number;
    if (imgRatio > slotRatio) {
      baseH = slotH;
      baseW = baseH * imgRatio;
    } else {
      baseW = slotW;
      baseH = baseW / imgRatio;
    }

    const renderW = baseW * transform.scale;
    const renderH = baseH * transform.scale;

    return {
      position: "absolute",
      width: `${renderW}px`,
      height: `${renderH}px`,
      left: `${(slotW - renderW) / 2 + transform.x}px`,
      top: `${(slotH - renderH) / 2 + transform.y}px`,
      cursor: isDragging ? "grabbing" : "grab",
      userSelect: "none",
    };
  };

  // Force re-render when container resizes
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => forceUpdate((n) => n + 1));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-xl overflow-hidden border border-white/20 bg-black/60 group"
      style={{ touchAction: "none" }}
      onWheel={handleWheel}
    >
      {image ? (
        <>
          <img
            ref={imgRef}
            src={image}
            alt={`Slot ${index + 1}`}
            draggable={false}
            onLoad={handleImageLoad}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={imgNaturalSize ? getImageStyle() : { width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* Zoom indicator */}
          {transform.scale > 1 && (
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-bold rounded z-20 pointer-events-none">
              {Math.round(transform.scale * 100)}%
            </div>
          )}
          {/* Move + Zoom hint */}
          <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
            <div className="w-4 h-4 bg-black/50 text-white rounded-full flex items-center justify-center">
              <Move size={8} />
            </div>
            <div className="w-4 h-4 bg-black/50 text-white rounded-full flex items-center justify-center">
              <ZoomIn size={8} />
            </div>
          </div>
          {/* Delete button */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(index); }}
            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20"
          >
            <X size={10} />
          </button>
          {/* Replace label */}
          <div
            onClick={() => { if (!isDragging) onReplace(index); }}
            className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[7px] text-center py-0.5 font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
          >
            {label} — Klik untuk ganti
          </div>
        </>
      ) : (
        <div
          onClick={() => onReplace(index)}
          className="w-full h-full flex flex-col items-center justify-center gap-1 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span className="text-[7px] font-bold uppercase">{label}</span>
        </div>
      )}
    </div>
  );
}
