// TAFSE – Drømmelandet: valg, faglige forklaringer og beregninger.
// Brukes av land-kart.js (kart og flagg) og land-editor.js (veiviseren).

const LAND_STANDARD = {
  halvkule: "N",
  lat: 58,
  areal: 120000,
  form: "kyststat",
  strom: "varm",
  tektonikk: "kollisjon",
  istid: "ja",
  ressurser: ["vannkraft"],
  folk: 4000000,
  urban: 70,
  fraksjon: "lav",
  fase: "4",
  statsform: "konstitusjonelt",
  system: "parlamentarisme",
  struktur: "enhet",
  kamre: "ett",
  domstol: "svak",
  grunnlov: "kvalifisert",
  valg: "pr",
  M: 10,
  sperre: 4,
  S: 159,
  modell: "nordisk",
  handel: "apen",
  forvaltning: "fond",
  sentralbank: "uavhengig",
  navn: "",
  hovedstad: "",
  motto: "",
  flagg: "kors",
  f1: "#c8102e",
  f2: "#ffffff",
  f3: "#0b3d91",
  fro: 1,
};

const FLAGGFARGER = [
  ["#c8102e", "Rød"], ["#0b3d91", "Blå"], ["#ffffff", "Hvit"], ["#f2c230", "Gul"], ["#127a3a", "Grønn"],
  ["#111111", "Svart"], ["#e8721c", "Oransje"], ["#5fa8dc", "Himmelblå"], ["#6b2a7a", "Purpur"], ["#c9a24a", "Gull"],
];

