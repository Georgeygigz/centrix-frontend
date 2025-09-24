import React, { useState, useEffect } from 'react';
import { FaTimes, FaClipboardList, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { CreateAssessmentToolRequest, AssessmentType, Term, Subject, ClassLevel, CompetencyFramework, LearningOutcome } from '../../types/assessment';
import { assessmentService } from '../../services/assessment';

interface AssessmentToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AssessmentFormData {
  name: string;
  assessment_type: AssessmentType;
  subject: string;
  class_level: string;
  term: Term;
  year: number;
  maximum_score: string;
  weight: string;
  date_administered: string;
  due_date: string;
  instructions: string;
  competency_framework: string;
  learning_outcomes: string[];
}

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: 'exam', label: 'Exam' },
  { value: 'test', label: 'Test' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'project', label: 'Project' },
  { value: 'practical', label: 'Practical' },
  { value: 'observation', label: 'Observation' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'oral', label: 'Oral' },
  { value: 'aural', label: 'Aural' },
];

const TERMS: { value: Term; label: string }[] = [
  { value: 1, label: 'Term 1' },
  { value: 2, label: 'Term 2' },
  { value: 3, label: 'Term 3' },
];

const AssessmentToolsDrawer: React.FC<AssessmentToolsDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<AssessmentFormData>({
    name: '',
    assessment_type: 'exam',
    subject: '',
    class_level: '',
    term: 1,
    year: new Date().getFullYear(),
    maximum_score: '',
    weight: '',
    date_administered: new Date().toISOString().split('T')[0],
    due_date: '',
    instructions: '',
    competency_framework: '',
    learning_outcomes: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Dropdown data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [competencyFrameworks, setCompetencyFrameworks] = useState<CompetencyFramework[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Load dropdown data
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  const loadDropdownData = async () => {
    setLoadingDropdowns(true);
    try {
      const [subjectsData, classLevelsData, frameworksData] = await Promise.all([
        assessmentService.getSubjects(),
        assessmentService.getClassLevels(),
        assessmentService.getCompetencyFrameworks({ page_size: 100 })
      ]);

      setSubjects(subjectsData);
      setClassLevels(classLevelsData);
      setCompetencyFrameworks(frameworksData.results || []);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // Load learning outcomes when competency framework changes
  useEffect(() => {
    if (formData.competency_framework) {
      loadLearningOutcomes(formData.competency_framework);
    } else {
      setLearningOutcomes([]);
    }
  }, [formData.competency_framework]);

  const loadLearningOutcomes = async (frameworkId: string) => {
    try {
      const outcomes = await assessmentService.getFrameworkStrands(frameworkId);
      setLearningOutcomes(outcomes);
    } catch (error) {
      console.error('Error loading learning outcomes:', error);
      setLearningOutcomes([]);
    }
  };

  const handleInputChange = (field: keyof AssessmentFormData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: []
      }));
    }
  };

  const handleLearningOutcomeToggle = (outcomeId: string) => {
    setFormData(prev => ({
      ...prev,
      learning_outcomes: prev.learning_outcomes.includes(outcomeId)
        ? prev.learning_outcomes.filter(id => id !== outcomeId)
        : [...prev.learning_outcomes, outcomeId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Prepare assessment data
      const assessmentData: CreateAssessmentToolRequest = {
        name: formData.name,
        assessment_type: formData.assessment_type,
        subject: formData.subject,
        class_level: formData.class_level,
        term: formData.term,
        year: formData.year,
        maximum_score: formData.maximum_score,
        weight: formData.weight,
        date_administered: formData.date_administered,
        due_date: formData.due_date || undefined,
        instructions: formData.instructions || undefined,
        competency_framework: formData.competency_framework || undefined,
        learning_outcomes: formData.learning_outcomes.length > 0 ? formData.learning_outcomes : undefined,
      };

      await assessmentService.createAssessmentTool(assessmentData);
      
      setSuccessMessage('Assessment tool created successfully!');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Error creating assessment tool:', error);
      
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: ['Failed to create assessment tool. Please try again.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      assessment_type: 'exam',
      subject: '',
      class_level: '',
      term: 1,
      year: new Date().getFullYear(),
      maximum_score: '',
      weight: '',
      date_administered: new Date().toISOString().split('T')[0],
      due_date: '',
      instructions: '',
      competency_framework: '',
      learning_outcomes: [],
    });
    setErrors({});
    setSuccessMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-end z-[10002] transition-all duration-300 ease-in-out">
      <div className="bg-gradient-to-br from-white to-gray-50 h-full w-96 shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-out">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              {FaClipboardList({ className: "w-4 h-4 text-blue-600" })}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create Assessment Tool</h2>
              <p className="text-xs text-gray-600">Add new assessment tool</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            {FaTimes({ className: "w-4 h-4" })}
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4 space-y-4">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                {FaCheck({ className: "w-4 h-4 text-green-600" })}
                <p className="text-green-800 text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                {FaExclamationTriangle({ className: "w-4 h-4 text-red-600" })}
                <div>
                  <p className="text-red-800 text-sm font-medium">Error</p>
                  <p className="text-red-700 text-xs mt-1">{errors.general[0]}</p>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Assessment Name */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                Assessment Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter assessment name"
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                required
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>
              )}
            </div>

            {/* Assessment Type */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                Assessment Type *
              </label>
              <select
                value={formData.assessment_type}
                onChange={(e) => handleInputChange('assessment_type', e.target.value as AssessmentType)}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white ${
                  errors.assessment_type ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                required
              >
                {ASSESSMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.assessment_type && (
                <p className="mt-1 text-xs text-red-600">{errors.assessment_type[0]}</p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                Subject *
              </label>
              {loadingDropdowns ? (
                <div className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-gray-50 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                  <span className="text-gray-500">Loading subjects...</span>
                </div>
              ) : (
                <select
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white ${
                    errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.subject && (
                <p className="mt-1 text-xs text-red-600">{errors.subject[0]}</p>
              )}
            </div>

            {/* Class Level */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                Class Level *
              </label>
              {loadingDropdowns ? (
                <div className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-gray-50 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
                  <span className="text-gray-500">Loading classes...</span>
                </div>
              ) : (
                <select
                  value={formData.class_level}
                  onChange={(e) => handleInputChange('class_level', e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-white ${
                    errors.class_level ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  required
                >
                  <option value="">Select class level</option>
                  {classLevels.map((classLevel) => (
                    <option key={classLevel.id} value={classLevel.id}>
                      {classLevel.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.class_level && (
                <p className="mt-1 text-xs text-red-600">{errors.class_level[0]}</p>
              )}
            </div>

            {/* Term and Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
                  Term *
                </label>
                <select
                  value={formData.term}
                  onChange={(e) => handleInputChange('term', parseInt(e.target.value) as Term)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white ${
                    errors.term ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  required
                >
                  {TERMS.map((term) => (
                    <option key={term.value} value={term.value}>
                      {term.label}
                    </option>
                  ))}
                </select>
                {errors.term && (
                  <p className="mt-1 text-xs text-red-600">{errors.term[0]}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></span>
                  Year *
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-500 transition-all duration-200 bg-white ${
                    errors.year ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  required
                />
                {errors.year && (
                  <p className="mt-1 text-xs text-red-600">{errors.year[0]}</p>
                )}
              </div>
            </div>

            {/* Maximum Score and Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                  Max Score *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maximum_score}
                  onChange={(e) => handleInputChange('maximum_score', e.target.value)}
                  placeholder="100.00"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 bg-white ${
                    errors.maximum_score ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  required
                />
                {errors.maximum_score && (
                  <p className="mt-1 text-xs text-red-600">{errors.maximum_score[0]}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>
                  Weight (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="30.00"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-100 focus:border-yellow-500 transition-all duration-200 bg-white ${
                    errors.weight ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  required
                />
                {errors.weight && (
                  <p className="mt-1 text-xs text-red-600">{errors.weight[0]}</p>
                )}
              </div>
            </div>

            {/* Date Administered and Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                  Date Administered *
                </label>
                <input
                  type="date"
                  value={formData.date_administered}
                  onChange={(e) => handleInputChange('date_administered', e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all duration-200 bg-white ${
                    errors.date_administered ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  required
                />
                {errors.date_administered && (
                  <p className="mt-1 text-xs text-red-600">{errors.date_administered[0]}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all duration-200 bg-white ${
                    errors.due_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {errors.due_date && (
                  <p className="mt-1 text-xs text-red-600">{errors.due_date[0]}</p>
                )}
              </div>
            </div>

            {/* Competency Framework */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                Competency Framework
              </label>
              {loadingDropdowns ? (
                <div className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-gray-50 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-violet-600"></div>
                  <span className="text-gray-500">Loading frameworks...</span>
                </div>
              ) : (
                <select
                  value={formData.competency_framework}
                  onChange={(e) => handleInputChange('competency_framework', e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all duration-200 bg-white ${
                    errors.competency_framework ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <option value="">Select competency framework (optional)</option>
                  {competencyFrameworks.map((framework) => (
                    <option key={framework.id} value={framework.id}>
                      {framework.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.competency_framework && (
                <p className="mt-1 text-xs text-red-600">{errors.competency_framework[0]}</p>
              )}
            </div>

            {/* Learning Outcomes */}
            {formData.competency_framework && learningOutcomes.length > 0 && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                  Learning Outcomes
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                  {learningOutcomes.map((outcome) => (
                    <div key={outcome.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`outcome-${outcome.id}`}
                        checked={formData.learning_outcomes.includes(outcome.id)}
                        onChange={() => handleLearningOutcomeToggle(outcome.id)}
                        className="w-3 h-3 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                      />
                      <label htmlFor={`outcome-${outcome.id}`} className="text-xs text-gray-700 cursor-pointer">
                        <span className="font-medium">{outcome.code}:</span> {outcome.description}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.learning_outcomes && (
                  <p className="mt-1 text-xs text-red-600">{errors.learning_outcomes[0]}</p>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span>
                Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Enter assessment instructions"
                rows={3}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 bg-white resize-none ${
                  errors.instructions ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              />
              {errors.instructions && (
                <p className="mt-1 text-xs text-red-600">{errors.instructions[0]}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? 'Creating...' : 'Create Assessment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssessmentToolsDrawer;

