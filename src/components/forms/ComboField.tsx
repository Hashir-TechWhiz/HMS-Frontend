"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import { ChevronsUpDown, Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

interface Option {
    value: string;
    label: string;
}

interface Props {
    name?: string;
    control?: any;
    label?: string;
    options: Option[];
    placeholder?: string;
    required?: boolean;
    value?: string;
    onChange?: (val: string) => void;
    disabled?: boolean;
    className?: string;
    error?: any;
}

export default function ComboBoxField({
    name,
    control,
    label,
    options,
    placeholder = "Select...",
    required = false,
    value,
    onChange,
    disabled = false,
    className,
    error,
}: Props) {
    const [open, setOpen] = useState(false);

    const renderCombo = (
        selected: string | undefined,
        setSelected: (value: string) => void
    ) => {
        const selectedLabel = options.find((o) => o.value === selected)?.label;

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                    disabled={disabled}
                    className={cn(
                        "w-full rounded-md border bg-gray-700/30 border-gray-600/80 h-11 px-3 flex items-center justify-between text-sm cursor-pointer",
                        disabled && "opacity-60 cursor-not-allowed",
                        className
                    )}
                >
                    {/* show close icon when selected */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="truncate">
                            {selectedLabel || (
                                <span className="text-gray-400">{placeholder}</span>
                            )}
                        </span>

                        {selected && (
                            <X
                                className="h-4 w-4 text-red-400 hover:text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelected("");
                                }}
                            />
                        )}
                    </div>

                    <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    className="w-(--radix-popover-trigger-width) p-0"
                >
                    <Command>
                        <CommandInput placeholder="Search..." />

                        <CommandList className="max-h-60 overflow-y-auto p-1">
                            <CommandEmpty>No results found.</CommandEmpty>

                            <CommandGroup>
                                {options.map((o) => (
                                    <CommandItem
                                        key={o.value}
                                        value={o.label}
                                        onSelect={() => {
                                            setSelected(o.value);
                                            setOpen(false);
                                        }}
                                        className="flex items-center justify-between cursor-pointer"
                                    >
                                        {o.label}
                                        {selected === o.value && (
                                            <Check className="h-4 w-4 text-blue-500" />
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    };

    if (control && name) {
        return (
            <div className="w-full">
                {label && (
                    <Label className="mb-2 block text-sm font-medium text-gray-400 text-left">
                        {label}
                    </Label>
                )}

                <Controller
                    name={name}
                    control={control}
                    rules={{
                        required: required ? `${label} is required` : false,
                    }}
                    render={({ field }) => renderCombo(field.value, field.onChange)}
                />

                {error && (
                    <p className="text-sm text-error-500 mt-1">
                        {error.message}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="w-full">
            {label && (
                <Label className="mb-2 block text-sm font-medium text-gray-400 text-left">
                    {label}
                </Label>
            )}

            {renderCombo(value, onChange ?? (() => { }))}

            {error && (
                <p className="text-sm text-error-500 mt-1">{error.message}</p>
            )}
        </div>
    );
}