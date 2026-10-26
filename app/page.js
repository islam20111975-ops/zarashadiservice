"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from "firebase/auth";
import {collection,doc,getDoc,getDocs,onSnapshot,query,where} from "firebase/firestore";
import {auth,db} from "../lib/firebase";

export default function Home(){
  const [r,setR]=useState(null);
  const [data,setData]=useState([]);
  const [allProfiles,setAllProfiles]=useState([]),[sliderIds,setSliderIds]=useState([]);
  const [slideIndex,setSlideIndex]=useState(0);
  const [headerSlideIndex,setHeaderSlideIndex]=useState(0);
  const headerWeddingImages=[
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=85"
  ];
  const [loading,setLoading]=useState(false);
  const [homePosts,setHomePosts]=useState([]);
  const [wallpaper,setWallpaper]=useState("");
  const [branding,setBranding]=useState(()=>{try{const cached=JSON.parse(window.localStorage.getItem("zaraBrandingCache")||"null");return cached&&typeof cached==="object"?{logo:cached.logo||"",appIcon:cached.appIcon||"/api/pwa-icon?size=512"}:{logo:"",appIcon:"/api/pwa-icon?size=512"}}catch(e){return {logo:"",appIcon:"/api/pwa-icon?size=512"}}});
  const [social,setSocial]=useState({whatsapp:"",facebook:"",instagram:""});
  const [user,setUser]=useState(null),[loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState("");
  const [profileAccess,setProfileAccess]=useState("checking");
  const router=useRouter();

  useEffect(()=>{
    let userDocUnsubscribe=null;
    const authUnsubscribe=onAuthStateChanged(auth,u=>{
      setUser(u);
      if(userDocUnsubscribe){userDocUnsubscribe();userDocUnsubscribe=null;}
      if(!u){setProfileAccess("login");return;}
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
  useEffect(()=>onSnapshot(collection(db,"homePosts"),snap=>{const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.status!=="deleted");rows.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));setHomePosts(rows)},()=>setHomePosts([])),[]);
  useEffect(()=>{const timer=setInterval(()=>setHeaderSlideIndex(i=>(i+1)%3),3500);return()=>clearInterval(timer)},[]);
  useEffect(()=>{getDoc(doc(db,"settings","appearance")).then(s=>{if(s.exists())setWallpaper(s.data().wallpaper||"")}).catch(()=>{});(async()=>{try{const cached=JSON.parse(window.localStorage.getItem("zaraBrandingCache")||"null");if(cached?.logo||cached?.appIcon){const b={logo:cached.logo||"",appIcon:cached.appIcon||"/api/pwa-icon?size=512"};setBranding(b);if(b.appIcon||b.logo){let link=document.querySelector("link[rel~=\"icon\"]");if(!link){link=document.createElement("link");link.rel="icon";document.head.appendChild(link)}link.href=b.appIcon||b.logo}}}catch(e){} getDoc(doc(db,"settings","branding")).then(s=>{if(s.exists()){const b={logo:s.data().logo||"",appIcon:s.data().appIcon||"/api/pwa-icon?size=512"};setBranding(b);try{window.localStorage.setItem("zaraBrandingCache",JSON.stringify(b))}catch(e){} if(b.appIcon||b.logo){let link=document.querySelector("link[rel~=\"icon\"]");if(!link){link=document.createElement("link");link.rel="icon";document.head.appendChild(link)}link.href=b.appIcon||b.logo}}}).catch(()=>{})})();getDoc(doc(db,"settings","social")).then(s=>{if(s.exists())setSocial({whatsapp:s.data().whatsapp||"",facebook:s.data().facebook||"",instagram:s.data().instagram||""})}).catch(()=>{})},[]);
  useEffect(()=>{
    if(profileAccess!=="approved"){setSliderIds([]);setAllProfiles([]);return;}
    let cancelled=false;
    async function loadSlider(){
      try{
        const snap=await getDocs(collection(db,"profiles"));
        const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.status!=="deleted" && ((Array.isArray(p.photos)&&p.photos[0])||p.photo)).sort((a,b)=>a.id.localeCompare(b.id));
        if(cancelled||!rows.length)return;
        const ids=rows.map(p=>p.id);
        setSliderIds(ids);
        setAllProfiles(rows.map(p=>({id:p.id,image:(Array.isArray(p.photos)&&p.photos[0])||p.photo})));
      }catch(e){if(!cancelled){setSliderIds([]);setAllProfiles([]);}}
    }
    loadSlider();
    return()=>{cancelled=true};
  },[profileAccess]);
  useEffect(()=>{
    if(!sliderIds.length)return;
    const indexes=[slideIndex,(slideIndex+1)%sliderIds.length];
    indexes.forEach(idx=>{
      const id=sliderIds[idx];
      if(!id||allProfiles.some(p=>p.id===id))return;
      getDoc(doc(db,"homeSliderImages",id)).then(s=>{
        if(s.exists()&&s.data().image)setAllProfiles(prev=>prev.some(p=>p.id===id)?prev:[...prev,{id,image:s.data().image}]);
      }).catch(()=>{});
    });
  },[sliderIds,slideIndex,allProfiles]);
  useEffect(()=>{
    if(sliderIds.length<2)return;
    const timer=setInterval(()=>setSlideIndex(i=>(i+1)%sliderIds.length),1000);
    return()=>clearInterval(timer);
  },[sliderIds.length]);
  useEffect(()=>{
    if(!r||profileAccess!=="approved"){setData([]);setLoading(false);return}
    setLoading(true);
    return onSnapshot(collection(db,"profiles"),s=>{
      const wanted=String(r).trim().toLowerCase();
      const rows=s.docs.map(d=>({id:d.id,...d.data()})).filter(p=>{
        if(p.status==="deleted")return false;
        const g=String(p.gender||p.sex||"").trim().toLowerCase();
        if(wanted==="male")return ["male","m","man","boy","पुरुष","लड़का","ladka"].includes(g);
        return ["female","f","woman","girl","महिला","लड़की","ladki"].includes(g);
      });
      setData(rows.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true})));setLoading(false);
    },e=>{setLoading(false);setLoginError(e?.message||"Profiles load nahi ho sake.")});
  },[r,profileAccess]);

  const shown=data;
  const currentProfile=sliderIds.length?allProfiles.find(p=>p.id===sliderIds[slideIndex]):null;
  return (
    <>
      <main className={wallpaper?"hasWallpaper":""} style={wallpaper?{backgroundImage:"url("+wallpaper+")","--site-wallpaper":"url("+wallpaper+")"}:undefined}>
        <header className="siteHeader"><div className="headerInner">
          <button className="logo headerWeddingBrand" onClick={()=>router.push("/")} aria-label="Zara Nikah Service home"><span className="logoMark logoMarkBrand" aria-hidden="true">{branding.logo?<img src={branding.logo} alt="Zara Nikah logo" />:<><span className="logoZ">Z</span><span className="logoN">N</span></>}</span><span className="headerWeddingSlider" aria-label="Wedding image slider">{headerWeddingImages.map((src,i)=><span key={src} className={i===headerSlideIndex?"headerWeddingFrame isActive":"headerWeddingFrame"}><img src={src} alt="" className="headerWeddingBackdrop" aria-hidden="true" loading={i===0?"eager":"lazy"}/><img src={src} alt="" aria-hidden="true" className="headerWeddingImage" loading={i===0?"eager":"lazy"}/></span>)}<span className="headerWeddingShade"></span><span className="headerWeddingTitle"><strong>ZARA NIKAH</strong><small>SERVICE</small></span><span className="headerWeddingDots">{headerWeddingImages.map((src,i)=><i key={src} className={i===headerSlideIndex?"active":""}/>)}</span></span></button>
          <nav className="mainNav" aria-label="Main navigation"><a href="/islamic-calendar">🌙 Islamic Calendar</a></nav>
          <div className="headerActions"><span className="secureChip">✓ Verified Service</span><button className="headerLogin" disabled={loginBusy} onClick={async()=>{setLoginError("");if(["ngogrant454@gmail.com","islam20111975@gmail.com"].includes(user?.email?.toLowerCase())){router.push("/admin");return}setLoginBusy(true);try{if(user)await signOut(auth);const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});const result=await signInWithPopup(auth,p);router.push(["ngogrant454@gmail.com","islam20111975@gmail.com"].includes(result.user.email?.toLowerCase())?"/admin":"/account")}catch(e){setLoginError(e?.message||"Google Login nahi ho saka.")}finally{setLoginBusy(false)}}}>{loginBusy?"Login...":user?(["ngogrant454@gmail.com","islam20111975@gmail.com"].includes(user.email?.toLowerCase())?"🔐 Admin Dashboard":"👤 My Profile / Switch Account"):"🔐 Login"}</button></div>
        </div></header>{loginError&&<div className="errorBox homeLoginError">{loginError}</div>}
        <section className="heroHome" id="profiles">
          <div className="heroGlow one"></div><div className="heroGlow two"></div>
          <div className="heroContent">
            <div className="homeAutoSlider" aria-label="Nikah profiles automatic slideshow">
              {sliderIds.length && currentProfile ? <button className="homeSlide" onClick={()=>router.push("/profile/"+currentProfile.id)} aria-label={"Profile "+currentProfile.id+" dekhein"}>
                <img key={currentProfile.id} src={currentProfile.image||""} alt={"Marriage profile "+currentProfile.id} loading="eager" decoding="async" fetchPriority="high"/>
                <span className="slideShade"></span><span className="slideId">💍 Profile {currentProfile.id}</span><span className="slideVerified">✓ Verified</span>
              </button> : <div className="homeSlideEmpty">💍<span>{sliderIds.length?"Image loading...":"Nikah Profiles"}</span></div>}
              {sliderIds.length>1&&<div className="slideDots">{sliderIds.map((p,i)=><span key={p} className={i===slideIndex?"active":""}></span>)}</div>}
            </div>
          </div>
          <div className="gender genderPremium">
            <button className={r==="male"?"genderCard premiumCard maleCard active":"genderCard premiumCard maleCard"} onClick={()=>setR("male")}><div className="cardIcon">👨</div><div><b>Male Rishte</b><small>Rishta dekhne ke liye button par click karein</small></div><span className="arrow">→</span></button>
            <button className={r==="female"?"genderCard premiumCard femaleCard active":"genderCard premiumCard femaleCard"} onClick={()=>setR("female")}><div className="cardIcon">👩</div><div><b>Female Rishte</b><small>Rishta dekhne ke liye button par click karein</small></div><span className="arrow">→</span></button>
          </div>
          {homePosts.length>0&&<section className="homePosts" aria-label="Admin announcements"><div className="homePostsHeading"><span>📢</span><div><h2>Admin Posts</h2><p>Zara Nikah Service ki latest updates</p></div></div><div className="homePostsList">{homePosts.map(p=><article className="homePostCard" key={p.id}><div className="homePostMeta">📌 Zara Nikah Service {p.createdAt?.toDate?.()?.toLocaleDateString?.("en-IN")||""}</div><p>{p.text}</p></article>)}</div></section>}
        </section>
        {r&&profileAccess!=="approved"&&<section className="profiles"><div className="adminList" style={{textAlign:"center"}}><h2>🔐 Admin Approval Zaroori Hai</h2><p>{profileAccess==="login"?"Rishte dekhne ke liye pehle Google se login karein.":"Aapka Google login ho gaya hai. Rishte dekhne ke liye Zara Nikah Service Admin ki approval ka intezar karein."}</p><button className="primaryAction" onClick={()=>router.push("/account")}>{profileAccess==="login"?"Google Login / My Account":"My Account / Profile"}</button></div></section>}
        {r&&profileAccess==="approved"&&<section className="profiles"><div className="sectionHead"><div><span className="eyebrow">AVAILABLE PROFILES</span><h2>{r==="male"?"Male":"Female"} Rishte</h2></div><span className="count">{loading?"Loading...":shown.length+" Profiles"}</span></div>
          <div className="grid">{shown.map(p=><article className="profileCard" key={p.id}><div className="photoWrap" onClick={()=>router.push("/profile/"+p.id)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")router.push("/profile/"+p.id)}}><img src={(Array.isArray(p.photos)&&p.photos[0])||p.photo||""} alt={"Marriage profile "+p.id} onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentElement?.classList.add("photoMissing")}}/><span className="verified">✓ Verified</span></div><div className="cardInfo"><span className="profileId">{p.id}</span></div></article>)}</div>
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
            <p style={{marginBottom:0}}>Mazeed tafseel ke liye <a href="/about">About Us</a>, <a href="/terms">Terms &amp; Conditions</a>, <a href="/privacy">Privacy Policy</a> aur <a href="/refund-policy">Refund &amp; Cancellation Policy</a> padhein.</p>
            <p style={{fontSize:12,color:"#6b6174",marginBottom:0,marginTop:16}}>Yeh general information hai, legal advice ya kisi bhi rishtay ki guarantee nahi.</p>
          </div>
        </section>
        <section className="trustStrip"><div><b>🔒 Privacy</b><small>Aapki details ko respect ke saath handle kiya jata hai</small></div><div><b>✓ Verified</b><small>Registered profiles ko manage kiya jata hai</small></div><div><b>💗 Nikah Focus</b><small>Serious rishta search ke liye simple process</small></div></section>
        <div className="socialLinks" id="contact">{social.whatsapp&&<a className="socialBtn whatsapp" href={social.whatsapp} target="_blank" rel="noreferrer">🟢 WhatsApp</a>}{social.facebook&&<a className="socialBtn facebook" href={social.facebook} target="_blank" rel="noreferrer">🔵 Facebook</a>}{social.instagram&&<a className="socialBtn instagram" href={social.instagram} target="_blank" rel="noreferrer">🟣 Instagram</a>}</div><nav className="footerNav" aria-label="Footer"><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms & Conditions</a><a href="/refund-policy">Refund Policy</a><a href="/nikah-guide">Nikah Guide</a></nav><footer>© 2026 Zara Nikah Service <span>•</span> Aapka Rishta, Hamari Zimmedari</footer>
      </main>
    </>
  );
}
