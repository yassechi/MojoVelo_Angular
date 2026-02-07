import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User, UserRole } from '../../core/services/user.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EmployeFormDialogComponent } from './employe-form-dialog/employe-form-dialog';

@Component({
  selector: 'app-employes',
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
    EmployeFormDialogComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './employes.component.html',
  styleUrls: ['./employes.component.scss']
})
export class EmployesComponent implements OnInit {
  users: User[] = [];
  loading = false;
  dialogVisible = false;  // ← Ajouté
  selectedUser: User | null = null;  // ← Ajouté

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les employés'
        });
        this.loading = false;
      }
    });
  }

  onCreate(): void {  // ← Modifié
    this.selectedUser = null;
    this.dialogVisible = true;
  }

  onEdit(user: User): void {  // ← Modifié
    this.selectedUser = user;
    this.dialogVisible = true;
  }

  onSave(): void {  // ← Ajouté
    this.loadUsers();
  }

  onDelete(user: User): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer "${user.userName}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.userService.delete(user.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Employé supprimé'
            });
            this.loadUsers();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de supprimer l\'employé'
            });
          }
        });
      }
    });
  }

  getRoleLabel(role: UserRole): string {
    return this.userService.getRoleLabel(role);
  }

  getRoleSeverity(role: UserRole): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    switch (role) {
      case UserRole.Admin:
        return 'danger';
      case UserRole.Manager:
        return 'info';
      case UserRole.User:
        return 'success';
      default:
        return 'secondary';
    }
  }
}
