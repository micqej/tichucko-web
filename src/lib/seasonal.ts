// Sezónny a sviatočný kontext pre slovenský kalendár — vstup do generovania tém,
// aby rozprávky mali súvis s ročným obdobím a blízkymi sviatkami.

function season(m: number): string {
  if (m === 12 || m <= 2) return 'zima'
  if (m <= 5) return 'jar'
  if (m <= 8) return 'leto'
  return 'jeseň'
}

// Okná podľa mesiaca*100+deň → motív (láskavý, vhodný pre deti pred spaním).
const WINDOWS: [number, number, string][] = [
  [101, 106, 'Nový rok a Traja králi — nové začiatky, priania, cesta za svetlom'],
  [107, 213, 'hlboká zima — sneh, teplo pod perinou, blízkosť rodiny, ticho zasneženej noci'],
  [214, 228, 'koniec zimy — láska a priateľstvo, tešenie sa na jar'],
  [301, 331, 'skorá jar — prebúdzanie prírody, prvé kvietky, nový život'],
  [401, 430, 'jar a Veľká noc — obnova, odpustenie, nový začiatok, korbáče a vajíčka'],
  [501, 520, 'rozkvitnutá jar — lúky, motýle, dlhšie dni'],
  [521, 531, 'Deň matiek — láska, vďaka a objatie pre mamu'],
  [601, 615, 'Deň otcov a koniec školského roka — leto klope na dvere'],
  [616, 715, 'začiatok leta a prázdniny — dobrodružstvo, sloboda, voda, bosé nohy'],
  [716, 815, 'vrcholné leto — výlety, kamaráti, teplé večery pod hviezdami'],
  [816, 831, 'koniec leta — posledné prázdninové dni, lúčenie a spomienky'],
  [901, 915, 'začiatok školy — prvý deň, noví kamaráti, odvaha pri nových začiatkoch'],
  [916, 1015, 'jeseň — padajúce lístie, gaštany, hmla, teplý čaj'],
  [1016, 1031, 'neskorá jeseň — tekvice a strašidielka láskavo (nie strašidelne), zber úrody'],
  [1101, 1115, 'Dušičky — jemná spomienka na blízkych, sviečky, vďačnosť za lásku'],
  [1116, 1129, 'plná jeseň — prvé mrazíky, príprava na zimu, útulno doma'],
  [1130, 1224, 'Advent a blížiace sa Vianoce — očakávanie, svetielka, obdarovanie, teplo domova'],
  [1225, 1231, 'Vianoce a koniec roka — rodina, pokoj, vďačnosť, zázrak'],
]

export function seasonalContext(now: Date = new Date()): string {
  const m = now.getMonth() + 1
  const md = m * 100 + now.getDate()
  const hook = WINDOWS.find(([from, to]) => md >= from && md <= to)?.[2]
  return `ročné obdobie: ${season(m)}${hook ? `; sezónny/sviatočný motív: ${hook}` : ''}`
}
