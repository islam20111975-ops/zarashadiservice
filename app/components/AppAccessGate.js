// Install gate + installed-PWA splash for Zara Nikah Service.
"use client";

import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";

const ADMIN_PATH="/admin";
const ICON="/api/pwa-icon?size=512";

function isStandalone(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
}

export default function AppAccessGate({children}){
  const pathname=usePathname();
  const admin=pathname===ADMIN_PATH || pathname.startsWith(ADMIN_PATH+"/");
  const [standalone,setStandalone]=useState(false);
  const [prompt,setPrompt]=useState(null);
  const [installed,setInstalled]=useState(false);
  const [splash,setSplash]=useState(false);
  const [icon,setIcon]=useState(ICON);

  useEffect(()=>{
    if(admin){setStandalone(true);return;}
    setStandalone(isStandalone());
    try{
      const cached=JSON.parse(localStorage.getItem("zaraBrandingCache")||"null");
      if(cached?.appIcon) setIcon(cached.appIcon);
    }catch(e){}
    const applyIcon=()=>{try{const cached=JSON.parse(localStorage.getItem("zaraBrandingCache")||"null");if(cached?.appIcon)setIcon(cached.appIcon)}catch(e){}};
    const before=e=>{e.preventDefault();window.__zaraInstallPrompt=e;setPrompt(e)};
    const ready=()=>{if(window.__zaraInstallPrompt)setPrompt(window.__zaraInstallPrompt)};
    const onInstalled=()=>{window.__zaraInstallPrompt=null;setPrompt(null);setInstalled(true);setStandalone(true);};
    window.addEventListener("beforeinstallprompt",before);
    window.addEventListener("zara-install-ready",ready);
    window.addEventListener("zara-branding-updated",applyIcon);
    window.addEventListener("appinstalled",onInstalled);
    ready();applyIcon();
    return()=>{
      window.removeEventListener("beforeinstallprompt",before);
      window.removeEventListener("zara-install-ready",ready);
      window.removeEventListener("zara-branding-updated",applyIcon);
      window.removeEventListener("appinstalled",onInstalled);
    };
  },[admin]);

  useEffect(()=>{
    if(admin || !standalone) return;
    let cancelled=false;
    try{
      const shown=sessionStorage.getItem("zaraPwaSplashShown")==="1";
      if(shown) return;
      sessionStorage.setItem("zaraPwaSplashShown","1");
    }catch(e){}
    setSplash(true);
    const timer=setTimeout(()=>{if(!cancelled)setSplash(false)},1200);
    return()=>{cancelled=true;clearTimeout(timer)};
  },[admin,standalone]);

  async function install(){
    const event=prompt||window.__zaraInstallPrompt;
    if(!event){
      alert("Install option browser ke menu se use karein. Install complete hone ke baad website/app khul jayega.");
      return;
    }
    try{
      event.prompt();
      const choice=await event.userChoice;
      window.__zaraInstallPrompt=null;setPrompt(null);
      if(choice?.outcome==="accepted"){
        setInstalled(true);setStandalone(true);
      }
    }catch(e){}
  }

  if(admin || standalone || installed) return <>{splash&&<div className="zaraPwaSplash"><img src="/api/app-splash" alt="" className="zaraPwaSplashBg"/><div className="zaraPwaSplashShade"/><img src={icon||ICON} alt="Zara Nikah" className="zaraPwaSplashIcon"/><div className="zaraPwaSplashBrand">ZARA NIKAH <small>SERVICE</small></div></div>}{children}</>;

  return <>
    <div className="zaraInstallGate" role="dialog" aria-modal="true" aria-labelledby="zaraInstallTitle">
      <div className="zaraInstallGlow zaraGlowOne"/><div className="zaraInstallGlow zaraGlowTwo"/>
      <div className="zaraInstallCard">
        <div className="zaraInstallLogo"><img src={icon||ICON} alt="Zara Nikah App"/></div>
        <div className="zaraInstallBrand">ZARA NIKAH <small>SERVICE</small></div>
        <div className="zaraInstallBadge">✓ VERIFIED NIKAH SERVICE</div>
        <h1 id="zaraInstallTitle">📲 पहले App Install करें</h1>
        <p className="zaraInstallLead">Website के किसी भी page को खोलने के लिए पहले <b>Zara Nikah App</b> Install करें।</p>
        <div className="zaraInstallSteps">
          <div><b>1</b><span><strong>Install App</strong><small>नीचे दिए बटन पर क्लिक करें</small></span></div>
          <div><b>2</b><span><strong>App Install होने दें</strong><small>Browser का install prompt पूरा करें</small></span></div>
          <div><b>3</b><span><strong>Website खोलें</strong><small>Install के बाद यही page अपने-आप खुलेगा</small></span></div>
        </div>
        <button className="zaraInstallMainBtn" onClick={install}>📲 APP INSTALL करें <span>→</span></button>
        <p className="zaraInstallNote">🔒 बिना install किए public website pages और profiles नहीं खुलेंगे।</p>
      </div>
    </div>
    {children}
  </>;
}
