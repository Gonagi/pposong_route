const express = require("express");
const https = require("https");
const fs = require("fs");
const fs2 = require("fs").promises;
const bodyParser = require("body-parser");
const path = require("path");
const weather = require("./get_weather_Data.js");
const { createDynamicHTML } = require("./result.js");
const cors = require("cors");
var db = require("./db");
const td = require("./cal_time_date.js");
const forecast = require("./Ultra_Forecast.js");
const schedule = require("node-schedule");

const app = express();
app.use(cors());

const port = 1521;
var locArr = [
  [61, 129],
  [62, 129],
  [59, 128],
  [60, 128],
  [61, 128],
  [62, 128],
  [57, 127],
  [58, 127],
  [59, 127],
  [60, 127],
  [61, 127],
  [62, 127],
  [63, 127],
  [57, 126],
  [58, 126],
  [59, 126],
  [60, 126],
  [61, 126],
  [62, 126],
  [63, 126],
  [57, 125],
  [58, 125],
  [59, 125],
  [60, 125],
  [61, 125],
  [62, 125],
  [63, 125],
  [58, 124],
  [59, 124],
  [61, 124],
];

async function readFile(filePath) {
  try {
    const data = await fs2.readFile(filePath, "utf8");
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// 2023 11.30 김건학
// 함수명 : getWeatherDataAndRenderPage
// 지도에 표현할 날씨 데이터를 DB에서 받고 render
async function getWeatherDataAndRenderPage(filePath, res) {
  var grid_data = [];
  try {
    for (var idx = 0; idx < 30; idx++) {
      var data = await weather.get_6weather_Data(locArr[idx][0], locArr[idx][1]);
      grid_data.push(data);
    }

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        res.status(500).send("Error reading file");
      } else {
        const update_data = data.replace(`{{grid_data}}`, JSON.stringify(grid_data));
        res.send(update_data);
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting data");
  }
}

const options = {
  key: fs.readFileSync("./localhost.key"),
  cert: fs.readFileSync("./localhost.crt"),
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "/public")));

// 2023.11.30 김건학
// 날씨 데이터 받고 render하는 기존 코드를 함수로 묶음
app.get("/main", async (req, res) => {
  const filePath = path.join(__dirname, "/views/map.html");
  await getWeatherDataAndRenderPage(filePath, res);
});

app.get("/main/POI", async (req, res) => {
  const filePath = path.join(__dirname, "/views/mainFunc.html");
  let Routes = {};

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      res.status(500).send("Error reading file");
    } else {
      res.send(data);
    }
  });
});

//수정 2023.11.20 채수아
app.get("/main/POI/result", async (req, res) => {
  var resource = req.query;
  try {
    const html = await createDynamicHTML(resource);
    res.send(html);
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).send("Internal Server Error");
  }
});

// 2023.11.30 김건학
// 뽀송타임 화면
app.get("/main/POI/result/pposong", async (req, res) => {
  const filePath = path.join(__dirname, "/views/pposong.html");
  await getWeatherDataAndRenderPage(filePath, res);
});

// 2023.12.08 김건학
// pposong.html에서 보낸 도보 데이터 받기, db검색 후 파싱, pposong.html로 데이터 전송

// 2023.12.08 김건학
// pposong.html에서 보낸 도보 데이터 받기, db검색 후 파싱, pposong.html로 데이터 전송
// 한 time의 데이터만 받아오는 기존 방식을 4 time 데이터 모두 받게 수정

// 2023.12.09 김건학
// 강수량 소수점 둘째자리까지만 표현
app.post("/main/POI/result/pposong/cal", async (req, res) => {
  const receivedData = req.body;
  var resultData = [];
  try {
    for (const walkData of receivedData.WalkData) {
      const sectionData = [];
      var sum_RN1 = 0;
      for (const section of walkData) {
        const weatherData = await queryAsync(
          "SELECT * FROM FORECAST WHERE TIME = ? AND X = ? AND Y =  ?",
          [section.basetime, section.X, section.Y]
        );
        var section_RN1 = parseFloat(((weatherData[0].RN1 * section.sectiontime) / 60).toFixed(2));
        sum_RN1 += section_RN1;

        sectionData.push({
          DATE: weatherData[0].DATE,
          REH: weatherData[0].REH,
          RN1: weatherData[0].RN1,
          T1H: weatherData[0].T1H,
          TIME: weatherData[0].TIME,
          WSD: weatherData[0].WSD,
          X: weatherData[0].X,
          Y: weatherData[0].Y,
          section_RN1: section_RN1,
        });
      }
      var WalkWeatherData = {
        sum_RN1: sum_RN1,
        walkData: sectionData,
      };
      resultData.push(WalkWeatherData);
    }
  } catch (error) {
    console.error(error);
  }
  res.json({ response: resultData });
});

