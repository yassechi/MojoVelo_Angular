import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { UserService, UserRole } from '../../../core/services/user.service';
import { Organisation, OrganisationService } from '../../../core/services/organisation.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    ToastModule,
  ],
  providers: [PrimeMessageService],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly organisationService = inject(OrganisationService);
  private readonly router = inject(Router);
  private readonly messageService = inject(PrimeMessageService);
  private readonly errorService = inject(ErrorService);

  loading = false;
  loadingOrganisations = false;
  organisations: Organisation[] = [];

  form = this.fb.group(
    {
      userName: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      organisationId: [null, [Validators.required]],
    },
    { validators: this.passwordMatchValidator },
  );

  ngOnInit(): void {
    this.loadOrganisations();
  }

  loadOrganisations(): void {
    this.loadingOrganisations = true;
    this.organisationService.getAll().subscribe({
      next: (data) => {
        const organisations = data ?? [];
        this.organisations = organisations
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name));
        this.loadingOrganisations = false;
      },
      error: () => {
        this.loadingOrganisations = false;
        this.errorService.showError('Impossible de charger les organisations');
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.loading = true;
    const values = this.form.getRawValue();

    const payload = {
      userName: String(values.userName ?? '').trim(),
      firstName: String(values.firstName ?? '').trim(),
      lastName: String(values.lastName ?? '').trim(),
      email: String(values.email ?? '').trim(),
      phoneNumber: String(values.phoneNumber ?? '').trim(),
      password: values.password,
      confirmPassword: values.confirmPassword,
      role: UserRole.User,
      isActif: true,
      organisationId: Number(values.organisationId),
    };

    this.userService.create(payload).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Succes',
          detail: 'Compte cree avec succes',
        });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading = false;
        const message =
          error?.error?.message ||
          (error instanceof Error && error.message
            ? error.message
            : 'Impossible de creer le compte');
        this.errorService.showError(message);
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    const passwordValue = password?.value;
    const confirmValue = confirmPassword?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    if (!passwordValue && !confirmValue) {
      if (confirmPassword.errors?.['passwordMismatch']) {
        const { passwordMismatch, ...rest } = confirmPassword.errors;
        confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    }

    if (passwordValue !== confirmValue) {
      confirmPassword.setErrors({
        ...(confirmPassword.errors ?? {}),
        passwordMismatch: true,
      });
      return { passwordMismatch: true };
    }

    if (confirmPassword.errors?.['passwordMismatch']) {
      const { passwordMismatch, ...rest } = confirmPassword.errors;
      confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  }
}


