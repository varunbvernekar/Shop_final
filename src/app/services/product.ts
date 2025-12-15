// src/app/services/product.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, CustomOptionGroup } from '../models/product';
import { Observable, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  /**
   * Get all products from db.json (/products).
   * If customOptions is missing/empty, inject default options.
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      map(products =>
        products.map(p => ({
          ...p,
          productId: p.productId || (p as any).id,
          customOptions:
            p.customOptions && p.customOptions.length
              ? p.customOptions
              : this.getDefaultCustomOptions()
        }))
      )
    );
  }

  /**
   * Add a new product to db.json.
   * Automatically creates a productId if not provided.
   */
  addProduct(
    partial: Omit<Product, 'productId'> & { productId?: string }
  ): Observable<Product> {
    return this.getProducts().pipe(
      map(products => {
        const nextNumber = products.length + 1;
        const productId =
          partial.productId ?? `P${String(nextNumber).padStart(3, '0')}`;

        const newProduct: Product = {
          ...partial,
          productId,
          isActive: partial.isActive ?? true,
          customOptions:
            partial.customOptions && partial.customOptions.length
              ? partial.customOptions
              : this.getDefaultCustomOptions()
        };

        // json-server needs "id" field, we can use productId as id.
        const payload: Product & { id: string } = {
          ...newProduct,
          id: productId
        };

        return payload;
      }),
      switchMap(payload =>
        this.http.post<Product>(`${this.apiUrl}/products`, payload)
      )
    );
  }

  getProductById(productId: string): Observable<Product | undefined> {
    return this.getProducts().pipe(
      map(products => products.find(p => p.productId === productId))
    );
  }

  /** Update an existing product */
  updateProduct(product: Product): Observable<Product> {
    if (!product.productId) {
      throw new Error('Product ID is required to update a product');
    }
    const payload: Product & { id: string } = {
      ...product,
      id: product.productId
    };
    return this.http.put<Product>(`${this.apiUrl}/products/${product.productId}`, payload);
  }

  /** Delete a product */
  deleteProduct(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${productId}`);
  }

  /** Update product stock level */
  updateStock(productId: string, stockLevel: number): Observable<Product> {
    return this.getProductById(productId).pipe(
      switchMap(product => {
        if (!product) {
          throw new Error('Product not found');
        }
        const updated: Product = { ...product, stockLevel };
        return this.updateProduct(updated);
      })
    );
  }

  /** Update reorder threshold */
  updateReorderThreshold(productId: string, reorderThreshold: number): Observable<Product> {
    return this.getProductById(productId).pipe(
      switchMap(product => {
        if (!product) {
          throw new Error('Product not found');
        }
        const updated: Product = { ...product, reorderThreshold };
        return this.updateProduct(updated);
      })
    );
  }

  // ---- default custom options (used if db.json doesn't define them) ----
  private getDefaultCustomOptions(): CustomOptionGroup[] {
    return [
      {
        type: 'colour',
        values: ['Silver', 'Gold', 'Rose Gold'],
        priceAdjustment: {
          Silver: 0,
          Gold: 15,
          'Rose Gold': 10
        }
      },
      {
        type: 'size',
        values: ['Small', 'Medium', 'Large'],
        priceAdjustment: {
          Small: -5,
          Medium: 0,
          Large: 10
        }
      },
      {
        type: 'material',
        values: ['Standard', 'Premium'],
        priceAdjustment: {
          Standard: 0,
          Premium: 25
        }
      }
    ];
  }
}
