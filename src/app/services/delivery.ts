// src/app/services/delivery.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  constructor() {}

  /**
   * Get tracking URL for a carrier and tracking ID
   * @param carrier The delivery carrier name
   * @param trackingId The tracking ID
   * @returns The tracking URL for the carrier
   */
  getTrackingUrl(carrier: string, trackingId: string): string {
    // Fake integration - just provides a tracking link
    // In a real app, this would use the carrier's API
    const carrierLower = carrier.toLowerCase();
    if (carrierLower.includes('shiprocket') || carrierLower.includes('delhivery')) {
      return `https://www.shiprocket.in/tracking/${trackingId}`;
    } else if (carrierLower.includes('fedex')) {
      return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingId}`;
    } else if (carrierLower.includes('ups')) {
      return `https://www.ups.com/track?tracknum=${trackingId}`;
    } else if (carrierLower.includes('dhl')) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingId}`;
    } else {
      // Generic tracking URL
      return `https://www.17track.net/en/track?nums=${trackingId}`;
    }
  }
}

