import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';

import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ChartModule
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  currentUserOrgId: number | null = null;

  // Statistiques
  totalEmployes = 0;
  totalDemandes = 0;
  totalContrats = 0;
  demandesEnCours = 0;

  // Graphiques
  demandesChartData: any;
  contratsChartData: any;
  chartOptions: any;

  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  ngOnInit(): void {
    this.loadCurrentUser();
    this.initChartOptions();
    this.loadStatistics();
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) return;

    if (this.currentUser.organisationId) {
      this.currentUserOrgId = typeof this.currentUser.organisationId === 'object'
        ? (this.currentUser.organisationId as any).id
        : this.currentUser.organisationId;
    }
  }

  loadStatistics(): void {
    if (!this.currentUserOrgId) {
      return;
    }

    this.dashboardService.getManagerDashboard(this.currentUserOrgId).subscribe({
      next: (data) => {
        this.totalEmployes = data.totalEmployes;
        this.totalDemandes = data.totalDemandes;
        this.totalContrats = data.totalContrats;
        this.demandesEnCours = data.demandesEnCours;
        this.updateDemandesChartFromCounts(data);
        this.updateContratsChartFromCounts(data);
      },
    });
  }

  updateDemandesChartFromCounts(data: any): void {
    const statusCount = {
      encours: data.demandesEnCours ?? 0,
      attente: data.demandesAttente ?? 0,
      attenteCompagnie: data.demandesAttenteCompagnie ?? 0,
      valide: data.demandesValide ?? 0
    };

    this.demandesChartData = {
      labels: ['En cours', 'En attente', 'Attente Compagnie', 'Valide'],
      datasets: [{
        data: [statusCount.encours, statusCount.attente, statusCount.attenteCompagnie, statusCount.valide],
        backgroundColor: ['#0F766E', '#F59E0B', '#F97316', '#84CC16'],
        hoverBackgroundColor: ['#0B5D56', '#D97706', '#EA580C', '#65A30D']
      }]
    };
  }

  updateContratsChartFromCounts(data: any): void {
    const statusCount = {
      enCours: data.contratsEnCours ?? 0,
      termine: data.contratsTermine ?? 0
    };

    this.contratsChartData = {
      labels: ['En cours', 'Termine'],
      datasets: [{
        data: [statusCount.enCours, statusCount.termine],
        backgroundColor: ['#0F766E', '#94A3B8'],
        hoverBackgroundColor: ['#0B5D56', '#64748B']
      }]
    };
  }

  initChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      layout: {
        padding: 8
      },
      elements: {
        arc: {
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 8
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            boxHeight: 10,
            padding: 16,
            color: '#334155',
            font: {
              family: 'Manrope',
              size: 12,
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleFont: {
            family: 'Space Grotesk',
            size: 13,
            weight: '700'
          },
          bodyFont: {
            family: 'Manrope',
            size: 12,
            weight: '600'
          },
          padding: 12,
          cornerRadius: 12
        }
      }
    };
  }
}

