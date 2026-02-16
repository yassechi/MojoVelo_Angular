import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-utilisateur-choix-parcours',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './utilisateur-choix-parcours.component.html',
  styleUrls: ['./utilisateur-choix-parcours.component.scss']
})
export class ChoixParcoursUtilisateurComponent implements OnInit {
  firstName = '';
  lastName = '';
  organisationName = '';
  organisationLogoUrl: string | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.firstName = params['firstName'] || '';
      this.lastName = params['lastName'] || '';
      this.organisationName = params['organisationName'] || '';
      this.organisationLogoUrl = params['organisationLogoUrl'] || null;
    });
  }

  goToQuestionnaire(): void {
    this.router.navigate(['/questionnaire-guide'], { queryParams: this.buildQueryParams() });
  }

  goToCatalogue(): void {
    this.router.navigate(['/catalogue-velos'], { queryParams: this.buildQueryParams() });
  }

  private buildQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.firstName) {
      params['firstName'] = this.firstName;
    }
    if (this.lastName) {
      params['lastName'] = this.lastName;
    }
    if (this.organisationName) {
      params['organisationName'] = this.organisationName;
    }
    if (this.organisationLogoUrl) {
      params['organisationLogoUrl'] = this.organisationLogoUrl;
    }
    return params;
  }
}
