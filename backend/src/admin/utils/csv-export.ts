/**
 * Safe and universal CSV exporter with UTF-8 BOM support.
 * Works seamlessly across Microsoft Excel, LibreOffice Calc, Google Sheets, and Numbers.
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map(row => row.map(escapeCSV).join(","))
  ].join("\r\n")

  // \uFEFF is the UTF-8 Byte Order Mark (BOM).
  // Excel and LibreOffice require BOM to automatically detect UTF-8 formatting,
  // preventing encoding errors for currency symbols (₹), special chars, and phone numbers.
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up memory
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
