import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Cart } from '../cart/cart';
import { CartService } from '../../../services/cart';
import { Product } from '../../../models/product';

@Component({
    selector: 'app-cart-page',
    standalone: true,
    imports: [CommonModule, Cart],
    templateUrl: './cart-page.html',
    styleUrls: ['./cart-page.css']
})
export class CartPage implements OnInit {

    constructor(
        public cartService: CartService,
        private router: Router,
        private titleService: Title
    ) { }

    ngOnInit(): void {
        this.titleService.setTitle('Shopping Cart - ShopSphere');
        const items = this.cartService.getItems();
        // Validate stock for all items on page load
        // This ensures that if stock changed while user was browsing, they see it reflected
        // Validation logic is handled nicely by the cart service/component visuals usually, 
        // but here we just rely on the cart component to display what's in the service.
    }

    onUpdateQuantity(event: { itemId: string; quantity: number }): void {
        const item = this.cartService.getItems().find(i => i.id === event.itemId);
        if (!item) return;

        // Use product from item to check stock limit in service
        const success = this.cartService.updateQuantity(event.itemId, event.quantity, item.product);

        if (!success) {
            alert(`Cannot update quantity. Stock limit reached for ${item.product.name}.`);
        }
    }

    onRemoveItem(itemId: string): void {
        if (confirm('Are you sure you want to remove this item?')) {
            this.cartService.removeItem(itemId);
        }
    }

    onContinueShopping(): void {
        this.router.navigate(['/products']);
    }

    onCheckout(): void {
        const items = this.cartService.getItems();
        if (items.length === 0) {
            alert('Your cart is empty.');
            return;
        }
        this.router.navigate(['/payment']);
    }
}
