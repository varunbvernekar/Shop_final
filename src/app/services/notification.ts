import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order, OrderStatus } from '../models/order';
import { OrderService } from './order';
import { AuthService } from './auth';

export interface NotificationItem {
    orderId: number;
    orderNumber: string;
    orderName: string;
    status: OrderStatus;
    message: string;
    timestamp: string;
    type: 'order' | 'shipment';
    read: boolean;
    logistics?: {
        carrier: string;
        trackingId: string;
        currentLocation: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService implements OnDestroy {
    private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    public unreadCount$ = this.notifications$.pipe(
        map(notifications => notifications.filter(n => !n.read).length)
    );

    private ordersSubscription?: Subscription;
    private readNotifications: Set<string> = new Set();
    private currentUserId: number | null = null;

    constructor(
        private orderService: OrderService,
        private authService: AuthService
    ) {
        this.init();
    }

    private init() {
        this.currentUserId = this.authService.getCurrentUser()?.id || null;
        if (this.currentUserId) {
            this.loadReadNotifications();
            this.startListening();
        }

        // simplistic auth state listener
        // ideally we would subscribe to authService.currentUser$, but polling/checking is fine for now
        // or we can expose a method to 'refresh' when user logs in/out
    }

    // Called by App component or Auth Service on login
    public loadForUser(userId: number) {
        if (this.currentUserId === userId) return; // already loaded
        this.currentUserId = userId;
        this.loadReadNotifications();
        this.startListening();
    }

    public clear() {
        this.currentUserId = null;
        this.readNotifications.clear();
        this.notificationsSubject.next([]);
        if (this.ordersSubscription) {
            this.ordersSubscription.unsubscribe();
        }
    }

    private loadReadNotifications(): void {
        if (!this.currentUserId) return;
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = localStorage.getItem(`readNotifications_${this.currentUserId}`);
            if (stored) {
                try {
                    this.readNotifications = new Set(JSON.parse(stored));
                } catch (e) {
                    console.error('Failed to load read notifications', e);
                }
            }
        }
    }

    private saveReadNotifications(): void {
        if (!this.currentUserId) return;
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(
                `readNotifications_${this.currentUserId}`,
                JSON.stringify(Array.from(this.readNotifications))
            );
        }
    }

    private startListening() {
        if (this.ordersSubscription) {
            this.ordersSubscription.unsubscribe();
        }
        if (!this.currentUserId) return;

        this.ordersSubscription = this.orderService.getOrdersForUser(this.currentUserId).subscribe({
            next: orders => {
                const items = this.processOrdersToNotifications(orders);
                this.notificationsSubject.next(items);
            },
            error: err => console.error('Failed to load notifications', err)
        });
    }

    private processOrdersToNotifications(orders: Order[]): NotificationItem[] {
        const notifications: NotificationItem[] = [];

        orders.forEach(order => {
            if (!order.id) return;

            const orderName = order.items && order.items.length > 0
                ? order.items[0].name
                : 'Order';

            const statusMessages: Record<OrderStatus, string> = {
                'Confirmed': 'Your order has been confirmed and is being prepared.',
                'Packed': 'Your order has been packed and is ready for shipment.',
                'Shipped': 'Your order has been shipped and is on its way!',
                'Delivered': 'Your order has been delivered successfully!',
                'Cancelled': 'Your order has been cancelled.'
            };

            const orderNotificationId = `order_${order.id}_${order.status}`;
            const shipmentNotificationId = `shipment_${order.id}`;

            // Status notification
            // Only show if status is not just 'Confirmed' (initial state) ? 
            // ACTUALLY: The original logic showed 'Confirmed' too. Keeping parity.
            notifications.push({
                orderId: order.id,
                orderNumber: `#ORD - ${order.id.toString().padStart(6, '0')}`,
                orderName: orderName,
                status: order.status,
                message: statusMessages[order.status] || 'Your order status has been updated.',
                timestamp: order.placedOn,
                type: 'order',
                read: this.readNotifications.has(orderNotificationId),
                logistics: order.logistics
            });

            // Shipment notification
            if (order.status === 'Shipped' || order.status === 'Delivered') {
                if (order.logistics && order.logistics.trackingId && order.logistics.trackingId !== '-') {
                    notifications.push({
                        orderId: order.id,
                        orderNumber: `#ORD - ${order.id.toString().padStart(6, '0')}`,
                        orderName: orderName,
                        status: order.status,
                        message: `Shipment update: ${order.logistics.currentLocation || 'In transit'}`,
                        timestamp: order.placedOn,
                        type: 'shipment',
                        read: this.readNotifications.has(shipmentNotificationId),
                        logistics: order.logistics
                    });
                }
            }
        });

        return notifications.sort((a, b) => {
            // approximate sorting if timestamp strings are comparable, else simplistic
            // Assuming YYYY-MM-DD or similar text specific date format
            // Ideally convert to date object for sort
            return b.orderId - a.orderId;
        });
    }

    public markAsRead(notification: NotificationItem): void {
        if (notification.read) return;

        const notificationId = notification.type === 'order'
            ? `order_${notification.orderId}_${notification.status}`
            : `shipment_${notification.orderId}`;

        this.readNotifications.add(notificationId);
        this.saveReadNotifications();

        // Update the stream current value
        const current = this.notificationsSubject.getValue();
        const updated = current.map(n => {
            if (n === notification) { // reference equality check might fail if object recreated? 
                // Safer to match by ID
                // But logic above recreates objects on every poll
                // Let's rely on re-processing or manually update local state
                return { ...n, read: true };
            }
            // Match by content if ref fail
            if (n.orderId === notification.orderId && n.type === notification.type && n.status === notification.status) {
                return { ...n, read: true };
            }
            return n;
        });

        this.notificationsSubject.next(updated);
    }

    public markAllAsRead(): void {
        const current = this.notificationsSubject.getValue();
        current.forEach(n => {
            const notificationId = n.type === 'order'
                ? `order_${n.orderId}_${n.status}`
                : `shipment_${n.orderId}`;
            this.readNotifications.add(notificationId);
        });
        this.saveReadNotifications();

        // update stream
        const updated = current.map(n => ({ ...n, read: true }));
        this.notificationsSubject.next(updated);
    }

    ngOnDestroy() {
        if (this.ordersSubscription) {
            this.ordersSubscription.unsubscribe();
        }
    }
}
