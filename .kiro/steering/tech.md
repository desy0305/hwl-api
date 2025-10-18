# Technology Stack

## Runtime & Framework
- **Node.js** (v10+ based on Dockerfile)
- **Express.js** - Web framework for REST API
- **JavaScript** (ES5/ES6 syntax)

## Key Dependencies
- **axios** - HTTP client for HomeWizard API communication
- **body-parser** - Request body parsing middleware
- **cors** - Cross-origin resource sharing support
- **morgan** - HTTP request logging
- **node-cache** - In-memory caching for session tokens
- **node-localstorage** - Local state persistence
- **sha1** - Password hashing for authentication
- **tracer** - Structured logging

## Build & Development Commands
```bash
# Install dependencies
npm install

# Start the application
npm start
# or
node index.js

# Development with auto-reload (if nodemon is available)
nodemon index.js
```

## Deployment
- **Docker** support with included Dockerfile
- **Port**: 3033 (configurable via PORT environment variable)
- **Container**: Node.js 10 base image

## Environment Configuration
Required environment variables:
- `HWL_USERNAME` - HomeWizard Lite username
- `HWL_PASSWORD` - HomeWizard Lite password  
- `SMARTPLUG_ID` - Target smart plug ID

Optional configuration:
- `PORT` (default: 3033)
- `MIN_DIMMING_VALUE` (default: 1)
- `CACHE_TTL` (default: 1800 seconds)
- `LOGLEVEL` (default: "warn")