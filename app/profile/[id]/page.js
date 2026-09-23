"use client";

import {useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {doc,getDoc} from "firebase/firestore";
import {auth,db} from "../../../lib/firebase";

export default function Profile(){
  const {id}=useParams(),router=useRouter();
  const [p,setP]=useState(null),[privateData,setPrivateData]=useState(null),[contact,setContact]=useState(null),[user,setUser]=useState(null);
  const [loading,setLoading]=useState(true),[unlocked,setUnlocked]=useState(false),[mobile,setMobile]=useState(false),[lightbox,setLightbox]=useState(false),[zoom,setZoom]=useState(1),[loginError,setLoginError]=useState("");

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{
    if(!id)return;
    (async()=>{
      try{
        const s=await getDoc(doc(db,"profiles",id));if(!s.exists() || s.data().status === "deleted"){setLoading(false);setP(null);return}
        setP({id:s.id,...s.data()});
        if(auth.currentUser){
          const uid=auth.currentUser.uid;
          const [b,m]=await Promise.all([getDoc(doc(db,"biodataUnlocks",uid+"_"+id)),getDoc(doc(db,"mobileAccess",uid+"_"+id))]);
          setUnlocked(b.exists()&&b.data().status==="approved");setMobile(m.exists()&&m.data().status==="approved");
          if(m.exists()&&m.data().status==="approved"){const cr=await getDoc(doc(db,"profileContact",id));if(cr.exists())setContact(cr.data())}
          if(b.exists()&&b.data().status==="approved"){const pr=await getDoc(doc(db,"profileBiodataPrivate",id));if(pr.exists())setPrivateData(pr.data())}
        }
      }finally{setLoading(false)}
    })();
  },[id,user]);

  async function login(){setLoginError("");try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setLoginError(e?.message||"Google Login nahi ho saka.")}}
  const photos=Array.isArray(p?.photos)&&p.photos.length?p.photos:(p?.photo?[p.photo]:[]);
  if(loading)return <main><section className="cardPage"><div className="notFound">Loading...</div></section></main>;
  if(!p)return <main><section className="cardPage"><div className="notFound">Profile not found</div></section></main>;

  return <main><header className="siteHeader"><div className="headerInner"><button className="logo" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button><button className="headerLogin" onClick={()=>user?router.push(user.email?.toLowerCase()==="ngogrant454@gmail.com"?"/admin":"/account"):login()}>{!user?"🔐 Login":user.email?.toLowerCase()==="ngogrant454@gmail.com"?"🔐 Admin Dashboard":"👤 My Profile"}</button></div></header>
    <section className="detail cardPage"><div className="detailTop"><button className="miniBack" onClick={()=>router.push("/")}>← Profiles</button><span className="detailBadge">✓ Verified</span></div>
      <div className="detailPhoto" onClick={()=>{setZoom(1);setLightbox(true)}}>{photos[0]?<img src={photos[0]} alt="Marriage profile"/>:<div className="notFound">Photo not found</div>}</div>
      <div className="detailBody"><span className="profileId">{id}</span><h1>{unlocked&&privateData?privateData.name:"Rishta ki Jankari"}</h1>
      {!unlocked?<><p className="detailLead">Complete biodata dekhne ke liye ₹100 payment required hai.</p><div className="notice">इस रिश्ते की पूरी जानकारी के लिए ₹100 भुगतान करें</div><button className="primaryAction" onClick={()=>user?router.push("/payment?profile="+encodeURIComponent(id)+"&type=biodata"):login()}>₹100 Biodata Unlock करें →</button></>:
      <div className="biodataBox"><p><b>नाम:</b> {privateData?.name||"-"}</p><p><b>पता:</b> {privateData?.address||"-"}</p><p><b>उम्र:</b> {privateData?.age||"-"}</p><p><b>आमदनी:</b> {privateData?.income||"-"}</p>{privateData?.description&&<div className="descriptionBox"><b>📝 विवरण:</b><p>{privateData.description}</p></div>}
        <div className="notice">{mobile?"📱 Mobile Number: "+(contact?.phone||"-"):"Mobile Number देखने के लिए ₹500 भुगतान करें"}</div>
        {!mobile&&<button className="primaryAction" onClick={()=>router.push("/payment?profile="+encodeURIComponent(id)+"&type=mobile")}>₹500 Mobile Number Access →</button>}
      </div>}
      {!user&&<><p className="small">Payment/access ke liye Google login zaroori hai.</p>{loginError&&<div className="errorBox">{loginError}</div>}</>}
      <button className="backAction" onClick={()=>router.push("/")}>← Home पर जाएँ</button></div>
    </section>
    {lightbox&&<div className="photoLightbox" onClick={()=>setLightbox(false)}><div className="galleryCard" onClick={e=>e.stopPropagation()}><button className="galleryClose" onClick={()=>setLightbox(false)}>×</button><div className="galleryScroll">{photos.map((s,i)=><div className="galleryPhoto" key={i}><img src={s} alt={"Photo "+(i+1)}/></div>)}<div className="lightboxPayment"><b>Profile: {id}</b></div></div></div></div>}
  </main>;
}