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
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent implements OnInit {
  @Input() visible = true;

  menuItems: MenuItem[] = [];
  userRole: number = 3; // Default: User

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
          routerLink: ['/dashboard']
        },
        {
          label: 'Compagnies',
          icon: 'pi pi-building',
          routerLink: ['/compagnies']
        },
        {
          label: 'Employés',
          icon: 'pi pi-users',
          routerLink: ['/employes']
        },
        {
          label: 'Contrats',
          icon: 'pi pi-file',
          routerLink: ['/contrats']
        },
        {
          label: 'Demandes',
          icon: 'pi pi-inbox',
          routerLink: ['/demandes']
        },
        {
          label: 'Paramètres',
          icon: 'pi pi-cog',
          routerLink: ['/settings']
        }
      ];
    }
    // Menu Compagnie (Role = 2)
    else if (this.userRole === 2) {
      this.menuItems = [
        {
          label: 'Dashboard',
          icon: 'pi pi-home',
          routerLink: ['/dashboard']
        },
        {
          label: 'Employés',
          icon: 'pi pi-users',
          routerLink: ['/employes']
        },
        {
          label: 'Contrats',
          icon: 'pi pi-file',
          routerLink: ['/contrats']
        },
        {
          label: 'Demandes',
          icon: 'pi pi-inbox',
          routerLink: ['/demandes']
        },
        {
          label: 'Paramètres',
          icon: 'pi pi-cog',
          routerLink: ['/settings']
        }
      ];
    }
    // Menu Utilisateur (Role = 3)
    else {
      this.menuItems = [
        {
          label: 'Contrats',
          icon: 'pi pi-file',
          routerLink: ['/contrats']
        },
        {
          label: 'Demandes',
          icon: 'pi pi-inbox',
          routerLink: ['/demandes']
        },
        {
          label: 'Paramètres',
          icon: 'pi pi-cog',
          routerLink: ['/settings']
        }
      ];
    }
  }
}
