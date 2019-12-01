import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthResponse } from 'src/app/interfaces/auth-response';
import { AuthToken } from 'src/app/interfaces/auth-token';
import { User } from 'src/app/interfaces/user';
import { ApiService } from 'src/app/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(private http: HttpClient,
              private router: Router,
              private cookie: CookieService) {
  }

  /**
   * Cookie expires in days
   */
  private static readonly cookieExpireDays = 365;

  /**
   * Sign in redirect
   */
  private static readonly signInRedirect = '/';

  /**
   * Sign out redirect
   */
  private static readonly signOutRedirect = '/';

  /**
   * Authentication user subject
   */
  private userSubject: BehaviorSubject<User> = new BehaviorSubject<User>(AuthService.getUser());
  /**
   * Authenticated user
   */
  user: Observable<User> = this.userSubject.asObservable();

  /**
   * Parse JWT from token.
   *
   * @param token JWT.
   *
   * @return Parsed JWT token.
   */
  private static parseJwt(token: string): AuthToken | null {
    const base64Url = token.split('.')[1];
    if (typeof base64Url === 'undefined') {
      return null;
    }
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(atob(base64));
  }

  /**
   * @returns User data from localStorage
   */
  private static getUser(): User | null {
    const data: string = localStorage.getItem('user');
    if (data) {
      return JSON.parse(data) as User;
    }
    return null;
  }

  /**
   * @return Is user authenticated
   */
  isAuth(): boolean {
    return this.cookie.check('token');
  }

  /**
   * Set or update user data and update subscribers
   *
   * @param user User data
   */
  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  /**
   * @returns Whether the authenticated user is the user
   *
   * @param user User to check
   */
  isUser(user: User): boolean {
    return this.userSubject.value && this.userSubject.value.id === user.id;
  }

  /**
   * @returns Whether the authenticated user is one of the users
   *
   * @param users Users to check
   */
  isAnyUser(users: User[]): boolean {
    return this.userSubject.value && users.some(user => user.id === this.userSubject.value.id);
  }

  /**
   * Save/update token to cookies
   *
   * @param token Authentication token
   */
  setToken(token: string): void {
    const parsedJwt: AuthToken = AuthService.parseJwt(token);
    if (parsedJwt) {
      this.cookie.set('token', token, AuthService.cookieExpireDays);
    }
  }

  /**
   * @returns Stored token from localStorage
   */
  getToken(): string | null {
    return this.cookie.get('token');
  }

  /**
   * Un-authenticate user by cleaning localStorage and cookies
   */
  signOut(): void {
    localStorage.clear();
    this.cookie.deleteAll('/');
    this.userSubject.next(null);
    this.router.navigateByUrl(AuthService.signOutRedirect);
  }

  /**
   * Sign user in
   *
   * @param username User username
   * @param password User password
   *
   * @return String observable which can be subscribed to.
   */
  signIn(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${ApiService.BASE}auth/`, { username, password }).pipe(
      map((data: AuthResponse): AuthResponse => {
        // Store token into cookies
        this.setToken(data.token);
        // Store user into local storage
        this.setUser(data.user);
        // Redirect
        this.router.navigateByUrl(AuthService.signInRedirect);
        // Return response
        return data;
      }),
    );
  }

  /**
   * Sign user up
   *
   * @param email User email
   * @param username User username
   * @param password user password
   */
  signUp(email: string, username: string, password: string): Observable<void> {
    return this.http.post(ApiService.BASE + 'users/', {
      email, username, password,
    }).pipe(map((): void => {
      this.signIn(username, password).subscribe();
    }));
  }
}
