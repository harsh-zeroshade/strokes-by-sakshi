import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-8xl sm:text-9xl font-display text-charcoal">404</h1>
          <p className="mt-4 text-xl text-charcoal-muted">This page seems to have wandered off</p>
          <Link to="/" className="inline-block mt-8 px-8 py-3 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-full hover:bg-charcoal-light transition-colors">
            Return Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}