import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { DemandeService } from '../../../core/services/demande.service';
import { ContratService, StatutContrat } from '../../../core/services/contrat.service';

import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ChartModule
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  currentUserId: string | null = null;

  // Statistiques
  totalDemandes = 0;
  totalContrats = 0;
  demandesEnCours = 0;
  contratsActifs = 0;

  // Graphiques
  demandesChartData: any;
  contratsChartData: any;
  chartOptions: any;

  private authService = inject(AuthService);
  private demandeService = inject(DemandeService);
  private contratService = inject(ContratService);

  ngOnInit(): void {
    this.loadCurrentUser();
    this.initChartOptions();
    this.loadStatistics();
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.currentUserId = this.currentUser.id;
    }
  }

  loadStatistics(): void {
    if (!this.currentUserId) return;

    // Charger demandes de l'utilisateur
    this.demandeService.getAll().subscribe({
      next: (demandes) => {
        const userDemandes = demandes.filter(d => d.idUser === this.currentUserId);
        this.totalDemandes = userDemandes.length;
        this.demandesEnCours = userDemandes.filter(d => d.status === 1).length;
        this.updateDemandesChart(userDemandes);
      }
    });

    // Charger contrats de l'utilisateur
    this.contratService.getAll().subscribe({
      next: (contrats) => {
        const userContrats = contrats.filter(c => c.beneficiaireId === this.currentUserId);
        this.totalContrats = userContrats.length;
        this.contratsActifs = userContrats.filter(c => c.statutContrat === StatutContrat.EnCours).length;
        this.updateContratsChart(userContrats);
      }
    });
  }

  updateDemandesChart(demandes: any[]): void {
    const statusCount = {
      encours: demandes.filter(d => d.status === 1).length,
      attente: demandes.filter(d => d.status === 2).length,
      attenteCompagnie: demandes.filter(d => d.status === 3).length,
      valide: demandes.filter(d => d.status === 4).length
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

  updateContratsChart(contrats: any[]): void {
    const statusCount = {
      enCours: contrats.filter(c => c.statutContrat === 0).length,
      termine: contrats.filter(c => c.statutContrat === 1).length
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

