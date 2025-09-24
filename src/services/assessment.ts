// Assessment API Service - Based on ASSESSMENT_FE_IMPLEMENTATION_GUIDE.md

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { apiService } from './api';
import {
  CompetencyFramework,
  AssessmentTool,
  StudentAssessment,
  TermPerformance,
  AnnualPerformance,
  CompetencyRating,
  PerformanceAnalytics,
  StudentProgress,
  ClassComparison,
  CreateAssessmentToolRequest,
  CreateStudentAssessmentRequest,
  BulkCreateStudentResultsRequest,
  CreateCompetencyRatingRequest,
  CalculateTermPerformanceRequest,
  CalculateAnnualPerformanceRequest,
  AssessmentApiResponse,
  AssessmentAnalyticsResponse,
  AssessmentToolFilters,
  StudentAssessmentFilters,
  CompetencyFrameworkFilters,
  PerformanceFilters,
  LearningOutcome,
  Subject,
  ClassLevel,
  StudentAdmission
} from '../types/assessment';

class AssessmentService {
  private baseUrl = '/api/v1/assessment';

  // Helper method to make API calls
  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Competency Framework Management
  async getCompetencyFrameworks(filters?: CompetencyFrameworkFilters): Promise<AssessmentApiResponse<CompetencyFramework>> {
    const params = new URLSearchParams();
    
    if (filters?.grade_level) params.append('grade_level', filters.grade_level);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.ordering) params.append('ordering', filters.ordering);

