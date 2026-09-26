"use client";

import {useEffect,useState} from "react";
import {Suspense} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signInWithRedirect} from "firebase/auth";
import {collection,deleteDoc,doc,getDoc,onSnapshot,setDoc,serverTimestamp,writeBatch} from "firebase/firestore";
import {auth,db} from "../../../lib/firebase";

const ADMIN="ngogrant454@gmail.com";
const empty={id:"",gender:"female",name:"",address:"",phone:"",age:"",income:"",description:"",
 maritalStatus:"",height:"",dob:"",birthPlace:"",education:"",occupation:"",company:"",city:"",district:"",state:"",nativePlace:"",
 religion:"",caste:"",language:"",fatherName:"",motherName:"",brothers:"",sisters:"",familyDetails:"",expectations:"",
 preferredAge:"",preferredEducation:"",preferredLocation:"",otherExpectations:"",otherInfo:""};

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

function dataUrlToSlider(dataUrl,maxSide=320,maxChars=45000){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
      const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
      const c=document.createElement("canvas");c.width=w;c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      let q=.7,data=c.toDataURL("image/jpeg",q);
      while(data.length>maxChars&&q>.25){q-=.06;data=c.toDataURL("image/jpeg",q)}
      if(data.length>maxChars)reject(new Error("Slider image bahut badi hai."));
      else resolve(data);
    };
    img.onerror=()=>reject(new Error("Slider image read nahi hui."));
    img.src=dataUrl;
  });
}

