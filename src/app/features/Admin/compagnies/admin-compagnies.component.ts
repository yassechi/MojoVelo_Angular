import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Organisation, OrganisationService } from '../../../core/services/organisation.service';
import { ErrorService } from '../../../core/services/error.service';

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
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-compagnies.component.html',
  styleUrls: ['./admin-compagnies.component.scss']
})
export class AdminCompagniesComponent implements OnInit {
  organisations: Organisation[] = [];
  loading = false;

  private readonly organisationService = inject(OrganisationService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

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
        this.errorService.showError('Impossible de charger les organisations');
        this.loading = false;
      }
    });
  }

  onCreate(): void {
    this.router.navigate(['/admin/compagnies/new']);
  }

  onView(organisation: Organisation): void {
    this.router.navigate(['/admin/compagnies', organisation.id]);
  }

  onEdit(organisation: Organisation): void {
    this.router.navigate(['/admin/compagnies', organisation.id, 'edit']);
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
            this.errorService.showError('Impossible de supprimer la compagnie');
          }
        });
      }
    });
  }

}
