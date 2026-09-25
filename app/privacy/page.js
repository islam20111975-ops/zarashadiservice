"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {doc,getDoc} from "firebase/firestore";
import {db} from "../../lib/firebase";

const fallback="Privacy Policy yahan admin dashboard se likhi aur update ki jayegi.";

export default function Privacy(){
  const [content,setContent]=useState("");
  useEffect(()=>{getDoc(doc(db,"settings","legalPages")).then(s=>{if(s.exists())setContent(s.data().privacy||"")}).catch(()=>{})},[]);
  return <main><section className="cardPage siteState"><div className="siteStateIcon">🔒</div><h1>Privacy Policy</h1><div className="pageContent">{content||fallback}</div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/contact">Contact</Link></div></section></main>;
}
