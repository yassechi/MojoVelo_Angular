import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { User, UserRole, UserService } from '../../../core/services/user.service';

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
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-employes.component.html',
  styleUrls: ['./admin-employes.component.scss']
})
export class AdminEmployesComponent implements OnInit {
  users: User[] = [];
  loading = false;

  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

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

  onCreate(): void {
    this.router.navigate(['/admin/employes/new']);
  }

  onView(user: User): void {
    if (!user.id) {
      return;
    }
    this.router.navigate(['/admin/employes', user.id]);
  }

  onEdit(user: User): void {
    if (!user.id) {
      return;
    }
    this.router.navigate(['/admin/employes', user.id, 'edit']);
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
