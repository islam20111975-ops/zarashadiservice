"use client";

import {Suspense,useEffect,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,onSnapshot,query,where,serverTimestamp,setDoc,deleteDoc} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

function PageBody(){
 const q=useSearchParams(),router=useRouter();
 const profile=q.get("profile")||"";
 const type=q.get("type")==="mobile"?"mobile":"biodata";
 const amount=type==="mobile"?500:100;
 const [user,setUser]=useState(null),[qrUrl,setQrUrl]=useState(""),[utr,setUtr]=useState("");
 const [requests,setRequests]=useState([]),[profileData,setProfileData]=useState(null),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false);

 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>getDoc(doc(db,"settings","payment")).then(s=>s.exists()&&setQrUrl(s.data().qrUrl||"")).catch(()=>{}),[]);
 useEffect(()=>{
  if(!profile)return;
  getDoc(doc(db,"profiles",profile)).then(s=>setProfileData(s.exists()&&s.data().status!=="deleted"?{id:s.id,...s.data()}:null)).catch(()=>setProfileData(null));
 },[profile]);
 useEffect(()=>{
  if(!user)return;
  return onSnapshot(query(collection(db,"paidAccessRequests"),where("uid","==",user.uid)),s=>{
   setRequests(s.docs.map(d=>({id:d.id,...d.data()}))
    .filter(x=>x.profileId===profile&&x.type===type)
    .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));
  },e=>setMsg("Payment status load nahi ho saka: "+e.message));
 },[user,profile,type]);

 async function login(){
  try{await signInWithPopup(auth,new GoogleAuthProvider())}
  catch(e){setMsg("❌ Google Login failed: "+(e?.message||"Please try again."))}
 }

 async function submit(){
  setMsg("");
  if(!user)return setMsg("⚠️ Pehle Google se Login karein.");
  if(!profile)return setMsg("❌ Profile ID missing hai.");
  if(!profileData)return setMsg("❌ Ye profile available nahi hai.");
  if(!qrUrl)return setMsg("❌ Admin ne QR payment set nahi kiya hai.");
  const clean=utr.trim().replace(/\s+/g,"").toUpperCase();
  if(!clean)return setMsg("⚠️ Payment karne ke baad UTR / Transaction ID yahan zaroor bharein.");
  if(!/^[A-Z0-9]{6,40}$/.test(clean))return setMsg("⚠️ Sahi UTR / Transaction ID bhariye (6–40 letters/numbers).");
  if(requests.some(x=>x.status==="pending"))return setMsg("⏳ Is profile ka payment request already Pending hai. Admin verification ka wait karein.");
  if(requests.some(x=>x.status==="approved"))return setMsg("✅ Is profile ka access pehle hi approved hai.");
  setSaving(true);
  try{
   // Access documents are protected for approved users/admins. Do not read them before payment.
   // The approved/pending status is already tracked through paidAccessRequests below.
   // Do not read pendingPaymentLocks from the customer side.
   // The user's paidAccessRequests query already blocks an existing pending request.
   // This avoids a Rules read failure when the deterministic lock document does not exist yet.
   const lockId=user.uid+"_"+profile+"_"+type;
   const reqRef=doc(collection(db,"paidAccessRequests"));
   const lockRef=doc(db,"pendingPaymentLocks",lockId);
   const claimRef=doc(db,"paymentUtrClaims",clean.toLowerCase());
   const lockData={uid:user.uid,profileId:profile,type,kind:"access",amount,status:"pending",requestId:reqRef.id,createdAt:serverTimestamp()};
   const claimData={uid:user.uid,utr:clean,kind:"access",profileId:profile,type,amount,requestId:reqRef.id,createdAt:serverTimestamp()};
   const requestData={uid:user.uid,profileId:profile,type,amount,status:"pending",paymentMethod:"qr",utr:clean,utrClaimId:claimRef.id,lockId:lockRef.id,createdAt:serverTimestamp()};

   // Write separately so a Rules rejection tells us exactly which document failed.
   // If a later step fails, remove the earlier temporary documents.
   try{
    await setDoc(lockRef,lockData);
   }catch(e){
    throw Object.assign(new Error("Payment lock save failed: "+(e?.message||"Permission denied")), {code:e?.code||"permission-denied",stage:"pendingPaymentLocks"});
   }
   try{
    await setDoc(claimRef,claimData);
   }catch(e){
    await deleteDoc(lockRef).catch(()=>{});
    throw Object.assign(new Error("UTR claim save failed: "+(e?.message||"Permission denied")), {code:e?.code||"permission-denied",stage:"paymentUtrClaims"});
   }
   try{
    await setDoc(reqRef,requestData);
   }catch(e){
    await deleteDoc(claimRef).catch(()=>{});
    await deleteDoc(lockRef).catch(()=>{});
    throw Object.assign(new Error("Payment request save failed: "+(e?.message||"Permission denied")), {code:e?.code||"permission-denied",stage:"paidAccessRequests"});
   }
   setUtr("");
   setMsg("⏳ Payment request Admin ko bhej di gayi hai. UTR verify hone ke baad exact Profile "+profile+" ka access approve hoga.");
  }catch(e){
   const code=e?.code||"";
   if(code==="already-exists"){
    setMsg("❌ Ye UTR ya payment lock pehle hi use ho chuka hai. Page refresh karke status dekhein.");
   }else if(code==="permission-denied"){
    const detail=e?.message||"Permission denied";
    const stage=e?.stage||"payment request";
    setMsg("❌ Firebase Permission Denied\\n\\n"+stage+" ko Firebase Rules ne reject kiya. Details: "+detail);
   }else if(code==="failed-precondition"){
    setMsg("❌ Firebase configuration/precondition error. Kripya page refresh karke dobara try karein.");
   }else if(code==="unavailable"){
    setMsg("❌ Firebase service abhi available nahi hai. Internet check karke dobara try karein.");
   }else{
    setMsg("❌ Payment request save nahi hui: "+(e?.message||"Unknown error"));
   }
  }finally{setSaving(false)}
 }

 const photo=profileData?.photos?.[0]||profileData?.photo||"";
 const approved=requests.find(x=>x.status==="approved");
 useEffect(()=>{
  if(approved) router.replace("/profile/"+encodeURIComponent(profile));
 },[approved,profile,router]);
 const pending=requests.find(x=>x.status==="pending");
 return <main>
  <header className="siteHeader"><div className="headerInner"><button className="logo" type="button" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button></div></header>
  <section className="cardPage payment" style={{maxWidth:760,margin:"25px auto"}}>
   <div style={{textAlign:"center"}}>
    <div className="paymentIcon">₹</div><span className="eyebrow">DIRECT QR PAYMENT</span>
    <h1>₹{amount} {type==="mobile"?"Mobile Number":"Biodata"} Access</h1>
    {photo&&<img src={photo} alt="" className="paymentProfilePhoto"/>}
    <p className="paymentLead">Profile <b>{profile}</b> ke liye exact ₹{amount} payment hai.</p>
   </div>
   {!user&&<><div className="notice">Payment request bhejne ke liye Google Login zaroori hai.</div><button type="button" className="primaryAction" onClick={login}>Google se Login →</button></>}
   {user&&<>
    <div className="feeRow"><span><small>Exact Access Fee</small><b>₹{amount}</b></span><strong>QR</strong></div>
    {pending&&<div className="notice">⏳ <b>Payment Pending</b><br/>Aapki request Admin verify kar rahe hain. Same profile ke liye dobara payment submit na karein.</div>}
    <div className="qr">{qrUrl?<><img src={qrUrl} alt="UPI QR"/><p><b>QR scan karke exact ₹{amount} pay karein.</b></p></>:<small>Admin ne QR set nahi kiya.</small>}</div>
    <div className="paymentForm">
     <label>UTR / Transaction ID
      <input className="adminInput" value={utr} onChange={e=>setUtr(e.target.value)} placeholder={"₹"+amount+" payment ke baad UTR dalein"} autoComplete="off" inputMode="text"/>
     </label>
     <button type="button" className="primaryAction" disabled={saving||!!pending} onClick={submit}>
      {saving?"Sending...":pending?"Request Pending ⏳":"UTR Send करके Access Request करें →"}
     </button>
    </div>
    {requests.slice(0,5).map(x=><div className="notice" key={x.id}>₹{x.amount} — <b>{x.status}</b>{x.utr&&" — UTR "+x.utr}</div>)}
   </>}
   {msg&&<div className="messageBox" role="status">{msg}</div>}
   <button type="button" className="backAction" onClick={()=>router.push("/payment?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type))}>← Payment Options पर जाएँ</button>
  </section>
 </main>;
}

export default function QRRecharge(){
 return <Suspense fallback={<main><section className="cardPage">Loading...</section></main>}><PageBody/></Suspense>
}