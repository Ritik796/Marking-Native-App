import * as dbConnect from "../Firebase";

const data = {
  Ajmer: "https://dtdajmer.firebaseio.com/",
  Behror: "https://dtdbehror.firebaseio.com/",
  Bharatpur: "https://dtdbharatpur.firebaseio.com/",
  Bhiwadi: "https://dtdbhiwadi.firebaseio.com/",
  Chhapar: "https://dtdchhapar.firebaseio.com/",
  Chirawa: "https://dtdchirawa.firebaseio.com/",
  Churu: "https://dtdchuru.firebaseio.com/",
  Dehradun: "https://dtddehradun.firebaseio.com/",
  Etmadpur: "https://dtdetmadpur.firebaseio.com/",
  Gwalior: "https://dtdgwalior.firebaseio.com/",
  "IIT- Roorkee": "https://dtdiit-roorkee.firebaseio.com/",
  Jaipur: "https://dtdjaipur.firebaseio.com/",
  "Jaipur-BWG": "https://dtdjaipur-bwg.firebaseio.com/",
  "Jaipur-Jagatpura": "https://jaipur-jagatpura.firebaseio.com/",
  "Jaipur-Jhotwara": "https://jaipur-jhotwara.firebaseio.com/",
  "Jaipur-Malviyanagar": "https://jaipur-malviyanagar.firebaseio.com/",
  "Jaipur-Mansarovar": "https://jaipur-mansarovar.firebaseio.com/",
  "Jaipur-Murlipura": "https://jaipur-murlipura.firebaseio.com/",
  "Jaipur-Sanganer": "https://jaipur-sanganer.firebaseio.com/",
  "Jaipur-Test": "https://dtdjaipur-test.firebaseio.com",
  "Jaipur-Vidhyadhar": "https://jaipur-vidhyadhar.firebaseio.com/",
  "Jaipur-Civil-Line": "https://jaipur-civil-line.firebaseio.com/",
  "Jaipur-Kishanpole": "https://jaipur-kishanpole.firebaseio.com/",
  Jaisalmer: "https://dtdjaisalmer.firebaseio.com/",
  "Jammu - Survey": "https://dtdjammu-survey.firebaseio.com/",
  Jodhpur: "https://dtdnjodhpur.firebaseio.com/",
  "Jodhpur - BWG": "https://dtdjodhpur-bwg.firebaseio.com/",
  Khairabad: "https://dtdkhairabad.firebaseio.com/",
  Khandela: "https://dtdkhandela.firebaseio.com/",
  Kishangarh: "https://dtdkishangarh.firebaseio.com/",
  Kuchaman: "https://dtdkuchaman.firebaseio.com/",
  Losal: "https://dtdlosal.firebaseio.com/",
  "MNZ-Test": "https://dtdmnz-test.firebaseio.com/",
  "MPZ-Test": "https://dtdmpz-test.firebaseio.com/",
  Manesar: "https://dtdmanesar.firebaseio.com/",
  Nawa: "https://dtdnawa.firebaseio.com/",
  Niwai: "https://dtdniwai.firebaseio.com/",
  Noida: "https://dtdnoida.firebaseio.com/",
  Nokha: "https://dtdnokha.firebaseio.com/",
  Pali: "https://dtdpali.firebaseio.com/",
  "Phulwari-Sharif": "https://dtdphulwari-sharif.firebaseio.com/",
  Rajsamand: "https://dtdrajsamand.firebaseio.com/",
  Ratangarh: "https://dtdratangarh.firebaseio.com/",
  Reengus: "https://dtdreengus.firebaseio.com/",
  Salasar: "https://dtdsalasar.firebaseio.com/",
  Sanchore: "https://dtdsanchore.firebaseio.com/",
  Shahpura: "https://dtdshahpura.firebaseio.com/",
  Sikar: "https://dtdnavigator.firebaseio.com/",
  "Sikar-Survey": "https://dtdsikar-survey.firebaseio.com/",
  Sonipat: "https://dtdsonipat-new.firebaseio.com/",
  Sujalpur: "https://dtdsujalpur.firebaseio.com/",
  Sujangarh: "https://dtdsujangarh.firebaseio.com/",
  Sultanpur: "https://dtdsultanpur.firebaseio.com/",
  Test: "https://dtdnavigatortesting.firebaseio.com/",
  Tonk: "https://dtdtonk.firebaseio.com/",
  "Tonk-Raj": "https://dtdtonk-raj.firebaseio.com/",
  Uniara: "https://dtduniara.firebaseio.com/",
  Jaunpur: "https://dtdjaunpur.firebaseio.com/",
  "WattEye-Office": "https://dtdwatteye-office.firebaseio.com/",
  "WeVOIS-Others": "https://dtdwevois.firebaseio.com/"
};

export const getCityWiseDatabase = (city) => {
  return new Promise((resolve) => {
    let db = '';
    if (!city) {
      return
    }
    let url = data[city]
    db = dbConnect.getCurrentDatabase(url);
    resolve({ db: db });
  });
};