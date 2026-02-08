import { Component, OnInit } from '@angular/core';
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
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
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

  constructor(
    private authService: AuthService,
    private demandeService: DemandeService,
    private contratService: ContratService
  ) {}

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
      labels: ['En cours', 'En attente', 'Attente Compagnie', 'Validé'],
      datasets: [{
        data: [statusCount.encours, statusCount.attente, statusCount.attenteCompagnie, statusCount.valide],
        backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444', '#10B981']
      }]
    };
  }

  updateContratsChart(contrats: any[]): void {
    const statusCount = {
      enCours: contrats.filter(c => c.statutContrat === 0).length,
      termine: contrats.filter(c => c.statutContrat === 1).length
    };

    this.contratsChartData = {
      labels: ['En cours', 'Terminé'],
      datasets: [{
        data: [statusCount.enCours, statusCount.termine],
        backgroundColor: ['#10B981', '#6B7280']
      }]
    };
  }

  initChartOptions(): void {
    this.chartOptions = {
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };
  }
}
