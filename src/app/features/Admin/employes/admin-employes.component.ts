import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { User, UserRole, UserService } from '../../../core/services/user.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    SelectModule,
    InputTextModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-employes.component.html',
  styleUrls: ['./admin-employes.component.scss']
})
export class AdminEmployesComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  searchTerm = '';
  roleFilter: UserRole | 'all' = 'all';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  roleOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Administrateur', value: UserRole.Admin },
    { label: 'Manager', value: UserRole.Manager },
    { label: 'Utilisateur', value: UserRole.User },
  ];

  statusOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Actif', value: 'active' },
    { label: 'Inactif', value: 'inactive' },
  ];

  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private errorService = inject(ErrorService);
  private router = inject(Router);

  ngOnInit(): void {
    this.applyFilters();
  }

  loadUsers(): void {
    this.loading = true;
    const role = this.roleFilter === 'all' ? null : this.roleFilter;
    const isActif =
      this.statusFilter === 'active'
        ? true
        : this.statusFilter === 'inactive'
          ? false
          : null;
    const search = this.searchTerm.trim();

    this.userService
      .getList({
        role: role ?? undefined,
        isActif: isActif ?? undefined,
        search: search ? search : undefined,
      })
      .subscribe({
        next: (data) => {
          this.users = data;
          this.filteredUsers = data;
          this.loading = false;
        },
        error: () => {
          this.errorService.showError('Impossible de charger les employes');
          this.loading = false;
        },
      });
  }

  applyFilters(): void {
    this.loadUsers();
  }

  onCreate(): void {
    this.router.navigate(['/admin/employes/new']);
  }

  onView(user: User): void {
    if (!user.id) {
      this.errorService.showError('ID utilisateur manquant');
      return;
    }
    this.router.navigate(['/admin/employes', user.id]);
  }

  onEdit(user: User): void {
    if (!user.id) {
      this.errorService.showError('ID utilisateur manquant');
      return;
    }
    this.router.navigate(['/admin/employes', user.id, 'edit']);
  }

  onDelete(user: User): void {
    if (!user.id) {
      this.errorService.showError('ID utilisateur manquant');
      return;
    }
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
