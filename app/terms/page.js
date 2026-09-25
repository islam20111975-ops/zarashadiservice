"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {doc,getDoc} from "firebase/firestore";
import {db} from "../../lib/firebase";

const fallback="Terms & Conditions yahan admin dashboard se likhe aur update kiye jayenge.";

export default function Terms(){
  const [content,setContent]=useState("");
  useEffect(()=>{getDoc(doc(db,"settings","legalPages")).then(s=>{if(s.exists())setContent(s.data().terms||"")}).catch(()=>{})},[]);
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📋</div><h1>Terms & Conditions</h1><div className="pageContent">{content||fallback}</div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/privacy">Privacy Policy</Link></div></section></main>;
}
