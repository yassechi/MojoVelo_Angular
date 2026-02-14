import { Injectable, computed, signal } from '@angular/core';
import { Contrat } from '../../../../core/services/contrat.service';

@Injectable()
export class ContratDetailStore {
  readonly contrat = signal<Contrat | null>(null);
  readonly contratId = computed(() => this.contrat()?.id ?? null);
  readonly veloId = computed(() => this.contrat()?.veloId ?? null);

  setContrat(value: Contrat | null): void {
    this.contrat.set(value);
  }
}
