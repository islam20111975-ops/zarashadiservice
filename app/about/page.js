import Link from "next/link";

export const metadata={title:"About Us",description:"Zara Nikah Service ke mission, rishta profile process aur privacy ke baare mein"};

export default function About(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">💍</div><h1>About Zara Nikah Service</h1><div className="pageContent">
    <p>Zara Nikah Service ek online nikah aur rishta-profile platform hai. Iska maqsad baligh users aur families ko nikah ke liye profiles dekhne aur service process samajhne ka ek organised tareeqa dena hai.</p>
    <h2>Our purpose</h2><p>Hum rishta search ko simple aur respectful banane ki koshish karte hain. Website par Male Rishte aur Female Rishte ke options, profile access features aur service updates available ho sakte hain.</p>
    <h2>How the service works</h2><p>Users website par login karke available profile options dekh sakte hain. Kuch private biodata ya contact details ke liye alag access process ya fee ho sakti hai; payment se pehle amount aur terms zaroor padhein.</p>
    <h2>Privacy and independent verification</h2><p>Users ko doosron ki private information ki hifazat karni chahiye. Website ka “verified” label shaadi, compatibility, character ya har profile detail ki guarantee nahi hai. Families ko apni zaroori independent checks karni chahiye aur kisi bhi faisle mein jaldi ya pressure se bachna chahiye.</p>
    <p>Service, payment ya profile access ke sawal ke liye <Link href="/contact">Contact page</Link> dekhein. Website use karne se pehle <Link href="/terms">Terms &amp; Conditions</Link> aur <Link href="/privacy">Privacy Policy</Link> bhi padhein.</p>
  </div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/contact">Contact</Link></div></section></main>;
}
