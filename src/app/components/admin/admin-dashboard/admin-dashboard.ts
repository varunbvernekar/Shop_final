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

  // Metrics – you can hook these to real data later
  totalOrders = 4;
  totalRevenue = 424.99;
  avgOrderValue = 106.25;
  activeProductsCount = 0;

  // Add product form model
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
    this.products = this.productService.getProducts();
    this.activeProductsCount = this.products.filter(p => p.isActive !== false).length;

    this.lowStockProducts = this.products.filter(p =>
      typeof p.stockLevel === 'number' &&
      typeof p.reorderThreshold === 'number' &&
      p.stockLevel <= p.reorderThreshold
    );
  }

  onAddProduct(): void {
    if (!this.newProduct.name || !this.newProduct.basePrice) {
      return;
    }

    this.productService.addProduct({
      name: this.newProduct.name,
      description: this.newProduct.description,
      category: this.newProduct.category,
      basePrice: Number(this.newProduct.basePrice),
      previewImage: this.newProduct.previewImage || 'assets/images/placeholder.jpg',
      customOptions: [], // default options will be added by service
      stockLevel: Number(this.newProduct.stockLevel),
      reorderThreshold: Number(this.newProduct.reorderThreshold),
      isActive: true
    });

    this.resetForm();
    this.refreshData();
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
