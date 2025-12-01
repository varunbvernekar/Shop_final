// src/app/components/admin/admin-dashboard/admin-dashboard.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../models/product';
import { ProductService } from '../../../services/product';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  products: Product[] = [];
  lowStockProducts: Product[] = [];
  activeProductsCount = 0;

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

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.productService.getProducts().subscribe({
      next: products => {
        this.products = products;

        this.activeProductsCount = this.products.filter(
          p => p.isActive !== false
        ).length;

        this.lowStockProducts = this.products.filter(
          p =>
            typeof p.stockLevel === 'number' &&
            typeof p.reorderThreshold === 'number' &&
            p.stockLevel <= p.reorderThreshold
        );
      },
      error: err => {
        console.error('Failed to load products in admin dashboard', err);
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
}
