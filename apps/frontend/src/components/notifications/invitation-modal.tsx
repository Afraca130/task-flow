'use client';

import { Calendar, User, Users, X } from 'lucide-react';
import { Button } from '../ui/button';

interface InvitationModalProps {
  isOpen: boolean;
  inviterName: string;
  projectName: string;
  message?: string;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}

export function InvitationModal({
  isOpen,
  inviterName,
  projectName,
  message,
  onAccept,
  onDecline,
  onClose,
}: InvitationModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]'>
      <div className='bg-white rounded-lg max-w-md w-full shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Users className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>프로젝트 초대</h3>
              <p className='text-sm text-gray-500'>새로운 초대가 도착했습니다</p>
            </div>
          </div>
          <button onClick={onClose} className='p-2 hover:bg-gray-100 rounded-lg transition-colors'>
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          <div className='text-center mb-6'>
            <div className='mb-4'>
              <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4'>
                {inviterName.charAt(0)}
              </div>
              <h4 className='text-xl font-semibold text-gray-900 mb-2'>{inviterName}님의 초대</h4>
            </div>

            <div className='bg-gray-50 rounded-lg p-4 mb-4'>
              <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
                <Calendar className='w-4 h-4' />
                <span>프로젝트 초대</span>
              </div>
              <p className='text-lg font-medium text-gray-900 mb-1'>"{projectName}"</p>
              <p className='text-gray-600'>프로젝트에 함께 참여하도록 초대받았습니다.</p>
            </div>

            {message && (
              <div className='bg-blue-50 border-l-4 border-blue-400 p-4 mb-4'>
                <div className='flex items-start gap-2'>
                  <User className='w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0' />
                  <div className='text-left'>
                    <p className='text-sm font-medium text-blue-800 mb-1'>메시지</p>
                    <p className='text-sm text-blue-700'>{message}</p>
                  </div>
                </div>
              </div>
            )}

            <p className='text-sm text-gray-500'>
              이 프로젝트에 참여하여 팀과 함께 작업하시겠습니까?
            </p>
          </div>

          {/* Actions */}
          <div className='flex gap-3'>
            <Button
              variant='outline'
              onClick={onDecline}
              className='flex-1 text-gray-700 border-gray-300 hover:bg-gray-50'
            >
              거절하기
            </Button>
            <Button onClick={onAccept} className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'>
              수락하기
            </Button>
          </div>

          <p className='text-xs text-gray-400 text-center mt-4'>
            수락하시면 프로젝트 멤버로 추가되며, 관련 알림을 받게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
