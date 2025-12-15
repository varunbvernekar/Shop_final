// src/app/services/cart.ts
import { Injectable } from '@angular/core';
import { CartItem } from '../models/cart-item';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items: CartItem[] = [];

  getItems(): CartItem[] {
    return this.items;
  }

  addItem(item: CartItem): boolean {
    // Check if product is in stock
    if (!this.isProductInStock(item.product)) {
      return false;
    }
    
    // Check if adding this item would exceed stock
    const existingQuantity = this.getTotalQuantityForProduct(item.product.productId);
    const availableStock = this.getAvailableStock(item.product);
    
    if (existingQuantity + item.quantity > availableStock) {
      return false;
    }
    
    this.items.push(item);
    return true;
  }

  updateQuantity(itemId: string, quantity: number, product?: Product): boolean {
    const item = this.items.find(i => i.id === itemId);
    if (!item) {
      return false;
    }

    // If product is provided, validate stock
    if (product) {
      const availableStock = this.getAvailableStock(product);
      const otherItemsQuantity = this.items
        .filter(i => i.id !== itemId && i.product.productId === product.productId)
        .reduce((sum, i) => sum + i.quantity, 0);
      
      if (otherItemsQuantity + quantity > availableStock) {
        return false;
      }
    }

    item.quantity = quantity;
    return true;
  }

  removeItem(itemId: string): void {
    const index = this.items.findIndex(i => i.id === itemId);
    if (index > -1) {
      this.items.splice(index, 1);
    }
  }

  clear(): void {
    this.items.length = 0;
  }

  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Helper methods for stock validation
  isProductInStock(product: Product): boolean {
    // Product is in stock if stockLevel is undefined, null, or greater than 0
    return product.stockLevel === undefined || product.stockLevel === null || product.stockLevel > 0;
  }

  getAvailableStock(product: Product): number {
    // If stockLevel is undefined or null, assume unlimited stock
    if (product.stockLevel === undefined || product.stockLevel === null) {
      return Infinity;
    }
    return product.stockLevel;
  }

  getTotalQuantityForProduct(productId: string): number {
    return this.items
      .filter(item => item.product.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  }
}
