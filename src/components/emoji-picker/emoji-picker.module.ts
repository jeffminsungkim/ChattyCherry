import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EmojiPickerComponent } from '@ashy/components/emoji-picker/emoji-picker';

@NgModule({
    declarations: [
        EmojiPickerComponent,
    ],
    imports: [
        IonicPageModule.forChild(EmojiPickerComponent),
    ],
    exports: [
        EmojiPickerComponent
    ]
})
export class EmojiPickerComponentModule {}
