import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../models/product';

@Component({
  selector: 'app-product-customizer',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './product-customizer.css',
  templateUrl: './product-customizer.html'
})
export class ProductCustomizer implements OnInit {
  @Input() product!: Product;

  @Output() addToCart = new EventEmitter<{
    product: Product;
    customization: { color: string; size: string; material: string };
    price: number;
  }>();

  @Output() back = new EventEmitter<void>();

  selectedColor = '';
  selectedSize = '';
  selectedMaterial = '';
  totalPrice = 0;
  showSuccess = false;

  ngOnInit(): void {
    if (!this.product) {
      return;
    }

    const colourOpt = this.product.customOptions.find(
      o => o.type === 'colour'
    );
    const sizeOpt = this.product.customOptions.find(o => o.type === 'size');
    const materialOpt = this.product.customOptions.find(
      o => o.type === 'material'
    );

    this.selectedColor = colourOpt?.values[0] ?? '';
    this.selectedSize = sizeOpt?.values[0] ?? '';
    this.selectedMaterial = materialOpt?.values[0] ?? '';

    this.recalculatePrice();
  }

  get colourValues(): string[] {
    return (
      this.product.customOptions.find(o => o.type === 'colour')?.values ?? []
    );
  }

  get sizeValues(): string[] {
    return this.product.customOptions.find(o => o.type === 'size')?.values ?? [];
  }

  get materialValues(): string[] {
    return (
      this.product.customOptions.find(o => o.type === 'material')?.values ?? []
    );
  }

  selectColour(value: string): void {
    this.selectedColor = value;
    this.recalculatePrice();
  }

  selectSize(value: string): void {
    this.selectedSize = value;
    this.recalculatePrice();
  }

  selectMaterial(value: string): void {
    this.selectedMaterial = value;
    this.recalculatePrice();
  }

  private recalculatePrice(): void {
    if (!this.product) {
      return;
    }

    let current = this.product.basePrice;

    for (const option of this.product.customOptions) {
      let chosen: string | undefined;

      if (option.type === 'colour') {
        chosen = this.selectedColor;
      } else if (option.type === 'size') {
        chosen = this.selectedSize;
      } else if (option.type === 'material') {
        chosen = this.selectedMaterial;
      }

      if (
        chosen &&
        option.priceAdjustment &&
        option.priceAdjustment[chosen] != null
      ) {
        current += option.priceAdjustment[chosen];
      }
    }

    this.totalPrice = Number(current.toFixed(2));
  }

  handleAddToCart(): void {
    // Check if product is in stock
    const isInStock = this.product.stockLevel === undefined ||
      this.product.stockLevel === null ||
      this.product.stockLevel > 0;

    if (!isInStock) {
      alert(`${this.product.name} is out of stock. Please select another product.`);
      return;
    }

    this.addToCart.emit({
      product: this.product,
      customization: {
        color: this.selectedColor,
        size: this.selectedSize,
        material: this.selectedMaterial
      },
      price: this.totalPrice
    });

    this.showSuccess = true;
    setTimeout(() => (this.showSuccess = false), 2000);
  }

  get isInStock(): boolean {
    return this.product.stockLevel === undefined ||
      this.product.stockLevel === null ||
      this.product.stockLevel > 0;
  }
}
