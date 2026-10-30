"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {onAuthStateChanged} from "firebase/auth";
import {collection,query,where,onSnapshot,doc,updateDoc} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";
export default function NotificationsPage(){
 const router=useRouter();const [user,setUser]=useState(undefined),[items,setItems]=useState([]),[error,setError]=useState("");
 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>{if(!user)return;return onSnapshot(query(collection(db,"notifications"),where("uid","==",user.uid)),s=>{const rows=s.docs.map(d=>({id:d.id,...d.data()}));rows.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));setItems(rows)},e=>setError("Notifications load nahi hue: "+e.message));},[user]);
 async function markRead(x){try{await updateDoc(doc(db,"notifications",x.id),{read:true,readAt:new Date()})}catch(e){setError(e.message)}}
 async function markAllRead(){try{const unread=items.filter(x=>!x.read);for(let i=0;i<unread.length;i+=400){await Promise.all(unread.slice(i,i+400).map(x=>updateDoc(doc(db,"notifications",x.id),{read:true,readAt:new Date()})));}}catch(e){setError("सभी सूचनाएँ पढ़ी हुई नहीं हो सकीं: "+e.message)}}
 if(user===undefined)return <main><section className="cardPage">Loading...</section></main>;
 if(!user)return <main><section className="cardPage"><h1>🔔 Notifications</h1><p>Pehle Google Login karein.</p><button className="primaryAction" onClick={()=>router.push("/")}>Home</button></section></main>;
 return <main><section className="cardPage" style={{maxWidth:760,textAlign:"left",padding:20}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><span className="eyebrow">ZARA NIKAH SERVICE</span><h1>🔔 आपकी सूचनाएँ</h1></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{items.some(x=>!x.read)&&<button className="primaryAction" style={{width:"auto",margin:0}} onClick={markAllRead}>सभी पढ़ लिया</button>}<button className="backAction" style={{width:"auto",margin:0}} onClick={()=>router.push("/")}>← Home</button></div></div>{items.length?items.map(x=><article key={x.id} style={{padding:14,marginTop:12,borderRadius:14,border:"1px solid #e8dff0",background:x.read?"#fff":"#f5f0ff"}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><b>{x.title||"Zara Nikah Service"}</b>{!x.read&&<span style={{fontSize:11,color:"#7c3aed",fontWeight:800}}>NEW</span>}</div><p style={{margin:"8px 0",whiteSpace:"pre-wrap"}}>{x.message||""}</p><small style={{color:"#76687e"}}>{x.createdAt?.toDate?.()?.toLocaleString?.("en-IN")||"Just now"}</small>{!x.read&&<button className="backAction" style={{marginTop:8}} onClick={()=>markRead(x)}>पढ़ लिया</button>}</article>):<p>अभी कोई नई सूचना नहीं है।</p>}{error&&<div className="errorBox">{error}</div>}</section></main>;
}
