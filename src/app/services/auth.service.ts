import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from 'src/app/services/api.service';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from 'src/app/models/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /**
   * Route to redirect to after signing in
   */
  static readonly signInRedirect: string = 'dash';

  /**
   * User subject behavior for authenticated user
   * @see AuthService.user
   */
  private userSubject: BehaviorSubject<User> = new BehaviorSubject<User>(AuthService.getUser());

  /**
   * Authenticated user
   */
  user: Observable<User> = this.userSubject.asObservable();

  constructor(private http: HttpClient,
              private router: Router,
              private api: ApiService) {
  }

  /**
   * Save/update token to localStorage
   */
  static setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * @returns Stored token from localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Save/update user to localStorage
   */
  static setUser(data: object): void {
    localStorage.setItem('user', JSON.stringify(data));
  }

  /**
   * @returns User data from localStorage
   */
  static getUser(): User | null {
    const data: string = localStorage.getItem('user');
    if (data) {
      return new User(JSON.parse(data));
    }
    return null;
  }

  /**
   * Sign out (clear localStorage)
   */
  signOut(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(AuthService.getUser());
    this.router.navigateByUrl('sign-in');
  }

  /**
   * Sign in (send API request, save to localStorage and redirect)
   */
  signIn(username: string, password: string): Observable<any> {
    return this.http.post(ApiService.BASE + 'auth/', { username, password }).pipe(
      map((data: any) => {
        AuthService.setToken(data.token);
        AuthService.setUser(data.user);
        this.userSubject.next(AuthService.getUser());
        this.router.navigateByUrl(AuthService.signInRedirect);
        return data;
      })
    );
  }

  /**
   * Sign up (send API request and sign in)
   */
  signUp(username: string, email: string, password: string): Observable<any> {
    return this.http.post(ApiService.BASE + 'users/', { username, email, password }).pipe(
      map(() => {
        return this.signIn(username, password).subscribe();
      })
    );
  }
}