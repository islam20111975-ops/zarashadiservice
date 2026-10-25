"use client";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {onAuthStateChanged,signOut} from "firebase/auth";
import {doc,getDoc,setDoc,serverTimestamp} from "firebase/firestore";
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
 const [checking,setChecking]=useState(true);
 const [standalone,setStandalone]=useState(false);
 const [prompt,setPrompt]=useState(null);
 const [splash,setSplash]=useState(false);
 const [ios,setIos]=useState(false);
 const [canInstall,setCanInstall]=useState(false);
 const [hideButton,setHideButton]=useState(false);
 const [accessStatus,setAccessStatus]=useState("checking");
 useEffect(()=>{
  let timer=null,activeUid=null;
  const writePresence=(uid,isOnline)=>setDoc(doc(db,"userPresence",uid),{uid,isOnline,lastSeen:serverTimestamp()},{merge:true}).catch(()=>{});
  const unsub=onAuthStateChanged(auth,user=>{
   if(timer){clearInterval(timer);timer=null;}
   if(activeUid){writePresence(activeUid,false);}
   activeUid=user?.uid||null;
   if(!user)return;
   const uid=user.uid;
   const heartbeat=()=>writePresence(uid,true);
   heartbeat();
   timer=setInterval(heartbeat,45000);
   const onVisible=()=>{if(document.visibilityState==="visible")heartbeat();};
   document.addEventListener("visibilitychange",onVisible);
   // Keep cleanup for the currently active account.
   const previousTimer=timer;
   const originalClear=clearInterval;
   // Listener is removed by auth callback replacement/unmount cleanup below.
   userPresenceCleanup=()=>{originalClear(previousTimer);document.removeEventListener("visibilitychange",onVisible);writePresence(uid,false);};
  });
  let userPresenceCleanup=null;
  return()=>{unsub();if(timer)clearInterval(timer);if(userPresenceCleanup)userPresenceCleanup();if(activeUid)writePresence(activeUid,false);};
 },[]);

 useEffect(()=>{
  let alive=true;
  const unsub=onAuthStateChanged(auth,async user=>{
   if(!alive)return;
   if(!user || ADMINS.includes(user.email?.toLowerCase()) || profileSetup){setAccessStatus("allowed");return;}
   setAccessStatus("checking");
   try{
    const snap=await getDoc(doc(db,"users",user.uid));
    if(!alive)return;
    setAccessStatus(snap.exists()&&snap.data().status==="approved"?"approved":snap.exists()&&snap.data().status==="rejected"?"rejected":"pending");
   }catch(e){if(alive)setAccessStatus("error")}
  });
  return()=>{alive=false;unsub()};
 },[profileSetup]);
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
 if(checking || accessStatus==="checking")return <div className="zaraBootScreen" aria-hidden="true"/>;
 if(accessStatus==="pending"||accessStatus==="rejected"||accessStatus==="error"){
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"linear-gradient(135deg,#fff7ed,#fdf2f8)"}}>
   <section className="cardPage" style={{maxWidth:520,width:"100%",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:12}}>{accessStatus==="rejected"?"⛔":accessStatus==="error"?"⚠️":"⏳"}</div>
    <h1>{accessStatus==="rejected"?"Access request rejected":accessStatus==="error"?"Approval status check nahi ho saka":"Admin approval pending"}</h1>
    <p>{accessStatus==="rejected"?"Aapka account approve nahi hua. Zara Nikah Service Admin se sampark karein.":accessStatus==="error"?"Internet/Firebase Rules check karein, phir page refresh karein.":"Aapka Google account register ho gaya hai. Website aur paid features use karne se pehle Admin approval zaroori hai."}</p>
    <button className="primaryAction" onClick={()=>router.push("/account")}>My Account / Profile</button>
    <button className="backAction" style={{marginTop:10}} onClick={()=>signOut(auth).then(()=>router.push("/"))}>Logout</button>
   </section>
  </main>;
 }
 return <>{children}{!standalone&&!hideButton&&<button className="zaraFloatingInstall" onClick={install} aria-label="Zara Nikah App install karein"><span className="zaraFloatingInstallIcon">📲</span><span className="zaraFloatingInstallText"><strong>APP INSTALL</strong><small>Zara Nikah Service</small></span><span className="zaraFloatingInstallArrow">↓</span></button>}{splash&&standalone&&<div className="zaraPwaSplash"><img src="/api/app-splash" alt="" className="zaraPwaSplashBg"/><div className="zaraPwaSplashShade"/></div>}</>;
}