const logger = require("../config/config").logger;
const config = require("../config/config");
var sha1 = require("sha1");
const axios = require("axios");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: config.cacheTTL });

// Helper function to wait for a specified delay
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Internal function to attempt authentication with retry logic
function attemptAuthentication(username, password, retryCount = 0) {
    const maxRetries = config.authMaxRetries;
    
    logger.debug(`Authentication attempt ${retryCount + 1}/${maxRetries}`);
    
    return axios({
        method: "get",
        url: "https://cloud.homewizard.com/account/login",
        auth: {
            username: username,
            password: password,
        },
        timeout: config.authTimeout,
    })
        .then((response) => {
            logger.debug(`Received session key: ${response.data.session}`);
            cache.set("session", response.data.session);
            return response.data.session;
        })
        .catch((error) => {
            // Log detailed error information
            if (error.response) {
                // HTTP error response received
                logger.error(`Authentication attempt ${retryCount + 1}/${maxRetries} failed with HTTP ${error.response.status}`);
                logger.error(`Response: ${JSON.stringify(error.response.data)}`);
            } else if (error.code) {
                // Network/timeout error
                logger.error(`Authentication attempt ${retryCount + 1}/${maxRetries} failed: ${error.code}`);
                logger.error(`Error message: ${error.message}`);
                
                if (error.code === 'ECONNABORTED') {
                    logger.error(`Request timed out after ${config.authTimeout}ms`);
                } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
                    logger.error('DNS resolution failed - check network connectivity');
                }
            } else {
                logger.error(`Authentication attempt ${retryCount + 1}/${maxRetries} failed: ${error.message}`);
            }
            
            // Retry logic
            if (retryCount < maxRetries - 1) {
                const delay = config.authRetryDelay * Math.pow(2, retryCount);
                logger.warn(`Retrying in ${delay}ms... (attempt ${retryCount + 2}/${maxRetries})`);
                
                return wait(delay).then(() => {
                    return attemptAuthentication(username, password, retryCount + 1);
                });
            } else {
                // All retries exhausted
                logger.error(`Authentication failed after ${maxRetries} attempts`);
                logger.error('Check credentials, network connectivity, and HomeWizard API status');
                return Promise.reject("Can't get session key from HW. Check logs");
            }
        });
}

module.exports = {
    // Get Session Key from HomeWizard Lite
    getSessionKey() {
        // Check if sessionkey is cached
        let sessionKey = cache.get("session");

        if (sessionKey) {
            logger.debug(`Cached session key found: ${sessionKey}`);
            return Promise.resolve(sessionKey);
        } else {
            // Session key is not found in cache
            let username = config.hwlUsername;
            let password = sha1(config.hwlPassword);
            logger.debug(username);
            logger.debug(password);

            return attemptAuthentication(username, password);
        }
    },
};
