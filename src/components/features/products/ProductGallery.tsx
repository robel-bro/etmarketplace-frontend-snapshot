import { useState, useRef, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import Zoom from 'react-image-zoom';

interface ProductGalleryProps {
  images: string[];
}

const ProductGallery = ({ images = [] }: ProductGalleryProps) => {
  const [open, setOpen] = useState(false);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomDimensions, setZoomDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      setZoomDimensions({ width, height });
    }
  }, [activeIndex]);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        {/* Main Swiper with zoom */}
        <Swiper
          spaceBetween={10}
          navigation
          thumbs={{ swiper: thumbsSwiper }}
          modules={[FreeMode, Navigation, Thumbs]}
          className="rounded-xl shadow-lg"
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        >
          {images.map((src, idx) => (
            <SwiperSlide key={idx}>
              <div
                ref={idx === activeIndex ? containerRef : null}
                className="relative w-full h-96 cursor-zoom-in"
                onClick={() => setOpen(true)}
              >
                <Zoom
                  img={src}
                  zoomScale={2}
                  width={zoomDimensions.width}
                  height={zoomDimensions.height}
                  transitionTime={0.3}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Thumbnail Swiper */}
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView={4}
          freeMode
          watchSlidesProgress
          modules={[FreeMode, Navigation, Thumbs]}
          className="thumb-swiper"
        >
          {images.map((src, idx) => (
            <SwiperSlide key={idx}>
              <img
                src={src}
                alt={`Thumb ${idx + 1}`}
                className="w-full h-20 object-cover rounded-lg border-2 border-transparent hover:border-primary-500 cursor-pointer"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={images.map(src => ({ src }))}
      />
    </>
  );
};

export default ProductGallery;