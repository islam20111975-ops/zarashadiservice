"use client";

import {Suspense,useEffect,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,onSnapshot,query,where,serverTimestamp,writeBatch} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

function Pay(){
  const q=useSearchParams(),router=useRouter();
  const profile=q.get("profile")||"", type=q.get("type")==="mobile"?"mobile":"biodata";
  const amount=type==="mobile"?500:100;
  const [user,setUser]=useState(null),[p,setP]=useState(null),[pay,setPay]=useState({upiId:"",qrUrl:""}),[wallet,setWallet]=useState(0);
  const [utr,setUtr]=useState(""),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false),[sent,setSent]=useState(false),[walletSent,setWalletSent]=useState(false);

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{
    if(!user)return;
    return onSnapshot(doc(db,"users",user.uid),s=>setWallet(s.exists()?Number(s.data().walletBalance||0):0));
  },[user]);
  useEffect(()=>{
    if(profile)getDoc(doc(db,"profiles",profile)).then(s=>setP(s.exists()?{id:s.id,...s.data()}:null));
    getDoc(doc(db,"settings","payment")).then(s=>s.exists()&&setPay(s.data())).catch(()=>{});
  },[profile]);

  async function login(){try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setMsg(e.message)}}
  async function submit(e){
    e.preventDefault();setMsg("");
    if(!user)return setMsg("Pehle Google se login karein.");
    if(!p)return setMsg("Profile available nahi hai.");
    const clean=utr.trim().replace(/\s+/g,"").toUpperCase();
    if(!/^[A-Z0-9]{6,40}$/.test(clean))return setMsg("Sahi UTR / Transaction ID bhariye.");
    setSaving(true);
    try{
      const batch=writeBatch(db);const reqRef=doc(collection(db,"paidAccessRequests"));const claimRef=doc(db,"paymentUtrClaims",clean.toLowerCase());const lockRef=doc(db,"pendingPaymentLocks",user.uid+"_"+profile+"_"+type);batch.set(claimRef,{uid:user.uid,utr:clean,kind:"access",requestId:reqRef.id,createdAt:serverTimestamp()});batch.set(lockRef,{uid:user.uid,profileId:profile,type,kind:"access",requestId:reqRef.id,status:"pending",createdAt:serverTimestamp()});batch.set(reqRef,{
        uid:user.uid,profileId:profile,type,amount,status:"pending",
        paymentMethod:"upi",utr:clean,createdAt:serverTimestamp()
      });await batch.commit();
      setSent(true);setMsg("Payment request Admin ko bhej di gayi hai. Verification ke baad access milega.");
    }catch(e){setMsg("Request save nahi hui: "+e.message)}finally{setSaving(false)}
  }
  async function payFromWallet(){
    setMsg("");
    if(!user)return setMsg("Pehle Google se login karein.");
    if(!p)return setMsg("Profile available nahi hai.");
    if(wallet<amount)return setMsg("Wallet Balance ₹"+wallet+" hai. ₹"+amount+" available nahi hai. Pehle Wallet Recharge karein.");
    setSaving(true);
    try{
      const batch=writeBatch(db);const reqRef=doc(collection(db,"paidAccessRequests"));const lockRef=doc(db,"pendingPaymentLocks",user.uid+"_"+profile+"_"+type);batch.set(lockRef,{uid:user.uid,profileId:profile,type,kind:"access",requestId:reqRef.id,status:"pending",createdAt:serverTimestamp()});batch.set(reqRef,{
        uid:user.uid,profileId:profile,type,amount,status:"pending",
        paymentMethod:"wallet",utr:"",createdAt:serverTimestamp()
      });await batch.commit();
      setWalletSent(true);
      setMsg("💰 Wallet payment request Admin ko bhej di gayi hai. Verification ke baad access milega aur ₹"+amount+" Wallet se deduct hoga.");
    }catch(e){setMsg("Wallet request save nahi hui: "+e.message)}finally{setSaving(false)}
  }
  const photo=p?.photos?.[0]||p?.photo||"";
  return <main><header className="siteHeader"><div className="headerInner"><button className="logo" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button></div></header>
    <section className="payment cardPage">
      <div className="paymentIcon">₹</div><span className="eyebrow">{type==="mobile"?"MOBILE ACCESS":"BIODATA UNLOCK"}</span>
      <h1>₹{amount} {type==="mobile"?"Mobile Number":"Biodata"} Access</h1>
      {photo&&<img src={photo} alt="" style={{width:130,height:160,objectFit:"cover",borderRadius:20,display:"block",margin:"15px auto"}}/>}
      <p className="paymentLead">Profile <b>{profile}</b> ke liye exact access request hai.</p>
      {!user&&<><div className="notice">Access lene ke liye pehle Google se Login karein.</div><button className="primaryAction" onClick={login}>Google se Login →</button></>}
      {user&&<><div className="feeRow"><span><small>Payment</small><b>UPI / QR</b></span><strong>₹{amount}</strong></div>
      <div className="notice" style={{marginTop:12}}>💰 <b>Wallet Balance: ₹{wallet}</b><br/>Wallet se ₹{amount} pay karna ho to neeche button use karein.</div>
      <button type="button" className="primaryAction" onClick={payFromWallet} disabled={saving||walletSent}>{walletSent?"Wallet Request Sent ✓":"💰 Wallet se ₹"+amount+" Pay करें →"}</button>
      <div className="qr">{pay.qrUrl?<img src={pay.qrUrl} alt="UPI QR" style={{maxWidth:250,width:"100%"}}/>:<small>Admin ne QR set nahi kiya.</small>}</div>
      {pay.upiId&&<a className="primaryAction payLink" href={`upi://pay?pa=${encodeURIComponent(pay.upiId)}&pn=Zara%20Shadi%20Service&am=${amount}&cu=INR`}>📱 ₹{amount} UPI से Pay करें →</a>}
      <form className="paymentForm" onSubmit={submit}><label>UTR / Transaction ID<input className="adminInput" value={utr} onChange={e=>setUtr(e.target.value)} placeholder="Payment ke baad UTR dalein"/></label><button className="primaryAction" disabled={saving||sent}>{saving?"Sending...":sent?"Request Sent ✓":"UTR Send करें →"}</button></form></>}
      {msg&&<div className="messageBox">{msg}</div>}
      <button className="backAction" onClick={()=>router.push("/profile/"+encodeURIComponent(profile))}>← Biodata पर जाएँ</button>
    </section></main>;
}
export default function Payment(){return <Suspense fallback={<main><section className="cardPage">Loading...</section></main>}><Pay/></Suspense>}
