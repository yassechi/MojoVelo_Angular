import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-compagnie-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './admin-compagnie-detail.component.html',
  styleUrls: ['./admin-compagnie-detail.component.scss'],
})
export class CompagnieDetailComponent implements OnInit {
  private readonly organisationService = inject(OrganisationService);
  private readonly errorService = inject(ErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  // private readonly primeMessageService = inject(this.primeMessageService);

  organisation: Organisation | null = null;
  organisationId: number | null = null;
  loading = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.goBack();
        return;
      }
      this.organisationId = Number(id);
      this.loadOrganisation(Number(id));
    });
  }

  loadOrganisation(id: number): void {
    this.loading = true;
    this.organisationService.getOne(id).subscribe({
      next: (organisation) => {
        this.organisation = organisation;
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger la compagnie');
        this.loading = false;
        this.goBack();
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/compagnies']);
  }

  goEdit(): void {
    if (!this.organisationId) {
      return;
    }
    this.router.navigate([`/admin/compagnies/${this.organisationId}/edit`]);
  }
}
