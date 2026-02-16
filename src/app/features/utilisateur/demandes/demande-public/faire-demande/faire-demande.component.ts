import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../../../core/services/auth.service';
import { Organisation, OrganisationService } from '../../../../../core/services/organisation.service';
import { ErrorService } from '../../../../../core/services/error.service';

@Component({
  selector: 'app-faire-demande',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule],
  templateUrl: './faire-demande.component.html',
  styleUrls: ['./faire-demande.component.scss']
})
export class FaireDemandeComponent implements OnInit {
  organisation: Organisation | null = null;
  organisations: Organisation[] = [];
  loading = false;
  currentUserEmail = '';
  isAuthenticated = false;
  supportEmail = 'contact@mojovelo.be';

  private readonly authService = inject(AuthService);
  private readonly organisationService = inject(OrganisationService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAuthenticated = !!user;
    this.currentUserEmail = user?.email ?? '';
    this.loadOrganisations();
  }

  goToMesDemandes(): void {
    this.router.navigate(['/user/demandes']);
  }

  get organisationOptions(): Organisation[] {
    return this.organisations
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  onPrimaryAction(): void {
    if (this.isAuthenticated) {
      this.goToCreateLamdaUser();
      return;
    }
    this.goToCreateLamdaUser();
  }

  goToCreateLamdaUser(): void {
    const queryParams: Record<string, string> = {};
    if (this.organisation) {
      queryParams['organisationId'] = String(this.organisation.id);
      queryParams['organisationName'] = this.organisation.name;
      if (this.organisation.logoUrl) {
        queryParams['organisationLogoUrl'] = this.organisation.logoUrl;
      }
    }
    this.router.navigate(['/create-lamda-user'], { queryParams });
  }

  get supportMailto(): string {
    const subject = encodeURIComponent('Demande ajout de ma societe');
    const body = encodeURIComponent(
      'Bonjour,\n\nMa societe n\'apparait pas dans la liste. Pouvez-vous l\'ajouter ?\n\nMerci.',
    );
    return `mailto:${this.supportEmail}?subject=${subject}&body=${body}`;
  }

  private loadOrganisations(): void {
    this.loading = true;
    this.organisationService.getAll().subscribe({
      next: (organisations) => {
        this.organisations = organisations;
        if (this.isAuthenticated && this.currentUserEmail) {
          this.organisationService.resolveByEmailOrDomain(this.currentUserEmail).subscribe({
            next: (resolved) => {
              if (resolved) {
                this.organisation =
                  this.organisations.find((org) => org.id === resolved.id) ?? resolved;
              }
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            },
          });
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
        this.errorService.showError('Impossible de detecter la compagnie');
      }
    });
  }
}
