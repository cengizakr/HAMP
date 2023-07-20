import { Component, NgZone, ViewChild } from '@angular/core';
import { NavController, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { NavigationExtras } from "@angular/router";
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { NFC, Ndef } from '@awesome-cordova-plugins/nfc/ngx';
import { Chart } from 'chart.js';
import { Papa } from 'ngx-papaparse';
import { File } from '@ionic-native/file/ngx';


const isLogEnabled = true;
const frequency = 5;
const ar = [];
for (let i = 0; i < 50; i++) {
  ar.push(0)
}

const SET = 182;
const ADC_DIVIDER = 4;
const ADC_PRESCALER = 5;
const ADC_TS_DELAY = 6;
const ADC_NWAIT = 7;
const ADC_BIT_CONFIG = 8;
const ADC_BUF_CONFIG = 10;
const ADC_CH_CONFIG = 11;
const ISEN_CONFIG = 12;
const ISEN_VALUE = 13;




@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
})

export class ScannerPage {

  data = Array(52).fill(0);
  tagim: any;
  sayi: Number;
  saved_data = [];
  @ViewChild('barChart') barChart;
  bars: any = null;

  addr = new ArrayBuffer(2);

  addr_view = new Uint8Array(this.addr);

  ADC_RESULT_BUFF_020: any;
  ADC_RESULT_BUFF_080: any;
  ADC_RESULT_BUFF_120: any;
  chrt: any;
  new_value: Number;


  constructor(private diagnostic: Diagnostic,
    private nativeStorage: NativeStorage,
    public navCtrl: NavController,
    public platform: Platform,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingController: LoadingController,
    private ngZone: NgZone,
    private nfc: NFC,
    private file: File,
    private papa: Papa,

  ) { }






  ionViewDidEnter() {
    this.nfc.addTagDiscoveredListener(() => this.NFCops, () => { console.log("addnd_ error") });

    // ADC return commands
    this.addr_view[0] = 184;
    this.addr_view[1] = 0;

    let flags = this.nfc.FLAG_READER_NFC_A | this.nfc.FLAG_READER_NFC_V;
    this.nfc.readerMode(flags).subscribe(
      tag => {
        this.tagim = tag;
        console.log("tag info JSON: " + JSON.stringify(this.tagim));
        console.log("reader is success");
        this.NFCops();
      },
      err => console.log('Error reading tag', err)
    );


  }

  NFCops() {
    this.nfc.connect("android.nfc.tech.NfcA").then(
      (tag) => {
        console.log("connected to NFC....");
        console.log("connectted tag JSON =   " + JSON.stringify(tag));
      },
      (err) => { console.log(err) + "olmadı" }
    );


    let ADCbuff = new ArrayBuffer(3);
    let ADCview = new Uint8Array(ADCbuff);


    this.NFCset();      // for setting the measurement parameters

    this.createBarChart();
    this.chrt = setInterval(() => {

      this.nfc.transceive(this.addr).then(
        (resp) => {
          let tt = new Uint8Array(resp);
          this.data.shift();
          console.log("Voltage: " + this.raw_to_voltage(tt));
          console.log("Capacitance: " + this.volt_to_cap(this.raw_to_voltage(tt)));
          this.new_value = this.volt_to_cap(this.raw_to_voltage(tt)) * 10 ** 9;
          this.data.push(this.ngZone.run(() => this.new_value));
          this.bars.data.datasets.data = this.data;
          ar.shift();
          let secs = Number((ar[48] + 1 / frequency).toFixed(2))
          ar.push(secs);
          let temp_data = { "seconds": String(secs), "value": String(this.new_value) };
          this.saved_data.push(temp_data);

          this.bars.update();

        },
        error => console.log('Error selecting DESFire application')
      );

    }, (1 / frequency) * 1000);

  }
  // setting measurement parameters
  NFCset() {
    let cmds = [[180, 255], [48, 48], [SET, ADC_DIVIDER, 114], [SET, ADC_PRESCALER, 2], [SET, ADC_TS_DELAY, 121], [SET, ADC_NWAIT, 128], [SET, ADC_BIT_CONFIG, 12], [SET, ADC_BUF_CONFIG, 19], [SET, ADC_CH_CONFIG, 28], [SET, ISEN_CONFIG, 1], [SET, ISEN_VALUE, 63], [180, 255]]
    for (let i = 0; i < cmds.length; i++) {
      var buff = new ArrayBuffer(cmds[i].length);
      var buff_view = new Uint8Array(buff);
      for (let k = 0; k < cmds[i].length; k++) {
        buff_view[k] = cmds[i][k]
      }
      this.nfc.transceive(buff).then(
        response => console.log(JSON.stringify(response)),
        error => console.log('Error selecting DESFire application')
      );
    }



    // read 0x0A register to be ensure about the buffer settings
    buff = new ArrayBuffer(2);
    buff_view = new Uint8Array(buff);
    buff_view[0] = 181
    buff_view[1] = 10
    let raw = new ArrayBuffer(1);
    let rawi_view = new Uint8Array(raw)
    this.nfc.transceive(buff).then(
      response => {
        let tt = new Uint8Array(response);
        console.log("alırken cevabı=     " + tt + "\t bouyutu:   " + tt.length);

      },
      error => console.log('alırken cevap vermedi')
    );


    buff = new ArrayBuffer(2);
    buff_view = new Uint8Array(buff);
    buff_view[0] = 48;
    buff_view[1] = 48;
    let buff_raw = new ArrayBuffer(4);
    let raw_view = new Uint8Array(buff_raw);
    this.nfc.transceive(buff).then(
      response => {
        let tt = new Uint8Array(response)
        this.ADC_RESULT_BUFF_020 = Number(256 * tt[0] + tt[1]);
        this.ADC_RESULT_BUFF_080 = Number(256 * tt[2] + tt[3]);
        this.ADC_RESULT_BUFF_120 = Number(256 * tt[4] + tt[5]);

        console.log(this.ADC_RESULT_BUFF_020 + "\t" + this.ADC_RESULT_BUFF_080 + "\t" + this.ADC_RESULT_BUFF_120);
      },
      error => console.log("couldn't access the EEPROM ")
    );
  }



