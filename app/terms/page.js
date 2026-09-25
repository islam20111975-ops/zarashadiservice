"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {doc,getDoc} from "firebase/firestore";
import {db} from "../../lib/firebase";

const fallback="Zara Shadi Service par users registered rishta profiles dekhne aur website par available services ka use kar sakte hain.\n\nRegistration, profile information, payment aur access request ke waqt sahi information dena user ki responsibility hai.\n\nBiodata ya mobile-number access paid service ke roop mein available ho sakta hai. Payment request verification aur approval ke baad access diya jata hai.\n\nWebsite par kisi profile ki personal information ka misuse, unauthorised copying, sharing ya harassment ke liye use nahi kiya jana chahiye.\n\nZara Shadi Service par dikhayi gayi profile information ko users ko respect aur privacy ke saath use karna chahiye.\n\nService ke rules, fees aur available features ko zaroorat ke mutabik update kiya ja sakta hai. Website ka use karte rehne ka matlab updated terms ko follow karna hai.";

export default function Terms(){
  const [content,setContent]=useState("");
  useEffect(()=>{getDoc(doc(db,"settings","legalPages")).then(s=>{if(s.exists())setContent(s.data().terms||"")}).catch(()=>{})},[]);
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📋</div><h1>Terms & Conditions</h1><div className="pageContent">{content||fallback}</div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/privacy">Privacy Policy</Link></div></section></main>;
}
