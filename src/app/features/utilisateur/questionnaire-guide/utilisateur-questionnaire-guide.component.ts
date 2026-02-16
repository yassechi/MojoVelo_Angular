import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-utilisateur-questionnaire-guide',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './utilisateur-questionnaire-guide.component.html',
  styleUrls: ['./utilisateur-questionnaire-guide.component.scss'],
})
export class QuestionnaireGuideUtilisateurComponent implements OnInit {
  organisationName = '';
  organisationLogoUrl: string | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.organisationName = params['organisationName'] || '';
      this.organisationLogoUrl = params['organisationLogoUrl'] || null;
    });
  }

  goToCatalogue(): void {
    this.router.navigate(['/catalogue-velos'], {
      queryParams: this.buildQueryParams(),
    });
  }

  private buildQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.organisationName) {
      params['organisationName'] = this.organisationName;
    }
    if (this.organisationLogoUrl) {
      params['organisationLogoUrl'] = this.organisationLogoUrl;
    }
    return params;
  }
}
