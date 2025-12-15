// src/app/models/product.ts

// OPTION TYPES MUST MATCH EXISTING COMPONENT CODE
export type CustomOptionType = 'colour' | 'size' | 'material';

export interface CustomOptionGroup {
  type: CustomOptionType;
  // e.g. ['Red', 'Blue', 'Green']
  values: string[];
  // e.g. { Red: 0, Blue: 10, Green: 15 }
  priceAdjustment: { [value: string]: number };
}

export interface Product {
  productId: string;
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  previewImage: string;

  customOptions: CustomOptionGroup[];

  // 🔹 Inventory fields for admin dashboard
  stockLevel?: number;        // current stock
  reorderThreshold?: number;  // threshold for low-stock alert
  isActive?: boolean;         // can hide products later if needed
}
