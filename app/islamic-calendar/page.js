"use client";

import {useMemo, useState} from "react";

const events=[
 {date:"17 Jan 2026",hijri:"27 Rajab 1447",name:"🌙 Shab-e-Meraj / Isra' Mi'raj"},
 {date:"4 Feb 2026",hijri:"15 Sha'ban 1447",name:"✨ Shab-e-Barat / Nisfu Sha'ban"},
 {date:"19 Feb 2026",hijri:"1 Ramadan 1447",name:"🌙 Ramadan begins"},
 {date:"7 Mar 2026",hijri:"17 Ramadan 1447",name:"📖 Nuzul al-Qur'an"},
 {date:"17 Mar 2026",hijri:"27 Ramadan 1447",name:"🌙 Laylat-ul-Qadr (27th night)"},
 {date:"21 Mar 2026",hijri:"1 Shawwal 1447",name:"🕌 Eid-ul-Fitr"},
 {date:"27 May 2026",hijri:"9 Dhul-Hijjah 1447",name:"🕋 Yaum-e-Arafah / Hajj"},
 {date:"28 May 2026",hijri:"10 Dhul-Hijjah 1447",name:"🐑 Eid-ul-Adha"},
 {date:"17 Jun 2026",hijri:"1 Muharram 1448",name:"🌙 Islamic New Year"},
 {date:"25 Jun 2026",hijri:"9 Muharram 1448",name:"🌙 Tasu'a"},
 {date:"26 Jun 2026",hijri:"10 Muharram 1448",name:"🕌 Ashura"},
 {date:"26 Aug 2026",hijri:"12 Rabi-ul-Awwal 1448",name:"ﷺ Eid Milad-un-Nabi"},
 {date:"25 Sep 2026",hijri:"13 Rabi-us-Sani 1448",name:"📅 Aaj — India moon-sighting date"},
];

const months=[
["January","Rajab 1447 / Sha'ban 1447"],["February","Sha'ban 1447 / Ramadan 1447"],["March","Ramadan 1447 / Shawwal 1447"],
["April","Shawwal 1447 / Dhul-Qa'dah 1447"],["May","Dhul-Qa'dah 1447 / Dhul-Hijjah 1447"],["June","Dhul-Hijjah 1447 / Muharram 1448"],
["July","Muharram 1448 / Safar 1448"],["August","Safar 1448 / Rabi-ul-Awwal 1448"],["September","Rabi-ul-Awwal 1448 / Rabi-us-Sani 1448"],
["October","Rabi-us-Sani 1448 / Jumada al-Ula 1448"],["November","Jumada al-Ula / Jumada al-Akhirah 1448"],["December","Jumada al-Akhirah / Rajab 1448"]
];

export default function IslamicCalendar(){
 const [showEvents,setShowEvents]=useState(true);
 const today=new Date();
 const todayText=today.toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});
 const currentMonth=today.getMonth();
 const monthName=today.toLocaleDateString("en-IN",{month:"long"});
 const upcoming=useMemo(()=>events.filter((e,i)=>i>0).slice(0,8),[]);
 return <main className="calendarPage">
  <header className="calendarHero">
   <a className="calendarBack" href="/">← Zara Nikah Service</a>
   <div className="calendarMoon">🌙</div>
   <div className="calendarEyebrow">ISLAMIC CALENDAR • INDIA</div>
   <h1>Islamic Calendar 2026</h1>
   <p>Hijri dates, important Islamic occasions and festivals</p>
   <div className="todayCalendarCard">
    <div><small>आज की तारीख</small><strong>25 September 2026</strong></div>
    <div><small>आज की हिजरी तारीख</small><strong>13 Rabi-us-Sani 1448 AH</strong></div>
   </div>
   <div className="calendarNote">🌙 भारत में चाँद देखने के अनुसार तारीख बदल सकती है। 25 September को Maghrib के बाद अगली हिजरी तारीख शुरू होगी।</div>
  </header>

  <section className="calendarBody">
   <div className="calendarSectionTitle"><span>📅</span><div><h2>2026 के 12 महीने</h2><small>Hijri + Gregorian calendar</small></div></div>
   <div className="monthGrid">{months.map((m,i)=><div className={i===currentMonth?"monthCard activeMonth":"monthCard"} key={m[0]}><b>{m[0]}</b><small>{m[1]}</small>{i===currentMonth&&<em>● वर्तमान महीना</em>}</div>)}</div>

   <div className="calendarSectionTitle eventsTitle"><span>✨</span><div><h2>इस्लामी त्योहार और महत्वपूर्ण दिन</h2><small>2026 की प्रमुख तारीखें</small></div><button onClick={()=>setShowEvents(v=>!v)}>{showEvents?"छुपाएँ":"दिखाएँ"}</button></div>
   {showEvents&&<div className="eventList">{events.map(e=><div className={e.date==="25 Sep 2026"?"eventCard todayEvent":"eventCard"} key={e.date+e.name}><div className="eventDate">{e.date}</div><div className="eventInfo"><strong>{e.name}</strong><small>{e.hijri} AH</small></div></div>)}</div>}

   <div className="calendarSectionTitle"><span>🌙</span><div><h2>आने वाले दिन</h2><small>Calendar reference</small></div></div>
   <div className="upcomingList">{upcoming.map(e=><div className="upcomingItem" key={e.date}><span>{e.date}</span><b>{e.name}</b><small>{e.hijri}</small></div>)}</div>

   <div className="calendarDisclaimer">नोट: इस्लामी महीनों की शुरुआत स्थानीय चाँद देखने के आधार पर 1 दिन आगे या पीछे हो सकती है। इसलिए Ramadan, Eid और अन्य अवसरों की अंतिम तारीख स्थानीय ऐलान के अनुसार मानें।</div>
  </section>
  <footer className="calendarFooter"><a href="/">Home</a><a href="/#profiles">💍 Profiles</a><a href="/about">About</a><a href="/contact">Contact</a></footer>
 </main>
}