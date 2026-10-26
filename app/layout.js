import "./globals.css";
import AppAccessGate from "./components/AppAccessGate";
import Script from "next/script";

export const metadata={
 metadataBase:new URL("https://zarashadiservice.vercel.app"),
 alternates:{canonical:"/"},
 title:{default:"Zara Nikah Service | Nikah & Rishta Profiles",template:"%s | Zara Nikah Service"},
 description:"Zara Nikah Service par nikah aur rishta profiles ko privacy aur safety ko dhyan mein rakh kar explore karein. Profile access, payment help aur safe rishta search guidance.",
 applicationName:"Zara Nikah Service",
 verification:{google:"ghQJPyiHgmoIebzPQClppUAx51-TllRuw_ZJ1C5L3pM"},
 category:"Lifestyle",
 keywords:["Zara Nikah Service","Nikah Service","Muslim Marriage Profiles","Rishta Service","Nikah Guide","Safe Rishta Search"],
 openGraph:{title:"Zara Nikah Service",description:"Nikah profiles, safe rishta search guidance aur service support.",type:"website",url:"https://zarashadiservice.vercel.app/",siteName:"Zara Nikah Service",locale:"hi_IN"},
 twitter:{card:"summary",title:"Zara Nikah Service",description:"Nikah profiles, safe rishta search guidance aur service support."},
 icons:{icon:"/api/pwa-icon?size=192",apple:"/api/pwa-icon?size=192"},
 manifest:"/manifest.webmanifest?v=20260929-3"
};

export default function RootLayout({children}){return <html lang="hi"><head><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5611171707552414" crossOrigin="anonymous"></script></head><body><AppAccessGate>{children}</AppAccessGate><Script src="https://www.googletagmanager.com/gtag/js?id=G-N5V1PGKLWH" strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag("js", new Date()); gtag("config", "G-N5V1PGKLWH");`}</Script><script dangerouslySetInnerHTML={{__html:`window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.__zaraInstallPrompt=e;window.dispatchEvent(new Event("zara-install-ready"))});if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").then(r=>r.update()).catch(()=>{}))}`}} /></body></html>}