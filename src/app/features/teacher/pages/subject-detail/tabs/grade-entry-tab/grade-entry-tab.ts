import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GradeService } from '../../../../services/grade.service';
import { Button } from '../../../../../../shared/components/button/button';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-grade-entry-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Button],
  templateUrl: 'grade-entry-tab.html',
  styleUrl: 'grade-entry-tab.css',
})
export class GradeEntryTab {
  readonly service = inject(GradeService);
  private readonly toast = inject(ToastService);

  constructor() {
    effect(
      () => {
        const errorMessage = this.service.error();

        if (errorMessage) {
          this.toast.error(errorMessage, 'Guardado de notas');
          this.service.clearError();
        }
      },
      { allowSignalWrites: true },
    );
  }

  handleComponentChange(componentId: number) {
    this.service.selectComponent(componentId);
    this.service.clearError();
  }

  handleGradeChange(studentId: string, value: number | null) {
    this.service.updateGrade(studentId, value);
    this.service.clearError();
  }

  handleSave(studentId: string) {
    this.service.saveGrade(studentId).subscribe();
  }
}