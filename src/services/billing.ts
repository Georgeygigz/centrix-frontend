import apiService from './api';
import { 
  BillingDashboardResponse, 
  SchoolsBillingResponse,
  BillingFeaturesResponse,
  BillingPlansResponse,
  SchoolSubscriptionsResponse,
  InvoicesResponse
} from '../types/billing';

// Dashboard API calls
export const billingService = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<BillingDashboardResponse> => {
    try {
      const response = await apiService.authenticatedRequest('/billing/dashboard/', { method: 'GET' });
      return { success: true, data: response };
    } catch (error) {
      throw new Error('Failed to fetch dashboard statistics');
    }
  },

  // Get schools with billing status
  getSchoolsBilling: async (): Promise<SchoolsBillingResponse> => {
    try {
      const response = await apiService.authenticatedRequest('/billing/schools/', { method: 'GET' });
      return { success: true, data: response };
    } catch (error) {
      throw new Error('Failed to fetch schools billing data');
    }
  },



  createBillingFeature: async (featureData: any): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest('/billing/features/', {
        method: 'POST',
        body: JSON.stringify(featureData),
      });
      return response;
    } catch (error) {
      throw new Error('Failed to create billing feature');
    }
  },

  updateBillingFeature: async (id: string, featureData: any): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest(`/billing/features/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(featureData),
      });
      return response;
    } catch (error) {
      throw new Error('Failed to update billing feature');
    }
  },

  deleteBillingFeature: async (id: string): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest(`/billing/features/${id}/`, { method: 'DELETE' });
      return response;
    } catch (error) {
      throw new Error('Failed to delete billing feature');
    }
  },

  // Billing Plans API calls
  getBillingPlans: async (params?: { ordering?: string; page?: number; search?: string }): Promise<BillingPlansResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.ordering) queryParams.append('ordering', params.ordering);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const url = `/billing/plans/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Making API call to:', url);
      
      const response = await apiService.authenticatedRequest(url, { method: 'GET' });
      console.log('API response:', response);
      return response;
    } catch (error) {
      console.error('Billing API error:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        response: (error as any).response,
        status: (error as any).response?.status
      });
      throw new Error(`Failed to fetch billing plans: ${(error as Error).message}`);
    }
  },

  createBillingPlan: async (planData: any): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest('/billing/plans/', {
        method: 'POST',
        body: JSON.stringify(planData),
      });
      return response;
    } catch (error) {
      throw new Error('Failed to create billing plan');
    }
  },

  updateBillingPlan: async (id: string, planData: any): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest(`/billing/plans/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(planData),
      });
      return response;
    } catch (error) {
      throw new Error('Failed to update billing plan');
    }
  },

  deleteBillingPlan: async (id: string): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest(`/billing/plans/${id}/`, { method: 'DELETE' });
      return response;
    } catch (error) {
      throw new Error('Failed to delete billing plan');
    }
  },

  getPlanFeatures: async (planId: string): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest(`/billing/plans/${planId}/features/`, { method: 'GET' });
      return response;
    } catch (error) {
      throw new Error('Failed to fetch plan features');
    }
  },

  getBillingFeatures: async (params?: { ordering?: string; page?: number; search?: string }): Promise<BillingFeaturesResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.ordering) queryParams.append('ordering', params.ordering);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const url = `/billing/features/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Making API call to:', url);
      
      const response = await apiService.authenticatedRequest(url, { method: 'GET' });
      console.log('API response:', response);
      return response;
    } catch (error) {
      console.error('Billing Features API error:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        response: (error as any).response,
        status: (error as any).response?.status
      });
      throw new Error(`Failed to fetch billing features: ${(error as Error).message}`);
    }
  },

  addFeatureToPlan: async (planId: string, featureData: any): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest(`/billing/plans/${planId}/features/`, {
        method: 'POST',
        body: JSON.stringify(featureData),
      });
      return response;
    } catch (error) {
      throw new Error('Failed to add feature to plan');
    }
  },

  // School Subscriptions API calls
  getSchoolSubscriptions: async (params?: { ordering?: string; page?: number; search?: string }): Promise<SchoolSubscriptionsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.ordering) queryParams.append('ordering', params.ordering);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const url = `/billing/subscriptions/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Making API call to:', url);
      
      const response = await apiService.authenticatedRequest(url, { method: 'GET' });
      console.log('API response:', response);
      return response;
    } catch (error) {
      console.error('School Subscriptions API error:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        response: (error as any).response,
        status: (error as any).response?.status
      });
      throw new Error(`Failed to fetch school subscriptions: ${(error as Error).message}`);
    }
  },

  updateSchoolSubscription: async (id: string, subscriptionData: any): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest(`/billing/subscriptions/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(subscriptionData),
      });
      return response;
    } catch (error) {
      throw new Error('Failed to update school subscription');
    }
  },

  // Invoices API calls
  getInvoices: async (): Promise<InvoicesResponse> => {
    try {
      const response = await apiService.authenticatedRequest('/billing/invoices/', { method: 'GET' });
      return response as InvoicesResponse;
    } catch (error) {
      throw new Error('Failed to fetch invoices');
    }
  },

  getInvoiceDetails: async (id: string): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest(`/billing/invoices/${id}/`, { method: 'GET' });
      return response;
    } catch (error) {
      throw new Error('Failed to fetch invoice details');
    }
  },

  sendInvoice: async (id: string): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest(`/billing/invoices/${id}/send/`, { method: 'POST' });
      return response;
    } catch (error) {
      throw new Error('Failed to send invoice');
    }
  },

  voidInvoice: async (id: string): Promise<any> => {
    try {
      const response = await apiService.authenticatedRequest(`/billing/invoices/${id}/void/`, { method: 'POST' });
      return response;
    } catch (error) {
      throw new Error('Failed to void invoice');
    }
  },
};

export default billingService;
