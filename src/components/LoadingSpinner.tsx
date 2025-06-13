import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bars';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const DotLoader = ({ size = 'md' }: { size: LoadingSpinnerProps['size'] }) => {
  const dotSize = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }[size];

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('bg-primary rounded-full', dotSize)}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

const PulseLoader = ({ size = 'md' }: { size: LoadingSpinnerProps['size'] }) => {
  const pulseSize = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  }[size];

  return (
    <div className="relative">
      <motion.div
        className={cn('bg-primary/20 rounded-full absolute', pulseSize)}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.8, 0, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      />
      <motion.div
        className={cn('bg-primary/40 rounded-full absolute', pulseSize)}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 0, 0.6],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 0.3,
        }}
      />
      <div className={cn('bg-primary rounded-full', pulseSize)} />
    </div>
  );
};

const BarsLoader = ({ size = 'md' }: { size: LoadingSpinnerProps['size'] }) => {
  const barHeight = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
  }[size];

  return (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className={cn('w-1 bg-primary rounded-t', barHeight)}
          animate={{
            scaleY: [1, 0.3, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

export function LoadingSpinner({
  size = 'md',
  className,
  text,
  variant = 'default',
}: LoadingSpinnerProps) {
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotLoader size={size} />;
      case 'pulse':
        return <PulseLoader size={size} />;
      case 'bars':
        return <BarsLoader size={size} />;
      default:
        return (
          <Loader2
            className={cn(
              'animate-spin text-primary',
              sizeClasses[size],
              className
            )}
          />
        );
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {renderLoader()}
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm text-muted-foreground"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
