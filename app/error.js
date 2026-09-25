"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";

export default function Error({error,reset}){
 const router=useRouter();
 useEffect(()=>{console.error("Zara Nikah page error:",error)},[error]);
 return <main><section className="cardPage siteState"><div className="siteStateIcon">⚠️</div><h1>Kuch problem aa gayi</h1><p>Page load nahi ho saka. Dobara try karein.</p><div className="siteStateActions"><button className="primaryAction" onClick={()=>reset()}>↻ Dobara Try Karein</button><button className="backAction" onClick={()=>router.push("/")}>← Home</button></div></section></main>;
}
