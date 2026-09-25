"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {doc,getDoc} from "firebase/firestore";
import {db} from "../../lib/firebase";

const fallback="Zara Shadi Service users ki information ko service provide karne aur account/profile management ke liye use karta hai.\n\nGoogle login se milne wali basic account information aur user dwara submit ki gayi profile information ko service ke purpose ke liye process kiya ja sakta hai.\n\nPrivate biodata, contact/mobile number aur payment-related information ko public profile par bina authorised access ke display nahi kiya jata.\n\nPayment ke waqt diya gaya UTR/Transaction ID payment verification aur request processing ke liye use kiya ja sakta hai.\n\nUsers ko apni personal information sirf utni hi submit karni chahiye jitni service ke liye zaroori ho. Kisi privacy concern ke liye Contact page ke madhyam se message karein.";

export default function Privacy(){
  const [content,setContent]=useState("");
  useEffect(()=>{getDoc(doc(db,"settings","legalPages")).then(s=>{if(s.exists())setContent(s.data().privacy||"")}).catch(()=>{})},[]);
  return <main><section className="cardPage siteState"><div className="siteStateIcon">🔒</div><h1>Privacy Policy</h1><div className="pageContent">{content||fallback}</div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/contact">Contact</Link></div></section></main>;
}
