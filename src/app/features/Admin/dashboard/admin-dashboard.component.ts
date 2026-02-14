import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, User } from '../../../core/services/user.service';
import { DemandeService, Demande, DemandeStatus } from '../../../core/services/demande.service';
import { ContratService, Contrat, StatutContrat } from '../../../core/services/contrat.service';
import { BikeCatalogService, BikeItem } from '../../../core/services/bike-catalog.service';

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
    satisfactionRate: 0,
  };

  bikeTypeChartData: any;
  barChartOptions: any;
  activityFeed: Array<{ title: string; detail: string; time: string }> = [];

  private demandes: Demande[] = [];
  private contrats: Contrat[] = [];
  private bikes: BikeItem[] = [];
  private users: User[] = [];

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private demandeService = inject(DemandeService);
  private contratService = inject(ContratService);
  private bikeCatalogService = inject(BikeCatalogService);

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      if (user) {
        this.currentUser = user;
      }
    });

    this.initCharts();
    this.loadUsers();
    this.loadDemandes();
    this.loadContrats();
    this.loadBikes();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.updateActivityFeed();
      },
    });
  }

  loadDemandes(): void {
    this.demandeService.getAll().subscribe({
      next: (demandes) => {
        this.demandes = demandes;
        this.updateStats();
        this.updateBikeTypeChart();
        this.updateActivityFeed();
      },
    });
  }

  loadContrats(): void {
    this.contratService.getAll().subscribe({
      next: (contrats) => {
        this.contrats = contrats;
        this.updateStats();
        this.updateActivityFeed();
      },
    });
  }

  loadBikes(): void {
    this.bikeCatalogService.getBikes().subscribe({
      next: (data) => {
        this.bikes = data.items;
        this.updateBikeTypeChart();
      },
    });
  }

  updateStats(): void {
    const totalDemandes = this.demandes.length;
    const valides = this.demandes.filter((d) => d.status === DemandeStatus.Valide).length;

    this.stats.pendingDemandes = this.demandes.filter(
      (d) => d.status === DemandeStatus.AttenteComagnie,
    ).length;
    this.stats.activeContrats = this.contrats.filter(
      (c) => c.statutContrat === StatutContrat.EnCours,
    ).length;
    this.stats.budgetTotal = this.contrats.reduce((sum, contrat) => {
      const duree = contrat.duree || 36;
      return sum + (contrat.loyerMensuelHT || 0) * duree;
    }, 0);
    this.stats.satisfactionRate = totalDemandes
      ? Math.round((valides / totalDemandes) * 100)
      : 0;
  }

  updateBikeTypeChart(): void {
    const typeCounts = new Map<string, number>();
    this.demandes.forEach((demande) => {
      const type = this.getBikeType(demande.idVelo) || 'Autre';
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    });

    const sorted = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([label]) => label);
    const data = sorted.map(([, value]) => value);

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

  updateActivityFeed(): void {
    const items: Array<{ title: string; detail: string; time: string }> = [];

    const recentDemandes = [...this.demandes]
      .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
      .slice(0, 3);

    recentDemandes.forEach((demande) => {
      items.push({
        title: `Demande #${demande.id ?? '-'}`,
        detail: `${this.getUserName(demande.idUser)} - ${this.getBikeTitle(demande.idVelo)}`,
        time: demande.createdAt ? this.formatDate(demande.createdAt) : 'En cours',
      });
    });

    const recentContrats = [...this.contrats]
      .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())
      .slice(0, 2);

    recentContrats.forEach((contrat) => {
      items.push({
        title: `Contrat ${contrat.ref}`,
        detail: `${this.getUserName(contrat.beneficiaireId)} - ${this.getBikeTitle(contrat.veloId)}`,
        time: this.formatDate(contrat.dateDebut),
      });
    });

    this.activityFeed = items;
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
  }

  getBikeType(veloId: number): string {
    const bike = this.bikes.find((item) => item.id === veloId);
    return bike?.acf?.type ?? '';
  }

  getBikeTitle(veloId: number): string {
    const bike = this.bikes.find((item) => item.id === veloId);
    return bike?.title?.rendered ?? `#${veloId}`;
  }

  getUserName(userId: string): string {
    const user = this.users.find((item) => item.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
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
