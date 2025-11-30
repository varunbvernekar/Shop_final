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
  styleUrls: ['./login.css']
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
  ) {}

  ngOnInit(): void {
  // 👇 If already logged in, skip login page
  if (this.authService.isLoggedIn()) {
    this.router.navigate(['/products']);
    return;
  }

  // If user just registered, show confirmation message
  this.route.queryParamMap.subscribe(params => {
    const registered = params.get('registered');
    if (registered === 'true') {
      this.successMessage =
        'Registration successful. Please login with your new credentials.';
    }
  });
}

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    const success = this.authService.login(this.email, this.password);

    if (success) {
      this.router.navigate(['/products']);
    } else {
      this.errorMessage = 'Invalid email or password. Please try again.';
    }
  }
}
