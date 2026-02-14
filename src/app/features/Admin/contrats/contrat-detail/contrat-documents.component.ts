import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Document, DocumentService } from '../../../../core/services/document.service';
import { ErrorService } from '../../../../core/services/error.service';
import { environment } from '../../../../../environments/environment';
import { ContratDetailStore } from './contrat-detail.store';

@Component({
  selector: 'app-contrat-documents',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TooltipModule],
  templateUrl: './contrat-documents.component.html',
  styleUrls: ['./contrat-documents.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDocumentsComponent {
  private readonly documentService = inject(DocumentService);
  private readonly messageService = inject(MessageService);
  private readonly errorService = inject(ErrorService);
  private readonly store = inject(ContratDetailStore);
  private readonly legacyApi = environment.urls.legacyApi;

  readonly contratId = computed(() => this.store.contratId());

  readonly documentsResource = httpResource<Document[]>(
    () => {
      const id = this.contratId();
      return id ? `${this.legacyApi}/Document/get-by-contrat/${id}` : undefined;
    },
    { defaultValue: [] },
  );
  readonly documents = computed(() => this.documentsResource.value() ?? []);

  readonly loading = computed(() => this.documentsResource.isLoading());

  private readonly documentsErrorEffect = effect(() => {
    const error = this.documentsResource.error();
    if (error && !this.isUnauthorized(error)) {
      this.errorService.showError('Impossible de charger les documents');
    }
  });

  private isUnauthorized(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const err = error as { status?: number; cause?: { status?: number } };
    const status = err.status ?? err.cause?.status;
    return status === 401 || status === 403;
  }

  downloadDocument(doc: Document): void {
    this.documentService.downloadDocument(doc);
  }

  deleteDocument(doc: Document): void {
    if (confirm(`Voulez-vous vraiment supprimer "${doc.nomFichier}" ?`)) {
      this.documentService.delete(doc.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succ\u00e8s',
            detail: 'Document supprim\u00e9',
          });
          this.documentsResource.reload();
        },
        error: () => {
          this.errorService.showError('Impossible de supprimer le document');
        },
      });
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    const contratId = this.contratId();
    if (!file || !contratId) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];

      const newDoc: Document = {
        id: 0,
        contratId,
        fichier: base64,
        nomFichier: file.name,
        typeFichier: file.name.split('.').pop() || 'pdf',
        isActif: true,
      };

      this.documentService.create(newDoc).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succ\u00e8s',
            detail: 'Document ajout\u00e9',
          });
          this.documentsResource.reload();
        },
        error: () => {
          this.errorService.showError("Impossible d'ajouter le document");
        },
      });
    };

    reader.readAsDataURL(file);
  }
}
