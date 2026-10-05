import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Très décevant',
  2: 'Moyen / Décevant',
  3: 'Correct / Bien',
  4: 'Très bien / Satisfait',
  5: 'Exceptionnel / Excellent !',
};

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const activeValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5 touch-manipulation">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeValue;

          if (readOnly) {
            return (
              <Star
                key={star}
                className={`${starSizes[size]} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                    : 'text-stone-300'
                }`}
              />
            );
          }

          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange && onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              className="p-1 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-transform active:scale-110 hover:scale-110"
              aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`${starSizes[size]} transition-colors duration-150 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                    : 'text-stone-300 hover:text-amber-200'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && (
        <p className="mt-2 text-sm font-semibold tracking-wide text-amber-900 min-h-[1.5rem]">
          {activeValue > 0 ? RATING_LABELS[activeValue] : 'Appuyez pour noter (1 à 5)'}
        </p>
      )}
    </div>
  );
};
