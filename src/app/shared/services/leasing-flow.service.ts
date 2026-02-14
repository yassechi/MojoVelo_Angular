import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ParcoursType = 'A' | 'B';
export type BikeType = 'Ville' | 'VTC' | 'VTT' | 'Cargo' | 'Gravel';
export type AssistanceType = 'Aucune' | 'Électrique';
export type GenderType = 'Mixte' | 'Homme' | 'Femme';

export interface LeasingProfile {
  firstName: string;
  lastName: string;
  email: string;
  heightCm: number | null;
  domain: string | null;
}

export interface LeasingQuestionnaire {
  usage: 'Trajet domicile-travail' | 'Loisir' | 'Sport' | 'Mixte' | null;
  distance: '0-5' | '5-10' | '10-20' | '20+' | null;
  terrain: 'Plat' | 'Mixte' | 'Montagne' | null;
  assistance: AssistanceType | null;
  budget: '500-1000' | '1000-2000' | '2000-3000' | '3000+' | null;
  cargo: 'Aucun' | 'Léger' | 'Important' | null;
}

export interface Bike {
  id: number;
  brand: string;
  model: string;
  type: BikeType;
  assistance: AssistanceType;
  gender: GenderType;
  priceTtc: number;
  merchant: string;
  location: string;
  imageUrl: string;
}

export interface LeasingState {
  profile: LeasingProfile;
  parcours: ParcoursType | null;
  questionnaire: LeasingQuestionnaire;
  selectedBikeId: number | null;
  accessoriesNote: string;
  lastDemandeId: number | null;
}

const STORAGE_KEY = 'mojo.leasing.flow';

const DEFAULT_STATE: LeasingState = {
  profile: {
    firstName: '',
    lastName: '',
    email: '',
    heightCm: null,
    domain: null,
  },
  parcours: null,
  questionnaire: {
    usage: null,
    distance: null,
    terrain: null,
    assistance: null,
    budget: null,
    cargo: null,
  },
  selectedBikeId: null,
  accessoriesNote: '',
  lastDemandeId: null,
};

const BIKES: Bike[] = [
  {
    id: 1,
    brand: 'Gazelle',
    model: 'Esprit C7',
    type: 'Ville',
    assistance: 'Aucune',
    gender: 'Mixte',
    priceTtc: 899,
    merchant: 'CycloCenter',
    location: 'Bruxelles',
    imageUrl: 'https://images.unsplash.com/photo-1508973379052-2c7d42ddc2c6?w=800',
  },
  {
    id: 2,
    brand: 'Cube',
    model: 'Touring Hybrid One',
    type: 'VTC',
    assistance: 'Électrique',
    gender: 'Mixte',
    priceTtc: 2499,
    merchant: 'BikeHub',
    location: 'Liège',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
  },
  {
    id: 3,
    brand: 'Trek',
    model: 'Marlin 7',
    type: 'VTT',
    assistance: 'Aucune',
    gender: 'Mixte',
    priceTtc: 1099,
    merchant: 'VéloSport',
    location: 'Namur',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800',
  },
  {
    id: 4,
    brand: 'Riese & Müller',
    model: 'Load 60',
    type: 'Cargo',
    assistance: 'Électrique',
    gender: 'Mixte',
    priceTtc: 6299,
    merchant: 'Mojo Vélo',
    location: 'Bruxelles',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
  },
  {
    id: 5,
    brand: 'Specialized',
    model: 'Diverge E5',
    type: 'Gravel',
    assistance: 'Aucune',
    gender: 'Homme',
    priceTtc: 1699,
    merchant: 'BikeHub',
    location: 'Charleroi',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800',
  },
  {
    id: 6,
    brand: 'Electra',
    model: 'Townie Go!',
    type: 'Ville',
    assistance: 'Électrique',
    gender: 'Femme',
    priceTtc: 2199,
    merchant: 'CycloCenter',
    location: 'Bruxelles',
    imageUrl: 'https://images.unsplash.com/photo-1517949908119-7202b6b8e8d4?w=800',
  },
  {
    id: 7,
    brand: 'Cannondale',
    model: 'Quick 4',
    type: 'VTC',
    assistance: 'Aucune',
    gender: 'Mixte',
    priceTtc: 849,
    merchant: 'VéloSport',
    location: 'Liège',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
  },
  {
    id: 8,
    brand: 'Haibike',
    model: 'HardNine',
    type: 'VTT',
    assistance: 'Électrique',
    gender: 'Homme',
    priceTtc: 3299,
    merchant: 'Mojo Vélo',
    location: 'Namur',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
  },
];

@Injectable({
  providedIn: 'root',
})
export class LeasingFlowService {
  private readonly stateSubject = new BehaviorSubject<LeasingState>(this.loadState());
  readonly state$ = this.stateSubject.asObservable();

  get state(): LeasingState {
    return this.stateSubject.value;
  }

  update(partial: Partial<LeasingState>): void {
    this.setState({ ...this.state, ...partial });
  }

  updateProfile(profile: Partial<LeasingProfile>): void {
    this.setState({ ...this.state, profile: { ...this.state.profile, ...profile } });
  }

  updateQuestionnaire(questionnaire: Partial<LeasingQuestionnaire>): void {
    this.setState({ ...this.state, questionnaire: { ...this.state.questionnaire, ...questionnaire } });
  }

  reset(): void {
    this.setState({ ...DEFAULT_STATE });
  }

  getBikes(): Bike[] {
    return [...BIKES];
  }

  getBikeById(id: number | null): Bike | null {
    if (!id) {
      return null;
    }
    return BIKES.find((bike) => bike.id === id) ?? null;
  }

  getRecommendedBikes(): Bike[] {
    const { questionnaire } = this.state;
    let filtered = [...BIKES];

    if (questionnaire.assistance) {
      filtered = filtered.filter((bike) => bike.assistance === questionnaire.assistance);
    }
    if (questionnaire.terrain === 'Montagne') {
      filtered = filtered.filter((bike) => bike.type === 'VTT' || bike.type === 'Gravel');
    }
    if (questionnaire.cargo === 'Important') {
      filtered = filtered.filter((bike) => bike.type === 'Cargo');
    }
    if (questionnaire.usage === 'Trajet domicile-travail') {
      filtered = filtered.filter((bike) => bike.type === 'Ville' || bike.type === 'VTC');
    }
    if (questionnaire.budget === '500-1000') {
      filtered = filtered.filter((bike) => bike.priceTtc <= 1000);
    }
    if (questionnaire.budget === '1000-2000') {
      filtered = filtered.filter((bike) => bike.priceTtc > 1000 && bike.priceTtc <= 2000);
    }
    if (questionnaire.budget === '2000-3000') {
      filtered = filtered.filter((bike) => bike.priceTtc > 2000 && bike.priceTtc <= 3000);
    }
    if (questionnaire.budget === '3000+') {
      filtered = filtered.filter((bike) => bike.priceTtc > 3000);
    }

    return filtered.length ? filtered : BIKES;
  }

  private setState(state: LeasingState): void {
    this.stateSubject.next(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private loadState(): LeasingState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_STATE };
      }
      const parsed = JSON.parse(raw) as LeasingState;
      return { ...DEFAULT_STATE, ...parsed };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }
}
