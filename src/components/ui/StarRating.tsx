import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
  label?: string;
}

const sizes = {
  sm: 14,
  md: 18,
  lg: 22,
};

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 'md',
  readonly = false,
  showValue = false,
  label,
}) => {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const displayValue = hovered !== null ? hovered : value;
  const iconSize = sizes[size];

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs text-white/50">{label}</span>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(null)}
            whileHover={!readonly ? { scale: 1.15 } : {}}
            whileTap={!readonly ? { scale: 0.95 } : {}}
            className={cn(
              'transition-colors duration-150',
              readonly ? 'cursor-default' : 'cursor-pointer'
            )}
          >
            <Star
              size={iconSize}
              className={cn(
                'transition-colors duration-150',
                star <= displayValue
                  ? 'fill-warning text-warning'
                  : 'fill-transparent text-white/20'
              )}
            />
          </motion.button>
        ))}
        {showValue && (
          <span className="ml-1.5 text-sm font-semibold text-white/80">
            {value.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
};
