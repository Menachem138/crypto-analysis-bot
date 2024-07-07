import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const MarketChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');

      // Destroy existing chart instance if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      console.log('Creating new chart instance with data:', data); // Log the data being passed to the chart

      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map((entry) => entry.date),
          datasets: [
            {
              label: 'Price',
              data: data.map((entry) => entry.price),
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'day',
              },
            },
            y: {
              beginAtZero: false,
            },
          },
        },
      });

      console.log('Chart instance created:', chartInstanceRef.current); // Log the created chart instance
    }

    // Cleanup function to destroy chart instance on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={chartRef} />;
};

export default MarketChart;
