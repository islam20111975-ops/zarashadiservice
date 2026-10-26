"use client";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {onAuthStateChanged,signOut} from "firebase/auth";
import {doc,getDoc,setDoc,updateDoc,serverTimestamp} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";
const ADMIN_PATH="/admin";
const ADMINS=["ngogrant454@gmail.com","islam20111975@gmail.com"];
const ICON="/api/pwa-icon?size=512";
function isStandalone(){return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;}
export default function AppAccessGate({children}){
 const pathname=usePathname();
 const router=useRouter();
 const admin=pathname===ADMIN_PATH || pathname.startsWith(ADMIN_PATH+"/");
 const profileSetup=pathname==="/account";
 const profilePage=pathname.startsWith("/profile/");
 const [checking,setChecking]=useState(true);
 const [standalone,setStandalone]=useState(false);
 const [prompt,setPrompt]=useState(null);
 const [splash,setSplash]=useState(false);
 const [ios,setIos]=useState(false);
 const [canInstall,setCanInstall]=useState(false);
 const [hideButton,setHideButton]=useState(false);
 const [accessStatus,setAccessStatus]=useState("checking");
 useEffect(()=>{
  let timer=null,activeUid=null,removeVisibilityListener=null;
  const writePresence=(uid,isOnline)=>setDoc(doc(db,"userPresence",uid),{uid,isOnline,lastSeen:serverTimestamp()},{merge:true}).catch(()=>{});
  const unsub=onAuthStateChanged(auth,user=>{
   if(timer){clearInterval(timer);timer=null;}
   if(removeVisibilityListener){removeVisibilityListener();removeVisibilityListener=null;}
   if(activeUid)writePresence(activeUid,false);
   activeUid=user?.uid||null;
   if(!user)return;
   const uid=user.uid;
   const heartbeat=()=>writePresence(uid,true);
   heartbeat();
   timer=setInterval(heartbeat,45000);
   const onVisible=()=>{if(document.visibilityState==="visible")heartbeat();};
   document.addEventListener("visibilitychange",onVisible);
   removeVisibilityListener=()=>document.removeEventListener("visibilitychange",onVisible);
  });
  return()=>{
   unsub();
   if(timer)clearInterval(timer);
   if(removeVisibilityListener)removeVisibilityListener();
   if(activeUid)writePresence(activeUid,false);
  };
 },[]);
 useEffect(()=>{
  let alive=true;
  const unsub=onAuthStateChanged(auth,async user=>{
   if(!alive)return;
   // Public profile pages must be viewable without login or admin approval.
   if(profilePage){setAccessStatus("allowed");return;}
   if(!user){setAccessStatus("login");return;}
   setAccessStatus("checking");
   const adminUser=ADMINS.includes(user.email?.toLowerCase());
   const userRef=doc(db,"users",user.uid);
   try{
    let snap=await getDoc(userRef);
    if(adminUser){
     if(snap.exists()&&snap.data().status!=="approved")await updateDoc(userRef,{status:"approved",updatedAt:serverTimestamp()});
     if(alive)setAccessStatus("approved");
     return;
    }
    if(!snap.exists()){
     await setDoc(userRef,{uid:user.uid,email:user.email||"",name:user.displayName||"",photoURL:user.photoURL||"",status:"pending",createdAt:serverTimestamp()});
     if(alive)setAccessStatus(profileSetup?"allowed":"pending");
     return;
    }
    if(!alive)return;
    if(profileSetup){setAccessStatus("allowed");return;}
    setAccessStatus(snap.data().status==="approved"?"approved":snap.data().status==="rejected"?"rejected":"pending");
   }catch(e){if(alive)setAccessStatus(profileSetup?"allowed":"error")}
  });
  return()=>{alive=false;unsub()};
 },[profileSetup,profilePage]);
 useEffect(()=>{
  if(admin){setChecking(false);return;}
  const checkInstalled=async()=>{
   const stand=isStandalone(); setStandalone(stand);
   let previouslyInstalled=false;
   try{previouslyInstalled=window.localStorage.getItem("zaraPwaInstalled")==="1";}catch(e){}
   if(stand){setHideButton(true);try{window.localStorage.setItem("zaraPwaInstalled","1");}catch(e){}return;}
   if(previouslyInstalled){setHideButton(true);return;}
   try{if(navigator.getInstalledRelatedApps){const apps=await navigator.getInstalledRelatedApps();setHideButton(apps.some(a=>a.platform==="webapp"));return;}}catch(e){}
   setHideButton(false);
  };
  const ua=navigator.userAgent||"";setIos(/iphone|ipad|ipod/i.test(ua)&&!isStandalone());
  checkInstalled();setChecking(false);
  const before=e=>{e.preventDefault();window.__zaraInstallPrompt=e;setPrompt(e);setCanInstall(true);try{window.localStorage.removeItem("zaraPwaInstalled");}catch(err){}setHideButton(false);};
  const ready=()=>{if(window.__zaraInstallPrompt){setPrompt(window.__zaraInstallPrompt);setCanInstall(true);}};
  const onInstalled=()=>{window.__zaraInstallPrompt=null;setPrompt(null);setCanInstall(false);setHideButton(true);try{window.localStorage.setItem("zaraPwaInstalled","1");}catch(e){}};
  const onMode=()=>{checkInstalled();};
  const mode=window.matchMedia("(display-mode: standalone)");mode.addEventListener?.("change",onMode);
  window.addEventListener("beforeinstallprompt",before);window.addEventListener("zara-install-ready",ready);window.addEventListener("appinstalled",onInstalled);window.addEventListener("pageshow",checkInstalled);window.addEventListener("zara-branding-updated",checkInstalled);
  document.addEventListener("visibilitychange",onMode);ready();
  return()=>{window.removeEventListener("beforeinstallprompt",before);window.removeEventListener("zara-install-ready",ready);window.removeEventListener("appinstalled",onInstalled);window.removeEventListener("pageshow",checkInstalled);window.removeEventListener("zara-branding-updated",checkInstalled);mode.removeEventListener?.("change",onMode);document.removeEventListener("visibilitychange",onMode);};
 },[admin]);
 useEffect(()=>{if(admin||!standalone)return;setSplash(true);const t=setTimeout(()=>setSplash(false),2500);return()=>clearTimeout(t);},[admin,standalone]);
 async function install(){
  const event=prompt||window.__zaraInstallPrompt;
  if(!event){if(ios){alert("Safari me Share (□↑) dabayein → Add to Home Screen → Add.");return;}alert("Chrome ke ⋮ menu me Install app ya Add to Home screen chunein.");return;}
  try{event.prompt();const choice=await event.userChoice;window.__zaraInstallPrompt=null;setPrompt(null);setCanInstall(false);if(choice?.outcome==="accepted"){setHideButton(true);try{window.localStorage.setItem("zaraPwaInstalled","1");}catch(err){}}}catch(e){}
 }
 if(admin)return <>{children}</>;

 return <>{children}{!standalone&&!hideButton&&<button className="zaraFloatingInstall" onClick={install} aria-label="Zara Nikah App install karein"><span className="zaraFloatingInstallIcon">📲</span><span className="zaraFloatingInstallText"><strong>APP INSTALL</strong><small>Zara Nikah Service</small></span><span className="zaraFloatingInstallArrow">↓</span></button>}{splash&&standalone&&<div className="zaraPwaSplash"><img src="/api/app-splash" alt="" className="zaraPwaSplashBg"/><div className="zaraPwaSplashShade"/></div>}</>;
}