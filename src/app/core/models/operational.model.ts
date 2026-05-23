export interface StudentOperational {
    studentId: string;
    enrollmentId?: string;
    fullName: string;
    ci?: string;
    email?: string;
    degreeName?: string;
    photoUrl?: string;
}

export interface EvaluationComponent {
    id: number;
    name: string;
    weight: number;
    description: string;
}

export interface EvaluationPlan {
    id: number;
    subjectId: number;
    components: EvaluationComponent[];
}
