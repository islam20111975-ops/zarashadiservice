import Link from "next/link";

export const metadata={title:"Privacy Policy",description:"Zara Shadi Service privacy policy"};

export default function Privacy(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">🔒</div><h1>Privacy Policy</h1><p>Hum users ki profile aur account information ko service chalane ke liye use karte hain. Private profile information ko authorised access ke bina public display nahi kiya jata.</p><p>Payment ke waqt diya gaya UTR/transaction reference payment verification aur request processing ke liye use ho sakta hai. Sensitive payment information ko public profile par display nahi kiya jata.</p><p>Apni personal information sirf wahi submit karein jo service ke liye zaroori ho. Kisi bhi privacy concern ke liye Contact page se message karein.</p><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/contact">Contact</Link></div></section></main>;
}