import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { Demande, DemandeService, DemandeStatus } from '../../../../core/services/demande.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorService } from '../../../../core/services/error.service';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-user-demande-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './user-demande-form-dialog.html',
  styleUrls: ['./user-demande-form-dialog.scss'],
})
export class UserDemandeFormDialogComponent implements OnInit {
  loading = false;

  private readonly fb = inject(FormBuilder);
  private readonly demandeService = inject(DemandeService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly errorService = inject(ErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  form = this.fb.group({
    idVelo: this.fb.control<number | null>(null, Validators.required),
  });

  demande: Demande | null = null;
  demandeId: number | null = null;
  isEdit = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.demandeId = Number(id);
        this.loadDemandeById(this.demandeId);
      } else {
        this.isEdit = false;
        this.demandeId = null;
        this.demande = null;
        this.form.reset({
          idVelo: null,
        });
      }
    });
  }
  private loadDemandeById(id: number): void {
    this.loading = true;
    this.demandeService.getOne(id).subscribe({
      next: (demande) => {
        this.demande = demande;
        this.form.patchValue({
          idVelo: demande.idVelo,
        });
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger la demande');
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

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.errorService.showError('Utilisateur non authentifie');
      return;
    }

    this.loading = true;
    const values = this.form.getRawValue();

    const payload: Demande = {
      id: this.demandeId ?? this.demande?.id,
      idUser: currentUser.id,
      idVelo: Number(values.idVelo),
      status: this.demande?.status ?? DemandeStatus.Encours,
      discussionId: this.demande?.discussionId,
    };

    const operation = this.isEdit
      ? this.demandeService.update(payload)
      : this.demandeService.create(payload);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succes',
          detail: this.isEdit ? 'Demande modifiee' : 'Demande creee',
        });
        this.loading = false;
        this.goBack();
      },
      error: () => {
        this.loading = false;
        this.errorService.showError(
          this.isEdit ? 'Impossible de modifier la demande' : 'Impossible de creer la demande',
        );
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/user/demandes']);
  }
}
