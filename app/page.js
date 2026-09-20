"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {collection,doc,getDoc,onSnapshot,query,where} from "firebase/firestore";
import {db} from "../lib/firebase";

const fallback=[];

export default function Home(){
  const [r,setR]=useState(null);
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(false);
  const [wallpaper,setWallpaper]=useState("");
  const [social,setSocial]=useState({whatsapp:"",facebook:"",instagram:""});
  const router=useRouter();

  useEffect(()=>{getDoc(doc(db,"settings","appearance")).then(s=>{if(s.exists())setWallpaper(s.data().wallpaper||"")}).catch(()=>{});getDoc(doc(db,"settings","social")).then(s=>{if(s.exists())setSocial({whatsapp:s.data().whatsapp||"",facebook:s.data().facebook||"",instagram:s.data().instagram||""})}).catch(()=>{})},[]);
  useEffect(()=>{
    if(!r){setData([]);return}
    setLoading(true);
    const q=query(collection(db,"profiles"),where("gender","==",r));
    return onSnapshot(q,s=>{setData(s.docs.map(d=>({id:d.id,...d.data()})));setLoading(false)},()=>setLoading(false));
  },[r]);

  const shown=data;
  return (
    <main className={wallpaper?"hasWallpaper":""} style={wallpaper?{backgroundImage:"url("+wallpaper+")","--site-wallpaper":"url("+wallpaper+")"}:undefined}>
      <header className="siteHeader"><div className="headerInner">
        <button className="logo" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button>
        <div className="headerActions"><span className="secureChip">✓ Verified Service</span><button className="headerLogin" onClick={()=>router.push("/admin")}>🔐 Admin Login</button></div>
      </div></header>
      <section className="heroHome">
        <div className="heroGlow one"></div><div className="heroGlow two"></div>
        <div className="heroContent">
          <div className="heroBadge">✨ A TRUSTED NIKAH SERVICE</div>
          <div className="heroFeatures"><span>✓ Verified Profiles</span><span>✓ Privacy First</span><span>✓ Simple Registration</span></div>
        </div>
        <div className="gender genderPremium">
          <button className={r==="male"?"genderCard premiumCard maleCard active":"genderCard premiumCard maleCard"} onClick={()=>setR("male")}><div className="cardIcon">👨</div><div><b>Male Rishte</b><small>Male profiles dekhein</small></div><span className="arrow">→</span></button>
          <button className={r==="female"?"genderCard premiumCard femaleCard active":"genderCard premiumCard femaleCard"} onClick={()=>setR("female")}><div className="cardIcon">👩</div><div><b>Female Rishte</b><small>Female profiles dekhein</small></div><span className="arrow">→</span></button>
        </div>
      </section>
      {r&&<section className="profiles"><div className="sectionHead"><div><span className="eyebrow">AVAILABLE PROFILES</span><h2>{r==="male"?"Male":"Female"} Rishte</h2></div><span className="count">{loading?"Loading...":shown.length+" Profiles"}</span></div>
        <div className="grid">{shown.map(p=><article className="profileCard" key={p.id}><div className="photoWrap" onClick={()=>router.push("/profile/"+p.id)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")router.push("/profile/"+p.id)}}><img src={p.photo} alt="Marriage profile"/><span className="verified">✓ Verified</span></div><div className="cardInfo"><span className="profileId">{p.id}</span><button onClick={()=>router.push("/profile/"+p.id)}>💍 रिश्ता देखें <span>→</span></button></div></article>)}</div>
      </section>}
      <section className="trustStrip"><div><b>🔒 Privacy</b><small>Aapki details ko respect ke saath handle kiya jata hai</small></div><div><b>✓ Verified</b><small>Registered profiles ko manage kiya jata hai</small></div><div><b>💗 Nikah Focus</b><small>Serious rishta search ke liye simple process</small></div></section>
      <div className="socialLinks"><a className="socialBtn whatsapp" href={social.whatsapp||"#"} target={social.whatsapp?"_blank":undefined} rel={social.whatsapp?"noreferrer":undefined}>🟢 WhatsApp</a><a className="socialBtn facebook" href={social.facebook||"#"} target={social.facebook?"_blank":undefined} rel={social.facebook?"noreferrer":undefined}>🔵 Facebook</a><a className="socialBtn instagram" href={social.instagram||"#"} target={social.instagram?"_blank":undefined} rel={social.instagram?"noreferrer":undefined}>🟣 Instagram</a></div><footer>© 2026 Zara Shadi Service <span>•</span> Aapka Rishta, Hamari Zimmedari</footer>
    </main>
  );
}
