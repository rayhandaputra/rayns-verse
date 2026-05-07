import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function DatePicker({ name }: { name: string }) {
  const [selected, setSelected] = useState<Date | undefined>();

  return (
    <div className="space-y-2">
      <DayPicker mode="single" selected={selected} onSelect={setSelected} />

      {/* hidden input supaya bisa dikirim ke form Remix */}
      <input
        type="hidden"
        name={name}
        value={selected ? selected.toISOString().split("T")[0] : ""}
      />

      {selected && (
        <p className="text-sm text-gray-600">
          Selected: {selected.toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
