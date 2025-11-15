'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

interface ReviewCarouselProps {
  reviews?: Review[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const defaultReviews: Review[] = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechFlow Solutions",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "The attention to detail and innovative features have completely transformed our workflow. This is exactly what we've been looking for. Highly recommended!",
    date: "2 weeks ago"
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    role: "CTO",
    company: "InnovateSphere",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Implementation was seamless and the results exceeded our expectations. The platform's flexibility is remarkable and the support team is outstanding.",
    date: "1 month ago"
  },
  {
    id: 3,
    name: "Emily Watson",
    role: "Operations Director",
    company: "CloudScale",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "This solution has significantly improved our team's productivity. The intuitive interface makes complex tasks simple and efficient.",
    date: "3 weeks ago"
  },
  {
    id: 4,
    name: "James Kim",
    role: "Engineering Lead",
    company: "DataPro",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Outstanding support and robust features. It's rare to find a product that delivers on all its promises. We're extremely satisfied.",
    date: "1 week ago"
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "VP of Technology",
    company: "FutureNet",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "The scalability and performance have been game-changing for our organization. Highly recommend to any growing business.",
    date: "2 months ago"
  }
];

export function ReviewCarousel({
  reviews = defaultReviews,
  autoPlay = true,
  autoPlayInterval = 5000,
  className
}: ReviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);

  const handleNext = React.useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  }, [reviews.length]);

  const handlePrev = React.useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  React.useEffect(() => {
    if (!autoPlay) return;
    
    const interval = setInterval(handleNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, handleNext]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    })
  };

  const currentReview = reviews[currentIndex];

  return (
    <section className={cn("w-full py-20", className)} style={{ backgroundColor: '#1a1a1a' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4"
          >
            <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
            <span className="text-sm font-medium text-orange-500">Customer Reviews</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white"
          >
            What Our Clients Say
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Trusted by industry leaders worldwide
          </motion.p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="relative h-[400px] md:h-[350px] overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.3 }
                }}
                className="absolute inset-0"
              >
                <div className="h-full rounded-2xl p-8 md:p-10 shadow-lg border" style={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-6 mb-6">
                      <img
                        src={currentReview.avatar}
                        alt={currentReview.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-orange-500/20"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">
                          {currentReview.name}
                        </h3>
                        <p className="text-sm text-gray-300 mb-1">
                          {currentReview.role}
                        </p>
                        <p className="text-sm text-gray-400">
                          {currentReview.company}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: currentReview.rating }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.3 }}
                          >
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <motion.blockquote
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="text-lg text-white leading-relaxed mb-6 flex-1"
                    >
                      "{currentReview.text}"
                    </motion.blockquote>

                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#4a5568' }}>
                      <span className="text-sm text-gray-400">
                        {currentReview.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-300">
                          {currentIndex + 1} / {reviews.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center items-center gap-4 mt-8">
            <motion.button
              onClick={handlePrev}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous review"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>

            <div className="flex gap-2">
              {reviews.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-orange-500 w-8"
                      : "bg-gray-600 hover:bg-gray-500"
                  )}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>

            <motion.button
              onClick={handleNext}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next review"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto"
        >
          {[
            { number: "500+", label: "Happy Clients" },
            { number: "98%", label: "Satisfaction Rate" },
            { number: "4.9/5", label: "Average Rating" },
            { number: "24/7", label: "Support" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-gray-300">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default ReviewCarousel;

