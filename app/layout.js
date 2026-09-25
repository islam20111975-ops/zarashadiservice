import "./globals.css";

export const metadata={
 title:{default:"Zara Nikah Service",template:"%s | Zara Nikah Service"},
 description:"Zara Nikah Service — Aapka Rishta, Hamari Zimmedari. Verified nikah profiles ke liye simple aur privacy-focused service.",
 applicationName:"Zara Nikah Service",
 keywords:["Zara Nikah Service","Nikah Service","Marriage Profiles","Rishta Service"],
 openGraph:{title:"Zara Nikah Service",description:"Aapka Rishta, Hamari Zimmedari",type:"website",url:"https://zarashadiservice.vercel.app/"},
 twitter:{card:"summary",title:"Zara Nikah Service",description:"Aapka Rishta, Hamari Zimmedari"}
};

export default function RootLayout({children}){return <html lang="hi"><body>{children}</body></html>}
