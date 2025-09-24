// Assessment Types - Based on ASSESSMENT_FE_IMPLEMENTATION_GUIDE.md

export type GradeLevel = 'pp1' | 'pp2' | 'grade1' | 'grade2' | 'grade3' | 'grade4' | 'grade5' | 'grade6' | 'grade7' | 'grade8' | 'grade9' | 'grade10' | 'grade11' | 'grade12';

export type AssessmentType = 'exam' | 'test' | 'assignment' | 'project' | 'practical' | 'observation' | 'portfolio' | 'oral' | 'aural';

export type Term = 1 | 2 | 3;

export type Grade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'E' | 'AB';

// Subject interface (referenced in assessments)
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Class interface (referenced in assessments)
export interface ClassLevel {
  id: string;
  name: string;
  code: string;
  grade_level: GradeLevel;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Student interface (referenced in assessments)
export interface StudentAdmission {
  id: string;
  admission_number: string;
  pupil_name: string;
  class_level: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// User interface (referenced in assessments)
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Learning Outcome interface
export interface LearningOutcome {
  id: string;
  code: string;
  description: string;
  competency_framework: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Competency Framework
export interface CompetencyFramework {
  id: string;
  name: string;
  code: string;
  description: string;
  grade_level: GradeLevel;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

// Assessment Tool
export interface AssessmentTool {
  id: string;
  name: string;
  assessment_type: AssessmentType;
  subject: string; // Subject ID
  subject_details?: Subject;
  class_level: string; // Class ID
  class_level_details?: ClassLevel;
  term: Term;
  year: number;
  maximum_score: string; // Decimal as string
  weight: string; // Decimal as string (percentage)
  date_administered: string; // ISO date
  due_date?: string; // ISO date
  instructions?: string;
  is_published: boolean;
  published_at?: string; // ISO datetime
  competency_framework?: string; // Framework ID
  competency_framework_details?: CompetencyFramework;
  learning_outcomes: string[]; // Learning outcome IDs
  learning_outcomes_details?: LearningOutcome[];
  created_at: string;
  updated_at: string;
}

// Student Assessment
export interface StudentAssessment {
  id: string;
  assessment: string; // Assessment tool ID
  assessment_details?: AssessmentTool;
  student: string; // Student ID
  student_details?: StudentAdmission;
  score: string; // Decimal as string
  percentage_score: string; // Decimal as string (auto-calculated)
  grade: Grade;
  points: string; // Decimal as string (Kenyan grading system)
  teacher_comments?: string;
  assessed_by?: string; // User ID
  assessed_by_details?: User;
  assessed_at: string; // ISO datetime
  is_absent: boolean;
  is_exempt: boolean;
  competency_ratings: Record<string, any>; // JSON field for CBC ratings
  created_at: string;
  updated_at: string;
}

// Term Performance
export interface TermPerformance {
  id: string;
  student: string; // Student ID
  student_details?: StudentAdmission;
  class_level: string; // Class ID
  class_level_details?: ClassLevel;
  term: Term;
  year: number;
  total_score: string; // Decimal as string
  average_score: string; // Decimal as string
  average_grade: Grade;
  average_points: string; // Decimal as string
  position: number; // Class ranking
  total_students: number;
  teacher_comments?: string;
  principal_comments?: string;
  subject_performance: Record<string, any>; // JSON breakdown by subject
  competency_summary: Record<string, any>; // JSON CBC summary
  created_at: string;
  updated_at: string;
}

// Annual Performance
export interface AnnualPerformance {
  id: string;
  student: string; // Student ID
  student_details?: StudentAdmission;
  class_level: string; // Class ID
  class_level_details?: ClassLevel;
  year: number;
  total_score: string; // Decimal as string
  average_score: string; // Decimal as string
  average_grade: Grade;
  average_points: string; // Decimal as string
  position: number; // Class ranking
  total_students: number;
  term_breakdown: Record<string, any>; // JSON breakdown by term
  subject_performance: Record<string, any>; // JSON breakdown by subject
  competency_summary: Record<string, any>; // JSON CBC summary
  created_at: string;
  updated_at: string;
}

// Competency Rating
export interface CompetencyRating {
  id: string;
  student: string; // Student ID
  student_details?: StudentAdmission;
  learning_outcome: string; // Learning outcome ID
  learning_outcome_details?: LearningOutcome;
  term: Term;
  year: number;
  rating: number; // 1-4 scale
  comments?: string;
  evidence?: string;
  artifacts: string[]; // Array of file paths/URLs
  assessed_by?: string; // User ID
  assessed_by_details?: User;
  assessed_at: string; // ISO datetime
  created_at: string;
  updated_at: string;
}

// Performance Analytics
export interface PerformanceAnalytics {
  class_info: {
    id: string;
    name: string;
  };
  term: Term;
  year: number;
  performance_summary: {
    total_students: number;
    average_score: number;
    min_score: number;
    max_score: number;
  };
  grade_distribution: Record<Grade, number>;
  subject_performance: Record<string, {
    subject_name: string;
    average_score: number;
    min_score: number;
    max_score: number;
    grades: Record<Grade, number>;
  }>;
  top_performers: Array<{
    position: number;
    student_id: string;
    student_name: string;
    average_score: number;
    average_grade: Grade;
  }>;
}

// Student Progress
export interface StudentProgress {
  student_info: {
    id: string;
    admission_number: string;
    pupil_name: string;
  };
  year: number;
  term_performance: Array<{
    term: Term;
    average_score: number;
    average_grade: Grade;
    position: number;
    total_students: number;
  }>;
  subject_breakdown: Array<{
    subject_name: string;
    average_score: number;
    average_grade: Grade;
  }>;
  competency_trends: Record<string, Array<{
    term: Term;
    rating: number;
  }>>;
}

// Class Comparison
export interface ClassComparison {
  classes: Array<{
    class_id: string;
    class_name: string;
    average_score: number;
    total_students: number;
    grade_distribution: Record<Grade, number>;
  }>;
  term: Term;
  year: number;
}

// API Request/Response Types
export interface CreateAssessmentToolRequest {
  name: string;
  assessment_type: AssessmentType;
  subject: string;
  class_level: string;
  term: Term;
  year: number;
  maximum_score: string;
  weight: string;
  date_administered: string;
  due_date?: string;
  instructions?: string;
  competency_framework?: string;
  learning_outcomes?: string[];
}

export interface CreateStudentAssessmentRequest {
  assessment: string;
  student: string;
  score: string;
  teacher_comments?: string;
  is_absent?: boolean;
  is_exempt?: boolean;
  competency_ratings?: Record<string, any>;
}

export interface BulkCreateStudentResultsRequest {
  assessments: Array<{
    assessment: string;
    student: string;
    score: string;
    teacher_comments?: string;
    is_absent?: boolean;
    is_exempt?: boolean;
  }>;
}

export interface CreateCompetencyFrameworkRequest {
  name: string;
  code: string;
  description: string;
  grade_level: GradeLevel;
  is_active: boolean;
  order: number;
}

export interface CreateCompetencyRatingRequest {
  student: string;
  learning_outcome: string;
  term: Term;
  year: number;
  rating: number;
  comments?: string;
  evidence?: string;
  artifacts?: string[];
}

export interface CalculateTermPerformanceRequest {
  class_level: string;
  term: Term;
  year: number;
}

export interface CalculateAnnualPerformanceRequest {
  class_level: string;
  year: number;
}

// API Response Types
export interface AssessmentApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface AssessmentAnalyticsResponse {
  performance_overview: PerformanceAnalytics;
  student_progress: StudentProgress;
  class_comparison: ClassComparison;
}

// Filter and Query Types
export interface AssessmentToolFilters {
  class_level?: string;
  subject?: string;
  term?: Term;
  year?: number;
  assessment_type?: AssessmentType;
  is_published?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface StudentAssessmentFilters {
  assessment?: string;
  student?: string;
  grade?: Grade;
  term?: Term;
  year?: number;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface CompetencyFrameworkFilters {
  grade_level?: GradeLevel;
  is_active?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface PerformanceFilters {
  class_level?: string;
  term?: Term;
  year?: number;
  student_id?: string;
  class_levels?: string[];
}
