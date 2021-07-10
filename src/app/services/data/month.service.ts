import { Injectable, OnDestroy } from '@angular/core';
import firebase from 'firebase/app';
import { Subject, Subscription } from 'rxjs';
import { Month } from 'src/app/class/data/month';
import { AuthService } from '../base/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MonthService implements OnDestroy{
  public months: Subject<Month[]> = new Subject<Month[]>();

  private monthList: Month[] = [];
  private user: firebase.User;
  private authSub: Subscription;
  private db: firebase.firestore.Firestore;
  constructor(private auth: AuthService) {
    this.db = firebase.firestore();
    this.authSub = this.auth.user.subscribe(
      userCred =>{
        if(userCred){
          this.db.collection('users').doc(userCred.uid).get()
        .then(
          data =>{
            const monthIdList = data.data().months;
            this.monthList = [];
            for(const monthId of monthIdList){
              this.getOneMonth(monthId)
              .then(
                month =>{
                  if(month){
                    this.monthList.push(month);
                    this.updateMonths();
                  }
                }
              );
            }
          }
        )
        .catch(err => console.log(err));
        } else {
          this.monthList = [];
          this.updateMonths();
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.authSub.unsubscribe();
  }

  public updateMonths(){
    this.months.next(this.monthList);
  }

  private getOneMonth(monthId){
    return this.db.collection('months').doc(monthId).get()
    .then(
      data =>{
        const monthData = data.data();
        return new Month(
          monthId,
          new Date(monthData.start.seconds*1000),
          new Date(monthData.end.seconds*1000),
          monthData.budget
        );
      }
    )
    .catch(err => console.log(err));

  }

}
