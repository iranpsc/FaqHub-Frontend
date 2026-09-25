'use client';

import Image from 'next/image';
import { BaseCard } from '../ui/BaseCard';
import { BaseButton } from '../ui/BaseButton';

interface FooterProps {
  onAskQuestion?: () => void;
}

export function Footer({ onAskQuestion }: FooterProps) {
  const handleAskQuestion = () => {
    onAskQuestion?.();
  };

  const handleScoring = () => {
    // TODO: Implement scoring info
  };

  return (
    <footer className="py-8 mb-0 pb-0 px-4 md:px-7 transition-colors duration-300 space-y-6">
      {/* Top icons section */}
      <div className="flex-wrap flex justify-center items-center gap-2 mx-auto p-4 rounded-3xl bg-gray-100 dark:bg-gray-800 w-full">
        <a 
          href="https://irpsc.com" 
          style={{ width: '55px', height: '55px' }} 
          target="_blank" 
          title="وزارت تعاون کار و رفاه اجتماعی"
        >
          <Image 
            src="https://irpsc.com/img-icon/vezarat.png" 
            alt="وزارت تعاون کار و رفاه اجتماعی" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          className="active" 
          href="#" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="نماد اعتماد الکترونیک"
        >
          <Image 
            src="https://irpsc.com/img-icon/enamad.png" 
            alt="نماد اعتماد الکترونیک" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="ثبت اسناد و املاک کشور"
        >
          <Image 
            src="https://irpsc.com/img-icon/qazaii.png" 
            alt="ثبت اسناد و املاک کشور" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://video.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="مرکز آموزش ویدئویی"
        >
          <Image 
            src="https://irpsc.com/img-icon/video.png" 
            alt="مرکز آموزش ویدئویی" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://faq.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="انجمن پرسش و پاسخ"
        >
          <Image 
            src="https://irpsc.com/img-icon/faq.png" 
            alt="انجمن پرسش و پاسخ" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://Shop.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="فروشگاه ملی"
        >
          <Image 
            src="https://irpsc.com/img-icon/shop.png" 
            alt="فروشگاه ملی" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://supply.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="تولید کنندگان"
        >
          <Image 
            src="https://irpsc.com/img-icon/supply.png" 
            alt="تولید کنندگان" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://crm.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="مدیریت بر مدیران"
        >
          <Image 
            src="https://irpsc.com/img-icon/crm.png" 
            alt="مدیریت بر مدیران" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://target.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="نگرش ملی"
        >
          <Image 
            src="https://irpsc.com/img-icon/target.png" 
            alt="نگرش ملی" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://animal.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="حیوانات و دامپزشک"
        >
          <Image 
            src="https://irpsc.com/img-icon/animal.png" 
            alt="حیوانات و دامپزشک" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="رسانه ملی"
        >
          <Image 
            src="https://irpsc.com/img-icon/irpsc.png" 
            alt="رسانه ملی" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://meta.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="اخبار متا"
        >
          <Image 
            src="https://irpsc.com/img-icon/meta.png" 
            alt="اخبار متا" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://uni.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="دانشگاه متاورس"
        >
          <Image 
            src="https://irpsc.com/img-icon/uni.png" 
            alt="دانشگاه متاورس" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://crm.irpsc.com/knowledgebase" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }}
          title="استخدام | دانش محور"
        >
          <Image 
            src="https://irpsc.com/img-icon/knowledge.png" 
            alt="استخدام | دانش محور" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://sale.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="فروشگاه مجازی حم"
        >
          <Image 
            src="https://irpsc.com/img-icon/sale.png" 
            alt="فروشگاه مجازی حم" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://ad.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="تبلیغات ملی"
        >
          <Image 
            src="https://irpsc.com/img-icon/ad.png" 
            alt="تبلیغات ملی" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://nft.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="بازار NFT"
        >
          <Image 
            src="https://irpsc.com/img-icon/nft.png" 
            alt="بازار NFT" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://rgb.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="متاورس رنگ"
        >
          <Image 
            src="https://irpsc.com/img-icon/rgb.png" 
            alt="متاورس رنگ" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="https://rgb.irpsc.com" 
          target="_blank" 
          style={{ width: '55px', height: '55px' }} 
          title="سه بعدی متا"
        >
          <Image 
            src="https://irpsc.com/img-icon/3d.gif" 
            alt="سه بعدی متا" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
        <a href="#" title="خانه" style={{ width: '55px', height: '55px' }}>
          <Image 
            src="https://irpsc.com/img-icon/home-soon.png" 
            alt="خانه" 
            width={55} 
            height={55} 
            loading="lazy" 
            referrerPolicy="no-referrer"
          />
        </a>
      </div>

      {/* Main content sections */}
      <div className="mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Ask Question Section (Blue) */}
          <BaseCard 
            variant="shadow" 
            rounded="3xl" 
            padding="lg"
            className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white text-center relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
            <div className="relative z-10 py-6 flex flex-col md:flex-row md:items-center md:justify-between md:text-right text-center">
              <div className="md:mb-0 mb-6 md:mr-4 flex-1">
                <p className="text-3xl font-bold mb-4 text-white">پرسیدن سوال</p>
                <p className="text-blue-100 dark:text-blue-200 text-lg leading-relaxed">
                  هر سوالی که بخوای میتونی بپرسی...
                </p>
              </div>
              <div className="flex items-center justify-center md:justify-end flex-shrink-0">
                <BaseButton 
                  variant="outline" 
                  size="lg" 
                  rounded="xl"
                  className="bg-white/95 border-white/90 text-gray-800 dark:text-gray-900 transition-all duration-300 font-semibold px-12 py-4 text-lg"
             
             
                  onClick={handleAskQuestion}
                >
                  بپرس
                </BaseButton>
              </div>
            </div>
          </BaseCard>

          {/* Scoring Methods Section (Green) */}
          <BaseCard 
            variant="shadow" 
            rounded="3xl" 
            padding="lg"
            className="bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 text-white text-center relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-300/20 to-transparent"></div>
            <div className="relative z-10 py-6 flex flex-col md:flex-row md:items-center md:justify-between md:text-right text-center">
              <div className="md:mb-0 mb-6 md:mr-4 flex-1">
                <p className="text-2xl font-bold mb-4 text-white">نحوه امتیازدهی</p>
                <p className="text-green-50 dark:text-green-100 text-sm leading-relaxed">
                  راهنمای چگونگی امتیازدهی به شهروندان
                </p>
              </div>
              <div className="flex items-center justify-center md:justify-end flex-shrink-0">
                <BaseButton 
                  variant="outline" 
                  size="lg" 
                  rounded="xl"
                  className="bg-white/95 text-green-600 dark:text-green-700 border-white/90 hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold px-8 py-3"
                  onClick={handleScoring}
                >
                  امتیاز
                </BaseButton>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

      {/* Links and Social Media Section */}
      <div className="bg-gray-200 dark:bg-gray-700 py-6 rounded-t-3xl mb-0 transition-colors duration-300">
        <div className="container mx-auto px-4">
          {/* Navigation Links */}
          <div className="flex justify-center items-center gap-8 mb-6 flex-wrap">
            <a 
              href="#"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
            >
              آموزش
            </a>
            <a 
              href="#"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
            >
              سیاست و حریم خصوصی
            </a>
          </div>
          
          {/* Social Media Icons */}
          <div className="flex justify-center items-center gap-4 mb-4">
            <a 
              href="#" aria-label='pintrest'
              className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z" />
              </svg>
            </a>
            <a 
              href="#" aria-label='x'
              className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a 
              href="#" aria-label='whatsapp'
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.569-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
            </a>
            <a 
              href="#" aria-label='pintrest'
              className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z" />
              </svg>
            </a>
            <a 
              href="#" aria-label='telegram'
              className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
            <a 
              href="#" aria-label='youtube'
              className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
          
          {/* Copyright text */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              تمام حقوق مادی و معنوی مطالب و طرح قالب برای این سایت میباشد.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
