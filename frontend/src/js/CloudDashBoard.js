import CloudAPI from './api/CloudAPI';

export default class CloudDashboard {
    constructor(container) {
        this.container = container;
        this.api = new CloudAPI();
        this.ws = null;
        this.eventSource = null;

        this.listContainer = null;
        this.terminalViewport = null;
        this.createBtn = null;
    }

    init() {
        this.listContainer = this.container.querySelector('#instances-list-container');
        this.terminalViewport = this.container.querySelector('#worklog-terminal-viewport');
        this.createBtn = this.container.querySelector('#global-create-instance-btn');

        // CONNECTION TO PORT 3000 VIA WEBSOCKET (FOR STATE CHANGES)
        this.ws = new WebSocket('ws://localhost:3000/ws');

        // CONNECTION VIA SERVER-SENT EVENTS (REAL-TIME TELEMETRY)
        this.eventSource = new EventSource('http://localhost:3000/sse');

        this.bindEvents();

        // Initial REST load of existing servers
        this.loadInstancesList();
    }

    bindEvents() {
        // Order of creation (REST POST)
        this.createBtn.addEventListener('click', () => {
            this.api.create({}, (err) => {
                if (err) console.error('Error creating node instance');
            });
        });

        // Delegation of interactive clicks for rows (Play/Pause/Trash)
        this.listContainer.addEventListener('click', (e) => {
            const target = e.target;
            const row = target.closest('.instance-card-row');
            if (!row) return;

            const id = row.dataset.id;
            const action = target.dataset.action;

            if (action === 'toggle-state') {
                // TRANSMISSION RULE: State changes travel strictly via WebSocket
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ id }));
                }
            } else if (action === 'delete-instance') {
                // Eliminación por REST API
                this.api.delete(id, (err) => {
                    if (err) console.error('Error deleting node instance');
                });
            }
        });

        // SSE Event Stream Listener
        this.eventSource.addEventListener('message', (e) => {
            const logData = JSON.parse(e.data);
            this.appendLogToTerminal(logData);

            // Synchronize the hotlist on every telemetry event.
            this.loadInstancesList();
        });

        // WebSocket listener in case the server confirms bulk updates.
        this.ws.addEventListener('message', () => {
            this.loadInstancesList();
        });
    }

    loadInstancesList() {
        this.api.list((err, response) => {
            if (err || !response) return;

            this.listContainer.innerHTML = '';
            const instances = response.data || [];

            if (instances.length === 0) {
                this.listContainer.innerHTML = '<p style="text-align:center; font-size:12px; color:#718096; margin:20px 0;">No active cloud instances.</p>';
                return;
            }

            instances.forEach(server => {
                const card = document.createElement('div');
                card.className = 'instance-card-row';
                card.dataset.id = server.id;

                const isRunning = server.state === 'running';
                const toggleIcon = isRunning ? '⏸' : '▶';

                card.innerHTML = `
          <div class="instance-meta">
            <div class="instance-id-text">ID: ${server.id}</div>
            <div class="instance-status-badge">
              Status: <span class="status-dot ${server.state}"></span> ${server.state}
            </div>
          </div>
          <div class="instance-actions-group">
            <button class="action-icon-btn" data-action="toggle-state" title="Start/Stop">${toggleIcon}</button>
            <button class="action-icon-btn delete-btn" data-action="delete-instance" title="Delete">🗑</button>
          </div>
        `;
                this.listContainer.appendChild(card);
            });
        });
    }

    appendLogToTerminal(log) {
        const line = document.createElement('div');
        line.className = 'log-entry-line';

        // Format the aesthetic classes
        const infoClass = log.info.toLowerCase();

        // Normalize the timestamps handled by Store.js on the server.
        const time = log.timeStamp || log.timestamp || new Date().toLocaleTimeString();

        line.innerHTML = `
      <span class="log-time">[${time}]</span> 
      <span>Server ID: <span class="log-id">${log.id.substring(0, 8)}...</span></span> 
      <span>➔ Metracs: <span class="log-info ${infoClass}">${log.info}</span></span>
    `;

        this.terminalViewport.appendChild(line);
        this.terminalViewport.scrollTop = this.terminalViewport.scrollHeight; // Auto-scroll
    }
}
