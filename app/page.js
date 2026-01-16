'use client';

import { useState, useEffect } from 'react';
import { Trash2, RefreshCcw, Activity, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">Loading Smart Bin Data...</div>;

  const currentLevel = data?.current?.level || 0;
  const isMotion = data?.current?.motion || false;
  const isFull = currentLevel >= 80;

  // Format timestamp for chart
  const chartData = data?.history.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    level: item.level
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Smart Bin Dashboard</h1>
            <p className="text-gray-500">Live IoT Telemetry from GCP & MongoDB</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span>Live System</span>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Fill Level */}
          <div className={`p-6 rounded-2xl shadow-sm border transition-all ${isFull ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Current Fill Level</h3>
              <Trash2 className={isFull ? "text-red-500" : "text-green-500"} />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className={`text-5xl font-bold ${isFull ? "text-red-600" : "text-gray-900"}`}>
                {currentLevel}%
              </span>
            </div>
            {isFull && <p className="text-red-600 text-sm mt-2 font-medium flex items-center"><AlertTriangle size={16} className="mr-1"/> Bin is Full!</p>}
          </div>

          {/* Card 2: Motion Sensor */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Motion Status</h3>
              <Activity className="text-blue-500" />
            </div>
            <div className="flex items-center space-x-3">
              <div className={`h-4 w-4 rounded-full ${isMotion ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-2xl font-bold text-gray-900">{isMotion ? "Detected" : "No Motion"}</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Updates in real-time</p>
          </div>

           {/* Card 3: System Health */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Last Updated</h3>
              <RefreshCcw className="text-purple-500" size={20}/>
            </div>
            <span className="text-xl font-bold text-gray-900">
              {new Date(data?.current?.timestamp).toLocaleTimeString()}
            </span>
            <p className="text-gray-400 text-sm mt-2">Syncing every 5s</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Fill Level History</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Line 
                  type="monotone" 
                  dataKey="level" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={{r: 4, fill: '#2563eb'}} 
                  activeDot={{r: 6}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </main>
  );
}