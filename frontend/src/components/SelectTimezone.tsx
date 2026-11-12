import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";

const TIMEZONES = Intl.supportedValuesOf("timeZone");

export function SelectTimezone({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <Combobox
      items={TIMEZONES}
      value={value}
      onValueChange={(tz) => onChange(tz ?? "")}
    >
      <ComboboxInput
        placeholder="Select timezone"
        className="w-full"
        id="timezone"
      />

      <ComboboxContent>
        <ComboboxEmpty>No timezone found.</ComboboxEmpty>

        <ComboboxList>
          {(tz: string) => (
            <ComboboxItem key={tz} value={tz}>
              {tz.replaceAll("_", " ")}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
