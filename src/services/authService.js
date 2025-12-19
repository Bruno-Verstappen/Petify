// src / services / authService .js
import {
createUserWithEmailAndPassword ,
signInWithEmailAndPassword ,
signOut ,
onAuthStateChanged ,
} from " firebase / auth ";
import { auth } from "../ config / firebase ";
export function registerWithEmail (email , password ) {
return createUserWithEmailAndPassword (auth , email , password ) ;
}
export function loginWithEmail (email , password ) {
return signInWithEmailAndPassword (auth , email , password ) ;
}
export function logout () {
return signOut ( auth ) ;
}
export function subscribeToAuthChanges ( callback ) {
return onAuthStateChanged (auth , callback ) ;
}