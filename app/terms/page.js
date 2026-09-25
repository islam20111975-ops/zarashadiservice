import Link from "next/link";

export const metadata={title:"Terms & Conditions",description:"Zara Shadi Service terms and conditions"};

export default function Terms(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📋</div><h1>Terms & Conditions</h1><div className="pageContent"><p>Zara Shadi Service par users registered rishta profiles dekhne aur website par available services ka use kar sakte hain.</p><p>Registration, profile information, payment aur access request ke waqt sahi information dena user ki responsibility hai.</p><p>Biodata ya mobile-number access paid service ke roop mein available ho sakta hai. Payment request verification aur approval ke baad access diya jata hai.</p><p>Website par kisi profile ki personal information ka misuse, unauthorised copying, sharing ya harassment ke liye use nahi kiya jana chahiye.</p><p>Zara Shadi Service par dikhayi gayi profile information ko users ko respect aur privacy ke saath use karna chahiye.</p><p>Service ke rules, fees aur available features ko zaroorat ke mutabik update kiya ja sakta hai. Website ka use karte rehne ka matlab updated terms ko follow karna hai.</p></div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/privacy">Privacy Policy</Link></div></section></main>;
}
