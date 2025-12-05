import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../../../models/cart-item';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl:'./cart.css'
})
export class Cart {
  @Input() items: CartItem[] = [];
  @Output() updateQuantity = new EventEmitter<{
    itemId: string;
    quantity: number;
  }>();
  @Output() removeItem = new EventEmitter<string>();
  @Output() continueShopping = new EventEmitter<void>();
  @Output() checkout = new EventEmitter<void>();

  get hasItems(): boolean {
    return this.items && this.items.length > 0;
  }
  onContinueShopping(): void {
    this.continueShopping.emit();
  }

  onRemoveItem(id: string): void {
    this.removeItem.emit(id);
  }

  get subtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  get tax(): number {
    return this.subtotal * 0.1;
  }

  get shipping(): number {
    return this.items.length > 0 ? 15.0 : 0;
  }

  get total(): number {
    return this.subtotal + this.tax + this.shipping;
  }

  

  decrease(item: CartItem): void {
    if (item.quantity > 1) {
      this.updateQuantity.emit({
        itemId: item.id,
        quantity: item.quantity - 1
      });
    }
  }

  increase(item: CartItem): void {
    this.updateQuantity.emit({
      itemId: item.id,
      quantity: item.quantity + 1
    });
  }

  getAvailableStock(item: CartItem): number {
    if (item.product.stockLevel === undefined || item.product.stockLevel === null) {
      return Infinity;
    }
    return item.product.stockLevel;
  }

  isOutOfStock(item: CartItem): boolean {
    const stock = this.getAvailableStock(item);
    return stock === 0;
  }

  getMaxQuantity(item: CartItem): number {
    return this.getAvailableStock(item);
  }

  /** Called from the "Proceed to Checkout" button */
  handleCheckout(): void {
    if (!this.hasItems) {
      alert('Your cart is empty. Add some products before checking out.');
      return;
    }
    // Just emit event – parent will actually create the order in db.json
    this.checkout.emit();
  }
}
