import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

interface Banner {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  image?: string;
  link?: string | null;
}

const HeroCarousel = ({ banners }: { banners: Banner[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!banners || banners.length === 0) return null;

  return (
    <Swiper
      modules={[Autoplay, Pagination, EffectFade]}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      loop
      onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
      // ★ Taller on mobile to fit image + text; desktop heights unchanged
      className="w-full h-[420px] sm:h-[400px] md:h-[280px] lg:h-[320px]"
    >
      {banners.map((banner, index) => {
        const isEven = index % 2 === 0;
        const textLeft = isEven; // used only for desktop order

        return (
          <SwiperSlide key={banner.id}>
            {/* ─── MOBILE LAYOUT – image on top, text below ─── */}
            <div className="md:hidden flex flex-col h-full">
              {/* Image container – fixed height prevents cropping */}
              <div className="w-full h-56 sm:h-64 flex-shrink-0 overflow-hidden">
                <img
                  src={banner.image_url || banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Text container – takes the remaining height */}
              <div className="flex-1 flex items-center px-4 py-3 bg-white">
                <AnimatePresence mode="wait">
                  {index === activeIndex % banners.length && (
                    <motion.div
                      key={banner.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="w-full"
                    >
                      <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                        {banner.title}
                      </h2>
                      {banner.description && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
                          {banner.description}
                        </p>
                      )}
                      {banner.link && (
                        <Link
                          to={banner.link}
                          className="inline-block bg-gray-900 text-white font-semibold text-xs px-4 py-1.5 rounded-full hover:bg-gray-800 transition shadow"
                        >
                          Shop Now
                        </Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ─── DESKTOP LAYOUT – original side‑by‑side ─── */}
            <div className="hidden md:flex h-full">
              {/* Text panel */}
              <div
                className={`flex items-center justify-center p-3 sm:p-5 w-[30%] ${
                  textLeft ? 'order-1' : 'order-2'
                }`}
              >
                <AnimatePresence mode="wait">
                  {index === activeIndex % banners.length && (
                    <motion.div
                      key={banner.id}
                      initial={{
                        x: textLeft ? -50 : 50,
                        opacity: 0,
                      }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="backdrop-blur-sm bg-white/30 border border-white/40 rounded-2xl p-4 sm:p-5 text-gray-900 shadow-2xl w-full max-w-xs"
                    >
                      <h2 className="text-sm sm:text-base md:text-lg font-bold mb-1.5 leading-tight drop-shadow-sm">
                        {banner.title}
                      </h2>
                      {banner.description && (
                        <p className="text-xs sm:text-sm text-gray-800/90 line-clamp-3 mb-2">
                          {banner.description}
                        </p>
                      )}
                      {banner.link && (
                        <Link
                          to={banner.link}
                          className="inline-block bg-gray-900 text-white font-semibold text-xs sm:text-sm px-4 py-1.5 rounded-full hover:bg-gray-800 transition shadow"
                        >
                          Shop Now
                        </Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Image panel */}
              <div
                className={`overflow-hidden w-[70%] ${
                  textLeft ? 'order-2' : 'order-1'
                }`}
              >
                <img
                  src={banner.image_url || banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
};

export default HeroCarousel;