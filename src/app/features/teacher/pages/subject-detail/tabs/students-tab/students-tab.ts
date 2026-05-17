import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importa los servicios correctos
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';

// Importa los Átomos del equipo
import { Table } from '../../../../../../shared/components/table/table';
import { Input } from '../../../../../../shared/components/input/input';
import { Loader } from '../../../../../../shared/components/loader/loader';
import { Button } from '../../../../../../shared/components/button/button'; 

@Component({
  selector: 'app-students-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Table, Loader, Input, Button], 
  templateUrl: './students-tab.html',
  styleUrl: './students-tab.css'
})
export class StudentsTab {
  private readonly operationalService = inject(SubjectOperationalService);
  // Los datos fluyen mágicamente desde el cerebro central
  readonly students = this.operationalService.students;
  readonly isLoading = this.operationalService.isLoading;
}
