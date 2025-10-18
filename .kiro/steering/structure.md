# Project Structure

## Architecture Pattern
The project follows a **layered MVC-style architecture** with clear separation of concerns:

```
├── index.js              # Application entry point
├── app.js                # Express app configuration & middleware setup
├── config/               # Configuration management
│   └── config.js         # Environment variables & logger setup
├── routes/               # Route definitions (closed folder)
├── controllers/          # Business logic layer
│   ├── plug_controller.js
│   └── test_controller.js
├── models/               # Data models
│   ├── ApiResponse.js    # Standard API response format
│   ├── PlugResponse.js   # Plug-specific responses
│   └── SmartPlug.js      # Smart plug data model
├── auth/                 # Authentication layer
│   └── authentication_manager.js
└── states/               # Local storage directory (runtime)
```

## Key Conventions

### File Organization
- **Controllers**: Handle HTTP requests, contain business logic
- **Models**: Define data structures and response formats
- **Routes**: Define API endpoints (import controllers)
- **Config**: Centralized configuration with environment variable handling
- **Auth**: Session management and HomeWizard API authentication

### Naming Conventions
- Files: `snake_case.js`
- Classes: `PascalCase` (e.g., `ApiResponse`, `SmartPlug`)
- Functions: `camelCase`
- Constants: `camelCase` in config

### API Response Pattern
All endpoints return consistent `ApiResponse` objects with:
- `message`: Description
- `code`: HTTP status code
- `datetime`: ISO timestamp

### Error Handling
- Use structured logging via `tracer`
- Return appropriate HTTP status codes (400, 503, etc.)
- Include descriptive error messages in `ApiResponse` format

### State Management
- Session tokens cached in-memory using `node-cache`
- Device states persisted locally using `node-localstorage`
- Cache TTL configurable via environment variables