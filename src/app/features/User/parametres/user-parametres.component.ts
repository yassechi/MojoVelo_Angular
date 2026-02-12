import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { MessageService } from 'primeng/api';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-user-parametres',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    CheckboxModule,
    SelectModule
  ],
  providers: [MessageService],
  templateUrl: './user-parametres.component.html',
  styleUrls: ['./user-parametres.component.scss']
})
export class ParametresComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  preferencesForm!: FormGroup;

  loading = false;
  currentUser: User | null = null;
  activeTab: 'profile' | 'password' | 'preferences' = 'profile';

  languageOptions = [
    { label: 'Français', value: 'fr' },
    { label: 'English', value: 'en' },
    { label: 'Nederlands', value: 'nl' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private messageService: MessageService
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      userName: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      tailleCm: [177]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    this.preferencesForm = this.fb.group({
      language: ['fr'],
      emailNotifications: [true],
      smsNotifications: [false],
      newsletterSubscription: [true]
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  setActiveTab(tab: 'profile' | 'password' | 'preferences'): void {
    this.activeTab = tab;
  }

  loadCurrentUser(): void {
    const storedUser = localStorage.getItem('currentUser');

    if (storedUser) {
      const user = JSON.parse(storedUser);
      const userId = user.id;

      if (userId) {
        this.userService.getOne(userId).subscribe({
          next: (userData) => {
            this.currentUser = userData;
            this.profileForm.patchValue({
              userName: userData.userName,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              phoneNumber: userData.phoneNumber,
              tailleCm: (userData as any).tailleCm || 177
            });

            this.loadPreferences();
          },
          error: (err) => {
            console.error('Erreur chargement utilisateur:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de charger vos informations'
            });
          }
        });
      }
    }
  }

  loadPreferences(): void {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences);
      this.preferencesForm.patchValue(prefs);
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    if (!this.currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Utilisateur non identifié'
      });
      return;
    }

    this.loading = true;
    const values = this.profileForm.value;

    const payload = {
      id: this.currentUser.id,
      userName: values.userName,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      role: this.currentUser.role,
      tailleCm: Number(values.tailleCm),
      isActif: this.currentUser.isActif,
      organisationId: this.currentUser.organisationId
    };

    this.userService.update(payload).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Vos informations ont été mises à jour'
        });
        this.loadCurrentUser();
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur mise à jour profil:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de mettre à jour vos informations'
        });
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (!this.currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Utilisateur non identifié'
      });
      return;
    }

    this.loading = true;
    const values = this.passwordForm.value;

    const payload = {
      id: this.currentUser.id,
      userName: this.currentUser.userName,
      firstName: this.currentUser.firstName,
      lastName: this.currentUser.lastName,
      email: this.currentUser.email,
      phoneNumber: this.currentUser.phoneNumber,
      role: this.currentUser.role,
      tailleCm: (this.currentUser as any).tailleCm || 177,
      isActif: this.currentUser.isActif,
      organisationId: this.currentUser.organisationId,
      password: values.newPassword,
      confirmPassword: values.confirmPassword
    };

    this.userService.update(payload).subscribe({
      next: () => {
        this.loading = false;
        this.passwordForm.reset();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Votre mot de passe a été modifié'
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur changement mot de passe:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de modifier votre mot de passe'
        });
      }
    });
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid) {
      this.preferencesForm.markAllAsTouched();
      return;
    }

    const preferences = this.preferencesForm.value;
    localStorage.setItem('userPreferences', JSON.stringify(preferences));

    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Vos préférences ont été enregistrées'
    });
  }
}
