import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvaluationPlanService, ComponentRequest } from '../../../../services/evaluation-plan.service';
import { Button } from '../../../../../../shared/components/button/button';
import { Input } from '../../../../../../shared/components/input/input';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { AuthService } from '../../../../../../core/services/auth.service'; 

@Component({
  selector: 'app-evaluation-plan-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Input],
  templateUrl: './evaluation-plan-tab.html',
  styleUrl: './evaluation-plan-tab.css'
})
export class EvaluationPlanTab implements OnInit {
  readonly service = inject(EvaluationPlanService);
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly authService = inject(AuthService);

  // Signal reactivo para manejar los privilegios de vista en base al rol
  readonly isAdmin = signal<boolean>(false); 

  // Variables de formulario migradas a Signals (Cumplimiento de DoD)
  readonly newName = signal('');
  readonly newWeight = signal<string>(''); 
  readonly newDescription = signal('');
  
  // Mantiene el ID del componente que se está editando (null si es creación)
  readonly editingId = signal<number | null>(null);

  ngOnInit() {
    // Solución de seguridad: Buscamos el rol de forma directa y segura en el almacenamiento local
    const savedRole = localStorage.getItem('role') || 'TEACHER';
    this.isAdmin.set(savedRole.toUpperCase() === 'ADMIN');
  }

  handleCreate() {
    const subjectId = this.operationalService.subject()?.id?.toString();
    if (subjectId) {
      this.service.createPlan(subjectId).subscribe();
    }
  }

  // Tipado estricto estructurado sin usar "any"
  startEdit(component: { id: number; name: string; weight: number; description?: string }) {
    this.editingId.set(component.id);
    this.newName.set(component.name);
    this.newWeight.set(String(component.weight));
    this.newDescription.set(component.description || '');
  }

  cancelEdit() {
    this.editingId.set(null);
    this.newName.set('');
    this.newWeight.set('');
    this.newDescription.set('');
  }

  handleSaveComponent() {
    const plan = this.service.plan();
    const name = this.newName();
    const weight = Number(this.newWeight());

    if (!plan || !name || !weight || weight <= 0) return;

    const request: ComponentRequest = {
      name: name,
      weight: weight,
      description: this.newDescription(),
      planId: plan.id,
    };

    const currentEditId = this.editingId();

    if (currentEditId) {
      // Flujo de edición: Invoca el nuevo método agregado en tu servicio frontend
      this.service.updateComponent(currentEditId, request).subscribe(() => {
        this.cancelEdit(); 
      });
    } else {
      // Flujo de creación ordinario para administradores
      this.service.addComponent(request).subscribe(() => {
        this.cancelEdit(); 
      });
    }
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