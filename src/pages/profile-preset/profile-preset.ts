import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController, Platform } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { AuthServiceProvider } from '@ashy-services/auth-service/auth-service';
import { LoadingServiceProvider } from '@ashy-services/loading-service/loading-service';
import { ToastServiceProvider } from '@ashy-services/toast-service/toast-service';
import { UserServiceProvider } from '@ashy-services/user-service/user-service';
import { UploadServiceProvider } from '@ashy-services/upload-service/upload-service';


@IonicPage()
@Component({
  selector: 'page-profile-preset',
  templateUrl: 'profile-preset.html',
})
export class ProfilePresetPage {

  public avatar: string;
  public displayName: string;
  public placeholder: string = 'assets/avatar/placeholder.jpg';
  public uid: string;

  cameraOptions: CameraOptions = {
    quality: 100,
    correctOrientation: true,
    sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
    destinationType: this.camera.DestinationType.FILE_URI,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE
  };

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public actionSheetCtrl: ActionSheetController,
    public camera: Camera,
    public platform: Platform,
    private authService: AuthServiceProvider,
    private  loadingService: LoadingServiceProvider,
    private toastService: ToastServiceProvider,
    private userService: UserServiceProvider,
    private uploadService: UploadServiceProvider) { this.uid = this.userService.currentUserId; }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProfilePresetPage');
  }

  preventBlur(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  uploadProfilePicture() {
    this.camera.getPicture(this.cameraOptions).then((imagePath) => {
      this.loadingService.show('Please wait');
      console.log("IMAGE PATH", imagePath);
      return this.uploadService.convertImageIntoBlob(imagePath);
    }).then((imageBlob) => {
      console.log("IMAGE BLOB", imageBlob);
      return this.uploadService.uploadImageToCurrentUserDir(imageBlob, this.uid);
    }).then((snapshot: any) => {
      console.log('downloadurl:', snapshot.downloadURL);
      this.avatar = snapshot.downloadURL;
      console.log("FILE UPLOAD SUCCESSFULLY", snapshot.downloadURL);
      this.placeholder = null;
      this.loadingService.dismiss();
    });
  }

  removeProfilePicture() {
    this.placeholder = 'assets/avatar/placeholder.jpg';
    this.avatar = null;
  }

  presentActionSheetUploadProfilePicture() {
    let actionSheet = this.actionSheetCtrl.create({
      title: !this.platform.is('ios') ? 'Albums' : null,
      cssClass:'action-sheet-buttons',
      buttons: [
        {
          text: 'Photo from library',
          icon: !this.platform.is('ios') ? 'cloud-upload' : null,
          handler: () => {
            this.uploadProfilePicture();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: !this.platform.is('ios') ? 'close' : null,
        }
      ]
    });
    actionSheet.present();
  }
  presentActionSheetRemoveProfilePicture() {
    let actionSheet = this.actionSheetCtrl.create({
      title: !this.platform.is('ios') ? 'Albums' : null,
      cssClass:'action-sheet-buttons',
      buttons: [
        {
          text: 'Photo from library',
          icon: !this.platform.is('ios') ? 'cloud-upload' : null,
          handler: () => {
            this.uploadProfilePicture();
          }
        },
        {
          text: 'Remove Profile Photo',
          cssClass: 'remove-button',
          role: 'destructive',
          icon: !this.platform.is('ios') ? 'trash' : null,
          handler: () => {
            this.removeProfilePicture();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: !this.platform.is('ios') ? 'close' : null,
        }
      ]
    });
    actionSheet.present();
  }

  startApp() {
    this.authService.updateDisplayname(this.displayName);
    this.userService.updateDisplayname(this.displayName);
    this.userService.updateCurrentUserAppUsageStatusTo(true, 'signout');
    this.userService.updateCurrentUserActiveStatusTo('online');
    this.userService.updateLastLoginTime();
    this.userService.updateEmailVerificationState();
    this.toastService.show(`Signed in as ${this.userService.currentUserEmail}`);
    this.navCtrl.setRoot('HomePage');
  }

}
