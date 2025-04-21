import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, UserProfile } from '../../shared/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  template: `
    <div class="profile-container">
      <h2>Update Profile</h2>
      
      <div class="user-info" *ngIf="userProfile">
        <p><strong>Email:</strong> {{ userProfile.email || 'Not set' }}</p>
        <p><strong>Name:</strong> {{ userProfile.name || 'Not set' }}</p>
        <p><strong>Age:</strong> {{ userProfile.age || 'Not set' }}</p>
        <p><strong>Nickname:</strong> {{ userProfile.nickname || 'Not set' }}</p>
      </div>
      
      <div class="buttons-container">
        <button type="button" class="edit-btn" (click)="openEditModal()">
          Update Profile
        </button>
        
        <button type="button" class="play-btn" (click)="playLine98()">
          Play Line 98
        </button>
        
        <button type="button" class="play-btn" (click)="playCaro()">
          Play Caro
        </button>
        
        <button type="button" class="logout-btn" (click)="logout()">
          Logout
        </button>
      </div>
      
      <!-- Modal overlay -->
      <div class="modal-overlay" *ngIf="isModalOpen" (click)="closeModalOnOverlayClick($event)">
        <div class="modal-content">
          <span class="close-btn" (click)="closeModal()">&times;</span>
          <h3>Edit Profile</h3>
          
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" formControlName="email">
              @if (submitted && profileForm.get('email')?.errors?.['email']) {
                <div class="error">Please enter a valid email</div>
              }
            </div>
            
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" formControlName="name">
            </div>
            
            <div class="form-group">
              <label for="age">Age</label>
              <input type="number" id="age" formControlName="age">
              @if (submitted && profileForm.get('age')?.errors?.['min']) {
                <div class="error">Age cannot be negative</div>
              }
            </div>
            
            <div class="form-group">
              <label for="nickname">Nickname</label>
              <input type="text" id="nickname" formControlName="nickname">
            </div>
            
            @if (errorMsg) {
              <div class="error-message">{{ errorMsg }}</div>
            }
            
            @if (successMsg) {
              <div class="success-message">{{ successMsg }}</div>
            }
            
            <div class="modal-buttons">
              <button type="submit" [disabled]="loading" class="save-btn">
                {{ loading ? 'Updating...' : 'Save Changes' }}
              </button>
              <button type="button" class="cancel-btn" (click)="closeModal()">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 500px;
      margin: 40px auto;
      padding: 30px;
      border: 1px solid #ccc;
      border-radius: 8px;
      background-color: #f9f9f9;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    h2 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    
    .user-info {
      background-color: #fff;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 25px;
      border-left: 4px solid #2196F3;
    }
    
    .user-info p {
      margin: 10px 0;
      font-size: 15px;
    }
    
    .buttons-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }
    
    button {
      width: 100%;
      padding: 12px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 15px;
      transition: background-color 0.3s;
    }
    
    button:hover {
      opacity: 0.9;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .edit-btn {
      background-color: #4CAF50;
    }
    
    .play-btn {
      background-color: #2196F3;
    }
    
    .save-btn {
      background-color: #4CAF50;
    }
    
    .cancel-btn {
      background-color: #9E9E9E;
    }
    
    .logout-btn {
      background-color: #f44336;
    }
    
    .error {
      color: red;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .error-message {
      color: red;
      text-align: center;
      margin: 10px 0;
    }
    
    .success-message {
      color: green;
      text-align: center;
      margin: 10px 0;
    }
    
    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .modal-content {
      background-color: white;
      padding: 25px;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      position: relative;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    
    .close-btn {
      position: absolute;
      top: 15px;
      right: 20px;
      font-size: 24px;
      cursor: pointer;
      color: #777;
    }
    
    .close-btn:hover {
      color: #333;
    }
    
    h3 {
      margin-top: 5px;
      margin-bottom: 20px;
      text-align: center;
      color: #333;
    }
    
    .modal-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    
    .modal-buttons button {
      flex: 1;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  submitted = false;
  errorMsg = '';
  successMsg = '';
  isModalOpen = false;
  userProfile: UserProfile | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.formBuilder.group({
      email: ['', [Validators.email]],
      name: [''],
      age: [null, [Validators.min(0)]],
      nickname: ['']
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.authService.getCurrentProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMsg = 'Failed to load user profile.';
      }
    });
  }

  openEditModal() {
    // Reset form state
    this.submitted = false;
    this.errorMsg = '';
    this.successMsg = '';
    
    // Fill form with current values if available
    if (this.userProfile) {
      this.profileForm.patchValue({
        email: this.userProfile.email || '',
        name: this.userProfile.name || '',
        age: this.userProfile.age || null,
        nickname: this.userProfile.nickname || ''
      });
    }
    
    // Open modal
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  closeModalOnOverlayClick(event: MouseEvent) {
    // Only close if the overlay itself was clicked, not its children
    if ((event.target as HTMLElement).className === 'modal-overlay') {
      this.closeModal();
    }
  }

  onSubmit() {
    this.submitted = true;
    this.errorMsg = '';
    this.successMsg = '';

    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    
    const userData = this.profileForm.value;
    
    this.authService.updateProfile(userData).subscribe({
      next: (response) => {
        this.successMsg = 'Profile updated successfully';
        this.loading = false;
        
        // Update the displayed profile data
        this.loadUserProfile();
        
        // Close modal after a short delay to show success message
        setTimeout(() => {
          this.closeModal();
        }, 1500);
      },
      error: (error) => {
        this.errorMsg = error.error.message || 'Failed to update profile';
        this.loading = false;
      }
    });
  }

  playLine98() {
    this.router.navigate(['/line98']);
  }

  playCaro() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No token found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    
    this.router.navigate(['/caro']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 