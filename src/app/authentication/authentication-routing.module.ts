import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MissingPasswordComponent } from './missing-password/missing-password.component';
import { SignInComponent } from './sign-in/sign-in.component';

const routes: Routes = [
  {
    path : 'login',
    component : LoginComponent
  },
  {
    path: 'sign',
    component: SignInComponent
  },
  {
    path: 'missing-password',
    component: MissingPasswordComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class AuthenticationRoutingModule { }
