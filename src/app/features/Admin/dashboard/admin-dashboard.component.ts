import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DemandeService, DemandeStatus } from '../../../core/services/demande.service';
import { ContratService, StatutContrat } from '../../../core/services/contrat.service';

import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  currentUser: any;

  stats = {
    pendingDemandes: 0,
    activeContrats: 0,
    budgetTotal: 0,
  };

  bikeTypeChartData: any;
  barChartOptions: any;
  demandeStatusChartData: any;
  contratStatusChartData: any;
  statusChartOptions: any;
  activityFeed: Array<{ title: string; detail: string; time: string }> = [];

  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private demandeService = inject(DemandeService);
  private contratService = inject(ContratService);

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      if (user) {
        this.currentUser = user;
      }
    });

    this.initCharts();
    this.loadDashboard();
    this.loadStatusCharts();
  }

  loadDashboard(): void {
    this.dashboardService.getAdminDashboard().subscribe({
      next: (data) => {
        this.stats = {
          pendingDemandes: data.pendingDemandes,
          activeContrats: data.activeContrats,
          budgetTotal: data.budgetTotal,
        };
        this.activityFeed = data.activityFeed ?? [];
        this.updateBikeTypeChart(data.bikeTypeCounts ?? []);
      },
    });
  }

  updateBikeTypeChart(counts: Array<{ label: string; value: number }>): void {
    const labels = counts.map((item) => item.label);
    const data = counts.map((item) => item.value);

    this.bikeTypeChartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: '#0F766E',
          borderRadius: 8,
          barThickness: 18,
        },
      ],
    };
  }

  initCharts(): void {
    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleFont: { family: 'Space Grotesk', size: 13, weight: '700' },
          bodyFont: { family: 'Manrope', size: 12, weight: '600' },
          padding: 12,
          cornerRadius: 12,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B', font: { family: 'Manrope' } },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#334155', font: { family: 'Manrope', weight: '600' } },
        },
      },
    };

    this.statusChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#475569',
            font: { family: 'Manrope', weight: '600' },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleFont: { family: 'Space Grotesk', size: 13, weight: '700' },
          bodyFont: { family: 'Manrope', size: 12, weight: '600' },
          padding: 12,
          cornerRadius: 12,
        },
      },
    };
  }

  private loadStatusCharts(): void {
    this.demandeService.getAll().subscribe({
      next: (demandes) => {
        const statuses = [
          DemandeStatus.Encours,
          DemandeStatus.AttenteComagnie,
          DemandeStatus.Finalisation,
          DemandeStatus.Valide,
          DemandeStatus.Refuse,
        ];
        const labels = statuses.map((status) => this.demandeService.getStatusLabel(status));
        const counts = statuses.map(
          (status) => demandes.filter((d) => d.status === status).length,
        );

        this.demandeStatusChartData = {
          labels,
          datasets: [
            {
              data: counts,
              backgroundColor: ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'],
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        };
      },
    });

    this.contratService.getAll().subscribe({
      next: (contrats) => {
        const statuses = [
          StatutContrat.EnCours,
          StatutContrat.Termine,
          StatutContrat.Resilie,
        ];
        const labels = statuses.map((status) => this.contratService.getStatutLabel(status));
        const counts = statuses.map(
          (status) => contrats.filter((c) => c.statutContrat === status).length,
        );

        this.contratStatusChartData = {
          labels,
          datasets: [
            {
              data: counts,
              backgroundColor: ['#bbf7d0', '#4ade80', '#16a34a'],
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        };
      },
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
