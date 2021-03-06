import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { dismiss } from '@ionic/core/dist/types/utils/overlays';
import { Subscription } from 'rxjs';
import { Month } from 'src/app/class/base/month';
import { MonthService } from 'src/app/services/data/month.service';
import { UserService } from 'src/app/services/data/user.service';

@Component({
  selector: 'app-add-month',
  templateUrl: './add-month.component.html',
  styleUrls: ['./add-month.component.scss'],
})
export class AddMonthComponent implements OnInit,OnDestroy {
  public startDate: Date;
  public endDate: Date;
  public addMonthForm: FormGroup;

  private userSub: Subscription;
  private userEmail: string;
  constructor(
    private modalControler: ModalController,
    private formBuilder: FormBuilder,
    private user: UserService
  ) { }
  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  ngOnInit() {
    this.addMonthForm = this.formBuilder.group({
      budget : [null,[Validators.required]],
      start : [null,[Validators.required]],
      end: [null,[Validators.required]]
    })
    this.userSub = this.user.objSub.subscribe(v=>this.userEmail=v.email);
    this.user.publish();
  }

  onStartDateChange(newDate: Date){
    this.startDate = newDate;
    this.addMonthForm.controls.start.setValue(newDate);
    this.addMonthForm.controls.start.updateValueAndValidity();
  }

  onEndDataChange(newDate: Date){
    this.endDate = newDate;
    this.addMonthForm.controls.end.setValue(newDate);
    this.addMonthForm.controls.end.updateValueAndValidity();
  }

  onAddMonth(){
    if(this.startDate<this.endDate){
      const b = this.addMonthForm.value.budget;
      const m = new Month(undefined,this.userEmail,this.startDate,this.endDate,b);
      this.modalControler.dismiss({ month : m});
    }
  }

}
