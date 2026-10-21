// src/components/features/products/ImageGallery.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  videoUrls?: string[];         // NEW – array of video URLs
  onVideoClick?: () => void;    // NEW – callback when user clicks the video overlay
}

const ImageGallery = ({ images, videoUrls, onVideoClick }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  if (!images.length) return null;

  const nextImage = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 15 : -15,
      transition: { duration: 0.3 },
    }),
  };

  return (
    <div
      className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gray-100 perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main image with 3D animation and subtle zoom on hover */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.img
          key={activeIndex}
          src={images[activeIndex]}
          alt={`Product view ${activeIndex + 1}`}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        />
      </AnimatePresence>

      {/* Video overlay indicator */}
      {videoUrls && videoUrls.length > 0 && (
        <button
          onClick={onVideoClick}
          className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition z-10"
          title="Watch video"
        >
          <Play className="w-4 h-4" />
        </button>
      )}

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-lg hover:bg-white transition z-10"
          >
            ←
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-lg hover:bg-white transition z-10"
          >
            →
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > activeIndex ? 1 : -1);
                setActiveIndex(idx);
              }}
              className={`w-2 h-2 rounded-full transition ${
                idx === activeIndex ? 'bg-primary-600 w-4' : 'bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;