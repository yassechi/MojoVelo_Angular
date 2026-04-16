import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * En-tête de page réutilisable.
 * Affiche un titre, un sous-titre optionnel et un slot ng-content pour les boutons d'action.
 *
 * @example
 * <app-page-header title="Contrats" subtitle="Gérez vos contrats">
 *   <p-button label="Créer" icon="pi pi-plus" (click)="onCreate()" />
 * </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.html',
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
