import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

/**
 * Carte réutilisable contenant un graphique Doughnut PrimeNG.
 *
 * @example
 * <app-doughnut-chart-card
 *   [title]="i18n.t().dashboard.chartTitle"
 *   [data]="chartData()"
 *   [options]="chartOptions"
 * />
 */
@Component({
  selector: 'app-doughnut-chart-card',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  template: `
    <p-card class="chart-card">
      <ng-template pTemplate="header">
        <div class="p-3">
          <h3 class="m-0 chart-title">{{ title }}</h3>
        </div>
      </ng-template>
      <p-chart
        type="doughnut"
        [class]="'mojo-chart ' + cssClass"
        [data]="data"
        [options]="options"
        [style.height]="height"
      ></p-chart>
    </p-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class DoughnutChartCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) data: any;
  @Input({ required: true }) options: any;
  @Input() cssClass: string = '';
  @Input() height: string = '280px';
}
