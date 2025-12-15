// src/app/components/customer/profile/profile.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, Address } from '../../models/user';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  user: User | null = null;
  originalUser: User | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const currentUser = this.authService.getCurrentUser();

    // During SSR or initial load, user might be null. 
    // We shouldn't error out, just show loading or empty state until client hydration.
    if (!currentUser || !currentUser.id) {
      // Optionally check if we are on server to differentiate "not logged in" vs "server render"
      // But simpler is to stricter check in logic
      // For now, if no user, we can't load profile.
      // However, we shouldn't show "User not found" error immediately if it's just SSR waiting for hydration.
      // Let's return and stay in "isLoading" false (or true?) state.
      // Actually, best is to just return and let the view handle null user (which it likely does with *ngIf or empty fields)
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.getUser(currentUser.id).subscribe({
      next: user => {
        // Initialize all missing fields with default values
        const completeUser: User = {
          ...user,
          phoneNumber: user.phoneNumber || '',
          dateOfBirth: user.dateOfBirth || '',
          gender: user.gender || '',
          preferredLanguage: user.preferredLanguage || ''
        };

        this.user = completeUser;
        this.originalUser = JSON.parse(JSON.stringify(completeUser)); // Deep copy
        this.isLoading = false;
      },
      error: err => {
        if (err.status === 0) {
          this.errorMessage = 'Unable to connect to the server. Please ensure the backend is running.';
          this.isLoading = false;
          return;
        }
        // If user doesn't exist in db, try to use current user from auth
        if (err.status === 404) {
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            const completeUser: User = {
              ...currentUser,
              phoneNumber: currentUser.phoneNumber || '',
              dateOfBirth: currentUser.dateOfBirth || '',
              gender: currentUser.gender || '',
              preferredLanguage: currentUser.preferredLanguage || ''
            };
            this.user = completeUser;
            this.originalUser = JSON.parse(JSON.stringify(completeUser));
            this.isLoading = false;
            return;
          }
        }
        this.errorMessage = 'Failed to load profile. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.user || !this.user.id) {
      this.errorMessage = 'User data is invalid.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Ensure all fields are properly initialized before saving
    const userToSave: User = {
      ...this.user,
      phoneNumber: this.user.phoneNumber || '',
      dateOfBirth: this.user.dateOfBirth || '',
      gender: this.user.gender || '',
      preferredLanguage: this.user.preferredLanguage || ''
    };

    this.userService.updateUser(userToSave).subscribe({
      next: updatedUser => {
        // Ensure all fields are initialized in the response
        const completeUser: User = {
          ...updatedUser,
          phoneNumber: updatedUser.phoneNumber || '',
          dateOfBirth: updatedUser.dateOfBirth || '',
          gender: updatedUser.gender || '',
          preferredLanguage: updatedUser.preferredLanguage || ''
        };

        // Update the current user in auth service
        this.authService.updateCurrentUser(completeUser);
        this.user = completeUser;
        this.originalUser = JSON.parse(JSON.stringify(completeUser));
        this.successMessage = 'Profile updated successfully!';
        this.isSaving = false;

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: err => {
        console.error('Failed to update profile', err);
        if (err.status === 0) {
          this.errorMessage = 'Unable to connect to the server. Please ensure the backend is running.';
        } else {
          this.errorMessage = 'Failed to update profile. Please try again.';
        }
        this.isSaving = false;
      }
    });
  }

  resetForm(): void {
    if (this.originalUser) {
      this.user = JSON.parse(JSON.stringify(this.originalUser));
      this.errorMessage = '';
      this.successMessage = '';
    }
  }
}

