// src/app/components/customer/payment/payment.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { OrderService } from '../../services/order';
import { ProductService } from '../../services/product';
import { Order, OrderStatus, Address } from '../../models/order';
import { CartItem } from '../../models/cart-item';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.css']
})
export class Payment implements OnInit {
  cartItems: CartItem[] = [];
  isLoading = false;
  errorMessage = '';

  // Address form
  address: Address = {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  };

  // Payment form
  paymentMethod = 'card';
  cardNumber = '';
  cardName = '';
  cardExpiry = '';
  cardCvv = '';

  get subtotal(): number {
    return this.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  get tax(): number {
    return this.subtotal * 0.1;
  }

  get shipping(): number {
    return this.cartItems.length > 0 ? 15.0 : 0;
  }

  get total(): number {
    return this.subtotal + this.tax + this.shipping;
  }

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private orderService: OrderService,
    private productService: ProductService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'CUSTOMER') {
      this.router.navigate(['/products']);
      return;
    }

    this.cartItems = this.cartService.getItems();
    if (this.cartItems.length === 0) {
      this.router.navigate(['/products']);
      return;
    }

    // Pre-fill address if user has one
    if (user.address) {
      this.address = { ...user.address };
    }
  }

  onSubmit(): void {
    // Validate address
    if (!this.address.street || !this.address.city || !this.address.state ||
      !this.address.zipCode || !this.address.country) {
      this.errorMessage = 'Please fill in all address fields.';
      return;
    }

    // Validate payment (basic validation)
    if (this.paymentMethod === 'card') {
      if (!this.cardNumber || !this.cardName || !this.cardExpiry || !this.cardCvv) {
        this.errorMessage = 'Please fill in all payment details.';
        return;
      }
    }

    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      this.errorMessage = 'Please log in to complete your order.';
      return;
    }

    // Check stock before placing order
    const stockErrors: string[] = [];
    for (const item of this.cartItems) {
      const product = item.product;
      const availableStock = product.stockLevel === undefined || product.stockLevel === null
        ? Infinity
        : product.stockLevel;

      if (availableStock === 0) {
        stockErrors.push(`${product.name} is out of stock.`);
      } else if (item.quantity > availableStock) {
        stockErrors.push(`${product.name}: Only ${availableStock} unit(s) available, but ${item.quantity} unit(s) in cart.`);
      }
    }

    if (stockErrors.length > 0) {
      this.errorMessage = 'Cannot proceed with checkout:\n\n' + stockErrors.join('\n');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const today = new Date();
    const placedOn = today.toLocaleDateString('en-IN');
    const estimated = new Date();
    estimated.setDate(today.getDate() + 7);
    const estimatedDelivery = estimated.toLocaleDateString('en-IN');

    const orderItems = this.cartItems.map(i => ({
      productId: i.product.productId,
      name: i.product.name,
      image: i.product.previewImage,
      quantity: i.quantity,
      color: i.customization.color,
      size: i.customization.size,
      material: i.customization.material,
      price: i.price
    }));

    const payload: Omit<Order, 'id'> = {
      userId: user.id,
      placedOn,
      amount: this.total,
      status: 'Confirmed' as OrderStatus,
      items: orderItems,
      estimatedDelivery,
      logistics: {
        carrier: 'Not assigned',
        trackingId: '-',
        currentLocation: 'Order confirmed'
      },
      deliveryAddress: { ...this.address }
    };

    this.orderService.createOrder(payload).subscribe({
      next: () => {
        // Update inventory after order confirmation
        this.updateInventoryForOrder(orderItems);

        // Trigger low stock count refresh (only in browser)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inventoryUpdated'));
          window.dispatchEvent(new CustomEvent('orderUpdated'));
        }

        this.cartService.clear();
        this.router.navigate(['/orders']);
      },
      error: err => {
        console.error('Failed to place order', err);
        this.errorMessage = 'Failed to place order. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private updateInventoryForOrder(items: Array<{ productId: string; quantity: number }>): void {
    items.forEach(item => {
      this.productService.getProductById(item.productId).subscribe({
        next: product => {
          if (product && typeof product.stockLevel === 'number') {
            const newStock = Math.max(0, product.stockLevel - item.quantity);
            this.productService.updateStock(item.productId, newStock).subscribe({
              next: () => console.log(`Inventory updated for ${product.name}`),
              error: err => console.error(`Failed to update inventory for ${product.name}`, err)
            });
          }
        },
        error: err => console.error(`Failed to get product ${item.productId}`, err)
      });
    });
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}

