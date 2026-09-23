"use client";

import {useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signInWithRedirect} from "firebase/auth";
import {collection,deleteDoc,doc,getDoc,onSnapshot,setDoc,serverTimestamp} from "firebase/firestore";
import {auth,db} from "../../../lib/firebase";

const ADMIN="ngogrant454@gmail.com";
const empty={id:"",gender:"female",name:"",address:"",phone:"",age:"",income:"",description:""};

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

export default function BiodataAdmin(){
  const router=useRouter(),params=useSearchParams();
  const [user,setUser]=useState(undefined),[profiles,setProfiles]=useState([]),[form,setForm]=useState(empty);
  const [files,setFiles]=useState([]),[preview,setPreview]=useState([]),[search,setSearch]=useState("");
  const [saving,setSaving]=useState(false),[error,setError]=useState("");

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{
    if(user?.email?.toLowerCase()!==ADMIN)return;
    return onSnapshot(collection(db,"profiles"),s=>setProfiles(s.docs.map(d=>({id:d.id,...d.data()}))),e=>setError(e.message));
  },[user]);

  useEffect(()=>{
    const edit=params.get("edit");
    if(!edit||!profiles.length)return;
    const p=profiles.find(x=>x.id===edit);
    if(!p)return;
    getDoc(doc(db,"profileBiodataPrivate",edit)).then(s=>{
      const d=s.exists()?s.data():{};
      setForm({id:edit,gender:p.gender||"female",name:d.name||"",address:d.address||"",phone:d.phone||"",age:d.age||"",income:d.income||"",description:d.description||""});
      setPreview(p.photos||[p.photo].filter(Boolean));
    }).catch(e=>setError(e.message));
  },[params,profiles]);

  async function login(){
    setError("");
    const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});
    try{await signInWithPopup(auth,p)}catch(e){
      if(["auth/popup-blocked","auth/popup-closed-by-user"].includes(e.code)){try{await signInWithRedirect(auth,p)}catch(x){setError(x.message)}}else setError(e.message);
    }
  }

  function chooseFiles(e){
    const fs=Array.from(e.target.files||[]);
    if(fs.length<1||fs.length>5)return setError("1 se 5 photos select karein.");
    if(fs.some(f=>!f.type.startsWith("image/")||f.size>10*1024*1024))return setError("Sirf image aur har file 10 MB se chhoti.");
    setFiles(fs);setPreview(fs.map(f=>URL.createObjectURL(f)));setError("");
  }

  function resetForm(){setForm(empty);setFiles([]);setPreview([]);router.replace("/admin/biodata")}

  async function save(e){
    e.preventDefault();setError("");
    const id=form.id.trim(),phone=form.phone.replace(/\D/g,"");
    if(!id||!form.name.trim()||!form.address.trim()||!/^[6-9]\d{9}$/.test(phone)||!form.age||!form.income.trim()||!form.description.trim())
      return setError("Profile ID, Name, Address, Mobile, Age, Income aur Description sab bharna zaroori hai.");
    setSaving(true);
    try{
      const ref=doc(db,"profiles",id),old=await getDoc(ref),editing=old.exists();
      if(!editing && old.exists())return;
      let photos=[];
      if(files.length)photos=await Promise.all(files.map(f=>imageToDataUrl(f)));
      else if(editing)photos=old.data().photos||[old.data().photo].filter(Boolean);
      if(!photos.length)return setError("Kam se kam 1 photo zaroori hai.");
      await setDoc(ref,{profileId:id,gender:form.gender,photos,photo:photos[0],status:"active",updatedAt:serverTimestamp()},{merge:true});
      await setDoc(doc(db,"profileBiodataPrivate",id),{
        profileId:id,name:form.name.trim(),address:form.address.trim(),age:Number(form.age),
        income:form.income.trim(),description:form.description.trim(),updatedAt:serverTimestamp()
      },{merge:true});
      await setDoc(doc(db,"profileContact",id),{
        profileId:id,phone,updatedAt:serverTimestamp()
      },{merge:true});
      alert(editing?"Biodata update ho gaya.":"Naya Biodata save ho gaya.");
      resetForm();
    }catch(e){setError("Biodata save nahi hua: "+e.message)}finally{setSaving(false)}
  }

  async function edit(p){
    const s=await getDoc(doc(db,"profileBiodataPrivate",p.id)),d=s.exists()?s.data():{};
    setForm({id:p.id,gender:p.gender||"female",name:d.name||"",address:d.address||"",phone:"",age:d.age||"",income:d.income||"",description:d.description||""});
    setPreview(p.photos||[p.photo].filter(Boolean));setFiles([]);window.scrollTo({top:0,behavior:"smooth"});
  }

  async function remove(p){
    if(!confirm("Is biodata ko delete karein? Paid payment/access history delete nahi hogi."))return;
    try{
      await setDoc(doc(db,"profiles",p.id),{status:"deleted",updatedAt:serverTimestamp()},{merge:true});
      alert("Biodata delete/hidden ho gaya.");
    }catch(e){setError(e.message)}
  }

  const filtered=profiles.filter(p=>(p.id+" "+p.gender+" "+(p.name||"")).toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.id.localeCompare(b.id));
  if(user===undefined)return <main><section className="admin cardPage"><h1>Loading...</h1></section></main>;
  if(!user)return <main><section className="admin cardPage"><div className="adminIcon">🔐</div><h1>Admin Login</h1><p>Google se Admin login karein.</p><button className="primaryAction" onClick={login}>Google Login →</button>{error&&<div className="errorBox">{error}</div>}</section></main>;
  if(user.email?.toLowerCase()!==ADMIN)return <main><section className="admin cardPage"><div className="adminIcon">🚫</div><h1>Access Denied</h1><button className="backAction" onClick={()=>auth.signOut()}>Logout</button></section></main>;

  return <main><section className="admin dashboardPage">
    <div className="dashTop"><div><span className="eyebrow">ZARA SHADI SERVICE</span><h1>📋 Biodata Management</h1><p>Har person ka biodata, photo aur description alag record rahega.</p></div><button className="logout" onClick={()=>router.push("/admin")}>← Admin Board</button></div>
    {error&&<div className="errorBox">{error}</div>}
    <form className="adminBox" onSubmit={save}>
      <div className="boxTitle"><div><span className="eyebrow">SEPARATE BIODATA</span><h3>{form.id?"✏️ Edit Biodata":"➕ New Biodata"}</h3></div>{form.id&&<button type="button" className="backAction" onClick={resetForm}>+ New</button>}</div>
      <div className="formGrid">
        <input className="adminInput" placeholder="Profile ID (unique)" value={form.id} disabled={!!params.get("edit")} onChange={e=>setForm({...form,id:e.target.value})}/>
        <select className="adminInput" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="female">Female</option><option value="male">Male</option></select>
      </div>
      <input className="adminInput" placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <textarea className="adminInput" rows="3" placeholder="Full Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
      <div className="formGrid">
        <input className="adminInput" placeholder="Mobile" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,"").slice(0,10)})}/>
        <input className="adminInput" type="number" min="18" max="100" placeholder="Age" value={form.age} onChange={e=>setForm({...form,age:e.target.value})}/>
      </div>
      <input className="adminInput" placeholder="Income" value={form.income} onChange={e=>setForm({...form,income:e.target.value})}/>
      <textarea className="adminInput descriptionBox" rows="7" placeholder="Biodata Description — education, family, job/business, expectations, etc." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
      <label className="uploadBox">📷 1–5 Photos<input type="file" accept="image/*" multiple onChange={chooseFiles}/><small>Photos compressed hokar Firestore mein save hongi.</small></label>
      {preview.length>0&&<div className="photoPreviewGrid">{preview.map((s,i)=><img key={i} src={s} alt={"Preview "+(i+1)}/>)}</div>}
      <button className="primaryAction" disabled={saving}>{saving?"Saving...":"💾 Biodata Save करें →"}</button>
    </form>

    <div className="adminList">
      <div className="listHead"><div><h3>📋 All Biodata</h3><small>Har card ek alag Profile ID hai.</small></div><span>{filtered.length}</span></div>
      <input className="adminInput" placeholder="🔎 Profile ID / Name / Gender search..." value={search} onChange={e=>setSearch(e.target.value)}/>
      {filtered.length===0?<div className="empty">Koi Biodata nahi mila.</div>:filtered.map(p=>{
        const photos=p.photos?.length?p.photos:[p.photo].filter(Boolean);
        return <div className="userAdminCard" key={p.id}>
          <div className="rowProfile">{photos[0]?<img src={photos[0]} alt=""/>:<div className="rowPlaceholder">📷</div>}<div><b>{p.id}</b><small>{p.gender==="female"?"Female":"Male"}</small><small>{p.status==="deleted"?"⚠️ Hidden":"✓ Active"}</small></div></div>
          <div className="cardButtons"><button onClick={()=>edit(p)}>✏️ Edit</button><button onClick={()=>remove(p)}>🗑 Delete</button><button onClick={()=>router.push("/profile/"+encodeURIComponent(p.id))}>👁 View</button></div>
        </div>
      })}
    </div>
  </section></main>;
}
