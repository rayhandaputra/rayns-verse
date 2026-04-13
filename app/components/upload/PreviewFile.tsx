// components/upload/PreviewFile.tsx
type Props = {
  file: File;
  onRemove: () => void;
};

export function PreviewFile({ file, onRemove }: Props) {
  const url = URL.createObjectURL(file);

  return (
    <div className="border rounded-xl overflow-hidden">
      <img src={url} alt={file.name} className="w-full h-32 object-cover" />
      <button
        onClick={onRemove}
        className="w-full py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200"
      >
        Hapus
      </button>
    </div>
  );
}
