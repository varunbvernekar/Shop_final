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
  phoneNumber = '';
  password = '';
  confirmPassword = '';
  role: UserRole = 'CUSTOMER';

  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.name || !this.email || !this.phoneNumber || !this.password) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    const user: User = {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber || '',
      password: this.password,
      role: this.role,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      dateOfBirth: '',
      gender: '',
      preferredLanguage: ''
    };

    this.authService.register(user).subscribe({
      next: success => {
        if (success) {
          this.router.navigate(['/login'], {
            queryParams: { registered: 'true' }
          });
        } else {
          this.errorMessage = 'A user with this email already exists.';
        }
      },
      error: () => {
        this.errorMessage = 'Something went wrong during registration.';
      }
    });
  }
}
