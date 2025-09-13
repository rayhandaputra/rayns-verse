type DateInputProps = {
  name: string;
  label?: string;
  defaultValue?: string; // format: YYYY-MM-DD
};

export default function DateInput({
  name,
  label,
  defaultValue,
}: DateInputProps) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-gray-700">{label}</span>}
      <input
        type="date"
        name={name}
        defaultValue={defaultValue}
        className="border rounded-md px-3 py-2 w-full text-gray-800"
      />
    </label>
  );
}
