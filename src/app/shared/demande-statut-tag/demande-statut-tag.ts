import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { DemandeService, DemandeStatus } from '../../core/services/demande.service';

/**
 * Tag affichant le statut d'une demande avec la couleur et les styles appropriés.
 *
 * @example
 * <app-demande-statut-tag [statut]="demande.status" />
 */
@Component({
  selector: 'app-demande-statut-tag',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: ` <p-tag [value]="label" [severity]="severity" [ngClass]="cssClass"></p-tag> `,
})
export class DemandeStatutTagComponent {
  @Input({ required: true }) statut!: DemandeStatus;

  private readonly demandeService = inject(DemandeService);

  get label(): string {
    return this.demandeService.getStatusLabel(this.statut);
  }

  get severity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return this.demandeService.getStatusSeverity(this.statut);
  }

  get cssClass(): string {
    return this.demandeService.getStatusClass(this.statut);
  }
}
