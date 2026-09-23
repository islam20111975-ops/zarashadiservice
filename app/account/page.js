"use client";

import {useEffect,useState} from "react";
import {GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from "firebase/auth";
import {doc,getDoc,setDoc,serverTimestamp} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

const empty={name:"",address:"",phone:"",age:"",income:"",photoURL:""};

function compressPhoto(file,maxSide=700,maxChars=650000){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
      const w=Math.max(1,Math.round(img.naturalWidth*scale));
      const h=Math.max(1,Math.round(img.naturalHeight*scale));
      const canvas=document.createElement("canvas");
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext("2d");
      ctx.drawImage(img,0,0,w,h);
      let quality=.72;
      let data=canvas.toDataURL("image/jpeg",quality);
      while(data.length>maxChars&&quality>.35){
        quality-=.06;
        data=canvas.toDataURL("image/jpeg",quality);
      }
      if(data.length>maxChars)reject(new Error("Photo bahut badi hai. Chhoti photo select karein."));
      else resolve(data);
    };
    img.onerror=()=>{
      URL.revokeObjectURL(url);
      reject(new Error("Photo read nahi ho saki."));
    };
    img.src=url;
  });
}

export default function Account(){
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(empty);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState("");
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState("");

  useEffect(()=>{
    return onAuthStateChanged(auth,async u=>{
      setUser(u);
      if(!u){setLoading(false);return;}
      try{
        const s=await getDoc(doc(db,"users",u.uid));
        if(s.exists())setProfile({...empty,...s.data()});
      }catch(e){
        setMsg("Profile load nahi hua: "+(e.code||e.message));
      }
      setLoading(false);
    });
  },[]);

  async function login(){
    setMsg("");
    try{
      await signInWithPopup(auth,new GoogleAuthProvider());
    }catch(e){setMsg(e.code||e.message)}
  }

  function choosePhoto(e){
    const f=e.target.files?.[0];
    if(!f)return;
    if(!f.type.startsWith("image/"))return setMsg("Sirf image upload karein.");
    if(f.size>10*1024*1024)return setMsg("Photo 10 MB se chhoti honi chahiye.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg("");
  }

  async function save(e){
    e.preventDefault();
    if(!user)return;
    const phone=profile.phone.replace(/\D/g,"");
    if(!profile.name.trim()||!profile.address.trim()||!/^[6-9]\d{9}$/.test(phone)||!profile.age||!profile.income.trim()){
      setMsg("Name, Address, Mobile, Age aur Income sab bharna zaroori hai.");
      return;
    }

    setSaving(true);setMsg("");
    try{
      let photoURL=profile.photoURL||"";
      if(file)photoURL=await compressPhoto(file);

      await setDoc(doc(db,"users",user.uid),{
        uid:user.uid,
        name:profile.name.trim(),
        address:profile.address.trim(),
        phone,
        age:Number(profile.age),
        income:profile.income.trim(),
        photoURL,
        email:user.email||"",
        createdAt:profile.createdAt||serverTimestamp(),
        updatedAt:serverTimestamp()
      },{merge:true});

      setProfile({...profile,phone,photoURL});
      setFile(null);
      setPreview(photoURL);
      setMsg("Profile save ho gaya.");
    }catch(e){
      setMsg("Profile save nahi hua: "+(e.code||e.message));
    }finally{
      setSaving(false);
    }
  }

  if(loading)return <main><section className="cardPage"><h1>Loading...</h1></section></main>;

  if(!user)return <main><section className="cardPage">
    <div className="adminIcon">👤</div>
    <span className="eyebrow">ZARA SHADI SERVICE</span>
    <h1>My Profile</h1>
    <p>Apna profile banane ke liye Google se login karein.</p>
    <button className="primaryAction" onClick={login}>Google se Login →</button>
    {msg&&<div className="messageBox">{msg}</div>}
  </section></main>;

  return <main><section className="cardPage" style={{maxWidth:700,margin:"30px auto"}}>
    <div style={{textAlign:"center"}}>
      <span className="eyebrow">MY PROFILE</span>
      <h1>Apni Profile</h1>
      <div style={{margin:"18px auto",width:120,height:120,borderRadius:"50%",overflow:"hidden",border:"4px solid #eee",background:"#f3f4f6"}}>
        {(preview||profile.photoURL)?
          <img src={preview||profile.photoURL} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:
          <span style={{fontSize:52,lineHeight:"120px"}}>👤</span>}
      </div>
    </div>

    <form className="paymentForm" onSubmit={save}>
      <label>📷 Apni Photo
        <input className="adminInput" type="file" accept="image/*" onChange={choosePhoto}/>
        <small>Photo automatically compress hokar free Firestore mein save hogi.</small>
      </label>

      <label>पूरा नाम
        <input className="adminInput" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/>
      </label>

      <label>पूरा Address
        <textarea className="adminInput" rows="3" value={profile.address} onChange={e=>setProfile({...profile,address:e.target.value})}/>
      </label>

      <label>Mobile Number
        <input className="adminInput" inputMode="tel" maxLength="10" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value.replace(/\D/g,"").slice(0,10)})}/>
      </label>

      <label>Age
        <input className="adminInput" type="number" min="18" max="100" value={profile.age} onChange={e=>setProfile({...profile,age:e.target.value})}/>
      </label>

      <label>Income
        <input className="adminInput" placeholder="₹ जैसे 25000" value={profile.income} onChange={e=>setProfile({...profile,income:e.target.value})}/>
      </label>

      <label>Google Email
        <input className="adminInput" value={user.email||""} readOnly/>
      </label>

      <label>User ID
        <input className="adminInput" value={user.uid} readOnly/>
      </label>

      <button className="primaryAction" disabled={saving}>
        {saving?"Saving...":"💾 Profile Save करें"} <span>→</span>
      </button>
    </form>

    {msg&&<div className="messageBox">{msg}</div>}
    <button className="backAction" onClick={()=>signOut(auth)}>🚪 Logout</button>
  </section></main>;
}
