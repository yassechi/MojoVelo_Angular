import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { DemandeService } from '../../../core/services/demande.service';
import { ContratService } from '../../../core/services/contrat.service';
import { OrganisationService } from '../../../core/services/organisation.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ChartModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: any;
  userRole: number = 3;
  roleName: string = '';

  // Statistiques
  stats = {
    compagnies: 0,
    employes: 0,
    contrats: 0,
    demandes: 0,
    demandesEnCours: 0,
    admins: 0,
    managers: 0,
    users: 0
  };

  // Graphiques
  demandesChartData: any;
  contratsChartData: any;
  rolesChartData: any;
  organisationsChartData: any;
  chartOptions: any;

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private demandeService = inject(DemandeService);
  private contratService = inject(ContratService);
  private organisationService = inject(OrganisationService);

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.userRole = user.role || 3;
        this.setRoleName();
      }
    });

    this.initChartOptions();
    this.loadStatistics();
  }

  setRoleName(): void {
    switch (this.userRole) {
      case 1:
        this.roleName = 'Administrateur';
        break;
      case 2:
        this.roleName = 'Manager';
        break;
      case 3:
        this.roleName = 'Utilisateur';
        break;
      default:
        this.roleName = 'Utilisateur';
    }
  }

  loadStatistics(): void {
    // Charger organisations
    this.organisationService.getAll().subscribe({
      next: (orgs) => {
        this.stats.compagnies = orgs.length;
        this.updateOrganisationsChart(orgs);
      }
    });

    // Charger utilisateurs
    this.userService.getAll().subscribe({
      next: (users) => {
        this.stats.employes = users.length;
        this.stats.admins = users.filter(u => u.role === 1).length;
        this.stats.managers = users.filter(u => u.role === 2).length;
        this.stats.users = users.filter(u => u.role === 3).length;
        this.updateRolesChart();
      }
    });

    // Charger demandes
    this.demandeService.getAll().subscribe({
      next: (demandes) => {
        this.stats.demandes = demandes.length;
        this.stats.demandesEnCours = demandes.filter(d => d.status === 1).length;
        this.updateDemandesChart(demandes);
      }
    });

    // Charger contrats
    this.contratService.getAll().subscribe({
      next: (contrats) => {
        this.stats.contrats = contrats.length;
        this.updateContratsChart(contrats);
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

  updateRolesChart(): void {
    this.rolesChartData = {
      labels: ['Admins', 'Managers', 'Utilisateurs'],
      datasets: [{
        data: [this.stats.admins, this.stats.managers, this.stats.users],
        backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6']
      }]
    };
  }

  updateOrganisationsChart(organisations: any[]): void {
    // Top 5 organisations par nombre d'employés
    const orgEmployeeCounts = organisations.map(org => ({
      name: org.name,
      count: 0 // TODO: Compter les employés par organisation
    })).slice(0, 5);

    this.organisationsChartData = {
      labels: orgEmployeeCounts.map(o => o.name),
      datasets: [{
        label: 'Employés',
        data: orgEmployeeCounts.map(o => o.count),
        backgroundColor: '#3B82F6'
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
