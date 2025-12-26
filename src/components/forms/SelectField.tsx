import { Label } from "../ui/label";
import { Controller } from "react-hook-form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SelectField = ({
    name,
    label,
    placeholder,
    options,
    control,
    error,
    required = false,
    value,
    onChange,
    width,
    className,
    iconColor = "text-white",
    disabled = false,
}: ISelectFieldProps) => {
    const renderSelect = (selectedValue: string, onValueChange: (value: string) => void) => (
        <Select
            key={selectedValue}
            value={selectedValue ?? ""}
            onValueChange={onValueChange}
            disabled={disabled}
        >
            <SelectTrigger
                iconColor={iconColor}
                disabled={disabled}
                className={cn(
                    "disable-rings w-full px-3 h-12! rounded-lg cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                <SelectValue
                    placeholder={placeholder}
                    key={`value-${selectedValue}`}
                />
            </SelectTrigger>

            <SelectContent className="text-white mt-1" side="bottom" position="popper">
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    return (
        <div className={cn("space-y-2 w-full", width)}>
            {label && (
                <Label htmlFor={name} className="text-sm font-medium text-gray-400">
                    {label}
                </Label>
            )}

            {control && name ? (
                <Controller
                    name={name}
                    control={control}
                    rules={{
                        required: required ? `Please select a ${label?.toLowerCase()}` : false,
                    }}
                    render={({ field }) => renderSelect(field.value, field.onChange)}
                />
            ) : (
                renderSelect(value ?? "", onChange ?? (() => { }))
            )}

            {error && <p className="text-sm text-error-500">{error.message}</p>}
        </div>
    );
};

export default SelectField;
