import { Component } from '@angular/core';
import {Paho} from '../../node_modules/ng2-mqtt/mqttws31';
import { GaugeModule, GaugeSegment, GaugeLabel } from 'ng2-kw-gauge';

const { version: appVersion } = require('../../package.json')

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public appVersion
  temps: any[] = [];
  humes: any[] = [];
  tempTopic = "rpi/csp/temp";
  humTopic ="rpi/csp/hum";
  tempSegments: GaugeSegment[] = [];
  humSegments: GaugeSegment[] = [];
  tempLabels: GaugeLabel[] = [];
  humLabels: GaugeLabel[] = [];
  tempSeg: GaugeSegment;
  tempLbl: GaugeLabel;
  humSeg: GaugeSegment;
  humLbl: GaugeLabel;
  private _client: Paho.MQTT.Client;
  tempRising = null;
  humRising = null;

  public constructor() {
    this.appVersion = appVersion
    this._client = new Paho.MQTT.Client("vitez.si", 9001, "132456");
    //temp
    this.tempSeg = new GaugeSegment();
    this.tempLbl = new GaugeLabel();
    this.tempLbl.text = "-";
    this.tempLbl.color = "#FFFFFF";
    this.tempLbl.x = 0;
    this.tempLbl.y = 0;
    this.tempSeg.borderWidth = 10;
    this.tempSeg.bgColor = "#00000000"
    this.tempSeg.value = 0;
    this.tempSeg.color = "#F44336";
    this.tempSeg.goal = 100;
    this.tempSegments.push(this.tempSeg);
    this.tempLabels.push(this.tempLbl);
    //hum
    this.humSeg = new GaugeSegment();
    this.humLbl = new GaugeLabel();
    this.humLbl.text = "-";
    this.humLbl.color = "#FFFFFF";
    this.humLbl.x = 0;
    this.humLbl.y = 0;
    this.humSeg.borderWidth = 10;
    this.humSeg.bgColor = "#00000000"
    this.humSeg.value = 0;
    this.humSeg.color = "#2196F3";
    this.humSeg.goal = 100;
    this.humSegments.push(this.humSeg);
    this.humLabels.push(this.humLbl);
    this._client.onConnectionLost = (responseObject: Object) => {
      console.log('Connection lost.');
      console.log();
    };

    this._client.onMessageArrived = (message: Paho.MQTT.Message) => {
      console.log('Message arrived.');
      console.log(message.payloadString);
      console.log(message.destinationName);
      if(message.destinationName == this.tempTopic)
      {
        this.temps.unshift(Number(message.payloadString));
        if(this.temps.length > 10)
        {
          this.temps.pop();
        }
        this.tempSeg.value = Number(message.payloadString);
        this.tempLbl.text = "Temp: "+message.payloadString+"°C";
        if(this.temps.length >= 3)
        {
          if(this.temps[0] > this.temps[1] && this.temps[1] >= this.temps[2])
          {
            this.tempRising = true;
          } 
          else if(this.temps[0] < this.temps[1] && this.temps[1] <= this.temps[2]) 
          {
            this.tempRising = false;
          }
          else {
            this.tempRising = null;
          }
        }      
      }
      else if(message.destinationName == this.humTopic)
      {
        this.humes.unshift(Number(message.payloadString));
        if(this.humes.length > 10)
        {
          this.humes.pop();
        }
        this.humSeg.value = Number(message.payloadString);
        this.humLbl.text = "Hum: "+message.payloadString+"%RH";
        if(this.humes.length >= 3)
        {
          if(this.humes[0] > this.humes[1] && this.humes[1] >= this.humes[2])
          {
            this.humRising = true;
          } 
          else if(this.humes[0] < this.humes[1] && this.humes[1] <= this.humes[2]) 
          {
            this.humRising = false;
          }
          else {
            this.humRising = null;
          }
        }      
      } 
      else
      {
        console.log("Unknown topic: "+message.destinationName);
      }
    };

    this._client.connect({ onSuccess: this.onConnected.bind(this) });
  }

  private onConnected():void {
    console.log('Connected to broker.');
    this._client.subscribe(this.tempTopic, { onSuccess: this.onSubscribed.bind(this) });
    this._client.subscribe(this.humTopic, { onSuccess: this.onSubscribed.bind(this) });
  }
  private onSubscribed():void {
    console.log("Subscribed...")
  }
}
