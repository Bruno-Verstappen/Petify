// src/services/authService.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth"; // REMOVIDO OS ESPAÇOS AQUI
import { auth } from "../config/firebase"; // Caminho correto para o config

export function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout () {
return signOut ( auth ) ;
}
export function subscribeToAuthChanges ( callback ) {
return onAuthStateChanged (auth , callback ) ;
}