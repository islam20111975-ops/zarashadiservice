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
  const [checking,setChecking]=useState(true);
  const [standalone,setStandalone]=useState(false);
  const [prompt,setPrompt]=useState(null);
  const [installed,setInstalled]=useState(false);
  const [splash,setSplash]=useState(false);
  const [icon,setIcon]=useState(ICON);
  const [ios,setIos]=useState(false);
  const [canInstall,setCanInstall]=useState(false);

  useEffect(()=>{
    if(admin){setChecking(false);return;}
    const standaloneNow=isStandalone();
    setStandalone(standaloneNow);
    setChecking(false);
    const ua=navigator.userAgent||"";
    setIos(/iphone|ipad|ipod/i.test(ua) && !standaloneNow);
    setCanInstall(!!window.__zaraInstallPrompt);
    try{
      const cached=JSON.parse(localStorage.getItem("zaraBrandingCache")||"null");
      if(cached?.appIcon) setIcon(cached.appIcon);
    }catch(e){}
    const applyIcon=()=>{try{const cached=JSON.parse(localStorage.getItem("zaraBrandingCache")||"null");if(cached?.appIcon)setIcon(cached.appIcon)}catch(e){}};
    const before=e=>{e.preventDefault();window.__zaraInstallPrompt=e;setPrompt(e);setCanInstall(true)};
    const ready=()=>{if(window.__zaraInstallPrompt){setPrompt(window.__zaraInstallPrompt);setCanInstall(true)}};
    const onInstalled=()=>{\n      try{localStorage.setItem("zaraAppInstalled","1")}catch(e){}\n      window.__zaraInstallPrompt=null;setPrompt(null);setInstalled(true);setStandalone(true);setSplash(true);setTimeout(()=>setSplash(false),3000);\n    };
    window.addEventListener("beforeinstallprompt",before);
    window.addEventListener("zara-install-ready",ready);
    window.addEventListener("zara-branding-updated",applyIcon);
    window.addEventListener("appinstalled",onInstalled);
    ready();applyIcon();\n    try{if(localStorage.getItem("zaraAppInstalled")==="1") setInstalled(true)}catch(e){}
    return()=>{
      window.removeEventListener("beforeinstallprompt",before);
      window.removeEventListener("zara-install-ready",ready);
      window.removeEventListener("zara-branding-updated",applyIcon);
      window.removeEventListener("appinstalled",onInstalled);
    };
  },[admin]);

  useEffect(()=>{
    if(admin || !standalone) return;
    setSplash(true);
    const timer=setTimeout(()=>setSplash(false),3000);
    return()=>clearTimeout(timer);
  },[admin,standalone]);

  async function install(){
    const event=prompt||window.__zaraInstallPrompt;
    if(!event){
      if(ios){alert("iPhone/iPad par Safari me neeche Share (□↑) दबाएँ → Add to Home Screen चुनें → Add दबाएँ। फिर Zara Nikah App खोलें।");return;}
      alert("Browser ke ⋮ menu me “Install Zara Nikah Service” ya “Add to Home screen” चुनें. Install ke baad app kholen.");
      return;
    }
    try{
      event.prompt();
      await event.userChoice;
      window.__zaraInstallPrompt=null;setPrompt(null);setCanInstall(false);
      // Do not unlock the website here. The appinstalled event/standalone
      // detection will unlock it only after the installation actually completes.
    }catch(e){}
  }

  if(admin) return <>{children}</>;

  if(checking) return <div className="zaraBootScreen" aria-hidden="true"/>;

  let rememberedInstalled=false;\n  try{rememberedInstalled=localStorage.getItem("zaraAppInstalled")==="1"}catch(e){}\n  if(!standalone && !installed && !rememberedInstalled) return (
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
        <button className="zaraInstallMainBtn" onClick={install}>📲 {canInstall ? "APP INSTALL करें" : ios ? "iPhone में INSTALL कैसे करें" : "APP INSTALL करें"} <span>→</span></button>
        <p className="zaraInstallNote">🔒 बिना install किए public website pages और profiles नहीं खुलेंगे।</p>
      </div>
    </div>
  );

  return <>{splash&&<div className="zaraPwaSplash"><img src="/api/app-splash" alt="" className="zaraPwaSplashBg"/><div className="zaraPwaSplashShade"/></div>}{children}</>;
}