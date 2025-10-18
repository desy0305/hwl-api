const ApiResponse = require('../models/ApiResponse');
const AuthenticationManager = require('../auth/authentication_manager');
const logger = require('../config/config').logger
var LocalStorage = require('node-localstorage').LocalStorage;
const axios = require('axios');
const config = require("../config/config");

localStorage = new LocalStorage('./states');

// Device to Smart Plug mapping
const DEVICE_TO_PLUG_MAP = {
    // SSB1 devices (b33f109e-41ae-429a-9102-a715a3e8c6bc)
    "ad621820-e2fb-40d2-9338-3f457e940cd2": "b33f109e-41ae-429a-9102-a715a3e8c6bc", // Controller Coffee
    "a67d781f-7ebf-47a8-9b9c-011f7f606142": "b33f109e-41ae-429a-9102-a715a3e8c6bc", // Bedroom TV
    "67320a19-d92b-4f49-b3c7-98ceec7ff61e": "b33f109e-41ae-429a-9102-a715a3e8c6bc", // Desk PC
    "f16aa0fe-fa30-4dbb-9f46-ca76bc81862b": "b33f109e-41ae-429a-9102-a715a3e8c6bc", // Kitchen
    "d63a68c6-5ade-4b53-a5fa-efd98aef22c5": "b33f109e-41ae-429a-9102-a715a3e8c6bc", // Bedroom
    "380fde11-ca05-4f2f-97b2-a9e5c51149f4": "b33f109e-41ae-429a-9102-a715a3e8c6bc", // Battery Charger
    "682dfb55-c91d-4318-9f14-840779ff7665": "b33f109e-41ae-429a-9102-a715a3e8c6bc", // Dron
    "4d76e4ec-be86-455b-8915-affd03f919c4": "b33f109e-41ae-429a-9102-a715a3e8c6bc", // Sink Lights
    
    // Audio Amplifier TV devices (7675fb88-1477-4513-b946-1bda76a5237b)
    "f0a1f073-1c41-4b5d-adb9-b0f9caad4b8d": "7675fb88-1477-4513-b946-1bda76a5237b"  // Controller
};

// Function to get the correct smart plug ID for a device
function getSmartPlugIdForDevice(deviceId) {
    return DEVICE_TO_PLUG_MAP[deviceId] || config.smartPlugId; // fallback to default
}

