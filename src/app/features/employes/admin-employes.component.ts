import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User, UserRole } from '../../core/services/user.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { EmployeFormDialogComponent } from './employe-form-dialog/employe-form-dialog';

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    EmployeFormDialogComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-employes.component.html',
  styleUrls: ['./admin-employes.component.scss']
})
export class AdminEmployesComponent implements OnInit {
  users: User[] = [];
  loading = false;
  dialogVisible = false;
  selectedUser: User | null = null;

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
      error: () => {
        this.loading = false;
      }
    });
  }

  openDialog(user?: User): void {
    this.selectedUser = user || null;
    this.dialogVisible = true;
  }

  onDialogSave(): void {
    this.loadUsers();
  }

  onDelete(user: User): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer cet utilisateur ?`,
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
              detail: 'Utilisateur supprimé avec succès'
            });
            this.loadUsers();
          },
          error: () => {
            // L'intercepteur gère l'erreur
          }
        });
      }
    });
  }

  getRoleLabel(role: UserRole): string {
    return this.userService.getRoleLabel(role);
  }

  getSeverity(isActif: boolean): 'success' | 'danger' {
    return isActif ? 'success' : 'danger';
  }

  getStatusLabel(isActif: boolean): string {
    return isActif ? 'Actif' : 'Inactif';
  }
}
