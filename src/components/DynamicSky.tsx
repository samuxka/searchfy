'use client'

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface ShootingStar {
  id: number;
  x: number;
  y: number;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
  size: number;
}

const DynamicSky: React.FC = () => {
  const { theme } = useTheme();
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      const generateStars = () => {
        const newStars: Star[] = [];
        for (let i = 0; i < 100; i++) {
          newStars.push({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
          });
        }
        setStars(newStars);
      };
      generateStars();
    } else {
      setStars([]);
    }
  }, [theme]);

  useEffect(() => {
    if (theme === 'dark') {
      const addShootingStar = () => {
        const newShootingStar: ShootingStar = {
          id: Date.now(),
          x: Math.random() * 60,
          y: Math.random() * 20,
        };
        setShootingStars((prev) => [...prev, newShootingStar]);

        setTimeout(() => {
          setShootingStars((prev) => prev.filter((star) => star.id !== newShootingStar.id));
        }, 3000);
      };

      const interval = setInterval(addShootingStar, Math.random() * 3000 + 2000);
      return () => clearInterval(interval);
    } else {
      setShootingStars([]);
    }
  }, [theme]);

  useEffect(() => {
    if (theme === 'light') {
      const generateClouds = () => {
        const newClouds: Cloud[] = [];
        for (let i = 0; i < 10; i++) {
          newClouds.push({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 50,
            size: Math.random() * 100 + 50,
          });
        }
        setClouds(newClouds);
      };
      generateClouds();
    } else {
      setClouds([]);
    }
  }, [theme]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 w-full h-full z-[-1] transition-colors duration-500 ${
        theme === 'light'
          ? 'bg-gradient-to-b from-blue-200 to-blue-400'
          : 'bg-gradient-to-b from-black to-gray-900'
      }`}
    >
      <AnimatePresence>
        {theme === 'dark' &&
          stars.map((star) => (
            <div
              key={`star-${star.id}`}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: Math.random() * 0.5 + 0.5,
              }}
            />
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {theme === 'dark' &&
          shootingStars.map((star) => (
            <motion.div
              key={`shooting-star-${star.id}`}
              className="absolute bg-yellow-300 rounded-full"
              style={{
                width: '4px',
                height: '4px',
                boxShadow: '0 0 10px 3px rgba(255, 255, 200, 0.8), 0 0 20px 5px rgba(255, 255, 200, 0.5)',
              }}
              initial={{ x: `${star.x}vw`, y: `${star.y}vh`, opacity: 1 }}
              animate={{
                x: `${star.x + 70}vw`,
                y: `${star.y + 70}vh`,
                opacity: 0,
              }}
              transition={{ duration: 2, ease: 'linear' }}
            />
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {theme === 'light' &&
          clouds.map((cloud) => (
            <motion.div
              key={`cloud-${cloud.id}`}
              className="absolute bg-white rounded-full opacity-70"
              style={{
                left: `${cloud.x}%`,
                top: `${cloud.y}%`,
                width: `${cloud.size}px`,
                height: `${cloud.size / 2}px`,
                boxShadow: '0 0 20px 10px rgba(255, 255, 255, 0.5)',
              }}
              initial={{ x: `${cloud.x}%` }}
              animate={{ x: `${cloud.x + 20}%` }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'linear',
              }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
};

export default DynamicSky;