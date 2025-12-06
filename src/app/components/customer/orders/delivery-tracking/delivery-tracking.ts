// src/app/components/customer/orders/delivery-tracking.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delivery-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delivery-tracking.html',
  styleUrls: ['./delivery-tracking.css']
})
export class DeliveryTracking {
  @Input() carrier: string = '';
  @Input() trackingId: string = '';
  @Input() currentLocation: string = '';
  @Input() trackingUrl: string = '';

  constructor() {}
}

