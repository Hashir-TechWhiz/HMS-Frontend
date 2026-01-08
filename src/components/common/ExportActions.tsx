"use client";

import { Download, FileDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportActionsProps {
    onExport: (format: 'csv' | 'pdf') => void;
    disabled?: boolean;
}

const ExportActions = ({ onExport, disabled = false }: ExportActionsProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="lg"
                    disabled={disabled}
                    className="gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => onExport('csv')}
                    disabled={disabled}
                    className="cursor-pointer"
                >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onExport('pdf')}
                    disabled={disabled}
                    className="cursor-pointer"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export as PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ExportActions;
