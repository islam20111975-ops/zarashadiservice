"use client";

import {useEffect,useState} from "react";
import {GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from "firebase/auth";
import {doc,getDoc,setDoc,collection,onSnapshot,query,where,serverTimestamp} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

const empty={name:"",address:"",phone:"",age:"",income:"",photoURL:""};
function compressPhoto(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);const scale=Math.min(1,700/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement("canvas");c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);c.getContext("2d").drawImage(img,0,0,c.width,c.height);let q=.7,data=c.toDataURL("image/jpeg",q);while(data.length>600000&&q>.3){q-=.06;data=c.toDataURL("image/jpeg",q)}data.length>650000?reject(new Error("Photo chhoti karein.")):resolve(data)};img.onerror=()=>reject(new Error("Photo read nahi hui."));img.src=url})}

export default function Account(){
  const [user,setUser]=useState(null),[profile,setProfile]=useState(empty),[wallet,setWallet]=useState(0),[tx,setTx]=useState([]),[requests,setRequests]=useState([]);
  const [file,setFile]=useState(null),[preview,setPreview]=useState(""),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false),[loginError,setLoginError]=useState("");

  useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u);if(!u)return;const s=await getDoc(doc(db,"users",u.uid));if(s.exists())setProfile({...empty,...s.data()});}),[]);
  useEffect(()=>{
    if(!user)return;
    const unsubTx=onSnapshot(
      query(collection(db,"walletTransactions"),where("uid","==",user.uid)),
      s=>setTx(s.docs.map(d=>({id:d.id,...d.data()})))
    );
    const unsubReq=onSnapshot(
      query(collection(db,"walletRechargeRequests"),where("uid","==",user.uid)),
      s=>setRequests(s.docs.map(d=>({id:d.id,...d.data()})))
    );
    const unsubUser=onSnapshot(
      doc(db,"users",user.uid),
      s=>{if(s.exists())setWallet(Number(s.data().walletBalance||0))}
    );
    return()=>{unsubTx();unsubReq();unsubUser()};
  },[user]);

  function choosePhoto(e){const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith("image/")||f.size>10*1024*1024)return setMsg("Image 10 MB se chhoti honi chahiye.");setFile(f);setPreview(URL.createObjectURL(f))}
  async function save(e){e.preventDefault();if(!user)return;const phone=profile.phone.replace(/\D/g,"");if(!profile.name.trim()||!profile.address.trim()||!/^[6-9]\d{9}$/.test(phone)||!profile.age||!profile.income.trim())return setMsg("Name, Address, Mobile, Age aur Income sab bharna zaroori hai.");setSaving(true);setMsg("");try{let photoURL=profile.photoURL||"";if(file)photoURL=await compressPhoto(file);await setDoc(doc(db,"users",user.uid),{uid:user.uid,name:profile.name.trim(),address:profile.address.trim(),phone,age:Number(profile.age),income:profile.income.trim(),photoURL,email:user.email||"",createdAt:profile.createdAt||serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});setProfile({...profile,phone,photoURL});setFile(null);setPreview(photoURL);setMsg("Profile save ho gaya.")}catch(e){setMsg(e.message)}finally{setSaving(false)}}
  if(!user)return <main><section className="cardPage"><div className="adminIcon">👤</div><h1>My Profile</h1><p>Google se login karein.</p><button className="primaryAction" onClick={()=>signInWithPopup(auth,new GoogleAuthProvider())}>Google se Login →</button></section></main>;
  const pending=requests.filter(x=>x.status==="pending");
  return <main><section className="cardPage" style={{maxWidth:760,margin:"25px auto"}}>
    <div style={{textAlign:"center"}}><span className="eyebrow">MY ACCOUNT</span><h1>Apni Profile & Wallet</h1><div style={{margin:"15px auto",width:120,height:120,borderRadius:"50%",overflow:"hidden",background:"#eee"}}>{(preview||profile.photoURL)?<img src={preview||profile.photoURL} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:55,lineHeight:"120px"}}>👤</span>}</div></div>
    <form className="paymentForm" onSubmit={save}><label>📷 Apni Photo<input className="adminInput" type="file" accept="image/*" onChange={choosePhoto}/></label><label>पूरा नाम<input className="adminInput" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></label><label>Address<textarea className="adminInput" rows="2" value={profile.address} onChange={e=>setProfile({...profile,address:e.target.value})}/></label><div className="formGrid"><input className="adminInput" placeholder="Mobile" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value.replace(/\D/g,"").slice(0,10)})}/><input className="adminInput" type="number" min="18" placeholder="Age" value={profile.age} onChange={e=>setProfile({...profile,age:e.target.value})}/></div><input className="adminInput" placeholder="Income" value={profile.income} onChange={e=>setProfile({...profile,income:e.target.value})}/><input className="adminInput" value={user.email||""} readOnly/><input className="adminInput" value={user.uid} readOnly/><button className="primaryAction" disabled={saving}>{saving?"Saving...":"💾 Profile Save करें →"}</button></form>
    <div className="adminBox"><div className="boxTitle"><div><span className="eyebrow">WALLET</span><h3>💰 Wallet Balance: ₹{wallet}</h3></div></div><p className="small">Wallet में पैसे जमा करने के लिए Recharge करें.</p><button type="button" className="primaryAction" onClick={()=>location.href="/wallet-recharge"}>💰 Wallet Recharge →</button></div>
    <div className="adminList"><div className="listHead"><h3>🧾 Recharge History</h3><span>{requests.length}</span></div>{pending.length>0&&<div className="notice" style={{marginBottom:12}}>⏳ <b>आपका Recharge Pending है</b><br/>आपका UTR मिल गया है। Admin payment verify कर रहे हैं।<br/>💰 Verification के बाद amount आपके Wallet में जल्द ही आ जाएगा।<br/>🙏 कृपया अभी थोड़ा इंतज़ार करें।</div>}{requests.map(x=><div className="adminRow" key={x.id}><span><b>₹{x.amount} • {x.status}</b><small>UTR: {x.utr}</small></span></div>)}</div>
    <div className="adminList"><div className="listHead"><h3>📊 Transactions</h3><span>{tx.length}</span></div>{tx.map(x=><div className="adminRow" key={x.id}><span><b>{x.type} • ₹{x.amount}</b><small>{x.direction==="credit"?"🟢 Credit":x.direction==="debit"?"🔴 Debit":"ℹ️ Access"} • {x.profileId||""} • {x.utr||""}{x.balanceAfter!=null?" • Balance ₹"+x.balanceAfter:""}</small></span></div>)}</div>
    {msg&&<div className="messageBox">{msg}</div>}<button className="backAction" onClick={()=>signOut(auth)}>🚪 Logout</button>
  </section></main>;
}
