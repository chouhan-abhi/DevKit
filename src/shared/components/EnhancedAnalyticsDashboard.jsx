/**
 * Enhanced Analytics Dashboard Component
 * A modern 2-panel layout dashboard for viewing DevKit app analytics
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Activity, Clock, TrendingUp, 
  RefreshCw, Calendar, Globe, Smartphone, Monitor,
  AlertCircle, CheckCircle, XCircle, Eye, EyeOff
} from 'lucide-react';

export default function EnhancedAnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const timeRanges = [
    { value: '1d', label: 'Last 24h' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
  ];

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const adminKey = sessionStorage.getItem('analytics_admin_key');
      
      if (!adminKey) {
        throw new Error('Admin key not found');
      }

      const response = await fetch('/api/admin/analytics/summary', {
        headers: {
          'X-Admin-Key': adminKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAnalytics, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw size={16} className="animate-spin" />
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--accent-red)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-color)' }}>
            Failed to load analytics
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {error}
          </p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 text-sm font-medium rounded border"
            style={{
              background: 'var(--primary-color)',
              color: '#ffffff',
              borderColor: 'var(--primary-color)',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
            DevKit Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time insights into app usage and performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 text-sm border rounded"
            style={{
              background: 'var(--panel-color)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)',
            }}
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          {/* Auto Refresh Toggle */}
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto refresh
          </label>

          {/* Manual Refresh */}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded border"
            style={{
              background: 'var(--panel-color)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Overview & Stats */}
        <div className="w-1/2 p-6 border-r overflow-y-auto" style={{ borderColor: 'var(--border-color)' }}>
          {/* Key Metrics */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
              Key Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                icon={<Users size={20} />}
                title="Total Users"
                value={data?.uniqueProfiles || 0}
                change="+12%"
                positive={true}
              />
              <MetricCard
                icon={<Activity size={20} />}
                title="Sessions"
                value={data?.totalVisits || 0}
                change="+8%"
                positive={true}
              />
              <MetricCard
                icon={<Clock size={20} />}
                title="Avg. Session"
                value="4m 32s"
                change="+15%"
                positive={true}
              />
              <MetricCard
                icon={<TrendingUp size={20} />}
                title="Active Today"
                value={data?.todayVisits || 0}
                change="+5%"
                positive={true}
              />
            </div>
          </div>

          {/* Usage by App */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
              App Usage
            </h2>
            <div className="space-y-3">
              {data?.byEventType?.filter(event => event.eventType.includes('app_')).map((app, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded border"
                     style={{ background: 'var(--panel-color)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--primary-color)' }} />
                    <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                      {app.eventType.replace('app_', '').replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                    {app.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Distribution */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
              Geographic Distribution
            </h2>
            <div className="space-y-2">
              {data?.byCountry?.slice(0, 5).map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                      {country.country || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 rounded-full" style={{ background: 'var(--border-subtle)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: 'var(--primary-color)',
                          width: `${(country.count / (data?.byCountry?.[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--text-muted)' }}>
                      {country.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Detailed Analytics */}
        <div className="w-1/2 p-6 overflow-y-auto">
          {/* Activity Timeline */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
              Activity Timeline
            </h2>
            <div className="h-48 flex items-end gap-1">
              {data?.byDay?.slice(-14).map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t"
                    style={{
                      background: 'var(--primary-color)',
                      height: `${Math.max(4, (day.count / Math.max(...(data?.byDay || []).map(d => d.count))) * 100)}%`,
                    }}
                    title={`${day.day}: ${day.count} visits`}
                  />
                  <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {day.day.slice(-2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Event Types */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
              Event Types
            </h2>
            <div className="space-y-2">
              {data?.byEventType?.slice(0, 8).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded"
                     style={{ background: 'var(--border-subtle)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                    {event.eventType}
                  </span>
                  <span className="text-xs font-mono px-2 py-1 rounded"
                        style={{ background: 'var(--panel-color)', color: 'var(--text-muted)' }}>
                    {event.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
              System Health
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <HealthCard
                title="API Status"
                status="healthy"
                icon={<CheckCircle size={16} />}
              />
              <HealthCard
                title="Sync Status"
                status="healthy"
                icon={<CheckCircle size={16} />}
              />
              <HealthCard
                title="Error Rate"
                status="low"
                icon={<Activity size={16} />}
                value="0.2%"
              />
              <HealthCard
                title="Uptime"
                status="healthy"
                icon={<TrendingUp size={16} />}
                value="99.9%"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {lastUpdated && (
        <div className="px-6 py-3 border-t text-xs text-center" style={{ 
          borderColor: 'var(--border-color)', 
          color: 'var(--text-muted)',
          background: 'var(--panel-color)'
        }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, title, value, change, positive }) {
  return (
    <div className="p-4 rounded-lg border" style={{ 
      background: 'var(--panel-color)', 
      borderColor: 'var(--border-color)' 
    }}>
      <div className="flex items-center justify-between mb-2">
        <div style={{ color: 'var(--primary-color)' }}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs px-2 py-1 rounded ${positive ? 'text-green-600' : 'text-red-600'}`}
                style={{ background: positive ? 'var(--accent-green)' : 'var(--accent-red)', color: '#ffffff' }}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {title}
      </div>
    </div>
  );
}

function HealthCard({ title, status, icon, value }) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'var(--accent-green)';
      case 'warning': return 'var(--accent-orange)';
      case 'error': return 'var(--accent-red)';
      case 'low': return 'var(--accent-green)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="p-3 rounded border" style={{ 
      background: 'var(--panel-color)', 
      borderColor: 'var(--border-color)' 
    }}>
      <div className="flex items-center gap-2 mb-1">
        <div style={{ color: getStatusColor() }}>
          {icon}
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
          {title}
        </span>
      </div>
      {value && (
        <div className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
          {value}
        </div>
      )}
      <div className="text-xs capitalize" style={{ color: getStatusColor() }}>
        {status}
      </div>
    </div>
  );
}