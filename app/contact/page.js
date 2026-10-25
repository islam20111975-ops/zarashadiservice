"use client";

import Link from "next/link";
import {useState} from "react";

export default function Contact(){
  const [name,setName]=useState("");
  const [replyEmail,setReplyEmail]=useState("");
  const [helpType,setHelpType]=useState("Profile / Biodata");
  const [reference,setReference]=useState("");
  const [message,setMessage]=useState("");
  function submitHelp(e){
    e.preventDefault();
    const subject="Zara Nikah Service Help Request - "+helpType;
    const body=[
      "Help request for Zara Nikah Service",
      "Name: "+name,
      "Reply email: "+(replyEmail||"Not provided"),
      "Help topic: "+helpType,
      "Profile ID / payment reference (optional): "+(reference||"Not provided"),
      "",
      "Message:",
      message,
      "",
      "Please do not include OTP, UPI PIN, password, or full bank details."
    ].join("\n");
    window.location.href="mailto:ngogrant454@gmail.com?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
  }
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📩</div><h1>Contact Zara Nikah Service</h1><div className="pageContent">
    <p>Profile, registration, payment, biodata access ya mobile-number access se related help ke liye neeche form bharein.</p>
    <h2>Email support</h2><p><strong>Email:</strong> <a href="mailto:ngogrant454@gmail.com">ngogrant454@gmail.com</a></p>
    <p><strong>WhatsApp support:</strong> <a href="https://wa.me/917378342192" target="_blank" rel="noreferrer">7378342192 par WhatsApp message bhejein</a>.</p>
    <h2>Help request form</h2>
    <form onSubmit={submitHelp} style={{display:"grid",gap:14,marginTop:16}}>
      <label style={{display:"grid",gap:6}}>Aapka naam
        <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Apna naam likhein" autoComplete="name" style={{width:"100%",padding:12,border:"1px solid #cfc7d8",borderRadius:10,font:"inherit"}} />
      </label>
      <label style={{display:"grid",gap:6}}>Aapka email (optional)
        <input type="email" value={replyEmail} onChange={e=>setReplyEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={{width:"100%",padding:12,border:"1px solid #cfc7d8",borderRadius:10,font:"inherit"}} />
      </label>
      <label style={{display:"grid",gap:6}}>Kis cheez mein help chahiye?
        <select value={helpType} onChange={e=>setHelpType(e.target.value)} style={{width:"100%",padding:12,border:"1px solid #cfc7d8",borderRadius:10,font:"inherit",background:"white"}}>
          <option>Profile / Biodata</option><option>Login / Account</option><option>Payment / UTR</option><option>Mobile number access</option><option>Registration</option><option>Privacy / Profile removal</option><option>Other help</option>
        </select>
      </label>
      <label style={{display:"grid",gap:6}}>Profile ID ya payment reference (optional)
        <input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Profile ID / transaction date / UTR ke aakhri digits" style={{width:"100%",padding:12,border:"1px solid #cfc7d8",borderRadius:10,font:"inherit"}} />
      </label>
      <label style={{display:"grid",gap:6}}>Apni problem batayein
        <textarea required minLength={10} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Yahan apni help request likhein..." rows={5} style={{width:"100%",padding:12,border:"1px solid #cfc7d8",borderRadius:10,font:"inherit",resize:"vertical"}} />
      </label>
      <p style={{fontSize:13,color:"#655b6c",margin:0}}>Submit karne par aapke device ka email app khulega aur message support email ke liye taiyar hoga. Wahan se Send dabana zaroori hai. OTP, UPI PIN, password ya poori bank details kabhi na bhejein.</p>
      <button type="submit" className="primaryAction">✉️ Email Help Request</button>
    </form>
    <h2>Before making a payment</h2><p>Amount, kis cheez ka access mil raha hai, approval process aur refund/cancellation terms ko samajh lein. Payment receipt apne paas rakhein. Payment issue mein transaction date aur zaroori reference dein, lekin sensitive banking details share na karein.</p>
    <p>Reply ka waqt request volume ke mutabiq badal sakta hai.</p>
  </div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/privacy">Privacy Policy</Link></div></section></main>;
}
