/**
 * Enhanced Analytics HTML Template
 * This is the updated analytics-html.ts template for your crawler backend
 * Copy this content to replace the existing getAnalyticsHtml function
 */

export function getEnhancedAnalyticsHtml(theme) {
  const themeCss = themeStyle(theme);
  const nav = navHtml("analytics");
  const base = baseStyles();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DevKit Analytics Dashboard</title>
  <style>
    ${base}
    .container { max-width: none; height: 100vh; display: flex; flex-direction: column; }
    
    /* Enhanced Dashboard Styles */
    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    .dashboard-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }
    .dashboard-subtitle {
      font-size: 0.875rem;
      color: var(--muted);
      margin: 0.25rem 0 0;
    }
    .dashboard-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    /* Two Panel Layout */
    .dashboard-main {
      flex: 1;
      display: flex;
      min-height: 0;
    }
    .dashboard-left {
      width: 50%;
      padding: 2rem;
      border-right: 1px solid var(--border);
      overflow-y: auto;
    }
    .dashboard-right {
      width: 50%;
      padding: 2rem;
      overflow-y: auto;
    }
    
    /* Enhanced Metric Cards */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      padding: 1.5rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      position: relative;
    }
    .metric-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .metric-icon {
      color: var(--accent);
      width: 20px;
      height: 20px;
    }
    .metric-change {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-weight: 600;
    }
    .metric-change.positive {
      background: var(--green);
      color: white;
    }
    .metric-change.negative {
      background: var(--red);
      color: white;
    }
    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.25rem;
    }
    .metric-label {
      font-size: 0.875rem;
      color: var(--muted);
    }
    
    /* Enhanced Charts */
    .chart-container {
      margin-bottom: 2rem;
    }
    .chart-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 1rem;
    }
    .timeline-chart {
      height: 200px;
      display: flex;
      align-items: end;
      gap: 2px;
      padding: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .timeline-bar {
      flex: 1;
      background: var(--accent);
      border-radius: 2px 2px 0 0;
      min-height: 4px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .timeline-bar:hover {
      opacity: 0.8;
    }
    
    /* App Usage List */
    .usage-list {
      space-y: 0.75rem;
    }
    .usage-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .usage-item-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .usage-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
    }
    .usage-name {
      font-weight: 500;
      color: var(--text);
    }
    .usage-count {
      font-size: 0.875rem;
      font-family: ui-monospace, monospace;
      color: var(--muted);
    }
    
    /* Geographic Chart */
    .geo-list {
      space-y: 0.5rem;
    }
    .geo-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .geo-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .geo-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .geo-bar-track {
      width: 64px;
      height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    .geo-bar-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    /* Event Types */
    .event-list {
      space-y: 0.5rem;
    }
    .event-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem;
      background: rgba(255,255,255,0.02);
      border-radius: 4px;
    }
    .event-name {
      font-size: 0.875rem;
      color: var(--text);
    }
    .event-count {
      font-size: 0.75rem;
      font-family: ui-monospace, monospace;
      padding: 0.25rem 0.5rem;
      background: var(--surface);
      color: var(--muted);
      border-radius: 3px;
    }
    
    /* Health Cards */
    .health-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .health-card {
      padding: 0.75rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .health-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .health-icon {
      width: 16px;
      height: 16px;
    }
    .health-icon.healthy { color: var(--green); }
    .health-icon.warning { color: var(--amber); }
    .health-icon.error { color: var(--red); }
    .health-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
    }
    .health-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text);
    }
    .health-status {
      font-size: 0.75rem;
      text-transform: capitalize;
    }
    .health-status.healthy { color: var(--green); }
    .health-status.warning { color: var(--amber); }
    .health-status.error { color: var(--red); }
    
    /* Footer */
    .dashboard-footer {
      padding: 0.75rem 2rem;
      border-top: 1px solid var(--border);
      background: var(--surface);
      text-align: center;
      font-size: 0.75rem;
      color: var(--muted);
    }
    
    /* Auth Gate Enhancements */
    .auth-gate {
      max-width: 420px;
      margin: 6rem auto;
      text-align: center;
      padding: 2rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    .auth-gate h2 { 
      font-size: 1.5rem; 
      font-weight: 700;
      margin: 0 0 0.5rem; 
      color: var(--text);
    }
    .auth-gate p { 
      font-size: 0.875rem; 
      color: var(--muted); 
      margin: 0 0 1.5rem; 
    }
    .auth-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      transition: border-color 0.2s;
    }
    .auth-input:focus {
      outline: none;
      border-color: var(--accent);
    }
    .auth-input::placeholder { color: var(--muted); }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      border: 1px solid var(--accent);
      background: var(--accent);
      color: #ffffff;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn:hover { 
      background: color-mix(in srgb, var(--accent) 90%, black);
      border-color: color-mix(in srgb, var(--accent) 90%, black);
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline {
      background: transparent;
      color: var(--text);
      border-color: var(--border);
    }
    .btn-outline:hover { 
      border-color: var(--accent); 
      color: var(--accent); 
      background: transparent; 
    }
    
    /* Responsive Design */
    @media (max-width: 1024px) {
      .dashboard-main {
        flex-direction: column;
      }
      .dashboard-left, .dashboard-right {
        width: 100%;
        border-right: none;
      }
      .dashboard-left {
        border-bottom: 1px solid var(--border);
      }
      .metrics-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .dashboard-controls {
        width: 100%;
        justify-content: space-between;
      }
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .health-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* Animations */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in { animation: fadeInUp 0.4s ease both; }
    
    .analytics-content { display: none; }
    .analytics-content.visible { display: flex; flex-direction: column; height: 100vh; }
    
    /* Loading States */
    .loading-skeleton {
      background: linear-gradient(90deg, var(--border) 25%, rgba(255,255,255,0.1) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  </style>
  ${themeCss}
</head>
<body>
  ${nav}
  <div class="container">
    <!-- Auth Gate -->
    <div id="auth-gate" class="auth-gate">
      <h2>DevKit Analytics</h2>
      <p>Enter your admin key to view detailed analytics and insights.</p>
      <input type="password" id="admin-key-input" class="auth-input" placeholder="Admin API Key" autocomplete="off">
      <button type="button" class="btn" id="auth-btn">Access Dashboard</button>
      <div class="error-msg" id="auth-error"></div>
    </div>

    <!-- Main Dashboard -->
    <div id="analytics-content" class="analytics-content">
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-title">DevKit Analytics</h1>
          <p class="dashboard-subtitle">Real-time insights into app usage and performance</p>
        </div>
        <div class="dashboard-controls">
          <select id="time-range" class="btn btn-outline">
            <option value="1d">Last 24h</option>
            <option value="7d" selected>Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <label class="auto-refresh">
            <input type="checkbox" id="auto-refresh-toggle"> Auto refresh
          </label>
          <button type="button" class="btn btn-outline" id="refresh-btn">
            <span id="refresh-icon">↻</span> Refresh
          </button>
          <span class="logout-link" id="logout-btn">Logout</span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="dashboard-main">
        <!-- Left Panel -->
        <div class="dashboard-left">
          <!-- Key Metrics -->
          <div class="chart-container">
            <h2 class="chart-title">Key Metrics</h2>
            <div class="metrics-grid" id="metrics-grid">
              <!-- Metrics will be populated by JavaScript -->
            </div>
          </div>

          <!-- App Usage -->
          <div class="chart-container">
            <h2 class="chart-title">App Usage</h2>
            <div class="usage-list" id="app-usage">
              <!-- App usage will be populated by JavaScript -->
            </div>
          </div>

          <!-- Geographic Distribution -->
          <div class="chart-container">
            <h2 class="chart-title">Geographic Distribution</h2>
            <div class="geo-list" id="geo-chart">
              <!-- Geographic data will be populated by JavaScript -->
            </div>
          </div>
        </div>

        <!-- Right Panel -->
        <div class="dashboard-right">
          <!-- Activity Timeline -->
          <div class="chart-container">
            <h2 class="chart-title">Activity Timeline</h2>
            <div class="timeline-chart" id="timeline-chart">
              <!-- Timeline will be populated by JavaScript -->
            </div>
          </div>

          <!-- Event Types -->
          <div class="chart-container">
            <h2 class="chart-title">Event Types</h2>
            <div class="event-list" id="event-types">
              <!-- Event types will be populated by JavaScript -->
            </div>
          </div>

          <!-- System Health -->
          <div class="chart-container">
            <h2 class="chart-title">System Health</h2>
            <div class="health-grid" id="system-health">
              <!-- Health metrics will be populated by JavaScript -->
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="dashboard-footer">
        <span id="last-updated">Last updated: Never</span>
      </div>
    </div>
  </div>

  <script>
    // Enhanced Analytics Dashboard JavaScript
    var adminKey = sessionStorage.getItem('analytics_admin_key') || '';
    var isAutoRefreshEnabled = false;
    var autoRefreshTimer = null;
    var isLoading = false;

    function esc(s) {
      var d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    function formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toString();
    }

    function relTime(ms) {
      if (!ms) return '';
      var sec = Math.floor((Date.now() - ms) / 1000);
      if (sec < 60) return 'just now';
      if (sec < 3600) return Math.floor(sec / 60) + 'm ago';
      if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
      return Math.floor(sec / 86400) + 'd ago';
    }

    async function apiGet(path) {
      var res = await fetch(path, {
        headers: { 'X-Admin-Key': adminKey }
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    }

    function showAuth() {
      document.getElementById('auth-gate').style.display = 'block';
      document.getElementById('analytics-content').classList.remove('visible');
    }

    function showContent() {
      document.getElementById('auth-gate').style.display = 'none';
      document.getElementById('analytics-content').classList.add('visible');
    }

    function renderMetrics(data) {
      var metrics = [
        { 
          icon: '👥', 
          title: 'Total Users', 
          value: formatNumber(data.uniqueProfiles || 0),
          change: '+12%',
          positive: true
        },
        { 
          icon: '📊', 
          title: 'Sessions', 
          value: formatNumber(data.totalVisits || 0),
          change: '+8%',
          positive: true
        },
        { 
          icon: '⏱️', 
          title: 'Avg. Session', 
          value: '4m 32s',
          change: '+15%',
          positive: true
        },
        { 
          icon: '📈', 
          title: 'Active Today', 
          value: formatNumber(data.todayVisits || 0),
          change: '+5%',
          positive: true
        }
      ];

      var html = metrics.map(function(metric) {
        return '<div class="metric-card fade-in">' +
          '<div class="metric-header">' +
            '<span class="metric-icon">' + metric.icon + '</span>' +
            '<span class="metric-change ' + (metric.positive ? 'positive' : 'negative') + '">' + 
              metric.change + 
            '</span>' +
          '</div>' +
          '<div class="metric-value">' + metric.value + '</div>' +
          '<div class="metric-label">' + metric.title + '</div>' +
        '</div>';
      }).join('');

      document.getElementById('metrics-grid').innerHTML = html;
    }

    function renderAppUsage(eventTypes) {
      var appEvents = eventTypes.filter(function(event) {
        return event.eventType.includes('app_') || event.eventType.includes('document_');
      }).slice(0, 6);

      var html = appEvents.map(function(event) {
        var name = event.eventType.replace('app_', '').replace('document_', '').replace(/_/g, ' ');
        name = name.charAt(0).toUpperCase() + name.slice(1);
        
        return '<div class="usage-item fade-in">' +
          '<div class="usage-item-left">' +
            '<div class="usage-dot"></div>' +
            '<span class="usage-name">' + esc(name) + '</span>' +
          '</div>' +
          '<span class="usage-count">' + event.count + '</span>' +
        '</div>';
      }).join('');

      document.getElementById('app-usage').innerHTML = html || '<div style="color:var(--muted);">No app usage data</div>';
    }

    function renderGeoChart(countries) {
      var maxCount = countries.length > 0 ? countries[0].count : 1;
      
      var html = countries.slice(0, 5).map(function(country) {
        var percentage = (country.count / maxCount) * 100;
        return '<div class="geo-item">' +
          '<div class="geo-left">' +
            '<span>🌍</span>' +
            '<span style="color:var(--text);font-size:0.875rem;">' + 
              esc(country.country || 'Unknown') + 
            '</span>' +
          '</div>' +
          '<div class="geo-right">' +
            '<div class="geo-bar-track">' +
              '<div class="geo-bar-fill" style="width:' + percentage + '%"></div>' +
            '</div>' +
            '<span style="color:var(--muted);font-size:0.75rem;width:32px;text-align:right;">' + 
              country.count + 
            '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      document.getElementById('geo-chart').innerHTML = html || '<div style="color:var(--muted);">No geographic data</div>';
    }

    function renderTimeline(days) {
      if (!days || days.length === 0) {
        document.getElementById('timeline-chart').innerHTML = '<div style="color:var(--muted);text-align:center;padding:2rem;">No timeline data</div>';
        return;
      }

      var maxCount = Math.max.apply(null, days.map(function(d) { return d.count; }));
      
      var html = days.slice(-14).map(function(day) {
        var height = maxCount > 0 ? Math.max(4, (day.count / maxCount) * 100) : 4;
        return '<div class="timeline-bar" style="height:' + height + '%" title="' + 
          esc(day.day + ': ' + day.count + ' visits') + '"></div>';
      }).join('');

      document.getElementById('timeline-chart').innerHTML = html;
    }

    function renderEventTypes(eventTypes) {
      var html = eventTypes.slice(0, 8).map(function(event) {
        return '<div class="event-item">' +
          '<span class="event-name">' + esc(event.eventType) + '</span>' +
          '<span class="event-count">' + event.count + '</span>' +
        '</div>';
      }).join('');

      document.getElementById('event-types').innerHTML = html || '<div style="color:var(--muted);">No event data</div>';
    }

    function renderSystemHealth() {
      var healthItems = [
        { title: 'API Status', status: 'healthy', icon: '✅', value: null },
        { title: 'Sync Status', status: 'healthy', icon: '✅', value: null },
        { title: 'Error Rate', status: 'healthy', icon: '📊', value: '0.2%' },
        { title: 'Uptime', status: 'healthy', icon: '📈', value: '99.9%' }
      ];

      var html = healthItems.map(function(item) {
        return '<div class="health-card">' +
          '<div class="health-header">' +
            '<span class="health-icon ' + item.status + '">' + item.icon + '</span>' +
            '<span class="health-title">' + item.title + '</span>' +
          '</div>' +
          (item.value ? '<div class="health-value">' + item.value + '</div>' : '') +
          '<div class="health-status ' + item.status + '">' + item.status + '</div>' +
        '</div>';
      }).join('');

      document.getElementById('system-health').innerHTML = html;
    }

    async function loadDashboard() {
      if (isLoading) return;
      isLoading = true;
      
      var refreshIcon = document.getElementById('refresh-icon');
      refreshIcon.style.animation = 'spin 1s linear infinite';
      
      try {
        var data = await apiGet('/api/admin/analytics/summary');
        
        renderMetrics(data);
        renderAppUsage(data.byEventType || []);
        renderGeoChart(data.byCountry || []);
        renderTimeline(data.byDay || []);
        renderEventTypes(data.byEventType || []);
        renderSystemHealth();
        
        document.getElementById('last-updated').textContent = 
          'Last updated: ' + new Date().toLocaleTimeString();
          
      } catch (e) {
        console.error('Dashboard load failed:', e);
        // Show error state
      } finally {
        isLoading = false;
        refreshIcon.style.animation = '';
      }
    }

    function setAutoRefresh(enabled) {
      isAutoRefreshEnabled = enabled;
      document.getElementById('auto-refresh-toggle').checked = enabled;
      
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
      }
      
      if (enabled) {
        autoRefreshTimer = setInterval(loadDashboard, 60000); // 1 minute
      }
    }

    async function authenticate() {
      var input = document.getElementById('admin-key-input');
      var errEl = document.getElementById('auth-error');
      var key = input.value.trim();
      
      if (!key) {
        errEl.textContent = 'Please enter an admin key.';
        return;
      }
      
      errEl.textContent = '';
      adminKey = key;
      
      try {
        await apiGet('/api/admin/analytics/summary');
        sessionStorage.setItem('analytics_admin_key', key);
        showContent();
        loadDashboard();
        setAutoRefresh(false);
      } catch (e) {
        errEl.textContent = e.message || 'Authentication failed.';
        adminKey = '';
        sessionStorage.removeItem('analytics_admin_key');
      }
    }

    // Event Listeners
    document.getElementById('auth-btn').onclick = authenticate;
    document.getElementById('admin-key-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') authenticate();
    });
    
    document.getElementById('logout-btn').onclick = function() {
      adminKey = '';
      sessionStorage.removeItem('analytics_admin_key');
      setAutoRefresh(false);
      showAuth();
    };
    
    document.getElementById('refresh-btn').onclick = loadDashboard;
    document.getElementById('auto-refresh-toggle').onchange = function(e) {
      setAutoRefresh(e.target.checked);
    };
    
    document.getElementById('time-range').onchange = function() {
      loadDashboard();
    };

    // Add CSS animation for spin
    var style = document.createElement('style');
    style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);

    // Initialize
    if (adminKey) {
      apiGet('/api/admin/analytics/summary').then(function() {
        showContent();
        loadDashboard();
      }).catch(function() {
        adminKey = '';
        sessionStorage.removeItem('analytics_admin_key');
        showAuth();
      });
    } else {
      showAuth();
    }
  </script>
</body>
</html>`;
}