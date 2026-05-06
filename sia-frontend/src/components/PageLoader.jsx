import React from 'react';
import { motion } from 'framer-motion';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        {/* Animated outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-brand-primary"
        />
        
        {/* Pulsing center dot */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          className="absolute h-6 w-6 rounded-full bg-brand-primary/20 flex items-center justify-center"
        >
          <div className="h-2 w-2 rounded-full bg-brand-primary" />
        </motion.div>
      </div>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400"
      >
        Menyiapkan Halaman
      </motion.p>
    </div>
  );
};

export default PageLoader;
