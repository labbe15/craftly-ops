import * as XLSX from "xlsx";
import Papa from "papaparse";

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<keyof T, string>
): void {
  // Si headers est fourni, renommer les colonnes
  const dataToExport = headers
    ? data.map(row => {
        const newRow: Record<string, any> = {};
        Object.keys(headers).forEach(key => {
          newRow[headers[key as keyof T]] = row[key];
        });
        return newRow;
      })
    : data;

  const csv = Papa.unparse(dataToExport);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = "Export",
  headers?: Record<keyof T, string>
): void {
  // Si headers est fourni, renommer les colonnes
  const dataToExport = headers
    ? data.map(row => {
        const newRow: Record<string, any> = {};
        Object.keys(headers).forEach(key => {
          newRow[headers[key as keyof T]] = row[key];
        });
        return newRow;
      })
    : data;

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(dataToExport[0] || {}).map(key => {
    const maxLength = Math.max(
      key.length,
      ...dataToExport.map(row => String(row[key] || "").length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Export multiple sheets
export function exportToExcelMultiSheet(
  sheets: Array<{
    data: Record<string, any>[];
    name: string;
    headers?: Record<string, string>;
  }>,
  filename: string
): void {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ data, name, headers }) => {
    const dataToExport = headers
      ? data.map(row => {
          const newRow: Record<string, any> = {};
          Object.keys(headers).forEach(key => {
            newRow[headers[key]] = row[key];
          });
          return newRow;
        })
      : data;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(dataToExport[0] || {}).map(key => {
      const maxLength = Math.max(
        key.length,
        ...dataToExport.map(row => String(row[key] || "").length)
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
