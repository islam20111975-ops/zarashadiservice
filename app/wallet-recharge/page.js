"use client";

import {useEffect,useState} from "react";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {doc,getDoc,collection,onSnapshot,query,where,serverTimestamp,writeBatch} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

const RECHARGE_OPTIONS=[100,500,1000];

export default function WalletRecharge(){
 const [user,setUser]=useState(null),[profile,setProfile]=useState({name:"",phone:""}),[wallet,setWallet]=useState(0);
 const [payment,setPayment]=useState({upiId:"",qrUrl:""}),[amount,setAmount]=useState(100),[method,setMethod]=useState("upi"),[utr,setUtr]=useState("");
 const [requests,setRequests]=useState([]),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false),[loginError,setLoginError]=useState("");

 useEffect(()=>onAuthStateChanged(auth,async u=>{
  setUser(u);
  if(!u)return;
  const s=await getDoc(doc(db,"users",u.uid));
  if(s.exists())setProfile({name:s.data().name||"",phone:s.data().phone||""});
  getDoc(doc(db,"settings","payment")).then(s=>s.exists()&&setPayment({upiId:(s.data().upiId||"").trim(),qrUrl:s.data().qrUrl||""})).catch(()=>{});
 }),[]);

 useEffect(()=>{
  if(!user)return;
  const unsubUser=onSnapshot(doc(db,"users",user.uid),s=>{if(s.exists())setWallet(Number(s.data().walletBalance||0))});
  const unsubReq=onSnapshot(query(collection(db,"walletRechargeRequests"),where("uid","==",user.uid)),s=>{
   setRequests(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));
  });
  return()=>{unsubUser();unsubReq()};
 },[user]);

 async function recharge(e){
  e.preventDefault();setMsg("");
  const n=Number(amount),clean=utr.trim().replace(/\s+/g,"").toUpperCase();
  if(!user)return setMsg("Pehle Google se Login karein.");
  if(!RECHARGE_OPTIONS.includes(n))return setMsg("₹100, ₹500 या ₹1000 select करें.");
  if(method==="upi"&&!payment.upiId)return setMsg("Admin ne UPI ID set nahi ki hai.");
  if(method==="qr"&&!payment.qrUrl)return setMsg("Admin ne QR payment set nahi kiya hai.");
  if(!clean)return setMsg("Payment ke baad UTR / Transaction ID zaroor dalein.");
  if(!/^[A-Z0-9]{6,40}$/.test(clean))return setMsg("Sahi UTR / Transaction ID bhariye (6–40 letters/numbers).");
  const existing= requests.find(x=>x.status==="pending"&&Number(x.amount)===n);
  if(existing)return setMsg("⏳ Is amount ka recharge already Pending hai. Admin verification ka wait karein.");
  setSaving(true);
  try{
   const batch=writeBatch(db);
   const reqRef=doc(collection(db,"walletRechargeRequests"));
   const lockRef=doc(db,"pendingPaymentLocks",user.uid+"_recharge_"+n);
   const claimRef=doc(db,"paymentUtrClaims",clean.toLowerCase());
   batch.set(lockRef,{uid:user.uid,kind:"recharge",amount:n,status:"pending",requestId:reqRef.id,createdAt:serverTimestamp()});
   batch.set(claimRef,{uid:user.uid,utr:clean,kind:"recharge",amount:n,requestId:reqRef.id,createdAt:serverTimestamp()});
   batch.set(reqRef,{uid:user.uid,email:user.email||"",name:profile.name||"",phone:profile.phone||"",amount:n,utr:clean,status:"pending",paymentMethod:method,utrClaimId:claimRef.id,lockId:lockRef.id,createdAt:serverTimestamp()});
   await batch.commit();
   setUtr("");
   setMsg("⏳ Recharge request Admin ko bhej di gayi hai. UTR verify hone ke baad ₹"+n+" Wallet me add hoga.");
  }catch(e){
   const code=e?.code||"";
   if(code==="already-exists"||code==="permission-denied")setMsg("❌ Recharge save nahi hua. Is amount ka request already pending ho sakta hai; status check karke dobara try karein.");
   else setMsg("❌ Recharge request save nahi hui: "+(e?.message||"Unknown error"));
  }finally{setSaving(false)}
 }

 const upiLink=payment.upiId?"upi://pay?pa="+encodeURIComponent(payment.upiId)+"&pn="+encodeURIComponent("Zara Shadi Service")+"&am="+amount+"&cu=INR":"";
 const pending=requests.filter(x=>x.status==="pending");
 if(!user)return <main><section className="cardPage" style={{maxWidth:520,margin:"25px auto",textAlign:"center"}}><div className="adminIcon">💰</div><h1>Wallet Recharge</h1><p>Recharge करने के लिए Google से Login करें.</p><button type="button" className="primaryAction" onClick={async()=>{setLoginError("");try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setLoginError(e?.message||"Google Login nahi ho saka.")}}}>Google se Login →</button>{loginError&&<div className="errorBox">{loginError}</div>}</section></main>;

 return <main><section className="cardPage" style={{maxWidth:620,margin:"25px auto"}}>
  <div style={{textAlign:"center"}}><span className="eyebrow">WALLET RECHARGE</span><h1>💰 Wallet में पैसे जमा करें</h1><p className="small">Current Wallet Balance: <b>₹{wallet}</b></p></div>
  <div className="adminBox">
   <h3>Recharge Amount Select करें</h3>
   <div className="rechargeOptions" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,margin:"14px 0"}}>
    {RECHARGE_OPTIONS.map(n=><button type="button" key={n} onClick={()=>{setAmount(n);setMsg("")}} style={{padding:"14px 8px",borderRadius:14,border:amount===n?"2px solid #111":"1px solid #ddd",background:amount===n?"#f3f3f3":"#fff",fontWeight:800,cursor:"pointer"}}>₹{n}<small style={{display:"block",fontWeight:500,marginTop:3}}>{amount===n?"Selected":"Select"}</small></button>)}
   </div>
   <div className="feeRow"><span><small>Selected Amount</small><b>₹{amount}</b></span><strong>{method==="upi"?"UPI":"QR"}</strong></div>
   <div className="rechargeOptions" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,margin:"14px 0"}}>
    <button type="button" onClick={()=>setMethod("upi")} style={{padding:"13px",borderRadius:14,border:method==="upi"?"2px solid #111":"1px solid #ddd",fontWeight:800}}>📱 UPI Payment</button>
    <button type="button" onClick={()=>setMethod("qr")} style={{padding:"13px",borderRadius:14,border:method==="qr"?"2px solid #111":"1px solid #ddd",fontWeight:800}}>▣ QR Payment</button>
   </div>
   {method==="upi"?(payment.upiId?<a className="primaryAction payLink" href={upiLink}>📱 ₹{amount} UPI से Pay करें →</a>:<div className="notice">अभी UPI payment उपलब्ध नहीं है.</div>)
    :(payment.qrUrl?<div style={{textAlign:"center"}}><p className="small">QR scan karke exact ₹{amount} payment karein.</p>{payment.upiId&&<p className="small"><b>UPI ID:</b> {payment.upiId}</p>}<img src={payment.qrUrl} alt="UPI QR" style={{display:"block",width:"min(100%,300px)",margin:"12px auto",borderRadius:18}}/></div>:<div className="notice">अभी QR payment उपलब्ध नहीं है.</div>)}
   <form onSubmit={recharge} className="paymentForm"><label>UTR / Transaction ID<input className="adminInput" value={utr} onChange={e=>setUtr(e.target.value)} placeholder="Payment ka UTR / Transaction ID" autoComplete="off" inputMode="text"/></label><button type="submit" className="primaryAction" disabled={saving||pending.some(x=>Number(x.amount)===Number(amount))}>{saving?"Sending...":pending.some(x=>Number(x.amount)===Number(amount))?"Request Pending ⏳":"💳 Recharge Request भेजें →"}</button></form>
  </div>
  {pending.length>0&&<div className="notice" style={{marginTop:14}}>⏳ <b>आपके recharge request pending हैं</b><br/>Admin payment verify कर रहे हैं. Approval के बाद amount Wallet में add होगा.</div>}
  <div className="adminList" style={{marginTop:14}}><div className="listHead"><h3>🧾 Recharge History</h3><span>{requests.length}</span></div>{requests.slice(0,20).map(x=><div className="adminRow" key={x.id}><span><b>₹{x.amount} • {x.status}</b><small>💳 Method: {(x.paymentMethod||"upi").toUpperCase()} • UTR: {x.utr||"-"}</small></span></div>)}</div>
  {msg&&<div className="messageBox" role="status">{msg}</div>}
  <button type="button" className="backAction" onClick={()=>location.href="/account"}>← My Account पर जाएँ</button>
 </section></main>;
}