"use client";

import {Suspense,useEffect,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {doc,getDoc,onSnapshot} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

function Pay(){
  const q=useSearchParams(),router=useRouter();
  const profile=q.get("profile")||"", type=q.get("type")==="mobile"?"mobile":"biodata";
  const amount=type==="mobile"?500:100;
  const [user,setUser]=useState(null),[p,setP]=useState(null),[wallet,setWallet]=useState(0);
  const [msg,setMsg]=useState(""),[saving,setSaving]=useState(false),[walletSent,setWalletSent]=useState(false);

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{
    if(!user)return;
    return onSnapshot(doc(db,"users",user.uid),s=>setWallet(s.exists()?Number(s.data().walletBalance||0):0));
  },[user]);
  useEffect(()=>{
    if(profile)getDoc(doc(db,"profiles",profile)).then(s=>setP(s.exists()&&s.data().status!=="deleted"?{id:s.id,...s.data()}:null));
  },[profile]);

  async function login(){try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setMsg(e.message)}}

  async function payFromWallet(){
    setMsg("");
    if(!user)return setMsg("Pehle Google se login karein.");
    if(!p)return setMsg("Profile available nahi hai.");
    const {getDoc}=await import("firebase/firestore");
    const accessRef=doc(db,type==="biodata"?"biodataUnlocks":"mobileAccess",user.uid+"_"+profile);
    const accessSnap=await getDoc(accessRef);
    if(accessSnap.exists()&&accessSnap.data().status==="approved")return setMsg("Is profile ka access pehle hi approved hai.");
    if(wallet<amount)return setMsg("Wallet Balance ₹"+wallet+" hai. ₹"+amount+" available nahi hai. Pehle Wallet Recharge karein.");
    setSaving(true);
    try{
      const {collection,doc:makeDoc,serverTimestamp,writeBatch}=await import("firebase/firestore");
      const batch=writeBatch(db);
      const reqRef=makeDoc(collection(db,"paidAccessRequests"));
      const lockRef=makeDoc(db,"pendingPaymentLocks",user.uid+"_"+profile+"_"+type);
      batch.set(lockRef,{uid:user.uid,profileId:profile,type,kind:"access",amount,status:"pending",requestId:reqRef.id,createdAt:serverTimestamp()});
      batch.set(reqRef,{uid:user.uid,profileId:profile,type,amount,status:"pending",paymentMethod:"wallet",utr:"",lockId:lockRef.id,createdAt:serverTimestamp()});
      await batch.commit();
      setWalletSent(true);
      setMsg("💰 Wallet payment request Admin ko bhej di gayi hai. Approval ke baad access milega aur ₹"+amount+" Wallet se deduct hoga.");
    }catch(e){setMsg("Wallet request save nahi hui: "+e.message)}finally{setSaving(false)}
  }

  const photo=p?.photos?.[0]||p?.photo||"";
  return <main className="paymentPage"><header className="siteHeader"><div className="headerInner"><button className="logo" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button></div></header>
    <section className="payment paymentPremium cardPage">
      <div className="paymentIcon">₹</div><span className="eyebrow">{type==="mobile"?"MOBILE ACCESS":"BIODATA UNLOCK"}</span>
      <h1>₹{amount} {type==="mobile"?"Mobile Number":"Biodata"} Access</h1>
      {photo&&<img src={photo} alt="" className="paymentProfilePhoto"/>}
      <p className="paymentLead">Profile <b>{profile}</b> ke liye exact access request hai.</p>
      {!user&&<><div className="notice">Access lene ke liye pehle Google se Login karein.</div><button className="primaryAction" onClick={login}>Google se Login →</button></>}
      {user&&<>
        <div className="feeRow"><span><small>Access Fee</small><b>₹{amount}</b></span><strong>3 Payment Options</strong></div>
        <div className="paymentOptions"><button type="button" className="primaryAction paymentOption" onClick={()=>router.push("/recharge?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type))}>
          📱 UPI से ₹{amount} करें →
        </button>
        <button type="button" className="primaryAction paymentOption" onClick={()=>router.push("/qr-recharge?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type))}>
          🔳 QR से ₹{amount} करें →
        </button></div>
        <div className="walletPanel"><div className="walletTop"><span>💰 Wallet Balance</span><b>₹{wallet}</b></div><small>Wallet se ₹{amount} pay karke access request bhejein.</small></div>
        <button type="button" className="primaryAction walletButton" onClick={payFromWallet} disabled={saving||walletSent}>
          {walletSent?"✓ Request Sent — Approval Pending":"💰 Wallet से ₹"+amount+" करें →"}
        </button>
      </>}
      {msg&&<div className="messageBox">{msg}</div>}
      <button className="backAction" onClick={()=>router.push("/profile/"+encodeURIComponent(profile))}>← Biodata पर जाएँ</button>
    </section></main>;
}
export default function Payment(){return <Suspense fallback={<main><section className="cardPage">Loading...</section></main>}><Pay/></Suspense>}
