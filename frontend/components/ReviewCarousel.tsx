'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
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
  visibleCards?: number; // Number of cards visible at once (1-3)
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
  },
  {
    id: 6,
    name: "David Martinez",
    role: "CEO",
    company: "StartupHub",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Exceptional service and premium quality. The team went above and beyond to ensure our satisfaction. Truly outstanding experience!",
    date: "3 weeks ago"
  },
  {
    id: 7,
    name: "Rachel Green",
    role: "Marketing Director",
    company: "BrandVision",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Professional, reliable, and absolutely stunning vehicles. Every detail was perfect. We'll definitely be back for future events.",
    date: "1 month ago"
  },
  {
    id: 8,
    name: "Thomas Anderson",
    role: "Finance Director",
    company: "CapitalFlow",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "The booking process was seamless and the vehicle exceeded all expectations. Top-tier service from start to finish.",
    date: "2 weeks ago"
  },
  {
    id: 9,
    name: "Sophie Laurent",
    role: "Event Coordinator",
    company: "Elite Events",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Perfect for our corporate events. The luxury vehicles made a lasting impression on our clients. Highly professional service.",
    date: "4 weeks ago"
  },
  {
    id: 10,
    name: "Robert Chen",
    role: "Business Owner",
    company: "TechStart Inc",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Outstanding customer service and immaculate vehicles. The attention to detail is remarkable. Worth every penny!",
    date: "1 week ago"
  },
  {
    id: 11,
    name: "Amanda Foster",
    role: "Operations Manager",
    company: "Global Logistics",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Reliable, luxurious, and professional. The entire experience was flawless. I couldn't have asked for better service.",
    date: "3 weeks ago"
  },
  {
    id: 12,
    name: "Christopher Lee",
    role: "Executive Director",
    company: "Premier Holdings",
    avatar: "https://images.unsplash.com/photo-1507591064344-4c6cefdb1f77?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "The premium fleet and exceptional service set a new standard. Our clients were thoroughly impressed. Excellent work!",
    date: "2 months ago"
  }
];

export function ReviewCarousel({
  reviews = defaultReviews,
  autoPlay = true,
  autoPlayInterval = 3000,
  visibleCards = 3,
  className
}: ReviewCarouselProps) {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [cardStyles, setCardStyles] = React.useState<Record<number, { opacity: number; scale: number }>>({});
  
  // Create duplicated reviews for infinite loop (2 sets for seamless scrolling)
  const duplicatedReviews = [...reviews, ...reviews];
  
  // Update card styles based on position in viewport
  React.useEffect(() => {
    const updateCardStyles = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      
      const styles: Record<number, { opacity: number; scale: number }> = {};
      
      container.querySelectorAll('[data-card-index]').forEach((card) => {
        const cardElement = card as HTMLElement;
        const index = parseInt(cardElement.dataset.cardIndex || '0');
        const rect = cardElement.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distanceFromCenter = Math.abs(cardCenter - containerCenter);
        const maxDistance = containerRect.width / 2;
        
        // Calculate opacity: 1 at center, fading to 0.4 at edges
        const opacity = Math.max(0.4, 1 - (distanceFromCenter / maxDistance) * 0.6);
        // Calculate scale: 1 at center, 0.92 at edges
        const scale = Math.max(0.92, 1 - (distanceFromCenter / maxDistance) * 0.08);
        
        styles[index] = { opacity, scale };
      });
      
      setCardStyles(styles);
    };
    
    // Wait for next frame to ensure DOM is ready
    let interval: NodeJS.Timeout | null = null;
    const timeoutId = setTimeout(() => {
      updateCardStyles();
      interval = setInterval(updateCardStyles, 100);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);
  
  // Responsive visible cards: 1 on mobile, 3 on desktop
  const [responsiveVisibleCards, setResponsiveVisibleCards] = React.useState(3);
  
  React.useEffect(() => {
    const updateVisibleCards = () => {
      if (window.innerWidth < 768) {
        setResponsiveVisibleCards(1);
      } else if (window.innerWidth < 1024) {
        setResponsiveVisibleCards(2);
      } else {
        setResponsiveVisibleCards(3);
      }
    };
    
    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  const actualVisibleCards = responsiveVisibleCards;
  
  // Calculate animation duration based on number of reviews
  // More reviews = longer duration for smooth continuous scroll
  const animationDuration = reviews.length * 8; // 8 seconds per review for slower, smoother scroll

  return (
    <section 
      className={cn("w-full py-24 md:py-32 lg:py-40 relative overflow-hidden", className)}
      role="region"
      aria-label="Customer reviews carousel"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-about.jpg"
          alt="Luxury car background"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      <div className="container mx-auto px-4 md:px-6 lg:px-12 relative z-20">
        <div className="text-center mb-16 md:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-[-0.03em] leading-[1.1]"
          >
            What Our Clients Say
          </motion.h2>
          
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-6"></div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed"
          >
            Trusted by industry leaders worldwide
          </motion.p>
        </div>

          <div 
            ref={carouselRef}
            className="relative w-full max-w-7xl mx-auto"
            tabIndex={0}
          >
            <div 
              ref={scrollContainerRef}
              className="relative overflow-hidden w-full"
              style={{ 
                minHeight: '400px'
              }}
            >
              <div
                className={cn(
                  "flex",
                  autoPlay ? "animate-scroll-reviews" : ""
                )}
                style={{
                  gap: '1.5rem',
                  width: 'max-content',
                  animationDuration: `${animationDuration}s`,
                  animationPlayState: 'running',
                  willChange: 'transform'
                }}
              >
                {duplicatedReviews.map((review, index) => {
                  const cardStyle = cardStyles[index] || { opacity: 1, scale: 1 };
                  
                  // Fixed width for cards to ensure 3 are visible
                  // Container max-width is 1280px (max-w-7xl), with padding ~96px = ~1184px available
                  // For 3 cards with 2 gaps of 24px each: (1184 - 48) / 3 ≈ 378px per card
                  // Using 380px for better fit
                  const cardWidth = actualVisibleCards === 1 
                    ? '100%' 
                    : actualVisibleCards === 2 
                    ? '500px' 
                    : '380px';
                  
                  return (
                    <motion.div
                      key={`${review.id}-${index}`}
                      data-card-index={index}
                      className="flex-shrink-0 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-500 p-5"
                      style={{
                        width: cardWidth,
                        aspectRatio: '1 / 1',
                        minHeight: '0'
                      }}
                      initial={false}
                      animate={{
                        opacity: cardStyle.opacity,
                        scale: cardStyle.scale
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                    >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <img
                            src={review.avatar}
                            alt={review.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/40 shadow-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white mb-0.5 truncate">
                              {review.name}
                            </h3>
                            <p className="text-xs text-white/80 mb-0.5 truncate">
                              {review.role}
                            </p>
                            <p className="text-[10px] text-white/60 truncate">
                              {review.company}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star 
                                key={i}
                                className="w-3 h-3 fill-yellow-400 text-yellow-400 drop-shadow-sm" 
                              />
                            ))}
                          </div>
                        </div>

                        <blockquote 
                          className="text-xs text-white/90 leading-relaxed"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 5,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          "{review.text}"
                        </blockquote>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/20">
                        <span className="text-[10px] text-white/60">
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReviewCarousel;
