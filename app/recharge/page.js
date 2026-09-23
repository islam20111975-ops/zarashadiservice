"use client";
import {Suspense,useEffect,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,onSnapshot,query,where,serverTimestamp,writeBatch} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

function RechargePage(){
 const q=useSearchParams(),router=useRouter(),profile=q.get("profile")||"",type=q.get("type")==="mobile"?"mobile":"biodata";
 const [user,setUser]=useState(null),[payment,setPayment]=useState({upiId:""}),[utr,setUtr]=useState(""),[requests,setRequests]=useState([]),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false),[sent,setSent]=useState(false);
 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>{getDoc(doc(db,"settings","payment")).then(s=>s.exists()&&setPayment({upiId:s.data().upiId||""})).catch(()=>{})},[]);
 useEffect(()=>{if(!user)return;return onSnapshot(query(collection(db,"paidAccessRequests"),where("uid","==",user.uid)),s=>setRequests(s.docs.map(d=>({id:d.id,...d.data()}))))},[user]);
 async function login(){try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setMsg(e.message)}}
 async function submit(e){
  e.preventDefault();setMsg("");if(!user)return setMsg("Pehle Google se login karein.");
  const n=type==="mobile"?500:100,clean=utr.trim().replace(/\s+/g,"").toUpperCase();
  
  if(!/^[A-Z0-9]{6,40}$/.test(clean))return setMsg("Sahi UTR / Transaction ID bhariye.");
  if(requests.some(x=>x.status==="pending"))return setMsg("Is profile ka payment request already Pending hai.");if(requests.some(x=>x.status==="approved"))return setMsg("Is profile ka access pehle hi approved hai.");
  setSaving(true);
  try{
   const batch=writeBatch(db),reqRef=doc(collection(db,"paidAccessRequests")),claimRef=doc(db,"paymentUtrClaims",clean.toLowerCase()),lockRef=doc(db,"pendingPaymentLocks",user.uid+"_"+profile+"_"+type);
   
   batch.set(claimRef,{uid:user.uid,utr:clean,kind:"access",profileId:profile,type,amount:n,requestId:reqRef.id,createdAt:serverTimestamp()});
   batch.set(lockRef,{uid:user.uid,kind:"access",profileId:profile,type,amount:n,requestId:reqRef.id,status:"pending",createdAt:serverTimestamp()});
   batch.set(reqRef,{uid:user.uid,profileId:profile,type,amount:n,status:"pending",paymentMethod:"upi",utr:clean,lockId:lockRef.id,utrClaimId:claimRef.id,createdAt:serverTimestamp()});
   await batch.commit();setSent(true);setUtr("");setMsg("⏳ Recharge Pending है। Admin UTR verify करेंगे। Approval के बाद ₹"+n+" आपके Wallet में जुड़ जाएगा।");
  }catch(e){setMsg("Recharge request save nahi hui: "+e.message)}finally{setSaving(false)}
 }
 const upiLink=payment.upiId?"upi://pay?pa="+encodeURIComponent(payment.upiId)+"&pn="+encodeURIComponent("Zara Shadi Service")+"&am="+amount+"&cu=INR":"";
 return <main><header className="siteHeader"><div className="headerInner"><button className="logo" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button></div></header>
 <section className="cardPage" style={{maxWidth:760,margin:"25px auto"}}><div style={{textAlign:"center"}}><div className="paymentIcon">₹</div><span className="eyebrow">DIRECT UPI PAYMENT</span><h1>₹{amount} Access Payment</h1><p>Profile <b>{profile}</b> ke liye exact ₹{type==="mobile"?500:100} payment karein.</p></div>
 {!user&&<><div className="notice">Recharge करने के लिए पहले Google से Login करें.</div><button className="primaryAction" onClick={login}>Google se Login →</button></>}
 {user&&<><div className="adminBox"><span className="eyebrow">EXACT ACCESS FEE</span><h3>₹{type==="mobile"?500:100} Payment</h3>
 
 <div className="feeRow"><span><small>Access Fee</small><b>₹{type==="mobile"?500:100}</b></span><strong>Exact</strong></div>
 {payment.upiId?<a className="primaryAction payLink" href={payment.upiId?"upi://pay?pa="+encodeURIComponent(payment.upiId)+"&pn="+encodeURIComponent("Zara Shadi Service")+"&am="+(type==="mobile"?500:100)+"&cu=INR":"#"}>📱 ₹{type==="mobile"?500:100} UPI से Pay करें →</a>:<div className="notice">Admin ने अभी UPI ID set नहीं की है.</div>}
 <form className="paymentForm" onSubmit={submit}><label>UTR / Transaction ID<input className="adminInput" value={utr} onChange={e=>setUtr(e.target.value)} placeholder={"₹"+(type==="mobile"?500:100)+" payment ka UTR dalein"}/></label><button className="primaryAction" disabled={saving||sent}>{saving?"Sending...":sent?"Recharge Request Sent ✓":"💳 Access Request भेजें →"}</button></form></div>
 {msg&&<div className="messageBox">{msg}</div>}<div className="adminList"><div className="listHead"><h3>🧾 Recent Access Request</h3><span>{requests.length}</span></div>{requests.slice().reverse().slice(0,5).map(x=><div className="adminRow" key={x.id}><span><b>₹{x.amount} • {x.status}</b><small>UTR: {x.utr||"—"}</small></span></div>)}</div></>}
 <button className="backAction" onClick={()=>router.push(profile?"/payment?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type):"/account")}>← वापस जाएँ</button></section></main>;
}
export default function Recharge(){return <Suspense fallback={<main><section className="cardPage">Loading...</section></main>}><RechargePage/></Suspense>}
