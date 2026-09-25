import Link from "next/link";

export const metadata={title:"Contact",description:"Zara Shadi Service contact details"};

export default function Contact(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📩</div><h1>Contact Zara Shadi Service</h1><div className="pageContent"><p>Zara Shadi Service se contact karne ke liye website par diye gaye WhatsApp/social contact option ka use karein.</p><p>Message mein apna naam aur apni query ya zaroori details likhein, taaki aapki request ko samajhna aur jawab dena aasaan ho.</p><p>Profile, registration, payment, biodata access ya mobile-number access se related sawal bhi message ke zariye bheje ja sakte hain.</p><p>Please bina zaroorat personal ya sensitive information share na karein.</p></div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/privacy">Privacy Policy</Link></div></section></main>;
}
