'use client';

import { Project, projectsApi } from '@/lib/api';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
      };

      const createdProject = await projectsApi.createProject(projectData);
      onProjectCreated(createdProject);

      // Reset form
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        priority: 'MEDIUM',
        dueDate: '',
      });
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>새 프로젝트 생성</h2>
          <button onClick={onClose} className='p-2 hover:bg-gray-100 rounded-lg transition-colors'>
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>프로젝트 이름 *</label>
            <input
              type='text'
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='프로젝트 이름을 입력하세요'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>설명</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='프로젝트 설명을 입력하세요'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>색상</label>
              <input
                type='color'
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                className='w-full h-10 border border-gray-300 rounded-lg'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>우선순위</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='LOW'>낮음</option>
                <option value='MEDIUM'>보통</option>
                <option value='HIGH'>높음</option>
                <option value='URGENT'>긴급</option>
              </select>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>마감일</label>
            <input
              type='date'
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              취소
            </button>
            <button
              type='submit'
              disabled={!formData.name.trim() || isSubmitting}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
            >
              {isSubmitting ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  생성 중...
                </>
              ) : (
                <>
                  <Plus className='w-4 h-4' />
                  생성
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
