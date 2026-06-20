// Počiatočné dáta — naseje sa pri prvom vytvorení prázdnej DB (port z pôvodného Supabase seedu).
export const SEED_TOPICS = [
  { age_id: 'a02', theme: 'Prvé kroky', keywords: 'kroky, pád, vstávanie, mama', moral_lesson: 'Je v poriadku padnúť. Vždy sa dá vstať.' },
  { age_id: 'a24', theme: 'Zdieľanie hračiek', keywords: 'hračka, kamarát, radosť', moral_lesson: 'Keď sa delíme, máme viac radosti.' },
  { age_id: 'a47', theme: 'Pomoc pri upratovaní', keywords: 'poriadok, zodpovednosť, tím', moral_lesson: 'Každý v rodine pomáha. Aj malí.' },
  { age_id: 'a710', theme: 'Prvý deň v novej škole', keywords: 'strach, nové miesto, priateľstvo', moral_lesson: 'Nové začiatky sú strašidelné — a krásne zároveň.' },
  { age_id: 'a1013', theme: 'Tlak skupiny', keywords: 'kamaráti, správne rozhodnutie, odvaha', moral_lesson: 'Byť sám sebou je ťažšie ako nasledovať dav. A oveľa krajšie.' },
  { age_id: 'a02', theme: 'Teplé objatie', keywords: 'bezpečie, láska, rodina', moral_lesson: 'V objatí rodičov je celý svet bezpečný.' },
  { age_id: 'a24', theme: 'Bolesť a plač', keywords: 'emócie, plač, utešenie', moral_lesson: 'Plakať je v poriadku. Každý plače.' },
  { age_id: 'a47', theme: 'Klamstvo a pravda', keywords: 'čestnosť, hanba, odpustenie', moral_lesson: 'Pravda bolí chvíľku. Klamstvo bolí dlho.' },
  { age_id: 'a710', theme: 'Závisť a vďačnosť', keywords: 'závisť, porovnávanie, vďaka', moral_lesson: 'To, čo máme, je vzácnejšie, než čo nemáme.' },
  { age_id: 'a1013', theme: 'Chyba a odpustenie', keywords: 'chyba, zodpovednosť, druhá šanca', moral_lesson: 'Chyby nás nedefinujú. To, čo s nimi urobíme, áno.' },
]

