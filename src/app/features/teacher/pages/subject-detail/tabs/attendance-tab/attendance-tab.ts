import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AttendanceService, AttendanceStatus } from '../../../../services/attendance.service';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { Button } from '../../../../../../shared/components/button/button';
import { Input } from '../../../../../../shared/components/input/input';
import { Loader } from '../../../../../../shared/components/loader/loader';
import { Toast } from '../../../../../../shared/components/toast/toast';

@Component({
  selector: 'app-attendance-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Input, Loader, Toast],
  templateUrl: 'attendance-tab.html',
  styleUrl: 'attendance-tab.css'
})
export class AttendanceTab implements OnInit {

  readonly service = inject(AttendanceService);
  readonly operationalService = inject(SubjectOperationalService);
  readonly route = inject(ActivatedRoute);
  readonly showSuccessToast = signal(false);
  readonly showErrorToast = signal(false);

  constructor() {
    // REQUERIMIENTO SENIOR: Monitoreamos la materia de forma 100% reactiva
    effect(() => {
      const subject = this.operationalService.subject();
      const students = this.operationalService.students();

      // Si la materia ya se cargó en el servicio operacional, forzamos la sincronización
      if (subject && subject.id) {
        // Un micro-delay con setTimeout evita colisiones de renderizado en Angular (Error NG0100)
        setTimeout(() => {
          // Si tu loadData acepta el ID por parámetro, ponlo así: this.service.loadData(String(subject.id));
          // Si no, llamarlo aquí asegura que el servicio se ejecute CUANDO ya existe contexto.
          this.service.loadData(); 
        });
      }

      // Tu lógica original de limpiar feedback
      if (students.length > 0) {
        this.service.clearFeedback();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // 🚫 REMOVEMOS el this.service.loadData() de aquí.
    // Si se ejecuta en el ngOnInit, arranca a ciegas antes de que la materia se recupere del backend.
  }

  handleDateChange(date: string | number) {
    this.service.setDate(String(date));
  }

  handleStatusChange(enrollmentId: string, status: AttendanceStatus) {
    this.service.setAttendanceStatus(enrollmentId, status);
  }

  setAll(status: AttendanceStatus) {
    for (const record of this.service.attendanceRecords()) {
      this.service.setAttendanceStatus(record.enrollmentId, status);
    }
  }

  handleSubmit() {
    const records = this.service.attendanceRecords();
    
    // ESTRATEGIA HÍBRIDA: Si el operationalService está vacío, lo extraemos de la URL de la barra del navegador
    const subjectIdFromOperational = this.operationalService.subject()?.id;
    const subjectIdFromRoute = this.route.snapshot.paramMap.get('id');
    const subjectId = subjectIdFromOperational || subjectIdFromRoute;

    console.log('--- INTENTO DE ENVÍO DE ASISTENCIA ---');
    console.log('ID Detectado:', subjectId);
    console.log('Alumnos listos:', records.length);

    // Validamos con lo que rescatamos de forma híbrida
    if (!subjectId || !records || records.length === 0) {
      this.showErrorToast.set(true);
      setTimeout(() => this.showErrorToast.set(false), 5000);
      return;
    }

    // Si pasa el filtro, disparamos la petición al servicio
    this.service.submit().subscribe(success => {
      if (success) {
        this.showSuccessToast.set(true);
        setTimeout(() => this.showSuccessToast.set(false), 5000);
      } else {
        this.showErrorToast.set(true);
        setTimeout(() => this.showErrorToast.set(false), 5000);
      }
    });
  }
}