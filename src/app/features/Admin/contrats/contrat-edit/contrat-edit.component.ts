import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContratService, Contrat, StatutContrat } from '../../../../core/services/contrat.service';
import { UserService, User } from '../../../../core/services/user.service';
import { VeloService, Velo } from '../../../../core/services/velo.service';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-contrat-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    Card,
    Button,
    InputText,
    Select,
    DatePicker,
    InputNumber,
    Toast
  ],
  providers: [MessageService, VeloService],
  templateUrl: './contrat-edit.component.html',
  styleUrls: ['./contrat-edit.component.scss']
})
export class ContratEditComponent implements OnInit {
  contratForm!: FormGroup;
  contratId: number | null = null;
  loading = false;

  users: User[] = [];
  velos: Velo[] = [];

  statutOptions = [
    { label: 'En cours', value: StatutContrat.EnCours },
    { label: 'Terminé', value: StatutContrat.Termine },
    { label: 'Résilié', value: StatutContrat.Resilie }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contratService: ContratService,
    private userService: UserService,
    private veloService: VeloService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
    this.loadVelos();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.contratId = Number(id);
      this.loadContrat(this.contratId);
    }
  }

  initForm(): void {
    this.contratForm = this.fb.group({
      ref: ['', Validators.required],
      veloId: [null, Validators.required],
      beneficiaireId: ['', Validators.required],
      userRhId: ['', Validators.required],
      dateDebut: [null, Validators.required],
      dateFin: [null, Validators.required],
      duree: [null, Validators.required],
      loyerMensuelHT: [null, Validators.required],
      statutContrat: [StatutContrat.EnCours, Validators.required]
    });
  }

  loadContrat(id: number): void {
    this.loading = true;
    this.contratService.getOne(id).subscribe({
      next: (contrat) => {
        this.contratForm.patchValue({
          ref: contrat.ref,
          veloId: contrat.veloId,
          beneficiaireId: contrat.beneficiaireId,
          userRhId: contrat.userRhId,
          dateDebut: new Date(contrat.dateDebut),
          dateFin: new Date(contrat.dateFin),
          duree: contrat.duree,
          loyerMensuelHT: contrat.loyerMensuelHT,
          statutContrat: contrat.statutContrat
        });
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger le contrat'
        });
        this.loading = false;
      }
    });
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => this.users = users,
      error: () => console.error('Erreur chargement users')
    });
  }

  loadVelos(): void {
    this.veloService.getAll().subscribe({
      next: (velos) => this.velos = velos,
      error: () => console.error('Erreur chargement vélos')
    });
  }

 onSubmit(): void {
  if (this.contratForm.invalid) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez remplir tous les champs obligatoires'
    });
    return;
  }

  const formValue = this.contratForm.value;
  const contrat: Contrat = {
    id: this.contratId ?? undefined,
    ref: formValue.ref,
    veloId: formValue.veloId,
    beneficiaireId: formValue.beneficiaireId,
    userRhId: formValue.userRhId,
    dateDebut: formValue.dateDebut.toISOString().split('T')[0],
    dateFin: formValue.dateFin.toISOString().split('T')[0],
    duree: formValue.duree,
    loyerMensuelHT: formValue.loyerMensuelHT,
    statutContrat: formValue.statutContrat,
    isActif: true
  };

  this.contratService.update(contrat).subscribe({
    next: () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Contrat modifié avec succès'
      });

      // ✅ SOLUTION : Recharger la page directement après navigation
      setTimeout(() => {
        window.location.href = `/admin/contrats/${this.contratId}`;
      }, 1000);
    },
    error: () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de modifier le contrat'
      });
    }
  });
}
  goBack(): void {
    this.router.navigate(['/admin/contrats', this.contratId]);
  }
}
