import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DemandeService, Demande, DemandeStatus } from '../../../../core/services/demande.service';
import { DiscussionService } from '../../../../core/services/discussion.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { switchMap } from 'rxjs/operators';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-user-demande-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule
  ],
  templateUrl: './user-demande-form-dialog.html',
  styleUrls: ['./user-demande-form-dialog.scss']
})
export class UserDemandeFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() demande: Demande | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  currentUserId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private demandeService: DemandeService,
    private discussionService: DiscussionService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.initForm();
    this.loadCurrentUserId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['demande'] && this.visible) {
      if (this.demande) {
        this.loadDemande();
      } else {
        this.form.reset({
          status: DemandeStatus.Encours
        });
      }
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      id: [null],
      idVelo: ['', [Validators.required]],
      status: [DemandeStatus.Encours]
    });
  }

  loadCurrentUserId(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id || null;
    }
  }

  loadDemande(): void {
    if (this.demande) {
      this.form.patchValue({
        id: this.demande.id,
        idVelo: this.demande.idVelo,
        status: this.demande.status
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.currentUserId) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const values = this.form.getRawValue();

    // ✅ Si c'est une MODIFICATION, pas besoin de créer une discussion
    if (this.demande) {
      this.updateDemande(values);
      return;
    }

    // ✅ Si c'est une CRÉATION, créer d'abord la discussion
    this.createDiscussionThenDemande(values);
  }

  createDiscussionThenDemande(values: any): void {
    // Créer la discussion
    const discussionPayload = {
      id: 0,
      objet: `Demande vélo ${values.idVelo}`,
      status: true,
      isActif: true,
      clientId: this.currentUserId!,
      mojoId: this.currentUserId!,  // ✅ CORRIGÉ - Utiliser le même user
      dateCreation: new Date().toISOString(),
      createdBy: this.currentUserId!
    };

    this.discussionService.create(discussionPayload).pipe(
      switchMap((discussionResponse) => {
        // Récupérer l'ID de la discussion créée
        const discussionId = discussionResponse.id || discussionResponse.data?.id || 0;

        // Créer la demande avec l'ID de la discussion
        const demandePayload: any = {
          id: 0,
          idUser: this.currentUserId,
          idVelo: Number(values.idVelo),
          status: values.status || DemandeStatus.Encours,
          discussionId: discussionId
        };

        return this.demandeService.create(demandePayload);
      })
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Demande créée avec succès'
        });
        this.loading = false;
        this.onSave.emit();
        this.close();
      },
      error: (err) => {
        console.error('Erreur création:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de créer la demande'
        });
        this.loading = false;
      }
    });
  }

  updateDemande(values: any): void {
    const payload: any = {
      id: values.id,
      idUser: this.currentUserId,
      idVelo: Number(values.idVelo),
      status: values.status,
      discussionId: this.demande?.discussionId || 0
    };

    this.demandeService.update(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Demande modifiée'
        });
        this.loading = false;
        this.onSave.emit();
        this.close();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.form.reset();
  }
}
