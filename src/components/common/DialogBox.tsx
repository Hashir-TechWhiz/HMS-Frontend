"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface DialogBoxProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    children?: React.ReactNode;
    showFooter?: boolean;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    disableConfirm?: boolean;
    confirmLoading?: boolean;
    widthClass?: string;
    showCloseIcon?: boolean;
    variant?: "default" | "danger" | "success" | "warning" | "info";
    centerTitle?: boolean;
}

const DialogBox = ({
    open,
    onOpenChange,
    title,
    description,
    children,
    showFooter = false,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    disableConfirm = false,
    confirmLoading = false,
    widthClass,
    showCloseIcon = true,
    variant = "default",
    centerTitle = false,
}: DialogBoxProps) => {
    const variantStyles = {
        default: "bg-blue-600 hover:bg-blue-700 text-white border-blue-700",
        danger: "bg-red-700 hover:bg-red-500 text-white border-red-700",
        success: "bg-green-600 hover:bg-green-700 text-white border-green-700",
        warning: "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-600",
        info: "bg-gray-600 hover:bg-gray-700 text-white border-gray-700",
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "text-gray-100 border border-gray-500/30 rounded-xl p-0 z-50 shadow-lg shadow-white/10 lg:min-w-xl w-full",
                    widthClass
                )}
            >
                {!title && (
                    <VisuallyHidden>
                        <DialogTitle>Dialog Window</DialogTitle>
                    </VisuallyHidden>
                )}

                {/* Header */}
                {(title || description || showCloseIcon) && (
                    <DialogHeader
                        className={cn(
                            "border-b border-gray-800 px-6 py-4 flex flex-col items-start justify-center",
                            centerTitle && "items-center text-center"
                        )}
                    >
                        {title && (
                            <DialogTitle
                                className={cn(
                                    "text-lg font-semibold",
                                    centerTitle && "text-center w-full"
                                )}
                            >
                                {title}
                            </DialogTitle>
                        )}
                        {description && (
                            <DialogDescription
                                className={cn(
                                    "text-sm text-gray-400 whitespace-pre-line",
                                    centerTitle && "text-center w-full"
                                )}
                            >
                                {description}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                )}

                {/* Scrollable content area */}
                {children && (
                    <div
                        className="px-6 overflow-y-auto max-h-[80dvh] sm:max-h-[82dvh]">
                        {children}
                    </div>
                )}

                {/* Footer */}
                {showFooter && (
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full border-t border-gray-800 px-6 py-4">
                        <Button
                            variant="outline"
                            onClick={onCancel ?? (() => onOpenChange(false))}
                            className="flex-1 border-gray-700 hover:bg-gray-800 h-10 cursor-pointer"
                            disabled={confirmLoading}
                        >
                            {cancelText}
                        </Button>

                        <Button
                            onClick={onConfirm}
                            disabled={disableConfirm || confirmLoading}
                            className={cn(
                                "sm:w-auto flex-1 transition-colors border flex items-center justify-center gap-2 h-10",
                                variantStyles[variant]
                            )}
                        >
                            {confirmLoading && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {confirmLoading ? "Processing..." : confirmText}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default DialogBox;