// Hvert valg: [verdi, navn, faglig forklaring]
const LAND_VALG = {
  halvkule: [["N", "Nordlige halvkule", ""], ["S", "Sørlige halvkule", ""]],
  form: [
    ["oy", "Øystat", "Omgitt av hav på alle kanter. Gir maritimt klima, lange kyster og ofte en sterk sjøfartskultur, men også sårbarhet for havnivåstigning og avhengighet av import."],
    ["kyststat", "Kyststat", "Kyst på én side og naboland på de andre. Den vanligste formen, med tilgang til havet og landgrenser som må forvaltes."],
    ["innland", "Innlandsstat", "Uten egen kyst. Innlandsstater har i snitt høyere transportkostnader og lavere handel, fordi varer må gjennom naboland (Faye mfl. 2004). Klimaet blir mer kontinentalt."],
  ],
  strom: [
    ["varm", "Varm havstrøm", "En varm strøm (som Golfstrømmen) frakter varme mot polene og gir mildere vintre og mer nedbør. Derfor er Norskekysten isfri langt nord for polarsirkelen."],
    ["kald", "Kald havstrøm", "En kald strøm langs kysten (som Humboldtstrømmen utenfor Peru og Chile) kjøler lufta nedenfra, gir stabil lagdeling og lite nedbør. Mange av verdens tørreste ørkener ligger ved slike kyster."],
    ["ingen", "Ingen dominerende strøm", "Kystklimaet bestemmes mest av breddegraden og de rådende vindene."],
  ],
  tektonikk: [
    ["passiv", "Stabilt kraton", "Gammel, tykk og tektonisk rolig kontinentalskorpe, ofte med en passiv kontinentalmargin mot havet. Lavt relieff, få jordskjelv, eldgamle bergarter. Typisk for Canada, Australia og store deler av Afrika."],
    ["subduksjon", "Subduksjonssone", "En havplate dykker under kontinentet. Gir en fjellkjede parallelt med kysten, aktive vulkaner og store jordskjelv. Typisk for Andesfjellene, Japan og Indonesia."],
    ["kollisjon", "Kontinental kollisjon", "To kontinenter presses sammen og bygger høye foldefjell og platåer. Himalaya og Alpene er dagens eksempler; de norske fjellene er rester av den kaledonske kollisjonen for over 400 millioner år siden."],
    ["rift", "Riftsone", "Kontinentet strekkes og revner. Gir en senket riftdal med dype innsjøer, flankert av høye skuldre og vulkaner. Typisk for Øst-Afrika; Oslofeltet er et gammelt rift."],
    ["hotspot", "Hotspot", "En mantelplume smelter seg opp gjennom platen og bygger store skjoldvulkaner. Typisk for Hawaii og Island, der Island i tillegg ligger på Den midtatlantiske ryggen."],
  ],
  istid: [
    ["ja", "Formet av istider", "Breer har gravd U-daler, fjorder og tusenvis av innsjøer, og etterlatt morener. Siste istid var på sitt største for rundt 20 000 år siden."],
    ["nei", "Ikke nedisset", "Landskapet er formet av elver, vind og forvitring. Jordsmonnet er ofte eldre og dypere forvitret, men kan være næringsfattig i tropene."],
  ],
  ressurser: [
    ["olje", "Olje og gass", "Dannes av organisk materiale begravd i tykke sedimentære bassenger, for eksempel ved passive marginer, i forlandsbassenger eller i gamle rifter som Nordsjøen."],
    ["kobber", "Kobber og gull", "Store porfyrforekomster dannes i magmatiske buer over subduksjonssoner. Chile og Peru står for en stor del av verdens kobberproduksjon."],
    ["jern", "Jernmalm", "De største forekomstene er båndet jernmalm i gamle kratoner, avsatt i havet for over to milliarder år siden (Pilbara i Australia, Carajás i Brasil)."],
    ["diamanter", "Diamanter", "Hentes opp fra over 150 km dyp i kimberlittrør, som nesten bare finnes i gamle, tykke kratoner (Botswana, Sibir, Nord-Canada)."],
    ["sjeldne", "Sjeldne jordarter", "Knyttet til karbonatitter og alkaline bergarter, ofte i riftsoner og gamle skjold. Kritiske for magneter, batterier og elektronikk."],
    ["geotermisk", "Geotermisk energi", "Krever høy varmestrøm nær overflaten: riftsoner, hotspots og vulkanske buer. Island dekker det meste av oppvarmingen sin slik."],
    ["vannkraft", "Vannkraft", "Krever både høydeforskjeller og rikelig nedbør. Norge produserer det aller meste av strømmen sin fra vannkraft."],
    ["jord", "Fruktbar jord", "Vulkansk jord, lessjord og elvesletter gir de beste jordbruksområdene. Ørkenjord krever kunstig vanning."],
  ],
  fraksjon: [
    ["lav", "Lav", "Én dominerende etnisk og språklig gruppe. Fraksjonaliseringsindeksen (sannsynligheten for at to tilfeldige innbyggere tilhører ulike grupper) er under 0,2."],
    ["middels", "Middels", "Noen få store grupper, for eksempel to språksamfunn. Indeks rundt 0,3 til 0,5."],
    ["hoy", "Høy", "Mange grupper uten et klart flertall. Indeks over 0,6. Høy fraksjonalisering er i forskningen knyttet til lavere tillit og svakere offentlige goder (Alesina mfl. 2003), men virkningen avhenger sterkt av institusjonene."],
  ],
  fase: [
    ["1", "Fase 1", "Høye fødsels- og dødsrater. Befolkningen vokser lite. Ingen land er her i dag."],
    ["2", "Fase 2", "Dødeligheten faller raskt, fødselstallene holder seg høye. Rask vekst og svært ung befolkning."],
    ["3", "Fase 3", "Fødselstallene faller. Stor arbeidsfør generasjon, mulig demografisk utbytte."],
    ["4", "Fase 4", "Lave fødsels- og dødsrater. Stabil befolkning og aldring."],
    ["5", "Fase 5", "Fruktbarheten er godt under reproduksjonsnivået på 2,1. Befolkningen eldes og krymper uten innvandring."],
  ],
  statsform: [
    ["konstitusjonelt", "Konstitusjonelt monarki", "Statsoverhodet er en arvelig monark med i hovedsak seremonielle oppgaver, mens makten utøves av folkevalgte. Slik som i Norge, Storbritannia og Japan."],
    ["absolutt", "Absolutt monarki", "Monarken har den reelle makten og er ikke bundet av en folkevalgt forsamling. I dag sjeldent (Saudi-Arabia, Eswatini, Brunei)."],
    ["republikk", "Republikk", "Statsoverhodet er valgt, direkte eller indirekte, for en avgrenset periode."],
  ],
  system: [
    ["parlamentarisme", "Parlamentarisme", "Regjeringen sitter med parlamentets tillit og kan felles ved mistillit. Den lovgivende og den utøvende makten er sammenvevd."],
    ["president", "Presidentstyre", "Presidenten er både statsoverhode og regjeringssjef, valgt for en fast periode og uavhengig av parlamentet. Klart maktskille, men risiko for fastlåste konflikter (Linz 1990)."],
    ["semi", "Semipresidentielt", "En direkte valgt president deler makten med en statsminister som er ansvarlig overfor parlamentet. Her den premier-presidentielle varianten, som i Frankrike."],
    ["direktorialt", "Direktorialt", "En kollegial regjering, valgt av parlamentet for en fast periode, uten én regjeringssjef. Sveits er det eneste klare eksempelet."],
  ],
  struktur: [
    ["enhet", "Enhetsstat", "All suveren myndighet ligger hos staten sentralt. Lokale og regionale myndigheter har bare den makten staten delegerer."],
    ["desentral", "Desentralisert enhetsstat", "Enhetsstat, men med sterke kommuner eller regioner som har eget skattegrunnlag og vide oppgaver, slik som i Norden."],
    ["foderasjon", "Føderasjon", "Makten er grunnlovsfestet delt mellom forbundsstaten og delstatene, som ikke kan avskaffes ensidig. Slik som i USA, Tyskland og Sveits."],
  ],
  kamre: [
    ["ett", "Ett kammer", "Én folkevalgt forsamling. Raske beslutninger og klart ansvar."],
    ["svakt", "To kamre, svakt overhus", "Overhuset kan forsinke, men ikke stanse lover. Slik som House of Lords."],
    ["sterkt", "To kamre, sterkt overhus", "Begge kamre må vedta lover. Gir ekstra kontroll og ofte vern om delstatene, men flere vetopunkter. Slik som det amerikanske senatet."],
  ],
  domstol: [
    ["ingen", "Ingen prøvingsrett", "Domstolene kan ikke sette lover til side. Parlamentet er suverent, slik som tradisjonelt i Storbritannia."],
    ["svak", "Moderat prøvingsrett", "Domstolene kan sette lover til side ved klar grunnlovsstrid, men er tilbakeholdne. Slik som i Norge."],
    ["sterk", "Forfatningsdomstol", "En egen domstol med vid kompetanse til å oppheve lover. Slik som i Tyskland."],
  ],
  grunnlov: [
    ["lett", "Lett å endre", "Kan endres med alminnelig flertall i parlamentet. Fleksibelt, men gir svakere vern om grunnleggende rettigheter."],
    ["kvalifisert", "Kvalifisert flertall", "Krever to tredjedels flertall, slik som i Norge, der et forslag i tillegg må fremmes før et valg og vedtas etter."],
    ["rigid", "Svært rigid", "Krever for eksempel godkjenning i delstatene eller folkeavstemning. Den amerikanske grunnloven er blant verdens vanskeligste å endre."],
  ],
  valg: [
    ["fptp", "Flertallsvalg i enmannskretser", "Den med flest stemmer i hver krets vinner. Duvergers lov: systemet tenderer mot to store partier (Duverger 1954)."],
    ["torunder", "To-rundersvalg", "Krever flertall i kretsen, ellers ny runde mellom de beste. Gir flere partier enn rent flertallsvalg, fordi de allierer seg før andre runde."],
    ["pr", "Forholdstallsvalg", "Mandatene fordeles i flermannskretser etter stemmetall. Graden av proporsjonalitet avhenger av kretsstørrelse og sperregrense."],
    ["mmp", "Blandet, kompenserende", "Halvparten velges i enmannskretser, resten fordeles slik at hele forsamlingen blir proporsjonal. Slik som i Tyskland og New Zealand."],
  ],
  modell: [
    ["lme", "Liberal markedsøkonomi", "Koordinering skjer gjennom markeder og kontrakter. Fleksible arbeidsmarkeder, sterke kapitalmarkeder og radikal innovasjon (Hall og Soskice 2001). Slik som i USA og Storbritannia."],
    ["cme", "Koordinert markedsøkonomi", "Bedrifter, fagforeninger og banker koordinerer gjennom institusjoner: yrkesopplæring, langsiktig finansiering og kollektive forhandlinger. Gir gradvis innovasjon (Hall og Soskice 2001). Slik som i Tyskland."],
    ["nordisk", "Nordisk modell", "Koordinert økonomi kombinert med en universell velferdsstat, sterke partsorganisasjoner og høy sysselsetting. Esping-Andersen (1990) kaller dette det sosialdemokratiske velferdsregimet."],
    ["statskap", "Statskapitalisme", "Markedsøkonomi der staten eier og styrer store selskaper, banker og investeringsfond for å nå politiske mål."],
    ["plan", "Planøkonomi", "Staten eier produksjonsmidlene og fastsetter produksjon og priser sentralt. Historisk preget av informasjonsproblemer og svake insentiver (Kornai 1992)."],
  ],
  handel: [
    ["apen", "Åpen", "Lave tollsatser og fri handel. Små land er særlig avhengige av handel for å utnytte stordriftsfordeler."],
    ["moderat", "Moderat vern", "Skjerming av enkelte næringer, for eksempel jordbruket."],
    ["proteksjonistisk", "Proteksjonistisk", "Høye tollmurer for å bygge opp egen industri (importsubstitusjon). Har stort sett gitt svakere vekst over tid."],
  ],
  forvaltning: [
    ["fond", "Statlig fond med handlingsregel", "Inntektene settes i et fond, og bare forventet avkastning brukes. Demper svingninger og skjermer resten av økonomien, slik som Statens pensjonsfond utland."],
    ["budsjett", "Rett over statsbudsjettet", "Inntektene brukes etter hvert som de kommer. Gir rask velstand, men sårbarhet for prisfall og fare for hollandsk syke."],
    ["konsesjoner", "Private konsesjoner", "Utenlandske eller private selskaper utvinner mot lav skatt. Enkelt å administrere, men staten fanger lite av grunnrenten."],
  ],
  sentralbank: [
    ["uavhengig", "Uavhengig", "Sentralbanken styrer renten mot et inflasjonsmål uten politisk instruks. Forbundet med lavere og mer stabil inflasjon."],
    ["politisk", "Politisk styrt", "Regjeringen bestemmer pengepolitikken. Gir handlefrihet, men fristelse til å trykke penger før valg."],
  ],
  flagg: [
    ["kors", "Nordisk kors", ""], ["loddrett", "Loddrett trikolor", ""], ["vannrett", "Vannrett trikolor", ""],
    ["kanton", "Kanton", ""], ["diagonal", "Diagonal", ""],
  ],
};

