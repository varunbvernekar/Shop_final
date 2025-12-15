import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../models/product';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './product-catalog.css',
  templateUrl: './product-catalog.html'
})
export class ProductCatalog {
  @Input() products: Product[] = [];
  @Output() productSelect = new EventEmitter<Product>();

  searchTerm = '';
  selectedCategory = 'All';

  get categories(): string[] {
    const set = new Set<string>();
    this.products.forEach(p => {
      if (p.category) {
        set.add(p.category);
      }
    });
    return ['All', ...Array.from(set)];
  }

  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();

    const filtered = this.products.filter(p => {

      const matchCategory =
        this.selectedCategory === 'All' ||
        (!!p.category && p.category === this.selectedCategory);

      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.description
          ? p.description.toLowerCase().includes(term)
          : false);

      return matchCategory && matchSearch;
    });
    return filtered.sort((a, b) => {
      const aInStock = this.isInStock(a);
      const bInStock = this.isInStock(b);

      if (aInStock && !bInStock) return -1;
      if (!aInStock && bInStock) return 1;
      return 0; // Keep original order for same stock status
    });
  }
  isInStock(product: Product): boolean {
    // Product is in stock if stockLevel is undefined, null, or greater than 0
    // Product is out of stock if stockLevel is 0
    return product.stockLevel === undefined || product.stockLevel === null || product.stockLevel > 0;
  }

  isOutOfStock(product: Product): boolean {
    return !this.isInStock(product);
  }

  select(product: Product): void {
    this.productSelect.emit(product);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/400x250?text=Preview';
  }
}
