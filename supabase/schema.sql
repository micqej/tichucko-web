-- Tichučko database schema
-- Run this in your Supabase SQL editor

-- Stories table
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  age_id text not null check (age_id in ('a02','a24','a47','a710','a1013')),
  theme text not null,
  emoji text not null default '🌙',
  cover_a text not null default '#ff9bbf',
  cover_b text not null default '#c89bff',
  minutes integer not null default 4,
  pages jsonb not null default '[]',
  author text,
  generated_by text check (generated_by in ('openai','grok','manual')),
  status text not null default 'published' check (status in ('draft','published')),
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Topics table (AI generation queue)
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  age_id text not null check (age_id in ('a02','a24','a47','a710','a1013')),
  theme text not null,
  keywords text,
  moral_lesson text,
  used boolean not null default false,
  priority integer not null default 0,
  created_at timestamptz default now()
);

-- Subscribers table
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  age_preference text check (age_preference in ('a02','a24','a47','a710','a1013','all')),
  active boolean not null default true,
  unsubscribe_token text not null default encode(gen_random_bytes(20), 'hex'),
  subscribed_at timestamptz default now()
);

-- Daily sends log
create table if not exists daily_sends (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id),
  sent_at timestamptz default now(),
  recipient_count integer default 0
);

-- Enable RLS
alter table stories enable row level security;
alter table subscribers enable row level security;
alter table topics enable row level security;
alter table daily_sends enable row level security;

-- Public can read published stories
create policy "Public read published stories"
  on stories for select
  using (status = 'published');

-- Service role has full access (for API routes)
-- No additional policies needed for service_role

-- Indexes
create index if not exists stories_age_id_idx on stories(age_id);
create index if not exists stories_published_at_idx on stories(published_at desc);
create index if not exists stories_status_idx on stories(status);
create index if not exists topics_used_idx on topics(used, age_id);
create index if not exists subscribers_active_idx on subscribers(active);

