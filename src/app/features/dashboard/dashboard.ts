import { Component, inject, OnInit, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/services/auth/auth';
import { ManagementListComponent } from '../../pages/academic-management/management-list/management-list';
import { StudentSubjectsComponent } from '../../pages/student/student-subjects/student-subjects';
import { TeacherSubjectsComponent } from '../../pages/teacher/teacher-subjects/teacher-subjects';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page-wrapper">
    <div class="page-header">
      <h1 class="page-title">Panel de Control</h1>
      <p class="page-subtitle">Bienvenido(a), {{ userName }} ({{ userRole }})</p>
    </div>

    <div class="page-content">
      <ng-container *ngComponentOutlet="componentToRender"></ng-container>
    </div>
  </div>
  `
})
export class Dashboard implements OnInit {
  userName = '';
  userRole = '';
  componentToRender: Type<any> | null = null;

  private readonly auth = inject(Auth);

  ngOnInit() {
    this.userName = localStorage.getItem('fullName') || 'Usuario Desconocido';
    this.userRole = this.auth.getRole() || 'SIN_ROL';
    this.resolveComponent();
  }

  private resolveComponent() {
    switch (this.userRole) {
      case 'ADMIN':
        this.componentToRender = ManagementListComponent;
        break;
      case 'TEACHER':
        this.componentToRender = TeacherSubjectsComponent;
        break;
      case 'STUDENT':
        this.componentToRender = StudentSubjectsComponent;
        break;
      default:
        this.componentToRender = null;
    }
  }
}
