import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService, User, UserRole } from '../../../../core/services/user.service';
import { OrganisationService, Organisation } from '../../../../core/services/organisation.service';
import { MessageService } from 'primeng/api';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';

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
    PasswordModule,
  ],
  templateUrl: './admin-employe-form-dialog.html',
})
export class EmployeFormDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() user: User | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  organisations: Organisation[] = [];

  roleOptions = [
    { label: 'Administrateur', value: UserRole.Admin },
    { label: 'Manager', value: UserRole.Manager },
    { label: 'Utilisateur', value: UserRole.User },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private organisationService: OrganisationService,
    private messageService: MessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadOrganisations();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.visible) {
      if (this.user) {
        this.loadUser();
      } else {
        this.form.reset({ isActif: true, role: UserRole.User, tailleCm: 177 });
      }
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
      password: [''],
      role: [UserRole.User, [Validators.required]],
      isActif: [true],
      organisationId: [null, [Validators.required]],
      tailleCm: [177]
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

  loadUser(): void {
    if (this.user) {
      const u = this.user as any;
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
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const values = this.form.getRawValue();

    const payload: any = {
      id: values.id,
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
      payload.confirmPassword = values.password;
    }

    const operation = !this.user
      ? this.userService.create(payload)
      : this.userService.update(payload);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: this.user ? 'Employé modifié' : 'Employé créé'
        });
        this.loading = false;
        this.onSave.emit();
        this.close();
      },
      error: () => {
        this.loading = false;
        // L'intercepteur affiche déjà l'erreur dans le toast
      }
    });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.form.reset();
  }
}
