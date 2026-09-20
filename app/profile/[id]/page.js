"use client";

import {useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {doc,getDoc} from "firebase/firestore";
import {db} from "../../../lib/firebase";

const fallback={
  "ZS-101":{photo:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&q=85"},
  "ZS-102":{photo:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1000&q=85"},
  "ZS-103":{photo:"https://images.unsplash.com/photo-1544005313-94ddf028df2?w=1000&q=85"},
  "ZS-104":{photo:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1000&q=85"}
};

export default function Profile(){
  const {id}=useParams();
  const router=useRouter();
  const [p,setP]=useState(null);
  const [lightbox,setLightbox]=useState(false);
  const [zoom,setZoom]=useState(1);

  useEffect(()=>{
    if(!id)return;
    getDoc(doc(db,"profiles",id))
      .then(s=>setP(s.exists()?s.data():fallback[id]||null))
      .catch(()=>setP(fallback[id]||null));
  },[id]);

  const photo=p?.photo||fallback[id]?.photo;
  const openLightbox=()=>{if(photo){setZoom(1);setLightbox(true)}};

  return (
    <main>
      <header className="siteHeader">
        <div className="headerInner">
          <button className="logo" onClick={()=>router.push("/")}>
            <span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span>
          </button>
          <button className="headerLogin" onClick={()=>router.push("/admin")}>🔐 Admin Login</button>
        </div>
      </header>
      <section className="detail cardPage">
        <div className="detailTop">
          <button className="miniBack" onClick={()=>router.push("/")}>← Profiles</button>
          <span className="detailBadge">✓ Verified</span>
        </div>
        <div className="detailPhoto" onClick={openLightbox}>{photo?<img src={photo} alt="Marriage profile"/>:<div className="notFound">Profile not found</div>} {photo&&<span className="photoHint">🔍 फोटो बड़ा करके देखें</span>}</div>
        <div className="detailBody">
          <span className="profileId">{id}</span>
          <h1>Rishta ki Jankari</h1>
          <p className="detailLead">Is profile ki complete information dekhne ke liye registration zaroori hai.</p>
          <div className="notice">इस रिश्ते की जानकारी के लिए पहले रजिस्ट्रेशन करें</div>
          <div className="feeRow"><span><small>Registration</small><b>Simple & Secure</b></span><strong>₹100</strong></div>
          <button className="primaryAction" onClick={()=>router.push("/payment?profile="+encodeURIComponent(id))}>₹100 Registration करें <span>→</span></button>
          <button className="backAction" onClick={()=>router.push("/")}>← Home पर जाएँ</button>
        </div>
      </section>
    </main>
  );
}
