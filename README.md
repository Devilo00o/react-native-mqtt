import MqttClient from "./mqtt";

const mqttClientParams = {
            onConnected: (e) => this._onConnected(e),
            onLostConnect: (e) => this._onLostConnect(e),
            onArrived: (e) => this._onArrived(e),
        };

this.MqttClient = new MqttClient({
                ...mqttClientParams,
                name: name,
                host: host,
                port: mqttPort,
                clientId: clientId:,
            });

this.MqttClient .connect();