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
 const [p,setP]=useState(null),[privateData,setPrivateData]=useState(null),[user,setUser]=useState(null),[customerInfo,setCustomerInfo]=useState({}),[branding,setBranding]=useState({logo:"",appIcon:""});
 const [loading,setLoading]=useState(true),[unlocked,setUnlocked]=useState(false),[mobile,setMobile]=useState(false),[lightbox,setLightbox]=useState(false),[loadError,setLoadError]=useState(""),[loginError,setLoginError]=useState("");

 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>{
  let alive=true;
  if(!user){setCustomerInfo({});return;}
  getDoc(doc(db,"users",user.uid)).then(s=>{
   if(alive)setCustomerInfo(s.exists()?s.data():{});
  }).catch(()=>{if(alive)setCustomerInfo({});});
  return()=>{alive=false};
 },[user]);
 useEffect(()=>{try{const cached=JSON.parse(window.localStorage.getItem("zaraBrandingCache")||"null");if(cached?.logo||cached?.appIcon)setBranding({logo:cached.logo||"",appIcon:cached.appIcon||""})}catch(e){} getDoc(doc(db,"settings","branding")).then(s=>{if(s.exists()){const b={logo:s.data().logo||"",appIcon:s.data().appIcon||""};setBranding(b);try{window.localStorage.setItem("zaraBrandingCache",JSON.stringify(b))}catch(e){}}}).catch(()=>{})},[]);
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
  if(!id||!user){setUnlocked(false);setMobile(false);setPrivateData(null);return;}
  let alive=true,timer=null,privateUnsubscribe=null;
  const loadAccess=async()=>{
   try{
    const snap=await getDocs(query(collection(db,"paidAccessRequests"),where("uid","==",user.uid)));
    const matches=snap.docs.map(d=>d.data()).filter(x=>x.profileId===id);
    const biodataOk=matches.some(x=>x.type==="biodata"&&x.status==="approved");
    const mobileOk=matches.some(x=>x.type==="mobile"&&x.status==="approved");
    if(!alive)return;
    setUnlocked(biodataOk);setMobile(mobileOk);
    if(privateUnsubscribe){privateUnsubscribe();privateUnsubscribe=null;}
    if(biodataOk){
      privateUnsubscribe=onSnapshot(doc(db,"profileBiodataPrivate",id),snap=>{if(!alive)return;if(snap.exists()){setPrivateData(snap.data()||{});setLoadError("")}else{setPrivateData({});setLoadError("")}},e=>{if(alive)setLoadError(e?.message||"Biodata load nahi ho saka.")});
    }else setPrivateData(null);
    
   }catch(e){if(alive)setLoadError(e?.message||"Access status load nahi ho saka.")}
  };
  loadAccess();timer=setInterval(loadAccess,3000);
  return()=>{alive=false;if(timer)clearInterval(timer);if(privateUnsubscribe)privateUnsubscribe()};
 },[id,user]);

 async function login(){setLoginError("");try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setLoginError(e?.message||"Google Login nahi ho saka.")}}
 function openWhatsAppRequest(){
  if(!mobile||!user)return;
  const customerName=val(customerInfo.name||user.displayName)||"Not provided";
  const customerPhone=val(customerInfo.phone||user.phoneNumber)||"Not provided";
  const profileName=val(d.name||p?.name)||"Not provided";
  const profileAge=val(d.age||p?.age)||"Not provided";
  const profileCity=val(d.city||p?.city)||"Not provided";
  const message=[
   "Assalamu Alaikum, mujhe Zara Nikah Service par ye rishta pasand aaya hai.",
   "",
   "LADKI / PROFILE KI JAANKARI",
   "Biodata ID: "+id,
   "Naam: "+profileName,
   "Umar: "+profileAge,
   "Shehar: "+profileCity,
   "",
   "PAYMENT KARNE WALE USER KI JAANKARI",
   "Naam: "+customerName,
   "Mobile: "+customerPhone,
   "Email: "+val(user.email),
   "User ID: "+user.uid,
   "",
   "₹299 mobile access payment approve ho chuka hai. Kripya aage ki jaankari dein."
  ].join("\n");
  window.location.href="https://wa.me/919112170192?text="+encodeURIComponent(message);
 }
 const photos=Array.isArray(p?.photos)&&p.photos.length?p.photos:(p?.photo?[p.photo]:[]);
 const d=privateData||{},biodataAvailable=hasBiodata(d);

 if(loading)return <main><section className="cardPage"><div className="notFound">Loading...</div></section></main>;
 if(!p)return <main><section className="cardPage"><div className="notFound">{loadError||"Profile not found"}</div></section></main>;

 return <main>
  <header className="siteHeader"><div className="headerInner">
   <button className="logo" onClick={()=>router.push("/")}><span className="logoMark">{branding.logo?<img src={branding.logo} alt="Zara Nikah logo"/>:"💍"}</span><span><strong>ZARA NIKAH</strong><small>Service</small></span></button>
   <button className="headerLogin" onClick={()=>user?router.push(["ngogrant454@gmail.com","islam20111975@gmail.com"].includes(user.email?.toLowerCase())?"/admin":"/account"):login()}>{!user?"🔐 Login":["ngogrant454@gmail.com","islam20111975@gmail.com"].includes(user.email?.toLowerCase())?"🔐 Admin Dashboard":"👤 My Profile"}</button>
  </div></header>

  <section className="detail cardPage">
   <div className="detailTop"><button className="miniBack" onClick={()=>router.push("/")}>← Profiles</button><span className="detailBadge">✓ Verified</span></div>
   <div className="detailPhoto" onClick={()=>setLightbox(true)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setLightbox(true)}} aria-label="सभी profile photos और biodata payment देखें">{photos[0]?<><img src={photos[0]} alt="Marriage profile"/>{photos.length>1&&<span className="detailPhotoCount">📷 {photos.length} Photos • सभी देखें</span>}</>:<div className="notFound">Photo not found</div>}</div>

   <div className="detailBody">
    <span className="profileId">{id}</span>
    <h1>{unlocked&&biodataAvailable?(d.name||"Biodata"):"Marriage Profile"}</h1>

    {!unlocked?<><p className="detailLead">Complete biodata ke liye ₹99 payment required hai.</p><div className="notice">Pay ₹99 to view the complete biodata</div><button className="primaryAction" onClick={()=>user?router.push("/payment?profile="+encodeURIComponent(id)+"&type=biodata"):login()}>₹99 Biodata Unlock →</button></>:
    <div className="biodataBox">
      {biodataAvailable&&<div className="biodataTitle">💍 Complete Biodata</div>}

      <Section title="👤 Personal Information">
       <Row label="Full Name" value={d.name}/>
       <Row label="Age" value={d.age}/>
       <Row label="Gender" value={d.gender}/>
       <Row label="Marital Status" value={d.maritalStatus}/>
       <Row label="Height" value={d.height}/>
       <Row label="Date of Birth" value={d.dob}/>
       <Row label="Birth Place" value={d.birthPlace}/>
      </Section>

      <Section title="🎓 Education & Work">
       <Row label="Education" value={d.education}/>
       <Row label="Occupation / Business" value={d.occupation}/>
       <Row label="Company / Institution" value={d.company}/>
       <Row label="Income" value={d.income}/>
      </Section>

      <Section title="📍 Address & Residence">
       <Row label="Full Address" value={d.address}/>
       <Row label="City" value={d.city}/>
       <Row label="District" value={d.district}/>
       <Row label="State" value={d.state}/>
       <Row label="Native Place / Hometown" value={d.nativePlace}/>
      </Section>

      <Section title="☪️ Religion / Social Information">
       <Row label="Religion / Maslak" value={d.religion}/>
       <Row label="Biradari / Community" value={d.caste}/>
       <Row label="Language / Mother Tongue" value={d.language}/>
      </Section>

      <Section title="👨‍👩‍👧‍👦 Family Information">
       <Row label="Father Name" value={d.fatherName}/>
       <Row label="Mother Name" value={d.motherName}/>
       <Row label="Brothers" value={d.brothers}/>
       <Row label="Sisters" value={d.sisters}/>
       <Row label="Family Details" value={d.familyDetails}/>
      </Section>

      <Section title="📝 About / Biodata Description">
       <Row label="About / Biodata Description" value={d.description}/>
      </Section>

      <Section title="💍 Marriage / Partner Expectations">
       <Row label="Preferred Age" value={d.preferredAge}/>
       <Row label="Preferred Education" value={d.preferredEducation}/>
       <Row label="Preferred Location" value={d.preferredLocation}/>
       <Row label="Other Expectations" value={d.otherExpectations}/>
       <Row label="Marriage / Partner Expectations" value={d.expectations}/>
      </Section>

      <Section title="ℹ️ Other Important Information">
       <Row label="Other Important Information" value={d.otherInfo}/>
      </Section>

      {mobile&&<><div className="notice">✅ ₹299 Mobile Access approve ho gaya hai. Ab WhatsApp par profile aur aapki jaankari ke saath message kholein. Message bhejne se pehle aap use dekh sakte hain.</div><button className="primaryAction" type="button" onClick={openWhatsAppRequest}>🟢 WhatsApp par baat karein →</button></>}
      {!mobile&&<><div className="notice">📱 Pay ₹299 to view Mobile Number</div><button className="primaryAction" onClick={()=>router.push("/payment?profile="+encodeURIComponent(id)+"&type=mobile")}>₹299 Mobile Number Access →</button></>}
    </div>}

    {!user&&<><p className="small">Google login is required for payment/access.</p>{loginError&&<div className="errorBox">{loginError}</div>}</>}
    {loadError&&<div className="errorBox">{loadError}</div>}
    <button className="backAction" onClick={()=>router.push("/")}>← Home</button>
   </div>
  </section>

  {lightbox&&<div className="photoLightbox" onClick={()=>setLightbox(false)}><div className="galleryCard" onClick={e=>e.stopPropagation()}><button aria-label="Close" className="galleryClose" onClick={()=>setLightbox(false)}>✕</button><div className="galleryScroll"><div className="galleryPaymentHeader"><b>Profile {id} • {photos.length} Photo{photos.length===1?"":"s"}</b><span>सभी फोटो देखने के लिए ऊपर/नीचे करें</span></div>{photos.map((s,i)=><div className="galleryPhoto" key={i}><img src={s} alt={"Profile "+id+" photo "+(i+1)}/><span className="galleryPhotoCount">{i+1} / {photos.length}</span></div>)}<div className="lightboxPayment"><b>💍 Profile {id} का पूरा Biodata</b><span>पूरी जानकारी देखने के लिए ₹99 भुगतान करें</span><button className="primaryAction" onClick={()=>{setLightbox(false);user?router.push("/payment?profile="+encodeURIComponent(id)+"&type=biodata"):login()}}>₹99 Biodata Unlock →</button></div></div></div></div>}
 </main>;
}
