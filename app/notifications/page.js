"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {onAuthStateChanged} from "firebase/auth";
import {collection,query,where,onSnapshot,doc,updateDoc,setDoc,serverTimestamp} from "firebase/firestore";
import {auth,db,firebaseConfig} from "../../lib/firebase";

const VAPID_PUBLIC_KEY="BNLuXHsA6GCWIFARTYdGVKLFne4kMoY-YyjXFmXBQUZneQAKHzpZTYPQXKTdvC6kIKWNtVGuIUI0irQAsOoM9io";

export default function NotificationsPage(){
 const router=useRouter();
 const [user,setUser]=useState(undefined),[items,setItems]=useState([]),[error,setError]=useState(""),[pushStatus,setPushStatus]=useState(""),[pushBusy,setPushBusy]=useState(false);
 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>{if(!user)return;return onSnapshot(query(collection(db,"notifications"),where("uid","==",user.uid)),s=>{const rows=s.docs.map(d=>({id:d.id,...d.data()}));rows.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));setItems(rows)},e=>setError("Notifications load nahi hue: "+e.message));},[user]);
 async function enablePush(){
  if(!user||pushBusy)return;
  setPushBusy(true);setError("");setPushStatus("");
  try{
   if(!("Notification" in window)||!("serviceWorker" in navigator)){setPushStatus("Is browser mein phone notifications support nahi hain.");return;}
   const permission=await Notification.requestPermission();
   if(permission!=="granted"){setPushStatus("Notification permission allow nahi hui.");return;}
   const supported=await import("firebase/messaging").then(m=>m.isSupported());
   if(!supported){setPushStatus("Is browser/device par push notification available nahi hai.");return;}
   const registration=await navigator.serviceWorker.register("/sw.js");
   const messaging=await import("firebase/messaging").then(m=>m.getMessaging());
   const token=await import("firebase/messaging").then(m=>m.getToken(messaging,{vapidKey:VAPID_PUBLIC_KEY,serviceWorkerRegistration:registration}));
   if(!token)throw new Error("Notification token nahi mila.");
   const tokenId=encodeURIComponent(token).replaceAll("%","_");
   await setDoc(doc(db,"pushTokens",tokenId),{uid:user.uid,token,updatedAt:serverTimestamp()},{merge:true});
   setPushStatus("मोबाइल नोटिफिकेशन चालू हो गया है।");
  }catch(e){setError("Push notification चालू नहीं हुई: "+e.message)}
  finally{setPushBusy(false)}
 }
 async function markRead(x){try{await updateDoc(doc(db,"notifications",x.id),{read:true,readAt:new Date()})}catch(e){setError(e.message)}}
 async function markAllRead(){try{const unread=items.filter(x=>!x.read);for(let i=0;i<unread.length;i+=400){await Promise.all(unread.slice(i,i+400).map(x=>updateDoc(doc(db,"notifications",x.id),{read:true,readAt:new Date()})));}}catch(e){setError("सभी सूचनाएँ पढ़ी हुई नहीं हो सकीं: "+e.message)}}
 if(user===undefined)return <main><section className="cardPage">Loading...</section></main>;
 if(!user)return <main><section className="cardPage"><h1>🔔 Notifications</h1><p>Pehle Google Login karein.</p><button className="primaryAction" onClick={()=>router.push("/")}>Home</button></section></main>;
 return <main><section className="cardPage" style={{maxWidth:760,textAlign:"left",padding:20}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><span className="eyebrow">ZARA NIKAH SERVICE</span><h1>🔔 आपकी सूचनाएँ</h1></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{items.some(x=>!x.read)&&<button className="primaryAction" style={{width:"auto",margin:0}} onClick={markAllRead}>सभी पढ़ लिया</button>}<button className="backAction" style={{width:"auto",margin:0}} onClick={()=>router.push("/")}>← Home</button></div></div>
 <div style={{marginTop:14,padding:14,border:"1px solid #e8dff0",borderRadius:14,background:"#faf7ff"}}><b>📲 मोबाइल पर नई सूचना पाएँ</b><p style={{margin:"6px 0 10px"}}>नई प्रोफाइल या एडमिन के जवाब की सूचना फोन पर पाने के लिए एक बार अनुमति दें।</p><button className="primaryAction" style={{width:"auto",margin:0}} disabled={pushBusy} onClick={enablePush}>{pushBusy?"चालू हो रहा है...":"🔔 मोबाइल नोटिफिकेशन चालू करें"}</button>{pushStatus&&<p style={{marginBottom:0}}>{pushStatus}</p>}</div>
 {items.length?items.map(x=><article key={x.id} style={{padding:14,marginTop:12,borderRadius:14,border:"1px solid #e8dff0",background:x.read?"#fff":"#f5f0ff"}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><b>{x.title||"Zara Nikah Service"}</b>{!x.read&&<span style={{fontSize:11,color:"#7c3aed",fontWeight:800}}>NEW</span>}</div><p style={{margin:"8px 0",whiteSpace:"pre-wrap"}}>{x.message||""}</p><small style={{color:"#76687e"}}>{x.createdAt?.toDate?.()?.toLocaleString?.("en-IN")||"Just now"}</small>{!x.read&&<button className="backAction" style={{marginTop:8}} onClick={()=>markRead(x)}>पढ़ लिया</button>}</article>):<p>अभी कोई नई सूचना नहीं है।</p>}{error&&<div className="errorBox">{error}</div>}</section></main>;
}
