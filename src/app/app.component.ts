import { Component } from '@angular/core';
import {SimpleChanges} from '@angular/core';
import {Paho} from '../../node_modules/ng2-mqtt/mqttws31';
import { ChartsModule } from 'ng2-charts';
import { GaugeModule, GaugeSegment, GaugeLabel } from 'ng2-kw-gauge';

const { version: appVersion } = require('../../package.json')

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public appVersion
  days = 1;
  temps: any[] = [];
  humes: any[] = [];
  histTopic = "rpi/csp/hist";
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
    
    setTimeout(function() {document.getElementById("defaultOpen").click();}, 1);

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
      else if(message.destinationName == this.histTopic)
      {
        try {
          var data = JSON.parse(message.payloadString);

          var x = [
            {data: [], label: 'Temperatura'}
          ];
          var y = [];

          for(var i in data.data) {
            x[0].data.push(data.data[i].temp);
            if(parseInt(data.days) == 1)
              y.push(data.data[i].hour);
            else
              y.push(data.data[i].date + " " + data.data[i].hour);
          }
          
          this.lineChartLabels = y;

          var that = this;
          setTimeout(function() {
            that.lineChartData = x;
          }, 0);
        }
        catch(e) {
          console.log(e);
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
    this._client.subscribe(this.histTopic, { onSuccess: this.onSubscribed.bind(this) });
  }
  private onSubscribed():void {
    console.log("Subscribed...")

  }

  public openTab(tab) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
  
    document.getElementById(tab).style.display = "block";

    if(tab == "history") {
      this.showHistory();
    }
  }
  
  private showHistory():void {
    console.log("Show history");
    let message = new Paho.MQTT.Message('1');

    message.destinationName = 'rpi/csp/get/hist';
    this._client.send(message);
  }

  public showHistDays() {
    var days = (<HTMLInputElement>document.getElementById('days')).value;
    if(parseInt(days) > 7 || parseInt(days) < 1) {
      alert("Izberite število dni med 1 in 7!")
      return false;
    }

    console.log("Show history days");
    let message = new Paho.MQTT.Message(days);

    message.destinationName = 'rpi/csp/get/hist';
    this._client.send(message);
    return false;
  }

  public lineChartData:Array<any> = [
    {data: [], label: 'Temperatura'}
  ];
  public lineChartLabels:Array<any> = [];
  public lineChartOptions:any = {
    responsive: true
  };
  public lineChartColors:Array<any> = [
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#000',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
  ];
  public lineChartLegend:boolean = true;
  public lineChartType:string = 'line';
}
