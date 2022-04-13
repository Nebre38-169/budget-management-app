import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Section } from 'src/app/class/base/section';
import { UserObject } from 'src/app/class/base/user-object';
import { AuthService } from 'src/app/services/base/auth.service';
import { UserService } from 'src/app/services/data/user.service';
import { AddSectionComponent } from '../add-section/add-section.component';
import { UpdateEmailComponent } from '../update-email/update-email.component';
import { UpdatePasswordComponent } from '../update-password/update-password.component';

@Component({
  selector: 'app-param-page',
  templateUrl: './param-page.component.html',
  styleUrls: ['./param-page.component.scss'],
})
export class ParamPageComponent implements OnInit,OnDestroy {
  public singleU : UserObject;

  private userSub: Subscription;
  constructor(
    private user: UserService,
    private auth: AuthService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) { 
  }

  

  ngOnInit() {
    this.userSub = this.user.objSub.subscribe((u)=>{
      if(u) this.singleU = u;
    });
    this.user.publish();
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  public async onEditEmail(){
    const modal = await this.modalCtrl.create({
      component: UpdateEmailComponent,
      breakpoints: [0,0.3],
      initialBreakpoint: 0.3,
      componentProps: {
        prevEmail: this.singleU.email
      }
    })
    modal.onDidDismiss()
    .then((v)=>{
      if(v.data){
        this.auth.updateUserEmail(v.data.newEmail)
        .then((v)=>{
          this.user.publish()
        })
      }
    })
    return await modal.present();
  }

  public async onEditPassword(){
    const modal = await this.modalCtrl.create({
      component: UpdatePasswordComponent,
      breakpoints: [0,0.3],
      initialBreakpoint: 0.3
    })
    modal.onDidDismiss()
    .then((v)=>{
      if(v.data){
        this.auth.updateUserPassword(v.data.old,v.data.new)
        .then((v)=>console.log('done'))
        .catch((err)=>{throw err});
      }
    })
    return await modal.present();
  }

  private async showSectionModal(s?: Section, index?:number){
    const modal = await this.modalCtrl.create({
      component: AddSectionComponent,
      componentProps : {
        editedSection: s,
        editedSectionIndex: index
      },
      breakpoints: [0,0.4],
      initialBreakpoint: 0.4
    });
    return await modal.present();
  }

  public onEditSection(i: number){
    this.showSectionModal(this.singleU.sections[i],i);
  }

  public onAddSection(){
    this.showSectionModal();
  }

  public async onDeleteSection(i: number){
    const confirmAlert = await this.alertCtrl.create({
      header: 'Confirmation',
      message: `Est-vous sur de vouloir supprimer la section ${this.singleU.sections[i].name} ?`,
      buttons: [
        {
          text: 'Oui',
          role: 'confirm',
          cssClass: 'btn-dark',
          handler: () =>{
            this.user.removeSection(i)
            .then((v)=>this.user.publish());
          }
        },
        {
          text: 'Non',
          role: 'Cancel',
          cssClass: 'btn-secondary'
        }
      ]
    })
    return await confirmAlert.present()
  }
}
