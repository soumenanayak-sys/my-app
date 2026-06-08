"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [visibleNumbers, setVisibleNumbers] = useState([]);
  const [floatingNumbers, setFloatingNumbers] = useState([]);

  useEffect(() => {
    setMounted(true);
    // Show random numbers one by one
    const numbers = ['8427', '3915', '6742', '2189', '5036', '9571', '3248', '6793', '1425', '8360'];
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < numbers.length) {
        setVisibleNumbers(prev => [...prev, numbers[index]]);
        index++;
      }
    }, 600);

    // Create floating numbers with random positions
    const floating = numbers.map((num, i) => ({
      id: i,
      number: num,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 12 + Math.random() * 20,
      duration: 4 + Math.random() * 4,
      delay: i * 0.2
    }));
    setFloatingNumbers(floating);

    return () => clearInterval(interval);
  }, []);

  // Predefined positions for scatter plot to avoid Math.random()
  const scatterPositions = [
    { cx: 250, cy: 200 }, { cx: 350, cy: 150 }, { cx: 450, cy: 300 }, { cx: 550, cy: 250 },
    { cx: 650, cy: 180 }, { cx: 750, cy: 350 }, { cx: 300, cy: 400 }, { cx: 400, cy: 500 },
    { cx: 500, cy: 450 }, { cx: 600, cy: 550 }, { cx: 700, cy: 480 }, { cx: 800, cy: 600 },
    { cx: 280, cy: 280 }, { cx: 420, cy: 220 }, { cx: 580, cy: 380 }, { cx: 680, cy: 420 },
    { cx: 780, cy: 300 }, { cx: 350, cy: 480 }, { cx: 550, cy: 350 }, { cx: 650, cy: 520 },
    { cx: 450, cy: 600 }, { cx: 750, cy: 250 }, { cx: 320, cy: 350 }, { cx: 520, cy: 280 },
    { cx: 620, cy: 450 }, { cx: 720, cy: 550 }, { cx: 380, cy: 420 }, { cx: 480, cy: 380 },
    { cx: 680, cy: 320 }, { cx: 820, cy: 480 }, { cx: 350, cy: 320 }, { cx: 550, cy: 420 },
    { cx: 450, cy: 350 }, { cx: 650, cy: 280 }, { cx: 750, cy: 450 }, { cx: 300, cy: 500 },
    { cx: 500, cy: 550 }, { cx: 600, cy: 350 }, { cx: 700, cy: 400 }, { cx: 800, cy: 350 }
  ];

  const connectionLines = [
    { x1: 250, y1: 200, x2: 350, y2: 150 }, { x1: 350, y1: 150, x2: 450, y2: 300 },
    { x1: 450, y1: 300, x2: 550, y2: 250 }, { x1: 550, y1: 250, x2: 650, y2: 180 },
    { x1: 650, y1: 180, x2: 750, y2: 350 }, { x1: 300, y1: 400, x2: 400, y2: 500 },
    { x1: 400, y1: 500, x2: 500, y2: 450 }, { x1: 500, y1: 450, x2: 600, y2: 550 },
    { x1: 600, y1: 550, x2: 700, y2: 480 }, { x1: 700, y1: 480, x2: 800, y2: 600 },
    { x1: 280, y1: 280, x2: 420, y2: 220 }, { x1: 420, y1: 220, x2: 580, y2: 380 },
    { x1: 580, y1: 380, x2: 680, y2: 420 }, { x1: 680, y1: 420, x2: 780, y2: 300 },
    { x1: 350, y1: 480, x2: 550, y2: 350 }, { x1: 550, y1: 350, x2: 650, y2: 520 },
    { x1: 450, y1: 600, x2: 750, y2: 250 }, { x1: 320, y1: 350, x2: 520, y2: 280 },
    { x1: 620, y1: 450, x2: 720, y2: 550 }, { x1: 380, y1: 420, x2: 480, y2: 380 }
  ];

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-dark">
      
      {/* Premium Gradient Background - Dark theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-darkSoft to-dark" />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primaryPurple/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primaryBlue/20 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primaryCyan/10 rounded-full blur-[150px] animate-pulse-slow animation-delay-4000" />
      <div className="absolute top-40 right-1/4 w-64 h-64 bg-primaryGreen/10 rounded-full blur-[100px] animate-pulse-slow animation-delay-1000" />

      {/* Random Numbers Floating All Over - Fixed without animation shorthand conflict */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingNumbers.map((num) => (
          <span
            key={num.id}
            className="absolute font-mono font-light tracking-wider"
            style={{
              top: `${num.top}%`,
              left: `${num.left}%`,
              color: `rgba(139, 92, 246, 0.25)`,
              fontSize: `${num.size}px`,
              opacity: 0,
              transform: 'translateY(20px)',
              animation: `floatRandom ${num.duration}s ease-out forwards`,
              animationDelay: `${num.delay}s`
            }}
          >
            {num.number}
          </span>
        ))}
      </div>

      {/* ========== MARKET GRAPHS & CHARTS ========== */}
      
      {/* Top Left - Candlestick Chart */}
      <div className="absolute left-4 top-4 w-96 h-48 pointer-events-none opacity-30 hover:opacity-50 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 500 250">
          <text x="10" y="20" fill="#8B5CF6" fontSize="9" fontFamily="monospace" fontWeight="bold">AAPL · 1D</text>
          <text x="10" y="35" fill="#22C55E" fontSize="8" fontFamily="monospace">▲ +2.34%</text>
          
          {[25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475].map((x, i) => {
            const isGreen = i % 2 === 0;
            const high = 80 + Math.sin(i) * 25;
            const low = high - 20;
            const close = isGreen ? high - 5 : low + 5;
            const open = isGreen ? low + 8 : high - 8;
            const bodyTop = Math.min(open, close);
            const bodyHeight = Math.abs(close - open);
            
            return (
              <g key={i}>
                <line x1={x} y1={low} x2={x} y2={high} stroke={isGreen ? "#22C55E" : "#EF4444"} strokeWidth="1.5"/>
                <rect x={x-5} y={bodyTop} width="10" height={bodyHeight} fill={isGreen ? "#22C55E" : "#EF4444"} opacity="0.7" rx="1">
                  <animate attributeName="height" values={`${bodyHeight};${bodyHeight+3};${bodyHeight}`} dur="3s" repeatCount="indefinite"/>
                </rect>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Top Right - Line Chart */}
      <div className="absolute right-4 top-4 w-96 h-48 pointer-events-none opacity-30 hover:opacity-50 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 500 250">
          <text x="10" y="20" fill="#06B6D4" fontSize="9" fontFamily="monospace" fontWeight="bold">S&P 500 · 1M</text>
          
          <polyline stroke="#8B5CF6" strokeWidth="1.5" fill="none" points="0,220 25,210 50,215 75,195 100,185 125,190 150,170 175,160 200,165 225,150 250,145 275,155 300,140 325,135 350,145 375,130 400,125 425,135 450,120 475,115 500,110">
            <animate attributeName="points" 
              values="0,220 25,210 50,215 75,195 100,185 125,190 150,170 175,160 200,165 225,150 250,145 275,155 300,140 325,135 350,145 375,130 400,125 425,135 450,120 475,115 500,110;
                       0,220 25,215 50,205 75,200 100,190 125,195 150,175 175,165 200,170 225,155 250,150 275,160 300,145 325,140 350,150 375,135 400,130 425,140 450,125 475,120 500,115;
                       0,220 25,210 50,215 75,195 100,185 125,190 150,170 175,160 200,165 225,150 250,145 275,155 300,140 325,135 350,145 375,130 400,125 425,135 450,120 475,115 500,110"
              dur="5s" repeatCount="indefinite"/>
          </polyline>
          
          <polyline stroke="#22C55E" strokeWidth="1" fill="none" points="0,230 25,225 50,220 75,210 100,205 125,215 150,195 175,185 200,190 225,175 250,170 275,180 300,165 325,160 350,170 375,155 400,150 425,160 450,145 475,140 500,135">
            <animate attributeName="points" 
              values="0,230 25,225 50,220 75,210 100,205 125,215 150,195 175,185 200,190 225,175 250,170 275,180 300,165 325,160 350,170 375,155 400,150 425,160 450,145 475,140 500,135;
                       0,230 25,220 50,215 75,205 100,210 125,200 150,190 175,180 200,185 225,170 250,165 275,175 300,160 325,155 350,165 375,150 400,145 425,155 450,140 475,135 500,130;
                       0,230 25,225 50,220 75,210 100,205 125,215 150,195 175,185 200,190 225,175 250,170 275,180 300,165 325,160 350,170 375,155 400,150 425,160 450,145 475,140 500,135"
              dur="6s" repeatCount="indefinite"/>
          </polyline>
        </svg>
      </div>

      {/* Middle Left - Volume Profile */}
      <div className="absolute left-4 top-1/3 w-80 h-64 pointer-events-none opacity-25 hover:opacity-40 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 400 350">
          <text x="10" y="20" fill="#F59E0B" fontSize="9" fontFamily="monospace" fontWeight="bold">VOLUME PROFILE</text>
          
          {[20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115].map((width, i) => (
            <rect key={i} x={250 - i * 5} y={40 + i * 14} width={width} height="8" fill="#8B5CF6" opacity="0.4" rx="2">
              <animate attributeName="width" values={`${width};${width+5};${width}`} dur="3s" begin={`${i*0.1}s`} repeatCount="indefinite"/>
            </rect>
          ))}
          
          {[15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63, 67, 71, 75, 79, 83, 87, 91].map((width, i) => (
            <rect key={`ask-${i}`} x={150} y={40 + i * 14} width={width} height="8" fill="#22C55E" opacity="0.4" rx="2">
              <animate attributeName="width" values={`${width};${width+5};${width}`} dur="3.5s" begin={`${i*0.1}s`} repeatCount="indefinite"/>
            </rect>
          ))}
        </svg>
      </div>

      {/* Middle Right - RSI Indicator */}
      <div className="absolute right-4 top-1/3 w-80 h-64 pointer-events-none opacity-25 hover:opacity-40 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 400 350">
          <text x="10" y="20" fill="#EC4899" fontSize="9" fontFamily="monospace" fontWeight="bold">RSI (14)</text>
          
          <line x1="0" y1="80" x2="400" y2="80" stroke="#EF4444" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"/>
          <line x1="0" y1="270" x2="400" y2="270" stroke="#22C55E" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"/>
          <line x1="0" y1="175" x2="400" y2="175" stroke="#8B5CF6" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"/>
          
          <polyline stroke="#EC4899" strokeWidth="2" fill="none">
            <animate attributeName="points"
              values="0,175 20,165 40,180 60,155 80,145 100,170 120,140 140,130 160,155 180,135 200,125 220,150 240,140 260,130 280,145 300,120 320,115 340,135 360,125 380,130 400,120;
                      0,175 20,170 40,175 60,160 80,150 100,165 120,145 140,140 160,150 180,140 200,135 220,145 240,135 260,130 280,140 300,125 320,120 340,130 360,120 380,125 400,115;
                      0,175 20,165 40,180 60,155 80,145 100,170 120,140 140,130 160,155 180,135 200,125 220,150 240,140 260,130 280,145 300,120 320,115 340,135 360,125 380,130 400,120"
              dur="4s" repeatCount="indefinite"/>
          </polyline>
        </svg>
      </div>

      {/* Fibonacci Retracement */}
      <div className="absolute left-1/4 top-1/2 w-72 h-56 pointer-events-none opacity-20 hover:opacity-35 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 360 280">
          <text x="10" y="20" fill="#A855F7" fontSize="9" fontFamily="monospace" fontWeight="bold">FIBONACCI</text>
          
          <line x1="30" y1="240" x2="330" y2="240" stroke="#22C55E" strokeWidth="0.8" strokeDasharray="4,4"/>
          <line x1="30" y1="200" x2="330" y2="200" stroke="#22C55E" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"/>
          <line x1="30" y1="160" x2="330" y2="160" stroke="#22C55E" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"/>
          <line x1="30" y1="120" x2="330" y2="120" stroke="#22C55E" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"/>
          <line x1="30" y1="80" x2="330" y2="80" stroke="#22C55E" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"/>
          <line x1="30" y1="40" x2="330" y2="40" stroke="#22C55E" strokeWidth="0.8" strokeDasharray="4,4"/>
          
          <text x="5" y="244" fill="#22C55E" fontSize="6" fontFamily="monospace">0%</text>
          <text x="5" y="204" fill="#64748B" fontSize="6" fontFamily="monospace">23.6%</text>
          <text x="5" y="164" fill="#64748B" fontSize="6" fontFamily="monospace">38.2%</text>
          <text x="5" y="124" fill="#64748B" fontSize="6" fontFamily="monospace">50%</text>
          <text x="5" y="84" fill="#64748B" fontSize="6" fontFamily="monospace">61.8%</text>
          <text x="5" y="44" fill="#22C55E" fontSize="6" fontFamily="monospace">100%</text>
          
          <polyline stroke="#A855F7" strokeWidth="1.5" fill="none" points="30,240 60,220 90,230 120,180 150,190 180,140 210,150 240,100 270,110 300,60 330,70">
            <animate attributeName="points" 
              values="30,240 60,220 90,230 120,180 150,190 180,140 210,150 240,100 270,110 300,60 330,70;
                      30,240 60,225 90,225 120,185 150,185 180,145 210,145 240,105 270,105 300,65 330,65;
                      30,240 60,220 90,230 120,180 150,190 180,140 210,150 240,100 270,110 300,60 330,70"
              dur="5s" repeatCount="indefinite"/>
          </polyline>
        </svg>
      </div>

      {/* Heat Map */}
      <div className="absolute right-1/4 top-1/2 w-72 h-56 pointer-events-none opacity-20 hover:opacity-35 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 360 280">
          <text x="10" y="20" fill="#F97316" fontSize="9" fontFamily="monospace" fontWeight="bold">HEAT MAP</text>
          
          {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
            [0, 1, 2, 3, 4, 5, 6, 7].map((col) => {
              const value = (row + col) / 14;
              const intensity = Math.min(0.9, Math.max(0.3, value));
              const isGreen = (row + col) % 3 === 0;
              const isRed = (row + col) % 3 === 1;
              const isPurple = (row + col) % 3 === 2;
              const color = isGreen ? "#22C55E" : isRed ? "#EF4444" : "#8B5CF6";
              
              return (
                <rect
                  key={`${row}-${col}`}
                  x={40 + col * 38}
                  y={40 + row * 28}
                  width="34"
                  height="24"
                  fill={color}
                  opacity={intensity}
                  rx="3"
                >
                  <animate attributeName="opacity" values={`${intensity};${intensity+0.2};${intensity}`} dur={`${2 + (row+col)*0.2}s`} repeatCount="indefinite"/>
                </rect>
              );
            })
          ))}
          
          <text x="40" y="270" fill="#22C55E" fontSize="7" fontFamily="monospace">Low</text>
          <text x="280" y="270" fill="#EF4444" fontSize="7" fontFamily="monospace">High</text>
        </svg>
      </div>

      {/* Bottom Left - MACD */}
      <div className="absolute left-4 bottom-4 w-96 h-40 pointer-events-none opacity-25 hover:opacity-40 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 500 200">
          <text x="10" y="15" fill="#8B5CF6" fontSize="9" fontFamily="monospace" fontWeight="bold">MACD</text>
          
          {[20, 35, 50, 65, 80, 95, 110, 125, 140, 155, 170, 185, 200, 215, 230, 245, 260, 275, 290, 305, 320, 335, 350, 365, 380, 395, 410, 425, 440, 455, 470, 485].map((x, i) => {
            const height = (i % 6) * 8;
            return (
              <rect key={i} x={x} y={100 - height} width="6" height={height} fill={i % 2 === 0 ? "#22C55E" : "#EF4444"} opacity="0.5" rx="1">
                <animate attributeName="height" values={`${height};${height+5};${height}`} dur="2s" begin={`${i*0.05}s`} repeatCount="indefinite"/>
              </rect>
            );
          })}
          
          <polyline stroke="#8B5CF6" strokeWidth="1.5" fill="none" points="0,100 30,95 60,105 90,90 120,85 150,98 180,80 210,75 240,90 270,85 300,95 330,80 360,75 390,88 420,85 450,90 480,82">
            <animate attributeName="points" 
              values="0,100 30,95 60,105 90,90 120,85 150,98 180,80 210,75 240,90 270,85 300,95 330,80 360,75 390,88 420,85 450,90 480,82;
                      0,100 30,98 60,100 90,95 120,90 150,95 180,85 210,80 240,85 270,90 300,90 330,85 360,80 390,85 420,88 450,85 480,85;
                      0,100 30,95 60,105 90,90 120,85 150,98 180,80 210,75 240,90 270,85 300,95 330,80 360,75 390,88 420,85 450,90 480,82"
              dur="4s" repeatCount="indefinite"/>
          </polyline>
        </svg>
      </div>

      {/* Bottom Right - Bollinger Bands */}
      <div className="absolute right-4 bottom-4 w-96 h-40 pointer-events-none opacity-25 hover:opacity-40 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 500 200">
          <text x="10" y="15" fill="#06B6D4" fontSize="9" fontFamily="monospace" fontWeight="bold">BOLLINGER BANDS</text>
          
          <polyline stroke="#8B5CF6" strokeWidth="1" fill="none" points="0,50 25,55 50,45 75,60 100,50 125,45 150,55 175,50 200,45 225,55 250,50 275,45 300,55 325,50 350,45 375,55 400,50 425,45 450,55 475,50 500,45">
            <animate attributeName="points" 
              values="0,50 25,55 50,45 75,60 100,50 125,45 150,55 175,50 200,45 225,55 250,50 275,45 300,55 325,50 350,45 375,55 400,50 425,45 450,55 475,50 500,45;
                      0,55 25,50 50,55 75,50 100,55 125,50 150,50 175,55 200,50 225,50 250,55 275,50 300,50 325,55 350,50 375,50 400,55 425,50 450,50 475,55 500,50;
                      0,50 25,55 50,45 75,60 100,50 125,45 150,55 175,50 200,45 225,55 250,50 275,45 300,55 325,50 350,45 375,55 400,50 425,45 450,55 475,50 500,45"
              dur="5s" repeatCount="indefinite"/>
          </polyline>
          
          <polyline stroke="#22C55E" strokeWidth="1.5" fill="none" points="0,100 25,105 50,95 75,110 100,100 125,95 150,105 175,100 200,95 225,105 250,100 275,95 300,105 325,100 350,95 375,105 400,100 425,95 450,105 475,100 500,95">
            <animate attributeName="points" 
              values="0,100 25,105 50,95 75,110 100,100 125,95 150,105 175,100 200,95 225,105 250,100 275,95 300,105 325,100 350,95 375,105 400,100 425,95 450,105 475,100 500,95;
                      0,105 25,100 50,105 75,100 100,105 125,100 150,100 175,105 200,100 225,100 250,105 275,100 300,100 325,105 350,100 375,100 400,105 425,100 450,100 475,105 500,100;
                      0,100 25,105 50,95 75,110 100,100 125,95 150,105 175,100 200,95 225,105 250,100 275,95 300,105 325,100 350,95 375,105 400,100 425,95 450,105 475,100 500,95"
              dur="5s" repeatCount="indefinite"/>
          </polyline>
          
          <polyline stroke="#8B5CF6" strokeWidth="1" fill="none" points="0,150 25,155 50,145 75,160 100,150 125,145 150,155 175,150 200,145 225,155 250,150 275,145 300,155 325,150 350,145 375,155 400,150 425,145 450,155 475,150 500,145">
            <animate attributeName="points" 
              values="0,150 25,155 50,145 75,160 100,150 125,145 150,155 175,150 200,145 225,155 250,150 275,145 300,155 325,150 350,145 375,155 400,150 425,145 450,155 475,150 500,145;
                      0,155 25,150 50,155 75,150 100,155 125,150 150,150 175,155 200,150 225,150 250,155 275,150 300,150 325,155 350,150 375,150 400,155 425,150 450,150 475,155 500,150;
                      0,150 25,155 50,145 75,160 100,150 125,145 150,155 175,150 200,145 225,155 250,150 275,145 300,155 325,150 350,145 375,155 400,150 425,145 450,155 475,150 500,145"
              dur="5s" repeatCount="indefinite"/>
          </polyline>
        </svg>
      </div>

      {/* Radar Chart */}
      <div className="absolute left-1/3 bottom-1/3 w-64 h-64 pointer-events-none opacity-15 hover:opacity-25 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 300 300">
          <text x="110" y="15" fill="#EC4899" fontSize="8" fontFamily="monospace" fontWeight="bold">RADAR</text>
          
          <polygon points="150,30 270,110 230,260 70,260 30,110" fill="none" stroke="#8B5CF6" strokeWidth="0.8" opacity="0.5"/>
          <polygon points="150,70 240,130 210,230 90,230 60,130" fill="none" stroke="#8B5CF6" strokeWidth="0.5" opacity="0.3"/>
          <polygon points="150,110 210,150 190,200 110,200 90,150" fill="none" stroke="#8B5CF6" strokeWidth="0.5" opacity="0.3"/>
          <polygon points="150,150 180,170 170,180 130,180 120,170" fill="none" stroke="#8B5CF6" strokeWidth="0.5" opacity="0.3"/>
          
          <polygon points="150,30 270,110 230,260 70,260 30,110" fill="#22C55E" opacity="0.15">
            <animate attributeName="points" 
              values="150,30 270,110 230,260 70,260 30,110;
                      150,50 260,120 220,250 80,250 40,120;
                      150,30 270,110 230,260 70,260 30,110"
              dur="6s" repeatCount="indefinite"/>
          </polygon>
          
          <text x="255" y="115" fill="#64748B" fontSize="7" fontFamily="monospace">Tech</text>
          <text x="225" y="275" fill="#64748B" fontSize="7" fontFamily="monospace">Product</text>
          <text x="50" y="275" fill="#64748B" fontSize="7" fontFamily="monospace">Market</text>
          <text x="15" y="115" fill="#64748B" fontSize="7" fontFamily="monospace">Sales</text>
          <text x="140" y="25" fill="#64748B" fontSize="7" fontFamily="monospace">Growth</text>
        </svg>
      </div>

      {/* Scatter Plot Network */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          {scatterPositions.map((pos, i) => (
            <circle key={i} cx={pos.cx} cy={pos.cy} r="2" fill="#8B5CF6">
              <animate attributeName="r" values="1;3;1" dur={`${2 + i % 3}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i % 3}s`} repeatCount="indefinite"/>
            </circle>
          ))}
          
          {connectionLines.map((line, i) => (
            <line key={`line-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#22C55E" strokeWidth="0.5" opacity="0.2">
              <animate attributeName="opacity" values="0.1;0.3;0.1" dur={`${3 + i % 4}s`} repeatCount="indefinite"/>
            </line>
          ))}
        </svg>
      </div>

      {/* ========== MAIN CONTENT - LOGO LOWER WITH GLOW ========== */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        
        {/* GLOW EFFECT BEHIND LOGO */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primaryPurple/40 via-primaryBlue/30 to-primaryCyan/40 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute inset-10 bg-gradient-to-r from-primaryPurple/20 to-primaryCyan/20 rounded-full blur-[80px] animate-pulse-slow animation-delay-2000" />
        </div>
        
        {/* Logo Section - Moved lower */}
        <div className="text-center mt-20">
          <div className="relative inline-block">
            <Image
              src="/logo.png"
              alt="MEYO Logo"
              width="140"
              height="140"
              priority
              className="relative z-10 drop-shadow-2xl"
            />
          </div>
        </div>
        
        {/* Title - Smaller and White */}
        <h1 className="text-white font-bold text-3xl md:text-4xl mt-4 mb-3 tracking-wide">
          MEYO
        </h1>
        
        {/* Accent Line */}
        <div className="w-16 h-px bg-gradient-to-r from-primaryPurple/50 via-primaryBlue/50 to-primaryGreen/50 rounded-full mb-4" />
        
        {/* Subtitle */}
        <p className="text-textSecondary text-sm md:text-base tracking-wide mb-10 max-w-md text-center">
          Startup Management Platform
        </p>

        {/* Premium Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/login")}
            className="group relative overflow-hidden px-8 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #22C55E 100%)",
              boxShadow: "0 0 25px rgba(37,99,235,.25)"
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>

          <button
            onClick={() => router.push("/signup")}
            className="group px-8 py-3 rounded-xl text-textPrimary font-semibold text-sm bg-card border border-borderGlow hover:border-primaryPurple hover:bg-darkSoft transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-4 h-4 group-hover:text-primaryPurple transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Sign Up
          </button>
        </div>

        {/* Footer Note */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-textMuted text-xs tracking-wide">
            © 2024 MEYO. All rights reserved.
          </p>
        </div>

      </div>

      {/* Floating Sparkle */}
      <div className="absolute bottom-6 right-6 text-textMuted/30 text-xl animate-pulse">
        ✦
      </div>

      <style jsx>{`
        @keyframes floatRandom {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          20% {
            opacity: 0.4;
          }
          80% {
            opacity: 0.4;
          }
          100% {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animate-pulse {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
      
    </main>
  );
}