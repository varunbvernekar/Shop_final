// src/app/services/product.ts

import { Injectable } from '@angular/core';
import { Product, CustomOptionGroup } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly STORAGE_KEY = 'app_products';

  private products: Product[] = this.loadProducts();

  // ---- Public API ----
  getProducts(): Product[] {
    return [...this.products];
  }

  getProductById(productId: string): Product | undefined {
    return this.products.find(p => p.productId === productId);
  }

  addProduct(partial: Omit<Product, 'productId'> & { productId?: string }): Product {
    const newId = partial.productId ?? this.generateProductId();

    const newProduct: Product = {
      ...partial,
      productId: newId,
      isActive: partial.isActive ?? true,
      customOptions:
        partial.customOptions && partial.customOptions.length
          ? partial.customOptions
          : this.getDefaultCustomOptions()
    };

    this.products.push(newProduct);
    this.saveProducts();
    return newProduct;
  }

  updateProduct(updated: Product): void {
    const index = this.products.findIndex(p => p.productId === updated.productId);
    if (index !== -1) {
      this.products[index] = { ...updated };
      this.saveProducts();
    }
  }

  // ---- Private helpers ----
  private loadProducts(): Product[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as Product[];
      } catch {
        console.warn('Failed to parse products from storage, using defaults.');
      }
    }
    const defaults = this.getDefaultProducts();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  private saveProducts(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.products));
  }

  private generateProductId(): string {
    const next = this.products.length + 1;
    return 'P' + String(next).padStart(3, '0'); // P001, P002, ...
  }

  // 🔹 Default options – matches what product-customizer expects
  private getDefaultCustomOptions(): CustomOptionGroup[] {
    return [
      {
        type: 'colour',
        values: ['Default'],
        priceAdjustment: { Default: 0 }
      },
      {
        type: 'size',
        values: ['Standard'],
        priceAdjustment: { Standard: 0 }
      },
      {
        type: 'material',
        values: ['Default'],
        priceAdjustment: { Default: 0 }
      }
    ];
  }

  private getDefaultProducts(): Product[] {
    return [
      {
        productId: 'P001',
        name: 'Handcrafted Silver Ring',
        description: 'Elegant silver ring with handcrafted detailing.',
        category: 'Jewelry',
        basePrice: 120,
        previewImage: 'assets/images/ring.jpg',
        customOptions: this.getDefaultCustomOptions(),
        stockLevel: 45,
        reorderThreshold: 10,
        isActive: true
      },
      {
        productId: 'P002',
        name: 'Artisan Ceramic Vase',
        description: 'Handmade ceramic vase with rustic finish.',
        category: 'Home Decor',
        basePrice: 80,
        previewImage: 'assets/images/vase.jpg',
        customOptions: this.getDefaultCustomOptions(),
        stockLevel: 8,
        reorderThreshold: 15,
        isActive: true
      },
      {
        productId: 'P003',
        name: 'Custom Leather Wallet',
        description: 'Premium leather wallet with customizable engraving.',
        category: 'Accessories',
        basePrice: 60,
        previewImage: 'assets/images/wallet.jpg',
        customOptions: this.getDefaultCustomOptions(),
        stockLevel: 30,
        reorderThreshold: 10,
        isActive: true
      },
      {
        productId: 'P004',
        name: 'Handwoven Wall Tapestry',
        description: 'Bohemian-style wall tapestry, handwoven with care.',
        category: 'Home Decor',
        basePrice: 95,
        previewImage: 'assets/images/tapestry.jpg',
        customOptions: this.getDefaultCustomOptions(),
        stockLevel: 5,
        reorderThreshold: 8,
        isActive: true
      },
      {
        productId: 'P005',
        name: 'Pearl Necklace Set',
        description: 'Classic pearl necklace with matching earrings.',
        category: 'Jewelry',
        basePrice: 150,
        previewImage: 'assets/images/necklace.jpg',
        customOptions: this.getDefaultCustomOptions(),
        stockLevel: 22,
        reorderThreshold: 10,
        isActive: true
      },
      {
        productId: 'P006',
        name: 'Wooden Serving Tray',
        description: 'Minimal wooden tray, perfect for serving or decor.',
        category: 'Kitchen',
        basePrice: 45,
        previewImage: 'assets/images/tray.jpg',
        customOptions: this.getDefaultCustomOptions(),
        stockLevel: 18,
        reorderThreshold: 6,
        isActive: true
      }
    ];
  }
}
