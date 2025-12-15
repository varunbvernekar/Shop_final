// src/app/components/admin/add-product/add-product.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product';

@Component({
    selector: 'app-admin-add-product',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './add-product.html',
    styleUrls: ['./add-product.css']
})
export class AdminAddProduct {
    newProduct = {
        name: '',
        description: '',
        category: '',
        basePrice: 0,
        previewImage: '',
        stockLevel: 0,
        reorderThreshold: 0
    };

    selectedFileName = '';
    imagePreview = '';
    showSuccessMessage = false;

    constructor(private productService: ProductService) { }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFileName = file.name;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    onAddProduct(): void {
        if (!this.newProduct.name || !this.newProduct.basePrice || !this.newProduct.category) {
            return;
        }

        const productImage = this.imagePreview || 'assets/images/placeholder.jpg';

        this.productService
            .addProduct({
                name: this.newProduct.name,
                description: this.newProduct.description,
                category: this.newProduct.category,
                basePrice: Number(this.newProduct.basePrice),
                previewImage: productImage,
                stockLevel: Number(this.newProduct.stockLevel),
                reorderThreshold: Number(this.newProduct.reorderThreshold),
                customOptions: [],
                isActive: true
            })
            .subscribe({
                next: () => {
                    this.showSuccessMessage = true;
                    this.resetForm();

                    // Hide success message after 3 seconds
                    setTimeout(() => {
                        this.showSuccessMessage = false;
                    }, 3000);
                },
                error: err => {
                    console.error('Failed to add product', err);
                    alert('Failed to add product');
                }
            });
    }

    private resetForm(): void {
        this.newProduct = {
            name: '',
            description: '',
            category: '',
            basePrice: 0,
            previewImage: '',
            stockLevel: 0,
            reorderThreshold: 0
        };
        this.selectedFileName = '';
        this.imagePreview = '';

        const fileInput = document.getElementById('productImage') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }
}
