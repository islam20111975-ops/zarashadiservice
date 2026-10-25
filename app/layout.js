import "./globals.css";
import AppAccessGate from "./components/AppAccessGate";

export const metadata={
 metadataBase:new URL("https://zarashadiservice.vercel.app"),
 title:{default:"Zara Nikah Service | Nikah & Rishta Profiles",template:"%s | Zara Nikah Service"},
 description:"Zara Nikah Service par nikah aur rishta profiles ko privacy aur safety ko dhyan mein rakh kar explore karein. Profile access, payment help aur safe rishta search guidance.",
 applicationName:"Zara Nikah Service",
 category:"Lifestyle",
 keywords:["Zara Nikah Service","Nikah Service","Muslim Marriage Profiles","Rishta Service","Nikah Guide","Safe Rishta Search"],
 openGraph:{title:"Zara Nikah Service",description:"Nikah profiles, safe rishta search guidance aur service support.",type:"website",url:"https://zarashadiservice.vercel.app/",siteName:"Zara Nikah Service",locale:"hi_IN"},
 twitter:{card:"summary",title:"Zara Nikah Service",description:"Nikah profiles, safe rishta search guidance aur service support."},
 icons:{icon:"/api/pwa-icon?size=192",apple:"/api/pwa-icon?size=192"},
 manifest:"/manifest.webmanifest?v=20260929-3"
};

export default function RootLayout({children}){return <html lang="hi"><body><AppAccessGate>{children}</AppAccessGate><script dangerouslySetInnerHTML={{__html:`window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.__zaraInstallPrompt=e;window.dispatchEvent(new Event("zara-install-ready"))});if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").then(r=>r.update()).catch(()=>{}))}`}} /></body></html>}
