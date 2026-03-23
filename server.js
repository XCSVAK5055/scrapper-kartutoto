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
  "TOTO MACAU POOL": "m17",
  "AUSTRIA POOL": "p13850",
  "CAMBODIA POOL": "p13851",
  "CHINA POOL": "p13852",
  "CYPRUS POOL": "p13853",
  "GUANGDONG POOL": "p13854",
  "HONGKONG": "p13855",
  "MADRID POOL": "p13856",
  "MIAMI POOL": "p13857",
  "PHILIPPINES POOL": "p13858",
  "ROMA POOL": "p13859",
  "SINGAPORE POOL": "p13860",
  "SYDNEY": "p13861",
  "TAIWAN POOL": "p13862",
  "TOTOBEIJING POOL": "p13863",
  "TURIN POOL": "p13864",
  "JAPAN POOL": "p15472",
  "ICELAND POOL": "p15473",
  "BULLSEYE POOL": "p18887",
  "NEWYORKEVE POOL": "p18901",
  "NEWYORKMID POOL": "p18902",
  "FLORIDAMID POOL": "p18903",
  "FLORIDAEVE POOL": "p18904",
  "KENTUCKYEVE POOL": "p18905",
  "KENTUCKYMID POOL": "p18906",
  "CAROLINAEVE POOL": "p18907",
  "CAROLINADAY POOL": "p18908",
  "OREGON12 POOL": "p18909",
  "OREGON09 POOL": "p18910",
  "OREGON03 POOL": "p18911",
  "OREGON06 POOL": "p18912",
  "CALIFORNIA POOL": "p18913",
  "BULGARIA POOL": "p28512",
  "HUNGARY POOL": "p28513",
  "LAOS POOL": "p28514",
  "JEJULOTTO POOL": "p28515",
  "TOTOFUZHOU POOL": "p28516",
  "BHUTAN POOL": "p28517",
  "TORONTO POOL": "p28518",
  "MONACO POOL": "p30090",
  "CUBA POOL": "p30091",
  "ECUADOR POOL": "p30092",
  "FOSHAN POOL": "p30093",
  "CHENGDU POOL": "p30095",
  "CHONGQING POOL": "p30097",
  "KOWLOON POOL": "p30100",
  "TAICHUNG POOL": "p30102",
  "HAITI POOL": "p30104",
  "DENVER POOL": "p30105",
  "ITALY POOL": "p30527",
  "FRANCE POOL": "p30528",
  "CHILE POOL": "p30529",
  "MEXICO POOL": "p30530",
  "OSLO POOL": "p30531",
  "TOTO MACAO 5D": "m51",
  "KING KONG 4D": "m83"
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
setInterval(updateLoop, 3000);

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
