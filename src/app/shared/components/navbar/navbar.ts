import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './navbar.html',
    styleUrls: ['./navbar.css']
})
export class Navbar {
    @Input() isAdmin: boolean = false;
    @Input() lowStockCount: number = 0;
    @Input() notificationCount: number = 0;
    @Input() cartCount: number = 0;

    @Output() openLowStockAlertsEvent = new EventEmitter<void>();
    @Output() openNotificationsEvent = new EventEmitter<void>();
    @Output() logoutEvent = new EventEmitter<void>();

    appTitle = 'ShopSphere';

    openLowStockAlerts() {
        this.openLowStockAlertsEvent.emit();
    }

    openNotifications() {
        this.openNotificationsEvent.emit();
    }

    logout() {
        this.logoutEvent.emit();
    }
}
