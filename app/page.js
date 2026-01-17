'use client';

import { useState, useEffect } from 'react';
import {
  Trash2,
  RefreshCcw,
  Activity,
  AlertTriangle,
  Thermometer,
  Droplets,
  Cloud
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        Loading Smart Bin Data...
      </div>
    );
  }

  // --- Current Data ---
  const level = data?.current?.level ?? 0;
  const motion = data?.current?.motion ?? false;
  const temperature = data?.current?.temperature ?? 0;
  const humidity = data?.current?.humidity ?? 0;
  const timestamp = data?.current?.timestamp;

  // --- Weather ---
  const weatherTemp = data?.weather?.temp;
  const weatherCondition = data?.weather?.condition;

  // --- Smart Rules ---
  const isFull = level >= 80;
  const fireRisk = temperature >= 50;
  const odorRisk = humidity >= 75;
  const criticalAlert = fireRisk && odorRisk;

  // --- Chart Data ---
  const chartData = data?.history.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    level: item.level
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Smart Dustbin Dashboard
            </h1>
            <p className="text-gray-500">
              IoT Monitoring with Environmental Intelligence
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm bg-white px-3 py-1 rounded-full shadow">
            <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
            <span>Live</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Fill Level */}
          <div className={`p-6 rounded-2xl border shadow-sm ${
            isFull ? 'bg-red-50 border-red-200' : 'bg-white'
          }`}>
            <div className="flex justify-between mb-4">
              <h3 className="text-gray-500">Fill Level</h3>
              <Trash2 className={isFull ? 'text-red-600' : 'text-green-600'} />
            </div>
            <span className={`text-5xl font-bold ${
              isFull ? 'text-red-600' : 'text-gray-900'
            }`}>
              {level}%
            </span>
            {isFull && (
              <p className="text-red-600 mt-2 flex items-center text-sm">
                <AlertTriangle size={16} className="mr-1" />
                Bin is full
              </p>
            )}
          </div>

          {/* Motion */}
          <div className="p-6 rounded-2xl bg-white border shadow-sm">
            <div className="flex justify-between mb-4">
              <h3 className="text-gray-500">Motion</h3>
              <Activity className="text-blue-500" />
            </div>
            <div className="flex items-center space-x-3">
              <div className={`h-4 w-4 rounded-full ${
                motion ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              }`} />
              <span className="text-2xl font-bold">
                {motion ? 'Detected' : 'Idle'}
              </span>
            </div>
          </div>

          {/* Last Update */}
          <div className="p-6 rounded-2xl bg-white border shadow-sm">
            <div className="flex justify-between mb-4">
              <h3 className="text-gray-500">Last Update</h3>
              <RefreshCcw className="text-purple-500" />
            </div>
            <span className="text-xl font-bold">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Environmental Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Temperature */}
          <div className={`p-6 rounded-2xl border shadow-sm ${
            fireRisk ? 'bg-red-50 border-red-200' : 'bg-white'
          }`}>
            <div className="flex justify-between mb-4">
              <h3 className="text-gray-500">Temperature</h3>
              <Thermometer className="text-orange-500" />
            </div>
            <span className={`text-4xl font-bold ${
              fireRisk ? 'text-red-600' : 'text-gray-900'
            }`}>
              {temperature}°C
            </span>
            {fireRisk && (
              <p className="text-red-600 text-sm mt-2">
                Fire risk detected
              </p>
            )}
          </div>

          {/* Humidity */}
          <div className={`p-6 rounded-2xl border shadow-sm ${
            odorRisk ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
          }`}>
            <div className="flex justify-between mb-4">
              <h3 className="text-gray-500">Humidity</h3>
              <Droplets className="text-blue-500" />
            </div>
            <span className="text-4xl font-bold">
              {humidity}%
            </span>
            {odorRisk && (
              <p className="text-yellow-700 text-sm mt-2">
                High odor risk
              </p>
            )}
          </div>

          {/* Weather */}
          <div className="p-6 rounded-2xl bg-white border shadow-sm">
            <div className="flex justify-between mb-4">
              <h3 className="text-gray-500">Outdoor Weather</h3>
              <Cloud className="text-sky-500" />
            </div>
            <span className="text-3xl font-bold">
              {weatherTemp}°C
            </span>
            <p className="text-gray-500 text-sm">
              {weatherCondition}
            </p>
          </div>
        </div>

        {/* Critical Alert */}
        {criticalAlert && (
          <div className="bg-red-100 border border-red-300 p-4 rounded-xl flex items-center space-x-3">
            <AlertTriangle className="text-red-600" />
            <p className="text-red-700 font-medium">
              Critical Alert: High temperature and humidity detected.
              Immediate inspection required.
            </p>
          </div>
        )}

        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-bold mb-4">Fill Level History</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="level"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </main>
  );
}
