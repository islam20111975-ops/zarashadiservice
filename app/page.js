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
  const [wallpaper,setWallpaper]=useState("");
  const [branding,setBranding]=useState(()=>{try{const cached=JSON.parse(window.localStorage.getItem("zaraBrandingCache")||"null");return cached&&typeof cached==="object"?{logo:cached.logo||"",appIcon:cached.appIcon||"/api/pwa-icon?size=512"}:{logo:"",appIcon:"/api/pwa-icon?size=512"}}catch(e){return {logo:"",appIcon:"/api/pwa-icon?size=512"}}});
  const [social,setSocial]=useState({whatsapp:"",facebook:"",instagram:""});
  const [user,setUser]=useState(null),[loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState("");
  const router=useRouter();

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{const timer=setInterval(()=>setHeaderSlideIndex(i=>(i+1)%3),3500);return()=>clearInterval(timer)},[]);
  useEffect(()=>{getDoc(doc(db,"settings","appearance")).then(s=>{if(s.exists())setWallpaper(s.data().wallpaper||"")}).catch(()=>{});(async()=>{try{const cached=JSON.parse(window.localStorage.getItem("zaraBrandingCache")||"null");if(cached?.logo||cached?.appIcon){const b={logo:cached.logo||"",appIcon:cached.appIcon||"/api/pwa-icon?size=512"};setBranding(b);if(b.appIcon||b.logo){let link=document.querySelector("link[rel~=\"icon\"]");if(!link){link=document.createElement("link");link.rel="icon";document.head.appendChild(link)}link.href=b.appIcon||b.logo}}}catch(e){} getDoc(doc(db,"settings","branding")).then(s=>{if(s.exists()){const b={logo:s.data().logo||"",appIcon:s.data().appIcon||"/api/pwa-icon?size=512"};setBranding(b);try{window.localStorage.setItem("zaraBrandingCache",JSON.stringify(b))}catch(e){} if(b.appIcon||b.logo){let link=document.querySelector("link[rel~=\"icon\"]");if(!link){link=document.createElement("link");link.rel="icon";document.head.appendChild(link)}link.href=b.appIcon||b.logo}}}).catch(()=>{})})();getDoc(doc(db,"settings","social")).then(s=>{if(s.exists())setSocial({whatsapp:s.data().whatsapp||"",facebook:s.data().facebook||"",instagram:s.data().instagram||""})}).catch(()=>{})},[]);
  useEffect(()=>{
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
  },[]);
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
    if(!r){setData([]);return}
    setLoading(true);
    const q=query(collection(db,"profiles"),where("gender","==",r));
    return onSnapshot(q,s=>{setData(s.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.status!=="deleted"));setLoading(false)},e=>{setLoading(false);setLoginError(e?.message||"Profiles load nahi ho sake.")});
  },[r]);

  const shown=data;
  const currentProfile=sliderIds.length?allProfiles.find(p=>p.id===sliderIds[slideIndex]):null;
  return (
    <>
      <main className={wallpaper?"hasWallpaper":""} style={wallpaper?{backgroundImage:"url("+wallpaper+")","--site-wallpaper":"url("+wallpaper+")"}:undefined}>
        <header className="siteHeader"><div className="headerInner">
          <button className="logo headerWeddingBrand" onClick={()=>router.push("/")} aria-label="Zara Nikah Service home"><span className="logoMark logoMarkBrand" aria-hidden="true">{branding.logo?<img src={branding.logo} alt="Zara Nikah logo" />:<><span className="logoZ">Z</span><span className="logoN">N</span></>}</span><span className="headerWeddingSlider" aria-label="Wedding image slider">{headerWeddingImages.map((src,i)=><span key={src} className={i===headerSlideIndex?"headerWeddingFrame isActive":"headerWeddingFrame"}><img src={src} alt={"Nikah wedding photo "+(i+1)} className="headerWeddingBackdrop" aria-hidden="true" loading={i===0?"eager":"lazy"}/><img src={src} alt={"Nikah wedding photo "+(i+1)} className="headerWeddingImage" loading={i===0?"eager":"lazy"}/></span>)}<span className="headerWeddingShade"></span><span className="headerWeddingTitle"><strong>ZARA NIKAH</strong><small>SERVICE</small></span><span className="headerWeddingDots">{headerWeddingImages.map((src,i)=><i key={src} className={i===headerSlideIndex?"active":""}/>)}</span></span></button>
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
        </section>
        {r&&<section className="profiles"><div className="sectionHead"><div><span className="eyebrow">AVAILABLE PROFILES</span><h2>{r==="male"?"Male":"Female"} Rishte</h2></div><span className="count">{loading?"Loading...":shown.length+" Profiles"}</span></div>
          <div className="grid">{shown.map(p=><article className="profileCard" key={p.id}><div className="photoWrap" onClick={()=>router.push("/profile/"+p.id)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")router.push("/profile/"+p.id)}}><img src={(Array.isArray(p.photos)&&p.photos[0])||p.photo||""} alt={"Marriage profile "+p.id} onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentElement?.classList.add("photoMissing")}}/><span className="verified">✓ Verified</span></div><div className="cardInfo"><span className="profileId">{p.id}</span></div></article>)}</div>
        </section>}
        <section className="trustStrip"><div><b>🔒 Privacy</b><small>Aapki details ko respect ke saath handle kiya jata hai</small></div><div><b>✓ Verified</b><small>Registered profiles ko manage kiya jata hai</small></div><div><b>💗 Nikah Focus</b><small>Serious rishta search ke liye simple process</small></div></section>
        <div className="socialLinks">{social.whatsapp&&<a className="socialBtn whatsapp" href={social.whatsapp} target="_blank" rel="noreferrer">🟢 WhatsApp</a>}{social.facebook&&<a className="socialBtn facebook" href={social.facebook} target="_blank" rel="noreferrer">🔵 Facebook</a>}{social.instagram&&<a className="socialBtn instagram" href={social.instagram} target="_blank" rel="noreferrer">🟣 Instagram</a>}</div><nav className="footerNav" aria-label="Footer"><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms & Conditions</a></nav><footer>© 2026 Zara Nikah Service <span>•</span> Aapka Rishta, Hamari Zimmedari</footer>
      </main>
    </>
  );
}
