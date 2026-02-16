import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  ContratEditData,
  ContratService,
  Contrat,
  StatutContrat,
} from '../../../../core/services/contrat.service';
import { ErrorService } from '../../../../core/services/error.service';
import { environment } from '../../../../../environments/environment';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { Toast } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';

@Component({
  selector: 'app-contrat-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Card,
    Button,
    InputText,
    Select,
    DatePicker,
    InputNumber,
    Toast
  ],
  providers: [PrimeMessageService],
  templateUrl: './admin-contrat-edit.component.html',
  styleUrls: ['./admin-contrat-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly messageService = inject(PrimeMessageService);
  private readonly errorService = inject(ErrorService);

  private readonly coreApi = environment.urls.coreApi;

  readonly contratForm = this.fb.group({
    ref: this.fb.nonNullable.control('', Validators.required),
    veloId: this.fb.control<number | null>(null, Validators.required),
    beneficiaireId: this.fb.nonNullable.control('', Validators.required),
    userRhId: this.fb.nonNullable.control('', Validators.required),
    dateDebut: this.fb.control<Date | null>(null, Validators.required),
    dateFin: this.fb.control<Date | null>(null, Validators.required),
    duree: this.fb.control<number | null>(null, Validators.required),
    loyerMensuelHT: this.fb.control<number | null>(null, Validators.required),
    statutContrat: this.fb.nonNullable.control(StatutContrat.EnCours, Validators.required),
  });

  readonly contratId = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = params.get('id');
        return id ? Number(id) : null;
      }),
    ),
    { initialValue: null },
  );

  readonly editDataResource = httpResource<ContratEditData | null>(
    () => {
      const id = this.contratId();
      return id ? `${this.coreApi}/Contrat/edit-data/${id}` : undefined;
    },
    { defaultValue: null },
  );

  readonly contratResource = computed(() => this.editDataResource.value()?.contrat ?? null);
  readonly users = computed(() => this.editDataResource.value()?.users ?? []);
  readonly velos = computed(() => this.editDataResource.value()?.velos ?? []);

  readonly loading = computed(() => this.editDataResource.isLoading());

  readonly statutOptions = [
    { label: 'En cours', value: StatutContrat.EnCours },
    { label: 'Terminé', value: StatutContrat.Termine },
    { label: 'Résilié', value: StatutContrat.Resilie },
  ];

  private readonly contratErrorShown = signal(false);
  private readonly contratFormEffect = effect(() => {
    const contrat = this.contratResource();
    if (!contrat) {
      return;
    }
    this.contratForm.patchValue({
      ref: contrat.ref,
      veloId: contrat.veloId,
      beneficiaireId: contrat.beneficiaireId,
      userRhId: contrat.userRhId,
      dateDebut: new Date(contrat.dateDebut),
      dateFin: new Date(contrat.dateFin),
      duree: contrat.duree,
      loyerMensuelHT: contrat.loyerMensuelHT,
      statutContrat: contrat.statutContrat,
    });
  });

  private readonly contratErrorEffect = effect(() => {
    const error = this.editDataResource.error();
    if (error && !this.contratErrorShown()) {
      this.errorService.showError('Impossible de charger le contrat');
      this.contratErrorShown.set(true);
    }
    if (!error && this.contratErrorShown()) {
      this.contratErrorShown.set(false);
    }
  });

  onSubmit(): void {
    if (this.contratForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez remplir tous les champs obligatoires',
      });
      return;
    }

    const formValue = this.contratForm.getRawValue();
    const {
      dateDebut,
      dateFin,
      veloId,
      duree,
      loyerMensuelHT,
    } = formValue;
    if (!dateDebut || !dateFin || veloId === null || duree === null || loyerMensuelHT === null) {
      this.errorService.showError('Formulaire incomplet');
      return;
    }
    const contrat: Contrat = {
      id: this.contratId() ?? undefined,
      ref: formValue.ref,
      veloId,
      beneficiaireId: formValue.beneficiaireId,
      userRhId: formValue.userRhId,
      dateDebut: dateDebut.toISOString().split('T')[0],
      dateFin: dateFin.toISOString().split('T')[0],
      duree,
      loyerMensuelHT,
      statutContrat: formValue.statutContrat,
      isActif: true,
    };

    this.contratService.update(contrat).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Contrat modifié avec succès',
        });

        const contratId = this.contratId();
        if (contratId) {
          // Recharger la page directement après navigation
          setTimeout(() => {
            window.location.href = `/admin/contrats/${contratId}`;
          }, 1000);
        }
      },
      error: () => {
        this.errorService.showError('Impossible de modifier le contrat');
      },
    });
  }

  goBack(): void {
    const contratId = this.contratId();
    this.router.navigate(['/admin/contrats', contratId]);
  }
}


