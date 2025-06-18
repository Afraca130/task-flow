'use client';

import { Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../../store/auth';

export default function SignupPage() {
  const router = useRouter();
  const { register, isLoading: authLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: '',
    general: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: '',
      general: '',
    };

    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (formData.name.length < 2) {
      newErrors.name = '이름은 최소 2자 이상이어야 합니다.';
    }

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (formData.password.length > 20) {
      newErrors.password = '비밀번호는 최대 20자까지 가능합니다.';
    } else if (
      !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(formData.password)
    ) {
      newErrors.password = '비밀번호는 영문, 숫자, 특수문자(@$!%*?&)를 포함해야 합니다.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = '이용약관에 동의해주세요.';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData.email, formData.password, formData.name);

      // Registration successful, redirect to login
      router.push('/login?message=회원가입이 완료되었습니다. 로그인해주세요.');
    } catch (error: any) {
      setErrors(prev => ({
        ...prev,
        general: error.message || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.',
      }));
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        {/* Logo */}
        <div className='mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center'>
          <div className='text-white font-bold text-xl'>TF</div>
        </div>
        <h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
          TaskFlow 회원가입
        </h2>
        <p className='mt-2 text-center text-sm text-gray-600'>
          이미 계정이 있으신가요?{' '}
          <Link href='/login' className='font-medium text-blue-600 hover:text-blue-500'>
            로그인
          </Link>
        </p>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <form className='space-y-6' onSubmit={handleSubmit}>
            {/* General Error */}
            {errors.general && (
              <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                <div className='text-sm text-red-600'>{errors.general}</div>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                이름
              </label>
              <div className='mt-1 relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <User className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id='name'
                  name='name'
                  type='text'
                  autoComplete='name'
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder='홍길동'
                />
              </div>
              {errors.name && <p className='mt-2 text-sm text-red-600'>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                이메일 주소
              </label>
              <div className='mt-1 relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Mail className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder='example@company.com'
                />
              </div>
              {errors.email && <p className='mt-2 text-sm text-red-600'>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                비밀번호
              </label>
              <div className='mt-1 relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Lock className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder='8-20자, 영문, 숫자, 특수문자 포함'
                />
                <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                  <button
                    type='button'
                    className='text-gray-400 hover:text-gray-500'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                  </button>
                </div>
              </div>
              {errors.password && <p className='mt-2 text-sm text-red-600'>{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700'>
                비밀번호 확인
              </label>
              <div className='mt-1 relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Lock className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id='confirmPassword'
                  name='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder='비밀번호를 다시 입력하세요'
                />
                <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                  <button
                    type='button'
                    className='text-gray-400 hover:text-gray-500'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                </div>
              </div>
              {errors.confirmPassword && (
                <p className='mt-2 text-sm text-red-600'>{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Agreement */}
            <div>
              <div className='flex items-center'>
                <input
                  id='agreeToTerms'
                  name='agreeToTerms'
                  type='checkbox'
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <label htmlFor='agreeToTerms' className='ml-2 block text-sm text-gray-900'>
                  <Link href='/terms' className='text-blue-600 hover:text-blue-500'>
                    이용약관
                  </Link>{' '}
                  및{' '}
                  <Link href='/privacy' className='text-blue-600 hover:text-blue-500'>
                    개인정보 처리방침
                  </Link>
                  에 동의합니다
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className='mt-2 text-sm text-red-600'>{errors.agreeToTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type='submit'
                disabled={isLoading}
                className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <span className='absolute left-0 inset-y-0 flex items-center pl-3'>
                  <UserPlus
                    className='h-5 w-5 text-blue-500 group-hover:text-blue-400'
                    aria-hidden='true'
                  />
                </span>
                {isLoading ? '회원가입 중...' : '회원가입'}
              </button>
            </div>

            {/* Additional Info */}
            <div className='mt-6'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300' />
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-white text-gray-500'>
                    회원가입 시 자동으로 로그인됩니다
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
