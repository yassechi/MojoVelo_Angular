import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Message de tableau vide réutilisable.
 * À utiliser dans le ng-template pTemplate="emptymessage" de p-table.
 *
 * @example
 * <ng-template pTemplate="emptymessage">
 *   <app-empty-table [message]="i18n.t().contrats.aucun" [colspan]="9" />
 * </ng-template>
 */
@Component({
  selector: 'app-empty-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-table.html',
})
export class EmptyTableComponent {
  @Input({ required: true }) message!: string;
  @Input() colspan: number = 5;
  @Input() icon: string = 'pi-inbox';
}
