import * as React from "react";
import { cn } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SelectPortal } from "@radix-ui/react-select";

export type Option = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

interface SelectBasicProps {
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string | number | undefined | null;
  defaultValue?: string | number | undefined | null;
  options: Option[];
  onChange?: (val: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * SelectBasic
 * - Controlled jika `value` diberikan
 * - Uncontrolled jika hanya `defaultValue` diberikan
 *
 * Usage:
 * <SelectBasic
 *   name="role"
 *   label="Role"
 *   placeholder="Pilih role"
 *   defaultValue="admin"
 *   onChange={(v) => setValue(v)}
 *   options={[{value: 'admin', label: 'Admin'}, ...]}
 * />
 */
export function SelectBasic({
  name,
  label,
  placeholder = "Pilih...",
  value,
  defaultValue,
  options,
  onChange,
  className,
  disabled = false,
  required = false,
}: SelectBasicProps) {
  const handleChange = (v: string) => {
    onChange?.(v);
  };

  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      )}

      <Select
        value={
          value === null || value === undefined ? undefined : String(value)
        }
        defaultValue={
          defaultValue === null || defaultValue === undefined
            ? undefined
            : String(defaultValue)
        }
        onValueChange={handleChange}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger className="w-full border border-gray-400 rounded-md">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent position="popper" className="bg-white">
            <SelectGroup>
              {options.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={String(opt.value)}
                  disabled={opt.disabled}
                  className="text-gray-900"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </SelectPortal>
      </Select>

      {name ? (
        <select
          name={name}
          //   required={required}
          defaultValue={
            defaultValue === null || defaultValue === undefined
              ? ""
              : String(defaultValue)
          }
          value={
            value === null || value === undefined ? undefined : String(value)
          }
          onChange={(e) => handleChange(e.target.value)}
          className="hidden"
          //   className="sr-only"
          aria-hidden
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={String(opt.value)}
              disabled={opt.disabled}
            >
              {opt.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

export default SelectBasic;
