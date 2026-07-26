'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BaseCard } from '@/components/ui/BaseCard';
import { BaseAvatar } from '@/components/ui/BaseAvatar';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { BaseBadge } from '@/components/ui/BaseBadge';
import { BaseAlert } from '@/components/ui/BaseAlert';
import { apiService, isAuthError } from '@/services/api';
import Link from 'next/link';

interface UserProfile {
  name: string;
  email: string;
  mobile: string;
  image_url: string;
  score: number;
  online: boolean;
  login_notification_enabled: boolean;
}

interface UserStats {
  questionsCount: number;
  answersCount: number;
  commentsCount: number;
}

interface Activity {
  id: string;
  type: 'question' | 'answer' | 'comment' | 'vote';
  description: string;
  created_at: string;
  question_slug?: string;
}

interface AlertState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [profileData, setProfileData] = useState<UserProfile>({
    name: '',
    email: '',
    mobile: '',
    image_url: '',
    score: 0,
    online: false,
    login_notification_enabled: false,
  });
  const [settings, setSettings] = useState({
    login_notification_enabled: false,
  });
  const [userStats, setUserStats] = useState<UserStats>({
    questionsCount: 0,
    answersCount: 0,
    commentsCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [settingsManuallyUpdated, setSettingsManuallyUpdated] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: 'success',
    message: '',
  });

  const showAlert = useCallback((type: AlertState['type'], message: string) => {
    setAlert({ type, message, show: true });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  const loadUserData = useCallback(() => {
    if (user) {
      setProfileData(prev => ({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        image_url: user.image_url || '',
        score: user.score || 0,
        online: user.online || false,
        // Only update login_notification_enabled if settings haven't been manually updated
        login_notification_enabled: settingsManuallyUpdated
          ? prev.login_notification_enabled
          : user.login_notification_enabled || false,
      }));
      setSettings(prev => ({
        // Only update if settings haven't been manually updated
        login_notification_enabled: settingsManuallyUpdated
          ? prev.login_notification_enabled
          : user.login_notification_enabled || false,
      }));
    }
  }, [user, settingsManuallyUpdated]);

  const fetchUserProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const response = await apiService.getUserProfile();
      if (response) {
        setProfileData({
          name: response.name || '',
          email: response.email || '',
          mobile: response.mobile || '',
          image_url: response.image_url || '',
          score: response.score || 0,
          online: response.online || false,
          login_notification_enabled: response.login_notification_enabled || false,
        });
        setSettings({
          login_notification_enabled: response.login_notification_enabled || false,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (isAuthError(error)) {
        showAlert('error', 'لطفا دوباره وارد شوید');
        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [showAlert]);

  const fetchUserStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await apiService.getUserStats();
      if (response) {
        setUserStats(response);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      if (isAuthError(error)) {
        showAlert('error', 'لطفا دوباره وارد شوید');
      }
    } finally {
      setLoadingStats(false);
    }
  }, [showAlert]);

  const fetchRecentActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const response = await apiService.getUserActivity();
      if (response) {
        setRecentActivity(response);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
      if (isAuthError(error)) {
        showAlert('error', 'لطفا دوباره وارد شوید');
      }
    } finally {
      setLoadingActivity(false);
    }
  }, [showAlert]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showAlert('error', 'حجم فایل باید کمتر از 2 مگابایت باشد');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showAlert('error', 'فرمت فایل مجاز نیست. لطفا فایل JPG، PNG یا GIF انتخاب کنید');
      return;
    }

    setUploadingImage(true);

    try {
      const response = await apiService.updateUserImage(file);
      if (response.success && response.data) {
        setProfileData(prev => ({ ...prev, image_url: response.data!.image_url }));
        updateUser({ image_url: response.data!.image_url });
        showAlert('success', 'عکس پروفایل با موفقیت بروزرسانی شد');
      } else {
        showAlert('error', 'خطا در به‌روزرسانی عکس پروفایل');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      if (isAuthError(error)) {
        showAlert('error', 'لطفا دوباره وارد شوید');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showAlert('error', 'خطا در به‌روزرسانی عکس پروفایل');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const updateSettings = async (newValue?: boolean) => {
    const valueToUpdate = newValue !== undefined ? newValue : settings.login_notification_enabled;
    setUpdatingSettings(true);
    
    try {
      const response = await apiService.updateUserSettings({
        login_notification_enabled: valueToUpdate,
      });
      
      if (response.success && response.data) {
        setProfileData(prev => ({
          ...prev,
          login_notification_enabled: response.data!.login_notification_enabled
        }));
        setSettingsManuallyUpdated(true);
        // Don't update user context to avoid triggering useEffect
        showAlert('success', 'تنظیمات با موفقیت بروزرسانی شد');
      } else {
        showAlert('error', 'خطا در به‌روزرسانی تنظیمات');
        // Revert the setting if there was an error
        setSettings(prev => ({
          ...prev,
          login_notification_enabled: profileData.login_notification_enabled
        }));
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      if (isAuthError(error)) {
        showAlert('error', 'لطفا دوباره وارد شوید');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showAlert('error', 'خطا در به‌روزرسانی تنظیمات');
      }
      // Revert the setting if there was an error
      setSettings(prev => ({
        ...prev,
        login_notification_enabled: profileData.login_notification_enabled
      }));
    } finally {
      setUpdatingSettings(false);
    }
  };

  const getActivityBadgeVariant = (type: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'secondary'> = {
      question: 'primary',
      answer: 'success',
      comment: 'warning',
      vote: 'info',
    };
    return variants[type] || 'secondary';
  };

  const getActivityTypeText = (type: string) => {
    const types: Record<string, string> = {
      question: 'سوال',
      answer: 'پاسخ',
      comment: 'دیدگاه',
      vote: 'رای',
    };
    return types[type] || 'فعالیت';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // If absolute days is less than 30, show days
    if (Math.abs(diffDays) < 30) {
      return new Intl.RelativeTimeFormat('fa', { numeric: 'auto' }).format(diffDays, 'day');
    }

    // If absolute months is less than 12, show months
    const diffMonths = Math.round(diffDays / 30);
    if (Math.abs(diffMonths) < 12) {
      return new Intl.RelativeTimeFormat('fa', { numeric: 'auto' }).format(diffMonths, 'month');
    }

    // Otherwise, show years
    const diffYears = Math.round(diffMonths / 12);
    return new Intl.RelativeTimeFormat('fa', { numeric: 'auto' }).format(diffYears, 'year');
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Load user data from context first (synchronous)
      loadUserData();
      
      // Fetch all profile data in parallel to reduce load time
      Promise.allSettled([
        fetchUserProfile(),
        fetchUserStats(),
        fetchRecentActivity()
      ]).then((results) => {
        // Log any failures for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const apiNames = ['profile', 'stats', 'activity'];
            console.error(`Failed to fetch ${apiNames[index]}:`, result.reason);
          }
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Only depend on isAuthenticated to avoid infinite loop

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" dir="rtl">
        <BaseCard className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            نیاز به ورود
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            برای مشاهده پروفایل خود، ابتدا وارد حساب کاربری خود شوید
          </p>
          <BaseButton onClick={() => window.location.href = '/'}>
            بازگشت به صفحه اصلی
          </BaseButton>
        </BaseCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Tahoma', sans-serif" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        {/* Profile Header */}
        <BaseCard className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-600 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">پروفایل کاربر</h1>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-600">
            <nav className="flex space-x-8 space-x-reverse" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 font-medium text-sm transition-colors duration-200 focus:outline-none border-b-2 ${activeTab === 'profile'
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
                  }`}
              >
                اطلاعات پروفایل
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 font-medium text-sm transition-colors duration-200 focus:outline-none border-b-2 ${activeTab === 'settings'
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
                  }`}
              >
                تنظیمات
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-4">
                    {loadingProfile ? (
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ring-4 ring-white dark:ring-gray-800 shadow-lg"></div>
                    ) : (
                      <BaseAvatar
                        src={profileData.image_url}
                        name={profileData.name}
                        size="2xl"
                        status={profileData.online ? 'online' : 'offline'}
                        className="ring-4 ring-white dark:ring-gray-800 shadow-lg"
                      />
                    )}

                    {/* Image Upload */}
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <BaseButton
                        onClick={() => document.getElementById('image-upload')?.click()}
                        variant="outline"
                        size="sm"
                        disabled={uploadingImage || loadingProfile}
                      >
                        {uploadingImage ? (
                          'در حال آپلود...'
                        ) : loadingProfile ? (
                          'در حال بارگذاری...'
                        ) : (
                          <>
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            تغییر عکس پروفایل
                          </>
                        )}
                      </BaseButton>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        فرمت های مجاز: JPG، PNG، GIF (حداکثر 2MB)
                      </p>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          نام کاربری
                        </label>
                        {loadingProfile ? (
                          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                        ) : (
                          <BaseInput
                            value={profileData.name}
                            disabled
                            className="bg-gray-50 dark:bg-gray-700 dark:text-gray-700"
                          />
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          نام کاربری قابل تغییر نیست
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          ایمیل
                        </label>
                        {loadingProfile ? (
                          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                        ) : (
                          <BaseInput
                            value={profileData.email}
                            disabled
                            className="bg-gray-50 dark:bg-gray-700 dark:text-gray-700"
                            type="email"
                          />
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          ایمیل قابل تغییر نیست
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          شماره موبایل
                        </label>
                        {loadingProfile ? (
                          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                        ) : (
                          <BaseInput
                            value={profileData.mobile || ''}
                            disabled
                            className="bg-gray-50 dark:bg-gray-700 dark:text-gray-700"
                            type="tel"
                          />
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          شماره موبایل قابل تغییر نیست
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          امتیاز
                        </label>
                        {loadingProfile ? (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">امتیاز</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <BaseBadge variant="primary" size="lg">
                              {profileData.score || 0}
                            </BaseBadge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">امتیاز</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">اطلاعات تکمیلی</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          {loadingStats ? (
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                          ) : (
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {userStats.questionsCount}
                            </div>
                          )}
                          <div className="text-sm text-gray-600 dark:text-gray-300">سوال ارسالی</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          {loadingStats ? (
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                          ) : (
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {userStats.answersCount}
                            </div>
                          )}
                          <div className="text-sm text-gray-600 dark:text-gray-300">پاسخ ارسالی</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          {loadingStats ? (
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                          ) : (
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {userStats.commentsCount}
                            </div>
                          )}
                          <div className="text-sm text-gray-600 dark:text-gray-300">دیدگاه ارسالی</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="p-6">
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">تنظیمات اعلان‌ها</h2>

                  {/* Login Notification Setting */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        اعلان ورود به حساب کاربری
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        در صورت فعال بودن، هر بار که وارد حساب کاربری خود می‌شوید، ایمیلی دریافت خواهید کرد
                      </p>
                    </div>
                    <div className="ml-4">
                      <label className={`relative inline-flex items-center ${updatingSettings ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={settings.login_notification_enabled}
                          disabled={updatingSettings}
                          onChange={(e) => {
                            const newValue = e.target.checked;
                            setSettings(prev => ({
                              ...prev,
                              login_notification_enabled: newValue
                            }));
                            updateSettings(newValue);
                          }}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 ${updatingSettings ? 'animate-pulse' : ''}`}></div>
                        {updatingSettings && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </BaseCard>

        {/* Recent Activity */}
        {activeTab === 'profile' && (
          <BaseCard>
            <div className="border-b border-gray-200 dark:border-gray-600 pb-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">فعالیت‌های اخیر</h2>
            </div>

            <div className="p-6">
              {loadingActivity ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-4 space-x-reverse p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">هیچ فعالیتی یافت نشد</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    فعالیت‌های شما در اینجا نمایش داده خواهد شد
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <Link href={`/questions/${activity.question_slug}`} key={activity.id}>
                      <div
                        key={activity.id}
                        className="flex items-center space-x-4 space-x-reverse p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <BaseBadge variant={getActivityBadgeVariant(activity.type)} size="sm">
                            {getActivityTypeText(activity.type)}
                          </BaseBadge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {activity.description}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </BaseCard>
        )}
      </div>

      {/* Alert */}
      {alert.show && (
        <BaseAlert
          variant={alert.type}
          message={alert.message}
          className="fixed top-4 right-4 z-50"
        />
      )}
    </div>
  );
}