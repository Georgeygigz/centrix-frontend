import React, { useState } from 'react';
import { FaTimes, FaHistory, FaCopy, FaCheck } from 'react-icons/fa';
import { AuditLog } from '../../types/audit';

interface ActivityLogDetailModalProps {
  log: AuditLog;
  isOpen: boolean;
  onClose: () => void;
}

const ActivityLogDetailModal: React.FC<ActivityLogDetailModalProps> = ({ 
  log, 
  isOpen, 
  onClose
}) => {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleCopyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'view':
        return 'bg-gray-100 text-gray-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      case 'logout':
        return 'bg-orange-100 text-orange-800';
      case 'download':
        return 'bg-indigo-100 text-indigo-800';
      case 'export':
        return 'bg-cyan-100 text-cyan-800';
      case 'import':
        return 'bg-teal-100 text-teal-800';
      case 'approve':
        return 'bg-emerald-100 text-emerald-800';
      case 'reject':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'critical':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (statusCode: number) => {
    const isSuccess = statusCode >= 200 && statusCode < 300;
    const isError = statusCode >= 400;
    
    if (isSuccess) return 'bg-green-100 text-green-800';
    if (isError) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  interface DetailItem {
    label: string;
    value: string | number | boolean;
    isStatus?: boolean;
    isBoolean?: boolean;
    isAction?: boolean;
    isLevel?: boolean;
    isJson?: boolean;
  }

  const logFeatures = [
    {
      title: "Activity Information",
      tag: "activity_info",
      description: "Core activity identification and basic details",
      details: [
        { label: "Log ID", value: log.id },
        { label: "Action", value: log.action, isAction: true },
        { label: "Level", value: log.level, isLevel: true },
        { label: "Message", value: log.message },
        { label: "Timestamp", value: formatTimestamp(log.timestamp) }
      ] as DetailItem[]
    },
    {
      title: "User Details",
      tag: "user_details",
      description: "User information who performed the action",
      details: [
        { label: "Username", value: log.user_details?.username || "Unknown User" },
        { label: "Email", value: log.user_details?.email || "No email" },
        { label: "First Name", value: log.user_details?.first_name || "Not provided" },
        { label: "Last Name", value: log.user_details?.last_name || "Not provided" },
        { label: "User ID", value: log.user_details?.id || "Not provided" }
      ] as DetailItem[]
    },
    {
      title: "School Information",
      tag: "school_details",
      description: "School context for the activity",
      details: [
        { label: "School Name", value: log.school_details?.name || "Not provided" },
        { label: "School Code", value: log.school_details?.code || "Not provided" },
        { label: "School ID", value: log.school_details?.id || "Not provided" }
      ] as DetailItem[]
    },
    {
      title: "Content Information",
      tag: "content_info",
      description: "Object and content details related to the activity",
      details: [
        { label: "Content Type", value: log.content_type },
        { label: "Object ID", value: log.object_id },
        { label: "Content Object", value: log.content_object || "N/A" },
        { label: "Object Representation", value: log.content_object_repr || "N/A" }
      ] as DetailItem[]
    },
    {
      title: "HTTP Details",
      tag: "http_details",
      description: "HTTP request and response information",
      details: [
        { label: "HTTP Method", value: log.http_method },
        { label: "Status Code", value: log.status_code, isStatus: true },
        { label: "URL", value: log.url },
        { label: "User IP", value: log.user_ip },
        { label: "User Agent", value: log.user_agent }
      ] as DetailItem[]
    },
    {
      title: "System Information",
      tag: "system_info",
      description: "Creation and update timestamps",
      details: [
        { label: "Created At", value: formatTimestamp(log.created_at) },
        { label: "Updated At", value: formatTimestamp(log.updated_at) }
      ] as DetailItem[]
    },
    {
      title: "Additional Details",
      tag: "additional_details",
      description: "Additional JSON details and metadata",
      details: [
        { 
          label: "Details", 
          value: log.details && Object.keys(log.details).length > 0 
            ? JSON.stringify(log.details, null, 2) 
            : "No additional details",
          isJson: true
        }
      ] as DetailItem[]
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
      <div className="bg-blue-100 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              {FaHistory({ className: "w-4 h-4 text-white" })}
            </div>
            <h2 className="text-lg font-bold text-blue-900">
              Activity Log - {log.user_details?.username || 'Unknown User'} - {log.action}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-200"
              title="Close"
            >
              {FaTimes({ className: "w-4 h-4 text-blue-600" })}
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-3 space-y-3">
          {logFeatures.map((feature, index) => (
            <div key={feature.tag} className="bg-white rounded-lg p-3 shadow-sm">
              {/* Feature Header */}
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-sm font-bold text-gray-900">{feature.title}</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {feature.tag}
                </span>
              </div>

              {/* Feature Description */}
              <p className="text-xs text-gray-500 mb-2">{feature.description}</p>

              {/* Feature Details */}
              <div className="space-y-0.5">
                {feature.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex items-start py-1 border-b border-blue-200 last:border-b-0">
                    <span className="text-xs font-semibold text-gray-800 flex-shrink-0 px-2 py-1 w-32">{detail.label}:</span>
                    <div className="text-xs text-gray-900 flex-1 px-2 py-1">
                      <span>
                        {detail.isAction ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            {detail.value}
                          </span>
                        ) : detail.isLevel ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                            {detail.value}
                          </span>
                        ) : detail.isStatus ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status_code)}`}>
                            {detail.value}
                          </span>
                        ) : detail.isJson ? (
                          <div className="relative">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap text-left overflow-auto max-h-32 bg-gray-50 p-2 rounded border">
                              {String(detail.value)}
                            </pre>
                            <button
                              onClick={() => handleCopyToClipboard(String(detail.value), `json-${detailIndex}`)}
                              className="absolute top-2 right-2 p-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
                              title={copiedStates[`json-${detailIndex}`] ? "Copied!" : "Copy JSON"}
                            >
                              {copiedStates[`json-${detailIndex}`] ? (
                                FaCheck({ className: "w-3 h-3 text-green-600" })
                              ) : (
                                FaCopy({ className: "w-3 h-3 text-gray-600" })
                              )}
                            </button>
                          </div>
                        ) : detail.label === "URL" ? (
                          <div className="text-xs text-gray-700 break-all overflow-auto max-h-16">
                            {String(detail.value || "Not provided")}
                          </div>
                        ) : detail.label === "User Agent" ? (
                          <div className="text-xs text-gray-700 break-all overflow-auto max-h-16">
                            {String(detail.value || "Not provided")}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-700 break-words">
                            {String(detail.value || "Not provided")}
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-4 pt-4 pb-6 border-t border-blue-200 bg-blue-50">
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogDetailModal;
