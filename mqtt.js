/**
 * Created by Blink on 2017/11/22.
 * for mqtt native
 */

import {DeviceEventEmitter, AsyncStorage} from 'react-native';
import init from './mqttIndex';
import SeekBuffer from "../system/SeekBuffer";
import {Buffer} from 'buffer';
import uuid from 'uuid/v4';

init({
    size: 10000,
    storageBackend: AsyncStorage,
    defaultExpires: 1000 * 3600 * 24,
    enableCache: true,
    reconnect: true,
    sync: {}
});

const MqttMessageQosLevel = {
    mostOnce: 0,
    leastOnce: 1,
    exactlyOnce: 2,
};

export default class MqttClient {

    timedCound() {
        clearTimeout();
        setTimeout(() => {
            this._callback.lostConnect && this._callback.lostConnect({client: this})
        }, 30000);
    }

    _onConnect(connect) {
        this._callback.onConnected && this._callback.onConnected({client: this});
    }

    _onFailure(failure) {
        console.log('mqtt "' + this.name + '" is failure.', failure);
        this._callback.lostConnect && this._callback.lostConnect({client: this});
    }

    _onMessageArrived(message) {
        this.timedCound();
        console.log(message, message.payloadBytes);
        this._callback.arrived && this._callback.arrived(message.payloadBytes);
    }

    _onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
            blink.toast("连接丢失,正在重新连接...");
            this._callback.lostConnect && this._callback.lostConnect({client: this});
        }
    }

    _onConnected(responseObject) {
        console.log("onConnected:" + responseObject);
        if (!responseObject) {
            blink.toast("连接丢失,正在重新连接...");
            this._callback.lostConnect && this._callback.lostConnect({client: this});
        }
    }

    _onMessageDelivered(responseObject) {
        // console.log("onMessageDelivered:" + responseObject);
    }

    constructor(opts) {

        if (!opts) throw new Error("mqtt client options cannot be NULL.");
        if (!opts.host) throw new Error('mqtt client: the host cannot be NULL');

        this.clientId = uuid();
        this.host = opts.host;
        this.port = opts.port || 58584;
        this.name = opts.name || '';
        this.username = opts.username || '';
        this.password = opts.password || '';

        this._callback = {
            onConnected: opts.onConnected,
            lostConnect: opts.onLostConnect,
            arrived: opts.onArrived,
            delivery: opts.onDelivery
        };

        if (!this._handle) {
            this._handle = new Paho.MQTT.Client(this.host, this.port, this.clientId);
            this._handle.onMessageArrived = this._onMessageArrived.bind(this);
            this._handle.onConnectionLost = this._onConnectionLost.bind(this);
            this._handle.onMessageDelivered = this._onMessageDelivered.bind(this);
            this._handle.onConnected = this._onConnected.bind(this);
        }
    }

    get connected() {
        return this._handle.isConnected();
    }

    async connect(options) {
        try {
            await this._handle.connect({
                userName: this.username,
                password: this.password, onSuccess: () => this._onConnect(), onFailure: () => this._onFailure()
            });
            console.log(this._handle);
            this.timedCound();

        } catch (e) {
            this._callback.onLostConnect && this._callback.onLostConnect({client: this, error: e});
        }
    }

    async destroy() {
        await this._handle.disconnect();
        console.log('mqtt "' + this.name + '" is destroyed');
    }

    async subscribe(topic, qos) {
        qos = qos || MqttMessageQosLevel.exactlyOnce;
        let subscribeOptions = {};
        subscribeOptions.onSuccess = (invocationContext, grantedQos) => {
        };
        subscribeOptions.onFailure = (invocationContext, grantedQos) => {
            console.log('subscribe is onFailure', invocationContext, grantedQos);
            this._callback.onConnected && this._callback.onConnected({client: this});
        };
        await this._handle.subscribe(topic, subscribeOptions);
    }

    async publish(topic, msg: SeekBuffer, qos) {
        qos = qos || MqttMessageQosLevel.exactlyOnce;
        await this._handle.publish(topic, msg.buffer, qos, false);
    }

    async unsubscribe(topic) {
        await this._handle.unsubscribe(topic);
    }
}
