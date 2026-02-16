import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { User, UserService } from '../../../../core/services/user.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';
import { ErrorService } from '../../../../core/services/error.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-compagnie-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    FileUploadModule,
    SelectModule,
    ToastModule,
  ],
  templateUrl: './admin-compagnie-form.component.html',
  styleUrls: ['./admin-compagnie-form.component.scss'],
})
export class CompagnieFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  uploadedLogo: string | null = null;
  users: User[] = [];
  loadingUsers = false;
  organisation: Organisation | null = null;
  organisationId: number | null = null;
  isEdit = false;

  private fb = inject(FormBuilder);
  private organisationService = inject(OrganisationService);
  private userService = inject(UserService);
  private messageService = inject(PrimeMessageService);
  private fileUploadService = inject(FileUploadService);
  private errorService = inject(ErrorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.organisationId = Number(id);
        this.loadOrganisationById(this.organisationId);
      } else {
        this.isEdit = false;
        this.organisationId = null;
        this.organisation = null;
        this.form?.reset({
          id: 0,
          isActif: true,
        });
        this.uploadedLogo = null;
      }
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      id: [0],
      name: ['', [Validators.required]],
      code: ['', [Validators.required]],
      address: ['', [Validators.required]],
      contactEmail: ['', [Validators.required, Validators.email]],
      emailAutorise: [
        '',
        [Validators.required, Validators.pattern(/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)],
      ],
      idContact: ['', [Validators.required]],
      isActif: [true],
      logoUrl: [''],
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
      },
    });
  }

  loadOrganisationById(id: number): void {
    this.loading = true;
    this.organisationService.getOne(id).subscribe({
      next: (organisation) => {
        this.organisation = organisation;
        this.form.patchValue(organisation);
        this.uploadedLogo = organisation.logoUrl || null;
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger la compagnie');
        this.loading = false;
        this.goBack();
      },
    });
  }

  onUpload(event: any): void {
    const file = event.files[0];

    if (!file) {
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (file.size > maxSize) {
      this.errorService.showError('Le fichier est trop volumineux (max 5 MB)');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      this.errorService.showError('Format non autoris� (jpg, png, gif uniquement)');
      return;
    }
    this.fileUploadService.uploadLogo(file).subscribe({
      next: (response) => {
        const logoUrl = `${environment.urls.coreBase}${response.url}`;
        this.uploadedLogo = logoUrl;
        this.form.patchValue({ logoUrl: logoUrl });
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Logo téléchargé avec succès'
        });
      },
      error: () => {
        // L'intercepteur gère l'affichage de l'erreur
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    const payload = {
      ...formValue,
      id: formValue.id || 0,
    };

    const operation =
      !payload.id || payload.id === 0
        ? this.organisationService.create(payload)
        : this.organisationService.update(payload);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: payload.id ? 'Compagnie mise à jour' : 'Compagnie créée',
        });
        this.loading = false;
        this.goBack();
      },
      error: () => {
        this.loading = false;
        // L'intercepteur affiche déjà l'erreur dans le toast
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/compagnies']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get name() {
    return this.form.get('name');
  }
  get code() {
    return this.form.get('code');
  }
  get address() {
    return this.form.get('address');
  }
  get contactEmail() {
    return this.form.get('contactEmail');
  }
  get emailAutorise() {
    return this.form.get('emailAutorise');
  }
  get idContact() {
    return this.form.get('idContact');
  }
}




