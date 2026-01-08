import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export Utilities
 * Reusable functions for exporting data to CSV and PDF formats
 */

interface ExportColumn {
    header: string;
    dataKey: string;
    formatter?: (value: any) => string;
}

/**
 * Export data to CSV format
 * @param data - Array of objects to export
 * @param columns - Column definitions
 * @param filename - Output filename (without extension)
 */
export const exportToCSV = <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    filename: string
): void => {
    if (!data || data.length === 0) {
        return;
    }

    // Create CSV header
    const headers = columns.map(col => col.header);
    const csvRows: string[] = [headers.join(',')];

    // Add data rows
    data.forEach(item => {
        const row = columns.map(col => {
            const value = item[col.dataKey];
            const formattedValue = col.formatter ? col.formatter(value) : value;

            // Escape quotes and wrap in quotes if contains comma or quote
            const stringValue = String(formattedValue ?? '');
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        csvRows.push(row.join(','));
    });

    // Create blob and trigger download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export data to PDF format
 * @param data - Array of objects to export
 * @param columns - Column definitions
 * @param filename - Output filename (without extension)
 * @param title - Document title
 */
export const exportToPDF = <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    filename: string,
    title: string
): void => {
    if (!data || data.length === 0) {
        return;
    }

    // Create PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 20);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    // Prepare table data
    const tableHeaders = columns.map(col => col.header);
    const tableRows = data.map(item =>
        columns.map(col => {
            const value = item[col.dataKey];
            const formattedValue = col.formatter ? col.formatter(value) : value;
            return String(formattedValue ?? '');
        })
    );

    // Generate table
    autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        margin: { top: 35 },
    });

    // Save PDF
    doc.save(`${filename}.pdf`);
};

/**
 * Format date for export
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDateForExport = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Format datetime for export
 * @param dateString - ISO date string
 * @returns Formatted datetime string
 */
export const formatDateTimeForExport = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Format currency for export
 * @param amount - Numeric amount
 * @returns Formatted currency string
 */
export const formatCurrencyForExport = (amount: number): string => {
    if (typeof amount !== 'number') return '';
    return `LKR ${amount.toLocaleString()}`;
};

/**
 * Format status for export
 * @param status - Status string
 * @returns Capitalized status
 */
export const formatStatusForExport = (status: string): string => {
    if (!status) return '';
    return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
