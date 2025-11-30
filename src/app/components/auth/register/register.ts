import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

import { AuthService } from '../../../services/auth';
import { User, UserRole } from '../../../models/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role: UserRole = 'CUSTOMER';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    const user: User = {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role
    };

    const success = this.authService.register(user);

    if (success) {
      // ✅ Do NOT open product page directly
      // Go back to login with a "registered=true" flag
      this.router.navigate(['/login'], {
        queryParams: { registered: 'true' }
      });
    } else {
      this.errorMessage = 'A user with this email already exists.';
    }
  }
}
