import Link from "next/link";

export const metadata={title:"Contact",description:"Zara Shadi Service contact details"};

export default function Contact(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📩</div><h1>Contact Zara Shadi Service</h1><p>Website, profile, registration ya rishta service se related madad ke liye WhatsApp par message karein.</p><div className="siteStateActions"><a className="primaryAction" href="https://wa.me/" target="_blank" rel="noreferrer">🟢 WhatsApp Message</a><Link className="backAction" href="/">← Home</Link></div><p style={{marginTop:18,fontSize:13}}>Please message karein; zaroori details aur query text mein bhejein.</p></section></main>;
}