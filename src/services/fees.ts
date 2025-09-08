import { apiService } from './api';
import { FeeStructure, FeeStructureResponse, PaginationParams, CreateFeeAssignmentRequest, StudentsResponse, FeeAssignmentsResponse, FeeInvoicesResponse, InvoiceQueryParams, GenerateTermInvoicesRequest, GenerateTermInvoicesResponse, CreatePaymentRequest, FeePaymentsResponse, PaymentQueryParams } from '../types/fees';

class FeesService {
  // Fee Structures
  async getAllFeeStructures(params?: PaginationParams): Promise<FeeStructureResponse> {
    let url = '/fees/structures/';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const response = await apiService.authenticatedRequest(url, { method: 'GET' });
    return response;
  }

  async getFeeStructure(id: string): Promise<FeeStructure> {
    const response = await apiService.authenticatedRequest(`/fees/structures/${id}/`, { method: 'GET' });
    return response;
  }

  async createFeeStructure(data: Partial<FeeStructure>): Promise<FeeStructure> {
    const response = await apiService.authenticatedRequest('/fees/structures/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  }

  async updateFeeStructure(id: string, data: Partial<FeeStructure>): Promise<FeeStructure> {
    const response = await apiService.authenticatedRequest(`/fees/structures/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response;
  }

  async patchFeeStructure(id: string, data: Partial<FeeStructure>): Promise<FeeStructure> {
    const response = await apiService.authenticatedRequest(`/fees/structures/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response;
  }

  async deleteFeeStructure(id: string): Promise<void> {
    await apiService.authenticatedRequest(`/fees/structures/${id}/`, { method: 'DELETE' });
  }

  // Student Fee Assignments
  async getAllAssignments(params?: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<FeeAssignmentsResponse> {
    let url = '/fees/assignments/';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const response = await apiService.authenticatedRequest(url, { method: 'GET' });
    return response;
  }

  async createAssignment(data: CreateFeeAssignmentRequest): Promise<any> {
    const response = await apiService.authenticatedRequest('/fees/assignments/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  }

  async bulkAssignFees(data: any): Promise<any> {
    const response = await apiService.authenticatedRequest('/fees/assignments/bulk_assign/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  }

  // Fee Invoices
  async getAllInvoices(params?: InvoiceQueryParams): Promise<FeeInvoicesResponse> {
    let url = '/fees/invoices/';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const response = await apiService.authenticatedRequest(url, { method: 'GET' });
    return response;
  }

  async generateTermInvoices(data: GenerateTermInvoicesRequest): Promise<GenerateTermInvoicesResponse> {
    const response = await apiService.authenticatedRequest('/fees/invoices/generate_term_invoices/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  }

  async downloadInvoicePDF(id: string): Promise<any> {
    const response = await apiService.authenticatedRequest(`/fees/invoices/${id}/download_pdf/`, {
      method: 'GET'
    });
    return response;
  }

  // Fee Payments
  async getAllPayments(params?: PaymentQueryParams): Promise<FeePaymentsResponse> {
    let url = '/fees/payments/';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const response = await apiService.authenticatedRequest(url, { method: 'GET' });
    return response;
  }

  async createPayment(data: CreatePaymentRequest): Promise<any> {
    const response = await apiService.authenticatedRequest('/fees/payments/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  }

  // Fee Concessions
  async getAllConcessions(params?: any): Promise<any> {
    let url = '/fees/concessions/';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const response = await apiService.authenticatedRequest(url, { method: 'GET' });
    return response;
  }

  async createConcession(data: any): Promise<any> {
    const response = await apiService.authenticatedRequest('/fees/concessions/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  }

  // Fee Reports
  async getStudentFeeSummary(studentId: string, academicYear: string): Promise<any> {
    const url = `/fees/reports/student_summary/?student_id=${encodeURIComponent(studentId)}&academic_year=${encodeURIComponent(academicYear)}`;
    const response = await apiService.authenticatedRequest(url, { method: 'GET' });
    return response;
  }

  async getCollectionReport(startDate: string, endDate: string): Promise<any> {
    const url = `/fees/reports/collection_report/?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
    const response = await apiService.authenticatedRequest(url, { method: 'GET' });
    return response;
  }

  async getOutstandingReport(academicYear: string, overdueOnly?: boolean): Promise<any> {
    const url = `/fees/reports/outstanding_report/?academic_year=${encodeURIComponent(academicYear)}&overdue_only=${overdueOnly?.toString() || 'false'}`;
    const response = await apiService.authenticatedRequest(url, { method: 'GET' });
    return response;
  }

  // Students API
  async searchStudents(searchQuery: string): Promise<StudentsResponse> {
    const url = `/students/admissions?search=${encodeURIComponent(searchQuery)}`;
    const response = await apiService.authenticatedRequest(url, { method: 'GET' });
    return response;
  }

  // Fee Structures with search
  async searchFeeStructures(searchQuery: string): Promise<FeeStructureResponse> {
    const url = `/fees/structures/?search=${encodeURIComponent(searchQuery)}`;
    const response = await apiService.authenticatedRequest(url, { method: 'GET' });
    return response;
  }
}

export const feesService = new FeesService();
