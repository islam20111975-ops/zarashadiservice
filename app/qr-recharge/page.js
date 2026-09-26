"use client";

import {Suspense,useEffect,useRef,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,getDocs,query,where,serverTimestamp,setDoc,deleteDoc} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

function PageBody(){
 const q=useSearchParams(),router=useRouter();
 const profile=q.get("profile")||"";
 const type=q.get("type")==="mobile"?"mobile":"biodata";
 const amount=type==="mobile"?500:100;
 const [user,setUser]=useState(null),[qrUrl,setQrUrl]=useState(""),[upiId,setUpiId]=useState(""),[utr,setUtr]=useState("");
 const [requests,setRequests]=useState([]),[profileData,setProfileData]=useState(null),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false);
 const redirected=useRef(false);

 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>{
  getDoc(doc(db,"settings","payment")).then(s=>{if(s.exists()){setQrUrl(s.data().qrUrl||"");setUpiId((s.data().upiId||"").trim())}}).catch(()=>{});
 },[]);
 useEffect(()=>{
  if(!profile)return;
  getDoc(doc(db,"profiles",profile)).then(s=>setProfileData(s.exists()&&s.data().status!=="deleted"?{id:s.id,...s.data()}:null)).catch(()=>setProfileData(null));
 },[profile]);
 useEffect(()=>{
  if(!user||!profile)return;
  let alive=true;
  let timer=null;
  const loadRequests=async()=>{
   try{
    const snap=await getDocs(query(collection(db,"paidAccessRequests"),where("uid","==",user.uid)));
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}))
     .filter(x=>String(x.profileId)===String(profile)&&x.type===type)
     .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    if(!alive)return;
    setRequests(rows);
    const approved=rows.some(x=>x.status==="approved");
    if(approved&&!redirected.current){
     redirected.current=true;
     window.clearInterval(timer);
     router.replace("/profile/"+encodeURIComponent(profile));
    }
   }catch(e){
    if(alive)setMsg("Payment status load nahi ho saka: "+(e?.message||"Unknown error"));
   }
  };
  loadRequests();
  timer=setInterval(loadRequests,3000);
  return()=>{alive=false;if(timer)clearInterval(timer)};
 },[user,profile,type,router]);

 const approved=requests.some(x=>x.status==="approved");
 const pending=requests.find(x=>x.status==="pending");

 async function login(){
  try{await signInWithPopup(auth,new GoogleAuthProvider())}
  catch(e){setMsg("❌ Google Login failed: "+(e?.message||"Please try again."))}
 }

 async function downloadQr(){
  if(!qrUrl)return setMsg("❌ QR Code available nahi hai.");
  const fileName="Zara-Nikah-UPI-QR-"+amount+".png";
  try{
   // Admin QR is normally stored as a data URL, so save it directly without
   // depending on cross-origin fetch/download support on mobile browsers.
   if(qrUrl.startsWith("data:")){
    const a=document.createElement("a"); a.href=qrUrl; a.download=fileName; document.body.appendChild(a); a.click(); a.remove();
    setMsg("✅ QR Code save/download ke liye ready hai.");
    return;
   }
   const res=await fetch(qrUrl,{mode:"cors"}); if(!res.ok)throw new Error("QR download failed");
   const blob=await res.blob(); const url=URL.createObjectURL(blob);
   const a=document.createElement("a"); a.href=url; a.download=fileName; document.body.appendChild(a); a.click(); a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500); setMsg("✅ QR Code save/download ke liye ready hai.");
  }catch(e){
   // Last-resort mobile fallback: open the QR itself so the user can long-press/save it.
   try{window.open(qrUrl,"_blank","noopener,noreferrer");}catch(_e){}
   setMsg("⚠️ Direct download browser ne block kiya. QR image khol di gayi hai—long-press karke Save Image karein.");
  }
 }

 async function submit(){
  setMsg("");
  if(!user)return setMsg("⚠️ Pehle Google se Login karein.");
  if(!profile)return setMsg("❌ Profile ID missing hai.");
  if(!profileData)return setMsg("❌ Ye profile available nahi hai.");
  if(!qrUrl&&!upiId)return setMsg("❌ Admin ne UPI ID ya QR payment set nahi kiya hai.");
  const clean=utr.trim().replace(/\s+/g,"").toUpperCase();
  if(!clean)return setMsg("⚠️ Payment karne ke baad UTR / Transaction ID yahan zaroor bharein.");
  if(!/^[A-Z0-9]{6,40}$/.test(clean))return setMsg("⚠️ Sahi UTR / Transaction ID bhariye (6–40 letters/numbers).");
  if(requests.some(x=>x.status==="pending"))return setMsg("⏳ Is profile ka payment request already Pending hai. Admin verification ka wait karein.");
  if(requests.some(x=>x.status==="approved"))return setMsg("✅ Is profile ka access pehle hi approved hai.");
  setSaving(true);
  try{
   const lockId=user.uid+"_"+profile+"_"+type;
   const reqRef=doc(collection(db,"paidAccessRequests"));
   const lockRef=doc(db,"pendingPaymentLocks",lockId);
   const claimRef=doc(db,"paymentUtrClaims",clean.toLowerCase());

   const existingLock=await getDoc(lockRef);
   if(existingLock.exists()){
    const oldLock=existingLock.data()||{};
    if(oldLock.status==="pending"&&oldLock.requestId){
     const oldReqSnap=await getDoc(doc(db,"paidAccessRequests",oldLock.requestId));
     if(oldReqSnap.exists()&&oldReqSnap.data()?.status==="pending")
      return setMsg("⏳ Is profile ka payment request pehle se Admin ke paas Pending hai. Dobara payment submit na karein.");
    }
    await deleteDoc(lockRef).catch(()=>{});
   }

   const lockData={uid:user.uid,profileId:profile,type,kind:"access",amount,status:"pending",requestId:reqRef.id,createdAt:serverTimestamp()};
   const claimData={uid:user.uid,utr:clean,kind:"access",profileId:profile,type,amount,requestId:reqRef.id,createdAt:serverTimestamp()};
   const requestData={uid:user.uid,profileId:profile,type,amount,status:"pending",paymentMethod:"upi",utr:clean,utrClaimId:claimRef.id,lockId:lockRef.id,createdAt:serverTimestamp()};

   try{await setDoc(lockRef,lockData)}
   catch(e){throw Object.assign(new Error("Payment lock save failed: "+(e?.message||"Permission denied")),{code:e?.code||"permission-denied",stage:"pendingPaymentLocks"})}
   try{await setDoc(claimRef,claimData)}
   catch(e){
    await deleteDoc(lockRef).catch(()=>{});
    throw Object.assign(new Error("UTR claim save failed: "+(e?.message||"Permission denied")),{code:e?.code||"permission-denied",stage:"paymentUtrClaims"});
   }
   try{await setDoc(reqRef,requestData)}
   catch(e){
    await deleteDoc(claimRef).catch(()=>{});
    await deleteDoc(lockRef).catch(()=>{});
    throw Object.assign(new Error("Payment request save failed: "+(e?.message||"Permission denied")),{code:e?.code||"permission-denied",stage:"paidAccessRequests"});
   }
   setUtr("");
   setMsg("⏳ Payment request Admin ko bhej di gayi hai. UTR verify hone ke baad exact Profile "+profile+" ka access approve hoga.");
  }catch(e){
   const code=e?.code||"";
   if(code==="already-exists")setMsg("❌ Ye UTR ya payment lock pehle hi use ho chuka hai. Page refresh karke status dekhein.");
   else if(code==="permission-denied")setMsg("❌ Firebase Permission Denied — "+(e?.stage||"payment request")+" ko Firebase Rules ne reject kiya. Details: "+(e?.message||"Permission denied"));
   else if(code==="failed-precondition")setMsg("❌ Firebase configuration/precondition error. Kripya page refresh karke dobara try karein.");
   else if(code==="unavailable")setMsg("❌ Firebase service abhi available nahi hai. Internet check karke dobara try karein.");
   else setMsg("❌ Payment request save nahi hui: "+(e?.message||"Unknown error"));
  }finally{setSaving(false)}
 }

 const photo=profileData?.photos?.[0]||profileData?.photo||"";
 if(user&&approved)return <main><section className="cardPage payment" style={{maxWidth:760,margin:"25px auto"}}><div className="notice">✅ <b>Payment Approved</b><br/>Profile {profile} ka access approve ho gaya hai.<br/><small>Biodata page khola ja raha hai…</small></div></section></main>;

 return <main>
  <header className="siteHeader"><div className="headerInner"><button className="logo" type="button" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA NIKAH</strong><small>Service</small></span></button></div></header>
  <section className="cardPage payment" style={{maxWidth:760,margin:"25px auto"}}>
   <div style={{textAlign:"center"}}>
    <div className="paymentIcon">₹</div><span className="eyebrow">UPI ID + QR PAYMENT</span>
    <h1>₹{amount} {type==="mobile"?"Mobile Number":"Biodata"} Access</h1>
    {photo&&<img src={photo} alt="" className="paymentProfilePhoto"/>}
    <p className="paymentLead">Profile <b>{profile}</b> ke liye exact ₹{amount} payment hai.</p>
   </div>
   <div className="feeRow"><span><small>Exact Access Fee</small><b>₹{amount}</b></span><strong>UPI</strong></div>
   <div className="notice" style={{textAlign:"left"}}><b>⚠️ Payment se pehle</b><br/>Sirf <b>₹{amount}</b> hi pay karein. Payment screen par receiver ka UPI ID/name aur amount check karke hi UPI PIN dalein. QR scan karke payment karte waqt hi PIN use hota hai; kisi ko receive karne ke liye PIN na dein.</div>
   {upiId&&<div className="notice" style={{textAlign:"center"}}><b>1️⃣ UPI ID se Payment</b><br/><div style={{margin:"10px 0",fontSize:18,fontWeight:700,wordBreak:"break-all"}}>{upiId}</div><button type="button" className="primaryAction" onClick={async()=>{try{await navigator.clipboard.writeText(upiId);setMsg("✅ UPI ID copy ho gayi. Ab exact ₹"+amount+" payment karein.")}catch(e){setMsg("⚠️ UPI ID copy nahi ho saki. Manually copy karein.")}}}>📋 UPI ID Copy करें</button></div>}
   {qrUrl&&<div className="qr"><p><b>2️⃣ QR Code se Payment</b></p><img src={qrUrl} alt="UPI QR"/><p><b>QR scan karke exact ₹{amount} pay karein.</b><br/><small>QR save karke doosre phone se bhi scan kar sakte hain.</small></p><button type="button" className="primaryAction" onClick={downloadQr}>⬇️ QR Download करें</button></div>}
   {!upiId&&!qrUrl&&<div className="notice">Admin ne UPI ID aur QR payment set nahi kiya hai.</div>}
   {!user&&<><div className="notice">Payment request bhejne ke liye Google Login zaroori hai. Payment ke baad UTR/Transaction ID submit karein.</div><button type="button" className="primaryAction" onClick={login}>Google se Login →</button></>}
   {user&&!approved&&<>
    {pending&&<div className="notice">⏳ <b>Payment Pending</b><br/>Aapki request Admin verify kar rahe hain. Same profile ke liye dobara payment submit na karein.</div>}
    <div className="paymentForm">
     <label>UTR / Transaction ID
      <input className="adminInput" value={utr} onChange={e=>setUtr(e.target.value)} placeholder={"₹"+amount+" payment ke baad UTR dalein"} autoComplete="off" inputMode="text"/>
     </label>
     <button type="button" className="primaryAction" disabled={saving||!!pending} onClick={submit}>{saving?"Sending...":pending?"Request Pending ⏳":"UTR Send करके Access Request करें →"}</button>
    </div>
    {requests.slice(0,5).map(x=><div className="notice" key={x.id}>₹{x.amount} — <b>{x.status}</b>{x.utr&&" — UTR "+x.utr}</div>)}
   </>}
   {msg&&<div className="messageBox" role="status">{msg}</div>}
   {!approved&&<button type="button" className="backAction" onClick={()=>router.push("/payment?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type))}>← Payment Options पर जाएँ</button>}
  </section>
 </main>;
}

export default function QRRecharge(){
 return <Suspense fallback={<main><section className="cardPage">Loading...</section></main>}><PageBody/></Suspense>
}