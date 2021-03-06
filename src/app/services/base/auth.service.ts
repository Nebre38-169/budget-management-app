import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { getAuth, createUserWithEmailAndPassword, Auth, UserCredential, signInWithRedirect, getRedirectResult, User, onAuthStateChanged, setPersistence, browserSessionPersistence, browserLocalPersistence, sendPasswordResetEmail, AuthError, updatePassword, updateEmail, EmailAuthCredential} from 'firebase/auth';
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider } from 'firebase/auth';
import { UserService } from '../data/user.service';
import { UserObject } from 'src/app/class/base/user-object';
import { FirebaseError } from 'firebase/app';
import { MonthService } from '../data/month.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public isAuth: Subject<boolean>;

  private isUserAuth: boolean;
  private auth: Auth;
  private provider: GoogleAuthProvider;
  private fireBaseUser: User;

  constructor(
    private userService: UserService,
    private monthService: MonthService
  ) {
    this.auth = getAuth();
    setPersistence(this.auth,browserSessionPersistence)
    .catch(err=>{throw err});
    this.isAuth = new Subject();
    this.provider = new GoogleAuthProvider();
    
    onAuthStateChanged(this.auth, (user)=>{
      if(user){
        this.isUserAuth = true;
        this.fireBaseUser = user;
      } else {
        this.isUserAuth = false;
        this.fireBaseUser = null;
        
      }
      this.publish();
    })
  }

  public signIn(u: UserObject, password: string, repeat: string): Promise<boolean | Error> {
    return new Promise<boolean | Error>((resolve,rejects)=>{
      if(password===repeat){
        createUserWithEmailAndPassword(this.auth, u.email,password)
        .then((userCred: UserCredential)=>{
          this.fireBaseUser = userCred.user;
          this.userService.createOne(u)
          .then(()=>{
            this.isUserAuth = true;
            this.publish();
            resolve(true);
          })
          .catch((err)=>rejects(err));
        })
        .catch((err)=>{
          const error = this.handleError(err);
          if(error instanceof FirebaseError){
            rejects(error);
          } else {
            resolve(error);
          }
        });
      } else {
        rejects(new Error('Passwords don\'t match'));
      }
    });
  }

  public signInWithGoogle(): Promise<boolean>{
    return new Promise<boolean>(async (resolve,rejects)=>{
      await signInWithRedirect(this.auth,this.provider);
      getRedirectResult(this.auth)
      .then((result: UserCredential)=>{
        const cred = GoogleAuthProvider.credentialFromResult(result);
        const email = result.user.email;
        this.userService.getOne(email)
        .then((u)=>{
          if(u){
            this.isUserAuth = true;
            this.publish();
            resolve(true);
          } else {
            u = new UserObject(email,result.user.displayName);
            this.userService.createOne(u)
            .then(()=>{
              this.isUserAuth = true;
              this.publish();
              resolve(true);
            })
            .catch((err)=>{
              rejects(err);
            });
          }
        });
      })
      .catch();
    });
  }

  public logIn(email: string, password: string, persitence: boolean): Promise<boolean | Error>{
    return new Promise<boolean | Error>((resolve,rejects)=>{
      let p = browserSessionPersistence;
      if(persitence){
        p = browserLocalPersistence;
      }
      setPersistence(this.auth,p)
      .then(()=>{
        signInWithEmailAndPassword(this.auth,email,password)
        .then((userCred: UserCredential)=>{
          const user = userCred.user;
          this.userService.getOne(email)
          .then(()=>{
            this.isUserAuth = true;
            this.publish();
            resolve(true);
          })
          .catch(err=>{
            console.log(err);
            rejects(err);
          });
        })
        .catch((err:FirebaseError)=>{
          const error = this.handleError(err);
          if(error instanceof FirebaseError){
            rejects(error);
          } else {
            resolve(error);
          }
        });
      })
      .catch(err=>rejects(err));
    });
  }

  public retrievePassword(email: string): Promise<boolean>{
    return new Promise<boolean>((resolve,reject)=>{
      sendPasswordResetEmail(this.auth,email)
      .then(()=>resolve(true))
      .catch((err: AuthError)=>{
        if(err.code==='auth/user-not-found'){
          resolve(true);
        } else {
          reject(err);
        }
      });
    })
  }

  public updateUserPassword(old:string, n: string): Promise<boolean>{
    return new Promise<boolean>((resolve,rejects)=>{
      signInWithEmailAndPassword(this.auth,this.auth.currentUser.email,old)
      .then((u: UserCredential)=>{
        updatePassword(this.auth.currentUser,n)
        .then((v)=>resolve(true))
        .catch(err =>rejects(err));
      })
      .catch(err =>rejects(err));
    })
  }

  public updateUserEmail(e: string): Promise<boolean>{
    return new Promise<boolean>((resolve,rejects)=>{
      const prevEmail = this.auth.currentUser.email;
      if(e===prevEmail){
        resolve(true);
      } else {
        updateEmail(this.auth.currentUser,e)
        .then((v)=>{
          this.userService.getOne(prevEmail)
          .then((u)=>{
            if(u){
              this.userService.changeEmail(u,e)
              .then((v)=>{
                this.monthService.getAllFromUser(prevEmail)
                .then((months)=>{
                  if(months && months.length>0){
                    months.forEach(async (m) => {
                      m.setUser(e);
                      await this.monthService.editOne(m);
                    })
                    this.userService.deleteOne(prevEmail)
                    .then((v)=>{
                      this.userService.getOne(e)
                      .then((u)=>{if(u) resolve(true)})
                      .catch(err=>rejects(err));
                    })
                    .catch(err=>rejects(err));
                  }
                })
                .catch(err=>rejects(err));
              })
              .catch(err=>rejects(err));
            }
          })
          .catch(err=>rejects(err));
        })
        .catch(err=>rejects(err));
      }
    })
  }

  public logOut(): Promise<boolean>{
    return new Promise<boolean>((resolve,rejects)=>{
      signOut(this.auth)
      .then(()=>{
        this.isUserAuth = false;
        this.publish();
        resolve(true);
      })
      .catch((err)=>rejects(err));
    });
  }

  public isLogIn(): boolean{
    this.publish();
    return this.isUserAuth===true;
  }

  private publish(): void{
    this.isAuth.next(this.isUserAuth);
  }

  private handleError(err: FirebaseError): FirebaseError | Error{
    let r;
    switch(err.code) {
      case 'auth/user-not-found':{
        r = new Error('Invalid email or password');
        break;
      }
      case 'auth/wrong-password':{
        r = new Error('Invalid email or password');
        break;
      }
      default:{
        r = err;
        break;
      }
    }
    return r;
  }
}


