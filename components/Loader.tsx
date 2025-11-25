import { motion } from 'framer-motion';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export default function Loader({ size = 'medium', text = 'Loading...', fullScreen = false }: LoaderProps) {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'fixed inset-0 bg-white/90 z-50' : ''}`}>
      <motion.div 
        className={`${sizeClasses[size]} border-t-black border-r-gray-300 border-b-gray-300 border-l-gray-300 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1.2, 
          repeat: Infinity, 
          ease: "linear"
        }}
      />
      {text && (
        <motion.p 
          className="mt-4 text-gray-700 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
} 