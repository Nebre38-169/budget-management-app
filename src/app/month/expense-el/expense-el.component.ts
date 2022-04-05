import { AfterViewChecked, AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { GestureController, ViewDidEnter, ViewWillEnter } from '@ionic/angular';
import { Expense } from 'src/app/class/base/expense';

@Component({
  selector: 'app-expense-el',
  templateUrl: './expense-el.component.html',
  styleUrls: ['./expense-el.component.scss'],
})
export class ExpenseElComponent implements AfterViewChecked {
  @Input() e: Expense;
  @Input() sectionName: string;
  @Output() onEdit: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onDelete: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('content', { static: true, read: ElementRef }) contentElement;

  constructor(
    private gestureCtrl: GestureController
  ) {
    // console.log('construct');
  }
  

  ngAfterViewChecked(): void {
    // console.log('ionViewDidEnter');
    const element = document.getElementById(`page-content-${this.e.name}`);
    const elementWidth = element.clientWidth;
    // console.log(element);
    const g = this.gestureCtrl.create({
      el : element,
      gestureName: '',
      onMove: (details)=>{
        if(Math.abs(details.deltaX)>elementWidth/4){
          if(details.deltaX>0){
            element.classList.remove('content-to-left');
            element.classList.add('content-to-right');
          } else {
            element.classList.remove('content-to-right');
            element.classList.add('content-to-left');
          }
        } else {
          element.classList.remove('content-to-right');
          element.classList.remove('content-to-left');
        }
      },
    },true)
    g.enable();
  }

  
  public editBtn(){
    this.onEdit.emit(true);
  }

  public deleteBtn(){
    this.onDelete.emit(true);
  }

  public onDragStart(e: any){
    console.log(e);
  }

  public onDragMove(e: any){
    console.log(e);
  }

}