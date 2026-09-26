"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,getDocs,onSnapshot,query,where} from "firebase/firestore";
import {auth,db} from "../lib/firebase";

export default function Home(){
  const [r,setR]=useState(null);
  const [data,setData]=useState([]);
  const [allProfiles,setAllProfiles]=useState([]),[sliderIds,setSliderIds]=useState([]);
  const [slideIndex,setSlideIndex]=useState(0),[installPrompt,setInstallPrompt]=useState(null);
  const [loading,setLoading]=useState(false);
  const [wallpaper,setWallpaper]=useState("");
  const [social,setSocial]=useState({whatsapp:"",facebook:"",instagram:""});
  const [user,setUser]=useState(null),[loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState("");
  const router=useRouter();

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{
    const handler=e=>{e.preventDefault();setInstallPrompt(e)};
    window.addEventListener("beforeinstallprompt",handler);
    return()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);
  async function installApp(){
    if(installPrompt){
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    alert("App install karne ke liye Chrome ke ⋮ menu me jaakar “Install app” ya “Add to Home screen” select karein.");
  }
  useEffect(()=>{getDoc(doc(db,"settings","appearance")).then(s=>{if(s.exists())setWallpaper(s.data().wallpaper||"")}).catch(()=>{});getDoc(doc(db,"settings","social")).then(s=>{if(s.exists())setSocial({whatsapp:s.data().whatsapp||"",facebook:s.data().facebook||"",instagram:s.data().instagram||""})}).catch(()=>{})},[]);
  useEffect(()=>{
    let cancelled=false;
    async function loadSlider(){
      try{
        // Use the public profiles collection as the reliable fallback/source.
        // It already allows public reads, so the Home slider does not depend on
        // whether the separate thumbnail/settings rules have been published yet.
        const snap=await getDocs(collection(db,"profiles"));
        const rows=snap.docs
          .map(d=>({id:d.id,...d.data()}))
          .filter(p=>p.status!=="deleted" && ((Array.isArray(p.photos)&&p.photos[0])||p.photo))
          .sort((a,b)=>a.id.localeCompare(b.id));
        if(cancelled||!rows.length)return;
        const ids=rows.map(p=>p.id);
        setSliderIds(ids);
        setAllProfiles(rows.map(p=>({id:p.id,image:(Array.isArray(p.photos)&&p.photos[0])||p.photo})));
      }catch(e){
        if(!cancelled){setSliderIds([]);setAllProfiles([]);}
      }
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
    <main className={wallpaper?"hasWallpaper":""} style={wallpaper?{backgroundImage:"url("+wallpaper+")","--site-wallpaper":"url("+wallpaper+")"}:undefined}>
      <header className="siteHeader"><div className="headerInner">
        <button className="logo" onClick={()=>router.push("/")}><span className="logoMark logoMarkBrand" aria-hidden="true"><span className="logoZ">Z</span><span className="logoN">N</span></span><span className="brand3d"><strong>ZARA NIKAH</strong><small>SERVICE</small></span></button>
        <nav className="mainNav" aria-label="Main navigation"><a href="/islamic-calendar">🌙 Islamic Calendar</a></nav>
        <div className="headerActions"><span className="secureChip">✓ Verified Service</span><button className="installAppBtn" onClick={installApp}>📲 App Install</button><button className="headerLogin" disabled={loginBusy} onClick={async()=>{setLoginError("");if(user){router.push(user.email?.toLowerCase()==="ngogrant454@gmail.com"?"/admin":"/account");return}setLoginBusy(true);try{const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});const result=await signInWithPopup(auth,p);router.push(result.user.email?.toLowerCase()==="ngogrant454@gmail.com"?"/admin":"/account")}catch(e){setLoginError(e?.message||"Google Login nahi ho saka.")}finally{setLoginBusy(false)}}}>{loginBusy?"Login...":user?(user.email?.toLowerCase()==="ngogrant454@gmail.com"?"🔐 Admin Dashboard":"👤 My Profile"):"🔐 Login"}</button></div>
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
  );
}
