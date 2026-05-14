import { Component, input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvaluationPlanService, ComponentRequest } from '../../../../services/evaluation-plan.service';
import { Button } from '../../../../../../shared/components/button/button';

@Component({
  selector: 'app-evaluation-plan-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './evaluation-plan-tab.html',
  styleUrl: './evaluation-plan-tab.css'
})
export class EvaluationPlanTab implements OnInit {
  readonly subjectId = input.required<string>();
  readonly service = inject(EvaluationPlanService);

  newName = '';
  newWeight = 0;
  newDescription = '';

  ngOnInit() {
    this.service.fetchPlan(this.subjectId()).subscribe();
  }

  handleCreate() {
    this.service.createPlan(this.subjectId()).subscribe();
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
    this.service.activatePlan(this.subjectId()).subscribe();
  }
}