import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, MatSnackBarModule],
  template: `
    <div class="register-container">
      <h2>Register</h2>
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" formControlName="username">
          @if (submitted && registerForm.get('username')?.errors) {
            <div class="error">Username is required</div>
          }
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" formControlName="password">
          @if (submitted && registerForm.get('password')?.errors?.['required']) {
            <div class="error">Password is required</div>
          } @else if (submitted && registerForm.get('password')?.errors?.['minlength']) {
            <div class="error">Password must be at least 6 characters</div>
          }
        </div>
        
        @if (errorMsg) {
          <div class="error-message">{{ errorMsg }}</div>
        }
        
        <button type="submit" [disabled]="loading">
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
        
        <div class="login-link">
          <p>Already have an account? <a [routerLink]="['/login']">Login</a></p>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .register-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
      background-color: #f9f9f9;
    }
    
    h2 {
      text-align: center;
      margin-bottom: 20px;
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
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    button {
      width: 100%;
      padding: 10px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
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
    
    .login-link {
      text-align: center;
      margin-top: 15px;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  errorMsg = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    this.submitted = true;
    this.errorMsg = '';

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    
    const { username, password } = this.registerForm.value;
    
    this.authService.register(username, password).subscribe({
      next: () => {
        this.snackBar.open('Đăng ký thành công!', 'Đóng', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.router.navigate(['/login'], { 
          queryParams: { registered: 'true' } 
        });
      },
      error: (error) => {
        this.errorMsg = error.error.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
} 