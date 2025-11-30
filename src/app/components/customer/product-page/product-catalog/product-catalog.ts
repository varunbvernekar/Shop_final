import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../../models/product';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl:'./product-catalog.css',
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

    return this.products.filter(p => {
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
  }

  select(product: Product): void {
    this.productSelect.emit(product);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/400x250?text=Preview';
  }
}
