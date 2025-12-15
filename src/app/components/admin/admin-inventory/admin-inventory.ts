// src/app/components/admin/admin-inventory/admin-inventory.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../services/inventory';
import { ProductService } from '../../../services/product';
import { Product } from '../../../models/product';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-inventory.html',
  styleUrls: ['./admin-inventory.css']
})
export class AdminInventory implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchQuery = '';
  statusFilter: 'All' | 'In Stock' | 'Low Stock' = 'All';

  // Summary Metrics
  get totalProducts(): number {
    return this.products.length;
  }

  get lowStockCount(): number {
    return this.products.filter(p => this.isLowStock(p)).length;
  }

  get totalValue(): number {
    return this.products.reduce((sum, p) => sum + (p.basePrice * (p.stockLevel || 0)), 0);
  }

  // Inventory editing (Stock & Threshold)
  editingStockProduct: Product | null = null;
  editStockLevel = 0;
  editReorderThreshold = 0;

  // Product Details Editing
  editingDetailsProduct: Product | null = null;
  editName = '';
  editDescription = '';
  editCategory = '';
  editPrice = 0;
  editImage = '';
  editActive = true;

  constructor(
    private inventoryService: InventoryService,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.inventoryService.getProducts().subscribe({
      next: products => {
        this.products = products;
        this.filterProducts();
      },
      error: err => {
        console.error('Failed to load products in admin inventory', err);
      }
    });
  }

  // Search & Filter Logic
  onSearchChange(): void {
    this.filterProducts();
  }

  onFilterChange(status: 'All' | 'In Stock' | 'Low Stock'): void {
    this.statusFilter = status;
    this.filterProducts();
  }

  private filterProducts(): void {
    let temp = this.products;

    // 1. Filter by Status
    if (this.statusFilter === 'Low Stock') {
      temp = temp.filter(p => this.isLowStock(p));
    } else if (this.statusFilter === 'In Stock') {
      temp = temp.filter(p => !this.isLowStock(p));
    }

    // 2. Filter by Search Query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      temp = temp.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.productId.toLowerCase().includes(query)
      );
    }

    this.filteredProducts = temp;
  }

  private isLowStock(product: Product): boolean {
    return (
      typeof product.stockLevel === 'number' &&
      typeof product.reorderThreshold === 'number' &&
      product.stockLevel <= product.reorderThreshold
    );
  }

  getStatusClass(product: Product): string {
    if (this.isLowStock(product)) {
      return 'status-pill low-stock';
    }
    return 'status-pill in-stock';
  }

  getStatusLabel(product: Product): string {
    if (this.isLowStock(product)) {
      return 'Low Stock';
    }
    return 'In Stock';
  }

  // --- Inventory (Stock) Management ---
  openStockEditor(product: Product): void {
    this.editingStockProduct = product;
    this.editStockLevel = product.stockLevel || 0;
    this.editReorderThreshold = product.reorderThreshold || 0;
  }

  closeStockEditor(): void {
    this.editingStockProduct = null;
  }

  saveStockChanges(): void {
    if (!this.editingStockProduct) return;

    this.inventoryService.updateInventory(
      this.editingStockProduct.productId,
      this.editStockLevel,
      this.editReorderThreshold
    ).subscribe({
      next: () => {
        alert('Inventory updated successfully!');
        this.refreshData();
        this.closeStockEditor();
        this.triggerLowStockRefresh();
      },
      error: err => {
        console.error('Failed to update inventory', err);
        alert('Failed to update inventory');
      }
    });
  }

  // --- Product Details Management ---
  openProductEditor(product: Product): void {
    this.editingDetailsProduct = product;
    this.editName = product.name;
    this.editDescription = product.description || '';
    this.editCategory = product.category || '';
    this.editPrice = product.basePrice;
    this.editImage = product.previewImage;
    this.editActive = product.isActive !== false; // Default to true if undefined
  }

  closeProductEditor(): void {
    this.editingDetailsProduct = null;
  }

  onProductImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          this.editImage = result; // Set the Base64 string as the image URL
        }
      };

      reader.readAsDataURL(file);
    }
  }

  saveProductChanges(): void {
    if (!this.editingDetailsProduct) return;

    const updatedProduct: Product = {
      ...this.editingDetailsProduct,
      name: this.editName,
      description: this.editDescription,
      category: this.editCategory,
      basePrice: this.editPrice,
      previewImage: this.editImage,
      isActive: this.editActive
    };

    this.productService.updateProduct(updatedProduct).subscribe({
      next: () => {
        alert('Product details updated successfully!');
        this.refreshData();
        this.closeProductEditor();
      },
      error: err => {
        console.error('Failed to update product details', err);
        alert('Failed to update product details');
      }
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    this.productService.deleteProduct(product.productId).subscribe({
      next: () => {
        alert('Product deleted successfully');
        this.refreshData();
        // Trigger generic update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inventoryUpdated'));
        }
      },
      error: err => {
        console.error('Failed to delete product', err);
        alert('Failed to delete product');
      }
    });
  }

  private triggerLowStockRefresh(): void {
    // Dispatch a custom event that the app component can listen to (only in browser)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    }
  }
}

