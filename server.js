const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🔥 FULL MARKET MAPPING
const markets = {
  china: "p13852",
  cambodia: "p13851",
  singapore: "p13860",
  hongkong: "p13855",
  taiwan: "p13862",
  macau: "m17",
  japan: "p15472",
  korea: "p28515",
  thailand: "p28514"
};

// cache realtime
let cache = {};

// ambil tanggal hari ini
function getToday() {
  return new Date().toISOString().split("T")[0];
}

// scraping
async function scrape(kode) {
  const URL = `https://duatiga0326.kartu275.com/history/result/${kode}/kosong`;

  const res = await axios.get(URL);
  const $ = cheerio.load(res.data);

  let result = null;

  $("table tbody tr").each((i, el) => {
    const tds = $(el).find("td");

    const datetime = $(tds[2]).text().trim();
    const number = $(tds[3]).text().trim();

    if (!datetime) return;

    const [date, time] = datetime.split("|").map(s => s.trim());

    // 🔥 hanya ambil hari ini
    if (date === getToday()) {
      result = { number, date, time };
      return false;
    }
  });

  return result;
}

// 🔥 AUTO UPDATE LOOP (REALTIME FEEL)
async function updateLoop() {
  for (const name in markets) {
    const kode = markets[name];

    try {
      const data = await scrape(kode);

      if (!data) continue;

      // hanya update jika berubah
      if (!cache[name] || cache[name].number !== data.number) {
        console.log(`UPDATE ${name}: ${data.number}`);
        cache[name] = data;
      }

    } catch (err) {
      console.log("ERROR:", name);
    }
  }
}

// jalan tiap 5 detik
setInterval(updateLoop, 5000);

// 🔥 ENDPOINT API
app.get("/market/:name", (req, res) => {
  const name = req.params.name.toLowerCase();

  if (!markets[name]) {
    return res.status(404).json({ error: "market not found" });
  }

  res.json(
    cache[name] || {
      number: "-",
      date: "-",
      time: "-"
    }
  );
});

// list market
app.get("/markets", (req, res) => {
  res.json(markets);
});

// root check
app.get("/", (req, res) => {
  res.send("API RUNNING 🔥");
});

app.listen(PORT, () => {
  console.log("SERVER RUNNING ON PORT " + PORT);
});
