"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from "firebase/auth";
import {collection,doc,getDoc,getDocs,onSnapshot,query,where} from "firebase/firestore";
import {auth,db} from "../lib/firebase";

function getProfileImage(p){
  const photos=Array.isArray(p?.photos)?p.photos:Array.isArray(p?.images)?p.images:[];
  return photos.find(x=>typeof x==="string"&&x.trim())||p?.photo||p?.image||p?.imageUrl||p?.photoURL||p?.profilePhoto||p?.picture||"";
}
function getProfileGender(p){
  return String(p?.gender||p?.sex||p?.profileGender||p?.category||p?.type||"").trim().toLowerCase();
}

function sanitizeAdminPostHtml(input){
  let value=String(input||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"");
  // Older posts were saved as Markdown/plain text. Convert common formatting safely.
  if(!/<[a-z][^>]*>/i.test(value)){
    value=value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    value=value.replace(/\\?\*\*(.+?)\\?\*\*/g,"<strong>$1</strong>");
    value=value.replace(/\\?\*(.+?)\\?\*/g,"<em>$1</em>");
    value=value.replace(/^### (.+)$/gm,"<strong>$1</strong>").replace(/^## (.+)$/gm,"<strong>$1</strong>").replace(/^# (.+)$/gm,"<strong>$1</strong>");
    value=value.replace(/^[-•] (.+)$/gm,"• $1").replace(/\n/g,"<br>");
  }
  value=value.replace(/<font\b([^>]*)>/gi,function(tag,attrs){
    const color=(attrs.match(/color=["']?(#[0-9a-fA-F]{3,8})["']?/i)||[])[1];
    const size=(attrs.match(/size=["']?([1-7])["']?/i)||[])[1];
    const px={1:10,2:13,3:16,4:19,5:24,6:32,7:48};
    const style=(color?"color:"+color+";":"")+(size?"font-size:"+px[size]+"px;":"");
    return "<span"+(style?' style="'+style+'"':"")+">";
  }).replace(/<\/font>/gi,"</span>");
  value=value.replace(/<(?!\/?(?:b|strong|i|em|u|br|p|div|span)\b)[^>]*>/gi,"");
  value=value.replace(/<(b|strong|i|em|u|br|p|div|span)\b([^>]*)>/gi,function(tag,name,attrs){
    const safeName=name.toLowerCase();
    if(safeName==="br")return "<br>";
    if(safeName!=="span")return "<"+safeName+">";
    const color=(attrs.match(/color\s*:\s*(#[0-9a-fA-F]{3,8})/i)||[])[1];
    const size=(attrs.match(/font-size\s*:\s*(\d{1,2}px)/i)||[])[1];
    const safeStyle=(color?"color:"+color+";":"")+(size&&parseInt(size,10)>=8&&parseInt(size,10)<=64?"font-size:"+size+";":"");
    return "<span"+(safeStyle?' style="'+safeStyle+'"':"")+">";
  });
  return value;
}

export default function Home(){
  const [r,setR]=useState(null);
  const [headerMenuOpen,setHeaderMenuOpen]=useState(false);
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(false);
  const [homePosts,setHomePosts]=useState([]);
  const [wallpaper,setWallpaper]=useState("");
  const [branding,setBranding]=useState(()=>{try{const cached=JSON.parse(window.localStorage.getItem("zaraBrandingCache")||"null");return cached&&typeof cached==="object"?{logo:cached.logo||"",appIcon:cached.appIcon||"/api/pwa-icon?size=512"}:{logo:"",appIcon:"/api/pwa-icon?size=512"}}catch(e){return {logo:"",appIcon:"/api/pwa-icon?size=512"}}});
  const [social,setSocial]=useState({whatsapp:"",facebook:"",instagram:""});
  const [user,setUser]=useState(null),[loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState("");
  const [profileAccess,setProfileAccess]=useState("checking");
  const [unreadNotifications,setUnreadNotifications]=useState(0);
  const router=useRouter();

  useEffect(()=>{
    let userDocUnsubscribe=null;
    const authUnsubscribe=onAuthStateChanged(auth,u=>{
      setUser(u);
      if(userDocUnsubscribe){userDocUnsubscribe();userDocUnsubscribe=null;}
      if(!u||u.isAnonymous){setProfileAccess("login");return;}
      if(["ngogrant454@gmail.com","islam20111975@gmail.com"].includes(u.email?.toLowerCase())){setProfileAccess("approved");return;}
      setProfileAccess("checking");
      userDocUnsubscribe=onSnapshot(doc(db,"users",u.uid),snap=>{
        if(!snap.exists()){setProfileAccess("pending");return;}
        const status=snap.data().status;
        setProfileAccess(status==="approved"?"approved":status==="rejected"?"rejected":"pending");
      },()=>setProfileAccess("pending"));
    });
    return()=>{authUnsubscribe();if(userDocUnsubscribe)userDocUnsubscribe();};
  },[]);
  useEffect(()=>{
    if(!user||user.isAnonymous){setUnreadNotifications(0);return;}
    return onSnapshot(query(collection(db,"notifications"),where("uid","==",user.uid)),snap=>setUnreadNotifications(snap.size),()=>setUnreadNotifications(0));
  },[user]);
  useEffect(()=>onSnapshot(collection(db,"homePosts"),snap=>{const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.status!=="deleted");rows.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));setHomePosts(rows)},()=>setHomePosts([])),[]);
  useEffect(()=>{getDoc(doc(db,"settings","appearance")).then(s=>{if(s.exists())setWallpaper(s.data().wallpaper||"")}).catch(()=>{});(async()=>{try{const cached=JSON.parse(window.localStorage.getItem("zaraBrandingCache")||"null");if(cached?.logo||cached?.appIcon){const b={logo:cached.logo||"",appIcon:cached.appIcon||"/api/pwa-icon?size=512"};setBranding(b);if(b.appIcon||b.logo){let link=document.querySelector("link[rel~=\"icon\"]");if(!link){link=document.createElement("link");link.rel="icon";document.head.appendChild(link)}link.href=b.appIcon||b.logo}}}catch(e){} getDoc(doc(db,"settings","branding")).then(s=>{if(s.exists()){const b={logo:s.data().logo||"",appIcon:s.data().appIcon||"/api/pwa-icon?size=512"};setBranding(b);try{window.localStorage.setItem("zaraBrandingCache",JSON.stringify(b))}catch(e){} if(b.appIcon||b.logo){let link=document.querySelector("link[rel~=\"icon\"]");if(!link){link=document.createElement("link");link.rel="icon";document.head.appendChild(link)}link.href=b.appIcon||b.logo}}}).catch(()=>{})})();getDoc(doc(db,"settings","social")).then(s=>{if(s.exists())setSocial({whatsapp:s.data().whatsapp||"",facebook:s.data().facebook||"",instagram:s.data().instagram||""})}).catch(()=>{})},[]);
  // Gender cards are public; the query returns only documents from the safe /profiles collection.
  // Detailed biodata and mobile numbers remain in separately protected collections.
  useEffect(()=>{
    if(!r){setData([]);setLoading(false);return}
    setLoading(true);
    return onSnapshot(collection(db,"profiles"),s=>{
      const wanted=String(r).trim().toLowerCase();
      const rows=s.docs.map(d=>({id:d.id,...d.data()})).filter(p=>{
        if(p.status==="deleted")return false;
        if(p.expiresAt && new Date(p.expiresAt?.toDate?.()||p.expiresAt).getTime()<=Date.now())return false;
        const g=getProfileGender(p);
        if(wanted==="male")return ["male","m","man","boy","groom","male rishte","male profile","पुरुष","लड़का","लड़का","ladka","वर"].includes(g);
        return ["female","f","woman","girl","bride","female rishte","female profile","महिला","लड़की","लड़की","ladki","वधू"].includes(g);
      });
      setData(rows.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true})));setLoading(false);
    },e=>{setLoading(false);setLoginError(e?.message||"Profiles load nahi ho sake.")});
  },[r]);

  const shown=data;
  const scrollToProfiles=()=>{
    window.setTimeout(()=>{
      const target=document.getElementById("profile-results");
      if(target){
        const top=target.getBoundingClientRect().top+window.scrollY-8;
        window.scrollTo({top:Math.max(0,top),behavior:"smooth"});
      }
    },300);
  };
  useEffect(()=>{
    if(!r)return;
    const timer=window.setTimeout(()=>{
      const target=document.getElementById("profile-results");
      if(target){window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+window.scrollY-8),behavior:"smooth"});}
    },300);
    return()=>window.clearTimeout(timer);
  },[r]);
  const openPrivateChat=async()=>{setLoginError("");if(auth.currentUser&&!auth.currentUser.isAnonymous){router.push("/chat");return;}setLoginBusy(true);try{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:"select_account"});await signInWithPopup(auth,provider);router.push("/chat");}catch(e){setLoginError(e?.message||"Google Login nahi ho saka.");}finally{setLoginBusy(false);}};
  return (
    <>
      <main className={wallpaper?"hasWallpaper":""} style={wallpaper?{backgroundImage:"url("+wallpaper+")","--site-wallpaper":"url("+wallpaper+")"}:undefined}>
        <div className="homeTopControls">
<button className="cornerIconButton cornerMenuButton" type="button" aria-label="Menu" aria-expanded={headerMenuOpen} onClick={()=>setHeaderMenuOpen(v=>!v)}>{headerMenuOpen?"✕":"☰"}</button>
<button className="cornerIconButton cornerNotificationButton" type="button" aria-label="Notifications" onClick={()=>router.push("/notifications")}>🔔{unreadNotifications>0&&<span className="notificationCountBadge">{unreadNotifications>99?"99+":unreadNotifications}</span>}</button>
{headerMenuOpen&&<nav className="headerMenuPanel cornerMenuPanel" aria-label="Website menu">
<div className="headerMenuGroup"><span className="headerMenuLabel">रिश्ते देखें</span>
<button type="button" onClick={()=>{setR("male");setHeaderMenuOpen(false);scrollToProfiles();}}>👨 <span>Male Rishte</span></button>
<button type="button" onClick={()=>{setR("female");setHeaderMenuOpen(false);scrollToProfiles();}}>👩 <span>Female Rishte</span></button></div>
<div className="headerMenuGroup"><span className="headerMenuLabel">सेवाएं</span>
<button type="button" onClick={()=>{setHeaderMenuOpen(false);router.push("/add-profile");}}>➕ <span>अपना रिश्ता जोड़ें • ₹299 / 3 महीने</span></button>
<button type="button" onClick={()=>{setHeaderMenuOpen(false);router.push("/instructions");}}>📘 <span>पूरी जानकारी / इस्तेमाल कैसे करें</span></button>
<button type="button" disabled={loginBusy} onClick={()=>{setHeaderMenuOpen(false);openPrivateChat();}}>💬 <span>Private Chat</span></button>
<button type="button" onClick={()=>{setHeaderMenuOpen(false);router.push("/notifications");}}>🔔 <span>मेरी सूचनाएँ ({unreadNotifications})</span></button>
<button type="button" onClick={()=>{setHeaderMenuOpen(false);router.push("/islamic-calendar");}}>🌙 <span>Islamic Calendar</span></button>
<button type="button" disabled={loginBusy} onClick={async()=>{setLoginError("");if(["ngogrant454@gmail.com","islam20111975@gmail.com"].includes(user?.email?.toLowerCase())){router.push("/admin");return}setLoginBusy(true);try{if(user||auth.currentUser?.isAnonymous)await signOut(auth);const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});const result=await signInWithPopup(auth,p);router.push(["ngogrant454@gmail.com","islam20111975@gmail.com"].includes(result.user.email?.toLowerCase())?"/admin":"/")}catch(e){setLoginError(e?.message||"Google Login nahi ho saka.")}finally{setLoginBusy(false)}}}>🔐 <span>{loginBusy?"Login...":user?"Profile / Account":"Login"}</span></button>
</div>
</nav>}
</div>
<div className="homeLogoTop"><button className="homeLogoOnly" onClick={()=>router.push("/")} aria-label="Home"><span className="logoMark logoMarkBrand">{branding.logo?<img src={branding.logo} alt="Zara Nikah logo"/>:<><span className="logoZ">Z</span><span className="logoN">N</span></>}</span></button></div>{loginError&&<div className="errorBox homeLoginError">{loginError}</div>}
        <section className="heroHome" id="profiles">
          <div className="heroGlow one"></div><div className="heroGlow two"></div>
          <div className="heroContent" aria-hidden="true"></div>
          {homePosts.length>0&&<section className="homePosts" aria-label="Admin announcements"><div className="homePostsList">{homePosts.map(p=><article className="homePostCard" key={p.id} style={{background:p.backgroundColor||undefined,color:p.textColor||undefined}}><div className="homePostMeta">📌 Zara Nikah Service {p.createdAt?.toDate?.()?.toLocaleDateString?.("en-IN")||""}</div>{p.image&&<img src={p.image} alt="Zara Nikah Service post" loading="lazy" style={{display:"block",width:"auto",maxWidth:"100%",maxHeight:240,objectFit:"contain",borderRadius:14,margin:"10px auto"}}/>}<div style={{whiteSpace:"pre-wrap",color:p.textColor||"inherit"}} dangerouslySetInnerHTML={{__html:sanitizeAdminPostHtml(p.text||"")}}/></article>)}</div></section>}
        </section>
        {r&&<section className="profiles" id="profile-results" style={{scrollMarginTop:12}}><div className="sectionHead"><div><span className="eyebrow">AVAILABLE PROFILES</span><h2>{r==="male"?"Male":"Female"} Rishte</h2></div><span className="count">{loading?"Loading...":shown.length+" Profiles"}</span></div>
          <div className="grid">{shown.map(p=><article className="profileCard" key={p.id}><div className="photoWrap" onClick={()=>router.push("/profile/"+p.id)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")router.push("/profile/"+p.id)}}><img src={getProfileImage(p)} alt={"Marriage profile "+p.id} onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentElement?.classList.add("photoMissing")}}/><span className="verified">✓ Verified</span></div><div className="cardInfo"><span className="profileId">{p.id}</span></div></article>)}</div>
        </section>}
        <section className="profiles" aria-labelledby="nikah-guide-title" style={{maxWidth:1180,margin:"0 auto",padding:"24px 22px 48px"}}>
          <div className="sectionHead"><div><span className="eyebrow">ZARA NIKAH SERVICE GUIDE</span><h2 id="nikah-guide-title">Nikah ke liye rishta dhoondhne ki rehnumai</h2></div></div>
          <div style={{background:"#fff",border:"1px solid #eadff3",borderRadius:22,padding:"24px",lineHeight:1.8,boxShadow:"0 12px 30px #4b185d0d"}}>
            <p>Zara Nikah Service ek online platform hai jahan baligh users nikah ke liye rishta profiles dekhne aur service ke process ko samajhne ke liye aa sakte hain. Profile ki availability, details aur access website par dikhaye gaye rules ke mutabik hota hai. Har family ko apne faisle se pehle zaroori maloomat khud verify karni chahiye.</p>
            <h3>Rishta profile dekhte waqt kin baaton ka khayal rakhein?</h3>
            <p>Apni aur doosri family ki expectations, marital status, rehne ki jagah, taleem, kaam aur future plans par izzat ke saath baat karein. Kisi bhi faisle se pehle identity aur zaroori documents ko munasib tareeqe se verify karein. Sirf online profile ya photo ko poori tasdeeq na samjhein.</p>
            <h3>Online rishta search mein privacy kaise bachayein?</h3>
            <p>Apna OTP, password, bank PIN ya ID documents public post mein share na karein. Kisi ko paisa bhejne se pehle service fee, payment purpose aur access rules samajh lein. Profile photo ya contact details ko doosron ke saath share karne se pehle permission lein. Agar koi pressure dale ya suspicious payment maange, ruk kar details verify karein.</p>
            <h3>Widow ya widower ke liye dobara nikah</h3>
            <p>Dobara nikah ka faisla har shakhs aur family ki apni situation par depend karta hai. Partner se family responsibilities, bachchon, rehne ke intezam, financial expectations aur future plans par khul kar aur respectful tareeqe se baat karna madadgar ho sakta hai. Har shakhs ko bina dabao ke faisla karne ka haq hai.</p>
            <h3>Zara Nikah Service ka basic process</h3>
            <p>Website par diye gaye login aur profile options se shuru karein. Kisi profile ke private biodata ya mobile number ke liye agar paid access dikhaya jaye, to payment se pehle amount, approval process aur terms padhein. Payment confirmation ya access ke masle mein website ke Contact page ke zariye rabta karein.</p>
            <h3>Aam sawal</h3>
            <p><strong>Kya har profile ki har detail public hoti hai?</strong><br/>Nahi. Kuch details login ya authorised access ke peeche ho sakti hain. Private information ko permission ke baghair share na karein.</p>
            <p><strong>Kya “verified” ka matlab shaadi ki guarantee hai?</strong><br/>Nahi. Website par verification label ko nikah, compatibility ya kisi shakhs ki tamam maloomat ki guarantee na samjhein. Apni independent verification zaroor karein.</p>
            <p><strong>Payment se pehle kya karna chahiye?</strong><br/>Amount, service ka purpose, access ki conditions aur refund/cancellation policy padhein; receipt aur UTR ko apne paas rakhein.</p>
            <p style={{marginBottom:0}}>Useful guides: <a href="/muslim-nikah-biodata-guide">Muslim marriage biodata guide</a>, <a href="/muslim-rishta-service">Muslim rishta service</a>, <a href="/online-rishta-safety-checklist">online rishta safety checklist</a>, <a href="/widow-widower-nikah-guide">widow and widower nikah guide</a>. Mazeed tafseel ke liye <a href="/about">About Us</a>, <a href="/terms">Terms &amp; Conditions</a>, <a href="/privacy">Privacy Policy</a> aur <a href="/refund-policy">Refund &amp; Cancellation Policy</a> padhein.</p>
            <p style={{fontSize:12,color:"#6b6174",marginBottom:0,marginTop:16}}>Yeh general information hai, legal advice ya kisi bhi rishtay ki guarantee nahi.</p>
          </div>
        </section>
        <section className="trustStrip"><div><b>🔒 Privacy</b><small>Aapki details ko respect ke saath handle kiya jata hai</small></div><div><b>✓ Verified</b><small>Registered profiles ko manage kiya jata hai</small></div><div><b>💗 Nikah Focus</b><small>Serious rishta search ke liye simple process</small></div></section>
        <div className="socialLinks" id="contact">{social.whatsapp&&<a className="socialBtn whatsapp" href={social.whatsapp} target="_blank" rel="noreferrer">🟢 WhatsApp</a>}{social.facebook&&<a className="socialBtn facebook" href={social.facebook} target="_blank" rel="noreferrer">🔵 Facebook</a>}{social.instagram&&<a className="socialBtn instagram" href={social.instagram} target="_blank" rel="noreferrer">🟣 Instagram</a>}</div><nav className="footerNav" aria-label="Footer"><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms & Conditions</a><a href="/refund-policy">Refund Policy</a><a href="/instructions">📘 उपयोग कैसे करें?</a><a href="/nikah-guide">Nikah Guide</a></nav><footer>© 2026 Zara Nikah Service <span>•</span> Aapka Rishta, Hamari Zimmedari</footer>
      </main>
    </>
  );
}
