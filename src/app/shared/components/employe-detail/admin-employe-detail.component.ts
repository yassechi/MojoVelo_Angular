import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { User, UserRole, UserService } from '../../../core/services/user.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-employe-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './admin-employe-detail.component.html',
  styleUrls: ['./admin-employe-detail.component.scss'],
})
export class EmployeDetailComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly errorService = inject(ErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  user: User | null = null;
  userId: string | null = null;
  loading = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.goBack();
        return;
      }
      this.userId = id;
      this.loadUser(id);
    });
  }

  loadUser(id: string): void {
    this.loading = true;
    this.userService.getOne(id).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: () => {
        this.errorService.showError("Impossible de charger l'employé");
        this.loading = false;
        this.goBack();
      },
    });
  }

  getRoleLabel(role: UserRole): string {
    return this.userService.getRoleLabel(role);
  }

  getRoleSeverity(role: UserRole): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (role) {
      case UserRole.Admin:
        return 'danger';
      case UserRole.Manager:
        return 'warn';
      case UserRole.User:
        return 'info';
      default:
        return 'secondary';
    }
  }

  getOrganisationName(user: User): string {
    if (user.organisationId && typeof user.organisationId === 'object') {
      return user.organisationId.name || 'N/A';
    }
    if (typeof user.organisationId === 'number') {
      return String(user.organisationId);
    }
    return 'N/A';
  }

  goBack(): void {
    this.router.navigate([this.getBasePath()]);
  }

  goEdit(): void {
    if (!this.userId) {
      return;
    }
    this.router.navigate([`${this.getBasePath()}/${this.userId}/edit`]);
  }

  private getBasePath(): string {
    const url = this.router.url;
    if (url.startsWith('/manager/')) {
      return '/manager/employes';
    }
    return '/admin/employes';
  }
}
