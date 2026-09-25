import Link from "next/link";

export const metadata={title:"Terms",description:"Zara Shadi Service terms"};

export default function Terms(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📋</div><h1>Terms & Conditions</h1><p>Zara Shadi Service par users ko registered rishta profiles dekhne aur available services use karne ka access diya jata hai.</p><p>Registration, payment aur access requests mein sahi information dena user ki responsibility hai. Payment approval verification ke baad hota hai.</p><p>Website par profile information ko authorised purpose ke liye use karein. Kisi bhi profile ki personal information ko misuse, copy ya unauthorised sharing na karein.</p><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/privacy">Privacy Policy</Link></div></section></main>;
}