function landOppsett(o) {
  const c = { ...LAND_STANDARD, ...(o || {}) };
  if (!Array.isArray(c.ressurser)) c.ressurser = [];
  const tall = (v, min, maks, std) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(maks, n)) : std; };
  c.lat = tall(c.lat, 0, 80, 58);
  c.areal = tall(c.areal, 100, 5000000, 120000);
  c.folk = tall(c.folk, 1000, 500000000, 4000000);
  c.urban = tall(c.urban, 5, 100, 70);
  c.M = tall(c.M, 2, 200, 10);
  c.sperre = tall(c.sperre, 0, 12, 4);
  c.S = Math.round(tall(c.S, 15, 800, 159));
  c.fro = tall(c.fro, 1, 99999, 1);
  return c;
}

const valgNavn = (k, v) => ((LAND_VALG[k] || []).find((x) => x[0] === v) || [, v])[1];
const valgTekst = (k, v) => ((LAND_VALG[k] || []).find((x) => x[0] === v) || [, , ""])[2];

const KOPPEN = {
  Af: ["Tropisk regnskogklima", "Nær ekvator stiger varm, fuktig luft i den intertropiske konvergenssonen hele året. Det gir kraftig nedbør i alle måneder."],
  Aw: ["Tropisk savanneklima", "Den intertropiske konvergenssonen vandrer med årstidene og gir en regntid om sommeren og en lang tørketid om vinteren."],
  BWh: ["Varmt ørkenklima", "Synkende luft i subtropenes høytrykksbelte (Hadley-cellens nedadgående gren) hindrer skydannelse."],
  BSh: ["Varmt steppeklima", "I randen av subtropenes høytrykksbelte er nedbøren for liten og ujevn for skog, men nok for gress og busker."],
  BSk: ["Kaldt steppeklima", "Langt fra havet og i regnskyggen av fjell blir lufta tørr, og vintrene blir kalde."],
  Csa: ["Middelhavsklima", "Om sommeren ligger kysten under det subtropiske høytrykket og er tørr, om vinteren når vestavindsbeltets lavtrykk inn med regn. Typisk for vestkyster mellom 30 og 45 grader."],
  Cfa: ["Fuktig subtropisk klima", "Østkyster i subtropene får fuktig luft fra varme havstrømmer og monsunpregede somre."],
  Cfb: ["Temperert havklima", "Vestavindsbeltet bringer mild, fuktig luft fra havet hele året. Kjølige somre og milde vintre."],
  Cfc: ["Subpolart havklima", "Havet holder vintrene milde så langt nord, men somrene er korte og kjølige."],
  Dfb: ["Fuktig kontinentalt klima", "Langt fra havets utjevnende virkning blir det varme somre og kalde vintre med snødekke."],
  Dfc: ["Subarktisk klima", "Lange, svært kalde vintre og korte somre. Her vokser den boreale barskogen, taigaen."],
  ET: ["Tundraklima", "Varmeste måned er under 10 grader i snitt. For kaldt for skog; permafrost i bakken."],
  EF: ["Iskappeklima", "Ingen måned over frysepunktet i snitt. Permanent is."],
};