function BiodataAdminPage(){
  const router=useRouter(),params=useSearchParams();
  const [user,setUser]=useState(undefined),[profiles,setProfiles]=useState([]),[form,setForm]=useState(empty);
  const [files,setFiles]=useState([]),[preview,setPreview]=useState([]),[search,setSearch]=useState("");
  const [saving,setSaving]=useState(false),[error,setError]=useState(""),[adminView,setAdminView]=useState(null),[viewLoading,setViewLoading]=useState(false);

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
      setForm({...empty,id:edit,gender:p.gender||"female",...d,phone:d.phone||""});
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
    if(!/^[A-Za-z0-9_-]{2,40}$/.test(id))return setError("Profile ID sirf letters, numbers, _ ya - mein 2–40 characters ka hona chahiye.");
    if(!id)return setError("Profile ID bharna zaroori hai.");
    if(phone&&!/^[6-9]\d{9}$/.test(phone))return setError("Mobile number 10 digit ka hona chahiye.");
    setSaving(true);
    try{
      const ref=doc(db,"profiles",id),old=await getDoc(ref),editing=old.exists();
      let photos=[];
      if(files.length)photos=await Promise.all(files.map(f=>imageToDataUrl(f)));
      else if(editing)photos=old.data().photos||[old.data().photo].filter(Boolean);
      if(!photos.length)return setError("Kam se kam 1 photo zaroori hai.");
      const sliderImage=await dataUrlToSlider(photos[0]);
      const batch=writeBatch(db);
      batch.set(ref,{profileId:id,gender:form.gender,photos,photo:photos[0],status:"active",updatedAt:serverTimestamp()},{merge:true});
      batch.set(doc(db,"homeSliderImages",id),{profileId:id,image:sliderImage,status:"active",updatedAt:serverTimestamp()},{merge:true});
      batch.set(doc(db,"profileBiodataPrivate",id),{
        profileId:id,gender:form.gender,name:form.name.trim(),address:form.address.trim(),age:Number(form.age),income:form.income.trim(),
        maritalStatus:form.maritalStatus.trim(),height:form.height.trim(),dob:form.dob.trim(),birthPlace:form.birthPlace.trim(),
        education:form.education.trim(),occupation:form.occupation.trim(),company:form.company.trim(),city:form.city.trim(),
        district:form.district.trim(),state:form.state.trim(),nativePlace:form.nativePlace.trim(),religion:form.religion.trim(),
        caste:form.caste.trim(),language:form.language.trim(),fatherName:form.fatherName.trim(),motherName:form.motherName.trim(),
        brothers:form.brothers.trim(),sisters:form.sisters.trim(),familyDetails:form.familyDetails.trim(),description:form.description.trim(),
        expectations:form.expectations.trim(),preferredAge:form.preferredAge.trim(),preferredEducation:form.preferredEducation.trim(),
        preferredLocation:form.preferredLocation.trim(),otherExpectations:form.otherExpectations.trim(),otherInfo:form.otherInfo.trim(),
        updatedAt:serverTimestamp()
      },{merge:true});
      batch.set(doc(db,"profileContact",id),{
        profileId:id,phone,updatedAt:serverTimestamp()
      },{merge:true});
      await batch.commit();
      alert(editing?"Biodata update ho gaya.":"Naya Biodata save ho gaya.");
      resetForm();
    }catch(e){setError("Biodata save nahi hua: "+e.message)}finally{setSaving(false)}
  }

  const fieldLabels={
    name:"Full Name",address:"Full Address",age:"Age",income:"Income",maritalStatus:"Marital Status",height:"Height",
    dob:"Date of Birth",birthPlace:"Birth Place",education:"Education",occupation:"Occupation / Business",
    company:"Company / Institution",city:"City",district:"District",state:"State",nativePlace:"Native Place / Hometown",
    religion:"Religion / Maslak",caste:"Biradari / Community",language:"Language / Mother Tongue",
    fatherName:"Father Name",motherName:"Mother Name",brothers:"Brothers",sisters:"Sisters",familyDetails:"Family Details",
    description:"About / Biodata Description",expectations:"Marriage / Partner Expectations",preferredAge:"Preferred Age",
    preferredEducation:"Preferred Education",preferredLocation:"Preferred Location",otherExpectations:"Other Expectations",
    otherInfo:"Other Important Information"
  };

  async function viewAdmin(p){
    setViewLoading(true);setError("");
    try{
      const [s,cs]=await Promise.all([
        getDoc(doc(db,"profileBiodataPrivate",p.id)),
        getDoc(doc(db,"profileContact",p.id))
      ]);
      setAdminView({id:p.id,profile:p,biodata:s.exists()?s.data():{},contact:cs.exists()?cs.data():{}});
    }catch(e){setError("Biodata view nahi hua: "+e.message)}
    finally{setViewLoading(false)}
  }

  async function edit(p){
    const [s,cs]=await Promise.all([getDoc(doc(db,"profileBiodataPrivate",p.id)),getDoc(doc(db,"profileContact",p.id))]);
    const d=s.exists()?s.data():{},contact=cs.exists()?cs.data():{};
    setForm({...empty,id:p.id,gender:p.gender||"female",...d,phone:contact.phone||""});
    setPreview(p.photos||[p.photo].filter(Boolean));setFiles([]);router.replace("/admin/biodata?edit="+encodeURIComponent(p.id));window.scrollTo({top:0,behavior:"smooth"});
  }

  async function remove(p){
    if(p.status==="deleted")return;
    if(!confirm("Is biodata ko hide karein? Paid payment/access history delete nahi hogi."))return;
    try{
      await setDoc(doc(db,"profiles",p.id),{status:"deleted",updatedAt:serverTimestamp()},{merge:true});
      alert("Biodata hide ho gaya.");
    }catch(e){setError(e.message)}
  }

  async function permanentlyDelete(p){
    if(!confirm("⚠️ Profile "+p.id+" ko PERMANENTLY DELETE karein? Biodata, photo aur mobile record delete ho jayega. Payment/access history delete nahi hogi."))return;
    try{
      await Promise.all([
        deleteDoc(doc(db,"profiles",p.id)),
        deleteDoc(doc(db,"profileBiodataPrivate",p.id)),
        deleteDoc(doc(db,"profileContact",p.id)),
        deleteDoc(doc(db,"homeSliderImages",p.id))
      ]);
      if(params.get("edit")===p.id)resetForm();
      if(adminView?.id===p.id)setAdminView(null);
      alert("Profile "+p.id+" permanently delete ho gaya.");
    }catch(e){setError("Profile delete nahi hua: "+e.message)}
  }

  const filtered=profiles.filter(p=>(p.id+" "+p.gender+" "+(p.name||"")).toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.id.localeCompare(b.id));
  if(user===undefined)return <main><section className="admin cardPage"><h1>Loading...</h1></section></main>;
  if(!user)return <main><section className="admin cardPage"><div className="adminIcon">🔐</div><h1>Admin Login</h1><p>Google se Admin login karein.</p><button className="primaryAction" onClick={login}>Google Login →</button>{error&&<div className="errorBox">{error}</div>}</section></main>;
  if(user.email?.toLowerCase()!==ADMIN)return <main><section className="admin cardPage"><div className="adminIcon">🚫</div><h1>Access Denied</h1><button className="backAction" onClick={()=>auth.signOut()}>Logout</button></section></main>;

  return <main><section className="admin dashboardPage">
    <div className="dashTop"><div><span className="eyebrow">ZARA NIKAH SERVICE</span><h1>📋 Biodata Management</h1><p>Har person ka biodata, photo aur description alag record rahega.</p></div><button className="logout" onClick={()=>router.push("/admin")}>← Admin Board</button></div>
    {error&&<div className="errorBox">{error}</div>}
    <form className="adminBox biodataForm" onSubmit={save}>
      <div className="boxTitle"><div><span className="eyebrow">SEPARATE BIODATA</span><h3>{form.id?"✏️ Edit Biodata":"➕ New Biodata"}</h3></div><div style={{display:"flex",gap:8,alignItems:"center"}}>{form.id&&<button type="button" className="backAction" style={{width:"auto",marginTop:0}} onClick={resetForm}>+ New</button>}<button type="submit" className="primaryAction" style={{width:"auto",marginTop:0,whiteSpace:"nowrap"}} disabled={saving}>{saving?"Saving...":"💾 Save Biodata"}</button></div></div>
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
      <div className="formGrid">
        <input className="adminInput" placeholder="Marital Status" value={form.maritalStatus} onChange={e=>setForm({...form,maritalStatus:e.target.value})}/>
        <input className="adminInput" placeholder="Height" value={form.height} onChange={e=>setForm({...form,height:e.target.value})}/>
      </div>
      <div className="formGrid">
        <input className="adminInput" placeholder="Date of Birth" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})}/>
        <input className="adminInput" placeholder="Birth Place" value={form.birthPlace} onChange={e=>setForm({...form,birthPlace:e.target.value})}/>
      </div>
      <div className="formGrid">
        <input className="adminInput" placeholder="Education" value={form.education} onChange={e=>setForm({...form,education:e.target.value})}/>
        <input className="adminInput" placeholder="Occupation / Business" value={form.occupation} onChange={e=>setForm({...form,occupation:e.target.value})}/>
      </div>
      <input className="adminInput" placeholder="Company / Institution" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/>
      <div className="formGrid">
        <input className="adminInput" placeholder="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/>
        <input className="adminInput" placeholder="District" value={form.district} onChange={e=>setForm({...form,district:e.target.value})}/>
      </div>
      <div className="formGrid">
        <input className="adminInput" placeholder="State" value={form.state} onChange={e=>setForm({...form,state:e.target.value})}/>
        <input className="adminInput" placeholder="Native Place / Hometown" value={form.nativePlace} onChange={e=>setForm({...form,nativePlace:e.target.value})}/>
      </div>
      <div className="formGrid">
        <input className="adminInput" placeholder="Religion / Maslak" value={form.religion} onChange={e=>setForm({...form,religion:e.target.value})}/>
        <input className="adminInput" placeholder="Biradari / Community" value={form.caste} onChange={e=>setForm({...form,caste:e.target.value})}/>
      </div>
      <input className="adminInput" placeholder="Language / Mother Tongue" value={form.language} onChange={e=>setForm({...form,language:e.target.value})}/>
      <div className="formGrid">
        <input className="adminInput" placeholder="Father Name" value={form.fatherName} onChange={e=>setForm({...form,fatherName:e.target.value})}/>
        <input className="adminInput" placeholder="Mother Name" value={form.motherName} onChange={e=>setForm({...form,motherName:e.target.value})}/>
      </div>
      <div className="formGrid">
        <input className="adminInput" placeholder="Brothers" value={form.brothers} onChange={e=>setForm({...form,brothers:e.target.value})}/>
        <input className="adminInput" placeholder="Sisters" value={form.sisters} onChange={e=>setForm({...form,sisters:e.target.value})}/>
      </div>
      <textarea className="adminInput" rows="3" placeholder="Family Details" value={form.familyDetails} onChange={e=>setForm({...form,familyDetails:e.target.value})}/>
      <textarea className="adminInput descriptionBox" rows="5" placeholder="About / Biodata Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
      <textarea className="adminInput" rows="4" placeholder="Marriage / Partner Expectations" value={form.expectations} onChange={e=>setForm({...form,expectations:e.target.value})}/>
      <div className="formGrid">
        <input className="adminInput" placeholder="Preferred Age" value={form.preferredAge} onChange={e=>setForm({...form,preferredAge:e.target.value})}/>
        <input className="adminInput" placeholder="Preferred Education" value={form.preferredEducation} onChange={e=>setForm({...form,preferredEducation:e.target.value})}/>
      </div>
      <input className="adminInput" placeholder="Preferred Location" value={form.preferredLocation} onChange={e=>setForm({...form,preferredLocation:e.target.value})}/>
      <textarea className="adminInput" rows="3" placeholder="Other Expectations" value={form.otherExpectations} onChange={e=>setForm({...form,otherExpectations:e.target.value})}/>
      <textarea className="adminInput" rows="3" placeholder="Other Important Information" value={form.otherInfo} onChange={e=>setForm({...form,otherInfo:e.target.value})}/>
      <label className="uploadBox">📷 1–5 Photos<input type="file" accept="image/*" multiple onChange={chooseFiles}/><small>Photos compress hokar Firestore mein save hongi.</small></label>
      {preview.length>0&&<div className="photoPreviewGrid">{preview.map((s,i)=><img key={i} src={s} alt={"Preview "+(i+1)}/>)}</div>}
      <div className="messageBox">💾 ऊपर <b>Save Biodata</b> button दबाकर इस biodata को save/update करें.</div>
    </form>

    <div className="adminList">
      <div className="listHead"><div><h3>📋 All Biodata</h3><small>Har card ek alag Profile ID hai.</small></div><span>{filtered.length}</span></div>
      <input className="adminInput" placeholder="🔎 Profile ID / Name / Gender search..." value={search} onChange={e=>setSearch(e.target.value)}/>
      {filtered.length===0?<div className="empty">Koi Biodata nahi mila.</div>:filtered.map(p=>{
        const photos=p.photos?.length?p.photos:[p.photo].filter(Boolean);
        return <div className="userAdminCard" key={p.id}>
          <div className="rowProfile">{photos[0]?<img src={photos[0]} alt=""/>:<div className="rowPlaceholder">📷</div>}<div><b>{p.id}</b><small>{p.gender==="female"?"Female":"Male"}</small><small>{p.status==="deleted"?"⚠️ Hidden":"✓ Active"}</small></div></div>
          <div className="cardButtons"><button onClick={()=>edit(p)}>✏️ Edit</button>{p.status==="deleted"?<button onClick={async()=>{try{await setDoc(doc(db,"profiles",p.id),{status:"active",updatedAt:serverTimestamp()},{merge:true});alert("Biodata restore ho gaya.");}catch(e){setError(e.message)}}}>↩️ Restore</button>:<button onClick={()=>remove(p)}>🗑 Hide</button>}<button onClick={()=>viewAdmin(p)}>👁 View</button><button onClick={()=>permanentlyDelete(p)} style={{color:"#b42318",borderColor:"#f3b5b0"}}>❌ Delete</button></div>
        </div>
      })}
    </div>

    {adminView&&<div onClick={()=>setAdminView(null)} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(20,12,35,.68)",padding:"18px",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:760,margin:"20px auto",background:"#fff",borderRadius:24,padding:22,boxShadow:"0 25px 80px rgba(0,0,0,.3)",textAlign:"left"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,borderBottom:"1px solid #eee",paddingBottom:14}}>
          <div><span className="eyebrow">ADMIN VIEW</span><h2 style={{margin:"5px 0"}}>📋 Complete Biodata — {adminView.id}</h2></div>
          <button className="backAction" style={{width:"auto",margin:0}} onClick={()=>setAdminView(null)}>✕ Close</button>
        </div>
        <div style={{marginTop:16,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
          {(adminView.profile.photos||[adminView.profile.photo].filter(Boolean)).map((src,i)=><img key={i} src={src} alt="" style={{width:"100%",height:190,objectFit:"cover",borderRadius:16}}/>)}
        </div>
        <div style={{marginTop:18}}>
          <h3>📱 Contact</h3>
          <div className="adminBox" style={{margin:0,padding:15}}>Mobile: <b>{adminView.contact.phone||adminView.biodata.phone||"Not entered"}</b></div>
          <h3 style={{marginTop:22}}>📋 Biodata Details</h3>
          <div style={{display:"grid",gap:9}}>
            {Object.entries({...adminView.biodata,gender:adminView.biodata.gender||adminView.profile.gender})
              .filter(([k,v])=>!["profileId","updatedAt","phone"].includes(k)&&v!==""&&v!==null&&v!==undefined)
              .map(([k,v])=><div key={k} style={{padding:"11px 13px",background:"#faf9fc",border:"1px solid #eee",borderRadius:12}}>
                <small style={{display:"block",color:"#76687e",fontWeight:800}}>{fieldLabels[k]||"Gender"}</small>
                <b style={{display:"block",marginTop:3,whiteSpace:"pre-wrap"}}>{k==="gender"?(v==="female"?"Female":"Male"):String(v)}</b>
              </div>)}
          </div>
        </div>
      </div>
    </div>}

    {viewLoading&&<div className="messageBox">Loading complete biodata...</div>}
  </section></main>;
}


export default function BiodataAdmin(){
  return <Suspense fallback={<main><section className="admin cardPage"><h1>Loading...</h1></section></main>}><BiodataAdminPage/></Suspense>;
}