    return this.makeRequest(`${this.baseUrl}/competency-frameworks/?${params.toString()}`, { method: 'GET' });
  }

  async getCompetencyFramework(id: string): Promise<CompetencyFramework> {
    return this.makeRequest(`${this.baseUrl}/competency-frameworks/${id}/`, { method: 'GET' });
  }

  async createCompetencyFramework(data: Partial<CompetencyFramework>): Promise<CompetencyFramework> {
    return this.makeRequest(`${this.baseUrl}/competency-frameworks/`, { 
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCompetencyFramework(id: string, data: Partial<CompetencyFramework>): Promise<CompetencyFramework> {
    return this.makeRequest(`${this.baseUrl}/competency-frameworks/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCompetencyFramework(id: string): Promise<void> {
    await this.makeRequest(`${this.baseUrl}/competency-frameworks/${id}/`, { method: 'DELETE' });
  }

  async getFrameworkStrands(id: string): Promise<LearningOutcome[]> {
    return this.makeRequest(`${this.baseUrl}/competency-frameworks/${id}/strands/`, { method: 'GET' });
  }

  // Assessment Tool Management
  async getAssessmentTools(filters?: AssessmentToolFilters): Promise<AssessmentApiResponse<AssessmentTool>> {
    const params = new URLSearchParams();
    
    if (filters?.class_level) params.append('class_level', filters.class_level);
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.term) params.append('term', filters.term.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.assessment_type) params.append('assessment_type', filters.assessment_type);
    if (filters?.is_published !== undefined) params.append('is_published', filters.is_published.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.ordering) params.append('ordering', filters.ordering);

    return this.makeRequest(`${this.baseUrl}/assessment-tools/?${params.toString()}`, { method: 'GET' });
  }

  async getAssessmentTool(id: string): Promise<AssessmentTool> {
    return this.makeRequest(`${this.baseUrl}/assessment-tools/${id}/`, { method: 'GET' });
  }

  async createAssessmentTool(data: CreateAssessmentToolRequest): Promise<AssessmentTool> {
    return this.makeRequest(`${this.baseUrl}/assessment-tools/`, { 
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateAssessmentTool(id: string, data: Partial<CreateAssessmentToolRequest>): Promise<AssessmentTool> {
    return this.makeRequest(`${this.baseUrl}/assessment-tools/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteAssessmentTool(id: string): Promise<void> {
    await this.makeRequest(`${this.baseUrl}/assessment-tools/${id}/`, { method: 'DELETE' });
  }

  async publishAssessment(id: string): Promise<AssessmentTool> {
    return this.makeRequest(`${this.baseUrl}/assessment-tools/${id}/publish/`, { method: 'POST' });
  }

  async unpublishAssessment(id: string): Promise<AssessmentTool> {
    return this.makeRequest(`${this.baseUrl}/assessment-tools/${id}/unpublish/`, { method: 'POST' });
  }

  async getAssessmentResults(id: string): Promise<StudentAssessment[]> {
    return this.makeRequest(`${this.baseUrl}/assessment-tools/${id}/results/`, { method: 'GET' });
  }

  async bulkCreateStudentResults(data: BulkCreateStudentResultsRequest): Promise<StudentAssessment[]> {
    return this.makeRequest(`${this.baseUrl}/assessment-tools/bulk_create_results/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Student Assessment Management
  async getStudentAssessments(filters?: StudentAssessmentFilters): Promise<AssessmentApiResponse<StudentAssessment>> {
    const params = new URLSearchParams();
    
    if (filters?.assessment) params.append('assessment', filters.assessment);
    if (filters?.student) params.append('student', filters.student);
    if (filters?.grade) params.append('grade', filters.grade);
    if (filters?.term) params.append('term', filters.term.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.ordering) params.append('ordering', filters.ordering);

    return this.makeRequest(`${this.baseUrl}/student-assessments/?${params.toString()}`, { method: 'GET' });
  }

  async getStudentAssessment(id: string): Promise<StudentAssessment> {
    return this.makeRequest(`${this.baseUrl}/student-assessments/${id}/`, { method: 'GET' });
  }

  async createStudentAssessment(data: CreateStudentAssessmentRequest): Promise<StudentAssessment> {
    return this.makeRequest(`${this.baseUrl}/student-assessments/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateStudentAssessment(id: string, data: Partial<CreateStudentAssessmentRequest>): Promise<StudentAssessment> {
    return this.makeRequest(`${this.baseUrl}/student-assessments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteStudentAssessment(id: string): Promise<void> {
    await this.makeRequest(`${this.baseUrl}/student-assessments/${id}/`, { method: 'DELETE' });
  }

  // Performance Management
  async calculateTermPerformance(data: CalculateTermPerformanceRequest): Promise<TermPerformance[]> {
    return this.makeRequest(`${this.baseUrl}/term-performances/calculate_term_performance/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getClassRankings(filters: PerformanceFilters): Promise<TermPerformance[]> {
    const params = new URLSearchParams();
    
    if (filters.class_level) params.append('class_level', filters.class_level);
    if (filters.term) params.append('term', filters.term.toString());
    if (filters.year) params.append('year', filters.year.toString());

    return this.makeRequest(`${this.baseUrl}/term-performances/class_rankings/?${params.toString()}`, { method: 'GET' });
  }

  async getTermPerformances(filters?: PerformanceFilters): Promise<AssessmentApiResponse<TermPerformance>> {
    const params = new URLSearchParams();
    
    if (filters?.class_level) params.append('class_level', filters.class_level);
    if (filters?.term) params.append('term', filters.term.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.student_id) params.append('student', filters.student_id);

    return this.makeRequest(`${this.baseUrl}/term-performances/?${params.toString()}`, { method: 'GET' });
  }

  async calculateAnnualPerformance(data: CalculateAnnualPerformanceRequest): Promise<AnnualPerformance[]> {
    return this.makeRequest(`${this.baseUrl}/annual-performances/calculate_annual_performance/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAnnualPerformances(filters?: PerformanceFilters): Promise<AssessmentApiResponse<AnnualPerformance>> {
    const params = new URLSearchParams();
    
    if (filters?.class_level) params.append('class_level', filters.class_level);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.student_id) params.append('student', filters.student_id);

    return this.makeRequest(`${this.baseUrl}/annual-performances/?${params.toString()}`, { method: 'GET' });
  }

  // Competency Rating Management
  async getCompetencyRatings(filters?: PerformanceFilters): Promise<AssessmentApiResponse<CompetencyRating>> {
    const params = new URLSearchParams();
    
    if (filters?.student_id) params.append('student', filters.student_id);
    if (filters?.term) params.append('term', filters.term.toString());
    if (filters?.year) params.append('year', filters.year.toString());

    return this.makeRequest(`${this.baseUrl}/competency-ratings/?${params.toString()}`, { method: 'GET' });
  }

  async createCompetencyRating(data: CreateCompetencyRatingRequest): Promise<CompetencyRating> {
    return this.makeRequest(`${this.baseUrl}/competency-ratings/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCompetencyRating(id: string, data: Partial<CreateCompetencyRatingRequest>): Promise<CompetencyRating> {
    return this.makeRequest(`${this.baseUrl}/competency-ratings/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCompetencyRating(id: string): Promise<void> {
    await this.makeRequest(`${this.baseUrl}/competency-ratings/${id}/`, { method: 'DELETE' });
  }

  // Analytics and Reporting
  async getAssessmentAnalytics(): Promise<AssessmentAnalyticsResponse> {
    return this.makeRequest(`${this.baseUrl}/assessment-analytics/`, { method: 'GET' });
  }

  async getPerformanceOverview(filters: PerformanceFilters): Promise<PerformanceAnalytics> {
    const params = new URLSearchParams();
    
    if (filters.class_level) params.append('class_level', filters.class_level);
    if (filters.term) params.append('term', filters.term.toString());
    if (filters.year) params.append('year', filters.year.toString());

    return this.makeRequest(`${this.baseUrl}/assessment-analytics/performance_overview/?${params.toString()}`, { method: 'GET' });
  }

  async getStudentProgress(filters: PerformanceFilters): Promise<StudentProgress> {
    const params = new URLSearchParams();
    
    if (filters.student_id) params.append('student_id', filters.student_id);
    if (filters.year) params.append('year', filters.year.toString());

    return this.makeRequest(`${this.baseUrl}/assessment-analytics/student_progress/?${params.toString()}`, { method: 'GET' });
  }

  async getClassComparison(filters: PerformanceFilters): Promise<ClassComparison> {
    const params = new URLSearchParams();
    
    if (filters.class_levels) {
      filters.class_levels.forEach(level => params.append('class_levels', level));
    }
    if (filters.term) params.append('term', filters.term.toString());
    if (filters.year) params.append('year', filters.year.toString());

    return this.makeRequest(`${this.baseUrl}/assessment-analytics/class_comparison/?${params.toString()}`, { method: 'GET' });
  }

  // Helper methods for dropdowns and selections
  async getSubjects(): Promise<Subject[]> {
    const response = await this.makeRequest(`${this.baseUrl}/subjects/`, { method: 'GET' });
    return response.results || response;
  }

  async getSubjectsWithFilters(filters?: { search?: string; page?: number; page_size?: number; ordering?: string; is_active?: boolean }): Promise<AssessmentApiResponse<Subject>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.ordering) params.append('ordering', filters.ordering);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    const response = await this.makeRequest(`${this.baseUrl}/subjects/?${params.toString()}`, { method: 'GET' });
    return response;
  }

  async getClassLevels(): Promise<ClassLevel[]> {
    // This would typically come from a classes API endpoint
    // For now, we'll return a mock response or use a different endpoint
    const response = await this.makeRequest('/api/v1/classes/', { method: 'GET' });
    return response.results || response;
  }

  async getStudents(classLevel?: string): Promise<StudentAdmission[]> {
    const params = new URLSearchParams();
    if (classLevel) params.append('class_level', classLevel);
    
    const response = await this.makeRequest(`/api/v1/students/?${params.toString()}`, { method: 'GET' });
    return response.results || response;
  }

  // Utility methods
  calculateGrade(percentage: number): string {
    if (percentage >= 80) return 'A';
    if (percentage >= 75) return 'A-';
    if (percentage >= 70) return 'B+';
    if (percentage >= 65) return 'B';
    if (percentage >= 60) return 'B-';
    if (percentage >= 55) return 'C+';
    if (percentage >= 50) return 'C';
    if (percentage >= 45) return 'C-';
    if (percentage >= 40) return 'D+';
    if (percentage >= 35) return 'D';
    if (percentage >= 30) return 'D-';
    return 'E';
  }

  calculatePoints(grade: string): number {
    const gradePoints: Record<string, number> = {
      'A': 12,
      'A-': 11,
      'B+': 10,
      'B': 9,
      'B-': 8,
      'C+': 7,
      'C': 6,
      'C-': 5,
      'D+': 4,
      'D': 3,
      'D-': 2,
      'E': 1,
      'AB': 0
    };
    return gradePoints[grade] || 0;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const assessmentService = new AssessmentService();