function koppen(c) {
  const a = c.lat;
  const maritim = c.form !== "innland";
  const s = maritim ? c.strom : "ingen";
  let k;
  if (a >= 75) k = "EF";
  else if (a >= 66) k = "ET";
  else if (a >= 55) k = maritim && s === "varm" ? "Cfc" : "Dfc";
  else if (a >= 42) k = maritim ? "Cfb" : "Dfb";
  else if (a >= 30) k = !maritim ? "BSk" : s === "varm" ? "Cfa" : "Csa";
  else if (a >= 18) k = !maritim || s === "kald" ? "BWh" : s === "varm" ? (a >= 24 ? "Cfa" : "Aw") : "BSh";
  else if (a >= 8) k = s === "kald" ? "BSh" : "Aw";
  else k = s === "kald" ? "BWh" : "Af";
  const hoyland = ["kollisjon", "subduksjon"].includes(c.tektonikk) && !["EF"].includes(k);
  const gruppe = { Af: "vat", Cfb: "vat", Cfc: "vat", Cfa: "vat", Aw: "sesong", Csa: "sesong", Dfb: "sesong", Dfc: "sesong", BWh: "torr", BSh: "torr", BSk: "torr", ET: "kald", EF: "kald" }[k];
  return { kode: k, navn: KOPPEN[k][0], forklaring: KOPPEN[k][1], hoyland, gruppe };
}

