"use client";

import {Suspense,useEffect} from "react";
import {useSearchParams,useRouter} from "next/navigation";

function RedirectToSafePayment(){
 const q=useSearchParams();
 const router=useRouter();
 useEffect(()=>{
  const profile=q.get("profile")||"";
  const type=q.get("type")==="mobile"?"mobile":"biodata";
  router.replace("/qr-recharge?profile="+encodeURIComponent(profile)+"&type="+encodeURIComponent(type));
 },[q,router]);

 return <main><section className="cardPage payment" style={{maxWidth:760,margin:"25px auto"}}><div className="notice">🔄 Secure UPI ID / QR payment page khola ja raha hai…</div></section></main>;
}

export default function Recharge(){
 return <Suspense fallback={<main><section className="cardPage">Loading...</section></main>}><RedirectToSafePayment/></Suspense>;
}
