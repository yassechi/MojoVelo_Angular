import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { Intervention, InterventionService } from '../../../../core/services/intervention.service';
import { ErrorService } from '../../../../core/services/error.service';
import { environment } from '../../../../../environments/environment';
import { ContratDetailStore } from './contrat-detail.store';

@Component({
  selector: 'app-contrat-entretien',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    TooltipModule,
    DatePicker,
    InputNumber,
  ],
  templateUrl: './contrat-entretien.component.html',
  styleUrls: ['./contrat-entretien.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratEntretienComponent {
  private readonly interventionService = inject(InterventionService);
  private readonly messageService = inject(PrimeMessageService);
  private readonly errorService = inject(ErrorService);
  private readonly store = inject(ContratDetailStore);
  private readonly coreApi = environment.urls.coreApi;
  readonly veloId = computed(() => this.store.veloId());

  readonly interventionsResource = httpResource<Intervention[]>(
    () => {
      const veloId = this.veloId();
      return veloId ? `${this.coreApi}/Intervention/get-by-velo/${veloId}` : undefined;
    },
    { defaultValue: [] },
  );
  readonly interventions = computed(() => this.interventionsResource.value() ?? []);

  // Mode edition intervention
  editingIntervention = false;
  interventionFormMode: 'create' | 'edit' = 'create';
  currentIntervention: Partial<Intervention> = {};
  interventionDate: Date | null = null;

  private readonly interventionsErrorEffect = effect(() => {
    const error = this.interventionsResource.error();
    if (error && !this.isUnauthorized(error)) {
      this.errorService.showError('Impossible de charger les interventions');
    }
  });

  private isUnauthorized(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const err = error as { status?: number; cause?: { status?: number } };
    const status = err.status ?? err.cause?.status;
    return status === 401 || status === 403;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  onAddIntervention(): void {
    const veloId = this.veloId();
    if (!veloId) {
      return;
    }
    this.interventionFormMode = 'create';
    this.editingIntervention = true;
    this.currentIntervention = {
      typeIntervention: '',
      description: '',
      cout: 0,
      veloId,
      isActif: true,
    };
    this.interventionDate = new Date();
  }

  onEditIntervention(intervention: Intervention): void {
    this.interventionFormMode = 'edit';
    this.editingIntervention = true;
    this.currentIntervention = { ...intervention };
    this.interventionDate = new Date(intervention.dateIntervention);
  }

  onCancelInterventionEdit(): void {
    this.editingIntervention = false;
    this.currentIntervention = {};
    this.interventionDate = null;
  }

  onSaveIntervention(): void {
    const veloId = this.veloId();
    if (
      !veloId ||
      !this.interventionDate ||
      !this.currentIntervention.typeIntervention ||
      !this.currentIntervention.description
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez remplir tous les champs obligatoires',
      });
      return;
    }

    const intervention: Intervention = {
      id: this.currentIntervention.id || 0,
      typeIntervention: this.currentIntervention.typeIntervention,
      description: this.currentIntervention.description,
      dateIntervention: this.interventionDate.toISOString().split('T')[0],
      cout: this.currentIntervention.cout || 0,
      veloId,
      isActif: true,
    };

    const saveOperation =
      this.interventionFormMode === 'create'
        ? this.interventionService.create(intervention)
        : this.interventionService.update(intervention);

    saveOperation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succ\u00e8s',
          detail:
            this.interventionFormMode === 'create'
              ? 'Intervention cr\u00e9\u00e9e'
              : 'Intervention modifi\u00e9e',
        });
        this.editingIntervention = false;
        this.interventionsResource.reload();
      },
      error: () => {
        this.errorService.showError("Impossible de sauvegarder l'intervention");
      },
    });
  }

  onDeleteIntervention(intervention: Intervention): void {
    if (confirm(`Voulez-vous vraiment supprimer cette intervention "${intervention.typeIntervention}" ?`)) {
      this.interventionService.delete(intervention.id).subscribe({
        next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succ\u00e8s',
          detail: 'Intervention supprim\u00e9e',
        });
          this.interventionsResource.reload();
        },
        error: () => {
          this.errorService.showError("Impossible de supprimer l'intervention");
        },
      });
    }
  }
}