function queryAsync(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

const httpsServer = https.createServer(options, app);

httpsServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  // // schedule.scheduleJob("10 0,10,20,30,40,50 * * * *", async function () {
  // schedule.scheduleJob("30 * * * * *", async function () {
  //   const input_date = td.getTimeStamp(1);
  //   const input_time = td.getTimeStamp(2);
  //   const promises = [];
  //   const HH = input_time.toString().substring(0, 2);
  //   const MM = input_time.toString().substring(2);
  //   const time = input_time.toString().substring(0, 2) + "00";
  //   console.log("________________________________");
  //   console.log(`Forecast Updating Started[${HH}:${MM}]`);
  //   console.time(`Forecast Update[${HH}:${MM}] 소요시간`);
  //   for (let i = 0; i < 30; i++) {
  //     try {
  //       const input_x = locArr[i][0];
  //       const input_y = locArr[i][1];
  //       var Data = forecast.get_Ultra_Forecast_Data(input_date, input_time, input_x, input_y);
  //       promises.push(Data);
  //     } catch (error) {
  //       console.log("ERROR MERGED");
  //       console.error(error);
  //       i--;
  //     }
  //   }
  //   const ultra_forecast_datas = await Promise.all(promises);
  //   console.log(`Promise End([${HH}:${MM}]날씨 데이터)`);
  //   //console.log(ultra_forecast_datas);
  //   //40~44(분)인 경우, 현재 시간의 날씨 데이터를 사용해야 한다.
  //   if (40 <= input_time % 100 && input_time % 100 <= 44) {
  //     db.query(
  //       "DELETE FROM FORECAST WHERE TIME != ?",
  //       [time], // 현재 시각 제외 모두 삭제
  //       await function (error, results, fields) {
  //         if (error) throw error;
  //       }
  //     );
  //     for (let i = 0; i < 30; i++) {
  //       for (let j = 0; j < 5; j++) {
  //         try {
  //           db.query(
  //             "INSERT INTO foreCast (DATE, TIME, X, Y, RN1, T1H, REH, WSD, UPTIME) VALUES(?,?,?,?,?,?,?,?,?)",
  //             [
  //               ultra_forecast_datas[i][j].Date,
  //               ultra_forecast_datas[i][j].Time,
  //               ultra_forecast_datas[i][j].X,
  //               ultra_forecast_datas[i][j].Y,
  //               ultra_forecast_datas[i][j].RN1,
  //               ultra_forecast_datas[i][j].T1H,
  //               ultra_forecast_datas[i][j].REH,
  //               ultra_forecast_datas[i][j].WSD,
  //               input_time,
  //             ],
  //             await function (error, results, fields) {
  //               if (error) throw error;
  //             }
  //           );
  //         } catch (error) {
  //           console.error(error);
  //         }
  //       }
  //     }
  //   } else {
  //     // input_time이 다른 모든 데이터 다 삭제
  //     db.query(
  //       "DELETE FROM FORECAST WHERE UPTIME != ?",
  //       [input_time],
  //       await function (error, results, fields) {
  //         if (error) throw error;
  //       }
  //     );
  //     for (let i = 0; i < 30; i++) {
  //       for (let j = 0; j < 6; j++) {
  //         try {
  //           db.query(
  //             "INSERT INTO foreCast (DATE, TIME, X, Y, RN1, T1H, REH, WSD, UPTIME) VALUES(?,?,?,?,?,?,?,?,?)",
  //             [
  //               ultra_forecast_datas[i][j].Date,
  //               ultra_forecast_datas[i][j].Time,
  //               ultra_forecast_datas[i][j].X,
  //               ultra_forecast_datas[i][j].Y,
  //               ultra_forecast_datas[i][j].RN1,
  //               ultra_forecast_datas[i][j].T1H,
  //               ultra_forecast_datas[i][j].REH,
  //               ultra_forecast_datas[i][j].WSD,
  //               input_time,
  //             ],
  //             await function (error, results, fields) {
  //               if (error) throw error;
  //             }
  //           );
  //         } catch (error) {
  //           console.error(error);
  //         }
  //       }
  //     }
  //   }
  //   console.log("DONE!(DB foreCast update)");
  //   console.timeEnd(`Forecast Update[${HH}:${MM}] 소요시간`);
  // });
});
