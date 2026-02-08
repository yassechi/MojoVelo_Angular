import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: any;
  userRole: number = 3;
  roleName: string = '';

  stats = {
    compagnies: 0,
    employes: 0,
    contrats: 0,
    demandes: 0
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.userRole = user.role || 3;
        this.setRoleName();
      }
    });
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
}
