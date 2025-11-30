import { Product } from './product';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  customization: {
    color: string;
    size: string;
    material: string;
  };
  // price for one unit with selected options
  price: number;
}
