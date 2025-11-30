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

  handleCheckout(): void {
    alert('Checkout functionality will be integrated with Razorpay/Stripe.');
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
}
