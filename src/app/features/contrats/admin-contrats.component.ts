import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContratService, Contrat, StatutContrat } from '../../core/services/contrat.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ContratFormDialogComponent } from './contrat-form-dialog/contrat-form-dialog';
import { UserService, User } from '../../core/services/user.service';

@Component({
  selector: 'app-contrats',
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
    ContratFormDialogComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-contrats.component.html',
  styleUrls: ['./admin-contrats.component.scss'],
})
export class AdminContratsComponent implements OnInit {
  contrats: Contrat[] = [];
  loading = false;
  dialogVisible = false;
  selectedContrat: Contrat | null = null;
  users: User[] = [];  // ← Ajouté

  constructor(
    private contratService: ContratService,
    private userService: UserService,  // ← Ajouté
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadContrats();
    this.loadUsers();  // ← Ajouté
  }

  loadContrats(): void {
    this.loading = true;
    this.contratService.getAll().subscribe({
      next: (data) => {
        this.contrats = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des contrats', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les contrats',
        });
        this.loading = false;
      },
    });
  }

  loadUsers(): void {  // ← Nouvelle méthode
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
      }
    });
  }

  onCreate(): void {
    this.selectedContrat = null;
    this.dialogVisible = true;
  }

  onEdit(contrat: Contrat): void {
    this.selectedContrat = contrat;
    this.dialogVisible = true;
  }

  onSave(): void {
    this.loadContrats();
  }

  onDelete(contrat: Contrat): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer le contrat "${contrat.ref}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.contratService.delete(contrat.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Contrat supprimé',
            });
            this.loadContrats();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de supprimer le contrat',
            });
          },
        });
      },
    });
  }

  getStatutLabel(statut: StatutContrat): string {
    return this.contratService.getStatutLabel(statut);
  }

  getStatutSeverity(statut: StatutContrat): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    switch (statut) {
      case StatutContrat.EnCours:
        return 'success';
      case StatutContrat.Termine:
        return 'secondary';
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

  getUserFullName(userId: string): string {  // ← Nouvelle méthode
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  }
}
