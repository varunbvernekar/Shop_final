// src/app/components/customer/profile/profile.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, Address } from '../../../models/user';
import { AuthService } from '../../../services/auth';
import { UserService } from '../../../services/user';

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
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      this.errorMessage = 'User not found. Please login again.';
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
          address: user.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          dateOfBirth: user.dateOfBirth || '',
          gender: user.gender || '',
          preferredLanguage: user.preferredLanguage || ''
        };
        
        this.user = completeUser;
        this.originalUser = JSON.parse(JSON.stringify(completeUser)); // Deep copy
        this.isLoading = false;
      },
      error: err => {
        console.error('Failed to load profile', err);
        // If user doesn't exist in db, try to use current user from auth
        if (err.status === 404) {
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            const completeUser: User = {
              ...currentUser,
              phoneNumber: currentUser.phoneNumber || '',
              address: currentUser.address || {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
              },
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
      address: this.user.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
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
          address: updatedUser.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
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
        this.errorMessage = 'Failed to update profile. Please try again.';
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

