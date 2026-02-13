import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ContratService, Contrat, StatutContrat } from '../../../../core/services/contrat.service';
import { User } from '../../../../core/services/user.service';
import { InterventionService, Intervention } from '../../../../core/services/intervention.service';
import { AmortissementService, Amortissement } from '../../../../core/services/amortissement.service';
import { DocumentService, Document } from '../../../../core/services/document.service';
import { ErrorService } from '../../../../core/services/error.service';
import { environment } from '../../../../../environments/environment';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    TooltipModule,
    ToastModule,
    TableModule,
    FormsModule,
    InputTextModule,
    DatePicker,
    InputNumber,
  ],
  providers: [MessageService],
  templateUrl: './admin-contrat-detail.component.html',
  styleUrls: ['./admin-contrat-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly interventionService = inject(InterventionService);
  private readonly amortissementService = inject(AmortissementService);
  private readonly documentService = inject(DocumentService);
  private readonly messageService = inject(MessageService);
  private readonly errorService = inject(ErrorService);

  private readonly coreApi = environment.urls.coreApi;
  private readonly legacyApi = environment.urls.legacyApi;

  readonly contratId = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = params.get('id');
        return id ? Number(id) : null;
      }),
    ),
    { initialValue: null },
  );

  readonly contratResource = httpResource<Contrat | null>(
    () => {
      const id = this.contratId();
      return id ? `${this.coreApi}/Contrat/get-one/${id}` : undefined;
    },
    { defaultValue: null },
  );
  readonly contrat = computed(() => this.contratResource.value());

  readonly beneficiaireResource = httpResource<User | null>(
    () => {
      const contrat = this.contrat();
      return contrat ? `${this.coreApi}/User/get-one/${contrat.beneficiaireId}` : undefined;
    },
    { defaultValue: null },
  );
  readonly beneficiaire = computed(() => this.beneficiaireResource.value());

  readonly responsableRhResource = httpResource<User | null>(
    () => {
      const contrat = this.contrat();
      return contrat ? `${this.coreApi}/User/get-one/${contrat.userRhId}` : undefined;
    },
    { defaultValue: null },
  );
  readonly responsableRH = computed(() => this.responsableRhResource.value());

  readonly interventionsResource = httpResource<Intervention[]>(
    () => `${this.legacyApi}/Intervention/get-all`,
    { defaultValue: [] },
  );
  readonly interventions = computed(() => {
    const contrat = this.contrat();
    if (!contrat) {
      return [];
    }
    return (this.interventionsResource.value() ?? []).filter(
      (intervention) => intervention.veloId === contrat.veloId && intervention.isActif,
    );
  });

  readonly amortissementsResource = httpResource<Amortissement[]>(
    () => `${this.legacyApi}/Amortissement/get-all`,
    { defaultValue: [] },
  );
  readonly amortissements = computed(() => {
    const contrat = this.contrat();
    if (!contrat) {
      return [];
    }
    return (this.amortissementsResource.value() ?? []).filter(
      (amortissement) => amortissement.veloId === contrat.veloId && amortissement.isActif,
    );
  });

  readonly documentsResource = httpResource<Document[]>(
    () => {
      const contrat = this.contrat();
      return contrat?.id ? `${this.legacyApi}/Document/get-by-contrat/${contrat.id}` : undefined;
    },
    { defaultValue: [] },
  );
  readonly documents = computed(() => this.documentsResource.value() ?? []);

  readonly loading = computed(
    () =>
      this.contratResource.isLoading() ||
      this.beneficiaireResource.isLoading() ||
      this.responsableRhResource.isLoading() ||
      this.interventionsResource.isLoading() ||
      this.amortissementsResource.isLoading() ||
      this.documentsResource.isLoading(),
  );

  // Mode edition amortissement
  editingAmortissement = false;
  amortissementValues: number[] = [];
  currentAmortissement: Amortissement | null = null;

  // Mode edition intervention
  editingIntervention = false;
  interventionFormMode: 'create' | 'edit' = 'create';
  currentIntervention: Partial<Intervention> = {};
  interventionDate: Date | null = null;

  private readonly contratErrorShown = signal(false);
  private readonly contratErrorEffect = effect(() => {
    const error = this.contratResource.error();
    if (error && !this.contratErrorShown()) {
      this.errorService.showError('Impossible de charger le contrat');
      this.contratErrorShown.set(true);
      this.router.navigate(['/admin/contrats']);
    }
    if (!error && this.contratErrorShown()) {
      this.contratErrorShown.set(false);
    }
  });

  private readonly interventionsErrorEffect = effect(() => {
    const error = this.interventionsResource.error();
    if (error) {
      this.errorService.showError('Impossible de charger les interventions');
    }
  });

  private readonly amortissementsErrorEffect = effect(() => {
    const error = this.amortissementsResource.error();
    if (error) {
      this.errorService.showError('Impossible de charger les amortissements');
    }
  });

  private readonly documentsErrorEffect = effect(() => {
    const error = this.documentsResource.error();
    if (error) {
      this.errorService.showError('Impossible de charger les documents');
    }
  });

  goBack(): void {
    this.router.navigate(['/admin/contrats']);
  }

  getStatutLabel(statut: StatutContrat): string {
    return this.contratService.getStatutLabel(statut);
  }

  getStatutSeverity(statut: StatutContrat): 'success' | 'secondary' | 'danger' {
    switch (statut) {
      case StatutContrat.EnCours:
        return 'success';
      case StatutContrat.Resilie:
        return 'danger';
      default:
        return 'secondary';
    }
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

  // ========== DOCUMENTS ==========
  downloadDocument(doc: Document): void {
    this.documentService.downloadDocument(doc);
  }

  deleteDocument(doc: Document): void {
    if (confirm(`Voulez-vous vraiment supprimer "${doc.nomFichier}" ?`)) {
      this.documentService.delete(doc.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Document supprimé',
          });
          this.documentsResource.reload();
        },
        error: () => {
          this.errorService.showError('Impossible de supprimer le document');
        },
      });
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    const contrat = this.contrat();
    if (!file || !contrat) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];

      const newDoc: Document = {
        id: 0,
        contratId: contrat.id!,
        fichier: base64,
        nomFichier: file.name,
        typeFichier: file.name.split('.').pop() || 'pdf',
        isActif: true,
      };

      this.documentService.create(newDoc).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Document ajouté',
          });
          this.documentsResource.reload();
        },
        error: () => {
          this.errorService.showError("Impossible d'ajouter le document");
        },
      });
    };
    // Ne marche pas avec un fichier trop grand
    reader.readAsDataURL(file);
  }

  // ========== INTERVENTIONS ==========
  onAddIntervention(): void {
    const contrat = this.contrat();
    if (!contrat) {
      return;
    }
    this.interventionFormMode = 'create';
    this.editingIntervention = true;
    this.currentIntervention = {
      typeIntervention: '',
      description: '',
      cout: 0,
      veloId: contrat.veloId,
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
    const contrat = this.contrat();
    if (
      !contrat ||
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
      veloId: contrat.veloId,
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
          summary: 'Succès',
          detail:
            this.interventionFormMode === 'create'
              ? 'Intervention créée'
              : 'Intervention modifiée',
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
            summary: 'Succès',
            detail: 'Intervention supprimée',
          });
          this.interventionsResource.reload();
        },
        error: () => {
          this.errorService.showError("Impossible de supprimer l'intervention");
        },
      });
    }
  }

  // ========== CONTRAT ==========
  onEditContrat(): void {
    const contrat = this.contrat();
    if (contrat) {
      this.router.navigate(['/admin/contrats/edit', contrat.id]);
    }
  }

  // ========== AMORTISSEMENT ==========
  onEditAmortissement(amort: Amortissement): void {
    this.editingAmortissement = true;
    this.currentAmortissement = amort;
    const monthlyValue = (amort.valeurInit - amort.valeurResiduelleFinale) / amort.dureeMois;
    this.amortissementValues = Array(amort.dureeMois).fill(monthlyValue);
  }

  onCancelEditAmortissement(): void {
    this.editingAmortissement = false;
    this.currentAmortissement = null;
    this.amortissementValues = [];
  }

  onSaveAmortissement(): void {
    if (!this.currentAmortissement) {
      return;
    }

    const totalAmortissement = this.amortissementValues.reduce((sum, val) => sum + val, 0);
    const newValeurResiduelle = this.currentAmortissement.valeurInit - totalAmortissement;

    const updatedAmort: Amortissement = {
      ...this.currentAmortissement,
      valeurResiduelleFinale: newValeurResiduelle,
    };

    this.amortissementService.update(updatedAmort).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Amortissement mis à jour',
        });
        this.editingAmortissement = false;
        this.amortissementsResource.reload();
      },
      error: () => {
        this.errorService.showError("Impossible de mettre à jour l'amortissement");
      },
    });
  }

  getTotalAmortissement(): number {
    return this.amortissementValues.reduce((sum, val) => sum + (val || 0), 0);
  }
}
