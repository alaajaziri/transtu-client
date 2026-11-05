import AnimatedContent from '../../reactbits/AnimatedContent';

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Apparition au défilement (React Bits · AnimatedContent).
 * Sans animation si l'utilisateur a demandé « réduire les animations ».
 * Usage : <Reveal delay={i * 0.08}>…</Reveal>
 */
export default function Reveal({ children, delay = 0, distance = 36, duration = 0.6, className = 'reveal', ...rest }) {
  if (reduced()) return <div className={className}>{children}</div>;
  return (
    <AnimatedContent distance={distance} duration={duration} delay={delay} className={className} {...rest}>
      {children}
    </AnimatedContent>
  );
}
