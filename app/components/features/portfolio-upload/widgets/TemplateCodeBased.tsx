import { X, Plus, Upload } from "lucide-react";
import { useRef } from "react";

interface TemplateCodeBasedProps {
  images: (string | null)[];
  onDelete: (index: number) => void;
  onReplace: (index: number) => void;
}

/**
 * Code-based template — replika visual dari LayoutCanva.png
 * Murni CSS/HTML, tanpa dependency ke file PNG.
 *
 * Layout:
 * ┌──────────┬──────────────┐
 * │  Slot 0  │              │
 * │(landscape)│   Slot 1    │
 * ├──────────┤  (portrait)  │
 * │          │              │
 * │  Slot 2  ├──────────────┤
 * │(portrait)│   Slot 3     │
 * │          │ (landscape)  │
 * └──────────┴──────────────┘
 */
export default function TemplateCodeBased({ images, onDelete, onReplace }: TemplateCodeBasedProps) {
  const templateRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--customer-primary)]">Preview Template</h3>
      <p className="text-[11px] text-[var(--customer-text-muted)]">
        Template dibuat otomatis dari foto. Klik slot untuk mengganti foto.
      </p>

      {/* Template — 4:5 aspect ratio */}
      <div className="w-full mx-auto" style={{ maxWidth: "min(100%, 380px)" }}>
        <div
          ref={templateRef}
          data-template-capture
          className="relative w-full overflow-hidden rounded-2xl shadow-lg"
          style={{ aspectRatio: "4/5" }}
        >
          {/* Background gradient — replika warna biru template */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#4FC3F7] via-[#64B5F6] to-[#42A5F5]" />

          {/* Decorative wave top-right */}
          <div className="absolute top-0 right-0 w-[60%] h-[15%] overflow-hidden">
            <div className="absolute -top-[50%] -right-[10%] w-[120%] h-[300%] rounded-[50%] bg-gradient-to-br from-[#29B6F6]/40 to-transparent" />
            <div className="absolute top-[20%] right-[5%] w-[80%] h-[2px] bg-gradient-to-r from-transparent via-[#FFC107]/60 to-[#FFC107]/80 rounded-full" />
          </div>

          {/* Decorative wave bottom-left */}
          <div className="absolute bottom-[12%] left-0 w-[50%] h-[15%] overflow-hidden">
            <div className="absolute -bottom-[50%] -left-[10%] w-[120%] h-[300%] rounded-[50%] bg-gradient-to-tl from-[#29B6F6]/40 to-transparent" />
            <div className="absolute bottom-[30%] left-[5%] w-[60%] h-[2px] bg-gradient-to-l from-transparent via-[#FFC107]/60 to-[#FFC107]/80 rounded-full" />
          </div>

          {/* Header — Logo KINAU */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center" style={{ height: "7%" }}>
            <span className="text-white font-black text-[clamp(10px,3.5vw,18px)] tracking-wider drop-shadow-md" style={{ fontFamily: "system-ui, sans-serif" }}>
              KINAU
            </span>
          </div>

          {/* Photo Grid */}
          <div className="absolute" style={{ top: "8%", left: "4%", right: "4%", bottom: "13%" }}>
            <div className="relative w-full h-full flex gap-[2.5%]">
              {/* Left Column */}
              <div className="flex-1 flex flex-col gap-[2.5%]">
                {/* Slot 0 — landscape (short, ~35% of column height) */}
                <div className="relative rounded-xl overflow-hidden border-2 border-[#D4A017]/70 shadow-inner" style={{ flex: "0 0 34%" }}>
                  <SlotContent image={images[0]} index={0} label="Foto 1" onDelete={onDelete} onReplace={onReplace} />
                </div>
                {/* Slot 2 — portrait (tall, ~65% of column height) */}
                <div className="relative flex-1 rounded-xl overflow-hidden border-2 border-[#D4A017]/70 shadow-inner">
                  <SlotContent image={images[2]} index={2} label="Foto 3" onDelete={onDelete} onReplace={onReplace} />
                </div>
              </div>

              {/* Right Column */}
              <div className="flex-1 flex flex-col gap-[2.5%]">
                {/* Slot 1 — portrait (tall, ~65% of column height) */}
                <div className="relative flex-1 rounded-xl overflow-hidden border-2 border-[#D4A017]/70 shadow-inner">
                  <SlotContent image={images[1]} index={1} label="Foto 2" onDelete={onDelete} onReplace={onReplace} />
                </div>
                {/* Slot 3 — landscape (short, ~35% of column height) */}
                <div className="relative rounded-xl overflow-hidden border-2 border-[#D4A017]/70 shadow-inner" style={{ flex: "0 0 34%" }}>
                  <SlotContent image={images[3]} index={3} label="Foto 4" onDelete={onDelete} onReplace={onReplace} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer — URL */}
          <div className="absolute bottom-[5%] left-0 right-0 flex flex-col items-center gap-1">
            <span className="text-white font-bold text-[clamp(8px,2.5vw,14px)] tracking-widest drop-shadow">
              www.kinau.id
            </span>
          </div>

          {/* Footer bar — contact info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-[#E91E63] via-[#E91E63] to-[#E91E63] flex items-center justify-center gap-4 py-[1.5%]">
            <span className="text-white text-[clamp(5px,1.5vw,8px)] font-medium">📞 0852-1933-7474</span>
            <span className="text-white text-[clamp(5px,1.5vw,8px)] font-medium">📷 kinau.id</span>
            <span className="text-white text-[clamp(5px,1.5vw,8px)] font-medium">✉️ admin@kinau.id</span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-center text-[var(--customer-text-muted)] italic">
        Template dibuat dengan kode — klik slot untuk upload/ganti foto
      </p>
    </div>
  );
}

/** Slot content — shows image or upload placeholder */
function SlotContent({
  image,
  index,
  label,
  onDelete,
  onReplace,
}: {
  image: string | null;
  index: number;
  label: string;
  onDelete: (i: number) => void;
  onReplace: (i: number) => void;
}) {
  return (
    <div className="absolute inset-0 group">
      {image ? (
        <>
          <img
            src={image}
            alt={label}
            className="w-full h-full object-cover"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); onReplace(index); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg"
            >
              Ganti Foto
            </button>
          </div>
          {/* Delete button */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(index); }}
            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
          >
            <X size={10} />
          </button>
        </>
      ) : (
        <div
          onClick={() => onReplace(index)}
          className="w-full h-full bg-black/80 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-black/60 transition-colors"
        >
          <Upload size={16} className="text-white/50" />
          <span className="text-[8px] font-bold text-white/50 uppercase">{label}</span>
        </div>
      )}
    </div>
  );
}
