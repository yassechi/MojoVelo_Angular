import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

export type StatCardColor = 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'red';

/**
 * Carte de statistique réutilisable pour les dashboards.
 *
 * @example
 * <app-stat-card label="Employés" [value]="totalEmployes()" icon="pi-users" color="blue" />
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './stat-card.html',
  styleUrls: ['./stat-card.scss'],
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number | string;
  @Input({ required: true }) icon!: string;
  @Input() color: StatCardColor = 'blue';

  get bgClass(): string {
    const map: Record<StatCardColor, string> = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      orange: 'bg-orange-100',
      purple: 'bg-purple-100',
      teal: 'bg-teal-100',
      red: 'bg-red-100',
    };
    return map[this.color];
  }

  get iconColorClass(): string {
    const map: Record<StatCardColor, string> = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      orange: 'text-orange-500',
      purple: 'text-purple-500',
      teal: 'text-teal-500',
      red: 'text-red-500',
    };
    return map[this.color];
  }
}
