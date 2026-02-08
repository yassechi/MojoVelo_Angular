import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { OrganisationService, Organisation } from '../../../core/services/organisation.service';
// import { UserService, User } from '../../../core/services/user.service';
// import { FileUploadService } from '../../../core/services/file-upload.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { User, UserService } from '../../../../core/services/user.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';

@Component({
  selector: 'app-compagnie-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    FileUploadModule,
    SelectModule,
  ],
  templateUrl: './compagnie-form-dialog.html',
  styleUrls: ['./compagnie-form-dialog.scss'],
})
export class CompagnieFormDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() organisation: Organisation | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  uploadedLogo: string | null = null;
  users: User[] = [];
  loadingUsers = false;

  constructor(
    private fb: FormBuilder,
    private organisationService: OrganisationService,
    private userService: UserService,
    private messageService: MessageService,
    private fileUploadService: FileUploadService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  ngOnChanges(): void {
    if (this.organisation) {
      this.loadOrganisation();
    } else {
      this.form?.reset({
        id: 0,
        isActif: true,
      });
    }
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

  loadOrganisation(): void {
    if (this.organisation) {
      this.form.patchValue(this.organisation);
      this.uploadedLogo = this.organisation.logoUrl || null;
    }
  }

  onUpload(event: any): void {
    const file = event.files[0];

    if (!file) {
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (file.size > maxSize) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le fichier est trop volumineux (max 5 MB)'
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Format non autorisé (jpg, png, gif uniquement)'
      });
      return;
    }

    this.fileUploadService.uploadLogo(file).subscribe({
      next: (response) => {
        const logoUrl = `https://localhost:7126${response.url}`;
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
        this.close();
        this.onSave.emit();
      },
      error: () => {
        this.loading = false;
        // L'intercepteur affiche déjà l'erreur dans le toast
      }
    });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.form.reset({
      id: 0,
      isActif: true,
    });
    this.uploadedLogo = null;
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
