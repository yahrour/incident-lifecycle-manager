export function Field({
  label,
  name,
  type,
  autoComplete,
  required = true,
  disabled = false,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-50"
      />
    </div>
  );
}
