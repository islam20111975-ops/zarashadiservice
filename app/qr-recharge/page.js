"use client";
import {Suspense,useEffect,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,onSnapshot,query,serverTimestamp,writeBatch,where} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";
const OPTIONS=[100,500,1000];
function QRRecharge(){
 const q=useSearchParams(),router=useRouter(),profile=q.get("profile")||"",type=q.get("type")==="mobile"?"mobile":"biodata";
 const [user,setUser]=useState(null),[payment,setPayment]=useState({qrUrl:""}),[amount,setAmount]=useState(100),[utr,setUtr]=useState(""),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false),[sent,setSent]=useState(false),[requests,setRequests]=useState([]);
 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>getDoc(doc(db,"settings","payment")).then(s=>s.exists()&&setPayment(s.data())).catch(()=>{}),[]);
 useEffect(()=>{if(!user)return;return onSnapshot(query(collection(db,"walletRechargeRequests"),where("uid","==",user.uid)),s=>setRequests(s.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).slice(0,10)))},[user]);
 async function login(){try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setMsg(e.message)}}
 async function submit(e){
  e.preventDefault();setMsg("");if(!user)return setMsg("Pehle Google se login karein.");
  const clean=utr.trim().replace(/\s+/g,"").toUpperCase(),n=Number(amount);
  if(!OPTIONS.includes(n))return setMsg("Recharge amount valid nahi hai.");
  if(!/^[A-Z0-9]{6,40}$/.test(clean))return setMsg("Sahi UTR / Transaction ID bhariye.");
  if(requests.some(x=>x.status==="pending"&&Number(x.amount)===n))return setMsg("Is amount ka recharge pehle se Pending hai.");
  setSaving(true);
  try{
   const batch=writeBatch(db),reqRef=doc(collection(db,"walletRechargeRequests")),claimRef=doc(db,"paymentUtrClaims",clean.toLowerCase()),lockRef=doc(db,"pendingPaymentLocks",user.uid+"_recharge_"+n);
   const userSnap=await getDoc(doc(db,"users",user.uid)),ud=userSnap.exists()?userSnap.data():{};
   batch.set(claimRef,{uid:user.uid,utr:clean,kind:"recharge",amount:n,requestId:reqRef.id,createdAt:serverTimestamp()});
   batch.set(lockRef,{uid:user.uid,kind:"recharge",amount:n,requestId:reqRef.id,status:"pending",createdAt:serverTimestamp()});
   batch.set(reqRef,{uid:user.uid,email:user.email||ud.email||"",name:user.displayName||ud.name||"",phone:ud.phone||"",amount:n,utr:clean,status:"pending",paymentMethod:"qr",lockId:lockRef.id,utrClaimId:claimRef.id,createdAt:serverTimestamp()});
   await batch.commit();setSent(true);setMsg("QR payment request Admin ko bhej di gayi hai. Verification ke baad ₹"+n+" Wallet me add hoga.");
  }catch(e){setMsg("Request save nahi hui: "+e.message)}finally{setSaving(false)}
 }
 return <main><header className="siteHeader"><div className="headerInner"><button className="logo" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA SHADI</strong><small>Service</small></span></button></div></header>
 <section className="cardPage payment"><span className="eyebrow">QR WALLET RECHARGE</span><h1>🔳 QR से Recharge करें</h1><p className="paymentLead">Recharge amount चुनें, QR scan करके payment करें और फिर UTR भेजें.</p>
 {!user&&<><div className="notice">Recharge request भेजने के लिए Google Login जरूरी है.</div><button className="primaryAction" onClick={login}>Google se Login →</button></>}
 {user&&<><div className="feeRow"><span><small>Recharge Amount</small><b>₹{amount}</b></span><strong>Wallet में जुड़ेगा</strong></div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,margin:"16px 0"}}>{OPTIONS.map(x=><button key={x} type="button" className="primaryAction" style={{margin:0,opacity:amount===x?1:.65}} onClick={()=>{setAmount(x);setSent(false);setMsg("")}}>₹{x}</button>)}</div>
 <div className="qr" style={{textAlign:"center"}}>{payment.qrUrl?<><img src={payment.qrUrl} alt="UPI QR" style={{maxWidth:280,width:"100%",borderRadius:12}}/><p><b>QR scan करें और UPI app में ₹{amount} amount enter करें.</b></p></>:<small>Admin ne QR set nahi kiya.</small>}</div>
 <form className="paymentForm" onSubmit={submit}><label>UTR / Transaction ID<input className="adminInput" value={utr} onChange={e=>setUtr(e.target.value)} placeholder={"QR payment ke baad ₹"+amount+" ka UTR dalein"}/></label><button className="primaryAction" disabled={saving||sent}>{saving?"Sending...":sent?"Request Sent ✓":"UTR Send करें →"}</button></form>
 {requests.length>0&&<div className="notice"><b>Recent Recharge</b>{requests.map(x=><div key={x.id} style={{marginTop:8}}>₹{x.amount} — {x.status} {x.utr&&"— UTR "+x.utr}</div>)}</div>}</>}
 {msg&&<div className="messageBox">{msg}</div>}<button className="backAction" onClick={()=>router.push("/payment?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type))}>← Payment Options पर जाएँ</button>
 </section></main>;
}
export default function Page(){return <Suspense fallback={<main><section className="cardPage">Loading...</section></main>}><QRRecharge/></Suspense>}
