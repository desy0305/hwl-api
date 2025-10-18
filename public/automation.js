class SmartHomeAutomation {
    constructor(controller) {
        this.controller = controller;
        this.location = { lat: 42.180508, lng: 24.7044203 }; // Sofia, Bulgaria
        this.timezone = 'Europe/Sofia';
        
        // TEMPORARY: Clear any existing schedules that might be causing issues
        console.log('[DEBUG] Clearing existing schedules to prevent cascade issues');
        localStorage.removeItem('hwl_schedules');
        this.schedules = [];
        
        this.analytics = JSON.parse(localStorage.getItem('hwl_analytics') || '{}');
        this.weatherApiKey = null; // You can add OpenWeatherMap API key here
        
        this.init();
    }

    init() {
        this.updateTime();
        this.updateSunTimes();
        this.loadWeatherInfo();
        this.populateDeviceSelectors();
        this.loadSchedules();
        this.initAnalytics();
        
        // Update time every minute
        setInterval(() => this.updateTime(), 60000);
        
        // Update sun times daily
        setInterval(() => this.updateSunTimes(), 24 * 60 * 60 * 1000);
        
        // Check schedules every minute
        setInterval(() => this.checkSchedules(), 60000);
    }

    updateTime() {
        const now = moment().tz(this.timezone);
        document.getElementById('currentTime').textContent = now.format('HH:mm');
        
        // Update sun info in header
        const sunTimes = SunCalc.getTimes(new Date(), this.location.lat, this.location.lng);
        const sunrise = moment(sunTimes.sunrise).tz(this.timezone);
        const sunset = moment(sunTimes.sunset).tz(this.timezone);
        
        let sunStatus = '';
        if (now.isBefore(sunrise)) {
            sunStatus = `Sunrise in ${sunrise.diff(now, 'minutes')}m`;
        } else if (now.isBefore(sunset)) {
            sunStatus = `Sunset in ${sunset.diff(now, 'minutes')}m`;
        } else {
            const nextSunrise = moment(SunCalc.getTimes(moment().add(1, 'day').toDate(), this.location.lat, this.location.lng).sunrise).tz(this.timezone);
            sunStatus = `Sunrise in ${nextSunrise.diff(now, 'hours')}h`;
        }
        
        document.getElementById('sunText').textContent = sunStatus;
    }

    updateSunTimes() {
        const sunTimes = SunCalc.getTimes(new Date(), this.location.lat, this.location.lng);
        const sunrise = moment(sunTimes.sunrise).tz(this.timezone);
        const sunset = moment(sunTimes.sunset).tz(this.timezone);
        
        document.getElementById('sunriseTime').textContent = sunrise.format('HH:mm');
        document.getElementById('sunsetTime').textContent = sunset.format('HH:mm');
    }

    async loadWeatherInfo() {
        // Mock weather data - you can integrate with OpenWeatherMap API
        const mockWeather = {
            condition: 'Partly Cloudy',
            temperature: 22
        };
        
        document.getElementById('weatherCondition').textContent = mockWeather.condition;
        document.getElementById('temperature').textContent = `${mockWeather.temperature}°C`;
    }

    populateDeviceSelectors() {
        const deviceSelect = document.getElementById('timerDevice');
        deviceSelect.innerHTML = '<option value="">Select Device</option>';
        
        if (this.controller.devices) {
            this.controller.devices.forEach(plug => {
                plug.devices.forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.id;
                    option.textContent = `${device.name} (${plug.name})`;
                    deviceSelect.appendChild(option);
                });
            });
        }
    }

    createSunriseRule() {
        const deviceId = prompt('Enter device ID or select from devices tab:');
        const action = confirm('Turn ON at sunrise? (Cancel for OFF)') ? 'on' : 'off';
        const offset = parseInt(prompt('Minutes offset (+ for after, - for before sunrise):', '0') || '0');
        
        if (deviceId) {
            const schedule = {
                id: Date.now(),
                type: 'sunrise',
                deviceId: deviceId,
                action: action,
                offset: offset,
                enabled: true,
                created: new Date().toISOString()
            };
            
            this.schedules.push(schedule);
            this.saveSchedules();
            this.loadSchedules();
            
            this.showNotification(`Sunrise rule created for device ${deviceId}`, 'success');
        }
    }

    createSunsetRule() {
        const deviceId = prompt('Enter device ID or select from devices tab:');
        const action = confirm('Turn ON at sunset? (Cancel for OFF)') ? 'on' : 'off';
        const offset = parseInt(prompt('Minutes offset (+ for after, - for before sunset):', '0') || '0');
        
        if (deviceId) {
            const schedule = {
                id: Date.now(),
                type: 'sunset',
                deviceId: deviceId,
                action: action,
                offset: offset,
                enabled: true,
                created: new Date().toISOString()
            };
            
            this.schedules.push(schedule);
            this.saveSchedules();
            this.loadSchedules();
            
            this.showNotification(`Sunset rule created for device ${deviceId}`, 'success');
        }
    }

    createTimer() {
        const deviceId = document.getElementById('timerDevice').value;
        const action = document.getElementById('timerAction').value;
        const time = document.getElementById('timerTime').value;
        
        if (!deviceId || !time) {
            this.showNotification('Please select device and time', 'error');
            return;
        }
        
        const schedule = {
            id: Date.now(),
            type: 'timer',
            deviceId: deviceId,
            action: action,
            time: time,
            enabled: true,
            created: new Date().toISOString()
        };
        
        this.schedules.push(schedule);
        this.saveSchedules();
        this.loadSchedules();
        
        // Clear form
        document.getElementById('timerDevice').value = '';
        document.getElementById('timerTime').value = '';
        
        this.showNotification('Timer created successfully', 'success');
    }

    createWeatherRule() {
        this.showNotification('Weather rules coming soon! This will allow automation based on weather conditions.', 'info');
    }

    checkSchedules() {
        const now = moment().tz(this.timezone);
        
        this.schedules.forEach(schedule => {
            if (!schedule.enabled) return;
            
            let shouldTrigger = false;
            
            if (schedule.type === 'timer') {
                const scheduleTime = moment().tz(this.timezone).startOf('day').add(moment.duration(schedule.time));
                shouldTrigger = now.format('HH:mm') === scheduleTime.format('HH:mm');
            } else if (schedule.type === 'sunrise') {
                const sunTimes = SunCalc.getTimes(new Date(), this.location.lat, this.location.lng);
                const triggerTime = moment(sunTimes.sunrise).tz(this.timezone).add(schedule.offset, 'minutes');
                shouldTrigger = now.format('HH:mm') === triggerTime.format('HH:mm');
            } else if (schedule.type === 'sunset') {
                const sunTimes = SunCalc.getTimes(new Date(), this.location.lat, this.location.lng);
                const triggerTime = moment(sunTimes.sunset).tz(this.timezone).add(schedule.offset, 'minutes');
                shouldTrigger = now.format('HH:mm') === triggerTime.format('HH:mm');
            }
            
            if (shouldTrigger) {
                this.executeSchedule(schedule);
            }
        });
    }

    async executeSchedule(schedule) {
        try {
            console.log(`[DEBUG] Executing schedule for device: ${schedule.deviceId}, action: ${schedule.action}`);
            await this.controller.controlDevice(schedule.deviceId, 'switch', schedule.action);
            this.showNotification(`Schedule executed: ${schedule.type} rule for device ${schedule.deviceId}`, 'success');
            
            // Log analytics
            this.logAnalytics(schedule.deviceId, schedule.action, 'schedule');
        } catch (error) {
            console.error('Failed to execute schedule:', error);
            this.showNotification(`Failed to execute schedule: ${error.message}`, 'error');
        }
    }

    loadSchedules() {
        const schedulesList = document.getElementById('schedulesList');
        
        if (this.schedules.length === 0) {
            schedulesList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">No schedules created yet. Use the Automation tab to create your first schedule!</p>';
            return;
        }
        
        schedulesList.innerHTML = this.schedules.map(schedule => {
            let scheduleText = '';
            if (schedule.type === 'timer') {
                scheduleText = `Daily at ${schedule.time}`;
            } else if (schedule.type === 'sunrise') {
                const offsetText = schedule.offset === 0 ? '' : ` (${schedule.offset > 0 ? '+' : ''}${schedule.offset}m)`;
                scheduleText = `At sunrise${offsetText}`;
            } else if (schedule.type === 'sunset') {
                const offsetText = schedule.offset === 0 ? '' : ` (${schedule.offset > 0 ? '+' : ''}${schedule.offset}m)`;
                scheduleText = `At sunset${offsetText}`;
            }
            
            const deviceName = this.getDeviceName(schedule.deviceId);
            
            return `
                <div class="schedule-item">
                    <div class="schedule-info">
                        <div class="schedule-title">
                            ${scheduleText} - Turn ${schedule.action.toUpperCase()}
                        </div>
                        <div class="schedule-details">
                            Device: ${deviceName} | Created: ${moment(schedule.created).format('MMM DD, YYYY')}
                        </div>
                    </div>
                    <div class="schedule-actions">
                        <button class="schedule-btn" onclick="automation.toggleSchedule(${schedule.id})" title="${schedule.enabled ? 'Disable' : 'Enable'}">
                            <i class="fas fa-${schedule.enabled ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="schedule-btn delete" onclick="automation.deleteSchedule(${schedule.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getDeviceName(deviceId) {
        if (!this.controller.devices) return deviceId;
        
        for (const plug of this.controller.devices) {
            const device = plug.devices.find(d => d.id === deviceId);
            if (device) return `${device.name} (${plug.name})`;
        }
        return deviceId;
    }

    toggleSchedule(scheduleId) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (schedule) {
            schedule.enabled = !schedule.enabled;
            this.saveSchedules();
            this.loadSchedules();
            this.showNotification(`Schedule ${schedule.enabled ? 'enabled' : 'disabled'}`, 'info');
        }
    }

    deleteSchedule(scheduleId) {
        if (confirm('Are you sure you want to delete this schedule?')) {
            this.schedules = this.schedules.filter(s => s.id !== scheduleId);
            this.saveSchedules();
            this.loadSchedules();
            this.showNotification('Schedule deleted', 'info');
        }
    }

    saveSchedules() {
        localStorage.setItem('hwl_schedules', JSON.stringify(this.schedules));
    }

    logAnalytics(deviceId, action, source = 'manual') {
        const today = moment().format('YYYY-MM-DD');
        if (!this.analytics[today]) {
            this.analytics[today] = {};
        }
        if (!this.analytics[today][deviceId]) {
            this.analytics[today][deviceId] = { on: 0, off: 0 };
        }
        
        this.analytics[today][deviceId][action]++;
        localStorage.setItem('hwl_analytics', JSON.stringify(this.analytics));
        
        this.updateAnalyticsDisplay();
    }

    initAnalytics() {
        this.updateAnalyticsDisplay();
        this.createUsageChart();
    }

    updateAnalyticsDisplay() {
        const today = moment().format('YYYY-MM-DD');
        const todayData = this.analytics[today] || {};
        
        let mostUsedDevice = 'None';
        let maxUsage = 0;
        let totalSwitches = 0;
        
        Object.keys(todayData).forEach(deviceId => {
            const usage = todayData[deviceId].on + todayData[deviceId].off;
            totalSwitches += usage;
            if (usage > maxUsage) {
                maxUsage = usage;
                mostUsedDevice = this.getDeviceName(deviceId);
            }
        });
        
        document.getElementById('mostUsedDevice').textContent = mostUsedDevice;
        document.getElementById('totalSwitches').textContent = totalSwitches;
    }

    createUsageChart() {
        const ctx = document.getElementById('usageChart').getContext('2d');
        const today = moment().format('YYYY-MM-DD');
        const todayData = this.analytics[today] || {};
        
        const labels = [];
        const data = [];
        
        Object.keys(todayData).forEach(deviceId => {
            labels.push(this.getDeviceName(deviceId));
            data.push(todayData[deviceId].on + todayData[deviceId].off);
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Usage Count',
                    data: data,
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global functions for HTML onclick events
function showTab(tabName, buttonElement = null) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to clicked button
    const button = buttonElement || (typeof event !== 'undefined' ? event.target : null);
    if (button) {
        button.classList.add('active');
    }
}

function createSunriseRule() {
    if (window.automation) {
        window.automation.createSunriseRule();
    }
}

function createSunsetRule() {
    if (window.automation) {
        window.automation.createSunsetRule();
    }
}

function createTimer() {
    if (window.automation) {
        window.automation.createTimer();
    }
}

function createWeatherRule() {
    if (window.automation) {
        window.automation.createWeatherRule();
    }
}