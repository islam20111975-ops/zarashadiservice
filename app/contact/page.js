import Link from "next/link";

export const metadata={title:"Contact Us",description:"Zara Nikah Service se rabta karne ka tareeqa"};

export default function Contact(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📩</div><h1>Contact Zara Nikah Service</h1><div className="pageContent">
    <p>Profile, registration, payment, biodata access ya mobile-number access se related sawal ke liye humse website ke official contact options ke zariye rabta karein.</p>
    <h2>How to contact</h2><p><Link href="/#contact">Homepage par WhatsApp aur social contact options</Link> dekhein. Agar koi social button homepage par nazar nahi aa raha, to mumkin hai uska link abhi configure na hua ho.</p>
    <p><strong>WhatsApp support:</strong> <a href="https://wa.me/917378342192" target="_blank" rel="noreferrer">7378342192 par WhatsApp message bhejein</a>. Agar link open na ho, number ko WhatsApp mein khol kar message karein.</p>
    <p>Message mein apni query, relevant profile ID aur payment issue ho to transaction date/UTR ka reference dein. Public post mein full bank details, OTP, password ya ID document share na karein.</p>
    <h2>Before making a payment</h2><p>Amount, kis cheez ka access mil raha hai, approval process aur refund/cancellation terms ko samajh lein. Payment receipt aur UTR ko apne paas rakhein.</p>
    <p>Hum koshish karte hain ke requests ko service ke mutabiq handle karein. Reply ka waqt request volume ke mutabiq badal sakta hai.</p>
  </div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/privacy">Privacy Policy</Link></div></section></main>;
}
