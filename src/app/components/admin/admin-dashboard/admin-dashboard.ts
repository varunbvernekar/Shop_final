// src/app/components/admin/admin-dashboard/admin-dashboard.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, CustomOptionGroup, CustomOptionType } from '../../../models/product';
import { ProductService } from '../../../services/product';
import { OrderService } from '../../../services/order';
import { Order } from '../../../models/order';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  products: Product[] = [];
  activeProductsCount = 0;
  orders: Order[] = [];

  // demo stats
  totalOrders = 128;
  totalRevenue = 54230;
  avgOrderValue = 425;

  newProduct = {
    name: '',
    description: '',
    category: '',
    basePrice: 0,
    previewImage: '',
    stockLevel: 0,
    reorderThreshold: 0
  };

  // Customization options management
  selectedProductForCustomization: Product | null = null;
  editingCustomOptions: CustomOptionGroup[] = [];
  newOptionType: CustomOptionType = 'colour';
  newOptionValue = '';
  newOptionPrice = 0;


  // Reports
  showReports = false;
  reportStartDate = '';
  reportEndDate = '';
  filteredOrders: Order[] = [];

  constructor(
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.refreshData();
    this.loadOrders();
  }

  refreshData(): void {
    this.productService.getProducts().subscribe({
      next: products => {
        this.products = products;

        this.activeProductsCount = this.products.filter(
          p => p.isActive !== false
        ).length;
      },
      error: err => {
        console.error('Failed to load products in admin dashboard', err);
      }
    });
  }

  loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.filteredOrders = orders;
        this.totalOrders = orders.length;
        this.totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
        this.avgOrderValue = orders.length > 0 ? this.totalRevenue / orders.length : 0;
      },
      error: err => {
        console.error('Failed to load orders', err);
      }
    });
  }

  onAddProduct(): void {
    if (!this.newProduct.name || !this.newProduct.basePrice) {
      return;
    }

    this.productService
      .addProduct({
        name: this.newProduct.name,
        description: this.newProduct.description,
        category: this.newProduct.category,
        basePrice: Number(this.newProduct.basePrice),
        previewImage:
          this.newProduct.previewImage || 'assets/images/placeholder.jpg',
        customOptions: [],
        stockLevel: Number(this.newProduct.stockLevel),
        reorderThreshold: Number(this.newProduct.reorderThreshold),
        isActive: true
      })
      .subscribe({
        next: () => {
          this.resetForm();
          this.refreshData();
        },
        error: err => {
          console.error('Failed to add product', err);
        }
      });
  }

  resetForm(): void {
    this.newProduct = {
      name: '',
      description: '',
      category: '',
      basePrice: 0,
      previewImage: '',
      stockLevel: 0,
      reorderThreshold: 0
    };
  }


  // Customization Options Management
  openCustomizationEditor(product: Product): void {
    this.selectedProductForCustomization = product;
    this.editingCustomOptions = JSON.parse(JSON.stringify(product.customOptions || []));
  }

  closeCustomizationEditor(): void {
    this.selectedProductForCustomization = null;
    this.editingCustomOptions = [];
    this.newOptionValue = '';
    this.newOptionPrice = 0;
  }

  addCustomOptionValue(): void {
    if (!this.newOptionValue.trim()) return;

    let optionGroup = this.editingCustomOptions.find(o => o.type === this.newOptionType);
    if (!optionGroup) {
      optionGroup = {
        type: this.newOptionType,
        values: [],
        priceAdjustment: {}
      };
      this.editingCustomOptions.push(optionGroup);
    }

    if (!optionGroup.values.includes(this.newOptionValue)) {
      optionGroup.values.push(this.newOptionValue);
      optionGroup.priceAdjustment[this.newOptionValue] = this.newOptionPrice || 0;
    }

    this.newOptionValue = '';
    this.newOptionPrice = 0;
  }

  removeCustomOptionValue(optionType: CustomOptionType, value: string): void {
    const optionGroup = this.editingCustomOptions.find(o => o.type === optionType);
    if (optionGroup) {
      optionGroup.values = optionGroup.values.filter(v => v !== value);
      delete optionGroup.priceAdjustment[value];
    }
  }

  saveCustomOptions(): void {
    if (!this.selectedProductForCustomization) return;

    const updated: Product = {
      ...this.selectedProductForCustomization,
      customOptions: this.editingCustomOptions
    };

    this.productService.updateProduct(updated).subscribe({
      next: () => {
        alert('Customization options saved successfully!');
        this.refreshData();
        this.closeCustomizationEditor();
      },
      error: err => {
        console.error('Failed to save customization options', err);
        alert('Failed to save customization options');
      }
    });
  }


  // Reports
  toggleReports(): void {
    this.showReports = !this.showReports;
    if (this.showReports) {
      this.filteredOrders = this.orders;
    }
  }

  filterReports(): void {
    if (!this.reportStartDate || !this.reportEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(this.reportStartDate);
    const end = new Date(this.reportEndDate);
    end.setHours(23, 59, 59, 999);

    this.filteredOrders = this.orders.filter(order => {
      const orderDate = this.parseDate(order.placedOn);
      return orderDate >= start && orderDate <= end;
    });
  }

  private parseDate(dateStr: string): Date {
    // Handle format like "3/12/2025"
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
  }

  getReportRevenue(): number {
    return this.filteredOrders.reduce((sum, o) => sum + o.amount, 0);
  }

  getReportOrderCount(): number {
    return this.filteredOrders.length;
  }
}
