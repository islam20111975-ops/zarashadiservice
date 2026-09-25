import Link from "next/link";

export const metadata={title:"About",description:"Zara Shadi Service ke baare mein"};

export default function About(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">💍</div><h1>About Zara Shadi Service</h1><div className="pageContent"><p>Zara Shadi Service ek online Nikah aur rishta profile service hai. Hamara maqsad serious rishta search karne wale users ko registered profiles ek simple aur organised platform par available karana hai.</p><p>Website par profiles ko manage kiya jata hai aur users ko available service ke rules ke mutabik profile information ka access diya jata hai.</p><p>Zara Shadi Service ka focus simple process, privacy aur Nikah ke liye serious rishta search par hai.</p><p>Kisi bhi service, profile ya registration se related sawal ke liye Contact page par diye gaye madhyam se message karein.</p></div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/contact">Contact</Link></div></section></main>;
}
