"use client";
import {useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {doc,getDoc,onSnapshot} from "firebase/firestore";
import {auth,db} from "../../../lib/firebase";

const first=(o,keys)=>{for(const k of keys){if(o?.[k]!==undefined&&o?.[k]!==null&&String(o[k]).trim()!=="")return o[k]}return "-";};
const Row=({label,value})=><div className="biodataRow"><span>{label}</span><b>{value}</b></div>;
const Section=({title,children})=><div className="biodataSection"><h3>{title}</h3>{children}</div>;

export default function Profile(){
 const {id}=useParams(),router=useRouter();
 const [p,setP]=useState(null),[privateData,setPrivateData]=useState(null),[contact,setContact]=useState(null),[user,setUser]=useState(null);
 const [loading,setLoading]=useState(true),[unlocked,setUnlocked]=useState(false),[mobile,setMobile]=useState(false),[lightbox,setLightbox]=useState(false),[zoom,setZoom]=useState(1),[loadError,setLoadError]=useState(""),[loginError,setLoginError]=useState("");

 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>{
  if(!id)return;
  let stopB=null,stopM=null,alive=true;
  (async()=>{
   try{
    setLoadError("");
    const s=await getDoc(doc(db,"profiles",id));
    if(!s.exists()||s.data().status==="deleted"){if(alive){setLoading(false);setP(null)}return}
    if(!alive)return;setP({id:s.id,...s.data()});
    if(!auth.currentUser){setLoading(false);return}
    const uid=auth.currentUser.uid;
    const loadPrivate=async()=>{const pr=await getDoc(doc(db,"profileBiodataPrivate",id));if(pr.exists()&&alive)setPrivateData(pr.data())};
    const loadContact=async()=>{const cr=await getDoc(doc(db,"profileContact",id));if(cr.exists()&&alive)setContact(cr.data())};
    stopB=onSnapshot(doc(db,"biodataUnlocks",uid+"_"+id),async s=>{
      const ok=s.exists()&&s.data().status==="approved";
      if(alive){setUnlocked(ok);if(ok)await loadPrivate();else setPrivateData(null)}
    },e=>alive&&setLoadError(e?.message||"Biodata access check failed."));
    stopM=onSnapshot(doc(db,"mobileAccess",uid+"_"+id),async s=>{
      const ok=s.exists()&&s.data().status==="approved";
      if(alive){setMobile(ok);if(ok)await loadContact();else setContact(null)}
    },e=>alive&&setLoadError(e?.message||"Mobile access check failed."));
   }catch(e){if(alive)setLoadError(e?.message||"Profile load nahi ho saka.");}
   finally{if(alive)setLoading(false)}
  })();
  return()=>{alive=false;if(stopB)stopB();if(stopM)stopM()};
 },[id,user]);

 async function login(){setLoginError("");try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setLoginError(e?.message||"Google Login nahi ho saka.")}}
 const photos=Array.isArray(p?.photos)&&p.photos.length?p.photos:(p?.photo?[p.photo]:[]);
 const d=privateData||{};
 const name=first(d,["name","fullName","candidateName"]);
 const description=first(d,["description","about","bio","details"]);
 const family=first(d,["familyDetails","family","familyBackground"]);
 const expectations=first(d,["expectations","partnerExpectations","marriageExpectations"]);
 if(loading)return <main><section className="cardPage"><div className="notFound">Loading...</div></section></main>;
 if(!p)return <main><section className="cardPage"><div className="notFound">{loadError||"Profile not found"}</div></section></main>;

 return <main>
  <header className="siteHeader"><div className="headerInner">
   <button className="logo" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button>
   <button className="headerLogin" onClick={()=>user?router.push(user.email?.toLowerCase()==="ngogrant454@gmail.com"?"/admin":"/account"):login()}>{!user?"🔐 Login":user.email?.toLowerCase()==="ngogrant454@gmail.com"?"🔐 Admin Dashboard":"👤 My Profile"}</button>
  </div></header>

  <section className="detail cardPage">
   <div className="detailTop"><button className="miniBack" onClick={()=>router.push("/")}>← Profiles</button><span className="detailBadge">✓ Verified</span></div>
   <div className="detailPhoto" onClick={()=>{setZoom(1);setLightbox(true)}}>{photos[0]?<img src={photos[0]} alt="Marriage profile"/>:<div className="notFound">Photo not found</div>}</div>

   <div className="detailBody">
    <span className="profileId">{id}</span>
    <h1>{unlocked?name:"Rishta ki Jankari"}</h1>

    {!unlocked?<><p className="detailLead">Complete biodata dekhne ke liye ₹100 payment required hai.</p><div className="notice">इस रिश्ते की पूरी जानकारी के लिए ₹100 भुगतान करें</div><button className="primaryAction" onClick={()=>user?router.push("/payment?profile="+encodeURIComponent(id)+"&type=biodata"):login()}>₹100 Biodata Unlock करें →</button></>:
    <div className="biodataBox">
      <div className="biodataTitle">💍 शादी के लिए पूरा Biodata</div>

      <Section title="👤 व्यक्तिगत जानकारी">
       <Row label="नाम" value={name}/>
       <Row label="उम्र" value={first(d,["age","years","dobAge"])}/>
       <Row label="लिंग" value={first(d,["gender","sex"])}/>
       <Row label="वैवाहिक स्थिति" value={first(d,["maritalStatus","marital_status","status"])}/>
       <Row label="कद" value={first(d,["height","heightCm","heightFeet"])}/>
       <Row label="जन्म तिथि" value={first(d,["dob","dateOfBirth","birthDate"])}/>
       <Row label="जन्म स्थान" value={first(d,["birthPlace","placeOfBirth"])}/>
      </Section>

      <Section title="🎓 शिक्षा और काम">
       <Row label="शिक्षा" value={first(d,["education","qualification","degree"])}/>
       <Row label="पेशा / व्यवसाय" value={first(d,["occupation","profession","job","business"])}/>
       <Row label="कंपनी / संस्थान" value={first(d,["company","organization","workplace","institution"])}/>
       <Row label="आमदनी" value={first(d,["income","salary","monthlyIncome","annualIncome"])}/>
      </Section>

      <Section title="📍 पता और निवास">
       <Row label="पूरा पता" value={first(d,["address","fullAddress","residentialAddress"])}/>
       <Row label="शहर" value={first(d,["city","town"])}/>
       <Row label="जिला" value={first(d,["district"])}/>
       <Row label="राज्य" value={first(d,["state"])}/>
       <Row label="मूल निवास" value={first(d,["nativePlace","hometown","village"])}/>
      </Section>

      <Section title="☪️ धार्मिक / सामाजिक जानकारी">
       <Row label="धार्मिक जानकारी" value={first(d,["religion","faith","maslak"])}/>
       <Row label="बिरादरी / जाति" value={first(d,["caste","community","biradari"])}/>
       <Row label="भाषा" value={first(d,["language","languages","motherTongue"])}/>
      </Section>

      <Section title="👨‍👩‍👧‍👦 परिवार की जानकारी">
       <Row label="पिता" value={first(d,["fatherName","father"])}/>
       <Row label="माता" value={first(d,["motherName","mother"])}/>
       <Row label="भाई" value={first(d,["brothers","brother"])}/>
       <Row label="बहन" value={first(d,["sisters","sister"])}/>
       {family!=="-"&&<div className="descriptionBox"><b>परिवार का विवरण:</b><p>{family}</p></div>}
      </Section>

      <Section title="📝 अपने बारे में">
       {description!=="-"?<div className="descriptionBox"><p>{description}</p></div>:<Row label="विवरण" value="-"/>}
      </Section>

      <Section title="💍 शादी की अपेक्षाएँ">
       {expectations!=="-"?<div className="descriptionBox"><p>{expectations}</p></div>:<>
        <Row label="अपेक्षित उम्र" value={first(d,["preferredAge","partnerAge","expectedAge"])}/>
        <Row label="अपेक्षित शिक्षा" value={first(d,["preferredEducation","partnerEducation","expectedEducation"])}/>
        <Row label="अपेक्षित शहर / स्थान" value={first(d,["preferredLocation","partnerLocation","expectedLocation"])}/>
        <Row label="अन्य अपेक्षाएँ" value={first(d,["otherExpectations","partnerDetails","marriagePreference"])}/>
       </>}
      </Section>

      <Section title="ℹ️ अन्य महत्वपूर्ण जानकारी">
       <Row label="अन्य जानकारी" value={first(d,["otherInfo","additionalInfo","additionalDetails","notes"])}/>
      </Section>

      <div className="notice">{mobile?"📱 Mobile Number: "+first(contact,["phone","mobile","mobileNumber"]):"📱 Mobile Number देखने के लिए ₹500 भुगतान करें"}</div>
      {!mobile&&<button className="primaryAction" onClick={()=>router.push("/payment?profile="+encodeURIComponent(id)+"&type=mobile")}>₹500 Mobile Number Access →</button>}
    </div>}

    {!user&&<><p className="small">Payment/access ke liye Google login zaroori hai.</p>{loginError&&<div className="errorBox">{loginError}</div>}</>}
    {loadError&&<div className="errorBox">{loadError}</div>}
    <button className="backAction" onClick={()=>router.push("/")}>← Home पर जाएँ</button>
   </div>
  </section>

  {lightbox&&<div className="photoLightbox" onClick={()=>setLightbox(false)}><div className="galleryCard" onClick={e=>e.stopPropagation()}><button className="galleryClose" onClick={()=>setLightbox(false)}>✕ Close</button><div className="zoomControls"><button type="button" onClick={()=>setZoom(z=>Math.max(.7,Number((z-.2).toFixed(1))))}>−</button><span>{Math.round(zoom*100)}%</span><button type="button" onClick={()=>setZoom(z=>Math.min(3,Number((z+.2).toFixed(1))))}>+</button><button type="button" onClick={()=>setZoom(1)}>↺</button></div><div className="galleryScroll">{photos.map((s,i)=><div className="galleryPhoto" key={i}><img src={s} alt={"Photo "+(i+1)} style={{transform:"scale("+zoom+")",transformOrigin:"center center"}}/></div>)}<div className="lightboxPayment"><b>Profile: {id}</b><span>ऊपर/नीचे swipe करके photos देखें</span></div></div></div></div>}
 </main>;
}
