import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, MatSnackBarModule],
  template: `
    <div class="login-container">
      <h2>Login</h2>
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" formControlName="username">
          @if (submitted && loginForm.get('username')?.errors) {
            <div class="error">Username is required</div>
          }
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" formControlName="password">
          @if (submitted && loginForm.get('password')?.errors) {
            <div class="error">Password is required</div>
          }
        </div>
        
        @if (errorMsg) {
          <div class="error-message">{{ errorMsg }}</div>
        }
        
        <button type="submit" [disabled]="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        
        <div class="register-link">
          <p>Don't have an account? <a [routerLink]="['/register']">Register</a></p>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .login-container {
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
    
    .register-link {
      text-align: center;
      margin-top: 15px;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  errorMsg = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Check if user was redirected from registration
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.snackBar.open('Đăng ký thành công! Vui lòng đăng nhập.', 'Đóng', {
          duration: 5000,
          panelClass: 'success-snackbar'
        });
      }
    });
  }

  onSubmit() {
    this.submitted = true;
    this.errorMsg = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    
    const { username, password } = this.loginForm.value;
    
    this.authService.login(username, password).subscribe({
      next: () => {
        this.snackBar.open('Đăng nhập thành công!', 'Đóng', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.router.navigate(['/profile']);
      },
      error: (error) => {
        this.errorMsg = error.error.message || 'Invalid username or password';
        this.loading = false;
      }
    });
  }
} 