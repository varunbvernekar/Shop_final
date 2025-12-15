// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Register } from './components/auth/register/register';
import { Home } from './components/home/home';
import { CartPage } from './components/shop/cart-page/cart-page';
import { ProductPage } from './components/shop/product-page';
import { OrdersPage } from './components/orders/orders';
import { Profile } from './components/profile/profile';
import { Payment } from './components/payment/payment';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { AdminDashboard } from './components/admin/admin-dashboard/admin-dashboard';
import { AdminInventory } from './components/admin/admin-inventory/admin-inventory';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'products', component: ProductPage, canActivate: [authGuard] },
  { path: 'cart', component: CartPage, canActivate: [authGuard] },
  { path: 'orders', component: OrdersPage, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'payment', component: Payment, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboard, canActivate: [adminGuard] },
  { path: 'admin/inventory', component: AdminInventory, canActivate: [adminGuard] },
  { path: 'admin/add-product', loadComponent: () => import('./components/admin/add-product/add-product').then(m => m.AdminAddProduct), canActivate: [adminGuard] },
  { path: 'admin/customize', loadComponent: () => import('./components/admin/customize-product/customize-product').then(m => m.CustomizeProduct), canActivate: [adminGuard] },
  { path: '**', redirectTo: '' }
];
