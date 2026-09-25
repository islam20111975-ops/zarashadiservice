"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {doc,getDoc} from "firebase/firestore";
import {db} from "../../lib/firebase";

const fallback="Zara Shadi Service se contact karne ke liye website par diye gaye WhatsApp/social contact option ka use karein.\n\nMessage mein apna naam aur apni query ya zaroori details likhein, taaki aapki request ko samajhna aur jawab dena aasaan ho.\n\nProfile, registration, payment, biodata access ya mobile-number access se related sawal bhi message ke zariye bheje ja sakte hain.\n\nPlease bina zaroorat personal ya sensitive information share na karein.";

export default function Contact(){
  const [content,setContent]=useState("");
  useEffect(()=>{getDoc(doc(db,"settings","legalPages")).then(s=>{if(s.exists())setContent(s.data().contact||"")}).catch(()=>{})},[]);
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📩</div><h1>Contact Zara Shadi Service</h1><div className="pageContent">{content||fallback}</div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/privacy">Privacy Policy</Link></div></section></main>;
}
