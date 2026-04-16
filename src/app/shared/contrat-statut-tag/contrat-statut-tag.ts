import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ContratService, StatutContrat } from '../../core/services/contrat.service';

/**
 * Tag affichant le statut d'un contrat avec la couleur appropriée.
 *
 * @example
 * <app-contrat-statut-tag [statut]="contrat.statutContrat" />
 */
@Component({
  selector: 'app-contrat-statut-tag',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: `
    <p-tag [value]="label" [severity]="severity"></p-tag>
  `,
})
export class ContratStatutTagComponent {
  @Input({ required: true }) statut!: StatutContrat;

  private readonly contratService = inject(ContratService);

  get label(): string {
    return this.contratService.getStatutLabel(this.statut);
  }

  get severity(): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    switch (this.statut) {
      case StatutContrat.EnCours:
        return 'success';
      case StatutContrat.Termine:
        return 'secondary';
      case StatutContrat.Resilie:
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
