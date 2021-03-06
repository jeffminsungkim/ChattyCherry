import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { RestService } from '@ashy/services/http/rest-service';
import { LocalStorageServiceProvider } from '@ashy/services/local-storage-service/local-storage-service';
import { Ashy } from '@ashy/models/ashy';
import { User } from '@ashy/models/user';
import { Username } from '@ashy/models/username';
import { environment } from '@ashy/env';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { take, map, filter } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators/debounceTime';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import { firestore } from 'firebase/app';


@Injectable()
export class UserServiceProvider extends RestService {

  private rtdb: firebase.database.Database;
  private fs: firebase.firestore.Firestore;
  private appRef: AngularFirestoreCollection<Ashy>;
  private usersRef: AngularFirestoreCollection<User>;
  private usernamesRef: AngularFirestoreCollection<any>;
  private friendsRef: AngularFirestoreCollection<User>;
  authState: any = null;
  // usersRef: AngularFirestoreCollection<any>;
  users$: Observable<User[]>;
  user$: any;
  friendsListRef$: AngularFirestoreCollection<any>;
  friends$: Observable<any[]>;

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    protected http: HttpClient,
    protected localStorage: LocalStorageServiceProvider) {
      super(http, localStorage);
      this.rtdb = firebase.database();
      this.fs = firebase.firestore();
      this.appRef = this.afs.collection<Ashy>('apps');
      this.usersRef = this.afs.collection<User>('users');
      this.usernamesRef = this.afs.collection<Username>('usernames');
      this.afAuth.authState.do(user => {
        this.authState = user;

        if (user) {
          this.updateOnConnect();
          this.updateOnDisconnect();
        }
      }).subscribe();
  }

  set accessToken(token: string) { this.token = token; }

  get authenticated(): boolean {
    return this.authState !== null;
  }

  get currentUserId(): string {
    return this.authenticated ? this.authState.uid : '';
    // return this.authState.uid;
  }

  get currentUserDisplayName(): string {
    return this.authState['displayName'];
  }

  get currentUserEmailVerified(): boolean {
    return this.authState['emailVerified'];
  }

  get currentUserEmail(): string {
    return this.authState['email'];
  }

  get currentUserPhotoURL(): string {
    return this.authState['photoURL'];
  }

  // determineUserSentFriendRequestToCertainParty(followingUserUID: string) {
  //   let usersRef = this.afDB.list('friend-requests/', ref => ref.orderByChild(followingUserUID));
  //   this.users$ = usersRef.snapshotChanges().map(changes => {
  //     return changes.map(c => ({ key: c.payload.key, ...c.payload.val() }));
  //   });
  //   return this.users$;
  // }

  /*determineUserSentFriendRequestToCertainParty(followingUserUID: string) {
    return this.afDB.list(`friend-requests/${followingUserUID}`, ref => ref.orderByChild('uid').equalTo(this.currentUserId)).valueChanges();
  }

  getCurrentUserProfilePhoto() {
    return this.afDB.object(`profilepics/${this.currentUserId}`).valueChanges();
  }

  getCurrentUserObject() {
    return this.afDB.object(`users/${this.currentUserId}`).valueChanges();
  }*/

  private getAppRef(uid: string) {
    return this.appRef.doc<Ashy>(uid);
  }

  private getUsersRef(uid: string) {
    return this.usersRef.doc<User>(uid);
  }

  private getUsernamesRef() {
    return this.usernamesRef.doc<Username>(this.currentUserId);
  }

  private getFriendRef(uid: string) {
    return this.usersRef.doc<User>(uid).collection('friends');
  }

  getCurrentUserAppState() {
    return this.getAppRef(this.currentUserId).valueChanges();
  }

  getCurrentUser() {
    return this.getUsersRef(this.currentUserId).valueChanges();
  }

  getUserStatus() {
    return this.rtdb.ref(`status/${this.currentUserId}`);
  }

  getMyFriendsId() {
    let friendRef = this.getFriendRef(this.currentUserId);
    this.friends$ = friendRef.snapshotChanges().map(actions => {
      return actions.map(a => ({ key: a.payload.doc.id, ...a.payload.doc.data()}));
    });
    return this.friends$;
  }

  getFriends(uid: string) {
    return this.getUsersRef(uid).valueChanges();
  }

  getUsernameVisibility() {
    return this.getUsernamesRef().valueChanges();
  }

  updateLastLoginTime() {
    let lastLogin = { lastLoginAt: firebase.firestore.FieldValue.serverTimestamp() };
    this.usersRef.doc(this.currentUserId).update(lastLogin);
  }

  updateCurrentUserActiveStatusTo(status: string) {
    let activeStatus = { currentActiveStatus: status };
    this.rtdb.ref(`status/${this.currentUserId}`).update(activeStatus);
    this.usersRef.doc(this.currentUserId).update(activeStatus).catch(error => console.error('Update CurrentActiveStatus in users node Fails',error));
  }

  updateCurrentUserAppUsageStatusTo(isUsingApp: boolean, activeStatus: string) {
    let status = { usingApp: isUsingApp };
    if (activeStatus === 'signout') this.rtdb.ref(`status/${this.currentUserId}`).update(status);
    else this.rtdb.ref(`status/${this.currentUserId}`).update(status);
  }

  // updateFriendActiveStatusTo(status: string) {
  //   let activeStatus = { currentActiveStatus: status }
  //   console.log("stats1:", status);
  //   this.afDB.list(`friends/${this.currentUserId}`).snapshotChanges().subscribe(snapshot => {
  //     console.log('snapshot', snapshot);
  //     let updateObj = {};
  //     snapshot.forEach(friend => {
  //       console.log("stats2:", status);
  //       updateObj[`friends/${friend.key}/${this.currentUserId}`] = activeStatus;
  //     });
  //     firebase.database().ref().update(updateObj);
  //   });
  // }

  // Updates status when connection to Firebase starts
  updateOnConnect() {
    return this.rtdb.ref('.info/connected').on('value', snapshot => {
      this.updateCurrentUserActiveStatusTo('online');
      this.updateLastLoginTime();
    });
  }

  // Updates status when connection to Firebase ends
  updateOnDisconnect() {
    return this.rtdb.ref('.info/connected').on('value', snapshot => {
      this.rtdb.ref(`status/${this.currentUserId}`)
      .onDisconnect()
      .update({ currentActiveStatus: 'offline' });
    });
  }

  updateEmailVerificationState() {
    let app = { emailVerified: true };
    this.getAppRef(this.currentUserId).update(app);
  }

  updateNotificationPemissionState(state: boolean) {
    let notificationState = { allowNotification: state };
    this.getAppRef(this.currentUserId).update(notificationState);
  }

  // updateNotificationToken(token: string, uid: string) {
  //   let deviceToken = { notificationToken: token };
  //   this.getUsersRef(uid).update(deviceToken).then(() => console.log('Updated device token'));
  // }

  updateUserEmailAddress(email: string) {
    let newEmailAddress = { email: email };
    return this.getUsersRef(this.currentUserId).update(newEmailAddress);
  }

  updateUserProfile(name: string, photoURL?: string) {
    const data = {
      displayName: name,
      photoURL: photoURL || this.currentUserPhotoURL
    };

    return this.afAuth.auth.currentUser.updateProfile(data)
      .then(() => {
        console.log('name:', name, 'photoURL:', photoURL);
        console.log('Successfully updated default user profile');
        // Force refresh regardless of token expiration
        return this.afAuth.auth.currentUser.getIdToken(true);
      })
      .then(newToken => {
        console.log('Token refreshed!', newToken);
        return newToken;
      })
      .catch((err) => console.log(err));
  }

  updateStatusMessage(message: string) {
    const statusMessage = { statusMessage: message };
    return this.usersRef.doc(this.currentUserId).update(statusMessage);
  }

  useIdenticon() {
    const profilePhoto = { thumbnailURL: null, photoURL: null };
    return this.usersRef.doc(this.currentUserId).update(profilePhoto);
  }

  setIdenticon(identiconURL: string) {
    return this.usersRef.doc(this.currentUserId).update({identiconURL: identiconURL});
  }

  updateGender(gender: string) {
    const finalGender = { gender: gender }
    this.usersRef.doc(this.currentUserId).update(finalGender).catch(error => console.error('Gender updates:', error));
  }

  updateUsernameVisibility(blurriness: boolean) {
    const visibleState = { invisibility: blurriness };
    this.usernamesRef.doc(this.currentUserId).update(visibleState).catch(error => console.error('Username visibility updates:', error));
  }

  finalizeInitialUserState(data: any) {
    this.baseUrl = environment.cloudFuntionBaseUrl;
    const relativeUrl = 'initDefaultStateAuthUserStartapp/'
    return this.post(relativeUrl, data);
  }

  checkUsername(username: string) {
    username = username.toLowerCase();
    return this.afs.collection('usernames', ref => ref.where('username', '==', username).where('invisibility', '==', false))
      .valueChanges().pipe(debounceTime(500), take(1));
  }

  getMatchedUser(uid: string) {
    return this.getUsersRef(uid).valueChanges();
  }

  // updateUsername(username: string) {
  //   let data = {};
  //   data[username] = this.currentUserId;
  //   this.afDB.object(`users/${this.currentUserId}`).update({'username': username});
  //   this.afDB.object(`usernames`).update(data);
  // }
  /*updateUsername(username: string) {
    let updateUsername = {};
    updateUsername[`usernames/${username}`] = this.currentUserId;
    updateUsername[`users/${this.currentUserId}/username`] = username;
    firebase.database().ref().update(updateUsername);
  }

  removeDeprecatedUsername(username: string) {
    this.afDB.object(`usernames/${username}`).remove();
  }



  sendFriendRequest(recipient: string, sender: User) {
    let senderInfo = {
      uid: sender.uid,
      displayName: sender.displayName,
      photoURL: sender.photoURL,
      username: sender.username,
      timestamp: Date.now(),
      message: 'wants to be friend with you.'
    }
    return new Promise((resolve, reject) => {
      this.afDB.list(`friend-requests/${recipient}`).push(senderInfo).then(() => {
        resolve({'status': true, 'message': 'Friend request has sent.'});
      }, error => reject({'status': false, 'message': error}));
    });
  }

  fetchFriendRequest() {
    return this.afDB.list(`friend-requests/${this.currentUserId}`).valueChanges();
  }

  acceptFriendRequest(sender: User, user: User) {
    // let acceptedUserInfo = {
    //   uid: sender.uid,
    //   displayName: sender.displayName,
    //   photoURL: sender.photoURL,
    //   statusMessage: sender.statusMessage,
    //   username: sender.username,
    //   currentActiveStatus: sender.currentActiveStatus
    // }

    // let accepterInfo = {
    //   uid: user.uid,
    //   displayName: user.displayName,
    //   photoURL: user.photoURL,
    //   statusMessage: user.statusMessage,
    //   username: user.username,
    //   currentActiveStatus: user.currentActiveStatus
    // }

    this.afDB.list(`friends/${this.currentUserId}`).set(sender.uid, true);
    this.afDB.list(`friends/${sender.uid}`).set(user.uid, true);
    // this.afDB.list(`friends/${this.currentUserId}`).set(sender.uid, acceptedUserInfo);
    // this.afDB.list(`friends/${sender.uid}`).set(user.uid, accepterInfo);
    this.removeCompletedFriendRequest(sender.uid);
  }

  rejectFriendRequest(UID: string) {
    this.removeCompletedFriendRequest(UID);
  }

  removeCompletedFriendRequest(UID: string) {
    const endpoint = `friend-requests/${this.currentUserId}`;
    this.afDB.list(endpoint, ref => ref.orderByChild('uid').equalTo(UID)).snapshotChanges().take(1).subscribe((snapshot) => {
      snapshot.map(requester => {
        console.log('key', requester.key);
        this.afDB.list(endpoint).remove(requester.key);
      });
    });
  }*/

  removeUserFromFriendList(uid: string) {
    this.getFriendRef(this.currentUserId).doc(uid).delete();
  }

}
