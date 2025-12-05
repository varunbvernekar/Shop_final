// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Register } from './components/auth/register/register';
import { Landing } from './components/landing/landing';
import { ProductPage } from './components/customer/product-page/product-page';
import { OrdersPage } from './components/customer/orders/orders';
import { Profile } from './components/customer/profile/profile';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { AdminDashboard } from './components/admin/admin-dashboard/admin-dashboard';
import { AdminInventory } from './components/admin/admin-inventory/admin-inventory';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'products', component: ProductPage, canActivate: [authGuard] },
  { path: 'orders', component: OrdersPage, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboard, canActivate: [adminGuard] },
  { path: 'admin/inventory', component: AdminInventory, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' }
];
