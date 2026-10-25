export default function sitemap(){
  const base="https://zarashadiservice.vercel.app";
  const pages=[
    ["",1.0,"daily"],
    ["/about",0.6,"monthly"],
    ["/contact",0.5,"monthly"],
    ["/privacy",0.4,"yearly"],
    ["/terms",0.4,"yearly"],
    ["/refund-policy",0.4,"yearly"],
    ["/nikah-guide",0.8,"monthly"],
    ["/islamic-calendar",0.6,"monthly"]
  ];
  return pages.map(([path,priority,changeFrequency])=>({
    url:base+path,
    changeFrequency,
    priority
  }));
}
