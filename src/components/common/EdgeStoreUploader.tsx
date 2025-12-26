"use client";

import React,
{
    useState,
    useRef,
    useEffect
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Image as ImageIcon } from "lucide-react";

interface EdgeStoreUploaderProps {
    maxFiles?: number;
    maxSizeMB?: number;
    value?: (File | string)[];
    onChange?: (value: (File | string)[]) => void;
    error?: string;
    initialUrls?: string[];
}

export const EdgeStoreUploader: React.FC<EdgeStoreUploaderProps> = ({
    maxFiles = 4,
    maxSizeMB = 4,
    value = [],
    onChange,
    error,
    initialUrls = [],
}) => {
    const [fileSlots, setFileSlots] = useState<(File | string | null)[]>(() => {
        if (initialUrls.length > 0) {
            return Array(maxFiles)
                .fill(null)
                .map((_, i) => initialUrls[i] || null);
        }
        return Array(maxFiles).fill(null);
    });
    const [slotErrors, setSlotErrors] = useState<(string | null)[]>(Array(maxFiles).fill(null));
    const [globalError, setGlobalError] = useState<string | null>(null);
    const multiInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (onChange) {
            const filtered = fileSlots.filter(Boolean) as (File | string)[];
            onChange(filtered);
        }
    }, [fileSlots, onChange]);


    const isDuplicateImage = (file: File, excludeIndex?: number) => {
        return (
            fileSlots.some((existing, i) => {
                if (i === excludeIndex) return false;
                if (existing instanceof File)
                    return existing.name === file.name && existing.size === file.size;
                if (typeof existing === "string")
                    return existing.split("/").pop() === file.name;
                return false;
            }) ||
            initialUrls.some((url) => url.split("/").pop() === file.name)
        );
    };


    const handleMultipleFileSelect = (files: FileList) => {
        const validFiles = Array.from(files).slice(0, maxFiles);
        const newSlots = [...fileSlots];
        const newErrors = [...slotErrors];
        let foundDuplicate = false;

        validFiles.forEach((file) => {
            if (isDuplicateImage(file)) {
                foundDuplicate = true;
                return;
            }

            const emptyIndex = newSlots.findIndex((f) => f === null);
            if (emptyIndex !== -1) {
                const sizeMB = file.size / (1024 * 1024);
                if (sizeMB > maxSizeMB) {
                    newErrors[emptyIndex] = `File exceeds ${maxSizeMB} MB limit.`;
                } else {
                    newErrors[emptyIndex] = null;
                    newSlots[emptyIndex] = file;
                }
            }
        });

        setSlotErrors(newErrors);
        setFileSlots([...newSlots]);
        if (foundDuplicate) setGlobalError("This image is already uploaded.");
        else setGlobalError(null);


        if (multiInputRef.current) multiInputRef.current.value = "";
    };

    const handleSingleFileChange = (index: number, file: File | null, inputEl: HTMLInputElement | null) => {
        const newSlots = [...fileSlots];
        const newErrors = [...slotErrors];
        let foundDuplicate = false;

        if (file) {
            if (isDuplicateImage(file, index)) {
                foundDuplicate = true;
                // block adding
            } else {
                const sizeMB = file.size / (1024 * 1024);
                if (sizeMB > maxSizeMB) {
                    newErrors[index] = `File exceeds ${maxSizeMB} MB limit.`;
                    newSlots[index] = null;
                } else {
                    newErrors[index] = null;
                    newSlots[index] = file;
                }
            }
        } else {
            newErrors[index] = null;
            newSlots[index] = null;
        }

        setSlotErrors(newErrors);
        setFileSlots([...newSlots]);
        setGlobalError(foundDuplicate ? "This image is already uploaded." : null);


        if (inputEl) inputEl.value = "";
    };

    const handleRemove = (index: number) => {
        const newSlots = [...fileSlots];
        newSlots[index] = null;
        setFileSlots(newSlots);
        setGlobalError(null);
    };

    return (
        <div className="w-full space-y-3">
            <div>
                <h3 className="text-sm font-semibold text-gray-200">Product Images</h3>
                <p className="text-xs text-blue-400 mt-1">
                    Note: PNG, JPG, SVG, WEBP (max {maxSizeMB} MB each)
                </p>
            </div>

            <input
                type="file"
                accept="image/*"
                multiple
                ref={multiInputRef}
                className="hidden"
                onChange={(e) => e.target.files && handleMultipleFileSelect(e.target.files)}
            />

            <div className="grid md:grid-cols-4 gap-4 mt-3">
                {fileSlots.map((slot, index) => (
                    <div key={index} className="flex flex-col items-center w-full">
                        <div
                            className={cn(
                                "relative flex items-center justify-center border-2 border-dashed rounded-xl h-36 w-full cursor-pointer transition",
                                slot
                                    ? "border-blue-500 bg-blue-900/10 hover:opacity-90"
                                    : "border-blue-400/30 hover:border-blue-400"
                            )}
                            onClick={() => {
                                const hasEmpty = fileSlots.some((f) => f === null);
                                if (hasEmpty) multiInputRef.current?.click();
                                else document.getElementById(`file-input-${index}`)?.click();
                            }}
                        >
                            {slot ? (
                                <>
                                    <Image
                                        src={
                                            typeof slot === "string"
                                                ? slot
                                                : URL.createObjectURL(slot)
                                        }
                                        alt={`Image ${index + 1}`}
                                        fill
                                        className="object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove(index);
                                        }}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <ImageIcon className="w-8 h-8 text-blue-400" />
                                    <p className="text-xs text-blue-300">Photo {index + 1}</p>
                                </div>
                            )}

                            <input
                                id={`file-input-${index}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                    handleSingleFileChange(index, e.target.files?.[0] || null, e.target)
                                }
                            />
                        </div>

                        {slotErrors[index] && (
                            <p className="text-xs text-red-400 mt-1 text-center w-full">
                                {slotErrors[index]}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {globalError && (
                <p className="text-sm text-red-500 font-semibold mt-3 text-center">
                    {globalError}
                </p>
            )}
            {!globalError && error && (
                <p className="text-sm text-red-400 font-medium mt-2 text-center">
                    {error}
                </p>
            )}
        </div>
    );
};
