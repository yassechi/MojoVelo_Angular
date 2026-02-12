import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContratService, Contrat, StatutContrat } from '../../../core/services/contrat.service';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-user-contrats',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './user-contrats.component.html',
  styleUrls: ['./user-contrats.component.scss'],
})
export class ContratsComponent implements OnInit {
  contrats: Contrat[] = [];
  loading = false;
  users: User[] = [];
  currentUserId: string | null = null;

  constructor(
    private contratService: ContratService,
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserId();
    this.loadContrats();
    this.loadUsers();
  }

  loadCurrentUserId(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id || null;
    }
  }

  loadContrats(): void {
    this.loading = true;
    this.contratService.getAll().subscribe({
      next: (data) => {
        // ✅ Filtrer uniquement les contrats de l'utilisateur connecté
        if (this.currentUserId) {
          this.contrats = data.filter(c => c.beneficiaireId === this.currentUserId);
        } else {
          this.contrats = [];
        }
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

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
      }
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

  getUserFullName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  }
}
