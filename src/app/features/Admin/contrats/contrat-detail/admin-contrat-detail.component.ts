import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContratService, Contrat, StatutContrat } from '../../../../core/services/contrat.service';
import { UserService, User } from '../../../../core/services/user.service';
import { InterventionService, Intervention } from '../../../../core/services/intervention.service';
import {
  AmortissementService,
  Amortissement,
} from '../../../../core/services/amortissement.service';
import { DocumentService, Document } from '../../../../core/services/document.service';

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
})
export class ContratDetailComponent implements OnInit {
  contrat: Contrat | null = null;
  loading = false;
  beneficiaire: User | null = null;
  responsableRH: User | null = null;

  interventions: Intervention[] = [];
  amortissements: Amortissement[] = [];
  documents: Document[] = [];

  // Mode édition amortissement
  editingAmortissement = false;
  amortissementValues: number[] = [];
  currentAmortissement: Amortissement | null = null;

  // ✅ NOUVEAU : Mode édition intervention
  editingIntervention = false;
  interventionFormMode: 'create' | 'edit' = 'create';
  currentIntervention: Partial<Intervention> = {};
  interventionDate: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contratService: ContratService,
    private userService: UserService,
    private interventionService: InterventionService,
    private amortissementService: AmortissementService,
    private documentService: DocumentService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadContrat(Number(id));
      }
    });
  }

  loadContrat(id: number): void {
    this.loading = true;
    this.contratService.getOne(id).subscribe({
      next: (data) => {
        this.contrat = data;
        this.loadUsers();
        this.loadInterventions();
        this.loadAmortissements();
        this.loadDocuments();
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger le contrat',
        });
        this.loading = false;
        this.router.navigate(['/admin/contrats']);
      },
    });
  }

  loadUsers(): void {
    if (!this.contrat) return;

    this.userService.getOne(this.contrat.beneficiaireId).subscribe({
      next: (user) => (this.beneficiaire = user),
      error: () => console.error('Erreur chargement bénéficiaire'),
    });

    this.userService.getOne(this.contrat.userRhId).subscribe({
      next: (user) => (this.responsableRH = user),
      error: () => console.error('Erreur chargement responsable RH'),
    });
  }

  loadInterventions(): void {
    if (!this.contrat) return;

    this.interventionService.getAll().subscribe({
      next: (data) => {
        this.interventions = data.filter((i) => i.veloId === this.contrat!.veloId && i.isActif);
      },
      error: () => console.error('Erreur chargement interventions'),
    });
  }

  loadAmortissements(): void {
    if (!this.contrat) return;

    this.amortissementService.getAll().subscribe({
      next: (data) => {
        this.amortissements = data.filter((a) => a.veloId === this.contrat!.veloId && a.isActif);
      },
      error: () => console.error('Erreur chargement amortissements'),
    });
  }

  loadDocuments(): void {
    if (!this.contrat) return;

    this.documentService.getByContrat(this.contrat.id!).subscribe({
      next: (data) => {
        this.documents = data;
      },
      error: () => console.error('Erreur chargement documents'),
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/contrats']);
  }

  getStatutLabel(statut: StatutContrat): string {
    return this.contratService.getStatutLabel(statut);
  }

  getStatutSeverity(statut: StatutContrat): 'success' | 'secondary' {
    return statut === StatutContrat.EnCours ? 'success' : 'secondary';
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
          this.loadDocuments();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de supprimer le document',
          });
        },
      });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.contrat) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];

        const newDoc: Document = {
          id: 0,
          contratId: this.contrat!.id!,
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
            this.loadDocuments();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: "Impossible d'ajouter le document",
            });
          },
        });
      };
      /// Ca ne marche pas avec un fichier trop grand 
      reader.readAsDataURL(file);
    }
  }

  // ========== INTERVENTIONS (NOUVEAU) ==========
  onAddIntervention(): void {
    this.interventionFormMode = 'create';
    this.editingIntervention = true;
    this.currentIntervention = {
      typeIntervention: '',
      description: '',
      cout: 0,
      veloId: this.contrat?.veloId,
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
    if (!this.interventionDate || !this.currentIntervention.typeIntervention || !this.currentIntervention.description) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez remplir tous les champs obligatoires',
      });
      return;
    }

    const intervention: Intervention = {
      id: this.currentIntervention.id || 0,
      typeIntervention: this.currentIntervention.typeIntervention!,
      description: this.currentIntervention.description!,
      dateIntervention: this.interventionDate.toISOString().split('T')[0],
      cout: this.currentIntervention.cout || 0,
      veloId: this.contrat!.veloId,
      isActif: true,
    };

    const saveOperation = this.interventionFormMode === 'create'
      ? this.interventionService.create(intervention)
      : this.interventionService.update(intervention);

    saveOperation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: this.interventionFormMode === 'create' ? 'Intervention créée' : 'Intervention modifiée',
        });
        this.editingIntervention = false;
        this.loadInterventions();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de sauvegarder l\'intervention',
        });
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
          this.loadInterventions();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de supprimer l\'intervention',
          });
        },
      });
    }
  }

  // ========== CONTRAT ==========
  onEditContrat(): void {
    if (this.contrat) {
      this.router.navigate(['/admin/contrats/edit', this.contrat.id]);
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
    if (!this.currentAmortissement) return;

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
        this.loadAmortissements();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: "Impossible de mettre à jour l'amortissement",
        });
      },
    });
  }

  getTotalAmortissement(): number {
    return this.amortissementValues.reduce((sum, val) => sum + (val || 0), 0);
  }
}
