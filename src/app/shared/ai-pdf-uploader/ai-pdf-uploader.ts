import {
  AiPdfInfo,
  AiUploadMultipleResponse,
  AiUploadSingleResponse,
} from '../../core/services/ai.service';
import { MessageService } from '../../core/services/message.service';
import { I18nService } from '../../core/services/I18n.service';
import { ConfirmationService } from 'primeng/api';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Observable } from 'rxjs';

export interface AiUploaderConfig {
  /** Libellé du titre de la section (affiché dans le header de la card) */
  cardTitle: string;
  /** Texte principal de la zone de dépôt */
  dropTitle: string;
  /** Aria-label de la zone de dépôt */
  ariaLabel?: string;
}

/**
 * Composant d'upload PDF pour l'IA.
 * Gère le drag & drop, la sélection de fichiers, la liste des fichiers uploadés,
 * et la suppression — sans aucune logique API (délégué via @Output).
 *
 * @example
 * <app-ai-pdf-uploader
 *   [config]="adminConfig"
 *   [uploadedFiles]="uploadedAiFiles()"
 *   [uploadLoading]="uploadLoading()"
 *   [listLoading]="uploadedListLoading()"
 *   [lastSummary]="lastUploadSummary()"
 *   (uploadFiles)="uploadAiFiles($event)"
 *   (deleteFile)="deleteUploadedAiFile($event)"
 *   (requestFileList)="loadUploadedAiFiles()"
 * />
 */
@Component({
  selector: 'app-ai-pdf-uploader',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule],
  templateUrl: './ai-pdf-uploader.html',
  styleUrls: ['./ai-pdf-uploader.scss'],
})
export class AiPdfUploaderComponent {
  @Input({ required: true }) config!: AiUploaderConfig;
  @Input() uploadedFiles: AiPdfInfo[] = [];
  @Input() uploadLoading = false;
  @Input() listLoading = false;
  @Input() lastSummary: string | null = null;

  /** Émet la liste de fichiers valides sélectionnés pour l'upload */
  @Output() uploadFiles = new EventEmitter<File[]>();
  /** Émet le fichier à supprimer */
  @Output() deleteFile = new EventEmitter<AiPdfInfo>();
  /** Demande le rechargement de la liste des fichiers uploadés */
  @Output() requestFileList = new EventEmitter<void>();

  selectedFiles = signal<File[]>([]);
  showUploaded = signal(false);
  isDragOver = signal(false);

  private readonly maxFileBytes = 10 * 1024 * 1024;
  readonly i18n = inject(I18nService);
  private readonly messageService = inject(MessageService);

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    if (input) input.value = '';
    if (!files.length) return;
    this.processFiles(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    if (!files.length) return;
    this.processFiles(files);
  }

  removeFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  clearFiles(): void {
    this.selectedFiles.set([]);
  }

  upload(): void {
    const files = this.selectedFiles();
    if (!files.length) {
      this.messageService.showWarn(this.i18n.get('ai.selectAtLeastOnePdf'));
      return;
    }
    this.uploadFiles.emit(files);
    this.selectedFiles.set([]);
  }

  toggleUploaded(): void {
    const next = !this.showUploaded();
    this.showUploaded.set(next);
    if (next && this.uploadedFiles.length === 0 && !this.listLoading) {
      this.requestFileList.emit();
    }
  }

  onDeleteFile(file: AiPdfInfo): void {
    this.deleteFile.emit(file);
  }

  formatFileSize(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private processFiles(files: File[]): void {
    const validFiles: File[] = [];
    const rejected: string[] = [];

    files.forEach((file) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        rejected.push(`${file.name} (${this.i18n.t().ai.fileNotPdfSuffix})`);
        return;
      }
      if (file.size > this.maxFileBytes) {
        rejected.push(`${file.name} (${this.i18n.t().ai.fileTooLargeSuffix})`);
        return;
      }
      validFiles.push(file);
    });

    if (rejected.length) {
      this.messageService.showWarn(
        this.i18n.format('ai.fileIgnored', { names: rejected.join(' | ') }),
      );
    }
    this.selectedFiles.set(validFiles);
  }
}
