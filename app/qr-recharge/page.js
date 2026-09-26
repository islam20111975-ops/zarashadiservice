"use client";

import {Suspense,useEffect,useRef,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,getDocs,query,where,serverTimestamp,setDoc} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

function PageBody(){
 const q=useSearchParams(),router=useRouter();
 const profile=q.get("profile")||"";
 const type=q.get("type")==="mobile"?"mobile":"biodata";
 const amount=type==="mobile"?500:100;
 const [user,setUser]=useState(null),[qrUrl,setQrUrl]=useState(""),[upiId,setUpiId]=useState(""),[utr,setUtr]=useState(""),[copied,setCopied]=useState(false),[clickedButton,setClickedButton]=useState("");
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
  setClickedButton("login");
  window.setTimeout(()=>setClickedButton(""),1600);
  try{await signInWithPopup(auth,new GoogleAuthProvider())}
  catch(e){setMsg("❌ Google Login failed: "+(e?.message||"Please try again."))}
 }

 async function downloadQr(){
  setClickedButton("qr");
  window.setTimeout(()=>setClickedButton(""),1600);
  if(!qrUrl)return setMsg("❌ QR Code available nahi hai.");
  const fileName="Zara-Nikah-UPI-QR-"+amount+".png";
  let objectUrl="";
  try{
   // Convert the QR to a Blob first. This is more reliable on desktop Chrome
   // than asking the browser to download a large data: URL directly.
   let blob;
   if(qrUrl.startsWith("data:")){
    const res=await fetch(qrUrl);
    blob=await res.blob();
   }else{
    const res=await fetch(qrUrl,{mode:"cors"});
    if(!res.ok)throw new Error("QR download failed");
    blob=await res.blob();
   }
   if(!blob||!blob.size)throw new Error("Empty QR image");
   objectUrl=URL.createObjectURL(new Blob([blob],{type:"image/png"}));
   const a=document.createElement("a");
   a.href=objectUrl;
   a.download=fileName;
   a.style.display="none";
   document.body.appendChild(a);
   a.click();
   a.remove();
   setMsg("✅ QR Code download start ho gaya. PC ke Downloads folder me check karein.");
   setTimeout(()=>{if(objectUrl)URL.revokeObjectURL(objectUrl)},5000);
  }catch(e){
   if(objectUrl)URL.revokeObjectURL(objectUrl);
   // Fallback: open the QR so the user can save it manually.
   try{window.open(qrUrl,"_blank","noopener,noreferrer");}catch(_e){}
   setMsg("⚠️ Browser ne direct download block kiya. QR image khol di gayi hai—right-click karke Save image as… karein.");
  }
 }

 async function submit(){
  setClickedButton("submit");
  setMsg("⏳ UTR Send ho raha hai…");
  if(!user){setClickedButton("");return setMsg("⚠️ Pehle Google se Login karein.");}
  if(!profile){setClickedButton("");return setMsg("❌ Profile ID missing hai.");}
  if(!profileData){setClickedButton("");return setMsg("❌ Ye profile available nahi hai.");}
  if(!qrUrl&&!upiId){setClickedButton("");return setMsg("❌ Admin ne UPI ID ya QR payment set nahi kiya hai.");}
  const clean=utr.trim().replace(/\s+/g,"").toUpperCase();
  if(!clean){setClickedButton("");return setMsg("⚠️ Payment karne ke baad UTR / Transaction ID yahan zaroor bharein.");}
  if(!/^[A-Z0-9]{6,40}$/.test(clean)){setClickedButton("");return setMsg("⚠️ Sahi UTR / Transaction ID bhariye (6–40 letters/numbers).");}
  if(requests.some(x=>x.status==="pending")){setClickedButton("");return setMsg("⏳ Is profile ka payment request already Pending hai. Admin verification ka wait karein.");}
  if(requests.some(x=>x.status==="approved")){setClickedButton("");return setMsg("✅ Is profile ka access pehle hi approved hai.");}
  setSaving(true);
  try{
   const lockId=user.uid+"_"+profile+"_"+type;
   const reqRef=doc(collection(db,"paidAccessRequests"));
   // UTR is stored directly on the payment request. Admin verifies the UTR
   // manually before approval; this avoids a second client-side Firestore write
   // that could block the request even when the payment request itself is valid.
   const requestData={uid:user.uid,profileId:profile,type,amount,status:"pending",paymentMethod:"upi",utr:clean,lockId,createdAt:serverTimestamp()};
   await setDoc(reqRef,requestData);
   setUtr("");
   setMsg("✅ UTR Send ho gaya. Payment request Admin ko bhej di gayi hai. UTR verify hone ke baad exact Profile "+profile+" ka access approve hoga.");
   setRequests(prev=>[{id:reqRef.id,...requestData},...prev]);
  }catch(e){
   const code=e?.code||"";
   if(code==="already-exists")setMsg("❌ Ye UTR pehle hi use ho chuka hai. Page refresh karke status dekhein.");
   else if(code==="permission-denied")setMsg("❌ Firebase Permission Denied — "+(e?.stage||"payment request")+" ko Firebase Rules ne reject kiya. Details: "+(e?.message||"Permission denied"));
   else if(code==="failed-precondition")setMsg("❌ Firebase configuration/precondition error. Kripya page refresh karke dobara try karein.");
   else if(code==="unavailable")setMsg("❌ Firebase service abhi available nahi hai. Internet check karke dobara try karein.");
   else setMsg("❌ UTR Send nahi hua: "+(e?.message||"Unknown error"));
  }finally{
   setSaving(false);
   window.setTimeout(()=>setClickedButton(""),1600);
  }
 }
 const photo=profileData?.photos?.[0]||profileData?.photo||"";
 if(user&&approved)return <main><section className="cardPage payment paymentPremium" style={{maxWidth:760,margin:"25px auto"}}><div className="notice">✅ <b>Payment Approved</b><br/>Profile {profile} ka access approve ho gaya hai.<br/><small>Biodata page khola ja raha hai…</small></div></section></main>;

 return <main>
  <header className="siteHeader"><div className="headerInner"><button className="logo" type="button" onClick={()=>router.push("/")}><span className="logoMark">💍</span><span><strong>ZARA NIKAH</strong><small>Service</small></span></button></div></header>
  <section className="cardPage payment paymentPremium" style={{maxWidth:760,margin:"25px auto"}}>
   <div style={{textAlign:"center"}}>
    <div className="paymentIcon">₹</div><span className="eyebrow">UPI ID + QR PAYMENT</span>
    <h1>₹{amount} {type==="mobile"?"Mobile Number":"Biodata"} Access</h1>
    {photo&&<img src={photo} alt="" className="paymentProfilePhoto"/>}
    <p className="paymentLead">Profile <b>{profile}</b> ke liye exact ₹{amount} payment hai.</p>
   </div>
   <div className="feeRow"><span><small>Exact Access Fee</small><b>₹{amount}</b></span><strong>UPI</strong></div>
   <div className="notice" style={{textAlign:"left"}}><b>⚠️ Payment se pehle</b><br/>Sirf <b>₹{amount}</b> hi pay karein. Payment screen par receiver ka UPI ID/name aur amount check karke hi UPI PIN dalein. QR scan karke payment karte waqt hi PIN use hota hai; kisi ko receive karne ke liye PIN na dein.</div>
   {upiId&&<div className="notice" style={{textAlign:"center"}}><b>1️⃣ UPI ID se Payment</b><br/><div style={{margin:"10px 0",fontSize:18,fontWeight:700,wordBreak:"break-all"}}>{upiId}</div><button type="button" className="primaryAction" onClick={async()=>{setClickedButton("copy");try{await navigator.clipboard.writeText(upiId);setCopied(true);setMsg("✅ UPI ID copy ho gayi. Ab exact ₹"+amount+" payment karein.");window.setTimeout(()=>{setCopied(false);setClickedButton("")},2500);}catch(e){setMsg("⚠️ UPI ID copy nahi ho saki. Manually copy karein.");}}}>{copied?"✓ UPI ID Copied":clickedButton==="copy"?"✓ Clicked":"📋 UPI ID Copy करें"}</button></div>}
   {qrUrl&&<div className="qr"><p><b>2️⃣ QR Code se Payment</b></p><img src={qrUrl} alt="UPI QR"/><p><b>QR scan karke exact ₹{amount} pay karein.</b><br/><small>QR save karke doosre phone se bhi scan kar sakte hain.</small></p><button type="button" className={"primaryAction"+(clickedButton==="qr"?" clickFeedback":"")} onClick={downloadQr}>{clickedButton==="qr"?"✓ Downloading…":"⬇️ QR Download करें"}</button></div>}
   {!upiId&&!qrUrl&&<div className="notice">Admin ne UPI ID aur QR payment set nahi kiya hai.</div>}
   {!user&&<><div className="notice">Payment request bhejne ke liye Google Login zaroori hai. Payment ke baad UTR/Transaction ID submit karein.</div><button type="button" className={"primaryAction"+(clickedButton==="login"?" clickFeedback":"")} onClick={login}>{clickedButton==="login"?"✓ Clicked":"Google se Login →"}</button></>}
   {user&&!approved&&<>
    {pending&&<div className="notice">⏳ <b>Payment Pending</b><br/>Aapki request Admin verify kar rahe hain. Same profile ke liye dobara payment submit na karein.</div>}
    <div className="paymentForm">
     <label>UTR / Transaction ID
      <input className="adminInput" value={utr} onChange={e=>setUtr(e.target.value)} placeholder={"₹"+amount+" payment ke baad UTR dalein"} autoComplete="off" inputMode="text"/>
     </label>
     <button type="button" className={"primaryAction"+(clickedButton==="submit"?" clickFeedback":"")} disabled={saving||!!pending} onClick={submit}>{saving?"✓ Sending…":pending?"Request Pending ⏳":clickedButton==="submit"?"✓ Clicked — Sending…":"UTR Send करके Access Request करें →"}</button>
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