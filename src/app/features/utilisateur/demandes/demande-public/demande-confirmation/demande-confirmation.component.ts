import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-demande-confirmation',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './demande-confirmation.component.html',
  styleUrls: ['./demande-confirmation.component.scss'],
})
export class DemandeConfirmationComponent implements OnInit {
  bikeTitle = '';
  bikePrice: number | null = null;
  demandeId: number | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.bikeTitle = params.get('bikeTitle') ?? '';
      const price = params.get('bikePrice');
      this.bikePrice = price ? Number(price) : null;
      const demandeId = params.get('demandeId');
      this.demandeId = demandeId ? Number(demandeId) : null;
    });
  }

  formatCurrency(amount?: number | null): string {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
      return '-';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  goToDemandes(): void {
    this.router.navigate(['/user/demandes']);
  }

  goToCatalogue(): void {
    this.router.navigate(['/catalogue-velos']);
  }
}
