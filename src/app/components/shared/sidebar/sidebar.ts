// src/app/components/shared/sidebar/sidebar.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { CartService } from '../../../services/cart';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  @Input() isAdmin: boolean = false;
  @Input() lowStockCount: number = 0;
  @Input() notificationCount: number = 0;
  @Input() cartCount: number = 0;
  @Output() openLowStockAlertsEvent = new EventEmitter<void>();
  @Output() openNotificationsEvent = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  isCollapsed = false;

  constructor(
    private router: Router,
    public cartService: CartService
  ) {}

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  openLowStockAlerts(): void {
    this.openLowStockAlertsEvent.emit();
  }

  openNotifications(): void {
    this.openNotificationsEvent.emit();
  }

  goToCart(): void {
    this.router.navigate(['/products'], { queryParams: { view: 'cart' } });
  }

  logout(): void {
    this.logoutEvent.emit();
  }
}

