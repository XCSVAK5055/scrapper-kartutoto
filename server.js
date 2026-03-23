const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

// 🔥 SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;

// FULL MARKET
const markets = {
  "m17": "TOTO MACAU POOL",
  "p13850": "AUSTRIA POOL",
  "p13851": "CAMBODIA POOL",
  "p13852": "CHINA POOL",
  "p13853": "CYPRUS POOL",
  "p13854": "GUANGDONG POOL",
  "p13855": "HONGKONG",
  "p13856": "MADRID POOL",
  "p13857": "MIAMI POOL",
  "p13858": "PHILIPPINES POOL",
  "p13859": "ROMA POOL",
  "p13860": "SINGAPORE POOL",
  "p13861": "SYDNEY",
  "p13862": "TAIWAN POOL",
  "p13863": "TOTOBEIJING POOL",
  "p13864": "TURIN POOL",
  "p15472": "JAPAN POOL",
  "p15473": "ICELAND POOL",
  "p18887": "BULLSEYE POOL",
  "p18901": "NEWYORKEVE POOL",
  "p18902": "NEWYORKMID POOL",
  "p18903": "FLORIDAMID POOL",
  "p18904": "FLORIDAEVE POOL",
  "p18905": "KENTUCKYEVE POOL",
  "p18906": "KENTUCKYMID POOL",
  "p18907": "CAROLINAEVE POOL",
  "p18908": "CAROLINADAY POOL",
  "p18909": "OREGON12 POOL",
  "p18910": "OREGON09 POOL",
  "p18911": "OREGON03 POOL",
  "p18912": "OREGON06 POOL",
  "p18913": "CALIFORNIA POOL",
  "p28512": "BULGARIA POOL",
  "p28513": "HUNGARY POOL",
  "p28514": "LAOS POOL",
  "p28515": "JEJULOTTO POOL",
  "p28516": "TOTOFUZHOU POOL",
  "p28517": "BHUTAN POOL",
  "p28518": "TORONTO POOL",
  "p30090": "MONACO POOL",
  "p30091": "CUBA POOL",
  "p30092": "ECUADOR POOL",
  "p30093": "FOSHAN POOL",
  "p30095": "CHENGDU POOL",
  "p30097": "CHONGQING POOL",
  "p30100": "KOWLOON POOL",
  "p30102": "TAICHUNG POOL",
  "p30104": "HAITI POOL",
  "p30105": "DENVER POOL",
  "p30527": "ITALY POOL",
  "p30528": "FRANCE POOL",
  "p30529": "CHILE POOL",
  "p30530": "MEXICO POOL",
  "p30531": "OSLO POOL",
  "m51": "TOTO MACAO 5D",
  "m83": "KING KONG 4D"
};

let cache = {};

// ambil hari ini
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

    if (date === getToday()) {
      result = { number, date, time };
      return false;
    }
  });

  return result;
}

// 🔥 LOOP REALTIME
async function updateLoop() {
  for (const kode in markets) {
    try {
      const data = await scrape(kode);

      if (!data) continue;

      if (!cache[kode] || cache[kode].number !== data.number) {
        cache[kode] = data;

        console.log("NEW:", kode, data.number);

        // 🔥 PUSH KE FRONTEND
        io.emit("update", {
          kode,
          ...data
        });
      }

    } catch (e) {
      console.log("error", kode);
    }
  }
}

// jalan cepat (3 detik)
setInterval(updateLoop, 2000);

// API fallback
app.get("/market/:kode", (req, res) => {
  const kode = req.params.kode;
  res.json(cache[kode] || { number: "-", date: "-", time: "-" });
});

// SOCKET CONNECT
io.on("connection", (socket) => {
  console.log("client connected");

  // kirim data awal
  socket.emit("init", cache);
});

server.listen(PORT, () => {
  console.log("WS SERVER RUNNING 🔥 " + PORT);
});
