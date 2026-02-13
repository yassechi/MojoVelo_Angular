import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Demande, DemandeService, DemandeStatus } from '../../../core/services/demande.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './admin-demande-detail.component.html',
  styleUrls: ['./admin-demande-detail.component.scss'],
})
export class DemandeDetailComponent implements OnInit {
  private readonly demandeService = inject(DemandeService);
  private readonly errorService = inject(ErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  demande: Demande | null = null;
  demandeId: number | null = null;
  loading = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.goBack();
        return;
      }
      this.demandeId = Number(id);
      this.loadDemande(this.demandeId);
    });
  }

  loadDemande(id: number): void {
    this.loading = true;
    this.demandeService.getOne(id).subscribe({
      next: (demande) => {
        this.demande = demande;
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger la demande');
        this.loading = false;
        this.goBack();
      },
    });
  }

  getStatusLabel(status: DemandeStatus): string {
    return this.demandeService.getStatusLabel(status);
  }

  getStatusSeverity(
    status: DemandeStatus,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(status);
  }

  getActifLabel(demande: Demande): string {
    if (demande.isActif === undefined || demande.isActif === null) {
      return '—';
    }
    return demande.isActif ? 'Oui' : 'Non';
  }

  goBack(): void {
    this.router.navigate([this.getBasePath()]);
  }

  goEdit(): void {
    if (!this.demandeId) {
      return;
    }
    this.router.navigate([`${this.getBasePath()}/${this.demandeId}/edit`]);
  }

  private getBasePath(): string {
    const url = this.router.url;
    if (url.startsWith('/manager/')) {
      return '/manager/demandes';
    }
    if (url.startsWith('/user/')) {
      return '/user/demandes';
    }
    return '/admin/demandes';
  }
}
