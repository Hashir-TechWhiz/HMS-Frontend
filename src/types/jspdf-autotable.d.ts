declare module 'jspdf-autotable' {
    import { jsPDF } from 'jspdf';

    interface AutoTableOptions {
        head?: any[][];
        body?: any[][];
        startY?: number;
        theme?: 'striped' | 'grid' | 'plain';
        styles?: {
            fontSize?: number;
            cellPadding?: number;
            [key: string]: any;
        };
        headStyles?: {
            fillColor?: number[];
            textColor?: number | number[];
            fontStyle?: string;
            [key: string]: any;
        };
        alternateRowStyles?: {
            fillColor?: number[];
            [key: string]: any;
        };
        margin?: {
            top?: number;
            right?: number;
            bottom?: number;
            left?: number;
        };
        [key: string]: any;
    }

    function autoTable(doc: jsPDF, options: AutoTableOptions): void;
    export default autoTable;
}
