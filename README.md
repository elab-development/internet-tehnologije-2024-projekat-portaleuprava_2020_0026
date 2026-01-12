# Portal eUprava

**Portal eUprava** je web aplikacija koja digitalizuje osnovne administrativne usluge i omogućava građanima da podnose zahteve online, prate njihov status, preuzimaju dokumenta u PDF formatu i komuniciraju napomene vezane za obradu. Aplikacija je organizovana po ulogama korisnika (**CITIZEN**, **OFFICER**, **ADMIN**) i koristi jasan tok zahteva: kreiranje (DRAFT) → slanje (SUBMITTED) → obrada (IN_REVIEW) → ishod (APPROVED/REJECTED), uz podršku za takse i priloge.

![Logo](./portal-euprava-frontend/public/images/logo.png) 

Sistem se oslanja na koncept **Servisa** (npr. izdavanje potvrde, podnošenje zahteva, različite eUsluge) koji pripadaju određenim **Institucijama**. Svaki servis ima dinamički definisana polja (Service Fields), koja određuju šta korisnik unosi u formu. Podaci koje korisnik unese čuvaju se u `form_data` kao objekt/mapa (ključ → vrednost), što omogućava univerzalnu podršku za različite vrste servisa bez potrebe da se unapred kodira svaka forma.

---

## Korisničke uloge i slučajevi korišćenja

### CITIZEN (Građanin)
Građanin koristi Portal eUprava za podnošenje i praćenje sopstvenih zahteva, kao i za pregled dostupnih servisa.

U okviru uloge građanina, aplikacija podržava sledeće ključne slučajeve korišćenja:
- **Registracija naloga**: građanin kreira nalog unosom osnovnih podataka (ime i prezime, email, lozinka, datum rođenja, JMBG).
- **Prijava i odjava**: pristup sistemu preko autentifikacije (token), uz mogućnost odjave.
- **Pregled servisa**: prikaz liste servisa, pregledi detalja servisa, osnovnih opisa i iznosa takse.
- **Pokretanje zahteva**: građanin bira servis i popunjava dinamička polja forme definisana kroz Service Fields.
- **Kreiranje DRAFT zahteva**: nakon popunjavanja forme, zahtev se kreira u statusu **DRAFT** (još uvek nije poslat na obradu).
- **Upload priloga (opciono)**: građanin može dodati dokument/fajl kao prilog uz zahtev, koji se čuva kao link.
- **Slanje zahteva (SUBMITTED)**: građanin može poslati prethodno kreiran DRAFT zahtev kako bi ušao u obradu.
- **Praćenje zahteva**: građanin pregleda sve svoje zahteve, filtrira/sortira, i vidi promene statusa kroz tok obrade.
- **Pregled detalja zahteva**: u okviru detalja se prikazuju `form_data` polja na univerzalan način (tabela/formatirani prikaz).
- **Preuzimanje PDF dokumenta**: građanin može preuzeti PDF prikaz zahteva (izveštaj/dokument).
- **Pregled informacija i vesti (opciono)**: dodatni segment može prikazivati javno dostupne informacije/vesti relevantne za korisnike.

---

### OFFICER (Službenik)
Službenik obrađuje zahteve građana, preuzima zahteve iz inbox-a, menja statuse i generiše dokumentaciju.

Ključni slučajevi korišćenja za službenika:
- **Prijava i odjava**: pristup sistemu u ulozi službenika.
- **Inbox pregled**: prikaz liste zahteva u statusu **SUBMITTED** koji još nisu dodeljeni nijednom službeniku.
- **Preuzimanje zahteva (assign)**: službenik preuzima zahtev iz inbox-a i time postaje zadužen za obradu.
- **Pregled dodeljenih zahteva**: lista zahteva dodeljenih konkretnom službeniku (Assigned to me).
- **Promena statusa zahteva**: službenik menja status (npr. u **IN_REVIEW**, zatim **APPROVED** ili **REJECTED**) u skladu sa obradom.
- **Pregled detalja zahteva**: službenik otvara modal sa detaljima zahteva i univerzalnim prikazom `form_data`.
- **Preuzimanje PDF-a**: službenik može preuzeti PDF dokument zahteva za arhiviranje ili dalju administraciju.
- **Statistika (Officer)**: prikaz osnovnih statistika i metrika na osnovu podataka iz sistema (npr. broj zahteva po statusu).

---

### ADMIN (Administrator)
Administrator upravlja sistemom: institucijama, servisima, poljima servisa, korisnicima i globalnim statistikama.

Ključni slučajevi korišćenja za administratora:
- **Upravljanje institucijama (CRUD)**:
  - pregled svih institucija,
  - kreiranje nove institucije,
  - izmena podataka (naziv, grad, adresa, email),
  - brisanje institucije,
  - pregled servisa koji pripadaju instituciji.
- **Upravljanje servisima (CRUD)**:
  - kreiranje/izmena/brisanje servisa,
  - podešavanje takse (fee) i statusa servisa,
  - povezivanje servisa sa institucijama,
  - pregled detalja servisa.
- **Upravljanje poljima servisa (Service Fields CRUD)**:
  - definisanje polja koja građanin popunjava (key, label, tip podatka, obavezno/opciono, opcije, redosled),
  - izmena i brisanje polja,
  - kontrola validacija i konfiguracije forme bez promene front/back logike.
- **Upravljanje korisnicima**:
  - pregled korisnika,
  - promena uloge korisnika (CITIZEN/OFFICER/ADMIN),
  - brisanje korisnika (uz zaštitu od brisanja sopstvenog naloga).
- **Statistika (Admin)**:
  - pregled agregiranih podataka: ukupno zahteva, distribucija po statusima, trendovi i metrike.

---

## Statusi zahteva (tok obrade)
- **DRAFT**: zahtev je kreiran, ali nije poslat.
- **SUBMITTED**: zahtev je poslat i čeka preuzimanje/obradu.
- **IN_REVIEW**: zahtev je u obradi kod službenika.
- **APPROVED**: zahtev je odobren (može zahtevati plaćanje takse).
- **REJECTED**: zahtev je odbijen (npr. nedostaju podaci/dokumentacija).

---

## Ključni koncept: Dinamička forma (`form_data`)
Za razliku od fiksnih formi, Portal eUprava koristi **Service Fields** kao izvor istine o tome koja polja se prikazuju i unose. Kada građanin unese podatke, oni se čuvaju u `form_data` kao mapirani objekat. Na taj način:
- novi servis i nova polja mogu da se dodaju bez promene frontenda,
- prikaz detalja zahteva uvek može univerzalno da prikaže sva polja u tabeli,
- aplikacija ostaje skalabilna i lako proširiva na veliki broj usluga.

---

## PDF izveštaji
Sistem podržava generisanje i preuzimanje PDF-a za pojedinačne zahteve, dostupno u skladu sa autorizacijom korisnika. PDF sadrži ključne informacije o zahtevu i može se koristiti kao dokument za arhivu ili potvrdu.

---

## Instalacija i pokretanje
---------------------------

1. Klonirajte repozitorijum:
```bash
    git clone https://github.com/elab-development/internet-tehnologije-2024-projekat-portaleuprava_2020_0026.git
```

2. Pokrenite backend:
```bash
   cd portal-euprava
   composer install
   php artisan migrate:fresh --seed
   php artisan serve
```
    
3. Pokrenite frontend:
```bash
   cd portal-euprava-frontend
   npm install
   npm start
```
    
4.  Frontend pokrenut na: [http://localhost:3000](http://localhost:3000) Backend API pokrenut na: [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)

---Ovo je test iz git basha
