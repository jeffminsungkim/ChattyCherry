import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PasswordRecoveryPage } from '@ashy/pages/password-recovery/password-recovery';

@NgModule({
  declarations: [
    PasswordRecoveryPage,
  ],
  imports: [
    IonicPageModule.forChild(PasswordRecoveryPage),
  ],
})
export class PasswordRecoveryPageModule {}
