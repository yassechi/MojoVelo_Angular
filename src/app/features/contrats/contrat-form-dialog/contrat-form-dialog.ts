import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContratService, Contrat, StatutContrat } from '../../../core/services/contrat.service';
import { UserService, User } from '../../../core/services/user.service';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-contrat-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    CheckboxModule
  ],
  templateUrl: './contrat-form-dialog.html',
  styleUrls: ['./contrat-form-dialog.scss']
})
export class ContratFormDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() contrat: Contrat | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  users: User[] = [];
  loadingUsers = false;

  statutOptions = [
    { label: 'En cours', value: StatutContrat.EnCours },
    { label: 'Terminé', value: StatutContrat.Termine }
  ];

  constructor(
    private fb: FormBuilder,
    private contratService: ContratService,
    private userService: UserService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  ngOnChanges(): void {
    if (this.contrat) {
      this.loadContrat();
    } else {
      this.form?.reset({
        id: 0,
        statutContrat: StatutContrat.EnCours,
        isActif: true
      });
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      id: [0],
      ref: ['', [Validators.required]],
      dateDebut: [new Date(), [Validators.required]],
      dateFin: [null, [Validators.required]],
      duree: [24, [Validators.required, Validators.min(1)]],
      loyerMensuelHT: [0, [Validators.required, Validators.min(0)]],
      statutContrat: [StatutContrat.EnCours, [Validators.required]],
      veloId: [null, [Validators.required]],
      beneficiaireId: ['', [Validators.required]],
      userRhId: ['', [Validators.required]],
      isActif: [true]
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
      }
    });
  }

  loadContrat(): void {
    if (this.contrat) {
      this.form.patchValue({
        ...this.contrat,
        dateDebut: new Date(this.contrat.dateDebut),
        dateFin: new Date(this.contrat.dateFin)
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    const payload = {
      ...formValue,
      id: formValue.id || 0,
      dateDebut: this.formatDateToISO(formValue.dateDebut),
      dateFin: this.formatDateToISO(formValue.dateFin)
    };

    const operation = !payload.id || payload.id === 0
      ? this.contratService.create(payload)
      : this.contratService.update(payload);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: payload.id ? 'Contrat mis à jour' : 'Contrat créé'
        });
        this.loading = false;
        this.close();
        this.onSave.emit();
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
    this.form.reset({
      id: 0,
      statutContrat: StatutContrat.EnCours,
      isActif: true
    });
  }

  private formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get ref() { return this.form.get('ref'); }
  get dateDebut() { return this.form.get('dateDebut'); }
  get dateFin() { return this.form.get('dateFin'); }
  get duree() { return this.form.get('duree'); }
  get loyerMensuelHT() { return this.form.get('loyerMensuelHT'); }
  get veloId() { return this.form.get('veloId'); }
  get beneficiaireId() { return this.form.get('beneficiaireId'); }
  get userRhId() { return this.form.get('userRhId'); }
}
