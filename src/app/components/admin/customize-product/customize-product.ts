import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, CustomOptionGroup, CustomOptionType } from '../../../models/product';
import { ProductService } from '../../../services/product';

@Component({
    selector: 'app-customize-product',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customize-product.html',
    styleUrls: ['./customize-product.css']
})
export class CustomizeProduct implements OnInit {
    products: Product[] = [];

    // Pagination
    currentPage = 1;
    itemsPerPage = 16;

    // Customization options management
    selectedProductForCustomization: Product | null = null;
    editingCustomOptions: CustomOptionGroup[] = [];
    newOptionType: CustomOptionType = 'colour';
    newOptionValue = '';
    newOptionPrice = 0;

    get paginatedProducts(): Product[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return this.products.slice(startIndex, startIndex + this.itemsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.products.length / this.itemsPerPage);
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    setPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    constructor(private productService: ProductService) { }

    ngOnInit(): void {
        this.refreshData();
    }

    refreshData(): void {
        this.productService.getProducts().subscribe({
            next: products => {
                this.products = products;
            },
            error: err => {
                console.error('Failed to load products', err);
            }
        });
    }

    // Customization Options Management
    openCustomizationEditor(product: Product): void {
        this.selectedProductForCustomization = product;
        // Deep copy to avoid modifying original until saved
        this.editingCustomOptions = JSON.parse(JSON.stringify(product.customOptions || []));
    }

    closeCustomizationEditor(): void {
        this.selectedProductForCustomization = null;
        this.editingCustomOptions = [];
        this.newOptionValue = '';
        this.newOptionPrice = 0;
    }

    addCustomOptionValue(): void {
        if (!this.newOptionValue.trim()) return;

        let optionGroup = this.editingCustomOptions.find(o => o.type === this.newOptionType);
        if (!optionGroup) {
            optionGroup = {
                type: this.newOptionType,
                values: [],
                priceAdjustment: {}
            };
            this.editingCustomOptions.push(optionGroup);
        }

        if (!optionGroup.values.includes(this.newOptionValue)) {
            optionGroup.values.push(this.newOptionValue);
            optionGroup.priceAdjustment[this.newOptionValue] = this.newOptionPrice || 0;
        }

        this.newOptionValue = '';
        this.newOptionPrice = 0;
    }

    removeCustomOptionValue(optionType: CustomOptionType, value: string): void {
        const optionGroup = this.editingCustomOptions.find(o => o.type === optionType);
        if (optionGroup) {
            optionGroup.values = optionGroup.values.filter(v => v !== value);
            delete optionGroup.priceAdjustment[value];
        }
    }

    saveCustomOptions(): void {
        if (!this.selectedProductForCustomization) return;

        const updated: Product = {
            ...this.selectedProductForCustomization,
            customOptions: this.editingCustomOptions
        };

        this.productService.updateProduct(updated).subscribe({
            next: () => {
                alert('Customization options saved successfully!');
                this.refreshData();
                this.closeCustomizationEditor();
            },
            error: err => {
                console.error('Failed to save customization options', err);
                alert('Failed to save customization options');
            }
        });
    }
}
