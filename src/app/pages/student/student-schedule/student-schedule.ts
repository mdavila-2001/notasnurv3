import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StudentPortalService } from '../../../core/services/student-portal.service';
import { Loader } from '../../../shared/components/loader/loader';
import { Button } from '../../../shared/components/button/button';
import { MySubjectResponseDTO } from '../../../core/models/enrollment.model';

interface ScheduleSlot {
  time: string;
  monday?: MySubjectResponseDTO & { classroom?: string };
  tuesday?: MySubjectResponseDTO & { classroom?: string };
  wednesday?: MySubjectResponseDTO & { classroom?: string };
  thursday?: MySubjectResponseDTO & { classroom?: string };
  friday?: MySubjectResponseDTO & { classroom?: string };
}

@Component({
  selector: 'app-student-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, Loader, Button],
  templateUrl: './student-schedule.html',
  styleUrl: './student-schedule.css',
})
export class StudentSchedule implements OnInit {
  private readonly studentPortalService = inject(StudentPortalService);

  readonly isLoading = signal<boolean>(true);
  readonly mySubjects = signal<MySubjectResponseDTO[]>([]);
  readonly error = signal<string>('');

  readonly days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  readonly timeSlots = computed<ScheduleSlot[]>(() => {
    const subjects = this.mySubjects();
    if (subjects.length === 0) return [];

    const slots: ScheduleSlot[] = [
      { time: '07:30 - 09:00' },
      { time: '09:15 - 10:45' },
      { time: '11:00 - 12:30' },
      { time: '18:30 - 20:00' },
      { time: '20:15 - 21:45' }
    ];

    subjects.forEach((sub, index) => {
      const slotIndex = index % slots.length;
      const isMonWedFri = index % 2 === 0;
      const classroom = `Aula ${300 + (index * 4) + 1}`;

      if (isMonWedFri) {
        slots[slotIndex].monday = { ...sub, classroom };
        slots[slotIndex].wednesday = { ...sub, classroom };
        slots[slotIndex].friday = { ...sub, classroom };
      } else {
        slots[slotIndex].tuesday = { ...sub, classroom };
        slots[slotIndex].thursday = { ...sub, classroom };
      }
    });

    return slots;
  });

  ngOnInit(): void {
    this.loadScheduleData();
  }

  loadScheduleData(): void {
    this.isLoading.set(true);
    this.error.set('');

    this.studentPortalService.getMySubjects().subscribe({
      next: (subjects) => {
        this.mySubjects.set(subjects);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Error al conectar con la base de datos de horarios.');
        this.isLoading.set(false);
      }
    });
  }
}
