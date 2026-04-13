// components/upload/UploadButton.tsx
type Props = {
  label: string;
  onUpload: (file: File) => void;
};

export function UploadButton({ label, onUpload }: Props) {
  return (
    <label className="px-3 py-1.5 border rounded-lg text-sm cursor-pointer hover:bg-gray-50">
      {label}
      <input
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </label>
  );
}
