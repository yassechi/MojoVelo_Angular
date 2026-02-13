import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { User, UserService } from '../../../core/services/user.service';
import { MessageService } from 'primeng/api';
import { Demande, DemandeService, DemandeStatus } from '../../../core/services/demande.service';
import { CardModule } from 'primeng/card';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-demande-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    CheckboxModule,
    InputNumberModule
  ],
  templateUrl: './admin-demande-form-dialog.html'
})
export class DemandeFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private demandeService = inject(DemandeService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private errorService = inject(ErrorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    id: [null],
    idUser: [null, [Validators.required]],
    idVelo: [null, [Validators.required]],
    status: [DemandeStatus.Encours, [Validators.required]],
    discussionId: [null],
    isActif: [true]
  });
  loading = false;
  users: User[] = [];
  demande: Demande | null = null;
  demandeId: number | null = null;
  isEdit = false;

  statusOptions = [
    { label: 'En cours', value: DemandeStatus.Encours },
    { label: 'En attente', value: DemandeStatus.Attente },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Validé', value: DemandeStatus.Valide }
  ];

  ngOnInit(): void {
    this.loadUsers();
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
          status: DemandeStatus.Encours,
          isActif: true,
        });
      }
    });
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: () => {
        // L'intercepteur gère l'affichage de l'erreur
      }
    });
  }

  loadDemandeById(id: number): void {
    this.loading = true;
    this.demandeService.getOne(id).subscribe({
      next: (demande) => {
        this.demande = demande;
        this.form.patchValue({
          id: demande.id,
          idUser: demande.idUser,
          idVelo: demande.idVelo,
          status: demande.status,
          discussionId: demande.discussionId,
          isActif: (demande as any).isActif ?? true
        });
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger la demande');
        this.loading = false;
        this.goBack();
      }
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
      idUser: values.idUser,
      idVelo: Number(values.idVelo),
      status: Number(values.status),
      discussionId: values.discussionId ? Number(values.discussionId) : null
    };

    if (this.isEdit && this.demandeId) {
      payload.id = this.demandeId;
    }

    const operation = !this.isEdit
      ? this.demandeService.create(payload)
      : this.demandeService.update(payload);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: this.isEdit ? 'Demande modifiée' : 'Demande créée'
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

  private getBasePath(): string {
    const url = this.router.url;
    if (url.startsWith('/manager/')) {
      return '/manager/demandes';
    }
    return '/admin/demandes';
  }
}
