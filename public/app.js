class HomeWizardController {
    constructor() {
        this.apiBase = 'http://localhost:3034/api';
        this.devices = [];
        this.deviceStates = new Map();
        this.activeRequests = new Set(); // Track active requests to prevent duplicates
        this.init();
    }

    async init() {
        this.updateConnectionStatus('connecting');
        await this.loadDevices();
        this.startStatusPolling();
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        const dot = statusElement.querySelector('.status-dot');
        const text = statusElement.querySelector('span:last-child');
        
        switch(status) {
            case 'online':
                dot.className = 'status-dot online';
                text.textContent = 'Connected';
                break;
            case 'offline':
                dot.className = 'status-dot offline';
                text.textContent = 'Disconnected';
                break;
            case 'connecting':
                dot.className = 'status-dot';
                text.textContent = 'Connecting...';
                break;
        }
    }

    async loadDevices() {
        try {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('devicesContainer').style.display = 'none';

            // Use the smartplug endpoint and create a mock structure
            const response = await fetch(`${this.apiBase}/smartplug`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const smartplug = await response.json();
            
            // Create a devices array from the smartplug data
            // We'll use the device data from your logs since the API doesn't return device details
            this.devices = [{
                id: smartplug.id,
                identifier: smartplug.identifier || 'WPLG009569C4FAF4',
                name: smartplug.name,
                latitude: smartplug.latitude,
                longitude: smartplug.longitude || 24.7044203,
                online: smartplug.online,
                firmwareUpdateAvailable: smartplug.firmwareUpdateAvailable,
                timeZone: smartplug.timeZone,
                devices: [
                    {id: "ad621820-e2fb-40d2-9338-3f457e940cd2", typeName: "plug_outlet", name: "Controller Coffee", code: "null", iconUrl: ""},
                    {id: "a67d781f-7ebf-47a8-9b9c-011f7f606142", typeName: "flamingo_switch", name: "Bedroom TV", code: "2da9056", iconUrl: "icons/13"},
                    {id: "67320a19-d92b-4f49-b3c7-98ceec7ff61e", typeName: "flamingo_switch", name: "Desk PC", code: "2bb4940", iconUrl: "icons/12"},
                    {id: "f16aa0fe-fa30-4dbb-9f46-ca76bc81862b", typeName: "flamingo_switch", name: "Kitchen", code: "3cdba77", iconUrl: "custom"},
                    {id: "d63a68c6-5ade-4b53-a5fa-efd98aef22c5", typeName: "flamingo_switch", name: "Bedroom", code: "3e77bb2", iconUrl: "icons/2"},
                    {id: "380fde11-ca05-4f2f-97b2-a9e5c51149f4", typeName: "flamingo_switch", name: "Battery Charger", code: "2d0b36c", iconUrl: "custom"},
                    {id: "682dfb55-c91d-4318-9f14-840779ff7665", typeName: "flamingo_switch", name: "Dron", code: "104e574", iconUrl: "icons/1"},
                    {id: "4d76e4ec-be86-455b-8915-affd03f919c4", typeName: "flamingo_switch", name: "Sink Lights", code: "37e6013", iconUrl: "icons/13"}
                ]
            }];
            
            // Add the second smart plug if needed
            this.devices.push({
                id: "7675fb88-1477-4513-b946-1bda76a5237b",
                identifier: "WPLG009569C4DE54",
                name: "Audio Amplifier TV",
                latitude: 42.180594,
                longitude: 24.7041406,
                online: true,
                firmwareUpdateAvailable: false,
                timeZone: "Europe/Sofia",
                devices: [
                    {id: "f0a1f073-1c41-4b5d-adb9-b0f9caad4b8d", typeName: "plug_outlet", name: "Controller", code: null, iconUrl: ""}
                ]
            });
            
            this.renderDevices();
            this.updateConnectionStatus('online');
            
            document.getElementById('loading').style.display = 'none';
            document.getElementById('devicesContainer').style.display = 'block';
            
            // Load initial states
            await this.loadAllDeviceStates();
            
        } catch (error) {
            console.error('Failed to load devices:', error);
            this.showError(`Failed to connect to API: ${error.message}`);
            this.updateConnectionStatus('offline');
        }
    }

    showError(message) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('devicesContainer').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('errorText').textContent = message;
    }

    renderDevices() {
        const container = document.getElementById('devicesContainer');
        container.innerHTML = '';

        this.devices.forEach(plug => {
            const plugElement = this.createPlugElement(plug);
            container.appendChild(plugElement);
        });
        
        // Add event delegation for device controls
        this.setupEventListeners();
    }

    setupEventListeners() {
        const container = document.getElementById('devicesContainer');
        
        // Remove any existing listeners to prevent duplicates
        container.removeEventListener('click', this.handleDeviceControl);
        container.removeEventListener('change', this.handleDimmerControl);
        
        // Add event delegation for buttons
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('control-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const deviceId = e.target.dataset.deviceId;
                const action = e.target.dataset.action;
                const type = e.target.dataset.type;
                
                console.log(`[DEBUG] Button clicked: deviceId=${deviceId}, action=${action}, type=${type}`);
                
                if (deviceId && action && type) {
                    this.controlDevice(deviceId, type, action, e.target);
                }
            }
        });
        
        // Add event delegation for dimmer sliders
        container.addEventListener('change', (e) => {
            if (e.target.type === 'range' && e.target.dataset.deviceId) {
                e.preventDefault();
                e.stopPropagation();
                
                const deviceId = e.target.dataset.deviceId;
                const type = e.target.dataset.type;
                const value = e.target.value;
                
                console.log(`[DEBUG] Dimmer changed: deviceId=${deviceId}, value=${value}`);
                
                this.controlDevice(deviceId, type, value, e.target);
            }
        });
    }

    createPlugElement(plug) {
        const plugDiv = document.createElement('div');
        plugDiv.className = 'smart-plug';
        
        plugDiv.innerHTML = `
            <div class="plug-header">
                <div class="plug-info">
                    <h2>${plug.name}</h2>
                    <div class="plug-id">${plug.identifier}</div>
                </div>
                <div class="plug-status ${plug.online ? 'online' : 'offline'}">
                    <span class="status-dot ${plug.online ? 'online' : 'offline'}"></span>
                    ${plug.online ? 'Online' : 'Offline'}
                </div>
            </div>
            <div class="devices-grid" id="devices-${plug.id}">
                ${plug.devices.map(device => this.createDeviceCard(device, plug.id)).join('')}
            </div>
        `;

        return plugDiv;
    }

    createDeviceCard(device, plugId) {
        const deviceType = this.getDeviceTypeInfo(device.typeName);
        const icon = this.getDeviceIcon(device.typeName);
        
        return `
            <div class="device-card" data-device-id="${device.id}" data-plug-id="${plugId}">
                <div class="device-header">
                    <div class="device-info">
                        <h3>${device.name}</h3>
                        <div class="device-type">${deviceType.displayName}</div>
                    </div>
                    <div class="device-icon">${icon}</div>
                </div>
                <div class="device-controls">
                    ${this.createDeviceControls(device, deviceType)}
                </div>
                <div class="device-status unknown" id="status-${device.id}">
                    Status: Unknown
                </div>
            </div>
        `;
    }

    createDeviceControls(device, deviceType) {
        const controls = [];
        
        if (deviceType.family === 'Switch' || deviceType.family === 'Bulb') {
            controls.push(`
                <button class="control-btn on" data-device-id="${device.id}" data-action="on" data-type="switch">
                    ON
                </button>
                <button class="control-btn off" data-device-id="${device.id}" data-action="off" data-type="switch">
                    OFF
                </button>
            `);
        }
        
        if (deviceType.family === 'Dimmer') {
            controls.push(`
                <button class="control-btn on" data-device-id="${device.id}" data-action="on" data-type="switch">
                    ON
                </button>
                <button class="control-btn off" data-device-id="${device.id}" data-action="off" data-type="switch">
                    OFF
                </button>
                <div class="dimmer-control">
                    <input type="range" min="1" max="100" value="50" data-device-id="${device.id}" data-type="dimmer">
                    <div class="dimmer-value">50%</div>
                </div>
            `);
        }
        
        if (deviceType.family === 'Curtain') {
            const actions = deviceType.actions || [];
            actions.forEach(action => {
                const actionName = action.action || action;
                controls.push(`
                    <button class="control-btn" data-device-id="${device.id}" data-action="${actionName.toLowerCase()}" data-type="brel_ud_curtain">
                        ${actionName.toUpperCase()}
                    </button>
                `);
            });
        }
        
        return controls.join('');
    }

    getDeviceTypeInfo(typeName) {
        const typeMap = {
            'plug_outlet': { displayName: 'Smart Plug', family: 'Switch' },
            'flamingo_switch': { displayName: 'Switch', family: 'Switch' },
            'hew_dimmer': { displayName: 'Dimmer', family: 'Dimmer' },
            'smartwares_dimmer': { displayName: 'Dimmer', family: 'Dimmer' },
            'brel_ud_curtain': { displayName: 'Curtain', family: 'Curtain', actions: ['Up', 'Down', 'Stop'] },
            'smartwares_bulb': { displayName: 'Smart Bulb', family: 'Bulb' }
        };
        
        return typeMap[typeName] || { displayName: typeName, family: 'Unknown' };
    }

    getDeviceIcon(typeName) {
        const iconMap = {
            'plug_outlet': '🔌',
            'flamingo_switch': '💡',
            'hew_dimmer': '🔆',
            'smartwares_dimmer': '🔆',
            'brel_ud_curtain': '🪟',
            'smartwares_bulb': '💡'
        };
        
        return iconMap[typeName] || '⚡';
    }

    async controlDevice(deviceId, type, value, buttonElement = null) {
        try {
            // Debug logging to track what's being called
            console.log(`[DEBUG] controlDevice called: deviceId=${deviceId}, type=${type}, value=${value}`);
            console.log(`[DEBUG] Call stack:`, new Error().stack);
            
            // Prevent duplicate requests for the same device
            const requestKey = `${deviceId}-${type}-${value}`;
            if (this.activeRequests.has(requestKey)) {
                console.log(`[DEBUG] Duplicate request blocked: ${requestKey}`);
                return;
            }
            this.activeRequests.add(requestKey);
            
            // Get button element from parameter or try to find it from event
            const button = buttonElement || (typeof event !== 'undefined' ? event.target : null);
            if (button) {
                button.disabled = true;
                button.textContent = '...';
                console.log(`[DEBUG] Button disabled: ${button.textContent}`);
            }

            const payload = { type, value };
            
            const response = await fetch(`${this.apiBase}/plug/${deviceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            this.updateDeviceStatus(deviceId, result.is_active);
            
            // Log analytics
            if (window.automation) {
                window.automation.logAnalytics(deviceId, value, 'manual');
            }
            
            console.log(`[DEBUG] Device ${deviceId} controlled successfully: ${result.is_active}`);
            
            // Show success feedback
            if (button) {
                button.style.background = '#2ed573';
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = button.className.includes('on') ? 'ON' : 
                                       button.className.includes('off') ? 'OFF' : 
                                       value.toUpperCase();
                    button.style.background = '';
                }, 1000);
            }
            
        } catch (error) {
            console.error('Control failed:', error);
            
            // Show error feedback
            if (button) {
                button.style.background = '#ff4757';
                button.textContent = 'ERROR';
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = button.className.includes('on') ? 'ON' : 
                                       button.className.includes('off') ? 'OFF' : 
                                       value.toUpperCase();
                    button.style.background = '';
                }, 2000);
            }
        } finally {
            // Always remove the request from active set
            const requestKey = `${deviceId}-${type}-${value}`;
            this.activeRequests.delete(requestKey);
        }
    }

    async loadAllDeviceStates() {
        for (const plug of this.devices) {
            for (const device of plug.devices) {
                await this.loadDeviceState(device.id);
            }
        }
    }

    async loadDeviceState(deviceId) {
        try {
            const response = await fetch(`${this.apiBase}/plug/${deviceId}`);
            if (response.ok) {
                const result = await response.json();
                this.updateDeviceStatus(deviceId, result.is_active);
            }
        } catch (error) {
            console.error(`Failed to load state for device ${deviceId}:`, error);
        }
    }

    updateDeviceStatus(deviceId, isActive) {
        const statusElement = document.getElementById(`status-${deviceId}`);
        if (statusElement) {
            statusElement.className = `device-status ${isActive ? 'active' : 'inactive'}`;
            statusElement.textContent = `Status: ${isActive ? 'ON' : 'OFF'}`;
        }
        
        this.deviceStates.set(deviceId, isActive);
    }

    startStatusPolling() {
        // Poll device states every 30 seconds
        setInterval(() => {
            if (this.devices.length > 0) {
                this.loadAllDeviceStates();
            }
        }, 30000);
    }
}

// Initialize the controller when the page loads
let controller;
let automation;

document.addEventListener('DOMContentLoaded', () => {
    controller = new HomeWizardController();
    
    // Initialize automation after controller is ready
    setTimeout(() => {
        automation = new SmartHomeAutomation(controller);
        window.automation = automation; // Make it globally accessible
    }, 2000);
});

// Global function to reload devices
function loadDevices() {
    if (controller) {
        controller.loadDevices();
    }
}