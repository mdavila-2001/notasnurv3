import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from '../../../../shared/components/button/button';
import { Modal } from '../../../../shared/components/modal/modal';
import { AdminAuditService, AuditLogsPageResponse } from '../../services/admin-audit.service';
import { AuditLogResponse } from '../../../../core/models/api.models';
import { ToastService } from '../../../../shared/services/toast.service';

interface DiffItem {
  field: string;
  oldVal: string;
  newVal: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Modal],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogs implements OnInit {
  private readonly auditService = inject(AdminAuditService);
  private readonly toastService = inject(ToastService);

  // Loading and pagination state
  isLoading = signal<boolean>(false);
  logs = signal<AuditLogResponse[]>([]);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  currentPage = signal<number>(0);
  pageSize = signal<number>(20);

  // Filters state
  searchQuery = signal<string>('');
  selectedAction = signal<string>('');
  selectedTable = signal<string>('');

  // Detail Modal state
  isDetailModalOpen = signal<boolean>(false);
  selectedLog = signal<AuditLogResponse | null>(null);

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading.set(true);
    this.auditService.getAuditLogs({
      action: this.selectedAction(),
      affectedTable: this.selectedTable(),
      search: this.searchQuery(),
      page: this.currentPage(),
      size: this.pageSize()
    }).subscribe({
      next: (response) => {
        const pageData = response.data;
        if (pageData) {
          this.logs.set(pageData.content || []);
          this.totalPages.set(pageData.totalPages || 0);
          this.totalElements.set(pageData.totalElements || 0);
        } else {
          this.logs.set([]);
          this.totalPages.set(0);
          this.totalElements.set(0);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.error('Error al cargar el historial de auditoría.');
        this.isLoading.set(false);
      }
    });
  }

  // Filter handlers
  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(0);
    this.loadLogs();
  }

  onFilterChange() {
    this.currentPage.set(0);
    this.loadLogs();
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedAction.set('');
    this.selectedTable.set('');
    this.currentPage.set(0);
    this.loadLogs();
  }

  // Pagination handlers
  setPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadLogs();
    }
  }

  // Details Modal handlers
  openDetail(log: AuditLogResponse) {
    this.selectedLog.set(log);
    this.isDetailModalOpen.set(true);
  }

  closeDetail() {
    this.isDetailModalOpen.set(false);
    this.selectedLog.set(null);
  }

  // Computeds for page numbers list
  pagesList = computed(() => {
    const list: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();
    
    if (total <= 5) {
      for (let i = 0; i < total; i++) list.push(i);
    } else {
      if (current <= 2) {
        list.push(0, 1, 2, 3, 4);
      } else if (current >= total - 3) {
        for (let i = total - 5; i < total; i++) list.push(i);
      } else {
        list.push(current - 2, current - 1, current, current + 1, current + 2);
      }
    }
    return list;
  });

  // Diff parser helper
  getParsedDiffs = computed((): DiffItem[] => {
    const log = this.selectedLog();
    if (!log) return [];
    
    const diffs: DiffItem[] = [];
    try {
      const oldObj = log.oldValue ? JSON.parse(log.oldValue) : null;
      const newObj = log.newValue ? JSON.parse(log.newValue) : null;

      // If delete or create, list everything
      if (log.action === 'CREATE' && newObj) {
        Object.entries(newObj).forEach(([key, val]) => {
          diffs.push({
            field: this.translateFieldName(key),
            oldVal: '-',
            newVal: this.formatValue(val)
          });
        });
      } else if (log.action === 'DELETE' && oldObj) {
        Object.entries(oldObj).forEach(([key, val]) => {
          diffs.push({
            field: this.translateFieldName(key),
            oldVal: this.formatValue(val),
            newVal: '-'
          });
        });
      } else if (log.action === 'UPDATE') {
        const oldData = oldObj || {};
        const newData = newObj || {};
        const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));

        for (const key of allKeys) {
          // Ignorar campos de auditoría interna de hibernate si existen
          if (['id', 'createdAt', 'updatedAt', 'deletedAt'].includes(key) && oldData[key] === newData[key]) {
            continue;
          }
          
          const oldVal = oldData[key];
          const newVal = newData[key];

          if (oldVal !== newVal) {
            diffs.push({
              field: this.translateFieldName(key),
              oldVal: this.formatValue(oldVal),
              newVal: this.formatValue(newVal)
            });
          }
        }
      }
    } catch (e) {
      console.error('Error parsing values for diff view:', e);
    }
    return diffs;
  });

  private translateFieldName(key: string): string {
    const fieldMap: Record<string, string> = {
      'score': 'Calificación (Nota)',
      'status': 'Estado Asistencia',
      'date': 'Fecha de Registro',
      'observation': 'Observación',
      'modality': 'Modalidad de Materia',
      'capacity': 'Cupo / Capacidad',
      'enrollmentId': 'ID Matrícula',
      'evaluationPlanId': 'ID Plan Evaluación',
      'gradeId': 'ID Calificación',
      'studentId': 'ID Estudiante',
      'subjectId': 'ID Materia',
      'isFinal': 'Es Acta Final',
      'ipAddress': 'Dirección IP'
    };
    return fieldMap[key] || key;
  }

  private formatValue(val: any): string {
    if (val === null || val === undefined) return '(Vacío)';
    if (typeof val === 'boolean') return val ? 'Sí' : 'No';
    if (val === 'PRESENT') return 'Presente (P)';
    if (val === 'ABSENT') return 'Falta (F)';
    if (val === 'LATE') return 'Licencia (L)';
    if (val === 'ACTIVE') return 'Activo';
    if (val === 'INACTIVE') return 'Inactivo';
    return String(val);
  }
}
