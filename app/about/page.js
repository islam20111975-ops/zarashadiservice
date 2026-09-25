import Link from "next/link";

export const metadata={title:"About",description:"Zara Shadi Service ke baare mein"};

export default function About(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">💍</div><h1>About Zara Shadi Service</h1><p>Zara Shadi Service ek simple Nikah aur rishta profile service hai. Hamara maqsad serious rishta search ko aasaan banana aur registered profiles ko ek organised platform par dikhana hai.</p><p>Profiles ko manage karte waqt privacy ka khayal rakha jata hai. Website par available information ke alawa private details ko bina authorised access ke show nahi kiya jata.</p><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/contact">Contact</Link></div></section></main>;
}