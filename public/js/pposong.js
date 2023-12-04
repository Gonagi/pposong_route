// 2023.12.02 김건학
// pposong.html의 대중교통 루트 그리는 함수 pposong.js로 분리

export function get_RouteLine(Route) {
  for (var idx = 0; idx < Route.SubPaths.length; idx++) {
    var subpath = Route.SubPaths[idx];
    var linePath = [];
    var Walk_Data = [];
    var Color;

    // 도보 구간
    if (subpath.Type == "WALK") {
      var a = 1;
      subpath.StartX;
    } else {
      var stationinfo = subpath.StationInfo;
      for (var station_idx = 0; station_idx < stationinfo.length; station_idx++) {
        // line 저장
        linePath.push(
          new kakao.maps.LatLng(stationinfo[station_idx].Lat, stationinfo[station_idx].Lon)
        );
      }
      // 버스 구간
      if (subpath.Type == "BUS") {
        Color = subpath.LaneInfo[0].BusColor;
      }
      // 지하철 구간
      else if (subpath.Type == "SUBWAY") {
        Color = subpath.SubwayColor;
      }

      // 지도에 표시할 선을 생성합니다
      var polyline = new kakao.maps.Polyline({
        path: linePath, // 선을 구성하는 좌표배열 입니다
        strokeWeight: 10, // 선의 두께 입니다
        strokeColor: `${Color}`, // 선의 색깔입니다
        strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
        strokeStyle: "solid", // 선의 스타일입니다
      });
      // 지도에 선을 표시합니다
      polyline.setMap(map);
    }
  }
}

// export function cal_Weather(Route) {
//   var result = [];
//   var total_RN1 = 0;
//   for (var idx = 0; idx < Route.SubPaths.length; idx++) {
//     var subpath = Route.SubPaths[idx];
//     var sub_RN1 = 0;
//     if (subpath.Type == "WALK") {
//       var sub_Lat = (subpath.StartLat + subpath.EndLat) / 2;
//       var sub_Lon = (subpath.StartLon + subpath.EndLon) / 2;
//       var sub = dfs_xy_conv("toXY", sub_Lat, sub_Lon);
//       try {
//         var sub_weather = db.query("SELECT * FROM foreCast WHERE X = ? AND Y = ?", [sub.x, sub.y]);
//         var RN1 = sub_weather.RN1;
//       } catch (error) {
//         console.error(error);
//       }
//     }
//   }
// }

window.get_RouteLine = get_RouteLine; // 전역 스코프에 get_RouteLine 함수 추가
// window.cal_Weather = cal_Weather; // 전역 스코프에 cal_Weather 함수 추가
