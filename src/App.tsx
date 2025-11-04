
import React, { useMemo, useState, useEffect } from "react";
import './App.css';

// Minimum JSX típusok, ha a React típusok nincsenek telepítve a környezetben
declare global {
  namespace JSX {
    // Engedjük az összes beépített HTML taget, hogy ne dobjon hibát az "IntrinsicElements" hiánya miatt
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

/**
 * Vezetői készségek (PAMS) – 84 tételes önértékelő kérdőív
 * 1–6-ig pontozható skála (1 = egyáltalán nem jellemző, 6 = nagyon jellemző)
 *
 * Használat:
 * - Importáld és tedd egy oldalra: <VezetoiKepessegek />
 * - A "Számolás" gombra kattintva kiszámolja az összpontszámot és a (al)skálákat.
 * - Nem használ külső UI könyvtárat; tiszta React + TypeScript.
 */

type AnswerMap = Record<number, number>; // kérdés sorszáma -> 1..6

type Scale = {
  key: string;
  label: string;
  items: number[];
  group?: string;      // nagy csoport
  subgroup?: string;   // alcsoport
};

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const QUESTIONS: { id: number; text: string }[] = [
  { id: 1, text: "Az erősségeimre és gyengeségeimre vonatkozó megjegyzéseket szívesen fogadom másoktól, mert így tudom magam fejleszteni." },
  { id: 2, text: "Annak érdekében, hogy fejlesszem önmagam, mások előtt felvállalom a véleményemet, hitemet, érzéseimet." },
  { id: 3, text: "Tisztában vagyok azzal, hogy milyen stílusban gyűjtök információimat, és hogy mi alapján hozom meg a döntéseimet." },
  { id: 4, text: "Jó érzékem van ahhoz, hogy megbirkózzak a kétértelmű és bizonytalan helyzetekkel." },
  { id: 5, text: "Jól kidolgozott személyes viselkedési modellem van, hogy adott szituációban hogyan viselkedem." },

  { id: 6, text: "Hatékony időgazdálkodási módszereket használok (időkövetés, teendőlista, rangsorolás)." },
  { id: 7, text: "Gyakran megerősítem prioritásaimat, hogy a kevésbé fontos dolgok ne vegyék el az időmet a fontosaktól." },
  { id: 8, text: "Rendszeres testmozgással fenntartom a fittségemet." },
  { id: 9, text: "Nyílt, bizalmi kapcsolatot ápolok olyan személlyel, akivel megoszthatom az engem frusztráló dolgokat." },
  { id: 10, text: "Ismerek és gyakorolok relaxációs technikákat (pl. légzés, izomlazítás)." },
  { id: 11, text: "Életemben fenntartom az egyensúlyt: a munkán kívül érdeklődéseimhez illő szabadidős tevékenységekkel is foglalkozom." },

  { id: 12, text: "Világosan megfogalmazom, mi a probléma; a megoldást addig halasztom, míg pontosan nem definiáltam." },
  { id: 13, text: "Mindig egynél több alternatívát találok egy probléma megoldására." },
  { id: 14, text: "Lépésről lépésre haladok: probléma-meghatározás → alternatívák keresése → megoldás kiválasztása." },

  { id: 15, text: "Többféleképpen fogalmazom meg a nehéz problémát; nem korlátozom magam egy megközelítésre." },
  { id: 16, text: "Kérdésekkel feltárom a probléma eredetét, több nézőpontból megvizsgálva azt." },
  { id: 17, text: "A megoldást intuitív (jobb agyfélteke) és logikai (bal agyfélteke) módon is megközelítem." },
  { id: 18, text: "Nem értékelek megoldásokat addig, amíg a lehetséges alternatívák teljes sorát össze nem gyűjtöttem." },
  { id: 19, text: "Vannak speciális technikáim kreatív, innovatív megoldások kidolgozására." },

  { id: 20, text: "Gondoskodom a nézőpontok sokszínűségéről a komplex problémamegoldás során." },
  { id: 21, text: "A csoporton kívülről is gyűjtök információt az érintettek preferenciáiról és elvárásairól." },
  { id: 22, text: "Az ötletgazdák mellett meghallgatom a támogatókat és a megvalósítást biztosítókat is." },
  { id: 23, text: "Bátorítom a szabályokból való kilépést a kreatív megoldások érdekében." },

  { id: 24, text: "Segítek másoknak problémáik felismerésében és meghatározásában tanácsadáskor." },
  { id: 25, text: "Tisztában vagyok, mikor coach-oljak és mikor adjak tanácsot helyette." },
  { id: 26, text: "Visszajelzéskor nem a személyt minősítem, hanem a problémára és megoldására fókuszálok." },
  { id: 27, text: "Segítő szándékom általában a kapcsolat erősödéséhez vezet." },
  { id: 28, text: "Objektíven adok negatív visszajelzést (tények, következmények, érzéseim leírása)." },
  { id: 29, text: "Felelősséget vállalok kijelentéseimért (pl. „Én úgy döntöttem” a „úgy döntöttek” helyett)." },
  { id: 30, text: "Vitatkozáskor közös megállapodásra törekszem eltérő értékrendű személlyel is." },
  { id: 31, text: "Nem beszélek lekezelően alacsonyabb pozícióban lévőkkel vagy kevesebb információval bírókkal." },
  { id: 32, text: "Problémáknál inkább megértést tanúsítok, semmint azonnal tanácsot adok." },

  { id: 33, text: "Elvártnál több erőfeszítést és kezdeményezést teszek." },
  { id: 34, text: "Folyamatosan fejlesztem készségeimet és tudásomat." },
  { id: 35, text: "Határozottan támogatom a szervezeten belüli ünnepi rendezvényeket, eseményeket." },
  { id: 36, text: "Széles kapcsolati hálót építek a szervezet minden szintjén." },
  { id: 37, text: "Új ötleteket hozok, új tevékenységeket kezdeményezek, minimalizálom a rutint." },
  { id: 38, text: "Személyes üzenetekkel kommunikálok fontos feladatoknál, információknál." },
  { id: 39, text: "Nem vagyok hajlandó tárgyalni kényszerítő taktikát alkalmazó személyekkel." },
  { id: 40, text: "Soha nem fenyegetek és nem követelőzöm az akaratom érvényesítésére." },

  { id: 41, text: "Ellenőrzöm, hogy a személy rendelkezik-e a szükséges forrásokkal és támogatással." },
  { id: 42, text: "Különböző jutalmakkal támogatom a magas teljesítményt." },
  { id: 43, text: "Érdekes, kihívást jelentő feladatokat határozok meg." },
  { id: 44, text: "Időben adok visszajelzést az elvégzett feladatról." },
  { id: 45, text: "Segítek a kihívást jelentő, speciális és rövid határidejű feladatoknál." },
  { id: 46, text: "Csak végső esetben bocsátok el gyenge teljesítmény esetén." },
  { id: 47, text: "Következetesen jelzem, ha valakinek a teljesítménye nem megfelelő." },
  { id: 48, text: "Tisztességes és méltányos bánásmódot biztosítok." },
  { id: 49, text: "Jó teljesítményt dicsérettel és elismeréssel jutalmazok." },

  { id: 50, text: "Kerülöm a személyes vádakat másokkal szemben." },
  { id: 51, text: "Bátorítom a kétirányú párbeszédet: a felek megismerik egymás szemszögét és kérdezhetnek." },
  { id: 52, text: "A munkatársaktól kérem, hogy részletezzék az elfogadhatóbb lehetőséget." },

  { id: 53, text: "Panasz esetén figyelmesen, érdeklődéssel reagálok, akkor is, ha nem értek egyet." },
  { id: 54, text: "További információkat gyűjtök és konkrét, helyzetleíró kérdéseket teszek fel." },
  { id: 55, text: "Megkérem a másik felet, javasoljon elfogadhatóbb viselkedést." },

  { id: 56, text: "Mediátorként nem foglalok állást; semleges maradok." },
  { id: 57, text: "Segítek a feleknek több alternatíva megismerésében." },
  { id: 58, text: "Segítek a feleknek megtalálni az egyetértési pontokat." },

  { id: 59, text: "Segítek az embereknek kompetensnek érezni magukat: észreveszem és ünneplem a kis sikereket." },
  { id: 60, text: "Rendszeresen adok visszajelzést és megadom a szükséges támogatást." },
  { id: 61, text: "Biztosítok minden szükséges információt a feladatok elvégzéséhez." },
  { id: 62, text: "Kiemelem az egyén munkájának fontos hatását." },

  { id: 63, text: "Világosan megfogalmazom az elvárt eredményeket." },
  { id: 64, text: "Egyértelműen meghatározom, ki mit és mikor tegyen (pl. instrukcióig várjon; részfeladat; teljes feladat stb.)." },
  { id: 65, text: "Engedem, hogy a megbízást elfogadók maguk döntsék el, hogyan és mikor végzik a munkát." },
  { id: 66, text: "Probléma esetén inkább tanácsot kérek és kérdezek a főnökeimtől, nem pedig a megoldást várom." },
  { id: 67, text: "A delegált feladatokat rendszeresen, folyamatosan nyomon követem." },

  { id: 68, text: "Tisztában vagyok, hogyan maradok hiteles, és hogyan befolyásolom a csapattagokat." },
  { id: 69, text: "Világos és következetes vagyok abban, amit el akarok érni." },
  { id: 70, text: "Közös alapot alakítok ki a csapatban a tagok egyetértésével, mielőtt továbblépünk." },
  { id: 71, text: "Pontosan ismertetem a rövid távú célokat és sikereket a csapattal." },

  { id: 72, text: "Ismerem a csapatban való feladatmegoldás módszereit." },
  { id: 73, text: "Ismerem a szoros kapcsolatok építésének és az együttműködés ösztönzésének módszereit." },

  { id: 74, text: "Jól ismerem a csapatfejlesztés különböző szakaszait." },
  { id: 75, text: "Elősegítem a „birkaszellem” elkerülését: biztosítom a vélemények sokszínű kifejezését." },
  { id: 76, text: "Elemzem és kihasználom a csapat fő kompetenciáit és egyedi erősségeit." },
  { id: 77, text: "Egyszerre ösztönzök drámai áttörést és folyamatos (akár kicsi) fejlesztéseket." },

  { id: 78, text: "Pozitív energiát sugárzok a környezetemnek." },
  { id: 79, text: "Hangsúlyozom, hogy a kívánt változás magasabb célokat szolgál." },
  { id: 80, text: "Gyakran és látható módon köszönetet mondok, még kisebb cselekedetekért is." },
  { id: 81, text: "Hangsúlyozom, hogy erősségekre építünk, nem csak gyengeségeket küszöbölünk ki." },
  { id: 82, text: "Kommunikációmban jóval több a pozitív megjegyzés, mint a negatív." },
  { id: 83, text: "Célkommunikációban nem csak az észre, a szívre is hatok." },
  { id: 84, text: "Tudom, hogyan nyerjem meg az embereket a pozitív változás támogatására és részvételére." },
];

// Kérdéscsoportok a kérdések szétválasztott megjelenítéséhez
const QUESTION_GROUPS: { key: string; title: string; from: number; to: number; className: string }[] = [
  { key: 'I', title: 'I. Személyes készségek (1–23)', from: 1, to: 23, className: 'vk-section--i' },
  { key: 'II', title: 'II. Interperszonális készségek (24–58)', from: 24, to: 58, className: 'vk-section--ii' },
  { key: 'III', title: 'III. Csoportos készségek (59–84)', from: 59, to: 84, className: 'vk-section--iii' },
];

// Skála-definíciók (összhangban a megadott pontozási kulccsal)
const SCALES: Scale[] = [
  // I. Személyes készségek
  { key: "I_total", label: "I. Személyes készségek (1–23)", items: range(1,23), group: "I. Személyes készségek" },
  { key: "I_onismeret_total", label: "Önismeret fejlesztése (1–5)", items: range(1,5), group: "I. Személyes készségek" },
  { key: "I_onismeret_nyitottsag", label: "— Önismeret és nyitottság (1–2)", items: [1,2], group: "I. Személyes készségek", subgroup: "Önismeret fejlesztése" },
  { key: "I_onismeret", label: "— Az önismeret (3–5)", items: [3,4,5], group: "I. Személyes készségek", subgroup: "Önismeret fejlesztése" },

  { key: "I_stressz_total", label: "A stressz kezelése (6–11)", items: range(6,11), group: "I. Személyes készségek" },
  { key: "I_stressorok", label: "— Stresszt okozó tényezők megszüntetése (6–7)", items: [6,7], group: "I. Személyes készségek", subgroup: "A stressz kezelése" },
  { key: "I_rugalmassag", label: "— A rugalmasság fejlesztése (8–9)", items: [8,9], group: "I. Személyes készségek", subgroup: "A stressz kezelése" },
  { key: "I_rovidtavu", label: "— Stressz rövid távú kezelése (10–11)", items: [10,11], group: "I. Személyes készségek", subgroup: "A stressz kezelése" },

  { key: "I_problemamegoldas_total", label: "Problémamegoldás kreatív módon (12–23)", items: range(12,23), group: "I. Személyes készségek" },
  { key: "I_racionalis", label: "— Racionális problémamegoldás (12–14)", items: [12,13,14], group: "I. Személyes készségek", subgroup: "Problémamegoldás" },
  { key: "I_kreativ", label: "— Kreatív problémamegoldás (15–19)", items: [15,16,17,18,19], group: "I. Személyes készségek", subgroup: "Problémamegoldás" },
  { key: "I_innovacio_osztonzes", label: "— Innováció és kreativitás ösztönzése (20–23)", items: [20,21,22,23], group: "I. Személyes készségek", subgroup: "Problémamegoldás" },

  // II. Interperszonális készségek
  { key: "II_total", label: "II. Interperszonális készségek (24–58)", items: range(24,58), group: "II. Interperszonális készségek" },

  { key: "II_tamogato_total", label: "Támogató kommunikáció (24–32)", items: range(24,32), group: "II. Interperszonális készségek" },
  { key: "II_coaching", label: "— Coaching és tanácsadás (24–25)", items: [24,25], group: "II. Interperszonális készségek", subgroup: "Támogató kommunikáció" },
  { key: "II_negativ_visszajelzes", label: "— Hatékony negatív visszajelzés (26–28)", items: [26,27,28], group: "II. Interperszonális készségek", subgroup: "Támogató kommunikáció" },
  { key: "II_tamogato_comm", label: "— Támogató kommunikáció (29–32)", items: [29,30,31,32], group: "II. Interperszonális készségek", subgroup: "Támogató kommunikáció" },

  { key: "II_hatalom_total", label: "Hatalom- és befolyásszerzés (33–40)", items: range(33,40), group: "II. Interperszonális készségek" },
  { key: "II_hatalomszerzes", label: "— Hatalomszerzés (33–37)", items: [33,34,35,36,37], group: "II. Interperszonális készségek", subgroup: "Hatalom- és befolyásszerzés" },
  { key: "II_befolyas", label: "— Befolyás gyakorlása (38–40)", items: [38,39,40], group: "II. Interperszonális készségek", subgroup: "Hatalom- és befolyásszerzés" },

  { key: "II_masok_mot", label: "Mások motiválása (41–49)", items: range(41,49), group: "II. Interperszonális készségek" },

  { key: "II_konfliktus_total", label: "Konfliktus kezelése (50–58)", items: range(50,58), group: "II. Interperszonális készségek" },
  { key: "II_kezdemenyezes", label: "— Kezdeményezés (50–52)", items: [50,51,52], group: "II. Interperszonális készségek", subgroup: "Konfliktuskezelés" },
  { key: "II_valaszadas", label: "— Válaszadás (53–55)", items: [53,54,55], group: "II. Interperszonális készségek", subgroup: "Konfliktuskezelés" },
  { key: "II_kozvetites", label: "— Közvetítés (56–58)", items: [56,57,58], group: "II. Interperszonális készségek", subgroup: "Konfliktuskezelés" },

  // III. Csoportos készségek
  { key: "III_total", label: "III. Csoportos készségek (59–84)", items: range(59,84), group: "III. Csoportos készségek" },

  { key: "III_felhatalmazas_total", label: "Felhatalmazás és delegálás (59–67)", items: range(59,67), group: "III. Csoportos készségek" },
  { key: "III_felhatalmazas", label: "— Felhatalmazás (59–62)", items: [59,60,61,62], group: "III. Csoportos készségek", subgroup: "Felhatalmazás és delegálás" },
  { key: "III_delegalas", label: "— Delegálás (63–67)", items: [63,64,65,66,67], group: "III. Csoportos készségek", subgroup: "Felhatalmazás és delegálás" },

  { key: "III_csapat_total", label: "Hatékony csapatok és csapatmunka (68–77)", items: range(68,77), group: "III. Csoportos készségek" },
  { key: "III_csapat_vezetes", label: "— Csapat vezetése (68–71)", items: [68,69,70,71], group: "III. Csoportos készségek", subgroup: "Hatékony csapatok és csapatmunka" },
  { key: "III_csapattag", label: "— Csapattagjaként dolgozni (72–73)", items: [72,73], group: "III. Csoportos készségek", subgroup: "Hatékony csapatok és csapatmunka" },
  { key: "III_csapatmunka", label: "— Csapatmunka (74–77)", items: [74,75,76,77], group: "III. Csoportos készségek", subgroup: "Hatékony csapatok és csapatmunka" },

  { key: "III_valtozas_total", label: "Pozitív változások elérése (78–84)", items: range(78,84), group: "III. Csoportos készségek" },
  { key: "III_valtozas_elosegitese", label: "— Elősegíteni a pozitív változást (78–80)", items: [78,79,80], group: "III. Csoportos készségek", subgroup: "Pozitív változások elérése" },
  { key: "III_pozitiv_valtozas", label: "— A pozitív változás (81–82)", items: [81,82], group: "III. Csoportos készségek", subgroup: "Pozitív változások elérése" },
  { key: "III_masok_mot", label: "— Mások motiválása (83–84)", items: [83,84], group: "III. Csoportos készségek", subgroup: "Pozitív változások elérése" },

  // Összpontszám
  { key: "TOTAL", label: "Összpontszám (1–84)", items: range(1,84) },
];

function sum(items: number[], answers: AnswerMap): number {
  return items.reduce((acc, id) => acc + (answers[id] ?? 0), 0);
}

function maxScore(items: number[]): number {
  return items.length * 6;
}

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

export default function VezetoiKepessegek() {
  // Állapot: válaszok (kérdés -> 1..6)
  // Megjegyzés: a generikus paramétert elhagyjuk, az induló értéket típusosítjuk,
  // így elkerüljük az olyan környezeti típushibákat, ahol a React típusai nem elérhetők.
  const [answers, setAnswers] = useState({} as AnswerMap);

  const missingCount = useMemo(() => {
    return QUESTIONS.filter(q => !answers[q.id]).length;
  }, [answers]);

  const missingIds = useMemo(() => {
    return QUESTIONS.filter(q => !answers[q.id]).map(q => q.id);
  }, [answers]);

  type Result = {
    key: string;
    label: string;
    score: number;
    max: number;
    pct: string;
    group?: string;
    subgroup?: string;
  };

  const results: Result[] = useMemo(() => {
    const r = SCALES.map(s => {
      const score = sum(s.items, answers);
      const max = maxScore(s.items);
      return {
        key: s.key,
        label: s.label,
        score,
        max,
        pct: pct(score, max),
        group: s.group,
        subgroup: s.subgroup,
      };
    });
    return r;
  }, [answers]);

  const handleChange = (id: number, value: number) => {
    setAnswers((prev: AnswerMap) => ({ ...prev, [id]: value }));
  };

  const clearAll = () => setAnswers({});

  // Csoportos megjelenítés a táblázatban: group -> (subgroup) -> sorok
  const grouped = useMemo(() => {
    const map = new Map<string, { group: string; children: Result[] }>();
    results.forEach((r: Result) => {
      const g = r.group ?? "Összegzés";
      if (!map.has(g)) map.set(g, { group: g, children: [] as Result[] });
      map.get(g)!.children.push(r);
    });
    // rendezés: TOTAL és I/II/III logika
    const order = [
      "I. Személyes készségek",
      "II. Interperszonális készségek",
      "III. Csoportos készségek",
      undefined as any,
    ];
    const arr = Array.from(map.values());
    arr.sort((a, b) => (order.indexOf(a.group as any) - order.indexOf(b.group as any)));
    return arr;
  }, [results]);

  const answeredCount = 84 - missingCount;
  const totalScore = useMemo(() => sum(range(1,84), answers), [answers]);
  const quartileText = useMemo(() => {
    const s = totalScore;
    if (s >= 422) return "Ön a negyedik (legjobb) negyedbe tartozik";
    if (s >= 395) return "Ön a második negyedbe tartozik";
    if (s >= 369) return "Ön a harmadik negyedbe tartozik";
    return "Ön az első negyedbe tartozik";
  }, [totalScore]);
  const today = useMemo(() => new Date().toLocaleDateString('hu-HU'), []);
  const handlePrint = () => {
    try {
      window.print();
    } catch {
      /* noop */
    }
  };

  // Back-to-top button visibility (inside component)
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      try {
        setShowTop(window.scrollY > 400);
      } catch {
        /* no-op */
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true } as any);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="vk-container">
            <header className="vk-header">
        <h1>Vezetői készségek - PAMS (84 tétel)</h1>
        </header>
      <section className="vk-instructions">
        <div className="vk-instructions-inner">
          <div className="vk-instructions-grid">
            <div className="vk-step">
              <div className="vk-step-badge">1</div>
              <div className="vk-step-content">
                
                <p>
                  A teszt célja, hogy a kitöltő átfogó képet kapjon a saját menedzseri készségeinek aktuális szintjéről. Kérem, válaszoljon az alábbi 84 állításra a megadott értékelési skála szerint. Kérem, értékelje magatartását a valódi viselkedése alapján, és nem pedig úgy, ahogy ön szeretné, hogy viselkedne. Amennyiben a felsorolt 84 állítás között szerepel olyan tevékenység, amelyet még nem tapasztalt, válaszoljon az Ön eddigi tapasztalatai alapján, valószínűleg hogyan viselkedne adott szituációban. Legyen realista, ennek a tesztnek az a célja, hogy elősegítse az Ön egyedi igényeinek megfelelően az Ön személyes fejlődését és tanulását. A teszt kitöltése után a teszt végén találja a pontozási kulcsot. A teszt segítséget nyújt abban, hogy elkészítse a vezetési képességeinek átfogó profilját, megismerje erősségeit és gyengeségeit.
                </p>
              </div>
            </div>
            <div className="vk-step">
              <div className="vk-step-badge">2</div>
              <div className="vk-step-content">
                
                <p>
                  Kérem, töltesse ki a tesztet Önre vonatkozóan három Önt ismerő személlyel, akik korábban megfigyelték Önt olyan helyzetben, amikor emberekkel foglalkozik, vagy esetleg embereket irányít. Majd, kérem, alkalmazza a kitöltött teszteket az önértékelő esszében, ahol összehasonlítja a kapott eredményeket: (1) önértékelését (2) mások által adott értékelését.
                </p>
              </div>
            </div>
          </div>

          <div className="vk-scale">
            <div className="vk-scale-title">Értékelési skála</div>
            <ul className="vk-scale-chips">
              <li className="chip chip-1"><span className="chip-index">1</span><span className="chip-label">Egyáltalán nem értek egyet</span></li>
              <li className="chip chip-2"><span className="chip-index">2</span><span className="chip-label">Nem értek egyet</span></li>
              <li className="chip chip-3"><span className="chip-index">3</span><span className="chip-label">Némileg nem értek egyet</span></li>
              <li className="chip chip-4"><span className="chip-index">4</span><span className="chip-label">Valamelyest egyetértek</span></li>
              <li className="chip chip-5"><span className="chip-index">5</span><span className="chip-label">Egyetértek</span></li>
              <li className="chip chip-6"><span className="chip-index">6</span><span className="chip-label">Teljes mértékben egyetértek</span></li>
            </ul>
          </div>
        </div>
      </section>


      {QUESTION_GROUPS.map(g => (
        <section key={g.key} className={`vk-section ${g.className}`}>
          <h2 className="vk-section-title">{g.title}</h2>
          <div className="vk-questions">
            {range(g.from, g.to).map(id => {
              const q = QUESTIONS[id - 1];
              return (
                <article key={q.id} className="vk-question-card">
                  <div className="vk-q-row">
                    <div className="vk-q-id">{q.id}.</div>
                    <div className="vk-q-text">{q.text}</div>
                  </div>
                  <div className="vk-radio-group" aria-label={`Kérdés ${q.id} válaszok`}>
                    {range(1,6).map(v => (
                        <label key={v} className={`vk-radio-label vk-radio-${v}`}>
                        <input
                          className="vk-radio-input"
                          type="radio"
                          name={`q_${q.id}`}
                          value={v}
                          checked={answers[q.id] === v}
                          onChange={() => handleChange(q.id, v)}
                        />
                        <span className="vk-radio-value">{v}</span>
                      </label>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="vk-controls">
        <button onClick={clearAll} className="btn btn-ghost">Válaszok törlése</button>
          <button onClick={handlePrint} className="btn btn-solid">PDF mentése</button>
        <div className="vk-progress">Kitöltött: <strong>{answeredCount}/84</strong> {missingCount > 0 ? <span className="vk-missing">(hiányzik: {missingCount})</span> : <span className="vk-done">✅</span>}</div>
       {missingCount > 0 && missingCount < 10 && (
          <div className="vk-missing-list">Hiányzó tételek: {missingIds.join(', ')}</div>
        )}
      </section>

        <section className="vk-results-section">
          <div className="vk-print-header">
            <h1>Vezetői készségek - PAMS eredmények</h1>
            <div>Dátum: {today}</div>
          </div>

          {missingCount > 0 && (
            <div className="vk-warning">Figyelem: {missingCount} tétel nincs még megjelölve, ezért egyes skálák rész-eredményeket mutathatnak.</div>
          )}

          <div className="vk-results">
            {grouped.map((group: { group: string; children: Result[] }) => (
              <div key={group.group} className="vk-group">
                {group.group && <h3 className="vk-group-title">{group.group}</h3>}
                <div className="vk-table-wrap">
                  <table className="vk-table">
                    <tbody>
                      {group.children.map((r: Result) => (
                        <tr key={r.key} className={r.subgroup ? 'vk-subgroup-row' : ''}>
                          <td align="left">{r.label}</td>
                          <td align="center"><strong>{r.score}</strong></td>
                          <td align="center">{r.max}</td>
                          <td align="center">{r.pct}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

      {missingCount === 0 && (
        <section className="vk-benchmark">
          <h3 className="vk-benchmark-title">Összehasonlítási adatok</h3>
          <ol className="vk-benchmark-steps">
            <li>Kérem, hasonlítsa össze pontszámait legalább négy hallgatótársa eredményével.</li>
            <li>Kérem, hasonlítsa össze az Ön által elért értékeket a mások által Önnek adott értékekkel.</li>
            <li>
              Kérem, hasonlítsa össze összeredményét egy kutatás eredményével! 2006-ban végeztek egy felmérést egy
              üzleti iskola hallgatói között. 5000 fő hallgató töltötte ki ugyanezt a tesztet és az alábbi eredményeket kapták.
              Kérem, adja össze az Ön által adott összes pontszámot és az eredményt hasonlítsa össze a kutatás eredményeivel.
            </li>
          </ol>

          <div className="vk-bench-heading">N = 5000 hallgatóval végzett kutatás eredménye</div>
          <ul className="vk-bench-bands">
            <li><strong>394,35</strong> = átlag</li>
            <li><strong>422</strong> vagy annál nagyobb = Ön a top legjobb negyedik negyedhez tartozik</li>
            <li><strong>395–421</strong> = a második negyedbe tartozik.</li>
            <li><strong>369–394</strong> = a harmadik negyedbe tartozik.</li>
            <li><strong>368</strong> vagy annál kevesebb = az első negyedbe tartozik.</li>
          </ul>

          <div className="vk-bench-your">
            Az Ön összpontszáma: <strong>{totalScore}</strong> — <strong>{quartileText}</strong>
          </div>
        </section>
      )}

      
      <button
        type="button"
        aria-label="Ugrás az oldal tetejére"
        className={`vk-backtotop ${showTop ? 'is-visible' : ''}`}
        onClick={scrollToTop}
      >
        ↑
      </button>
    </div>
  );
}

// Styling moved to App.css (classes used in JSX)

