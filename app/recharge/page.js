"use client";

import {Suspense,useEffect,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,onSnapshot,query,where,serverTimestamp,writeBatch,deleteDoc} from "firebase/firestore";
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
  return onSnapshot(query(collection(db,"paidAccessRequests"),where("uid","==",user.uid)),s=>{
   setRequests(s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.profileId===profile&&x.type===type).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));
  },e=>setMsg("Payment status load nahi ho saka: "+e.message));
 },[user,profile,type]);
 useEffect(()=>{
  if(!user||!profile)return;
  return onSnapshot(doc(db,type==="mobile"?"mobileAccess":"biodataUnlocks",user.uid+"_"+profile),s=>{
   if(s.exists()&&s.data().status==="approved")router.replace("/profile/"+encodeURIComponent(profile));
  });
 },[user,profile,type,router]);

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
   const accessRef=doc(db,type==="mobile"?"mobileAccess":"biodataUnlocks",user.uid+"_"+profile);
   const accessSnap=await getDoc(accessRef);
   if(accessSnap.exists()&&accessSnap.data().status==="approved")return setMsg("✅ Is profile ka access pehle hi approved hai.");
   const lockId=user.uid+"_"+profile+"_"+type;
   const lockRef=doc(db,"pendingPaymentLocks",lockId);
   const lockSnap=await getDoc(lockRef);
   if(lockSnap.exists()){
    const oldLock=lockSnap.data()||{};
    if(oldLock.status==="pending"&&oldLock.requestId){
     const oldReqSnap=await getDoc(doc(db,"paidAccessRequests",oldLock.requestId));
     if(oldReqSnap.exists()&&oldReqSnap.data()?.status==="pending")
      return setMsg("⏳ Is profile ka payment request pehle se Admin ke paas Pending hai. Dobara payment submit na karein.");
     await deleteDoc(lockRef);
    }else{
     return setMsg("⏳ Is profile ki payment request already process ho rahi hai. Page refresh karke status dekhein.");
    }
   }
   const batch=writeBatch(db);
   const reqRef=doc(collection(db,"paidAccessRequests"));

   const claimRef=doc(db,"paymentUtrClaims",clean.toLowerCase());
   batch.set(lockRef,{uid:user.uid,profileId:profile,type,kind:"access",amount,status:"pending",requestId:reqRef.id,createdAt:serverTimestamp()});
   batch.set(claimRef,{uid:user.uid,utr:clean,kind:"access",profileId:profile,type,amount,requestId:reqRef.id,createdAt:serverTimestamp()});
   batch.set(reqRef,{uid:user.uid,profileId:profile,type,amount,status:"pending",paymentMethod:"upi",utr:clean,utrClaimId:claimRef.id,lockId:lockRef.id,createdAt:serverTimestamp()});
   await batch.commit();
   setUtr("");
   setMsg("⏳ Payment request Admin ko bhej di gayi hai. UTR verify hone ke baad exact Profile "+profile+" ka access approve hoga.");
  }catch(e){
   const code=e?.code||"";
   if(code==="already-exists")setMsg("❌ Ye UTR ya payment lock pehle hi use ho chuka hai. Page refresh karke status dekhein.");
   else if(code==="permission-denied")setMsg("❌ Firebase Rules ne request reject ki. Latest firestore.rules Firebase Console me Publish karein.");
   else if(code==="failed-precondition")setMsg("❌ Firebase precondition/configuration error. Page refresh karke dobara try karein.");
   else if(code==="unavailable")setMsg("❌ Firebase service abhi available nahi hai. Internet check karke dobara try karein.");
   else setMsg("❌ Payment request save nahi hui: "+(e?.message||"Unknown error"));
  }finally{setSaving(false)}
 }

 const link=upiId?"upi://pay?pa="+encodeURIComponent(upiId)+"&pn="+encodeURIComponent("Zara Shadi Service")+"&am="+amount+"&cu=INR":"";
 const photo=profileData?.photos?.[0]||profileData?.photo||"";
 const pending=requests.find(x=>x.status==="pending");
 return <main>
  <header className="siteHeader"><div className="headerInner"><button className="logo" type="button" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button></div></header>
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