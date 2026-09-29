import "./globals.css";
import AppAccessGate from "./components/AppAccessGate";

export const metadata={
 title:{default:"Zara Nikah Service",template:"%s | Zara Nikah Service"},
 description:"Zara Nikah Service — Aapka Rishta, Hamari Zimmedari. Verified nikah profiles ke liye simple aur privacy-focused service.",
 applicationName:"Zara Nikah Service",
 keywords:["Zara Nikah Service","Nikah Service","Marriage Profiles","Rishta Service"],
 openGraph:{title:"Zara Nikah Service",description:"Aapka Rishta, Hamari Zimmedari",type:"website",url:"https://zarashadiservice.vercel.app/"},
 twitter:{card:"summary",title:"Zara Nikah Service",description:"Aapka Rishta, Hamari Zimmedari"},
 icons:{icon:"/api/pwa-icon?size=192",apple:"/api/pwa-icon?size=192"},
 manifest:"/manifest.webmanifest?v=20260929-3"
};

export default function RootLayout({children}){return <html lang="hi"><body><AppAccessGate>{children}</AppAccessGate><script dangerouslySetInnerHTML={{__html:`window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.__zaraInstallPrompt=e;window.dispatchEvent(new Event("zara-install-ready"))});if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").then(r=>r.update()).catch(()=>{}))}`}} /></body></html>}
