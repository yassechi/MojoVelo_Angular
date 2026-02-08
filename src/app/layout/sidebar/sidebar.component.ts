import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PanelMenuModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() visible = true;

  menuItems: MenuItem[] = [];
  userRole: number = 3;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userRole = user.role || 3;
        this.initMenu();
      }
    });
  }

  initMenu(): void {
    // Menu Admin (Role = 1)
    if (this.userRole === 1) {
      this.menuItems = [
        {
          label: 'Dashboard',
          icon: 'pi pi-home',
          routerLink: ['/admin/dashboard']
        },
        {
          label: 'Compagnies',
          icon: 'pi pi-building',
          routerLink: ['/admin/compagnies']
        },
        {
          label: 'Employés',
          icon: 'pi pi-users',
          routerLink: ['/admin/employes']
        },
        {
          label: 'Contrats',
          icon: 'pi pi-file',
          routerLink: ['/admin/contrats']
        },
        {
          label: 'Demandes',
          icon: 'pi pi-inbox',
          routerLink: ['/admin/demandes']
        },
        {
          label: 'Paramètres',
          icon: 'pi pi-cog',
          routerLink: ['/admin/parametres']
        }
      ];
    }
    // Menu Manager (Role = 2)
    else if (this.userRole === 2) {
      this.menuItems = [
        {
          label: 'Dashboard',
          icon: 'pi pi-home',
          routerLink: ['/manager/dashboard']
        },
        {
          label: 'Employés',
          icon: 'pi pi-users',
          routerLink: ['/manager/employes']
        },
        {
          label: 'Contrats',
          icon: 'pi pi-file',
          routerLink: ['/manager/contrats']
        },
        {
          label: 'Demandes',
          icon: 'pi pi-inbox',
          routerLink: ['/manager/demandes']
        },
        {
          label: 'Paramètres',
          icon: 'pi pi-cog',
          routerLink: ['/manager/parametres']
        }
      ];
    }
    // Menu Utilisateur (Role = 3)
    else {
      this.menuItems = [
        {
          label: 'Dashboard',
          icon: 'pi pi-home',
          routerLink: ['/user/dashboard']
        },
        {
          label: 'Mes Contrats',
          icon: 'pi pi-file',
          routerLink: ['/user/contrats']
        },
        {
          label: 'Mes Demandes',
          icon: 'pi pi-inbox',
          routerLink: ['/user/demandes']
        },
        {
          label: 'Paramètres',
          icon: 'pi pi-cog',
          routerLink: ['/user/parametres']
        }
      ];
    }
  }
}
