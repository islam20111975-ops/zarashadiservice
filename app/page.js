"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,onSnapshot,query,where} from "firebase/firestore";
import {auth,db} from "../lib/firebase";

export default function Home(){
  const [r,setR]=useState(null);
  const [data,setData]=useState([]);
  const [allProfiles,setAllProfiles]=useState([]),[sliderIds,setSliderIds]=useState([]);
  const [slideIndex,setSlideIndex]=useState(0);
  const [loading,setLoading]=useState(false);
  const [wallpaper,setWallpaper]=useState("");
  const [social,setSocial]=useState({whatsapp:"",facebook:"",instagram:""});
  const [user,setUser]=useState(null),[loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState("");
  const router=useRouter();

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{getDoc(doc(db,"settings","appearance")).then(s=>{if(s.exists())setWallpaper(s.data().wallpaper||"")}).catch(()=>{});getDoc(doc(db,"settings","social")).then(s=>{if(s.exists())setSocial({whatsapp:s.data().whatsapp||"",facebook:s.data().facebook||"",instagram:s.data().instagram||""})}).catch(()=>{})},[]);
  useEffect(()=>{
    let cancelled=false;
    async function loadSlider(){
      try{
        const s=await getDoc(doc(db,"settings","homeSlider"));
        let ids=s.exists()&&Array.isArray(s.data().profileIds)?s.data().profileIds:[];
        if(!ids.length){
          const snap=await new Promise((resolve,reject)=>{
            const unsub=onSnapshot(collection(db,"profiles"),x=>{unsub();resolve(x)},reject);
          });
          ids=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.status!=="deleted"&&((Array.isArray(p.photos)&&p.photos[0])||p.photo)).sort((a,b)=>a.id.localeCompare(b.id)).map(p=>p.id);
        }
        if(cancelled||!ids.length)return;
        setSliderIds(ids);
        const first=await getDoc(doc(db,"profiles",ids[0]));
        if(!cancelled&&first.exists()&&first.data().status!=="deleted")setAllProfiles([{id:first.id,...first.data()}]);
      }catch(e){if(!cancelled)setLoginError(e?.message||"Slider image load nahi ho saki.")}
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
      getDoc(doc(db,"profiles",id)).then(s=>{
        if(s.exists()&&s.data().status!=="deleted")setAllProfiles(prev=>prev.some(p=>p.id===id)?prev:[...prev,{id:s.id,...s.data()}]);
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
        <div className="headerActions"><span className="secureChip">✓ Verified Service</span><button className="headerLogin" disabled={loginBusy} onClick={async()=>{setLoginError("");if(user){router.push(user.email?.toLowerCase()==="ngogrant454@gmail.com"?"/admin":"/account");return}setLoginBusy(true);try{const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});const result=await signInWithPopup(auth,p);router.push(result.user.email?.toLowerCase()==="ngogrant454@gmail.com"?"/admin":"/account")}catch(e){setLoginError(e?.message||"Google Login nahi ho saka.")}finally{setLoginBusy(false)}}}>{loginBusy?"Login...":user?(user.email?.toLowerCase()==="ngogrant454@gmail.com"?"🔐 Admin Dashboard":"👤 My Profile"):"🔐 Login"}</button></div>
      </div></header>{loginError&&<div className="errorBox homeLoginError">{loginError}</div>}
      <section className="heroHome" id="profiles">
        <div className="heroGlow one"></div><div className="heroGlow two"></div>
        <div className="heroContent">
          <div className="homeAutoSlider" aria-label="Nikah profiles automatic slideshow">
            {sliderIds.length && currentProfile ? <button className="homeSlide" onClick={()=>router.push("/profile/"+currentProfile.id)} aria-label={"Profile "+currentProfile.id+" dekhein"}>
              <img key={currentProfile.id} src={(Array.isArray(currentProfile.photos)&&currentProfile.photos[0])||currentProfile.photo||""} alt={"Marriage profile "+currentProfile.id} loading="eager" decoding="async" fetchPriority="high"/>
              <span className="slideShade"></span><span className="slideId">💍 Profile {currentProfile.id}</span><span className="slideVerified">✓ Verified</span>
            </button> : <div className="homeSlideEmpty">💍<span>{sliderIds.length?"Image loading...":"Nikah Profiles"}</span></div>}
            {sliderIds.length>1&&<div className="slideDots">{sliderIds.map((p,i)=><span key={p.id} className={i===slideIndex?"active":""}></span>)}</div>}
          </div>
        </div>
        <div className="gender genderPremium">
          <button className={r==="male"?"genderCard premiumCard maleCard active":"genderCard premiumCard maleCard"} onClick={()=>setR("male")}><div className="cardIcon">👨</div><div><b>Male Rishte</b><small>Male profiles dekhein</small></div><span className="arrow">→</span></button>
          <button className={r==="female"?"genderCard premiumCard femaleCard active":"genderCard premiumCard femaleCard"} onClick={()=>setR("female")}><div className="cardIcon">👩</div><div><b>Female Rishte</b><small>Female profiles dekhein</small></div><span className="arrow">→</span></button>
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
