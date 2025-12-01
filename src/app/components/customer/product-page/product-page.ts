import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Product } from '../../../models/product';
import { UserRole } from '../../../models/user';
import { ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth';
import { CartItem } from '../../../models/cart-item';
import { ProductCatalog } from './product-catalog/product-catalog';
import { ProductCustomizer } from './product-customizer/product-customizer';
import { Cart } from './cart/cart';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../../services/cart';

type CustomerView = 'catalog' | 'customizer' | 'cart';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, ProductCatalog, ProductCustomizer, Cart],
  templateUrl: './product-page.html',
  styleUrls: ['./product-page.css']
})
export class ProductPage implements OnInit {
  products: Product[] = [];
  role: UserRole | null = null;

  view: CustomerView = 'catalog';
  selectedProduct: Product | null = null;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private cartService: CartService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Load products via HTTP from db.json
    this.productService.getProducts().subscribe({
      next: products => {
        this.products = products;
      },
      error: err => {
        console.error('Failed to load products', err);
      }
    });

    const user = this.authService.getCurrentUser();
    this.role = user?.role ?? null;

    // Handle ?view=cart|catalog|customizer for navbar/cart link
    this.route.queryParamMap.subscribe(params => {
      const viewParam = params.get('view') as CustomerView | null;
      if (viewParam === 'cart' || viewParam === 'catalog' || viewParam === 'customizer') {
        this.view = viewParam;
      } else {
        this.view = 'catalog';
      }
    });
  }

  // expose cart items from CartService to template
  get cartItems(): CartItem[] {
    return this.cartService.getItems();
  }

  // ----- CUSTOMER flow -----

  // 👇 This is what the template expects: (productSelect)="handleSelectProduct($event)"
  handleSelectProduct(product: Product): void {
    if (this.role !== 'CUSTOMER') {
      return;
    }
    this.selectedProduct = product;
    this.view = 'customizer';
  }

  handleBackToCatalog(): void {
    this.selectedProduct = null;
    this.view = 'catalog';
  }

  handleAddToCart(event: {
    product: Product;
    customization: { color: string; size: string; material: string };
    price: number;
  }): void {
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const item: CartItem = {
      id,
      product: event.product,
      quantity: 1,
      customization: {
        color: event.customization.color,
        size: event.customization.size,
        material: event.customization.material
      },
      price: event.price
    };

    this.cartService.addItem(item);
    this.view = 'cart';
  }

  // Cart component emits { itemId, quantity }
  handleUpdateQuantity(event: { itemId: string; quantity: number }): void {
    this.cartService.updateQuantity(event.itemId, event.quantity);
  }

  handleRemoveItem(id: string): void {
    this.cartService.removeItem(id);
  }

  handleContinueShopping(): void {
    this.view = 'catalog';
  }

  handleCheckout(): void {
    alert('Checkout flow not implemented yet.');
  }

  // Admin/Vendor placeholder actions (if you use staffView template)
  viewProductInsights(product: Product): void {
    alert(`Admin: Viewing insights for "${product.name}".`);
  }

  deactivateProduct(product: Product): void {
    alert(`Admin: Deactivating "${product.name}".`);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/300x200?text=Preview';
  }
}
