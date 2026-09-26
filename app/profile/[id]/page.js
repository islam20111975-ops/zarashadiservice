"use client";
import {useEffect,useState,Children} from "react";
import {useParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,getDocs,query,where,onSnapshot} from "firebase/firestore";
import {auth,db} from "../../../lib/firebase";

const val=(v)=>v===undefined||v===null?"":String(v).trim();
const hasBiodata=(d)=>Object.keys(d||{}).some(k=>k!=="profileId"&&k!=="updatedAt"&&val(d[k])!=="");
const Row=({label,value})=>{const v=val(value);return v?<div className="biodataRow"><span>{label}</span><b>{v}</b></div>:null};
const Section=({title,children})=>{const items=Children.toArray(children).filter(x=>x?.props&&val(x.props.value)!=="");return items.length?<div className="biodataSection"><h3>{title}</h3>{items}</div>:null};

export default function Profile(){
 const {id}=useParams(),router=useRouter();
 const [p,setP]=useState(null),[privateData,setPrivateData]=useState(null),[contact,setContact]=useState(null),[user,setUser]=useState(null);
 const [loading,setLoading]=useState(true),[unlocked,setUnlocked]=useState(false),[mobile,setMobile]=useState(false),[lightbox,setLightbox]=useState(false),[loadError,setLoadError]=useState(""),[loginError,setLoginError]=useState("");

 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>{
  if(!id)return;
  let alive=true;
  const loadProfile=async()=>{
   try{
    setLoadError("");
    const s=await getDoc(doc(db,"profiles",id));
    if(!s.exists()||s.data().status==="deleted"){if(alive){setLoading(false);setP(null)}return}
    if(!alive)return;
    setP({id:s.id,...s.data()});
   }catch(e){if(alive)setLoadError(e?.message||"Profile load nahi ho saka.");}
   finally{if(alive)setLoading(false);}
  };
  loadProfile();
  return()=>{alive=false};
 },[id]);

 useEffect(()=>{
  if(!id||!user){
   setUnlocked(false);setMobile(false);setPrivateData(null);setContact(null);
   return;
  }
  let alive=true;
  let timer=null;
  let privateUnsubscribe=null;

  const loadAccess=async()=>{
   try{
    const snap=await getDocs(query(collection(db,"paidAccessRequests"),where("uid","==",user.uid)));
    const matches=snap.docs.map(d=>d.data()).filter(x=>x.profileId===id);
    const biodataOk=matches.some(x=>x.type==="biodata"&&x.status==="approved");
    const mobileOk=matches.some(x=>x.type==="mobile"&&x.status==="approved");
    if(!alive)return;

    setUnlocked(biodataOk);
    setMobile(mobileOk);

    if(privateUnsubscribe){privateUnsubscribe();privateUnsubscribe=null;}

    if(biodataOk){
      const privateRef=doc(db,"profileBiodataPrivate",id);
      privateUnsubscribe=onSnapshot(privateRef,
       snap=>{
        if(!alive)return;
        if(snap.exists()){
         const data=snap.data()||{};
         setPrivateData(data);
         setLoadError("");
        }else{
         setPrivateData({});
         setLoadError("");
        }
       },
       e=>{if(alive)setLoadError(e?.message||"Biodata load nahi ho saka.")}
      );
    }else{
      setPrivateData(null);
    }

    if(mobileOk){
     try{
      const cr=await getDoc(doc(db,"profileContact",id));
      if(alive&&cr.exists())setContact(cr.data());
     }catch(e){if(alive)setLoadError(e?.message||"Mobile number load nahi ho saka.")}
    }else setContact(null);
   }catch(e){if(alive)setLoadError(e?.message||"Access status load nahi ho saka.");}
  };

  loadAccess();
  timer=setInterval(loadAccess,3000);
  return()=>{alive=false;if(timer)clearInterval(timer);if(privateUnsubscribe)privateUnsubscribe();};
 },[id,user]);

 async function login(){setLoginError("");try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setLoginError(e?.message||"Google Login nahi ho saka.")}}
 const photos=Array.isArray(p?.photos)&&p.photos.length?p.photos:(p?.photo?[p.photo]:[]);
 const d=privateData||{};
 const biodataAvailable=hasBiodata(d);

 if(loading)return <main><section className="cardPage"><div className="notFound">Loading...</div></section></main>;
 if(!p)return <main><section className="cardPage"><div className="notFound">{loadError||"Profile not found"}</div></section></main>;

 return <main>
  <header className="siteHeader"><div className="headerInner">
   <button className="logo" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA NIKAH</strong><small>Service</small></span></button>
   <button className="headerLogin" onClick={()=>user?router.push(user.email?.toLowerCase()==="ngogrant454@gmail.com"?"/admin":"/account"):login()}>{!user?"🔐 Login":user.email?.toLowerCase()==="ngogrant454@gmail.com"?"🔐 Admin Dashboard":"👤 My Profile"}</button>
  </div></header>

  <section className="detail cardPage">
   <div className="detailTop"><button className="miniBack" onClick={()=>router.push("/")}>← Profiles</button><span className="detailBadge">✓ Verified</span></div>
   <div className="detailPhoto" onClick={()=>setLightbox(true)}>{photos[0]?<img src={photos[0]} alt="Marriage profile"/>:<div className="notFound">Photo not found</div>}</div>

   <div className="detailBody">
    <span className="profileId">{id}</span>
    <h1>{unlocked&&biodataAvailable?(d.name||"Biodata"):"Rishta ki Jankari"}</h1>

    {!unlocked?<><p className="detailLead">Complete biodata dekhne ke liye ₹100 payment required hai.</p><div className="notice">इस रिश्ते की पूरी जानकारी के लिए ₹100 भुगतान करें</div><button className="primaryAction" onClick={()=>user?router.push("/payment?profile="+encodeURIComponent(id)+"&type=biodata"):login()}>₹100 Biodata Unlock करें →</button></>:
    <div className="biodataBox">
      {biodataAvailable&&<div className="biodataTitle">💍 शादी के लिए पूरा Biodata</div>}

      <Section title="👤 व्यक्तिगत जानकारी">
       <Row label="नाम" value={d.name}/>
       <Row label="उम्र" value={d.age}/>
       <Row label="लिंग" value={d.gender}/>
       <Row label="वैवाहिक स्थिति" value={d.maritalStatus}/>
       <Row label="कद" value={d.height}/>
       <Row label="जन्म तिथि" value={d.dob}/>
       <Row label="जन्म स्थान" value={d.birthPlace}/>
      </Section>

      <Section title="🎓 शिक्षा और काम">
       <Row label="शिक्षा" value={d.education}/>
       <Row label="पेशा / व्यवसाय" value={d.occupation}/>
       <Row label="कंपनी / संस्थान" value={d.company}/>
       <Row label="आमदनी" value={d.income}/>
      </Section>

      <Section title="📍 पता और निवास">
       <Row label="पूरा पता" value={d.address}/>
       <Row label="शहर" value={d.city}/>
       <Row label="जिला" value={d.district}/>
       <Row label="राज्य" value={d.state}/>
       <Row label="मूल निवास" value={d.nativePlace}/>
      </Section>

      <Section title="☪️ धार्मिक / सामाजिक जानकारी">
       <Row label="धार्मिक जानकारी" value={d.religion}/>
       <Row label="बिरादरी / जाति" value={d.caste}/>
       <Row label="भाषा" value={d.language}/>
      </Section>

      <Section title="👨‍👩‍👧‍👦 परिवार की जानकारी">
       <Row label="पिता" value={d.fatherName}/>
       <Row label="माता" value={d.motherName}/>
       <Row label="भाई" value={d.brothers}/>
       <Row label="बहन" value={d.sisters}/>
       <Row label="परिवार का विवरण" value={d.familyDetails}/>
      </Section>

      <Section title="📝 अपने बारे में">
       <Row label="विवरण" value={d.description}/>
      </Section>

      <Section title="💍 शादी की अपेक्षाएँ">
       <Row label="अपेक्षित उम्र" value={d.preferredAge}/>
       <Row label="अपेक्षित शिक्षा" value={d.preferredEducation}/>
       <Row label="अपेक्षित शहर / स्थान" value={d.preferredLocation}/>
       <Row label="अन्य अपेक्षाएँ" value={d.otherExpectations}/>
       <Row label="सामान्य अपेक्षाएँ" value={d.expectations}/>
      </Section>

      <Section title="ℹ️ अन्य महत्वपूर्ण जानकारी">
       <Row label="अन्य जानकारी" value={d.otherInfo}/>
      </Section>

      {mobile&&<div className="notice">📱 Mobile Number: {val(contact?.phone||contact?.mobile||contact?.mobileNumber)}</div>}
      {!mobile&&<><div className="notice">📱 Mobile Number देखने के लिए ₹500 भुगतान करें</div><button className="primaryAction" onClick={()=>router.push("/payment?profile="+encodeURIComponent(id)+"&type=mobile")}>₹500 Mobile Number Access →</button></>}
    </div>}

    {!user&&<><p className="small">Payment/access ke liye Google login zaroori hai.</p>{loginError&&<div className="errorBox">{loginError}</div>}</>}
    {loadError&&<div className="errorBox">{loadError}</div>}
    <button className="backAction" onClick={()=>router.push("/")}>← Home पर जाएँ</button>
   </div>
  </section>

  {lightbox&&<div className="photoLightbox" onClick={()=>setLightbox(false)}><div className="galleryCard" onClick={e=>e.stopPropagation()}><button aria-label="Close" className="galleryClose" onClick={()=>setLightbox(false)}>✕</button><div className="galleryScroll">{photos.map((s,i)=><div className="galleryPhoto" key={i}><img src={s} alt={"Photo "+(i+1)}/></div>)}<div className="lightboxPayment"><b>Profile: {id}</b><span>ऊपर/नीचे swipe करके photos देखें</span></div></div></div></div>}
 </main>;
}
