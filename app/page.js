"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {collection,doc,getDoc,onSnapshot,query,where} from "firebase/firestore";
import {db} from "../lib/firebase";

const fallback=[
  {id:"ZS-101",gender:"female",photo:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=85"},
  {id:"ZS-102",gender:"male",photo:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=85"},
  {id:"ZS-103",gender:"female",photo:"https://images.unsplash.com/photo-1544005313-94ddf028df2?w=800&q=85"},
  {id:"ZS-104",gender:"male",photo:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=85"}
];

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

  const shown=data.length?data:fallback.filter(p=>p.gender===r);
  return (
    <main className={wallpaper?"hasWallpaper":""} style={wallpaper?{backgroundImage:"url("+wallpaper+")"}:undefined}>
      <header className="siteHeader"><div className="headerInner">
        <button className="logo" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button>
        <div className="headerActions"><span className="secureChip">✓ Verified Service</span><button className="headerLogin" onClick={()=>router.push("/admin")}>🔐 Admin Login</button></div>
      </div></header>
      <section className="heroHome">
        <div className="heroGlow one"></div><div className="heroGlow two"></div>
        <div className="heroContent">
          <div className="heroBadge">✨ A TRUSTED NIKAH SERVICE</div>
          <p>Aapka Rishta, Hamari Zimmedari</p>
          <div className="heroFeatures"><span>✓ Verified Profiles</span><span>✓ Privacy First</span><span>✓ Simple Registration</span></div>
        </div>
        <div className="choiceTitle"><span>01</span><div><b>Rishta ki category chunein</b><small>Male ya Female profiles dekhein</small></div></div>
        <div className="gender genderPremium">
          <button className={r==="male"?"genderCard premiumCard maleCard active":"genderCard premiumCard maleCard"} onClick={()=>setR("male")}><div className="cardIcon">👨</div><div><b>Male Rishte</b><small>Male profiles dekhein</small></div><span className="arrow">→</span></button>
          <button className={r==="female"?"genderCard premiumCard femaleCard active":"genderCard premiumCard femaleCard"} onClick={()=>setR("female")}><div className="cardIcon">👩</div><div><b>Female Rishte</b><small>Female profiles dekhein</small></div><span className="arrow">→</span></button>
        </div>
      </section>
      {r&&<section className="profiles"><div className="sectionHead"><div><span className="eyebrow">AVAILABLE PROFILES</span><h2>{r==="male"?"Male":"Female"} Rishte</h2></div><span className="count">{loading?"Loading...":shown.length+" Profiles"}</span></div>
        <div className="grid">{shown.map(p=><article className="profileCard" key={p.id}><div className="photoWrap"><img src={p.photo} alt="Marriage profile"/><span className="verified">✓ Verified</span></div><div className="cardInfo"><span className="profileId">{p.id}</span><button onClick={()=>router.push("/profile/"+p.id)}>💍 रिश्ता देखें <span>→</span></button></div></article>)}</div>
      </section>}
      <section className="trustStrip"><div><b>🔒 Privacy</b><small>Aapki details ko respect ke saath handle kiya jata hai</small></div><div><b>✓ Verified</b><small>Registered profiles ko manage kiya jata hai</small></div><div><b>💗 Nikah Focus</b><small>Serious rishta search ke liye simple process</small></div></section>
      <div className="socialLinks">{social.whatsapp&&<a className="socialBtn whatsapp" href={social.whatsapp} target="_blank" rel="noreferrer">🟢 WhatsApp</a>}{social.facebook&&<a className="socialBtn facebook" href={social.facebook} target="_blank" rel="noreferrer">🔵 Facebook</a>}{social.instagram&&<a className="socialBtn instagram" href={social.instagram} target="_blank" rel="noreferrer">🟣 Instagram</a>}</div><footer>© 2026 Zara Shadi Service <span>•</span> Aapka Rishta, Hamari Zimmedari</footer>
    </main>
  );
}
