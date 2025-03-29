'use client';

import { useState, useEffect } from 'react';
import { ZBORSA_CONSTANTS } from '@obscuranet/shared';

interface DataPoint {
  time: string;
  rate: number;
}

interface TokenChartProps {
  fromToken: string;
  toToken: string;
}

export default function TokenChart({ fromToken, toToken }: TokenChartProps) {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Generate mock historical data for the chart
  useEffect(() => {
    if (!fromToken || !toToken) return;
    
    // Find the current rate from the constants
    const pair = ZBORSA_CONSTANTS.DEFAULT_TOKEN_PAIRS.find(
      p => p.fromToken === fromToken && p.toToken === toToken
    );
    
    if (!pair) {
      setChartData([]);
      setIsLoading(false);
      return;
    }
    
    // Generate 30 days of mock data
    const generateMockData = () => {
      const today = new Date();
      const data: DataPoint[] = [];
      let currentRate = pair.rate;
      
      // Start from 30 days ago
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        // Add some randomness to the rate (±5%)
        const randomFactor = 1 + (Math.random() * 0.1 - 0.05);
        currentRate *= randomFactor;
        
        // Format date as MM/DD
        const time = `${date.getMonth() + 1}/${date.getDate()}`;
        
        data.push({
          time,
          rate: parseFloat(currentRate.toFixed(4))
        });
      }
      
      return data;
    };
    
    setChartData(generateMockData());
    setIsLoading(false);
  }, [fromToken, toToken]);
  
  // Simple SVG line chart
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      );
    }
    
    if (chartData.length === 0) {
      return (
        <div className="flex justify-center items-center h-48 text-gray-500 dark:text-gray-400">
          No data available for this pair
        </div>
      );
    }
    
    // Calculate min and max for scaling
    const rates = chartData.map(point => point.rate);
    const minRate = Math.min(...rates) * 0.95; // Add some padding
    const maxRate = Math.max(...rates) * 1.05;
    
    // Chart dimensions
    const width = 500;
    const height = 200;
    const padding = 40;
    
    // Scaling functions
    const xScale = (index: number) => (padding + (index / (chartData.length - 1)) * (width - 2 * padding));
    const yScale = (value: number) => (height - padding - ((value - minRate) / (maxRate - minRate)) * (height - 2 * padding));
    
    // Generate path data
    const pathData = chartData.map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.rate);
      return index === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    }).join(' ');
    
    // Generate x-axis labels (every 5 days)
    const xLabels = chartData.filter((_, index) => index % 5 === 0).map((point, index) => ({
      label: point.time,
      x: xScale(index * 5)
    }));
    
    // Generate y-axis labels
    const yLabels = [
      { label: maxRate.toFixed(4), y: yScale(maxRate) },
      { label: ((maxRate + minRate) / 2).toFixed(4), y: yScale((maxRate + minRate) / 2) },
      { label: minRate.toFixed(4), y: yScale(minRate) }
    ];
    
    return (
      <div className="overflow-x-auto pt-4">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto">
          {/* X axis */}
          <line 
            x1={padding} 
            y1={height - padding} 
            x2={width - padding} 
            y2={height - padding} 
            stroke="#CBD5E0" 
            strokeWidth="1"
          />
          
          {/* Y axis */}
          <line 
            x1={padding} 
            y1={padding} 
            x2={padding} 
            y2={height - padding} 
            stroke="#CBD5E0" 
            strokeWidth="1"
          />
          
          {/* X labels */}
          {xLabels.map((label, i) => (
            <g key={`x-label-${i}`}>
              <text 
                x={label.x} 
                y={height - padding + 15} 
                textAnchor="middle" 
                fontSize="10" 
                fill="#718096"
              >
                {label.label}
              </text>
              <line 
                x1={label.x} 
                y1={height - padding} 
                x2={label.x} 
                y2={height - padding + 5} 
                stroke="#CBD5E0" 
                strokeWidth="1"
              />
            </g>
          ))}
          
          {/* Y labels */}
          {yLabels.map((label, i) => (
            <g key={`y-label-${i}`}>
              <text 
                x={padding - 10} 
                y={label.y + 4} 
                textAnchor="end" 
                fontSize="10" 
                fill="#718096"
              >
                {label.label}
              </text>
              <line 
                x1={padding - 5} 
                y1={label.y} 
                x2={padding} 
                y2={label.y} 
                stroke="#CBD5E0" 
                strokeWidth="1"
              />
            </g>
          ))}
          
          {/* Grid lines */}
          {yLabels.map((label, i) => (
            <line 
              key={`grid-y-${i}`}
              x1={padding} 
              y1={label.y} 
              x2={width - padding} 
              y2={label.y} 
              stroke="#CBD5E0" 
              strokeWidth="0.5" 
              strokeDasharray="2,2"
            />
          ))}
          
          {/* Line chart */}
          <path 
            d={pathData} 
            fill="none" 
            stroke="#4F46E5" 
            strokeWidth="2"
          />
          
          {/* Data points */}
          {chartData.map((point, index) => (
            <circle 
              key={`point-${index}`}
              cx={xScale(index)} 
              cy={yScale(point.rate)} 
              r="2" 
              fill="#4F46E5"
            />
          ))}
        </svg>
      </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {fromToken}/{toToken} Rate History
        </h2>
      </div>
      
      <div className="p-4">
        {renderChart()}
        
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          Historical rate over the last 30 days
        </div>
      </div>
    </div>
  );
}