import { Injectable, computed, signal } from '@angular/core';
import { ContratDetail } from '../../../../core/services/contrat.service';

@Injectable()
export class ContratDetailStore {
  readonly contrat = signal<ContratDetail | null>(null);
  readonly contratId = computed(() => this.contrat()?.id ?? null);
  readonly veloId = computed(() => this.contrat()?.veloId ?? null);

  setContrat(value: ContratDetail | null): void {
    this.contrat.set(value);
  }
}
