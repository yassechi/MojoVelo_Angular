import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService, User, UserRole } from '../../../core/services/user.service';
import { OrganisationService, Organisation } from '../../../core/services/organisation.service';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-employe-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    PasswordModule
  ],
  templateUrl: './employe-form-dialog.html',
  styleUrls: ['./employe-form-dialog.scss']
})
export class EmployeFormDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() user: User | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  organisations: Organisation[] = [];
  loadingOrganisations = false;

  roleOptions = [
    { label: 'Administrateur', value: UserRole.Admin },
    { label: 'Manager', value: UserRole.Manager },
    { label: 'Utilisateur', value: UserRole.User }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private organisationService: OrganisationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadOrganisations();
  }

  ngOnChanges(): void {
    if (this.user) {
      this.loadUser();
    } else {
      this.form?.reset({
        isActif: true,
        role: UserRole.User
      });
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      id: [null],
      userName: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: [''],  // Sera requis seulement en création
      role: [UserRole.User, [Validators.required]],
      isActif: [true],
      organisationId: [null, [Validators.required]]
    });
  }

  loadOrganisations(): void {
    this.loadingOrganisations = true;
    this.organisationService.getAll().subscribe({
      next: (data) => {
        this.organisations = data;
        this.loadingOrganisations = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des organisations', error);
        this.loadingOrganisations = false;
      }
    });
  }

  loadUser(): void {
    if (this.user) {
      this.form.patchValue(this.user);
      // En modification, le mot de passe n'est pas requis
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    // En création, le mot de passe est requis
    if (!this.user) {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.get('password')?.updateValueAndValidity();
    }

    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    const payload = {
      ...formValue,
      id: formValue.id || undefined
    };

    // En modification, ne pas envoyer le mot de passe s'il est vide
    if (this.user && !payload.password) {
      delete payload.password;
    }

    const operation = !this.user
      ? this.userService.create(payload)
      : this.userService.update(payload);

    operation.subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: this.user ? 'Employé mis à jour' : 'Employé créé'
        });
        this.loading = false;
        this.close();
        this.onSave.emit();
      },
      error: (error) => {
        console.error('Erreur', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Une erreur est survenue'
        });
        this.loading = false;
      }
    });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.form.reset({
      isActif: true,
      role: UserRole.User
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get userName() { return this.form.get('userName'); }
  get firstName() { return this.form.get('firstName'); }
  get lastName() { return this.form.get('lastName'); }
  get email() { return this.form.get('email'); }
  get phoneNumber() { return this.form.get('phoneNumber'); }
  get password() { return this.form.get('password'); }
  get role() { return this.form.get('role'); }
  get organisationId() { return this.form.get('organisationId'); }
}
