import { Component } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

const isLogEnabled = true;

@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
})
export class IntroPage {
  constructor(private diagnostic: Diagnostic,
    private nativeStorage: NativeStorage,
    public navCtrl: NavController,
    private toastCtrl: ToastController
  ) { }
  
  
  datam=[];
  ed: number;
  d1: any;
  curr: number;
  ts: number;
  

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



  goForward() {


    this.navCtrl.navigateForward('scanner');
  }
}
