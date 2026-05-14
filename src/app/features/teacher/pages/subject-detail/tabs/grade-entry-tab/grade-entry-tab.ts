import { Component, input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GradeService } from '../../../../services/grade.service';
import { Button } from '../../../../../../shared/components/button/button';

@Component({
  selector: 'app-grade-entry-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Button],
  templateUrl: 'grade-entry-tab.html',
  styleUrl: 'grade-entry-tab.css',
})
export class GradeEntryTabComponent implements OnInit {
  readonly subjectId = input.required<string>();
  readonly service = inject(GradeService);

  ngOnInit() {
    this.service.loadData(this.subjectId()).subscribe();
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