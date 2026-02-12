import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { User, UserService } from '../../../../core/services/user.service';
import { MessageService } from 'primeng/api';
import { Demande, DemandeService, DemandeStatus } from '../../../../core/services/demande.service';

@Component({
  selector: 'app-demande-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    CheckboxModule,
    InputNumberModule
  ],
  templateUrl: './admin-demande-form-dialog.html'
})
export class DemandeFormDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() demande: Demande | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  users: User[] = [];

  statusOptions = [
    { label: 'En cours', value: DemandeStatus.Encours },
    { label: 'En attente', value: DemandeStatus.Attente },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Validé', value: DemandeStatus.Valide }
  ];

  constructor(
    private fb: FormBuilder,
    private demandeService: DemandeService,
    private userService: UserService,
    private messageService: MessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['demande'] && this.visible) {
      if (this.demande) {
        this.loadDemande();
      } else {
        this.form.reset({
          status: DemandeStatus.Encours,
          isActif: true
        });
      }
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      id: [null],
      idUser: [null, [Validators.required]],
      idVelo: [null, [Validators.required]],
      status: [DemandeStatus.Encours, [Validators.required]],
      discussionId: [null],
      isActif: [true]
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

  loadDemande(): void {
    if (this.demande) {
      this.form.patchValue({
        id: this.demande.id,
        idUser: this.demande.idUser,
        idVelo: this.demande.idVelo,
        status: this.demande.status,
        discussionId: this.demande.discussionId,
        isActif: (this.demande as any).isActif ?? true
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
      idUser: values.idUser,
      idVelo: Number(values.idVelo),
      status: Number(values.status),
      discussionId: values.discussionId ? Number(values.discussionId) : null
    };

    if (this.demande) {
      payload.id = values.id;
    }

    const operation = !this.demande
      ? this.demandeService.create(payload)
      : this.demandeService.update(payload);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: this.demande ? 'Demande modifiée' : 'Demande créée'
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
