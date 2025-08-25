import React, { useState, useEffect } from 'react';
import { FaDollarSign, FaUsers, FaExclamationTriangle, FaChartLine, FaSchool, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { BillingDashboardStats } from '../../types/billing';

const BillingDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<BillingDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development - replace with actual API calls
  const mockDashboardData: BillingDashboardStats = {
    revenue: {
      currentMonth: 1250000,
      lastMonth: 1180000,
      percentageChange: 5.93,
      currency: 'KES'
    },
    subscriptions: {
      totalActive: 45,
      byPlanType: [
        { planType: 'Basic', count: 15, percentage: 33.3 },
        { planType: 'Standard', count: 20, percentage: 44.4 },
        { planType: 'Premium', count: 8, percentage: 17.8 },
        { planType: 'Enterprise', count: 2, percentage: 4.4 }
      ],
      newThisMonth: 8
    },
    payments: {
      totalOutstanding: 450000,
      overdueInvoices: 12,
      successRate: 94.2
    },
    schoolActivity: {
      schoolsWithOverduePayments: 8,
      recentPayments: [
        { id: '1', schoolName: 'St. Mary\'s Academy', amount: 75000, date: '2024-01-15', status: 'completed' },
        { id: '2', schoolName: 'Bright Future School', amount: 120000, date: '2024-01-14', status: 'completed' },
        { id: '3', schoolName: 'Excellence Academy', amount: 95000, date: '2024-01-13', status: 'pending' }
      ],
      schoolsRequiringAttention: [
        { id: '1', name: 'Delayed Payment School', currentPlan: 'Premium', subscriptionStatus: 'overdue', lastPaymentDate: '2023-12-01', outstandingAmount: 150000, requiresAttention: true },
        { id: '2', name: 'Payment Issues Academy', currentPlan: 'Standard', subscriptionStatus: 'overdue', lastPaymentDate: '2023-12-15', outstandingAmount: 85000, requiresAttention: true }
      ]
    }
  };

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Replace with actual API call
        // const response = await api.get('/api/v1/billing/dashboard/');
        // setDashboardData(response.data.data);
        
        // Using mock data for now
        setTimeout(() => {
          setDashboardData(mockDashboardData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return FaCheckCircle({ className: "w-4 h-4 text-green-600" });
      case 'pending': return FaClock({ className: "w-4 h-4 text-yellow-600" });
      case 'failed': return FaTimesCircle({ className: "w-4 h-4 text-red-600" });
      default: return FaClock({ className: "w-4 h-4 text-gray-600" });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing Dashboard</h1>
        <p className="text-gray-600">Overview of all billing activity across the platform</p>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue This Month */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              {FaDollarSign({ className: "w-6 h-6 text-blue-600" })}
            </div>
            <span className="text-sm font-medium text-gray-500">This Month</span>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(dashboardData.revenue.currentMonth, dashboardData.revenue.currency)}
            </p>
          </div>
          <div className="flex items-center">
            {FaChartLine({ className: `w-4 h-4 ${dashboardData.revenue.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}` })}
            <span className={`text-sm font-medium ml-1 ${dashboardData.revenue.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dashboardData.revenue.percentageChange >= 0 ? '+' : ''}{dashboardData.revenue.percentageChange.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              {FaUsers({ className: "w-6 h-6 text-green-600" })}
            </div>
            <span className="text-sm font-medium text-gray-500">Active</span>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData.subscriptions.totalActive}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            {dashboardData.subscriptions.newThisMonth} new this month
          </p>
        </div>

        {/* Outstanding Payments */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              {FaExclamationTriangle({ className: "w-6 h-6 text-yellow-600" })}
            </div>
            <span className="text-sm font-medium text-gray-500">Outstanding</span>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(dashboardData.payments.totalOutstanding, dashboardData.revenue.currency)}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            {dashboardData.payments.overdueInvoices} overdue invoices
          </p>
        </div>

        {/* Payment Success Rate */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              {FaCheckCircle({ className: "w-6 h-6 text-purple-600" })}
            </div>
            <span className="text-sm font-medium text-gray-500">Success Rate</span>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData.payments.successRate}%
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Payment success rate
          </p>
        </div>
      </div>

      {/* Charts and Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subscription by Plan Type Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriptions by Plan Type</h3>
          <div className="space-y-4">
            {dashboardData.subscriptions.byPlanType.map((plan) => (
              <div key={plan.planType} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">{plan.planType}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{plan.count} schools</span>
                  <span className="text-sm font-medium text-gray-900">{plan.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-4">
            {dashboardData.schoolActivity.recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(payment.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.schoolName}</p>
                    <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount, dashboardData.revenue.currency)}
                  </p>
                  <p className={`text-xs ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schools Requiring Attention */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Schools Requiring Attention</h3>
          <span className="text-sm text-gray-500">
            {dashboardData.schoolActivity.schoolsRequiringAttention.length} schools
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outstanding Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.schoolActivity.schoolsRequiringAttention.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {FaSchool({ className: "w-4 h-4 text-gray-400 mr-2" })}
                      <span className="text-sm font-medium text-gray-900">{school.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {school.currentPlan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      school.subscriptionStatus === 'overdue' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {school.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(school.lastPaymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {formatCurrency(school.outstandingAmount, dashboardData.revenue.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
