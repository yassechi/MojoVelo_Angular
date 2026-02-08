import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganisationService, Organisation } from '../../core/services/organisation.service';
import { CompagnieFormDialogComponent } from './compagnie-form-dialog/compagnie-form-dialog';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-compagnies',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    CompagnieFormDialogComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-compagnies.component.html',
  styleUrls: ['./admin-compagnies.component.scss']
})
export class AdminCompagniesComponent implements OnInit {
  organisations: Organisation[] = [];
  loading = false;
  dialogVisible = false;
  selectedOrganisation: Organisation | null = null;

  constructor(
    private organisationService: OrganisationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadOrganisations();
  }

  loadOrganisations(): void {
    this.loading = true;
    this.organisationService.getAll().subscribe({
      next: (data) => {
        this.organisations = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des organisations', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les organisations'
        });
        this.loading = false;
      }
    });
  }

  onCreate(): void {
    this.selectedOrganisation = null;
    this.dialogVisible = true;
  }

  onEdit(organisation: Organisation): void {
    this.selectedOrganisation = organisation;
    this.dialogVisible = true;
  }

  onDelete(organisation: Organisation): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer "${organisation.name}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.organisationService.delete(organisation.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Compagnie supprimée'
            });
            this.loadOrganisations();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de supprimer la compagnie'
            });
          }
        });
      }
    });
  }

  onSave(): void {
    this.loadOrganisations();
  }
}
