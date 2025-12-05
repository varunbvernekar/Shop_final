// src/app/components/admin/low-stock-alerts/low-stock-alerts.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../../models/product';
import { ProductService } from '../../../services/product';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-low-stock-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './low-stock-alerts.html',
  styleUrls: ['./low-stock-alerts.css']
})
export class LowStockAlerts implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen: boolean = false;
  @Output() closeEvent = new EventEmitter<void>();

  lowStockProducts: Product[] = [];
  private productsSubscription?: Subscription;

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.isOpen) {
      this.loadLowStockProducts();
    }
  }

  ngOnDestroy(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.loadLowStockProducts();
    }
  }

  loadLowStockProducts(): void {
    this.productsSubscription = this.productService.getProducts().subscribe({
      next: products => {
        this.lowStockProducts = products.filter(
          p =>
            typeof p.stockLevel === 'number' &&
            typeof p.reorderThreshold === 'number' &&
            p.stockLevel <= p.reorderThreshold
        );
      },
      error: err => {
        console.error('Failed to load low stock products', err);
      }
    });
  }

  close(): void {
    this.closeEvent.emit();
  }

  goToInventory(product: Product): void {
    this.close();
    this.router.navigate(['/admin/inventory']);
  }
}

