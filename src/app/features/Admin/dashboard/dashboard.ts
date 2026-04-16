import { DemandeService, DemandeStatus } from '../../../core/services/demande.service';
import { ContratService, StatutContrat } from '../../../core/services/contrat.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import {
  AiService,
  AiUploadMultipleResponse,
  AiPdfInfo,
  AiUploadSingleResponse,
} from '../../../core/services/ai.service';
import { MessageService } from '../../../core/services/message.service';
import { I18nService } from '../../../core/services/I18n.service';
import { StatCardComponent } from '../../../shared/stat-card/stat-card';
import { AiPdfUploaderComponent } from '../../../shared/ai-pdf-uploader/ai-pdf-uploader';
import { DoughnutChartCardComponent } from '../../../shared/doughnut-chart-card/doughnut-chart-card';
import { AiChatComponent } from '../../../shared/ai-chat/ai-chat';
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    ButtonModule,
    ConfirmDialogModule,
    TextareaModule,
    StatCardComponent,
    AiPdfUploaderComponent,
    DoughnutChartCardComponent,
    AiChatComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class AdminDashboardComponent {
  stats = signal({ pendingDemandes: 0, activeContrats: 0, expiringContrats: 0 });
  activityFeed = signal<Array<{ title: string; detail: string; time: string }>>([]);
  readonly activityFeedView = computed(() => {
    const feed = this.activityFeed();
    return feed.map((item) => ({
      ...item,
      title: this.localizeActivityTitle(item.title),
    }));
  });
  demandeStatusChartData = signal<any>(null);
  contratStatusChartData = signal<any>(null);
  uploadedAiFiles = signal<AiPdfInfo[]>([]);
  uploadedClientAiFiles = signal<AiPdfInfo[]>([]);
  uploadLoading = signal(false);
  uploadedListLoading = signal(false);
  uploadClientLoading = signal(false);
  uploadedClientListLoading = signal(false);
  lastUploadSummary = signal<string | null>(null);
  lastClientUploadSummary = signal<string | null>(null);

  private readonly maxFileBytes = 10 * 1024 * 1024;

  readonly donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#475569', font: { family: 'Manrope', weight: '600' } },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleFont: { family: 'Space Grotesk', size: 13, weight: '700' },
        bodyFont: { family: 'Manrope', size: 12, weight: '600' },
        padding: 12,
        cornerRadius: 12,
      },
    },
  };

  private readonly dashboardService = inject(DashboardService);
  private readonly demandeService = inject(DemandeService);
  private readonly contratService = inject(ContratService);
  private readonly aiService = inject(AiService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly i18n = inject(I18nService);

  constructor() {
    this.dashboardService.getAdminDashboard().subscribe((data) => {
      this.stats.set({
        pendingDemandes: data.pendingDemandes,
        activeContrats: data.activeContrats,
        expiringContrats: data.expiringContrats,
      });
      this.activityFeed.set(data.activityFeed || []);
    });

    this.demandeService.getList().subscribe((demandes) => {
      const enCours = demandes.filter((d) => d.status === DemandeStatus.Encours).length;
      const attente = demandes.filter((d) => d.status === DemandeStatus.AttenteComagnie).length;
      const finalisation = demandes.filter((d) => d.status === DemandeStatus.Finalisation).length;
      const valide = demandes.filter((d) => d.status === DemandeStatus.Valide).length;
      const refuse = demandes.filter((d) => d.status === DemandeStatus.Refuse).length;
      const t = this.i18n.t();

      // Remplir le chart
      this.demandeStatusChartData.set({
        labels: [
          t.demandeStatus.encours,
          t.demandeStatus.attenteCompagnie,
          t.demandeStatus.finalisation,
          t.demandeStatus.valide,
          t.demandeStatus.refuse,
        ],
        datasets: [
          {
            data: [enCours, attente, finalisation, valide, refuse],
            backgroundColor: ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      });
    });

    this.contratService.getList().subscribe((contrats) => {
      const statuses = [StatutContrat.EnCours, StatutContrat.Termine, StatutContrat.Resilie];
      this.contratStatusChartData.set({
        labels: statuses.map((s) => this.contratService.getStatutLabel(s)),
        datasets: [
          {
            data: statuses.map((s) => contrats.filter((c) => c.statutContrat === s).length),
            backgroundColor: ['#bbf7d0', '#4ade80', '#16a34a'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      });
    });
  }

  uploadAiFiles(files: File[]): void {
    if (this.uploadLoading()) return;
    if (!files.length) {
      this.messageService.showWarn(this.i18n.get('ai.selectAtLeastOnePdf'));
      return;
    }

    this.uploadLoading.set(true);
    const request$: Observable<AiUploadSingleResponse | AiUploadMultipleResponse> =
      files.length > 1
        ? this.aiService.uploadAdminMultiple(files)
        : this.aiService.uploadAdminSingle(files[0]);

    request$.subscribe({
      next: (response: any) => {
        if (response?.message) {
          this.messageService.showSuccess(response.message);
          this.lastUploadSummary.set(response.message);
        } else {
          const uploaded = response?.uploades ?? [];
          const errors = response?.erreurs ?? [];
          if (uploaded.length) {
            this.messageService.showSuccess(
              this.i18n.format('ai.uploadedCount', { count: uploaded.length }),
            );
            this.lastUploadSummary.set(
              this.i18n.format('ai.uploadedSummary', { files: uploaded.join(', ') }),
            );
          }
          if (errors.length) {
            this.messageService.showWarn(
              this.i18n.format('ai.errorsPrefix', { errors: errors.join(' | ') }),
            );
          }
        }
        this.loadUploadedAiFiles();
      },
      error: () => {
        this.messageService.showError(this.i18n.get('ai.uploadError'));
        this.uploadLoading.set(false);
      },
      complete: () => this.uploadLoading.set(false),
    });
  }

  loadUploadedAiFiles(): void {
    this.uploadedListLoading.set(true);
    this.aiService.getAdminFiles().subscribe({
      next: (files) => this.uploadedAiFiles.set(files ?? []),
      error: () => {
        this.messageService.showError(this.i18n.get('ai.loadPdfListError'));
        this.uploadedListLoading.set(false);
      },
      complete: () => this.uploadedListLoading.set(false),
    });
  }

  uploadClientAiFiles(files: File[]): void {
    if (this.uploadClientLoading()) return;
    if (!files.length) {
      this.messageService.showWarn(this.i18n.get('ai.selectAtLeastOnePdf'));
      return;
    }

    this.uploadClientLoading.set(true);
    const request$: Observable<AiUploadSingleResponse | AiUploadMultipleResponse> =
      files.length > 1
        ? this.aiService.uploadClientMultiple(files)
        : this.aiService.uploadClientSingle(files[0]);

    request$.subscribe({
      next: (response: any) => {
        if (response?.message) {
          this.messageService.showSuccess(response.message);
          this.lastClientUploadSummary.set(response.message);
        } else {
          const uploaded = response?.uploades ?? [];
          const errors = response?.erreurs ?? [];
          if (uploaded.length) {
            this.messageService.showSuccess(
              this.i18n.format('ai.uploadedCount', { count: uploaded.length }),
            );
            this.lastClientUploadSummary.set(
              this.i18n.format('ai.uploadedSummary', { files: uploaded.join(', ') }),
            );
          }
          if (errors.length) {
            this.messageService.showWarn(
              this.i18n.format('ai.errorsPrefix', { errors: errors.join(' | ') }),
            );
          }
        }
        this.loadUploadedClientAiFiles();
      },
      error: () => {
        this.messageService.showError(this.i18n.get('ai.uploadError'));
        this.uploadClientLoading.set(false);
      },
      complete: () => this.uploadClientLoading.set(false),
    });
  }

  loadUploadedClientAiFiles(): void {
    this.uploadedClientListLoading.set(true);
    this.aiService.getClientFiles().subscribe({
      next: (files) => this.uploadedClientAiFiles.set(files ?? []),
      error: () => {
        this.messageService.showError(this.i18n.get('ai.loadPdfListError'));
        this.uploadedClientListLoading.set(false);
      },
      complete: () => this.uploadedClientListLoading.set(false),
    });
  }

  deleteUploadedAiFile(file: AiPdfInfo): void {
    this.confirmationService.confirm({
      message: this.i18n.format('ai.deleteFileConfirm', { file: file.fileName }),
      header: this.i18n.get('common.confirmer'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.get('common.oui'),
      rejectLabel: this.i18n.get('common.non'),
      accept: () => {
        this.uploadedListLoading.set(true);
        this.aiService.deleteAdminFile(file.fileName).subscribe({
          next: (response) => {
            this.messageService.showSuccess(
              response?.message ?? this.i18n.get('ai.deleteFileSuccess'),
            );
            this.loadUploadedAiFiles();
          },
          error: () => {
            this.messageService.showError(this.i18n.get('ai.deleteFileError'));
            this.uploadedListLoading.set(false);
          },
        });
      },
    });
  }

  deleteUploadedClientAiFile(file: AiPdfInfo): void {
    this.confirmationService.confirm({
      message: this.i18n.format('ai.deleteFileConfirm', { file: file.fileName }),
      header: this.i18n.get('common.confirmer'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.get('common.oui'),
      rejectLabel: this.i18n.get('common.non'),
      accept: () => {
        this.uploadedClientListLoading.set(true);
        this.aiService.deleteClientFile(file.fileName).subscribe({
          next: (response) => {
            this.messageService.showSuccess(
              response?.message ?? this.i18n.get('ai.deleteFileSuccess'),
            );
            this.loadUploadedClientAiFiles();
          },
          error: () => {
            this.messageService.showError(this.i18n.get('ai.deleteFileError'));
            this.uploadedClientListLoading.set(false);
          },
        });
      },
    });
  }

  private formatTime(date: Date): string {
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  private localizeActivityTitle(title: string): string {
    if (!title) return title;
    const idMatch = title.match(/#\s*(\d+)/);
    if (!idMatch) return title;
    if (!/(demande|aanvraag)/i.test(title)) return title;
    return this.i18n.format('dashboard.demandeItemTitle', { id: idMatch[1] });
  }

  formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
