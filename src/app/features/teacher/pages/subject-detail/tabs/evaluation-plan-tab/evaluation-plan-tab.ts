import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvaluationPlanService, ComponentRequest } from '../../../../services/evaluation-plan.service';
import { Button } from '../../../../../../shared/components/button/button';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';

@Component({
  selector: 'app-evaluation-plan-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './evaluation-plan-tab.html',
  styleUrl: './evaluation-plan-tab.css'
})
export class EvaluationPlanTab {
  readonly service = inject(EvaluationPlanService);
  private readonly operationalService = inject(SubjectOperationalService);

  newName = '';
  newWeight = 0;
  newDescription = '';



  handleCreate() {
    const subjectId = this.operationalService.subject()?.id?.toString();
    if (subjectId) {
      this.service.createPlan(subjectId).subscribe();
    }
  }

  handleAddComponent() {
    const plan = this.service.plan();
    if (!plan || !this.newName || !this.newWeight) return;

    const request: ComponentRequest = {
      name: this.newName,
      weight: this.newWeight,
      description: this.newDescription,
      planId: plan.id,
    };

    this.service.addComponent(request).subscribe(() => {
      this.newName = '';
      this.newWeight = 0;
      this.newDescription = '';
    });
  }

  handleDelete(componentId: number) {
    this.service.deleteComponent(componentId).subscribe();
  }

  handleActivate() {
    const subjectId = this.operationalService.subject()?.id?.toString();
    if (subjectId) {
      this.service.activatePlan(subjectId).subscribe();
    }
  }
}