export const SEED_STORIES = [
  {
    title: 'Mesiačik a Macko Mier', age_id: 'a02', theme: 'Dôvera a pokojný spánok', emoji: '🌙',
    cover_a: '#ff9bbf', cover_b: '#c89bff', minutes: 3, author: 'rozprávka pre tých najmenších', generated_by: 'manual',
    pages: [
      { type: 'chapter', heading: 'Tichučko, tichučko…', body: ['Mesiačik vyšiel na oblohu. Pomaličky, pomaličky. Najprv len jeho špička, potom polovička, a nakoniec celý okrúhly mesiačik sa vyšvihol medzi hviezdičky.', 'Macko Mier si líhal do postieľky. Deka bola mäkučká ako oblak. Vankúš voňal ako lúka po daždi.', 'Hviezdičky si zaspievali svoju nočnú pieseň: cingi-lingi, cingi-lingi. Každá hviezdička mala svoju pesničku.'] },
      { type: 'chapter', heading: 'Macko zatvára očká', body: ['Macko sa pritúlil k vankúšiku. Vankúšik je mäkučký ako babičkin golier.', 'Macko zívol. Velikánsky zívol — háááá. Tlapky sa mu natiahli, chvostík sa skrútil.', 'Mama prikryla Macka dekou. Deka je teplučká ako slniečko. Macko sa usmial celým bruškom.'] },
      { type: 'chapter', heading: 'A Mesiačik šepkal…', body: ['Mesiačik sa díval oknom rovno na Macka. Svietil naňho jemným strieborným svetlom.', '„Nehaj sa, malý Macko. Som tu celú noc," šepkal tichučko.', '„Hviezdičky sú tu tiež. Sto hviezdičiek, tisíc hviezdičiek. Všetky strážia tvoj spánok. Spinkaj, spinkaj, môj zlatý Macko."', 'A Macko zaspal. Tichučko, tichučko. Sníval o medovom poli a teplom slniečku.'] },
      { type: 'end', moral: 'Spánok je objatie sveta. Mesiačik bdie, kým ty snívaš. Si v bezpečí.', art: '🌙✨' },
    ],
  },
  {
    title: 'Zajko Skokan a tmavá komôrka', age_id: 'a24', theme: 'Odvaha a viera v seba', emoji: '🐰',
    cover_a: '#ffb347', cover_b: '#ff9bbf', minutes: 4, author: 'rozprávka o tom, ako sa malý strach premení na veľké srdce', generated_by: 'manual',
    pages: [
      { type: 'chapter', heading: 'Zajko sa bál tmy', body: ['V malej drevenej chalúpke pod brezovým hájom bývala zajačia rodinka. Bola tam mama Zajka s dlhými ružovými ušami, ocko Zajko so silnými nohami a najmenší Skokan — malý, chlpatý a plný iskier.', 'Skokan miloval mrkvu, miloval skákanie po lúke, miloval šálku teplého mlieka pred spaním a objatia. Ale jedno nemiloval — tmavú komôrku za kuchyňou, kde sa skladovala kapusta na zimu.', 'Keď ho mama raz poprosila, aby priniesol jednu hlávku na večeru, Skokanove uši okamžite ovisli dolu. Bruško sa mu zvieralo.'] },
      { type: 'chapter', heading: '„A čo ak tam niečo je?"', body: ['„Mamka," zašepkal Skokan a priblížil sa bližšie k jej teplému boku, „a čo ak v komôrke býva strašidlo? Také veľké, čierne strašidlo s dlhými pazúrmi?"', 'Mama Zajka sa usmiala tým svojím najkrajším úsmevom. Sadla si na zem, aby bola rovnako veľká ako Skokan, a vzala ho za obe tlapky.', '„Vieš, Skokan, strašidlá najradšej žijú v hlavičkách malých zajačikov. Nie v komôrkach. A vieš, čo sa stane, keď sa raz pozrieš do tmy? Strašidlo utečie, pretože sa bojí odvážnych zajačikov."'] },
      { type: 'chapter', heading: 'Prvý krôčik', body: ['Skokan sa zhlboka nadýchol. Raz. Dva. Tri. Cítil, ako mu srdce buší rýchlejšie než zvyčajne.', 'Pristúpil k dverám komôrky. Rukoväť bola studená. Otvoril dvere — škríp — a zazrel tmu.', 'Vo vnútri bola tma a ticho. Skokan počkal chvíľu. Potom uvidel mamine kapusty v rohoch, oteckove jablká v košíku a v ďalšom rohu… starú metlu s lýkovým viazaním.', '„To si bolo ty, strašidlo?" zasmial sa Skokan nahlas. „Ty si len metla! Ani trochu ma nestrašíš!"'] },
      { type: 'chapter', heading: 'Veľké srdce malého zajka', body: ['Skokan vzal kapustu — tú najkrajšiu, najzelenšiu, najokrúhlejšiu — a vybehol späť do kuchyne.', 'Keď ju položil na stôl, vypol hruď ako najväčší zajko na svete. „Mama! Doniesol som! A nebolo tam žiadne strašidlo, len stará metla!"', 'Mama ho pohladila po uškách. Ocko sa usmial. „Vedeli sme to celý čas, náš malý hrdina."', 'Od toho dňa Skokan chodil do komôrky sám. A vždy, keď bolo tmavo, si spomínal: to nie je strašidlo. To som ja — odvážny zajko.'] },
      { type: 'end', moral: 'Odvaha nie je, že sa nebojíme. Odvaha je, že napriek strachu urobíme prvý krôčik.', art: '🐰💛' },
    ],
  },
  {
    title: 'Líštička Líza a múdry dedko Dub', age_id: 'a47', theme: 'Úcta k starším a počúvanie', emoji: '🦊',
    cover_a: '#9be59b', cover_b: '#7cc6ff', minutes: 5, author: 'rozprávka o tom, prečo starí vedia, čo my ešte nevidíme', generated_by: 'manual',
    pages: [
      { type: 'chapter', heading: 'Najrýchlejšia líštička v lese', body: ['Líštička Líza bola najrýchlejšia v celom Hájovom lese. Bežala ako vetrík — cez kríky, cez potok, cez lúku. Chvost za ňou vlnil ako oranžová vlajka.', 'Všetky zvieratká v lese ju poznali. Veveričky jej tlieskali, vtáčiky spievali jej meno, aj malý ježko Pišta sa vždy rozžiaril, keď prišla.', 'Ale Líza mala jeden zlozvyk: nemala rada, keď jej niekto hovoril, čo má robiť. Najmä staré zvieratká. „Načo mi je počúvať starých? Veď sú pomalí a nudní. Ja som mladá a všetko viem!"'] },
      { type: 'chapter', heading: 'Stretnutie s dedkom Dubom', body: ['Na okraji Hájovej lúky stál dedko Dub. Bol taký starý, že si ani on sám nepamätal, koľko má rokov. Hovorilo sa, že pamätá ešte čas, keď les nebol lesom — len holou zemou a semenami.', 'Jeho kôra bola popraskaná ako mapa starého sveta, ale jeho koruna sa dotýkala neba a v jej tieni bolo chladno aj v najhorúcejší deň.', '„Lízka," zaškrípal Dub hlbokým hlasom, keď okolo neho prebehla, „dnes nechoď cez Hadiu lúku. Videl som tam veľkého vretenicového hada."', 'Líza len mávla chvostom. „Pche, dedko! Ja behám cez Hadiu lúku každý deň. Nič sa mi nikdy nestalo. Bežím!"'] },
      { type: 'chapter', heading: 'Hadia lúka', body: ['Líza bežala ďalej. Cez kvety, cez kríky, cez starý drevený most… a potom vstúpila na Hadiu lúku.', 'Prvých päť krokov bolo v pohode. Desiatich tiež. Ale potom v tráve začula niečo divné — také suché šuchnutie, také sykanie.', 'A zrazu ho uvidela. Veľký vretenicový had, celý ohriaty slnkom, ležal priamo pred ňou. Stočil sa do oblúka.', 'Líza zmrzla. Potom sa otočila a uháňala preč tak rýchlo, ako jej nôžky dovolili.'] },
      { type: 'chapter', heading: 'Návrat k Dubovi', body: ['Pribehla k dedkovi Dubovi celá udýchaná a sklopila uši. Dlho len stála a lapala dych.', '„Dedko… mal si pravdu. Bol tam had. Veľký had," povedala nakoniec tichým hlasom.', 'Dub nepovedal „vidíš, hovoril som ti to". Len sa jemne zakolísal vo vetre. „Ako sa máš, Lízka? Nič ti nie je?"', '„Nie, utiekla som. Ale… prečo si to vedel?" — „Stojím tu sto rokov, Lízka. Nie som múdry preto, že som starý. Som múdry preto, že som veľa videl a veľa vypočul."'] },
      { type: 'end', moral: 'Starí ľudia nesú v sebe lesy plné príbehov. Stačí sa pri nich zastaviť a počúvať.', art: '🦊🌳' },
    ],
  },
  {
    title: 'Ema a stratený kľúčik šťastia', age_id: 'a710', theme: 'Dôvera v rodičov, hľadanie pravdy', emoji: '🗝️',
    cover_a: '#7cc6ff', cover_b: '#c89bff', minutes: 5, author: 'príbeh o tom, že najväčší poklad býva najbližšie', generated_by: 'manual',
    pages: [
      { type: 'chapter', heading: 'Stratený kľúčik', body: ['Ema mala osem rokov, jedného vystatovačného brata Jana, najradšej mala čítanie a mala jeden veľký problém.', 'Pred týždňom si na povale u babičky našla starú drevenú škatuľku. Na veku bol vyrytý nápis ozdobnými písmenami: „Šťastie — otvor iba kľúčikom."', 'Kľúčik však nikde. Ema hľadala v každej zásuvke, v každom kúte povaly. Nič. A čím viac hľadala, tým väčší kameň cítila v bruchu.'] },
      { type: 'chapter', heading: '„Nechcem nikoho!"', body: ['Dni plynuli a Ema sa menila. Bola tichšia, odtiahnutejšia. Jedla málo.', 'Keď za ňou prišla mama, Ema zavrela dvere izby. „Nie teraz!" Keď ju ocko zavolal na večeru, povedala, že nemá hlad.', '„Ema, čo sa deje?" pýtala sa mama za dverami jemne. „Nič! Nechajte ma! Aj tak to nepochopíte!" odpovedala Ema, a sama sa potom divila, prečo to povedala.'] },
      { type: 'chapter', heading: 'Stretnutie v noci', body: ['V noci, keď Jano spal a v dome bolo ticho, Ema nemohla zaspať. Vstala a vyšla do kuchyne.', 'V chodbe bola tma, ale pod dverami kuchyne svietil prúžok svetla.', 'Otvorila dvere — a tam sedel ocko. Pri malom lampáši čítal noviny. Keď zbadal Emu, len odložil noviny a ukázal na stoličku oproti. „Sadni si. Uvarím ti kakao?"'] },
      { type: 'chapter', heading: 'Babičkin odkaz', body: ['Ema si sadla. Potom jej slová prišli samy — o škatuľke, o kľúčiku, o tom kameni v bruchu.', 'Ocko počúval. Ani raz ju neprerušil. „Vieš, Ema, tú škatuľku robila babička pre mňa, keď som mal päť rokov."', '„A vieš, čo som zistil? Že škatuľka sa nikdy neotvára. Šťastie nie je vec, ktorú niekde zamkneš. Šťastie je toto — sadnúť si s niekým, koho máš rád, neskoro v noci, so šálkou kakaa."'] },
      { type: 'chapter', heading: 'Ráno', body: ['Ráno Ema objala mamu ešte pred raňajkami. Poriadne, obe ruky okolo pása.', '„Prepáč, že som ťa včera odohnala."', 'Mama si k nej čupla. „Vieš, Ema, ja som tu vždy. Aj keď ma odoženieš. Ani raz sa nebudem hnevať, že si prišla."', 'A Ema vedela, že kľúčik konečne našla — nebol v žiadnej zásuvke. Bol v kuchyni, v tme, pri malom lampáši.'] },
      { type: 'end', moral: 'Niekedy si myslíme, že naše tajomstvá musíme niesť sami. Ale rodičia pri nás stoja — aj keď im neotvárame dvere.', art: '🗝️💛' },
    ],
  },
  {
    title: 'Tomáš a tajomstvo Tichého jazera', age_id: 'a1013', theme: 'Pravda, priateľstvo, dôvera v seba', emoji: '🌌',
    cover_a: '#3a2670', cover_b: '#7cc6ff', minutes: 5, author: 'príbeh pre tých, ktorí sa práve učia rozhodovať sami', generated_by: 'manual',
    pages: [
      { type: 'chapter', heading: 'Pri Tichom jazere', body: ['Tomáš mal jedenásť rokov, staršiu sestru Luciu a najlepšieho kamaráta menom Jakub.', 'Spolu chodili k Tichému jazeru — malému jazierku za dedinou, kde sa tak dokonale odrážala obloha, že človek nikdy nevedel, kde končí voda a začína nebo.', 'V dedinke sa šuškalo staré porekadlo: ten, kto Tichému jazeru klame, sa už nikdy v jeho hladine neuvidí. Tomáš sa tomu vždy smial. Až do toho leta.'] },
      { type: 'chapter', heading: 'Rozbité okno', body: ['Jedného popoludnia v júli Jakub zdvihol kameň a hodil ho po vrabcovi, ktorý sedel na plote pani Helenky.', 'Netrafil vrabca. Netrafil ani plot. Trafil okno. Sklo cinklo a rozsypalo sa na kusy.', 'Obaja chlapci bez slova bežali do lesa. „Nikomu nič nepovieme," povedal Jakub. „Okná sa lámu aj samy." Tomáš pokrčil plecami. „Dobre."'] },
      { type: 'chapter', heading: 'V hladine', body: ['Večer Tomáš prišiel k jazeru sám. Kľakol si na breh a naklonil sa nad vodu.', 'Hladina bola pokojná. Videl v nej oblohu, stromy, oblaky. Ale kde bol on? Kde bol jeho odraz? Hladina bola prázdna.', 'V hlave mu stále buchotal ten zvuk — cink — a obraz pani Helenky. Starej panej, ktorá býva sama. Bez vnúčat. A teraz bez okna.'] },
      { type: 'chapter', heading: 'Najťažšie zazvonenie', body: ['Na druhý deň ráno Tomáš stál pred dverami pani Helenky. Jakub ho ťahal za rukáv. „Si normálny? Sú to len peniaze za sklo!"', 'Tomáš sa zastavil. „Nie sú to peniaze, Jakub. Je to to, či sa môžem na seba pozrieť v zrkadle. Alebo v jazere."', 'Stlačil zvonček.'] },
      { type: 'chapter', heading: 'Pravda a hladina', body: ['Pani Helenka otvorila. Tomáš jej povedal všetko. Hlas sa mu trochu triasol, ale nezastavil sa.', 'Pani Helenka ho počúvala. Potom povedala: „Vieš, Tomáš, okná sa dajú vymeniť. Ale to, čo si práve urobil — prísť sem, povedať pravdu — to sa nedá kúpiť ani za všetky okná na svete."', 'Večer Tomáš prišiel k jazeru. Naklonil sa nad hladinu. A v pokojnej vode na neho pozeral chlapec, ktorého spoznal. S trochu väčším srdcom než včera.'] },
      { type: 'end', moral: 'Pravda niekedy bolí. Ale klamstvo nás kradne nám samým. Najväčšie priateľstvo je to, ktoré nám dovolí byť dobrými ľuďmi.', art: '🌌🪞' },
    ],
  },
]
