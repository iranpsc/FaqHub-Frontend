'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { UserCard } from '@/components/UserCard';
import { User } from '@/services/api';

import 'swiper/css';

interface ActiveUsersSliderProps {
  users: User[];
}

export function ActiveUsersSlider({ users }: ActiveUsersSliderProps) {
  const canLoop = users.length > 5;

  return (
    <div className="w-full overflow-hidden">
      <Swiper
        modules={[Autoplay]}
        dir="rtl"
        spaceBetween={16}
        slidesPerView={1.15}
        centeredSlides={false}
        grabCursor
        watchOverflow
        observer
        observeParents
        loop={canLoop}
        autoplay={
          canLoop
            ? {
                delay: 3500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
                reverseDirection: false,
              }
            : false
        }
        breakpoints={{
          480: { slidesPerView: 2, spaceBetween: 16 },
          768: { slidesPerView: 3, spaceBetween: 16 },
          1024: { slidesPerView: 4, spaceBetween: 16 },
          1280: { slidesPerView: 5, spaceBetween: 16 },
        }}
        className="active-users-swiper w-full"
      >
        {users.map((user) => (
          <SwiperSlide key={user.id} className="!h-auto">
            <UserCard user={user} inSlider className="h-full flex flex-col" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
