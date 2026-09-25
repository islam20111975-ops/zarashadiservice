import Link from "next/link";

export const metadata={title:"Privacy Policy",description:"Zara Shadi Service privacy policy"};

export default function Privacy(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">🔒</div><h1>Privacy Policy</h1><div className="pageContent"><p>Zara Shadi Service users ki information ko service provide karne aur account/profile management ke liye use karta hai.</p><p>Google login se milne wali basic account information aur user dwara submit ki gayi profile information ko service ke purpose ke liye process kiya ja sakta hai.</p><p>Private biodata, contact/mobile number aur payment-related information ko public profile par bina authorised access ke display nahi kiya jata.</p><p>Payment ke waqt diya gaya UTR/Transaction ID payment verification aur request processing ke liye use kiya ja sakta hai.</p><p>Users ko apni personal information sirf utni hi submit karni chahiye jitni service ke liye zaroori ho. Kisi privacy concern ke liye Contact page ke madhyam se message karein.</p></div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/contact">Contact</Link></div></section></main>;
}
