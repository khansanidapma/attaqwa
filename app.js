const state = {
  config: null,
  coords: null,
  timezone: "Asia/Jakarta",
  city: "Bogor",
  prayerTimes: {},
  lastFetch: null
};

const $ = (id) => document.getElementById(id);

async function loadConfig(){
  const res = await fetch("config.json", {cache:"no-store"});
  state.config = await res.json();
  $("announcement").textContent = state.config.announcement;
  $("quoteText").textContent = state.config.dailyMessage;
  $("methodLabel").textContent = state.config.calculationLabel;
}

function pad(n){return String(n).padStart(2,"0");}
function fmtTime(d){return `${pad(d.getHours())}:${pad(d.getMinutes())}`;}

function showToast(msg){
  const el=$("toast"); el.textContent=msg; el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),2800);
}

function updateClock(){
  const now = new Date();
  $("clock").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  $("dateLine").textContent = new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:state.timezone}).format(now);
}
setInterval(updateClock,1000);

function getHijriFromApi(data){
  const h = data?.date?.hijri;
  if(!h) return "";
  return `${h.day} ${h.month?.en || ""} ${h.year} H`;
}

function geoFallback(){
  state.coords = state.config.fallback;
  state.timezone = "Asia/Jakarta";
  state.city = state.config.fallback.label;
  $("locationText").textContent = `${state.city} (lokasi default)`;
  $("footerLocation").textContent = "Bogor • lokasi default";
  showToast("Lokasi tidak diizinkan. Menggunakan Bogor sebagai lokasi awal.");
  fetchPrayerTimes();
}

function detectLocation(){
  if(!navigator.geolocation){ geoFallback(); return; }
  $("locationText").textContent = "Meminta akses lokasi…";
  navigator.geolocation.getCurrentPosition(async pos=>{
    state.coords={lat:pos.coords.latitude,lon:pos.coords.longitude};
    // Reverse geocoding is optional; prayer calculations only need coordinates.
    state.city = "Lokasi perangkat";
    $("locationText").textContent = `Lokasi perangkat • ${state.coords.lat.toFixed(3)}, ${state.coords.lon.toFixed(3)}`;
    $("footerLocation").textContent = "Lokasi perangkat";
    await fetchPrayerTimes();
  }, ()=>geoFallback(), {enableHighAccuracy:true,timeout:10000,maximumAge:3600000});
}

async function fetchPrayerTimes(){
  try{
    const today = new Date();
    const date = `${today.getDate().toString().padStart(2,"0")}-${(today.getMonth()+1).toString().padStart(2,"0")}-${today.getFullYear()}`;
    const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${state.coords.lat}&longitude=${state.coords.lon}&method=${state.config.calculationMethod}&school=${state.config.school}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error("API error");
    const data = await res.json();
    const d=data.data;
    state.prayerTimes={
      Fajr:d.timings.Fajr, Sunrise:d.timings.Sunrise, Dhuhr:d.timings.Dhuhr,
      Asr:d.timings.Asr, Maghrib:d.timings.Maghrib, Isha:d.timings.Isha
    };
    state.timezone=d.meta?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
    $("hijriLine").textContent = getHijriFromApi(d);
    state.lastFetch = new Date();
    $("lastUpdated").textContent = `Diperbarui ${fmtTime(state.lastFetch)}`;
    renderPrayers();
    updateNextPrayer();
    setOnline(true);
  }catch(e){
    setOnline(false);
    showToast("Jadwal gagal dimuat. Coba periksa koneksi internet.");
  }
}

function prayerDate(time){
  const [h,m]=time.split(":").map(Number);
  const now=new Date();
  const d=new Date(now);
  d.setHours(h,m,0,0);
  return d;
}

function renderPrayers(){
  const names={Fajr:"Subuh",Sunrise:"Terbit",Dhuhr:"Dzuhur",Asr:"Ashar",Maghrib:"Maghrib",Isha:"Isya"};
  const grid=$("prayerGrid"); grid.innerHTML="";
  for(const [key,time] of Object.entries(state.prayerTimes)){
    const card=document.createElement("div");
    card.className="prayer-card"; card.dataset.key=key;
    card.innerHTML=`<div class="name">${names[key]}</div><div class="time">${time}</div>`;
    grid.appendChild(card);
  }
}

function updateNextPrayer(){
  if(!Object.keys(state.prayerTimes).length) return;
  const order=["Fajr","Dhuhr","Asr","Maghrib","Isha"];
  const labels={Fajr:"Subuh",Dhuhr:"Dzuhur",Asr:"Ashar",Maghrib:"Maghrib",Isha:"Isya"};
  const now=new Date();
  let current=null,next=null;
  for(const key of order){
    const d=prayerDate(state.prayerTimes[key]);
    if(now>=d) current=key;
    if(!next && d>now) next=key;
  }
  if(!next) next="Fajr";
  let target=prayerDate(state.prayerTimes[next]);
  if(next==="Fajr" && target<=now) target.setDate(target.getDate()+1);

  $("nextPrayerName").textContent=labels[next];
  $("nextPrayerTime").textContent=state.prayerTimes[next];
  let diff=Math.max(0,target-now);
  const sec=Math.floor(diff/1000);
  $("countdown").textContent=`${pad(Math.floor(sec/3600))}:${pad(Math.floor((sec%3600)/60))}:${pad(sec%60)}`;
  $("currentLabel").textContent=current ? `Salat terakhir: ${labels[current]}` : "Belum masuk waktu salat";

  document.querySelectorAll(".prayer-card").forEach(c=>{
    c.classList.toggle("active",c.dataset.key===next);
    c.querySelector(".now-badge")?.remove();
    if(c.dataset.key===next){
      const b=document.createElement("div"); b.className="now-badge"; b.textContent="BERIKUTNYA"; c.appendChild(b);
    }
  });
}
setInterval(updateNextPrayer,1000);

function qiblaBearing(lat,lon){
  const ka=21.4225*Math.PI/180, ko=39.8262*Math.PI/180;
  const p=lat*Math.PI/180,l=lon*Math.PI/180;
  const y=Math.sin(ko-l);
  const x=Math.cos(p)*Math.tan(ka)-Math.sin(p)*Math.cos(ko-l);
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}
function updateExtras(){
  if(!state.coords) return;
  $("qibla").textContent=Math.round(qiblaBearing(state.coords.lat,state.coords.lon))+"°";
  $("sunrise").textContent=state.prayerTimes.Sunrise||"--:--";
  $("sunset").textContent=state.prayerTimes.Maghrib||"--:--";
}
setInterval(updateExtras,1000);

function setOnline(ok){
  $("connectionDot").classList.toggle("offline",!ok);
  $("connectionText").textContent=ok?"Online":"Offline";
}

$("fullscreenBtn").addEventListener("click",async()=>{
  try{
    if(!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  }catch{}
});

window.addEventListener("online",()=>setOnline(true));
window.addEventListener("offline",()=>setOnline(false));

(async function init(){
  try{
    await loadConfig();
    updateClock();
    detectLocation();
    setInterval(()=>{ if(state.coords) fetchPrayerTimes(); }, 30*60*1000);
    setInterval(updateExtras,1000);
  }catch(e){
    showToast("Konfigurasi gagal dimuat.");
  }
})();

if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