  raw_to_voltage(arr: Uint8Array) {
    let raw = Number(256 * arr[1] + arr[0])

    raw = raw >>> 2



    if (raw < this.ADC_RESULT_BUFF_020) {
      console.log("1 Worked");
      return ((raw / this.ADC_RESULT_BUFF_020) * 0.2)
    }

    else if (raw < this.ADC_RESULT_BUFF_080) {
      console.log("2 Worked")
      return ((((raw - this.ADC_RESULT_BUFF_020) / (this.ADC_RESULT_BUFF_080 - this.ADC_RESULT_BUFF_020)) * 0.6) + 0.2)
    }

    else if (raw < this.ADC_RESULT_BUFF_120) {
      console.log("3 Worked")
      return ((((raw - this.ADC_RESULT_BUFF_080) / (this.ADC_RESULT_BUFF_120 - this.ADC_RESULT_BUFF_080)) * 0.4) + 0.8)
    }
    else {
      console.log("4 Worked")
      return ((((raw - this.ADC_RESULT_BUFF_120) / (8192 - this.ADC_RESULT_BUFF_080)) * 0.08) + 1.2)
    }
  }

  volt_to_cap(v: number) {
    return ((504 * 10 ** -6) * (35.7 * 10 ** -6)) / v
  }




  goForward() {
    clearInterval(this.chrt);
    const fileName = 'data.csv';
    console.log("dosya adı:" + fileName);
    const csv = this.papa.unparse(this.saved_data);
    console.log("csv: " + csv + "\n\n\n");
    const csvFile = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    console.log("checkpoint");

    this.file.writeFile(this.file.externalRootDirectory + '/Download/', fileName, csvFile, { replace: true }).then(
      (old) => {
        this.showToast("Successfully Saved the Data in CSV Format", "primary", 3000, "bottom");
        console.log(JSON.stringify(old));
      },
      (err) => {
        this.showToast("an Error Happened While Saving the Data ", "danger", 3000, "bottom");
        console.log(JSON.stringify(err));
      }

    )
    console.log("checkpoint 2");

    return 0
  }

  trackItem(index: number, item: any) {
    return item.trackId;
  }



  createBarChart() {
    this.bars = new Chart(this.barChart.nativeElement, {
      type: 'line',
      data: {
        labels: ar,
        datasets: [{
          label: 'Capacitance (nF)',
          data: this.data,
          backgroundColor: 'rgb(38, 194, 129)', // array should have same number of elements as number of dataset
          borderColor: 'rgb(38,194,55)',// array should have same number of elements as number of dataset
          borderWidth: 2,
          fill: false
        }]
      },
      options: {
        aspectRatio: 1,
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: false,
            },
          }],
          xAxis: {
            labelString: 'time (s)'
          }
        },
        plugins: {
          legend: {
            labels: {
              font: {
                size: 20
              }
            }
          }

        },
        elements: {
          point: {
            radius: 2
          }
        }
      }
    });

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

}


