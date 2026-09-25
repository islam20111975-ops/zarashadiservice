import Link from "next/link";

export default function NotFound(){
 return <main><section className="cardPage siteState"><div className="siteStateIcon">🔎</div><h1>Page nahi mila</h1><p>Jo page aap dhoondh rahe hain woh available nahi hai.</p><Link className="primaryAction" href="/">← Zara Shadi Home</Link></section></main>;
}
