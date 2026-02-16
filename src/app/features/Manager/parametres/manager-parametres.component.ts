import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { ErrorService } from '../../../core/services/error.service';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';


@Component({
  selector: 'app-manager-parametres',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    ToastModule
  ],
  providers: [PrimeMessageService],
  templateUrl: './manager-parametres.component.html',
  styleUrls: ['./manager-parametres.component.scss']
})
export class ParametresComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private messageService = inject(PrimeMessageService);
  private errorService = inject(ErrorService);

  profileForm: FormGroup = this.fb.group({
    userName: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required]],
    tailleCm: [177]
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator
  });

  loading = false;
  currentUser: User | null = null;
  activeTab: 'profile' | 'password' = 'profile';

  ngOnInit(): void {
    this.loadCurrentUser();
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

  setActiveTab(tab: 'profile' | 'password'): void {
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

          },
          error: (err) => {
            this.errorService.showError('Impossible de charger vos informations');
          }
        });
      }
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    if (!this.currentUser) {
      this.errorService.showError('Utilisateur non identifié');
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
        this.errorService.showError('Impossible de mettre à jour vos informations');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (!this.currentUser) {
      this.errorService.showError('Utilisateur non identifié');
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
        this.errorService.showError('Impossible de modifier votre mot de passe');
      }
    });
  }

}


