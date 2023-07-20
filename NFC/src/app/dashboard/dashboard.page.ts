import { Component, NgZone, ViewChild } from '@angular/core';
import { NavController, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from "@angular/router";
import { Platform } from '@ionic/angular';
import { BLE } from '@ionic-native/ble/ngx';
import { Chart } from 'chart.js';
import { NFC, Ndef } from '@awesome-cordova-plugins/nfc/ngx';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
const isLogEnabled = true

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  data = new Array();        //chart datası 
  data2 = new Array();        //chart datası 
  bars: any = null;
  colorArray: any;
  @ViewChild('barChart') barChart;
  ext: any;
  ar = [];
  yax = 0;
  k = 0;
  ed: number;
  intervalid: any;
  risk= false;
  chart_finished=false;


  constructor(private ble: BLE,
    public navCtrl: NavController,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    public platform: Platform,
    private ngZone: NgZone,
    private nfc: NFC,
    private ndef: Ndef,
    private nativeStorage: NativeStorage
  ) { }

  ionViewDidEnter() {
    this.createBarChart();
    this.getitem();
    this.bars.update();
  }

  getitem() {
    this.k = 0;

    this.nativeStorage.getItem("exp-dur").then(
      (ed1) => {
        this.ed = Number(ed1);
      },
      (err) => {
        console.error(err);
      }
    );

    this.nativeStorage.getItem("data").then(
      (data1) => {

        this.ext = data1.split(",");

        for (let index = 1; index < this.ext.length - 1; index++) {

          this.data2[index - 1] = Number(this.ext[index]);
          this.yax += 1;
          this.data = new Array(this.yax);
        };

        this.setlabels();  //ar[] created 
        this.data.fill(0);
        this.ed = (this.ed / this.yax) * 1000
        this.lop();
      },
      (error) => { this.showToast(error.toString(), "danger", 2, "top"); }

    );

  }

  setlabels() {
    for (let index = 0; index < this.yax; index++) {
      this.ar[index] = index;
      console.log(this.ar[index]);    //labellar assign edildi 1-N
    }

  }
  geted() {
    this.nativeStorage.getItem("exp-dur").then(
      (ed1) => {
        this.ed = Number(ed1);
      }
    )
  }

  lop() {
    this.createBarChart();
    let crr=setInterval(() => {
      if (this.k>this.yax){
        clearInterval(crr);
        this.chart_finished=true;
      }
      this.data.shift();
      this.data.push(Number(this.data2[this.k]));
      if (this.data2[this.k]>2000) {
        this.risk= true;
      }
      (this.k) += 1;
      this.bars.update();
    }, this.ed);
  }

  clrinterval() {
    clearTimeout(this.intervalid);
  }

  showSett() {
    this.nfc.showSettings(
    );
  }

  // show toast
  async showToast(msg, clr, dur, pos) {
    let toast = await this.toastCtrl.create({
      message: msg,
      color: clr,
      duration: dur,
      position: pos,
      cssClass: 'toast'
    });

    toast.present();
  }

  // show alert
  async showAlert(title, message) {
    let alert = await this.alertCtrl.create({
      header: title,
      subHeader: message,
      buttons: ['OK'],
      cssClass: 'alert'
    })
    await alert.present()
  }
  // try createbarchart as method -cengiz
  createBarChart() {
    this.bars = new Chart(this.barChart.nativeElement, {
      type: 'line',
      data: {
        labels: this.ar,
        datasets: [{
          label: 'Capacitance',
          data: this.data,
          backgroundColor: 'rgb(38, 194, 129)', // array should have same number of elements as number of dataset
          borderColor: 'rgb(38,194,55)',// array should have same number of elements as number of dataset
          borderWidth: 3,
          fill: false
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });

  }
}
