import React from 'react';
import { Card } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';

const CalibrationGraph = ({ equipment }) => {
  console.log('Equipment data:', equipment);

  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Error Trend',
        data: [0.001, 0.002, 0.0015, 0.0018, 0.002, 0.0022],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Calibration Error Trend'
      }
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Line data={data} options={options} />
      </Card.Body>
    </Card>
  );
};

export default CalibrationGraph; 