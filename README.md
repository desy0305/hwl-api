# HomeWizard Lite Smart Home Control Panel

A comprehensive Node.js-based web application that provides a modern GUI and automation system for HomeWizard Lite smart plugs and devices.

## 🏠 Features

### Device Control
- **Multi-device support** - Control all your HomeWizard Lite devices
- **Real-time status** - Live device state monitoring
- **Multi-plug support** - Works with multiple smart plugs simultaneously
- **Device types** - Supports switches, dimmers, curtains, and smart plugs

### Smart Automation
- **Sunrise/Sunset automation** - Schedule devices based on natural light
- **Timer scheduling** - Set devices to turn on/off at specific times
- **Location-based calculations** - Automatic sun times for your location
- **Persistent schedules** - Automation rules saved locally

### Analytics & Insights
- **Usage tracking** - Monitor device activity patterns
- **Visual analytics** - Charts showing device usage statistics
- **Energy insights** - Track switching patterns and most-used devices

### Modern Web Interface
- **Responsive design** - Works on desktop, tablet, and mobile
- **Multi-tab interface** - Organized sections for devices, automation, schedules, and analytics
- **Real-time updates** - Live connection status and device states
- **Beautiful UI** - Modern gradient design with smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js 10+ (or Docker)
- HomeWizard Lite account with smart plugs
- Your HomeWizard Lite credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/hwl-api.git
   cd hwl-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your HomeWizard credentials
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the web interface**
   Open http://localhost:3033 in your browser

### Docker Setup

1. **Build the image**
   ```bash
   docker build -t hwl-smart-home .
   ```

2. **Run the container**
   ```bash
   docker run -p 3033:3033 \
     -e HWL_USERNAME=your_email@example.com \
     -e HWL_PASSWORD=your_password \
     -e SMARTPLUG_ID=your_plug_id \
     hwl-smart-home
   ```

## 📋 Configuration

### Required Environment Variables
- `HWL_USERNAME` - Your HomeWizard Lite account email
- `HWL_PASSWORD` - Your HomeWizard Lite account password
- `SMARTPLUG_ID` - Your main smart plug ID (get from /api/smartplug)

### Optional Environment Variables
- `PORT` - Server port (default: 3033)
- `MIN_DIMMING_VALUE` - Minimum dimmer value (default: 1)
- `CACHE_TTL` - Session cache time in seconds (default: 1800)
- `LOGLEVEL` - Logging level (default: warn)

## 🎯 API Endpoints

### Device Control
- `GET /api/plug` - Get all devices
- `GET /api/smartplug` - Get smart plug info
- `GET /api/plug/:deviceId` - Get device state
- `POST /api/plug/:deviceId` - Control device

### Testing
- `GET /api/test/session` - Test session key
- `GET /api/test/communication` - Test connectivity

### Example Device Control
```bash
# Turn on a device
curl -X POST http://localhost:3033/api/plug/device-id \
  -H "Content-Type: application/json" \
  -d '{"type": "switch", "value": "on"}'

# Control dimmer
curl -X POST http://localhost:3033/api/plug/device-id \
  -H "Content-Type: application/json" \
  -d '{"type": "dimmer", "value": 75}'
```

## 🏗️ Architecture

### Backend (Node.js/Express)
- **MVC Pattern** - Controllers, models, and routes separation
- **Authentication** - HomeWizard cloud API integration
- **Session Management** - Cached authentication tokens
- **Multi-plug Support** - Device-to-plug mapping system

### Frontend (Vanilla JS)
- **Modern ES6+** - Class-based architecture
- **CDN Libraries** - Moment.js, SunCalc, Chart.js, Font Awesome
- **Local Storage** - Persistent schedules and analytics
- **Responsive Design** - Mobile-first CSS Grid/Flexbox

### File Structure
```
├── controllers/          # Business logic
├── models/              # Data models
├── routes/              # API routes
├── auth/                # Authentication
├── config/              # Configuration
├── public/              # Web interface
│   ├── index.html       # Main HTML
│   ├── app.js          # Device control logic
│   ├── automation.js   # Smart home features
│   └── style.css       # Responsive styles
└── .kiro/steering/     # AI assistant guidance
```

## 🔧 Development

### Adding New Device Types
1. Update `getDeviceTypeInfo()` in `app.js`
2. Add device icon in `getDeviceIcon()`
3. Implement controls in `createDeviceControls()`

### Adding Automation Rules
1. Extend `SmartHomeAutomation` class
2. Add new rule types in `checkSchedules()`
3. Update UI in `automation.js`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- HomeWizard for the smart home devices
- SunCalc library for astronomical calculations
- Chart.js for beautiful analytics
- Font Awesome for icons

## 🐛 Troubleshooting

### Common Issues

**"Invalid session key" errors:**
- Check your HWL_USERNAME and HWL_PASSWORD
- Ensure your HomeWizard account is active
- Try restarting the application

**Device not responding:**
- Verify the device is online in HomeWizard app
- Check if SMARTPLUG_ID is correct
- Ensure device belongs to the configured smart plug

**GUI not loading:**
- Check browser console for JavaScript errors
- Verify all CDN libraries are loading
- Try clearing browser cache

## 📞 Support

For support, please open an issue on GitHub or contact the maintainers.