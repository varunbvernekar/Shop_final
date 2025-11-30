// src/app/services/cart.ts
import { Injectable } from '@angular/core';
import { CartItem } from '../models/cart-item';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items: CartItem[] = [];

  getItems(): CartItem[] {
    return this.items;
  }

  addItem(item: CartItem): void {
    this.items.push(item);
  }

  updateQuantity(itemId: string, quantity: number): void {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
    }
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
}
