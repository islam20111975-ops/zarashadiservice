"use client";

import {useSearchParams,useRouter} from "next/navigation";
import {Suspense,useEffect,useState} from "react";
import {addDoc,collection,doc,getDoc,serverTimestamp,updateDoc,runTransaction} from "firebase/firestore";
import {db} from "../../lib/firebase";

function Pay(){
  const q=useSearchParams();
  const router=useRouter();
  const profile=q.get("profile")||"";
  const [form,setForm]=useState({name:"",phone:""});
  const [saving,setSaving]=useState(false);
  const [utr,setUtr]=useState("");
  const [utrSaving,setUtrSaving]=useState(false);
  const [utrSent,setUtrSent]=useState(false);
  const [registrationId,setRegistrationId]=useState("");
  const [msg,setMsg]=useState("");
  const [pay,setPay]=useState({upiId:"",qrUrl:""});
  const [profileExists,setProfileExists]=useState(null);

  useEffect(()=>{
    getDoc(doc(db,"settings","payment")).then(s=>{if(s.exists())setPay(s.data())}).catch(()=>{});
    if(profile)getDoc(doc(db,"profiles",profile)).then(s=>setProfileExists(s.exists())).catch(()=>setProfileExists(false));
    else setProfileExists(false);
  },[profile]);

  const upi=`upi://pay?pa=${encodeURIComponent(pay.upiId||"")}&pn=Zara%20Shadi%20Service&am=100&cu=INR`;

    e.preventDefault();
    const phone=form.phone.replace(/\D/g,"");
    if(phone.length!==10||!^[6-9]\\d{9}$/.test(phone)){setMsg("Sahi 10 digit WhatsApp number bhariye.");return;}
    if(profileExists===false){setMsg("Ye profile ab available nahi hai.");return;}
    setSaving(true);
    setMsg("");
    try{
      const ref=await addDoc(collection(db,"registrations"),{
        profileId:profile,name:form.name.trim(),phone,fee:100,status:"payment_pending",utr:"",createdAt:serverTimestamp()
      });
      setRegistrationId(ref.id);
      setMsg("Registration details save ho gayi. Ab ₹100 payment karein.");
    }catch{
      setMsg("Registration save nahi hui. Firebase setup check karein.");
    }finally{setSaving(false);}
  }

  async function submitUtr(e){
    e.preventDefault();
    const cleanUtr=utr.trim().replace(/\s+/g,"");
    if(!cleanUtr){setMsg("UTR / Transaction ID bhariye.");return;}
    if(!/^[A-Za-z0-9]{6,40}$/.test(cleanUtr)){setMsg("Sahi UTR / Transaction ID bhariye (6-40 characters).");return;}
    if(!registrationId||utrSent)return;
    setUtrSaving(true);
    setMsg("");
    try{
      await runTransaction(db,async tx=>{
        const regRef=doc(db,"registrations",registrationId);
        const claimRef=doc(db,"utrClaims",cleanUtr.toLowerCase());
        const claim=await tx.get(claimRef);
        if(claim.exists())throw new Error("UTR_ALREADY_USED");
        tx.set(claimRef,{registrationId,utr:cleanUtr.toUpperCase(),createdAt:serverTimestamp()});
        tx.update(regRef,{utr:cleanUtr,status:"utr_submitted",utrSubmittedAt:serverTimestamp()});
      });
      setUtrSent(true);
      setMsg("UTR successfully admin ko bhej diya gaya. Verification ke baad registration confirm hoga.");
    }catch(e){
      setMsg(e.message==="UTR_ALREADY_USED"?"Ye UTR pehle hi submit ho chuka hai.":"UTR send nahi hua. Dobara try karein.");
    }finally{setUtrSaving(false);}
  }

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

      <section className="payment cardPage">
        <div className="paymentIcon">₹</div>
        <span className="eyebrow">REGISTRATION</span>
        <h1>₹100 Registration</h1>
        <p className="paymentLead">Profile <b>{profile}</b> ki jankari ke liye registration complete karein.</p>

        {profileExists===false&&<div className="messageBox">यह profile अभी उपलब्ध नहीं है।</div>}

        <form onSubmit={register} className="paymentForm">
          <label>Naam<input className="adminInput" placeholder="Apna naam likhein" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>WhatsApp Number<input className="adminInput" placeholder="10 digit WhatsApp number" inputMode="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <button className="primaryAction" disabled={saving||profileExists===false}>{saving?"Saving...":"Registration Details Save करें"} <span>→</span></button>
        </form>

        {msg&&<div className="messageBox">{msg}</div>}

        <div className="payDivider"><span>PAYMENT</span></div>
        <div className="qr">
          {pay.qrUrl?<img src={pay.qrUrl} alt="UPI QR" style={{maxWidth:260,width:"100%",borderRadius:16}}/>:<><strong>UPI QR</strong><small>Admin abhi UPI QR set nahi kiya hai.</small></>}
        </div>

        {pay.upiId&&registrationId&&<a className="primaryAction payLink" href={upi}>
          📱 ₹100 UPI से Pay करें <span>→</span>
        </a>}
        {!pay.upiId&&<div className="messageBox">Payment UPI अभी admin द्वारा set नहीं किया गया है।</div>}
        <p className="small">₹100 payment ke baad isi page par wapas aakar UTR / Transaction ID bhejein.</p>

        {registrationId&&!utrSent&&(
          <form className="paymentForm" onSubmit={submitUtr}>
            <label>Payment UTR / Transaction ID<input className="adminInput" placeholder="12 digit UTR / Transaction ID" value={utr} onChange={e=>setUtr(e.target.value)}/></label>
            <button className="primaryAction" disabled={utrSaving}>{utrSaving?"Sending...":"✅ UTR Send करें"} <span>→</span></button>
          </form>
        )}

        {utrSent&&<div className="messageBox">🔒 UTR एक बार submit हो चुका है। इसे दोबारा बदलकर भेजा नहीं जा सकता।</div>}
        <button className="backAction" onClick={()=>router.push("/")}>← Home पर जाएँ</button>
      </section>
    </main>
  );
}

export default function Payment(){
  return <Suspense fallback={<main><section className="cardPage loadingCard">Loading...</section></main>}><Pay/></Suspense>;
}
