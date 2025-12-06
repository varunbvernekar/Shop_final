// src/app/components/admin/admin-inventory/admin-inventory.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../models/product';
import { ProductService } from '../../../services/product';

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
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.productService.getProducts().subscribe({
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

    this.productService.updateStock(this.editingProduct.productId, this.editStockLevel).subscribe({
      next: () => {
        this.productService.updateReorderThreshold(
          this.editingProduct!.productId,
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
            console.error('Failed to update reorder threshold', err);
            alert('Failed to update inventory');
          }
        });
      },
      error: err => {
        console.error('Failed to update stock', err);
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
      alert('Please select a CSV file');
      return;
    }

    this.importInProgress = true;
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

        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const productId = values[productIdIndex];
          const stockLevel = parseInt(values[stockIndex], 10);
          const threshold = parseInt(values[thresholdIndex], 10);

          if (productId && !isNaN(stockLevel) && !isNaN(threshold)) {
            this.productService.updateStock(productId, stockLevel).subscribe({
              next: () => {
                this.productService.updateReorderThreshold(productId, threshold).subscribe({
                  next: () => successCount++,
                  error: () => errorCount++
                });
              },
              error: () => errorCount++
            });
          } else {
            errorCount++;
          }
        }

        setTimeout(() => {
          alert(`Import completed! ${successCount} products updated, ${errorCount} errors.`);
          this.importInProgress = false;
          this.importFile = null;
          this.refreshData();
          // Trigger low stock count refresh
          this.triggerLowStockRefresh();
        }, 1000);
      } catch (error) {
        alert('Failed to import: ' + (error as Error).message);
        this.importInProgress = false;
      }
    };
    reader.readAsText(this.importFile);
  }
}

