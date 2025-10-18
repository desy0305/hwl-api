const app = require('./app');
const config = require('./config/config');

// Ensures the app starts and uses port 3000 or environment port
// Bind to all network interfaces (0.0.0.0) to allow access from other machines
app.listen(config.webPort, '0.0.0.0', () =>  {
    console.info('App running on port ' + config.webPort);
    console.info('Access from other machines using your local IP address');
});