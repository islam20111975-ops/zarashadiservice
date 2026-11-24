"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from "firebase/auth";
import {auth} from "../../lib/firebase";

function returnPath(){
  if(typeof window==="undefined")return "/";
  const next=new URLSearchParams(window.location.search).get("next")||"/";
  return next.startsWith("/")&&!next.startsWith("//")?next:"/";
}

export default function LoginPage(){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>onAuthStateChanged(auth,user=>{if(user){const isAdmin=["ngogrant454@gmail.com","islam20111975@gmail.com"].includes(user.email?.toLowerCase());router.replace(isAdmin?"/admin":returnPath())}}),[router]);
  async function login(){
    setBusy(true);setError("");
    try{
      const provider=new GoogleAuthProvider();
      provider.setCustomParameters({prompt:"select_account"});
      const result=await signInWithPopup(auth,provider);
      const isAdmin=["ngogrant454@gmail.com","islam20111975@gmail.com"].includes(result.user.email?.toLowerCase());
      router.replace(isAdmin?"/admin":returnPath());
    }catch(e){
      setError(e?.message||"Google Login nahi ho saka. Dobara koshish karein.");
    }finally{setBusy(false)}
  }
  return <main style={{maxWidth:520,margin:"40px auto",padding:18,color:"#241b35"}}>
    <section style={{background:"#fff",padding:26,borderRadius:18,boxShadow:"0 8px 30px #0001",textAlign:"center"}}>
      <div style={{fontSize:42}}>🔐</div>
      <h1>Zara Nikah Login</h1>
      <p>Profile जोड़ने और अपनी जानकारी सुरक्षित रखने के लिए Google खाते से Login करें।</p>
      <button type="button" onClick={login} disabled={busy} style={{width:"100%",padding:14,background:"#6b21a8",color:"#fff",border:0,borderRadius:10,fontWeight:700,cursor:"pointer"}}>
        {busy?"कृपया इंतज़ार करें...":"Google से Login करें"}
      </button>
      {error&&<p role="alert" style={{marginTop:14,padding:12,background:"#fff1f2",borderRadius:10,overflowWrap:"anywhere"}}>{error}</p>}
      <button type="button" onClick={()=>router.push("/")} style={{marginTop:16,padding:10,borderRadius:9}}>← Home पर जाएँ</button>
    </section>
  </main>;
}
