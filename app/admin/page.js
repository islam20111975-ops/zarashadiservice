"use client";

import {useEffect,useState} from "react";
import {GoogleAuthProvider,signInWithPopup,signInWithRedirect,onAuthStateChanged,signOut} from "firebase/auth";
import {collection,deleteDoc,doc,getDoc,onSnapshot,query,orderBy,setDoc,serverTimestamp,updateDoc} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

const ADMIN="ngogrant454@gmail.com";
const emptyProfile={id:"",gender:"female",name:"",address:"",phone:"",age:"",income:""};
const emptySocial={whatsapp:"",facebook:"",instagram:""};

function imageToDataUrl(file,maxSide=700,maxChars=140000){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
      const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
      const c=document.createElement("canvas");c.width=w;c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      let q=.68,data=c.toDataURL("image/jpeg",q);
      while(data.length>maxChars&&q>.3){q-=.06;data=c.toDataURL("image/jpeg",q)}
      if(data.length>maxChars)reject(new Error("Image bahut badi hai."));
      else resolve(data);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Image read nahi hui."))};
    img.src=url;
  });
}

export default function Admin(){
  const [user,setUser]=useState(undefined),[tab,setTab]=useState("dashboard"),[error,setError]=useState("");
  const [profiles,setProfiles]=useState([]),[users,setUsers]=useState([]),[regs,setRegs]=useState([]);
  const [recharges,setRecharges]=useState([]),[requests,setRequests]=useState([]),[transactions,setTransactions]=useState([]);
  const [form,setForm]=useState(emptyProfile),[files,setFiles]=useState([]),[preview,setPreview]=useState("");
  const [social,setSocial]=useState(emptySocial),[upi,setUpi]=useState(""),[qrFile,setQrFile]=useState(null),[qrPreview,setQrPreview]=useState("");
  const [wallFile,setWallFile]=useState(null),[wallPreview,setWallPreview]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{
    if(user?.email?.toLowerCase()!==ADMIN)return;
    const unsubs=[];
    const watch=(path,setter,ordered=false)=>{
      const q=ordered?query(collection(db,path),orderBy("createdAt","desc")):collection(db,path);
      unsubs.push(onSnapshot(q,s=>setter(s.docs.map(d=>({id:d.id,...d.data()}))),e=>setError(path+" load error: "+e.message)));
    };
    watch("profiles",setProfiles);watch("users",setUsers);watch("registrations",setRegs,true);
    watch("walletRechargeRequests",setRecharges,true);watch("paidAccessRequests",setRequests,true);watch("walletTransactions",setTransactions,true);
    getDoc(doc(db,"settings","social")).then(s=>s.exists()&&setSocial({...emptySocial,...s.data()})).catch(()=>{});
    getDoc(doc(db,"settings","payment")).then(s=>s.exists()&&setUpi(s.data().upiId||"")).catch(()=>{});
    return()=>unsubs.forEach(x=>x());
  },[user]);

  async function login(){
    setError("");
    const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});
    try{await signInWithPopup(auth,p)}catch(e){
      if(["auth/popup-blocked","auth/popup-closed-by-user"].includes(e.code)){try{await signInWithRedirect(auth,p)}catch(x){setError(x.message)}}else setError(e.message)
    }
  }
  const logout=()=>signOut(auth);

  function chooseFiles(e){
    const fs=Array.from(e.target.files||[]);
    if(fs.length<1||fs.length>5)return setError("1 se 5 photos select karein.");
    if(fs.some(f=>!f.type.startsWith("image/")||f.size>10*1024*1024))return setError("Sirf image aur har file 10 MB se chhoti.");
    setFiles(fs);setPreview(URL.createObjectURL(fs[0]));setError("");
  }

  async function saveProfile(e){
    e.preventDefault();setError("");
    const phone=form.phone.replace(/\D/g,"");
    if(!form.id.trim()||!form.name.trim()||!form.address.trim()||!/^[6-9]\d{9}$/.test(phone)||!form.age||!form.income.trim())return setError("ID, Name, Address, Mobile, Age aur Income sab bharna zaroori hai.");
    setSaving(true);
    try{
      const ref=doc(db,"profiles",form.id.trim());
      const old=await getDoc(ref);
      let photos=[];
      if(files.length)photos=await Promise.all(files.map(f=>imageToDataUrl(f)));
      else if(old.exists())photos=old.data().photos||[];
      if(!photos.length)return setError("Kam se kam 1 photo zaroori hai.");
      await setDoc(ref,{gender:form.gender,photos,photo:photos[0],updatedAt:serverTimestamp()},{merge:true});
      await setDoc(doc(db,"profilePrivate",form.id.trim()),{
        profileId:form.id.trim(),name:form.name.trim(),address:form.address.trim(),phone,age:Number(form.age),income:form.income.trim(),updatedAt:serverTimestamp()
      },{merge:true});
      setForm(emptyProfile);setFiles([]);setPreview("");alert("Biodata save ho gaya.");
    }catch(e){setError("Biodata save nahi hua: "+e.message)}finally{setSaving(false)}
  }

  async function editProfile(p){
    const s=await getDoc(doc(db,"profilePrivate",p.id));const d=s.exists()?s.data():{};
    setForm({id:p.id,gender:p.gender||"female",name:d.name||"",address:d.address||"",phone:d.phone||"",age:d.age||"",income:d.income||""});
    setFiles([]);setPreview(p.photos?.[0]||p.photo||"");setTab("biodata");window.scrollTo({top:0,behavior:"smooth"});
  }
  async function removeProfile(id){
    if(!confirm("Is biodata ko delete karein?"))return;
    try{await deleteDoc(doc(db,"profiles",id));await deleteDoc(doc(db,"profilePrivate",id))}catch(e){setError(e.message)}
  }

  async function approveRecharge(x){
    try{
      if(x.status!=="pending")return;
      await updateDoc(doc(db,"walletRechargeRequests",x.id),{status:"approved",approvedAt:serverTimestamp()});
      await setDoc(doc(db,"walletTransactions",x.id+"_recharge"),{uid:x.uid,type:"recharge",amount:Number(x.amount),utr:x.utr||"",requestId:x.id,status:"approved",createdAt:serverTimestamp()},{merge:true});
      await setDoc(doc(db,"users",x.uid),{walletBalance:Number(x.approvedAmount||x.amount),lastRecharge:Number(x.approvedAmount||x.amount)},{merge:true});
    }catch(e){setError("Recharge approve nahi hua: "+e.message)}
  }
  async function rejectRecharge(x){if(confirm("Recharge reject karein?"))await updateDoc(doc(db,"walletRechargeRequests",x.id),{status:"rejected",rejectedAt:serverTimestamp()})}

  async function approveAccess(x){
    try{
      if(x.status!=="pending")return;
      const key=x.uid+"_"+x.profileId;
      const col=x.type==="biodata"?"biodataUnlocks":"mobileAccess";
      await setDoc(doc(db,col,key),{uid:x.uid,profileId:x.profileId,amount:x.amount,type:x.type,status:"approved",approvedAt:serverTimestamp()},{merge:true});
      await updateDoc(doc(db,"paidAccessRequests",x.id),{status:"approved",approvedAt:serverTimestamp()});
      await setDoc(doc(db,"walletTransactions",x.id+"_payment"),{uid:x.uid,type:x.type==="biodata"?"biodata_unlock":"mobile_access",amount:Number(x.amount),profileId:x.profileId,utr:x.utr||"",requestId:x.id,status:"approved",createdAt:serverTimestamp()},{merge:true});
    }catch(e){setError("Access approve nahi hua: "+e.message)}
  }
  async function rejectAccess(x){if(confirm("Request reject karein?"))await updateDoc(doc(db,"paidAccessRequests",x.id),{status:"rejected",rejectedAt:serverTimestamp()})}

  async function verifyReg(x,status){
    try{await updateDoc(doc(db,"registrations",x.id),{status,verifiedAt:serverTimestamp()})}catch(e){setError(e.message)}
  }

  async function saveSocial(e){e.preventDefault();try{await setDoc(doc(db,"settings","social"),{...social,updatedAt:serverTimestamp()},{merge:true});alert("Social links save ho gaye.")}catch(e){setError(e.message)}}
  async function savePayment(e){
    e.preventDefault();try{
      let qr="";const old=await getDoc(doc(db,"settings","payment"));if(old.exists())qr=old.data().qrUrl||"";
      if(qrFile)qr=await imageToDataUrl(qrFile,700,700000);
      await setDoc(doc(db,"settings","payment"),{upiId:upi.trim(),qrUrl:qr,updatedAt:serverTimestamp()},{merge:true});setQrFile(null);setQrPreview("");alert("Payment settings save ho gayi.")
    }catch(e){setError(e.message)}
  }
  async function saveWallpaper(e){
    e.preventDefault();if(!wallFile)return setError("Wallpaper select karein.");
    try{const wallpaper=await imageToDataUrl(wallFile,1100,650000);await setDoc(doc(db,"settings","appearance"),{wallpaper,updatedAt:serverTimestamp()},{merge:true});setWallFile(null);setWallPreview("");alert("Wallpaper save ho gaya.")}catch(e){setError(e.message)}
  }

  if(user===undefined)return <main><section className="admin cardPage"><h1>Loading...</h1></section></main>;
  if(!user)return <main><section className="admin cardPage"><div className="adminIcon">🔐</div><h1>Admin Login</h1><p>Google se Admin login karein.</p><button className="primaryAction" onClick={login}>Google Login →</button>{error&&<div className="errorBox">{error}</div>}</section></main>;
  if(user.email?.toLowerCase()!==ADMIN)return <main><section className="admin cardPage"><div className="adminIcon">🚫</div><h1>Access Denied</h1><p>Ye Google account admin nahi hai.</p><button className="backAction" onClick={logout}>Logout</button></section></main>;

  const nav=[["dashboard","🏠 Dashboard"],["users","👥 All Users"],["biodata","📋 Biodata"],["access100","₹100 Biodata Payments"],["access500","₹500 Mobile Payments"],["wallet","💰 Wallet / Recharge"],["transactions","🧾 Transactions"],["registrations","📝 Old Registrations"],["settings","⚙️ Settings"]];
  return <main><section className="admin dashboardPage">
    <div className="dashTop"><div><span className="eyebrow">ZARA SHADI SERVICE</span><h1>Central Admin Board</h1><p>Users, biodata, payments, wallet aur access sab ek jagah.</p></div><button className="logout" onClick={logout}>🚪 Logout</button></div>
    <div className="adminUser">👤 <span>Admin</span> <b>{user.email}</b></div>
    <div className="adminNav">{nav.map(n=><button key={n[0]} className={tab===n[0]?"active":""} onClick={()=>setTab(n[0])}>{n[1]}</button>)}</div>
    {error&&<div className="errorBox">{error}</div>}

    {tab==="dashboard"&&<div className="dashboardGrid">
      <div className="statCard"><span className="statIcon">👥</span><small>Google Users</small><strong>{users.length}</strong></div>
      <div className="statCard"><span className="statIcon">📋</span><small>Biodata</small><strong>{profiles.length}</strong></div>
      <div className="statCard"><span className="statIcon">₹</span><small>Pending Access</small><strong>{requests.filter(x=>x.status==="pending").length}</strong></div>
      <div className="statCard"><span className="statIcon">💰</span><small>Pending Recharge</small><strong>{recharges.filter(x=>x.status==="pending").length}</strong></div>
    </div>}

    {tab==="users"&&<div className="adminList"><div className="listHead"><h3>👥 All Google Login Users</h3><span>{users.length}</span></div>{users.length===0?<div className="empty">Abhi koi user profile nahi.</div>:users.map(x=><div className="userAdminCard" key={x.id}>
      <div className="rowProfile">{x.photoURL?<img src={x.photoURL} alt=""/>:<div className="rowPlaceholder">👤</div>}<div><b>{x.name||"Name not set"}</b><small>{x.email||""}</small><small>UID: {x.uid||x.id}</small></div></div>
      <div className="userDetails"><span>📍 {x.address||"-"}</span><span>📱 {x.phone||"-"}</span><span>🎂 {x.age||"-"}</span><span>💼 {x.income||"-"}</span><span>💰 Wallet: ₹{x.walletBalance||0}</span></div>
      <div className="cardButtons"><button onClick={()=>{setTab("transactions")}}>Transactions</button><button onClick={()=>{setTab("wallet")}}>Wallet</button><button onClick={()=>{setTab("access100")}}>Biodata</button><button onClick={()=>{setTab("access500")}}>Mobile Access</button></div>
    </div>)}</div>}

    {tab==="biodata"&&<><form className="adminBox" onSubmit={saveProfile}><div className="boxTitle"><div><span className="eyebrow">BIODATA</span><h3>➕ Add / Edit Biodata</h3></div></div>
      <div className="formGrid"><input className="adminInput" placeholder="Profile ID" value={form.id} onChange={e=>setForm({...form,id:e.target.value})}/><select className="adminInput" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="female">Female</option><option value="male">Male</option></select></div>
      <input className="adminInput" placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><textarea className="adminInput" rows="2" placeholder="Full Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
      <div className="formGrid"><input className="adminInput" placeholder="Mobile" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,"").slice(0,10)})}/><input className="adminInput" type="number" min="18" value={form.age} placeholder="Age" onChange={e=>setForm({...form,age:e.target.value})}/></div>
      <input className="adminInput" placeholder="Income" value={form.income} onChange={e=>setForm({...form,income:e.target.value})}/>
      <label className="uploadBox">📷 1-5 Photos<input type="file" accept="image/*" multiple onChange={chooseFiles}/><small>Storage nahi. Photos compressed hokar Firestore mein save hongi.</small></label>{preview&&<div className="uploadPreview"><img src={preview} alt="Preview"/></div>}
      <button className="primaryAction" disabled={saving}>{saving?"Saving...":"💾 Biodata Save करें →"}</button></form>
      <div className="adminList"><div className="listHead"><h3>📋 All Biodata / Paid Photos</h3><span>{profiles.length}</span></div>{profiles.map(p=><div className="userAdminCard" key={p.id}><div className="rowProfile"><img src={p.photos?.[0]||p.photo||""} alt=""/><div><b>{p.id}</b><small>{p.gender==="female"?"Female":"Male"}</small></div></div><div className="cardButtons"><button onClick={()=>editProfile(p)}>✏️ Edit</button><button onClick={()=>removeProfile(p.id)}>🗑 Delete</button></div></div>)}</div></>}

    {(tab==="access100"||tab==="access500")&&<div className="adminList"><div className="listHead"><h3>{tab==="access100"?"₹100 Paid Biodata":"₹500 Paid Mobile / Contact"} Requests</h3><span>{requests.filter(x=>x.amount===(tab==="access100"?100:500)).length}</span></div>
      {requests.filter(x=>x.amount===(tab==="access100"?100:500)).map(x=>{const p=profiles.find(p=>p.id===x.profileId);return <div className="userAdminCard" key={x.id}><div className="rowProfile">{p?.photos?.[0]?<img src={p.photos[0]} alt=""/>:<div className="rowPlaceholder">📷</div>}<div><b>{x.profileId}</b><small>User: {x.uid}</small><small>Amount: ₹{x.amount} • {x.status}</small><small>UTR: {x.utr||"-"}</small><small>{x.createdAt?.toDate?.()?.toLocaleString?.()||""}</small></div></div><div className="cardButtons">{x.status==="pending"&&<><button className="approve" onClick={()=>approveAccess(x)}>✓ Approve</button><button onClick={()=>rejectAccess(x)}>✕ Reject</button></>}</div></div>})}</div>}

    {tab==="wallet"&&<div className="adminList"><div className="listHead"><h3>💰 Wallet Recharge Requests</h3><span>{recharges.length}</span></div>{recharges.map(x=><div className="userAdminCard" key={x.id}><div><b>{x.uid}</b><small>Requested: ₹{x.amount}</small><small>UTR: {x.utr||"-"}</small><small>Status: {x.status}</small></div><div className="cardButtons">{x.status==="pending"&&<><button className="approve" onClick={()=>approveRecharge(x)}>✓ Approve</button><button onClick={()=>rejectRecharge(x)}>✕ Reject</button></>}</div></div>)}</div>}

    {tab==="transactions"&&<div className="adminList"><div className="listHead"><h3>🧾 All Wallet / Payment Transactions</h3><span>{transactions.length}</span></div>{transactions.map(x=><div className="adminRow" key={x.id}><span><b>{x.type} • ₹{x.amount}</b><small>UID: {x.uid}</small><small>Profile: {x.profileId||"-"} • UTR: {x.utr||"-"}</small><small>{x.createdAt?.toDate?.()?.toLocaleString?.()||""}</small></span></div>)}</div>}

    {tab==="registrations"&&<div className="adminList"><div className="listHead"><h3>📝 Old ₹100 Registrations</h3><span>{regs.length}</span></div>{regs.map(x=><div className="adminRow" key={x.id}><span><b>{x.name} • ₹{x.fee}</b><small>{x.phone} • Profile: {x.profileId}</small><small>UTR: {x.utr||"-"} • {x.status}</small></span>{x.status==="utr_submitted"&&<div className="cardButtons"><button className="approve" onClick={()=>verifyReg(x,"verified")}>✓ Verify</button><button onClick={()=>verifyReg(x,"rejected")}>✕ Reject</button></div>}</div>)}</div>}

    {tab==="settings"&&<><form className="adminBox" onSubmit={savePayment}><h3>💳 UPI Payment Settings</h3><input className="adminInput" placeholder="UPI ID" value={upi} onChange={e=>setUpi(e.target.value)}/><label className="uploadBox">QR Image<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setQrFile(f);setQrPreview(URL.createObjectURL(f))}}}/></label>{qrPreview&&<div className="uploadPreview"><img src={qrPreview} alt="QR"/></div>}<button className="primaryAction">💾 Payment Save →</button></form>
    <form className="adminBox" onSubmit={saveSocial}><h3>📲 Social Links</h3><input className="adminInput" placeholder="WhatsApp" value={social.whatsapp} onChange={e=>setSocial({...social,whatsapp:e.target.value})}/><input className="adminInput" placeholder="Facebook" value={social.facebook} onChange={e=>setSocial({...social,facebook:e.target.value})}/><input className="adminInput" placeholder="Instagram" value={social.instagram} onChange={e=>setSocial({...social,instagram:e.target.value})}/><button className="primaryAction">💾 Social Save →</button></form>
    <form className="adminBox" onSubmit={saveWallpaper}><h3>🖼️ Home Wallpaper</h3><input className="adminInput" type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setWallFile(f);setWallPreview(URL.createObjectURL(f))}}}/>{wallPreview&&<div className="uploadPreview"><img src={wallPreview} alt="Wallpaper"/></div>}<button className="primaryAction">💾 Wallpaper Save →</button></form></>}
  </section></main>;
}
