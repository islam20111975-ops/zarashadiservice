"use client";

import {useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {doc,getDoc} from "firebase/firestore";
import {db} from "../../../lib/firebase";

export default function Profile(){
  const {id}=useParams();
  const router=useRouter();
  const [p,setP]=useState(null);
  const [loading,setLoading]=useState(true);
  const [lightbox,setLightbox]=useState(false);
  const [photoIndex,setPhotoIndex]=useState(0);

  useEffect(()=>{
    if(!id)return;
    setLoading(true);
    getDoc(doc(db,"profiles",id))
      .then(s=>setP(s.exists()?s.data():null))
      .catch(()=>setP(null))
      .finally(()=>setLoading(false));
  },[id]);

  const photos=Array.isArray(p?.photos)&&p.photos.length?p.photos:(p?.photo?[p.photo]:[]);
  const photo=photos[0];

  const openLightbox=(index=0)=>{
    if(photos.length){
      setPhotoIndex(index);
      setLightbox(true);
    }
  };

  if(loading)return <main><div className="detail cardPage"><div className="notFound">Loading...</div></div></main>;

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
        <div className="detailPhoto" onClick={()=>openLightbox(0)}>
          {photo?<img src={photo} alt="Marriage profile"/>:<div className="notFound">Profile not found</div>}
          {photo&&<span className="photoHint">🔍 फोटो बड़ा करके देखें</span>}
        </div>
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
      {lightbox&&photo&&<div className="photoLightbox" onClick={()=>setLightbox(false)}>
        <div className="galleryCard" onClick={e=>e.stopPropagation()}>
          <button className="galleryClose" aria-label="Close" onClick={()=>setLightbox(false)}>×</button>
          <div className="galleryScroll">
            {photos.map((src,index)=>(
              <div className="galleryPhoto" key={index}>
                <img src={src} alt={"Marriage profile "+(index+1)}/>
                {photos.length>1&&<span className="galleryPhotoNumber">{index+1} / {photos.length}</span>}
              </div>
            ))}
            <div className="lightboxPayment">
              <b>इस रिश्ते की जानकारी के लिए पहले रजिस्ट्रेशन करें</b>
              <span>Registration Fee: <strong>₹100</strong></span>
              <button onClick={()=>router.push("/payment?profile="+encodeURIComponent(id))}>₹100 Registration करें →</button>
            </div>
          </div>
        </div>
      </div>}
    </main>
  );
}
