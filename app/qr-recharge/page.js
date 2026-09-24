"use client";
import {Suspense,useEffect,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,onSnapshot,query,where,serverTimestamp,writeBatch} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

function PageBody(){
 const q=useSearchParams(),router=useRouter(),profile=q.get("profile")||"",type=q.get("type")==="mobile"?"mobile":"biodata",amount=type==="mobile"?500:100;
 const [user,setUser]=useState(null),[qrUrl,setQrUrl]=useState(""),[utr,setUtr]=useState(""),[requests,setRequests]=useState([]),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false),[sent,setSent]=useState(false);

 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>getDoc(doc(db,"settings","payment")).then(s=>s.exists()&&setQrUrl(s.data().qrUrl||"")).catch(()=>{}),[]);

 useEffect(()=>{
  if(!user)return;
  return onSnapshot(
   query(collection(db,"paidAccessRequests"),where("uid","==",user.uid)),
   s=>setRequests(
    s.docs.map(d=>({id:d.id,...d.data()}))
     .filter(x=>x.profileId===profile&&x.type===type)
     .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))
     .slice(0,5)
   )
  );
 },[user,profile,type]);

 useEffect(()=>{
  if(!user||!profile)return;
  return onSnapshot(
   doc(db,type==="mobile"?"mobileAccess":"biodataUnlocks",user.uid+"_"+profile),
   s=>{
    if(s.exists()&&s.data().status==="approved"){
     router.replace("/profile/"+encodeURIComponent(profile));
    }
   }
  );
 },[user,profile,type,router]);

 async function login(){
  try{await signInWithPopup(auth,new GoogleAuthProvider())}
  catch(e){setMsg("❌ Google Login failed: "+(e?.message||"Please try again."))}
 }

 async function submit(){
  setMsg("");

  if(!user){
   setMsg("⚠️ Pehle Google se Login karein.");
   return;
  }
  if(!profile){
   setMsg("❌ Profile ID missing hai.");
   return;
  }
  if(!qrUrl){
   setMsg("❌ Admin ne QR payment set nahi kiya hai.");
   return;
  }

  const clean=utr.trim().replace(/\s+/g,"").toUpperCase();

  if(!clean){
   setMsg("⚠️ Payment karne ke baad UTR / Transaction ID yahan zaroor bharein.");
   return;
  }
  if(!/^[A-Z0-9]{6,40}$/.test(clean)){
   setMsg("⚠️ Sahi UTR / Transaction ID bhariye (6–40 letters/numbers).");
   return;
  }

  setSaving(true);

  try{
   const accessRef=doc(db,type==="mobile"?"mobileAccess":"biodataUnlocks",user.uid+"_"+profile);
   const existingAccess=await getDoc(accessRef);

   if(existingAccess.exists()&&existingAccess.data().status==="approved"){
    setMsg("✅ Is profile ka access pehle hi approved hai.");
    return;
   }

   if(requests.some(x=>x.status==="approved")){
    setMsg("✅ Is profile ka access pehle hi approved hai.");
    return;
   }

   const batch=writeBatch(db);
   const reqRef=doc(collection(db,"paidAccessRequests"));
   const claimRef=doc(db,"paymentUtrClaims",clean.toLowerCase());

   batch.set(claimRef,{
    uid:user.uid,utr:clean,kind:"access",profileId:profile,type,amount,
    requestId:reqRef.id,createdAt:serverTimestamp()
   });

   batch.set(reqRef,{
    uid:user.uid,profileId:profile,type,amount,status:"pending",
    paymentMethod:"qr",utr:clean,utrClaimId:claimRef.id,createdAt:serverTimestamp()
   });

   await batch.commit();
   setSent(true);
   setUtr("");
   setMsg("⏳ Payment request Admin ko bhej di gayi hai. UTR verify hone ke baad access approve hoga.");
  }catch(e){
   const code=e?.code||"";
   if(code==="permission-denied"){
    setMsg("❌ Request save nahi hui: Firebase Rules permission denied. Latest Rules Publish karke page refresh karein.");
   }else if(code==="already-exists"){
    setMsg("❌ Ye UTR pehle hi submit ho chuka hai. Naya UTR / Transaction ID dalein.");
   }else{
    setMsg("❌ Payment request save nahi hui: "+(e?.message||"Unknown error"));
   }
   setSent(false);
  }finally{
   setSaving(false);
  }
 }

 return <main>
  <header className="siteHeader">
   <div className="headerInner">
    <button className="logo" type="button" onClick={()=>router.push("/")}>
     <span className="logoMark">💍</span>
     <span><strong>ZARA SHADI</strong><small>Service</small></span>
    </button>
   </div>
  </header>

  <section className="cardPage payment" style={{maxWidth:760,margin:"25px auto"}}>
   <div style={{textAlign:"center"}}>
    <div className="paymentIcon">₹</div>
    <span className="eyebrow">DIRECT UPI PAYMENT</span>
    <h1>₹{amount} {type==="mobile"?"Mobile Number":"Biodata"} Access</h1>
    <p className="paymentLead">Profile <b>{profile}</b> ke liye exact ₹{amount} payment hai.</p>
   </div>

   {!user&&<>
    <div className="notice">Payment request bhejne ke liye Google Login zaroori hai.</div>
    <button type="button" className="primaryAction" onClick={login}>Google se Login →</button>
   </>}

   {user&&<>
    <div className="feeRow">
     <span><small>Exact Access Fee</small><b>₹{amount}</b></span>
     <strong>UPI</strong>
    </div>

    <div className="qr" style={{textAlign:"center"}}>
     {qrUrl?<><img src={qrUrl} alt="UPI QR"/><p><b>QR scan karke UPI app me ₹{amount} enter karein.</b></p></>:<small>Admin ne QR set nahi kiya.</small>}
    </div>

    <div className="paymentForm">
     <label>
      UTR / Transaction ID
      <input
       className="adminInput"
       value={utr}
       onChange={e=>setUtr(e.target.value)}
       placeholder={"₹"+amount+" payment ke baad UTR dalein"}
       autoComplete="off"
      />
     </label>

     <button
      type="button"
      className="primaryAction"
      disabled={saving||sent}
      onClick={submit}
      aria-label="UTR Send karke Access Request karein"
     >
      {saving?"Sending...":sent?"Request Sent ✓":"UTR Send करके Access Request करें →"}
     </button>
    </div>

    {requests.length>0&&
     <div className="notice">
      {requests.map(x=><div key={x.id}>₹{x.amount} — <b>{x.status}</b> {x.utr&&"— UTR "+x.utr}</div>)}
     </div>
    }
   </>}

   {msg&&<div className="messageBox" role="status">{msg}</div>}

   <button type="button" className="backAction" onClick={()=>router.push("/payment?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type))}>
    ← Payment Options पर जाएँ
   </button>
  </section>
 </main>;
}

export default function Recharge(){
 return <Suspense fallback={<main><section className="cardPage">Loading...</section></main>}><PageBody/></Suspense>
}
