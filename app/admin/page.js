"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,signInWithRedirect,onAuthStateChanged,signOut} from "firebase/auth";
import {collection,doc,getDoc,onSnapshot,setDoc,serverTimestamp,updateDoc,runTransaction} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

const ADMIN="ngogrant454@gmail.com";

export default function Admin(){
  const router=useRouter();
  const [user,setUser]=useState(undefined),[tab,setTab]=useState("dashboard"),[error,setError]=useState("");
  const [profiles,setProfiles]=useState([]),[users,setUsers]=useState([]);
  const [recharges,setRecharges]=useState([]),[requests,setRequests]=useState([]),[transactions,setTransactions]=useState([]);
  const [social,setSocial]=useState({whatsapp:"",facebook:"",instagram:""}),[upi,setUpi]=useState(""),[qrFile,setQrFile]=useState(null),[qrPreview,setQrPreview]=useState("");
  const [wallFile,setWallFile]=useState(null),[wallPreview,setWallPreview]=useState("");
  const [saving,setSaving]=useState(false),[requestFilter,setRequestFilter]=useState("pending"),[requestSearch,setRequestSearch]=useState("");

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{
    if(user?.email?.toLowerCase()!==ADMIN)return;
    const unsubs=[];
    const watch=(path,setter,ordered=false)=>{
      const q=collection(db,path);
      unsubs.push(onSnapshot(q,s=>{const rows=s.docs.map(d=>({id:d.id,...d.data()})); if(ordered) rows.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)); setter(rows)},e=>setError(path+" load error: "+e.message)));
    };
    watch("profiles",setProfiles);watch("users",setUsers);
    watch("walletRechargeRequests",setRecharges,true);watch("paidAccessRequests",setRequests,true);watch("walletTransactions",setTransactions,true);
    getDoc(doc(db,"settings","social")).then(s=>s.exists()&&setSocial({...{whatsapp:"",facebook:"",instagram:""},...s.data()})).catch(()=>{});
    getDoc(doc(db,"settings","payment")).then(s=>{if(s.exists()){setUpi(s.data().upiId||"");setQrPreview(s.data().qrUrl||"")}}).catch(e=>setError("Payment settings load error: "+e.message));
    return()=>unsubs.forEach(x=>x());
  },[user]);

  async function login(){
    setError("");const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});
    try{await signInWithPopup(auth,p)}catch(e){if(["auth/popup-blocked","auth/popup-closed-by-user"].includes(e.code)){try{await signInWithRedirect(auth,p)}catch(x){setError(x.message)}}else setError(e.message)}
  }
  const logout=()=>signOut(auth);

  async function approveRecharge(x){
    try{
      if(x.status!=="pending")return;
      const amount=Number(x.amount);
      if(![100,500,1000].includes(amount))throw new Error("Recharge amount valid nahi hai.");
      if(x.paymentMethod!=="upi"&&x.paymentMethod!=="qr")throw new Error("Recharge payment method valid nahi hai.");
      if(!x.utr)throw new Error("Recharge UTR missing hai.");
      const reqRef=doc(db,"walletRechargeRequests",x.id);
      const userRef=doc(db,"users",x.uid);
      const txRef=doc(db,"walletTransactions",x.id+"_recharge");

      await runTransaction(db,async t=>{
        const reqSnap=await t.get(reqRef);
        if(!reqSnap.exists())throw new Error("Recharge request nahi mili.");
        const req=reqSnap.data();
        if(req.status!=="pending")throw new Error("Ye recharge already process ho chuka hai.");
        if(Number(req.amount)!==amount)throw new Error("Recharge request amount mismatch hai.");
        if(!["upi","qr"].includes(req.paymentMethod))throw new Error("Recharge payment method invalid hai.");
        if(!req.utr || !req.utrClaimId)throw new Error("Recharge UTR claim missing hai.");
        const claimRef=doc(db,"paymentUtrClaims",req.utrClaimId);
        const claimSnap=await t.get(claimRef);
        if(!claimSnap.exists())throw new Error("UTR claim nahi mila.");
        const claim=claimSnap.data();
        if(claim.uid!==req.uid || claim.kind!=="recharge" || Number(claim.amount)!==amount || claim.requestId!==x.id || claim.utr!==req.utr)throw new Error("Recharge UTR claim mismatch hai.");

        const userSnap=await t.get(userRef);
        const oldBalance=Number(userSnap.exists()?userSnap.data().walletBalance||0:0);
        const newBalance=oldBalance+amount;

        t.update(reqRef,{
          status:"approved",
          approvedAt:serverTimestamp(),
          approvedAmount:amount
        });
        if(reqSnap.data().lockId)t.delete(doc(db,"pendingPaymentLocks",reqSnap.data().lockId));
        t.set(txRef,{
          uid:x.uid,
          type:"recharge",
          direction:"credit",
          amount,
          signedAmount:amount,
          balanceAfter:newBalance,
          utr:x.utr||"",
          requestId:x.id,
          status:"approved",
          createdAt:serverTimestamp()
        },{merge:true});
        t.set(userRef,{
          walletBalance:newBalance,
          lastRecharge:amount
        },{merge:true});
      });
    }catch(e){setError("Recharge approve nahi hua: "+e.message)}
  }
  async function rejectRecharge(x){if(!confirm("Recharge reject karein?"))return;try{await runTransaction(db,async t=>{const ref=doc(db,"walletRechargeRequests",x.id);const s=await t.get(ref);if(!s.exists()||s.data().status!=="pending")throw new Error("Request already process ho chuki hai.");t.update(ref,{status:"rejected",rejectedAt:serverTimestamp()});if(s.data().lockId)t.delete(doc(db,"pendingPaymentLocks",s.data().lockId));});}catch(e){setError("Recharge reject nahi hua: "+e.message)}}

  async function approveAccess(x){
    try{
      if(x.status!=="pending")return;
      const amount=Number(x.amount);
      const expected=x.type==="biodata"?100:500;
      if(amount!==expected)throw new Error("Access amount valid nahi hai.");
      const reqRef=doc(db,"paidAccessRequests",x.id);
      const unlockRef=doc(db,x.type==="biodata"?"biodataUnlocks":"mobileAccess",x.uid+"_"+x.profileId);
      const txRef=doc(db,"walletTransactions",x.id+"_payment");
      const userRef=doc(db,"users",x.uid);

      await runTransaction(db,async t=>{
        const reqSnap=await t.get(reqRef);
        if(!reqSnap.exists())throw new Error("Access request nahi mili.");
        const req=reqSnap.data();
        if(req.status!=="pending")throw new Error("Ye request already process ho chuki hai.");
        if(req.type!=="biodata" && req.type!=="mobile")throw new Error("Access type invalid hai.");
        const expectedReqAmount=req.type==="biodata"?100:500;
        if(Number(req.amount)!==expectedReqAmount)throw new Error("Access request amount mismatch hai.");
        if(req.profileId!==x.profileId || req.type!==x.type)throw new Error("Access request data mismatch hai.");
        if(!["wallet","upi","qr"].includes(req.paymentMethod))throw new Error("Payment method valid nahi hai.");
        if(req.paymentMethod==="wallet" && req.utr!=="")throw new Error("Wallet request me UTR nahi hona chahiye.");
        if(req.paymentMethod==="wallet" && req.utrClaimId)throw new Error("Wallet request me UTR claim nahi hona chahiye.");
        if(req.paymentMethod!=="wallet" && (!req.utr || !["upi","qr"].includes(req.paymentMethod) || !req.utrClaimId))throw new Error("UPI/QR request incomplete hai.");
        if(req.paymentMethod!=="wallet"){
          const claimSnap=await t.get(doc(db,"paymentUtrClaims",req.utrClaimId));
          if(!claimSnap.exists())throw new Error("Access UTR claim nahi mila.");
          const claim=claimSnap.data();
          if(claim.uid!==req.uid || claim.kind!=="access" || claim.profileId!==req.profileId || claim.type!==req.type || Number(claim.amount)!==expectedReqAmount || claim.requestId!==x.id || claim.utr!==req.utr)throw new Error("Access UTR claim mismatch hai.");
        }

        const profileSnap=await t.get(doc(db,"profiles",req.profileId));
        if(!profileSnap.exists() || profileSnap.data().status==="deleted"){
          throw new Error("Ye profile ab active nahi hai.");
        }

        const unlockSnap=await t.get(unlockRef);
        if(unlockSnap.exists() && unlockSnap.data().status==="approved"){
          // A legacy/stale pending request can remain after an earlier request was approved.
          // Never grant the same access twice. Close this duplicate request cleanly instead
          // of showing an approval error forever.
          t.update(reqRef,{
            status:"rejected",
            rejectedAt:serverTimestamp(),
            rejectionReason:"access_already_approved"
          });
          if(req.lockId)t.delete(doc(db,"pendingPaymentLocks",req.lockId));
          return;
        }

        let balanceAfter=null;
        if(req.paymentMethod==="wallet"){
          const userSnap=await t.get(userRef);
          if(!userSnap.exists())throw new Error("User wallet nahi mila.");
          const balance=Number(userSnap.data().walletBalance||0);
          if(balance<amount)throw new Error("User Wallet Balance ₹"+balance+" hai. ₹"+amount+" available nahi hai.");
          balanceAfter=balance-amount;
          t.set(userRef,{walletBalance:balanceAfter,lastPayment:amount},{merge:true});
        }

        t.set(unlockRef,{
          uid:x.uid,profileId:x.profileId,amount,status:"approved",
          type:x.type,approvedAt:serverTimestamp(),paymentMethod:req.paymentMethod||"upi"
        },{merge:true});
        t.update(reqRef,{status:"approved",approvedAt:serverTimestamp(),approvedPaymentMethod:req.paymentMethod||"upi"});
        if(req.lockId)t.delete(doc(db,"pendingPaymentLocks",req.lockId));
        t.set(txRef,{
          uid:x.uid,
          type:x.type==="biodata"?"biodata_unlock":"mobile_access",
          amount,
          profileId:x.profileId,
          utr:x.utr||"",
          requestId:x.id,
          paymentMethod:req.paymentMethod||"upi",
          direction:req.paymentMethod==="wallet"?"debit":"none",
          signedAmount:req.paymentMethod==="wallet"?-amount:0,
          balanceAfter,
          status:"approved",
          createdAt:serverTimestamp()
        },{merge:true});
      });
    }catch(e){setError("Access approve nahi hua: "+e.message)}
  }
  async function rejectAccess(x){if(!confirm("Request reject karein?"))return;try{await runTransaction(db,async t=>{const ref=doc(db,"paidAccessRequests",x.id);const s=await t.get(ref);if(!s.exists()||s.data().status!=="pending")throw new Error("Request already process ho chuki hai.");t.update(ref,{status:"rejected",rejectedAt:serverTimestamp()});if(s.data().lockId)t.delete(doc(db,"pendingPaymentLocks",s.data().lockId));});}catch(e){setError("Access reject nahi hua: "+e.message)}}

  async function savePayment(e){
    e.preventDefault();try{
      const upiValue=upi.trim();
      if(upiValue && !/^[A-Za-z0-9._-]{2,100}@[A-Za-z0-9.-]{2,100}$/.test(upiValue)){
        throw new Error("UPI ID format sahi nahi hai. Example: name@bank");
      }
      let qr="";const old=await getDoc(doc(db,"settings","payment"));if(old.exists())qr=old.data().qrUrl||"";
      if(qrFile){if(!qrFile.type.startsWith("image/")||qrFile.size>5*1024*1024)throw new Error("QR image 5 MB se chhoti honi chahiye.");const url=URL.createObjectURL(qrFile);try{const img=new Image();img.src=url;await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});const c=document.createElement("canvas");const s=Math.min(1,600/Math.max(img.naturalWidth,img.naturalHeight));c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);qr=c.toDataURL("image/png");
      if(qr.length>300000)throw new Error("QR image bahut badi hai. Chhoti/clear QR image upload karein.");}finally{URL.revokeObjectURL(url)}}
      await setDoc(doc(db,"settings","payment"),{upiId:upi.trim(),qrUrl:qr,updatedAt:serverTimestamp()},{merge:true});setQrFile(null);setQrPreview(qr);alert("Payment settings save ho gayi.")
    }catch(e){setError(e.message)}
  }

  async function saveSocial(e){e.preventDefault();try{await setDoc(doc(db,"settings","social"),{...social,updatedAt:serverTimestamp()},{merge:true});alert("Social links save ho gaye.")}catch(e){setError(e.message)}}

  if(user===undefined)return <main><section className="admin cardPage"><h1>Loading...</h1></section></main>;
  if(!user)return <main><section className="admin cardPage"><div className="adminIcon">🔐</div><h1>Admin Login</h1><button className="primaryAction" onClick={login}>Google Login →</button>{error&&<div className="errorBox">{error}</div>}</section></main>;
  if(user.email?.toLowerCase()!==ADMIN)return <main><section className="admin cardPage"><div className="adminIcon">🚫</div><h1>Access Denied</h1><button className="backAction" onClick={logout}>Logout</button></section></main>;

  const nav=[["dashboard","🏠 Dashboard"],["users","👥 All Users"],["biodata","📋 Biodata"],["access100","₹100 Biodata Payments"],["access500","₹500 Mobile Payments"],["wallet","💰 Wallet / Recharge"],["transactions","🧾 Transactions"],["settings","⚙️ Settings"]];

  return <main><section className="admin dashboardPage">
    <div className="dashTop"><div><span className="eyebrow">ZARA SHADI SERVICE</span><h1>Central Admin Board</h1><p>Users, biodata, payments, wallet aur access sab ek jagah.</p></div><button className="logout" onClick={logout}>🚪 Logout</button></div>
    <div className="adminUser">👤 <span>Admin</span> <b>{user.email}</b></div>
    <div className="adminNav">{nav.map(n=><button key={n[0]} className={tab===n[0]?"active":""} onClick={()=>n[0]==="biodata"?router.push("/admin/biodata"):setTab(n[0])}>{n[1]}</button>)}</div>
    {error&&<div className="errorBox">{error}</div>}

    {tab==="dashboard"&&<div className="dashboardGrid">
      <div className="statCard"><span className="statIcon">👥</span><small>Google Users</small><strong>{users.length}</strong></div>
      <div className="statCard"><span className="statIcon">📋</span><small>Biodata</small><strong>{profiles.length}</strong></div>
      <div className="statCard" role="button" tabIndex={0} onClick={()=>setTab("access100")} onKeyDown={e=>e.key==="Enter"&&setTab("access100")}><span className="statIcon">₹100</span><small>Pending Biodata</small><strong>{requests.filter(x=>x.status==="pending"&&Number(x.amount)===100).length}</strong><small>Click करके पूरी list देखें →</small></div>
      <div className="statCard" role="button" tabIndex={0} onClick={()=>setTab("access500")} onKeyDown={e=>e.key==="Enter"&&setTab("access500")}><span className="statIcon">₹500</span><small>Pending Mobile</small><strong>{requests.filter(x=>x.status==="pending"&&Number(x.amount)===500).length}</strong><small>Click करके पूरी list देखें →</small></div>
      <div className="statCard" role="button" tabIndex={0} onClick={()=>setTab("wallet")} onKeyDown={e=>e.key==="Enter"&&setTab("wallet")}><span className="statIcon">💰</span><small>Pending Recharge</small><strong>{recharges.filter(x=>x.status==="pending").length}</strong><small>Click करके पूरी list देखें →</small></div>
    </div>}

    {tab==="users"&&<div className="adminList"><div className="listHead"><h3>👥 All Google Login Users</h3><span>{users.length}</span></div>{users.map(x=><div className="userAdminCard" key={x.id}><div className="rowProfile">{x.photoURL?<img src={x.photoURL} alt=""/>:<div className="rowPlaceholder">👤</div>}<div><b>{x.name||"Name not set"}</b><small>{x.email||""}</small><small>UID: {x.uid||x.id}</small></div></div><div className="userDetails"><span>📍 {x.address||"-"}</span><span>📱 {x.phone||"-"}</span><span>🎂 {x.age||"-"}</span><span>💼 {x.income||"-"}</span><span>💰 Wallet: ₹{x.walletBalance||0}</span></div></div>)}</div>}

    {(tab==="access100"||tab==="access500")&&<div className="adminList"><div className="filterBar" style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10,marginBottom:12}}><select className="adminInput" value={requestFilter} onChange={e=>setRequestFilter(e.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All Status</option></select><input className="adminInput" placeholder="🔎 Profile ID / User / UTR search..." value={requestSearch} onChange={e=>setRequestSearch(e.target.value)}/></div><div className="listHead"><h3>{tab==="access100"?"₹100 Paid Biodata":"₹500 Paid Mobile / Contact"} Requests</h3><span>{requests.filter(x=>x.type===(tab==="access100"?"biodata":"mobile")).length}</span></div>{requests.filter(x=>x.type===(tab==="access100"?"biodata":"mobile")&&(requestFilter==="all"||x.status===requestFilter)).filter(x=>{const p=profiles.find(p=>p.id===x.profileId);const u=users.find(u=>u.id===x.uid||u.uid===x.uid);const q=requestSearch.trim().toLowerCase();return !q||(x.profileId+" "+(u?.name||"")+" "+(u?.email||"")+" "+(x.utr||"")).toLowerCase().includes(q)}).map(x=>{const p=profiles.find(p=>p.id===x.profileId);const u=users.find(u=>u.id===x.uid||u.uid===x.uid);return <div className="userAdminCard" key={x.id}><div className="rowProfile">{p?.photos?.[0]?<img src={p.photos[0]} alt=""/>:<div className="rowPlaceholder">📷</div>}<div><b>Profile {x.profileId}</b><small>{p?.name||p?.title||"Profile"} • {x.type==="biodata"?"Biodata":"Mobile Number"}</small><small>👤 {u?.name||"User"} • {u?.email||x.uid}</small><small>Amount: ₹{x.amount} • {x.status}</small><small>💳 Method: {(x.paymentMethod||"-").toUpperCase()} • UTR: {x.utr||"-"}</small><small>Request ID: {x.id}</small><small>{x.createdAt?.toDate?.()?.toLocaleString?.()||""}</small></div></div><div className="cardButtons">{x.status==="pending"&&<button className="approve" onClick={()=>approveAccess(x)}>✓ Approve</button>}{x.status==="pending"&&<button onClick={()=>rejectAccess(x)}>✕ Reject</button>}</div></div>})}</div>}

    {tab==="wallet"&&<div className="adminList"><div className="listHead"><h3>💰 Wallet Recharge Requests</h3><span>{recharges.length}</span></div>{recharges.map(x=><div className="userAdminCard" key={x.id}><div><b>{x.name||"Name not set"}</b><small>📧 {x.email||"-"}</small><small>📱 {x.phone||"-"}</small><small>👤 UID: {x.uid}</small><small>💰 Recharge: ₹{x.amount}</small><small>🧾 UTR: {x.utr||"-"}</small><small>💳 Method: {(x.paymentMethod||"upi").toUpperCase()}</small><small>📌 Status: {x.status}</small><small>🔒 Lock: {x.lockId||"legacy request"}</small><small>🕒 {x.createdAt?.toDate?.()?.toLocaleString?.()||""}</small></div><div className="cardButtons">{x.status==="pending"&&<><button className="approve" onClick={()=>approveRecharge(x)}>✓ Approve & Credit ₹{x.amount}</button><button onClick={()=>rejectRecharge(x)}>✕ Reject</button></>}</div></div>)}</div>}

    {tab==="transactions"&&<div className="adminList"><div className="listHead"><h3>🧾 All Wallet / Payment Transactions</h3><span>{transactions.length}</span></div>{transactions.map(x=><div className="adminRow" key={x.id}><span><b>{x.type} • ₹{x.amount}</b><small>UID: {x.uid}</small><small>Profile: {x.profileId||"-"} • UTR: {x.utr||"-"}</small><small>{x.createdAt?.toDate?.()?.toLocaleString?.()||""}</small></span></div>)}</div>}

    {tab==="settings"&&<><form className="adminBox" onSubmit={savePayment}><h3>💳 UPI Payment Settings</h3><input className="adminInput" placeholder="UPI ID" value={upi} onChange={e=>setUpi(e.target.value)}/><label className="uploadBox">QR Image<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setQrFile(f);setQrPreview(URL.createObjectURL(f))}}}/></label>{qrPreview&&<div className="uploadPreview"><img src={qrPreview} alt="QR"/></div>}<button className="primaryAction">💾 Payment Save →</button></form><form className="adminBox" onSubmit={saveSocial}><h3>📲 Social Links</h3><input className="adminInput" placeholder="WhatsApp" value={social.whatsapp} onChange={e=>setSocial({...social,whatsapp:e.target.value})}/><input className="adminInput" placeholder="Facebook" value={social.facebook} onChange={e=>setSocial({...social,facebook:e.target.value})}/><input className="adminInput" placeholder="Instagram" value={social.instagram} onChange={e=>setSocial({...social,instagram:e.target.value})}/><button className="primaryAction">💾 Social Save →</button></form></>}
  </section></main>;
}
