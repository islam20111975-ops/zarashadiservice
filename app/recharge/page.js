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
 const [user,setUser]=useState(null),[upiId,setUpiId]=useState(""),[utr,setUtr]=useState("");
 const [requests,setRequests]=useState([]),[profileData,setProfileData]=useState(null),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false);

 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>getDoc(doc(db,"settings","payment")).then(s=>s.exists()&&setUpiId((s.data().upiId||"").trim())).catch(()=>{}),[]);
 useEffect(()=>{
  if(!profile)return;
  getDoc(doc(db,"profiles",profile)).then(s=>setProfileData(s.exists()&&s.data().status!=="deleted"?{id:s.id,...s.data()}:null)).catch(()=>setProfileData(null));
 },[profile]);
 useEffect(()=>{
  if(!user)return;
  let alive=true;
  let timer=null;
  const loadRequests=async()=>{
   try{
    const snap=await getDocs(query(collection(db,"paidAccessRequests"),where("uid","==",user.uid)));
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}))
     .filter(x=>x.profileId===profile&&x.type===type)
     .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    if(alive)setRequests(rows);
   }catch(e){
    if(alive)setMsg("Payment status load nahi ho saka: "+(e?.message||"Unknown error"));
   }
  };
  loadRequests();
  timer=setInterval(loadRequests,3000);
  return()=>{alive=false;if(timer)clearInterval(timer)};
 },[user,profile,type]);

 const approved=requests.some(x=>x.status==="approved");

 async function login(){
  try{await signInWithPopup(auth,new GoogleAuthProvider())}
  catch(e){setMsg("❌ Google Login failed: "+(e?.message||"Please try again."))}
 }

 async function submit(){
  setMsg("");
  if(!user)return setMsg("⚠️ Pehle Google se Login karein.");
  if(!profile)return setMsg("❌ Profile ID missing hai.");
  if(!profileData)return setMsg("❌ Ye profile available nahi hai.");
  if(!upiId)return setMsg("❌ Admin ne UPI ID set nahi ki hai.");
  const clean=utr.trim().replace(/\s+/g,"").toUpperCase();
  if(!clean)return setMsg("⚠️ Payment karne ke baad UTR / Transaction ID yahan zaroor bharein.");
  if(!/^[A-Z0-9]{6,40}$/.test(clean))return setMsg("⚠️ Sahi UTR / Transaction ID bhariye (6–40 letters/numbers).");
  if(requests.some(x=>x.status==="pending"))return setMsg("⏳ Is profile ka payment request already Pending hai. Admin verification ka wait karein.");
  if(requests.some(x=>x.status==="approved"))return setMsg("✅ Is profile ka access pehle hi approved hai.");
  setSaving(true);
  try{
   const lockId=user.uid+"_"+profile+"_"+type;
   const lockRef=doc(db,"pendingPaymentLocks",lockId);
   const reqRef=doc(collection(db,"paidAccessRequests"));
   const claimRef=doc(db,"paymentUtrClaims",clean.toLowerCase());
   try{
    await setDoc(lockRef,{uid:user.uid,profileId:profile,type,kind:"access",amount,status:"pending",requestId:reqRef.id,createdAt:serverTimestamp()});
    try{await setDoc(claimRef,{uid:user.uid,utr:clean,kind:"access",profileId:profile,type,amount,requestId:reqRef.id,createdAt:serverTimestamp()});}
    catch(e){try{await deleteDoc(lockRef)}catch{};throw Object.assign(e,{stage:"UTR claim"})}
    try{await setDoc(reqRef,{uid:user.uid,profileId:profile,type,amount,status:"pending",paymentMethod:"upi",utr:clean,utrClaimId:claimRef.id,lockId:lockRef.id,createdAt:serverTimestamp()});}
    catch(e){try{await deleteDoc(claimRef);await deleteDoc(lockRef)}catch{};throw Object.assign(e,{stage:"payment request"})}
   }catch(e){throw Object.assign(e,{stage:e?.stage||"payment lock"})}
   setUtr("");
   setMsg("⏳ Payment request Admin ko bhej di gayi hai. UTR verify hone ke baad exact Profile "+profile+" ka access approve hoga.");
  }catch(e){
   const code=e?.code||"";
   if(code==="already-exists")setMsg("❌ Ye UTR ya payment lock pehle hi use ho chuka hai. Page refresh karke status dekhein.");
   else if(code==="permission-denied")setMsg("❌ Firebase Permission Denied — "+(e?.stage||"payment request")+" ko Firebase Rules ne reject kiya. Details: "+(e?.message||"Permission denied"));
   else if(code==="failed-precondition")setMsg("❌ Firebase precondition/configuration error. Page refresh karke dobara try karein.");
   else if(code==="unavailable")setMsg("❌ Firebase service abhi available nahi hai. Internet check karke dobara try karein.");
   else setMsg("❌ Payment request save nahi hui: "+(e?.message||"Unknown error"));
  }finally{setSaving(false)}
 }

 const link=upiId?"upi://pay?pa="+encodeURIComponent(upiId)+"&pn="+encodeURIComponent("Zara Nikah Service")+"&am="+amount+"&cu=INR":"";
 const photo=profileData?.photos?.[0]||profileData?.photo||"";
 const pending=requests.find(x=>x.status==="pending");
 return <main>
  <header className="siteHeader"><div className="headerInner"><button className="logo" type="button" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA NIKAH</strong><small>Service</small></span></button></div></header>
  <section className="cardPage payment" style={{maxWidth:760,margin:"25px auto"}}>
   <div style={{textAlign:"center"}}>
    <div className="paymentIcon">₹</div><span className="eyebrow">DIRECT UPI PAYMENT</span>
    <h1>₹{amount} {type==="mobile"?"Mobile Number":"Biodata"} Access</h1>
    {photo&&<img src={photo} alt="" className="paymentProfilePhoto"/>}
    <p className="paymentLead">Profile <b>{profile}</b> ke liye exact ₹{amount} payment hai.</p>
   </div>
   {!user&&<><div className="notice">Payment request bhejne ke liye Google Login zaroori hai.</div><button type="button" className="primaryAction" onClick={login}>Google se Login →</button></>}
   {user&&<>
    <div className="feeRow"><span><small>Exact Access Fee</small><b>₹{amount}</b></span><strong>UPI</strong></div>
    {pending&&<div className="notice">⏳ <b>Payment Pending</b><br/>Aapki request Admin verify kar rahe hain. Same profile ke liye dobara payment submit na karein.</div>}
    {approved&&<div className="notice">✅ <b>Payment Approved</b><br/>Profile {profile} ka access approve ho gaya hai.</div>}
    {approved&&<button type="button" className="primaryAction" onClick={()=>router.push("/profile/"+encodeURIComponent(profile))}>💍 Profile {profile} खोलें →</button>}
    {upiId?<a className="primaryAction payLink" href={link}>📱 ₹{amount} UPI से Pay करें →</a>:<div className="notice">Admin ne UPI ID set nahi ki hai.</div>}
    <div className="paymentForm">
     <label>UTR / Transaction ID
      <input className="adminInput" value={utr} onChange={e=>setUtr(e.target.value)} placeholder={"₹"+amount+" payment ke baad UTR dalein"} autoComplete="off" inputMode="text"/>
     </label>
     <button type="button" className="primaryAction" disabled={saving||!!pending} onClick={submit}>{saving?"Sending...":pending?"Request Pending ⏳":"UTR Send करके Access Request करें →"}</button>
    </div>
    {requests.slice(0,5).map(x=><div className="notice" key={x.id}>₹{x.amount} — <b>{x.status}</b>{x.utr&&" — UTR "+x.utr}</div>)}
   </>}
   {msg&&<div className="messageBox" role="status">{msg}</div>}
   <button type="button" className="backAction" onClick={()=>router.push("/payment?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type))}>← Payment Options पर जाएँ</button>
  </section>
 </main>;
}
export default function Recharge(){
 return <Suspense fallback={<main><section className="cardPage">Loading...</section></main>}><PageBody/></Suspense>
}