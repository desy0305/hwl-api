// Load environment variables from .env file
require('dotenv').config();

// Set debug level for tracer
const loglevel = process.env.LOGLEVEL || "warn";

module.exports = {
    // Web port where the server will listen to
    webPort: process.env.PORT || 3000,

    // Authentication for Homewizard Lite API
    hwlUsername: process.env.HWL_USERNAME || "",
    hwlPassword: process.env.HWL_PASSWORD || "",

    // SmartPlugID
    // Should be returned from HW when you GET on /api/smartplug
    smartPlugId:
        process.env.SMARTPLUG_ID || "",

    // Dimmer Ranges
    // Some dimmers only support dimming up to a certain amount.
    minDimmingValue: process.env.MIN_DIMMING_VALUE || 1,

    // Cache Time To Live
    cacheTTL: process.env.CACHE_TTL || 1800,

    // Authentication timeout and retry configuration
    authTimeout: (() => {
        const timeout = parseInt(process.env.AUTH_TIMEOUT) || 15000;
        return (timeout >= 5000 && timeout <= 60000) ? timeout : 15000;
    })(),
    authMaxRetries: (() => {
        const retries = parseInt(process.env.AUTH_MAX_RETRIES) || 3;
        return (retries >= 1 && retries <= 10) ? retries : 3;
    })(),
    authRetryDelay: (() => {
        const delay = parseInt(process.env.AUTH_RETRY_DELAY) || 2000;
        return (delay >= 1000 && delay <= 10000) ? delay : 2000;
    })(),

    // Tracer for logging purposes
    logger: require("tracer").console({
        format: ["{{timestamp}} <{{title}}> {{file}}:{{line}} : {{message}}"],
        preprocess: function (data) {
            data.title = data.title.toUpperCase();
        },
        dateformat: "isoUtcDateTime",
        level: loglevel,
    }),
};