import { Component, OnInit,ViewContainerRef } from '@angular/core';
import { AppService } from './../../app.service';
import { Router } from '@angular/router';
// import { ToastsManager } from 'ng2-toastr/ng2-toastr';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  public name: any;
  public email: any;
  public password: any;

  constructor(  
    public appService: AppService,
    public router: Router,
    // private toastr: ToastsManager,
    vcr: ViewContainerRef) {
      // this.toastr.setRootViewContainerRef(vcr);
     }

  ngOnInit() {
  }

  public goToSignIn: any = () => {

    this.router.navigate(['/']);

  } // end goToSignIn

  public signupFunction: any = () => {

    if (!this.name) {
      alert('enter name')
     

    }  else if (!this.email) {
      alert('enter email')

    } else if (!this.password) {
      alert('enter password')
     

    }  else {

      let data = {
        name: this.name,
        email: this.email,
        password: this.password,
      }

      console.log(data);

      this.appService.signupFunction(data)
        .subscribe((apiResponse) => {

          console.log(apiResponse);

          if (apiResponse.status === 200) {

            alert('Signup successful');

            setTimeout(() => {

              this.goToSignIn();

            }, 2000);

          } else {

            alert(apiResponse.message);

          }

        }, (err) => {

          alert('some error occured');

        });

    } // end condition

  } // end signupFunction

}
