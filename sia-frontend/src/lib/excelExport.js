import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Generate a beautifully formatted Excel file
 * @param {string} fileName - Name of the output file
 * @param {Array} sheetsData - Array of objects for each sheet
 *   [{
 *     sheetName: 'Sheet 1',
 *     columns: [{ header: 'Nama', key: 'nama', width: 20 }, ...],
 *     data: [{ nama: 'Budi' }, ...]
 *   }]
 */
export const generateExcel = async (fileName, sheetsData) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Informasi Alumni';
  workbook.created = new Date();

  sheetsData.forEach((sheetObj) => {
    const sheet = workbook.addWorksheet(sheetObj.sheetName, {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] // Freeze baris pertama (Header)
    });

    // Set kolom dan ukuran default
    const columns = sheetObj.columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 15
    }));
    sheet.columns = columns;

    // Masukkan data
    sheet.addRows(sheetObj.data);

    // --- STYLING HEADER ---
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' } // Warna Indigo-600
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25; // Tinggi header sedikit lebih besar

    // --- AUTO FIT & ZEBRA STRIPING ---
    sheet.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const column = sheet.getColumn(colNumber);
        // Menghitung panjang teks
        let cellLength = cell.value ? cell.value.toString().length : 0;
        
        // Memberikan padding tambahan
        cellLength += 4; 

        // Update panjang kolom jika teks lebih panjang dari lebar saat ini
        if (!column.width || column.width < cellLength) {
          // Batasi lebar maksimal agar tidak terlalu melar untuk teks esai panjang
          column.width = cellLength > 50 ? 50 : cellLength; 
        }
        
        // Atur perataan teks (wrap text untuk sel yang isinya panjang)
        if (cellLength > 50) {
            cell.alignment = { wrapText: true, vertical: 'top' };
        } else if (rowNumber > 1) {
            cell.alignment = { vertical: 'middle' };
        }

        // Tambahkan border abu-abu tipis ke semua sel
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });

      // Zebra striping untuk baris isi (skip header)
      if (rowNumber > 1) {
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' } // Slate-50
          };
        }
      }
    });
  });

  // Convert ke Blob dan Trigger Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};
