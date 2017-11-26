import { Injectable } from '@angular/core';
import { ModalController } from 'ionic-angular';

@Injectable()
export class ModalServiceProvider {

  constructor(private modalCtrl: ModalController) {

  }

  showProfileModal(userKey: string) {
    let profileModal = this.modalCtrl.create('ProfilePage', {key: userKey});
    profileModal.present();
  }

}