module.exports = {
    // Return all registered plugs
    getAllPlugs(req, res, next) {
        const sessionKey = AuthenticationManager.getSessionKey().then(sessionkey => {

            // Check if session key is valid
            if (sessionkey) {
                axios({
                        method: 'get',
                        url: 'https://plug.homewizard.com/plugs',
                        headers: {
                            "x-session-token": sessionkey
                        }
                    })
                    .then(response => {
                        let resArray = [];
                        response.data.map((smartplug) => {
                            resArray.push({
                                id: smartplug.id,
                                identifier: smartplug.identifier,
                                name: smartplug.name,
                                latitude: smartplug.latitude,
                                longitude: smartplug.longitude,
                                online: smartplug.online,
                                devices: smartplug.devices,
                            });
                        });
                        res.status(200).send(resArray);
                    })
                    .catch(e => {
                        // Cannot communicate with HWL, returning error
                        logger.error("Failed to communicate with HWL! ERROR: ", e.message);
                        res.status(503).send(new ApiResponse(e.message, 503));
                    });
            } else {
                // Session key is invalid
                res.status(503).send(new ApiResponse("Invalid session key! Check logs", 503));
            }
        }).catch(e => {
            res.status(503).send(new ApiResponse(e, 503));
        });
    },

    // Change the state of a plug
    switchPlug(req, res, next) {
        AuthenticationManager.getSessionKey().then(sessionkey => {

            // Check if session key is valid
            if (sessionkey) {

                let data = undefined;

                // Check plug type
                if(req.body.type && req.body.type.toLowerCase() === "dimmer") {

                    const dimmerLevel = req.body.value;
                    if(typeof(dimmerLevel) === "number") {
                        if(dimmerLevel < config.minDimmingValue) {
                            data = {
                                action: "Off",
                            }
                        } else if (dimmerLevel <= 100){
                            data = {
                                action: "Range",
                                value: dimmerLevel
                            }
                        } else {
                            // Dimming level is at an invalid amount
                            logger.error(`Dimmer Level can't be above 100, found ${dimmerLevel}`);
                            res.status(400).send(new ApiResponse(`Dimmer Level can't be above 100, found ${dimmerLevel}`));
                        }
                    } else {
                        res.status(400).send(new ApiResponse("Invalid value. For dimmers you should provide an integer between 0 and 100", 400));
                    }

                } else if(req.body.type && req.body.type.toLowerCase() === "brel_ud_curtain") {
                    // Device is a curtain, identified as "brel_ud_curtain"
                    // Variable to store wanted Action 
                    let actionValue;
                    
                    if (req.body.value.toLowerCase() === "up") {
                        actionValue = "Up";
                    } else if(req.body.value.toLowerCase() === "stop"){
                        actionValue = "Stop";
                    } else if(req.body.value.toLowerCase() === "down"){
                        actionValue = "Down";
                    } else {
                        res.status(400).send(new ApiResponse("Invalid value. For curtain typ brel_ud_curtain you should provide 'Up', 'Down' or 'Stop'", 400));
                    }

                    // create data object with selected Action 
                    data = {
                        action: actionValue,
                    };
                
                } else {
                    // Plug is not a dimmer or curtain, so should be a switch
                    if (req.body.value && typeof(req.body.value) === "string") {
                        data = {
                            action: req.body.value.toLowerCase() === "on" ? "On" : "Off",
                        }
                    } else {
                        res.status(400).send(new ApiResponse("Invalid value. For switches you should provide 'On' or 'Off'", 400));
                    }
                }

                if(data) {
                    // Get the correct smart plug ID for this device
                    const smartPlugId = getSmartPlugIdForDevice(req.params.plugID);
                    
                    axios({
                        method: "post",
                        url:
                            "https://plug.homewizard.com/plugs/" +
                            smartPlugId +
                            "/devices/" +
                            req.params.plugID +
                            "/action",
                        headers: {
                            "x-session-token": sessionkey,
                        },
                        data: data,
                    })
                        .then((response) => {
                            logger.debug(response);

                            // Check if request was successful
                            // Should not be necessary, but still...

                            if (response.data.status === "Success") {
                                // Response successful

                                // Home Assistant compatibility for Restful switch, see
                                // https://www.home-assistant.io/components/switch.rest/

                                if(typeof(req.body.value) === "number") {
                                    const plugState = req.body.value >= config.minDimmingValue;
                                    localStorage.setItem(req.params.plugID, plugState);
                                    res.status(200).send({ is_active: plugState });
                                } else {
                                    const plugState = req.body.value.toLowerCase() === "on";
                                    localStorage.setItem(req.params.plugID, plugState);
                                    res.status(200).send({ is_active: plugState });
                                }
                            } else {
                                // Unsuccessful
                                res.status(503).send(new ApiResponse(`HWL returned an error. Check logs`, 503));
                            }
                        })
                        .catch((e) => {
                            // Cannot communicate with HWL, returning error
                            logger.error(`Can't communicate with HWL: ${e}`);
                            res.status(400).send(new ApiResponse(`Can't communicate with HWL. Check logs`, 503));
                        });
                }
            } else {
                // Session key is invalid
                res.status(503).send(new ApiResponse("Invalid session key! Check the logs for more details about this problem ", 503));
            }
        }).catch(e => {
            logger.error(e);
            res.status(503).send(new ApiResponse(e, 503));
        });
    },

    // Get state of plug
    plugState(req, res, next) {
        // Check if state exists
        if (!localStorage.getItem(req.params.plugID)) {
            logger.debug("Item doesn't exist");

            // Return false if plug doesn't have a recorded state
            res.status(200).send({
                "is_active": false
            });
        } else {
            logger.debug("Item exists");
            // Return state from localStorage
            res.status(200).send({
                "is_active": localStorage.getItem(req.params.plugID) === "true"
            });
        }
    },

    // Get information about Smartplug
    getSmartPlug(req, res, next) {
        AuthenticationManager.getSessionKey().then(sessionkey => {

            // Check if session key is valid
            if (sessionkey) {
                axios({
                        method: 'get',
                        url: 'https://plug.homewizard.com/plugs',
                        headers: {
                            "x-session-token": sessionkey
                        }
                    })
                    .then(response => {
                        // Check if no smartplugs exist
                        if (!response.data || response.data.length === 0) {
                            res.status(200).send(new ApiResponse("No smartplugs found", 200));
                        } else {
                            // Return the first smartplug (or modify to return all if needed)
                            const smartplug = response.data[0];
                            res.status(200).send({
                                "id": smartplug.id,
                                "name": smartplug.name,
                                "online": smartplug.online,
                                "latitude": smartplug.latitude,
                                "longtitude": smartplug.longtitude,
                                "timeZone": smartplug.timeZone,
                                "firmwareUpdateAvailable": smartplug.firmwareUpdateAvailable
                            });
                        }
                    })
                    .catch(e => {
                        // Cannot communicate with HWL, returning error
                        logger.error("Failed to communicate with HWL! ERROR: ", e.message);
                        res.status(503).send(new ApiResponse(e.message, 503));
                    });
            } else {
                // Session key is invalid
                res.status(503).send(new ApiResponse("Invalid session key! Check the logs for more details about this problem ", 503));
            }
        }).catch(e => {
            logger.error(e);
            res.status(503).send(new ApiResponse(e, 503));
        });
    }
}
