import "./globals.css";

export const metadata={
 title:{default:"Zara Shadi Service",template:"%s | Zara Shadi Service"},
 description:"Zara Shadi Service — Aapka Rishta, Hamari Zimmedari. Verified nikah profiles ke liye simple aur privacy-focused service.",
 applicationName:"Zara Shadi Service",
 keywords:["Zara Shadi Service","Nikah Service","Marriage Profiles","Rishta Service"],
 openGraph:{title:"Zara Shadi Service",description:"Aapka Rishta, Hamari Zimmedari",type:"website",url:"https://zarashadiservice.vercel.app/"},
 twitter:{card:"summary",title:"Zara Shadi Service",description:"Aapka Rishta, Hamari Zimmedari"}
};

export default function RootLayout({children}){return <html lang="hi"><body>{children}</body></html>}
