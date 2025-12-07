// src/app/services/inventory.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Product } from '../models/product';
import { ProductService } from './product';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private productService: ProductService
  ) {}

  /**
   * Get all products for inventory management
   * @returns Observable of all products
   */
  getProducts(): Observable<Product[]> {
    return this.productService.getProducts();
  }

  /**
   * Update product stock level
   * @param productId The product ID to update
   * @param stockLevel The new stock level
   * @returns Observable of the updated product
   */
  updateStock(productId: string, stockLevel: number): Observable<Product> {
    return this.productService.getProductById(productId).pipe(
      switchMap(product => {
        if (!product) {
          throw new Error('Product not found');
        }
        const updated: Product = { ...product, stockLevel };
        return this.productService.updateProduct(updated);
      })
    );
  }

  /**
   * Update reorder threshold for a product
   * @param productId The product ID to update
   * @param reorderThreshold The new reorder threshold
   * @returns Observable of the updated product
   */
  updateReorderThreshold(productId: string, reorderThreshold: number): Observable<Product> {
    return this.productService.getProductById(productId).pipe(
      switchMap(product => {
        if (!product) {
          throw new Error('Product not found');
        }
        const updated: Product = { ...product, reorderThreshold };
        return this.productService.updateProduct(updated);
      })
    );
  }

  /**
   * Update both stock level and reorder threshold in a single operation
   * @param productId The product ID to update
   * @param stockLevel The new stock level
   * @param reorderThreshold The new reorder threshold
   * @returns Observable of the updated product
   */
  updateInventory(productId: string, stockLevel: number, reorderThreshold: number): Observable<Product> {
    return this.productService.getProductById(productId).pipe(
      switchMap(product => {
        if (!product) {
          throw new Error('Product not found');
        }
        const updated: Product = { 
          ...product, 
          stockLevel,
          reorderThreshold
        };
        return this.productService.updateProduct(updated);
      })
    );
  }
}