-- Seed: 5 sample stories
insert into stories (title, age_id, theme, emoji, cover_a, cover_b, minutes, author, generated_by, status, pages) values
(
  'Mesiačik a Macko Mier',
  'a02',
  'Dôvera a pokojný spánok',
  '🌙',
  '#ff9bbf',
  '#c89bff',
  3,
  'rozprávka pre tých najmenších',
  'manual',
  'published',
  '[
    {"type":"chapter","heading":"Tichučko, tichučko…","body":["Mesiačik vyšiel na oblohu. Pomaličky, pomaličky. Najprv len jeho špička, potom polovička, a nakoniec celý okrúhly mesiačik sa vyšvihol medzi hviezdičky.","Macko Mier si líhal do postieľky. Deka bola mäkučká ako oblak. Vankúš voňal ako lúka po daždi.","Hviezdičky si zaspievali svoju nočnú pieseň: cingi-lingi, cingi-lingi. Každá hviezdička mala svoju pesničku."]},
    {"type":"chapter","heading":"Macko zatvára očká","body":["Macko sa pritúlil k vankúšiku. Vankúšik je mäkučký ako babičkin golier.","Macko zívol. Velikánsky zívol — háááá. Tlapky sa mu natiahli, chvostík sa skrútil.","Mama prikryla Macka dekou. Deka je teplučká ako slniečko. Macko sa usmial celým bruškom."]},
    {"type":"chapter","heading":"A Mesiačik šepkal…","body":["Mesiačik sa díval oknom rovno na Macka. Svietil naňho jemným strieborným svetlom.","„Nehaj sa, malý Macko. Som tu celú noc," šepkal tichučko.","„Hviezdičky sú tu tiež. Sto hviezdičiek, tisíc hviezdičiek. Všetky strážia tvoj spánok. Spinkaj, spinkaj, môj zlatý Macko."","A Macko zaspal. Tichučko, tichučko. Sníval o medovom poli a teplom slniečku."]},
    {"type":"end","moral":"Spánok je objatie sveta. Mesiačik bdie, kým ty snívaš. Si v bezpečí.","art":"🌙✨"}
  ]'::jsonb
),
(
  'Zajko Skokan a tmavá komôrka',
  'a24',
  'Odvaha a viera v seba',
  '🐰',
  '#ffb347',
  '#ff9bbf',
  4,
  'rozprávka o tom, ako sa malý strach premení na veľké srdce',
  'manual',
  'published',
  '[
    {"type":"chapter","heading":"Zajko sa bál tmy","body":["V malej drevenej chalúpke pod brezovým hájom bývala zajačia rodinka. Bola tam mama Zajka s dlhými ružovými ušami, ocko Zajko so silnými nohami a najmenší Skokan — malý, chlpatý a plný iskier.","Skokan miloval mrkvu, miloval skákanie po lúke, miloval šálku teplého mlieka pred spaním a objatia. Ale jedno nemiloval — tmavú komôrku za kuchyňou, kde sa skladovala kapusta na zimu.","Keď ho mama raz poprosila, aby priniesol jednu hlávku na večeru, Skokanove uši okamžite ovisli dolu. Bruško sa mu zvieralo."]},
    {"type":"chapter","heading":"„A čo ak tam niečo je?"","body":["„Mamka," zašepkal Skokan a priblížil sa bližšie k jej teplému boku, „a čo ak v komôrke býva strašidlo? Také veľké, čierne strašidlo s dlhými pazúrmi?"","Mama Zajka sa usmiala tým svojím najkrajším úsmevom. Sadla si na zem, aby bola rovnako veľká ako Skokan, a vzala ho za obe tlapky.","„Vieš, Skokan, strašidlá najradšej žijú v hlavičkách malých zajačikov. Nie v komôrkach. A vieš, čo sa stane, keď sa raz pozrieš do tmy? Strašidlo utečie, pretože sa bojí odvážnych zajačikov.""]},
    {"type":"chapter","heading":"Prvý krôčik","body":["Skokan sa zhlboka nadýchol. Raz. Dva. Tri. Cítil, ako mu srdce buší rýchlejšie než zvyčajne.","Pristúpil k dverám komôrky. Rukoväť bola studená. Otvoril dvere — škríp — a zazrel tmu.","Vo vnútri bola tma a ticho. Skokan počkal chvíľu. Potom uvidel mamine kapusty v rohoch, oteckove jablká v košíku a v ďalšom rohu… starú metlu s lýkovým viazaním.","„To si bolo ty, strašidlo?" zasmial sa Skokan nahlas. Smiech mu odoznel po celej komôrke. „Ty si len metla! Ani trochu ma nestrašíš!""]},
    {"type":"chapter","heading":"Veľké srdce malého zajka","body":["Skokan vzal kapustu — tú najkrajšiu, najzelenšiu, najokrúhlejšiu — a vybehol späť do kuchyne.","Keď ju položil na stôl, vypol hruď ako najväčší zajko na svete. „Mama! Doniesol som! A nebolo tam žiadne strašidlo, len stará metla!"","Mama ho pohladila po uškách. Ocko sa usmial. „Vedeli sme to celý čas, náš malý hrdina."","Od toho dňa Skokan chodil do komôrky sám. A vždy, keď bolo tmavo, si spomínal: to nie je strašidlo. To som ja — odvážny zajko."]},
    {"type":"end","moral":"Odvaha nie je, že sa nebojíme. Odvaha je, že napriek strachu urobíme prvý krôčik.","art":"🐰💛"}
  ]'::jsonb
),
(
  'Líštička Líza a múdry dedko Dub',
  'a47',
  'Úcta k starším a počúvanie',
  '🦊',
  '#9be59b',
  '#7cc6ff',
  5,
  'rozprávka o tom, prečo starí vedia, čo my ešte nevidíme',
  'manual',
  'published',
  '[
    {"type":"chapter","heading":"Najrýchlejšia líštička v lese","body":["Líštička Líza bola najrýchlejšia v celom Hájovom lese. Bežala ako vetrík — cez kríky, cez potok, cez lúku. Chvost za ňou vlnil ako oranžová vlajka.","Všetky zvieratká v lese ju poznali. Veveričky jej tlieskali, vtáčiky spievali jej meno, aj malý ježko Pišta sa vždy rozžiaril, keď prišla.","Ale Líza mala jeden zlozvyk: nemala rada, keď jej niekto hovoril, čo má robiť. Najmä staré zvieratká. „Načo mi je počúvať starých? Veď sú pomalí a nudní. Ja som mladá a všetko viem!""]},
    {"type":"chapter","heading":"Stretnutie s dedkom Dubom","body":["Na okraji Hájovej lúky stál dedko Dub. Bol taký starý, že si ani on sám nepamätal, koľko má rokov. Hovorilo sa, že pamätá ešte čas, keď les nebol lesom — len holou zemou a semenami.","Jeho kôra bola popraskaná ako mapa starého sveta, ale jeho koruna sa dotýkala neba a v jej tieni bolo chladno aj v najhorúcejší deň.","„Lízka," zaškrípal Dub hlbokým hlasom, keď okolo neho prebehla, „dnes nechoď cez Hadiu lúku. Videl som tam veľkého vretenicového hada. Slnko ho zohreje a on bude podráždenejší ako inokedy."","Líza len mávla chvostom. „Pche, dedko! Ja behujem cez Hadiu lúku každý deň. Nič sa mi nikdy nestalo. Bežím!""]},
    {"type":"chapter","heading":"Hadia lúka","body":["Líza bežala ďalej. Cez kvety, cez kríky, cez starý drevený most… a potom vstúpila na Hadiu lúku.","Prvých päť krokov bolo v pohode. Desiatich tiež. Ale potom v tráve začula niečo divné — také suché šuchnutie, také sykanie.","A zrazu ho uvidela. Veľký vretenicový had, celý ohriatý slnkom, ležal priamo pred ňou a pozeral na ňu malými čiernymi očami. Stočil sa do oblúka.","Líza zmrzla. Potom sa otočila a uháňala preč tak rýchlo, ako jej nôžky dovolili. Srdiečko jej bilo ako bubienok, uši boli dolu."]},
    {"type":"chapter","heading":"Návrat k Dubovi","body":["Pribehla k dedkovi Dubovi celá udýchaná a sklopila uši. Dlho len stála a lapala dych.","„Dedko… mal si pravdu. Bol tam had. Veľký had," povedala nakoniec tichým hlasom.","Dub nepovedal „vidíš, hovoril som ti to". Len sa jemne zakolísal vo vetre. „Ako sa máš, Lízka? Nič ti nie je?"","„Nie, utiekla som. Ale… prečo si to vedel? Prečo starí vedia veci, ktoré ja nevidím?"","Dub sa pousmial svojou listovou korunou. „Stojím tu sto rokov, Lízka. Videl som každé leto, každú zimu, každý had na každej lúke. Nie som múdry preto, lebo som starý. Som múdry preto, lebo som veľa videl a veľa vypočul.""]},
    {"type":"chapter","heading":"Líštička, ktorá počúva","body":["Od toho dňa sa Líza vždy zastavila pri dedkovi Dubovi. Pýtala sa ho na počasie, na zvieratká, na bezpečné chodníčky. A Dub jej vždy rád povedal, čo vedel.","Keď sa jej kamaráti zo škôlky pýtali, odkiaľ vie také zaujímavé veci, Líza sa usmievala. „Mám múdreho priateľa. Je starý a pomalý, ale vie toho viac než všetci rýchli dokopy.""]},
    {"type":"end","moral":"Starí ľudia nesú v sebe lesy plné príbehov. Stačí sa pri nich zastaviť a počúvať.","art":"🦊🌳"}
  ]'::jsonb
),
(
  'Ema a stratený kľúčik šťastia',
  'a710',
  'Dôvera v rodičov, hľadanie pravdy',
  '🗝️',
  '#7cc6ff',
  '#c89bff',
  5,
  'príbeh o tom, že najväčší poklad býva najbližšie',
  'manual',
  'published',
  '[
    {"type":"chapter","heading":"Stratený kľúčik","body":["Ema mala osem rokov, jeden vystatovačný brat Jano, najradšej mala čítanie a mala jeden veľký problém.","Pred týždňom si na pôjde u babičky našla starú drevenú škatuľku. Bola opracovaná ako kameň — niekde tu boli ruky, ktoré ju brúsili dlhé hodiny. Na veku bol vyrytý nápis ozdobnými písmenami: „Šťastie — otvor iba kľúčikom."","Kľúčik však nikde. Ema hľadala v každej zásuvke, v každom kúte pôjdy, dokonca aj v starých botách pri dverách. Nič. A čím viac hľadala, tým väčší kameň cítila v bruchu."]},
    {"type":"chapter","heading":"„Nechcem nikoho!"","body":["Dni plynuli a Ema sa menila. Bola tichšia, odtiahnutejšia. Jedla málo.","Keď za ňou prišla mama, Ema zavrela dvere izby. „Nie teraz!" Keď ju ocko zavolal na večeru, povedala, že nemá hlad a skrčila sa na posteli s knihou, z ktorej nečítala ani riadok.","„Ema, čo sa deje?" pýtala sa mama za dverami jemne.","„Nič! Nechajte ma! Aj tak to nepochopíte!" odpovedala Ema, a sama sa potom divila, prečo povedala práve toto. Veď vlastne ani nevedela, čo chce."]},
    {"type":"chapter","heading":"Stretnutie v noci","body":["V noci, keď Jano spal a v dome bolo ticho, Ema nemohla zaspať. Prevracala sa z boku na bok.","Vstala a vyšla do kuchyne. V chodbe bola tma, ale pod dverami kuchyne svietil prúžok svetla.","Otvorila dvere — a tam sedel ocko. Pri malom lampáši čítal noviny a pri ruke mal pohár čaju. Keď zbadal Emu, ani sa nediví. Len odložil noviny a ukázal na stoličku oproti.","„Sadni si. Uvarim ti čaj. Kakao?""]},
    {"type":"chapter","heading":"Babičkin odkaz","body":["Ema si sadla. Dlho boli ticho. Potom jej slová prišli samy — o škatuľke, o kľúčiku, o hľadaní, o tom kameni v bruchu, ktorý tam bol stále.","Ocko počúval. Ani raz ju neprerušil. Keď Ema dorozprávala, dopil čaj a jemne sa pousmial.","„Vieš, Ema, tú škatuľku robila babička pre mňa, keď som mal päť rokov. Učila som sa s ňou rezbyť. Bol som vtedy smutný, lebo kamarát odišiel do iného mesta."","Naklonil sa bližšie. „A vieš, čo som zistil? Že škatuľka sa nikdy neotvára. Nápis ti hovorí niečo iné: šťastie nie je vec, ktorú niekde zamkneš a odomkneš. Šťastie je toto — sadnúť si s niekým, koho máš rád, neskoro v noci, so šálkou kakaa.""]},
    {"type":"chapter","heading":"Ráno","body":["Ráno Ema objala mamu ešte pred raňajkami. Poriadne, obe ruky okolo pása.","„Prepáč, že som ťa včera odohnala."","Mama si k nej čupla, aby boli oči rovnako vysoko. „Vieš, Ema, ja som tu vždy. Aj keď ma odoženieš. Aj keď ti je smutno a nevieš prečo. Ani raz sa nebudem hnevať, že si prišla."","A Ema vedela, že kľúčik konečne našla — nebol v žiadnej zásuvke. Bol v kuchyni, v tme, pri malom lampáši."]},
    {"type":"end","moral":"Niekedy si myslíme, že naše tajomstvá musíme niesť sami. Ale rodičia sú tí, ktorí pri nás stoja — aj keď im neotvárame dvere.","art":"🗝️💛"}
  ]'::jsonb
),
(
  'Tomáš a tajomstvo Tichého jazera',
  'a1013',
  'Pravda, priateľstvo, dôvera v seba',
  '🌌',
  '#3a2670',
  '#7cc6ff',
  5,
  'príbeh pre tých, ktorí sa práve učia rozhodovať sami',
  'manual',
  'published',
  '[
    {"type":"chapter","heading":"Pri Tichom jazere","body":["Tomáš mal jedenásť rokov, staršiu sestru Luciu, ktorá ho väčšinou ignorovala, a najlepšieho kamaráta menom Jakub.","Spolu chodili k Tichému jazeru — malému jazierku za dedinou, kde sa tak dokonale odrážala obloha, že človek nikdy nevedel, kde končí voda a začína nebo. V lete tam lovili žaby, na jeseň hádzali kamene a sledovali kruhy.","V dedinke sa šuškalo staré porekadlo: ten, kto Tichému jazeru klame, sa už nikdy v jeho hladine neuvidí. Tomáš sa tomu vždy smial. Klámal niekedy doma, klámal niekedy v škole — a v jazere sa vždy videl bez problémov. Až do toho leta."]},
    {"type":"chapter","heading":"Rozbité okno","body":["Jedného popoludnia v júli Jakub zdvihol kameň — veľký, plochý — a hodil ho po vrabcovi, ktorý sedel na plote pani Helenky.","Netrafil vrabca. Netrafil ani plot. Trafil okno. Sklo cinklo, potom zacinkalo a potom sa rozsypalo na kusy.","Obaja chlapci sa otočili a bez slova bežali do lesa, srdiečka im búšili tak nahlas, že si navzájom počuli dych.","Keď sa zastavili pri veľkej borovici, Jakub povedal: „Nikomu nič nepovieme. Bolo to náhoda. Okná sa lámu aj samy." Tomáš pokrčil plecami. „Dobre.""]},
    {"type":"chapter","heading":"V hladine","body":["Večer Tomáš prišiel k jazeru sám. Kľakol si na breh a naklonil sa nad vodu.","Hladina bola pokojná. Videl v nej oblohu, stromy, oblaky. Ale kde bol on? Kde bol jeho odraz?","Hladina bola prázdna.","Stál tam dlho, kým mu nohy nezomreli od chladnej trávy. V hlave mu stále buchotal ten zvuk — cinknúť, cínknúť — a potom obraz: pani Helenka. Stará pani, ktorá býva sama v dome s bielymi okenicami. Bez vnúčat. Bez rodiny v dedine. A teraz bez okna."]},
    {"type":"chapter","heading":"Najťažšie zazvonenie","body":["Na druhý deň ráno Tomáš stál pred dverami pani Helenky. Jakub bol vedľa neho, ale každú chvíľu ho ťahal za rukáv.","„Si normálny? Povie to rodičom! Dostaneme za to! Sú to len peniaze za sklo, Tomáš, veď to nie je nič veľké."","Tomáš sa zastavil. Díval sa na dvere. „Nie sú to peniaze, Jakub. Sú to to, či sa môžem na seba pozrieť v zrkadle. Alebo v jazere."","Stlačil zvonček."]},
    {"type":"chapter","heading":"Pravda a hladina","body":["Pani Helenka otvorila. Mala na sebe modrú zásteru a v ruke drevenú varešku.","Tomáš jej povedal všetko. O kameni, o vrabcovi, o tom, ako utiekli. Hlas sa mu trochu triasol, ale nezastavil sa.","Pani Helenka ho počúvala. Potom dlho mlčala. „Vieš, Tomáš," povedala nakoniec, „okná sa dajú vymeniť. Ale to, čo si práve urobil — prísť sem, povedať pravdu — to sa nedá kúpiť ani za všetky okná na svete."","Večer Tomáš prišiel k jazeru. Naklonil sa nad hladinu. A v pokojnej vode na neho pozeral chlapec, ktorého spoznal. S trochu väčším srdcom než včera."]},
    {"type":"end","moral":"Pravda niekedy bolí. Ale klamstvo nás kradne nám samým. Najväčšie priateľstvo je to, ktoré nám dovolí byť dobrými ľuďmi.","art":"🌌🪞"}
  ]'::jsonb
);

-- Seed: sample topics
insert into topics (age_id, theme, keywords, moral_lesson) values
('a02','Prvé kroky','kroky, pád, vstávanie, mama','Je v poriadku padnúť. Vždy sa dá vstať.'),
('a24','Zdieľanie hračiek','hračka, kamarát, radosť','Keď sa delíme, máme viac radosti.'),
('a47','Pomoc pri upratovaní','poriadok, zodpovednosť, tím','Každý v rodine pomáha. Aj malí.'),
('a710','Prvý deň v novej škole','strach, nové miesto, priateľstvo','Nové začiatky sú strašidelné — a krásne zároveň.'),
('a1013','Tlak skupiny','kamaráti, správne rozhodnutie, odvaha','Byť sám sebou je ťažšie ako nasledovať dav. A oveľa krajšie.'),
('a02','Teplý objatie','bezpečie, láska, rodina','V objatí rodičov je celý svet bezpečný.'),
('a24','Bolesť a plač','emócie, plač, utešenie','Plakať je v poriadku. Každý plače.'),
('a47','Klamstvo a pravda','čestnosť, hanba, odpustenie','Pravda bolí chvíľku. Klamstvo bolí dlho.'),
('a710','Závisť a vďačnosť','závisť, porovnávanie, vďaka','To, čo máme, je vzácnejšie, než čo nemáme.'),
('a1013','Chyba a odpustenie','chyba, zodpovednosť, druhá šanca','Chyby nás nedefinia. To, čo s nimi urobíme, áno.');
