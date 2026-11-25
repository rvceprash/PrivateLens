import { firebaseConfigured, googleLogin, firebaseLogout } from './firebase';
const useFirebase = import.meta.env.VITE_USE_FIREBASE_AUTH === 'true' && firebaseConfigured;
export async function signIn(){
  if(useFirebase){ const result=await googleLogin(); return {name:result.user.displayName||'User',email:result.user.email,photoURL:result.user.photoURL}; }
  return {name:'Prashanth',email:'prototype@local',photoURL:null,prototype:true};
}
export async function signOut(){ if(useFirebase) await firebaseLogout(); }
export function authMode(){ return useFirebase?'Firebase Auth':'Prototype Auth'; }