const komma = (n) => n.toFixed(1).replace(".", ",");

function avrund(n) {
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("nb-NO", { maximumFractionDigits: n >= 1e7 ? 0 : 1 })} mill.`;
  return Math.round(n).toLocaleString("nb-NO");
}

// ---------- Hovedanalysen ----------
function analyserLand(o) {
  const c = landOppsett(o);
  const r = {};
  r.koppen = koppen(c);
  r.tetthet = c.folk / c.areal;
  r.norgeAreal = c.areal / 385000;
  const har = (x) => c.ressurser.includes(x);

  // Geologisk troverdighet
  let score = 100;
  const geo = [];
  const trekk = (p, tekst) => { score -= p; geo.push({ type: "advarsel", tekst }); };
  const godt = (tekst) => geo.push({ type: "ok", tekst });
  const t = c.tektonikk;
  const torr = r.koppen.gruppe === "torr";
  const relieff = ["subduksjon", "kollisjon", "rift", "hotspot"].includes(t) || c.istid === "ja";
  if (har("geotermisk")) ["rift", "hotspot", "subduksjon"].includes(t) ? godt("Geotermisk energi passer godt med den høye varmestrømmen i denne tektoniske settingen.") : trekk(20, "Geotermisk energi i stor skala krever høy varmestrøm, som ved riftsoner, hotspots eller vulkanske buer. Et rolig kraton eller en kollisjonssone har det sjelden.");
  if (har("olje")) t === "hotspot" ? trekk(15, "Vulkanske hotspot-områder mangler som regel de tykke sedimentære bassengene olje og gass dannes i.") : godt(t === "rift" ? "Olje og gass i en riftsone er geologisk rimelig: Nordsjøen er et gammelt rift fylt av sedimenter." : "Olje og gass er rimelig i sedimentære bassenger langs kontinentalmarginer eller foran fjellkjeder.");
  if (har("kobber")) t === "subduksjon" ? godt("Porfyrkobber hører hjemme i magmatiske buer over subduksjonssoner, som i Andes.") : trekk(10, "Store kobberforekomster av porfyrtypen dannes nesten bare over subduksjonssoner.");
  if (har("diamanter")) t === "passiv" ? godt("Diamanter i et gammelt kraton er helt i tråd med hvor kimberlitter finnes.") : trekk(15, "Diamantførende kimberlitter finnes nesten bare i gamle, tykke kratoner.");
  if (har("jern") && ["hotspot"].includes(t)) trekk(10, "Store jernmalmforekomster ligger i gamle kratoner, ikke i unge vulkanske områder.");
  if (har("vannkraft") && (torr || !relieff)) trekk(15, torr ? "Vannkraft forutsetter rikelig nedbør, og klimaet her er tørt." : "Vannkraft forutsetter store høydeforskjeller, og et rolig kraton uten istidsformede daler er for flatt.");
  if (har("jord") && torr) trekk(5, "Fruktbar jord i et tørt klima forutsetter kunstig vanning, for eksempel fra elver som kommer fra fjellene.");
  if (c.istid === "ja" && c.lat < 35 && !["kollisjon", "subduksjon"].includes(t)) trekk(20, "Istidsformede landskap så nær ekvator forutsetter svært høye fjell, som i Andes eller Himalaya.");
  if (c.istid === "nei" && c.lat > 60) trekk(10, "Nesten alle landområder nord for 60 grader var dekket av is under siste istid.");
  if (c.istid === "ja" && c.form !== "innland" && relieff && c.lat >= 40) godt("Kysten får fjorder og skjærgård, slik breene har formet Norge, Chile og New Zealand.");
  r.geo = { score: Math.max(0, score), merknader: geo };

  // Befolkning
  const TFR = { 1: 6.5, 2: 5.8, 3: 3.2, 4: 2.0, 5: 1.4 }[c.fase];
  const median = { 1: 17, 2: 18, 3: 24, 4: 37, 5: 46 }[c.fase];
  r.tfr = TFR;
  r.medianalder = median;

  // Valgsystem (Taagepera: setetproduktmodellen)
  r.Skube = Math.max(15, Math.round(Math.cbrt(c.folk)));
  let M = c.valg === "pr" ? c.M : c.valg === "mmp" ? c.S : 1;
  let Meff = M;
  if ((c.valg === "pr" || c.valg === "mmp") && c.sperre > 0) Meff = Math.min(M, 75 / c.sperre - 1);
  Meff = Math.max(1, Meff);
  r.Meff = Meff;
  r.Ns = Math.pow(Meff * c.S, 1 / 6) + (c.valg === "torunder" ? 0.4 : 0);
  r.s1 = Math.pow(Meff * c.S, -1 / 8);
  r.flertall = r.s1 > 0.5;
  r.terskel = c.valg === "pr" ? 75 / (c.M + 1) : null;

  // Vetospillere (Tsebelis 2002)
  const veto = [];
  const demokrati = c.statsform !== "absolutt";
  if (!demokrati) veto.push("Monarken");
  if (demokrati) {
    if (c.system === "parlamentarisme" || c.system === "semi" || c.system === "direktorialt") {
      if (r.flertall) veto.push("Regjeringspartiet");
      else for (let i = 0; i < Math.max(2, Math.round(r.Ns / 1.6)); i++) veto.push(`Koalisjonsparti ${i + 1}`);
    }
    if (c.system === "president" || c.system === "semi") veto.push("Presidenten");
    if (c.system === "president") veto.push("Nasjonalforsamlingen");
  }
  if (c.kamre === "sterkt") veto.push("Overhuset");
  if (c.domstol === "sterk") veto.push("Forfatningsdomstolen");
  r.veto = veto;

  // Lijphart (2012): to dimensjoner, positive verdier = konsensus/føderal
  const snitt = (l) => l.reduce((a, b) => a + b, 0) / l.length;
  const prop = { fptp: -1.2, torunder: -0.8, pr: c.M >= 6 && c.sperre <= 4 ? 1 : 0.4, mmp: 0.9 }[c.valg];
  const korp = { lme: -1, cme: 1, nordisk: 1.2, statskap: 0, plan: 0 }[c.modell];
  const eksekutiv = { parlamentarisme: 0, president: -0.6, semi: -0.3, direktorialt: 1 }[c.system];
  r.lijphart = {
    x: Math.max(-2, Math.min(2, snitt([(r.Ns - 2.5) / 1.2, r.flertall ? -1 : 1, prop, korp, eksekutiv]))),
    y: Math.max(-2, Math.min(2, snitt([
      { enhet: -1.2, desentral: 0, foderasjon: 1.6 }[c.struktur],
      { ett: -1, svakt: 0, sterkt: 1.4 }[c.kamre],
      { lett: -1, kvalifisert: 0.4, rigid: 1.3 }[c.grunnlov],
      { ingen: -1.2, svak: 0, sterk: 1.4 }[c.domstol],
      c.sentralbank === "uavhengig" ? 1 : -1,
    ]))),
  };

  // Ressursforbannelse
  const punkt = ["olje", "kobber", "diamanter"].filter(har);
  if (punkt.length) {
    let risiko = 1 + punkt.length * 0.6;
    risiko += { fond: -1.2, budsjett: 0.4, konsesjoner: 0.9 }[c.forvaltning];
    if (!demokrati) risiko += 1;
    if (c.domstol === "sterk") risiko -= 0.4;
    if (c.sentralbank === "uavhengig") risiko -= 0.3;
    if (c.fraksjon === "hoy") risiko += 0.5;
    r.ressursrisiko = risiko < 1.3 ? "Lav" : risiko < 2.4 ? "Middels" : "Høy";
  }

  // Faglige merknader
  const n = [];
  const legg = (tittel, tekst, kilde) => n.push({ tittel, tekst, kilde });
  legg(`Klima: ${r.koppen.navn} (${r.koppen.kode})`, r.koppen.forklaring + (r.koppen.hoyland ? " I fjellområdene blir det høyfjellsklima, som etter Köppen-tradisjonen ofte skilles ut som egen type (H)." : ""), "Peel, Finlayson og McMahon (2007)");
  if (c.valg === "fptp") legg("Duvergers lov", `Flertallsvalg i enmannskretser gir sterke insentiver til å samles i få partier. Modellen anslår ${komma(r.Ns)} effektive partier i forsamlingen, og største parti får trolig flertall alene.`, "Duverger (1954)");
  if (c.valg === "pr" || c.valg === "mmp") legg("Partisystemet", `Med ${c.valg === "pr" ? `kretser på ${c.M} mandater` : "kompenserende utjevning"}${c.sperre ? ` og ${c.sperre} prosent sperregrense` : ""} gir setetproduktmodellen ${komma(r.Ns)} effektive partier, og største parti får rundt ${Math.round(r.s1 * 100)} prosent av mandatene. ${r.flertall ? "Ettpartiflertall er mulig." : "Regjeringene vil som regel være koalisjoner eller mindretallsregjeringer."}`, "Taagepera (2007); Shugart og Taagepera (2017)");
  if (c.valg === "torunder") legg("To-rundersvalg", `Partiene kan stille alene i første runde og samle seg i andre. Modellen anslår ${komma(r.Ns)} effektive partier; tillegget for to runder er et skjønnsmessig anslag.`, "Duverger (1954); Taagepera (2007)");
  if (Math.abs(c.S / r.Skube - 1) > 0.6) legg("Forsamlingens størrelse", `Kuberotsloven tilsier rundt ${r.Skube} representanter for ${avrund(c.folk)} innbyggere. Med ${c.S} blir forsamlingen ${c.S > r.Skube ? "uvanlig stor" : "uvanlig liten"} for folketallet.`, "Taagepera (1972)");
  if (c.system === "president") legg("Presidentstyrets farer", r.Ns > 3 ? `Presidentstyre kombinert med et fragmentert partisystem (${komma(r.Ns)} effektive partier) er det Mainwaring kalte den vanskelige kombinasjonen: presidenten mangler flertall og har ingen parlamentarisk vei ut av fastlåste konflikter.` : "Både presidenten og nasjonalforsamlingen har eget folkemandat. Linz advarte om at den doble legitimiteten og de faste valgperiodene gjør konflikter vanskelige å løse.", r.Ns > 3 ? "Mainwaring (1993)" : "Linz (1990)");
  if (c.system === "semi") legg("Semipresidentialisme", "Når statsministeren bare er ansvarlig overfor parlamentet, kalles ordningen premier-presidentiell. Den har klart seg bedre for demokratiet enn den president-parlamentariske varianten, der også presidenten kan avsette regjeringen.", "Shugart og Carey (1992); Elgie (2011)");
  if (c.system === "direktorialt") legg("Kollegialt styre", "Et direktorium uten regjeringssjef sprer makten svært bredt og passer best i et samfunn med sterk konsensuskultur og utstrakt bruk av folkeavstemninger.", "Lijphart (2012)");
  if (!demokrati) legg("Absolutt monarki", "Uten en folkevalgt forsamling med reell makt er det ingen parlamentarisk ansvarlighet. Valgordningen og partisystemet blir i praksis rådgivende.", "Linz og Stepan (1996)");
  if (c.fraksjon === "hoy" && (c.valg === "fptp" || c.struktur === "enhet")) legg("Delt samfunn", "I samfunn med mange grupper anbefaler Lijphart maktdeling: proporsjonale valg, brede koalisjoner og selvstyre for gruppene. Horowitz foretrekker i stedet valgordninger som belønner partier for å hente stemmer på tvers av gruppene.", "Lijphart (1977); Horowitz (1985)");
  if (c.struktur === "foderasjon" && c.areal < 50000) legg("Føderalisme i liten skala", "Føderasjoner er vanligst i store land, men kan også tjene til å gi språk- eller kulturgrupper selvstyre i små stater, slik som i Belgia og Sveits.", "Watts (2008)");
  if (r.ressursrisiko) legg(`Ressursforbannelse: ${r.ressursrisiko.toLowerCase()} risiko`, `Land med store punktressurser har ofte hatt svakere vekst, men forbannelsen avhenger av institusjonene. ${c.forvaltning === "fond" ? "Et fond med handlingsregel skjermer resten av økonomien mot hollandsk syke, slik Norge har gjort." : c.forvaltning === "konsesjoner" ? "Med private konsesjoner og lav skatt fanger staten lite av grunnrenten." : "Når inntektene brukes direkte, blir statsbudsjettet sårbart for prisfall og konkurranseutsatt næringsliv presses ut."}`, "Sachs og Warner (1995); Mehlum, Moene og Torvik (2006)");
  if (["lme", "cme", "nordisk"].includes(c.modell)) legg(valgNavn("modell", c.modell), valgTekst("modell", c.modell), c.modell === "nordisk" ? "Esping-Andersen (1990)" : "Hall og Soskice (2001)");
  legg("Befolkningen", `Med ${avrund(c.folk)} innbyggere på ${avrund(c.areal)} km² blir tettheten ${r.tetthet < 10 ? komma(r.tetthet) : Math.round(r.tetthet)} per km² (Norge har rundt 15). I fase ${c.fase} av den demografiske overgangen er samlet fruktbarhet typisk rundt ${String(TFR).replace(".", ",")} barn per kvinne og medianalderen omkring ${median} år.`, "Notestein (1945)");
  r.merknader = n;
  return r;
}

const LAND_KILDER = [
  "Alesina, A. mfl. (2003). Fractionalization. Journal of Economic Growth 8: 155–194.",
  "Duverger, M. (1954). Political Parties. London: Methuen.",
  "Elgie, R. (2011). Semi-Presidentialism: Sub-Types and Democratic Performance. Oxford University Press.",
  "Esping-Andersen, G. (1990). The Three Worlds of Welfare Capitalism. Princeton University Press.",
  "Faye, M. L. mfl. (2004). The Challenges Facing Landlocked Developing Countries. Journal of Human Development 5(1).",
  "Hall, P. A. og Soskice, D. (red.) (2001). Varieties of Capitalism. Oxford University Press.",
  "Horowitz, D. L. (1985). Ethnic Groups in Conflict. University of California Press.",
  "Kornai, J. (1992). The Socialist System. Princeton University Press.",
  "Lijphart, A. (1977). Democracy in Plural Societies. Yale University Press.",
  "Lijphart, A. (2012). Patterns of Democracy. 2. utg. Yale University Press.",
  "Linz, J. J. (1990). The Perils of Presidentialism. Journal of Democracy 1(1).",
  "Linz, J. J. og Stepan, A. (1996). Problems of Democratic Transition and Consolidation. Johns Hopkins University Press.",
  "Mainwaring, S. (1993). Presidentialism, Multipartism, and Democracy: The Difficult Combination. Comparative Political Studies 26(2).",
  "Mehlum, H., Moene, K. og Torvik, R. (2006). Institutions and the Resource Curse. Economic Journal 116.",
  "Notestein, F. W. (1945). Population: The Long View. I Schultz (red.), Food for the World.",
  "Peel, M. C., Finlayson, B. L. og McMahon, T. A. (2007). Updated world map of the Köppen-Geiger climate classification. Hydrology and Earth System Sciences 11.",
  "Sachs, J. D. og Warner, A. M. (1995). Natural Resource Abundance and Economic Growth. NBER Working Paper 5398.",
  "Shugart, M. S. og Carey, J. M. (1992). Presidents and Assemblies. Cambridge University Press.",
  "Shugart, M. S. og Taagepera, R. (2017). Votes from Seats. Cambridge University Press.",
  "Taagepera, R. (1972). The Size of National Assemblies. Social Science Research 1(4).",
  "Taagepera, R. (2007). Predicting Party Sizes. Oxford University Press.",
  "Tsebelis, G. (2002). Veto Players. Princeton University Press.",
  "Watts, R. L. (2008). Comparing Federal Systems. 3. utg. McGill-Queen's University Press.",
];
