import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useEffect, useState } from 'react';
import './RotatingText.css';

export default function RotatingText({
  texts = [],
  rotationInterval = 2400,
  highlight = false,
  highlightColor = '#f8af26',
  className = ''
}) {
  const [index, setIndex] = useState(0);
  const activeText = texts[index] || '';

  useEffect(() => {
    if (texts.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % texts.length);
    }, rotationInterval);
    return () => clearInterval(timer);
  }, [rotationInterval, texts.length]);

  return (
    <MotionConfig reducedMotion="user">
      <span
        className={`rotating-text${highlight ? ' rotating-text-highlight' : ''} ${className}`}
        style={highlight ? { '--rotating-highlight': highlightColor } : undefined}
        aria-live="polite"
      >
        <span className="rotating-text-sr-only">{activeText}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${index}-${activeText}`}
            className="rotating-text-value"
            aria-hidden="true"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {activeText}
          </motion.span>
        </AnimatePresence>
      </span>
    </MotionConfig>
  );
}
