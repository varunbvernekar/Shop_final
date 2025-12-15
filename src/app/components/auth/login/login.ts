import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  email = '';
  password = '';

  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const registered = params.get('registered');
      if (registered === 'true') {
        this.successMessage = 'Registration successful. Please log in.';
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (success) => {
        if (success) {
          const user = this.authService.getCurrentUser();

          if (user?.role === 'ADMIN') {
            // Admin → go to dashboard
            this.router.navigate(['/admin']);
          } else {
            // Customer (and others like VENDOR) → go to products
            this.router.navigate(['/products']);
          }
        } else {
          this.errorMessage = 'Invalid email or password. Please try again.';
        }
      },
      error: () => {
        this.errorMessage = 'Something went wrong during login. Please try again.';
      },
    });
  }
}
