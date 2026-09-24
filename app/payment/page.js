"use client";

import {Suspense,useEffect,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,onSnapshot,serverTimestamp,writeBatch} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

function Pay(){
 const q=useSearchParams(),router=useRouter();
 const profile=q.get("profile")||"";
 const type=q.get("type")==="mobile"?"mobile":"biodata";
 const amount=type==="mobile"?500:100;
 const [user,setUser]=useState(null),[p,setP]=useState(null),[wallet,setWallet]=useState(0),[requests,setRequests]=useState([]);
 const [msg,setMsg]=useState(""),[saving,setSaving]=useState(false);

 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>{
  if(!user)return;
  return onSnapshot(doc(db,"users",user.uid),s=>setWallet(s.exists()?Number(s.data().walletBalance||0):0));
 },[user]);
 useEffect(()=>{
  if(!profile)return;
  getDoc(doc(db,"profiles",profile)).then(s=>setP(s.exists()&&s.data().status!=="deleted"?{id:s.id,...s.data()}:null)).catch(()=>setP(null));
 },[profile]);
 useEffect(()=>{
  if(!user)return;
  return onSnapshot(collection(db,"paidAccessRequests"),s=>{
   setRequests(s.docs.map(d=>({id:d.id,...d.data()}))
    .filter(x=>x.uid===user.uid&&x.profileId===profile&&x.type===type)
    .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));
  },e=>setMsg("Payment status load nahi ho saka: "+e.message));
 },[user,profile,type]);

 async function login(){
  try{await signInWithPopup(auth,new GoogleAuthProvider())}
  catch(e){setMsg("❌ Google Login failed: "+(e?.message||"Please try again."))}
 }

 async function payFromWallet(){
  setMsg("");
  if(!user)return setMsg("Pehle Google se login karein.");
  if(!p)return setMsg("Profile available nahi hai.");
  if(requests.some(x=>x.status==="approved"))return setMsg("Is profile ka access pehle hi approved hai.");
  if(requests.some(x=>x.status==="pending"))return setMsg("⏳ Is profile ka payment request already Pending hai. Admin verification ka wait karein.");
  if(wallet<amount)return setMsg("Wallet Balance ₹"+wallet+" hai. ₹"+amount+" available nahi hai. Pehle Wallet Recharge karein.");
  setSaving(true);
  try{
   const accessRef=doc(db,type==="biodata"?"biodataUnlocks":"mobileAccess",user.uid+"_"+profile);
   const accessSnap=await getDoc(accessRef);
   if(accessSnap.exists()&&accessSnap.data().status==="approved")return setMsg("Is profile ka access pehle hi approved hai.");
   const batch=writeBatch(db);
   const reqRef=doc(collection(db,"paidAccessRequests"));
   const lockRef=doc(db,"pendingPaymentLocks",user.uid+"_"+profile+"_"+type);
   batch.set(lockRef,{uid:user.uid,profileId:profile,type,kind:"access",amount,status:"pending",requestId:reqRef.id,createdAt:serverTimestamp()});
   batch.set(reqRef,{uid:user.uid,profileId:profile,type,amount,status:"pending",paymentMethod:"wallet",utr:"",lockId:lockRef.id,createdAt:serverTimestamp()});
   await batch.commit();
   setMsg("💰 Wallet payment request Admin ko bhej di gayi hai. Approval ke baad ₹"+amount+" Wallet se deduct hoga aur exact Profile "+profile+" unlock hoga.");
  }catch(e){
   const code=e?.code||"";
   if(code==="permission-denied"||code==="already-exists")setMsg("❌ Request save nahi hui. Is profile ki request already pending ho sakti hai. Status check karke dobara try karein.");
   else setMsg("❌ Wallet request save nahi hui: "+(e?.message||"Unknown error"));
  }finally{setSaving(false)}
 }

 const photo=p?.photos?.[0]||p?.photo||"";
 const pending=requests.find(x=>x.status==="pending");
 const approved=requests.find(x=>x.status==="approved");
 return <main className="paymentPage">
  <header className="siteHeader"><div className="headerInner"><button className="logo" type="button" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button></div></header>
  <section className="payment paymentPremium cardPage">
   <div className="paymentIcon">₹</div><span className="eyebrow">{type==="mobile"?"MOBILE ACCESS":"BIODATA UNLOCK"}</span>
   <h1>₹{amount} {type==="mobile"?"Mobile Number":"Biodata"} Access</h1>
   {photo&&<img src={photo} alt="" className="paymentProfilePhoto"/>}
   <p className="paymentLead">Profile <b>{profile||"—"}</b> ke liye exact access request hai.</p>
   {!profile&&<div className="errorBox">Profile ID missing hai.</div>}
   {!user&&<><div className="notice">Access lene ke liye pehle Google se Login karein.</div><button type="button" className="primaryAction" onClick={login}>Google se Login →</button></>}
   {user&&profile&&<>
    {approved&&<div className="notice">✅ Is profile ka access approved hai. Biodata page khol rahe hain...</div>}
    {pending&&<div className="notice">⏳ <b>Payment Pending</b><br/>Admin payment verify kar rahe hain. Same profile ke liye dobara payment submit na karein.</div>}
    {!pending&&!approved&&<>
     <div className="feeRow"><span><small>Access Fee</small><b>₹{amount}</b></span><strong>3 Payment Options</strong></div>
     <div className="paymentOptions">
      <button type="button" className="primaryAction paymentOption" onClick={()=>router.push("/recharge?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type))}>📱 UPI से ₹{amount} करें →</button>
      <button type="button" className="primaryAction paymentOption" onClick={()=>router.push("/qr-recharge?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type))}>🔳 QR से ₹{amount} करें →</button>
     </div>
     <div className="walletPanel"><div className="walletTop"><span>💰 Wallet Balance</span><b>₹{wallet}</b></div><small>Wallet se ₹{amount} pay karke access request bhejein.</small></div>
     <button type="button" className="primaryAction walletButton" onClick={payFromWallet} disabled={saving||!p||wallet<amount}>
      {saving?"Sending...":"💰 Wallet से ₹"+amount+" करें →"}
     </button>
     {wallet<amount&&<div className="notice">Wallet balance kam hai. Pehle Wallet Recharge karke phir access request bhejein.</div>}
    </>}
   </>}
   {requests.slice(0,5).map(x=><div className="notice" key={x.id}>₹{x.amount} — <b>{x.status}</b>{x.paymentMethod&&" — "+x.paymentMethod.toUpperCase()}{x.utr&&" — UTR "+x.utr}</div>)}
   {msg&&<div className="messageBox" role="status">{msg}</div>}
   <button type="button" className="backAction" onClick={()=>router.push("/profile/"+encodeURIComponent(profile))}>← Biodata पर जाएँ</button>
  </section>
 </main>;
}
export default function Payment(){
 return <Suspense fallback={<main><section className="cardPage">Loading...</section></main>}><Pay/></Suspense>
}