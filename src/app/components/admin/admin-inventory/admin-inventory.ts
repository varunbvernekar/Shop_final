// src/app/components/admin/admin-inventory/admin-inventory.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../models/product';
import { InventoryService } from '../../../services/inventory';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-inventory.html',
  styleUrls: ['./admin-inventory.css']
})
export class AdminInventory implements OnInit {
  products: Product[] = [];

  // Inventory editing
  editingProduct: Product | null = null;
  editStockLevel = 0;
  editReorderThreshold = 0;

  // Bulk import
  importFile: File | null = null;
  importInProgress = false;

  constructor(
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.inventoryService.getProducts().subscribe({
      next: products => {
        this.products = products;
      },
      error: err => {
        console.error('Failed to load products in admin inventory', err);
      }
    });
  }

  getStatusClass(product: Product): string {
    if (
      typeof product.stockLevel === 'number' &&
      typeof product.reorderThreshold === 'number' &&
      product.stockLevel <= product.reorderThreshold
    ) {
      return 'status-pill critical';
    }
    return 'status-pill healthy';
  }

  getStatusLabel(product: Product): string {
    if (
      typeof product.stockLevel === 'number' &&
      typeof product.reorderThreshold === 'number' &&
      product.stockLevel <= product.reorderThreshold
    ) {
      return 'Critical';
    }
    return 'Healthy';
  }

  // Inventory Management
  openInventoryEditor(product: Product): void {
    this.editingProduct = product;
    this.editStockLevel = product.stockLevel || 0;
    this.editReorderThreshold = product.reorderThreshold || 0;
  }

  closeInventoryEditor(): void {
    this.editingProduct = null;
  }

  saveInventoryChanges(): void {
    if (!this.editingProduct) return;

    this.inventoryService.updateInventory(
      this.editingProduct.productId,
      this.editStockLevel,
      this.editReorderThreshold
    ).subscribe({
      next: () => {
        alert('Inventory updated successfully!');
        this.refreshData();
        this.closeInventoryEditor();
        // Trigger low stock count refresh
        this.triggerLowStockRefresh();
      },
      error: err => {
        console.error('Failed to update inventory', err);
        alert('Failed to update inventory');
      }
    });
  }

  private triggerLowStockRefresh(): void {
    // Dispatch a custom event that the app component can listen to (only in browser)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    }
  }

  // Bulk Import
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importFile = input.files[0];
    }
  }

  importInventory(): void {
    if (!this.importFile) {
      alert('Please select a CSV or Excel file');
      return;
    }

    this.importInProgress = true;
    const fileName = this.importFile.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');

    if (isExcel) {
      this.importExcelFile();
    } else if (isCsv) {
      this.importCsvFile();
    } else {
      alert('Unsupported file format. Please use CSV or Excel (.xlsx, .xls) files.');
      this.importInProgress = false;
    }
  }

  private importCsvFile(): void {
    if (!this.importFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        // Expected format: productId,stockLevel,reorderThreshold
        const productIdIndex = headers.indexOf('productId');
        const stockIndex = headers.indexOf('stockLevel');
        const thresholdIndex = headers.indexOf('reorderThreshold');

        if (productIdIndex === -1 || stockIndex === -1 || thresholdIndex === -1) {
          throw new Error('Invalid CSV format. Expected columns: productId, stockLevel, reorderThreshold');
        }

        const rows: Array<{ productId: string; stockLevel: number; reorderThreshold: number }> = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const productId = values[productIdIndex];
          const stockLevel = parseInt(values[stockIndex], 10);
          const reorderThreshold = parseInt(values[thresholdIndex], 10);

          if (productId && !isNaN(stockLevel) && !isNaN(reorderThreshold)) {
            rows.push({ productId, stockLevel, reorderThreshold });
          }
        }

        this.processImportRows(rows);
      } catch (error) {
        alert('Failed to import CSV: ' + (error as Error).message);
        this.importInProgress = false;
      }
    };
    reader.readAsText(this.importFile);
  }

  private importExcelFile(): void {
    if (!this.importFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Convert ArrayBuffer to binary string for xlsx library
        const binaryString = typeof data === 'string' 
          ? data 
          : this.arrayBufferToBinaryString(data as ArrayBuffer);
        
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          throw new Error('Excel file must have at least a header row and one data row');
        }

        const headers = (jsonData[0] as string[]).map(h => String(h).trim());
        const productIdIndex = headers.findIndex(h => h.toLowerCase() === 'productid');
        const stockIndex = headers.findIndex(h => h.toLowerCase() === 'stocklevel');
        const thresholdIndex = headers.findIndex(h => h.toLowerCase() === 'reorderthreshold');

        if (productIdIndex === -1 || stockIndex === -1 || thresholdIndex === -1) {
          throw new Error('Invalid Excel format. Expected columns: productId, stockLevel, reorderThreshold');
        }

        const rows: Array<{ productId: string; stockLevel: number; reorderThreshold: number }> = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const productId = String(row[productIdIndex] || '').trim();
          const stockLevel = typeof row[stockIndex] === 'number' 
            ? row[stockIndex] 
            : parseInt(String(row[stockIndex] || ''), 10);
          const reorderThreshold = typeof row[thresholdIndex] === 'number'
            ? row[thresholdIndex]
            : parseInt(String(row[thresholdIndex] || ''), 10);

          if (productId && !isNaN(stockLevel) && !isNaN(reorderThreshold)) {
            rows.push({ productId, stockLevel, reorderThreshold });
          }
        }

        this.processImportRows(rows);
      } catch (error) {
        alert('Failed to import Excel: ' + (error as Error).message);
        this.importInProgress = false;
      }
    };
    reader.readAsArrayBuffer(this.importFile);
  }

  private arrayBufferToBinaryString(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return binary;
  }

  private processImportRows(rows: Array<{ productId: string; stockLevel: number; reorderThreshold: number }>): void {
    if (rows.length === 0) {
      alert('No valid rows found in the file.');
      this.importInProgress = false;
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let completedCount = 0;
    const totalRows = rows.length;

    rows.forEach(row => {
      this.inventoryService.updateInventory(row.productId, row.stockLevel, row.reorderThreshold).subscribe({
        next: () => {
          successCount++;
          completedCount++;
          if (completedCount === totalRows) {
            this.finishImport(successCount, errorCount);
          }
        },
        error: () => {
          errorCount++;
          completedCount++;
          if (completedCount === totalRows) {
            this.finishImport(successCount, errorCount);
          }
        }
      });
    });
  }

  private finishImport(successCount: number, errorCount: number): void {
    alert(`Import completed! ${successCount} products updated, ${errorCount} errors.`);
    this.importInProgress = false;
    this.importFile = null;
    this.refreshData();
    this.triggerLowStockRefresh();
  }
}

