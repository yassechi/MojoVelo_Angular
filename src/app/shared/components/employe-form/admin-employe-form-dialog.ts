import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService, User, UserRole } from '../../../core/services/user.service';
import { OrganisationService, Organisation } from '../../../core/services/organisation.service';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { ErrorService } from '../../../core/services/error.service';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-employe-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    PasswordModule,
    ToastModule,
  ],
  templateUrl: './admin-employe-form-dialog.html',
})
export class EmployeFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private organisationService = inject(OrganisationService);
  private messageService = inject(PrimeMessageService);
  private errorService = inject(ErrorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    id: [null],
    userName: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required]],
    password: [''],
    confirmPassword: [''],
    role: [UserRole.User, [Validators.required]],
    isActif: [true],
    organisationId: [null, [Validators.required]],
    tailleCm: [177]
  }, { validators: this.passwordMatchValidator });
  loading = false;
  organisations: Organisation[] = [];
  user: User | null = null;
  userId: string | null = null;
  isEdit = false;

  roleOptions = [
    { label: 'Administrateur', value: UserRole.Admin },
    { label: 'Manager', value: UserRole.Manager },
    { label: 'Utilisateur', value: UserRole.User },
  ];

  ngOnInit(): void {
    this.loadOrganisations();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.userId = id;
        this.updatePasswordValidators();
        this.loadUserById(id);
      } else {
        this.isEdit = false;
        this.userId = null;
        this.user = null;
        this.form.reset({ isActif: true, role: UserRole.User, tailleCm: 177 });
        this.updatePasswordValidators();
      }
    });
  }

  loadOrganisations(): void {
    this.organisationService.getAll().subscribe({
      next: (data) => {
        this.organisations = data;
      },
      error: () => {
        // L'intercepteur gère l'affichage de l'erreur
      }
    });
  }

  loadUserById(id: string): void {
    this.loading = true;
    this.userService.getOne(id).subscribe({
      next: (user) => {
        this.user = user;
        const u = user as any;
        this.form.patchValue({
          id: u.id,
          userName: u.userName,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phoneNumber: u.phoneNumber,
          role: u.role,
          isActif: u.isActif,
          organisationId: typeof u.organisationId === 'object' ? u.organisationId.id : u.organisationId,
          tailleCm: u.tailleCm || 177
        });
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger l\'employé');
        this.loading = false;
        this.goBack();
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const values = this.form.getRawValue();

    const payload: any = {
      id: this.userId ?? values.id,
      firstName: values.firstName,
      lastName: values.lastName,
      userName: values.userName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      role: Number(values.role),
      tailleCm: Number(values.tailleCm),
      isActif: Boolean(values.isActif),
      organisationId: Number(values.organisationId)
    };

    if (values.password && values.password.trim() !== '') {
      payload.password = values.password;
      payload.confirmPassword = values.confirmPassword ?? values.password;
    }

    const operation = !this.isEdit
      ? this.userService.create(payload)
      : this.userService.update(payload);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: this.isEdit ? 'Employé modifié' : 'Employé créé'
        });
        this.loading = false;
        this.goBack();
      },
      error: () => {
        this.loading = false;
        // L'intercepteur affiche déjà l'erreur dans le toast
      }
    });
  }

  goBack(): void {
    this.router.navigate([this.getBasePath()]);
  }

  private updatePasswordValidators(): void {
    const passwordControl = this.form.get('password');
    const confirmControl = this.form.get('confirmPassword');
    if (!passwordControl || !confirmControl) {
      return;
    }
    if (this.isEdit) {
      passwordControl.setValidators([]);
      confirmControl.setValidators([]);
    } else {
      passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
      confirmControl.setValidators([Validators.required]);
    }
    passwordControl.updateValueAndValidity();
    confirmControl.updateValueAndValidity();
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
      confirmPassword.setErrors({ ...(confirmPassword.errors ?? {}), passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword.errors?.['passwordMismatch']) {
      const { passwordMismatch, ...rest } = confirmPassword.errors;
      confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  }

  private getBasePath(): string {
    const url = this.router.url;
    if (url.startsWith('/manager/')) {
      return '/manager/employes';
    }
    return '/admin/employes';
  }
}


