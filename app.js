(function () {
  var root = document.documentElement;
  var storageKey = "weatherapp-theme";
  var OPENWEATHER_API_KEY = "";
  var prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  var stored = null;

  try {
    stored = localStorage.getItem(storageKey);
  } catch (e) {
    stored = null;
  }

  if (stored === "dark" || (!stored && prefersDark)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  var toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var isDark = root.classList.toggle("dark");
      try {
        localStorage.setItem(storageKey, isDark ? "dark" : "light");
      } catch (e) {}
    });
  }

  var searchForm = document.getElementById("search-form");
  var cityInput = document.getElementById("city-input");
  var resultsEl = document.getElementById("results");
  var errorEl = document.getElementById("error");

  var weatherCard = document.getElementById("weather-card");
  var weatherCardSkeleton = document.getElementById("weather-card-skeleton");
  var weatherLocationEl = document.getElementById("weather-location");
  var weatherTempEl = document.getElementById("weather-temp");
  var weatherDescEl = document.getElementById("weather-desc");
  var weatherExtraEl = document.getElementById("weather-extra");
  var weatherErrorEl = document.getElementById("weather-error");

  function showWeatherSkeleton(isLoading) {
    if (!weatherCard || !weatherCardSkeleton) return;
    if (isLoading) {
      weatherCardSkeleton.classList.remove("hidden");
      weatherCard.classList.add("opacity-0", "pointer-events-none");
    } else {
      weatherCardSkeleton.classList.add("hidden");
      weatherCard.classList.remove("opacity-0", "pointer-events-none");
    }
  }

  function formatTempCelsius(value) {
    if (typeof value === "number" && isFinite(value)) {
      return value.toFixed(1) + "°C";
    }
    return "--°C";
  }

  function fetchCurrentWeather(lat, lon, label) {
    if (!window.axios || !OPENWEATHER_API_KEY) return;

    if (weatherErrorEl) {
      weatherErrorEl.classList.add("hidden");
    }

    showWeatherSkeleton(true);

    axios
      .get("https://api.openweathermap.org/data/2.5/weather", {
        params: {
          lat: lat,
          lon: lon,
          appid: OPENWEATHER_API_KEY,
          units: "metric",
          lang: "vi",
        },
      })
      .then(function (response) {
        var body = response.data || {};
        var main = body.main || {};
        var wind = body.wind || {};
        var weatherArr = Array.isArray(body.weather) ? body.weather : [];
        var primary = weatherArr[0] || {};

        var temp = main.temp;
        var feels = main.feels_like;
        var humidity = main.humidity;
        var windSpeed = wind.speed;
        var desc = primary.description || "Không rõ mô tả";

        // Viết hoa chữ cái đầu mô tả nếu có
        try {
          desc = desc.charAt(0).toUpperCase() + desc.slice(1);
        } catch (e) {}

        if (weatherLocationEl) {
          var finalLabel = label;
          if (!finalLabel && body.name) {
            finalLabel = body.name;
          }
          weatherLocationEl.textContent = finalLabel || "Vị trí đã chọn";
        }

        if (weatherTempEl) {
          weatherTempEl.textContent = formatTempCelsius(temp);
        }

        if (weatherDescEl) {
          var feelsPart =
            typeof feels === "number" && isFinite(feels)
              ? " (cảm giác: " + feels.toFixed(1) + "°C)"
              : "";
          weatherDescEl.textContent = desc + feelsPart;
        }

        if (weatherExtraEl) {
          var windText =
            typeof windSpeed === "number" && isFinite(windSpeed)
              ? windSpeed.toFixed(1) + " km/h"
              : "-- km/h";
          var humidityText =
            typeof humidity === "number" && isFinite(humidity)
              ? humidity + "%"
              : "--%";

          weatherExtraEl.innerHTML =
            '<span class="inline-flex items-center gap-1">' +
            '<span class="h-2 w-2 rounded-full bg-amber-300 shadow shadow-amber-300/70"></span>' +
            "Gió: " +
            windText +
            "</span>" +
            '<span class="inline-flex items-center gap-1">' +
            '<span class="h-2 w-2 rounded-full bg-sky-200 shadow shadow-sky-200/70"></span>' +
            "Độ ẩm: " +
            humidityText +
            "</span>";
        }
      })
      .catch(function (error) {
        console.error("Weather request failed", error);
        if (weatherErrorEl) {
          weatherErrorEl.textContent =
            "Không thể lấy dữ liệu thời tiết hiện tại. Vui lòng thử lại sau.";
          weatherErrorEl.classList.remove("hidden");
        }
      })
      .finally(function () {
        showWeatherSkeleton(false);
      });
  }

  if (searchForm && cityInput && resultsEl && errorEl && window.axios) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var query = cityInput.value.trim();
      if (!query) {
        errorEl.textContent = "Vui lòng nhập tên thành phố.";
        errorEl.classList.remove("hidden");
        return;
      }

      errorEl.classList.add("hidden");
      resultsEl.innerHTML =
        '<div class="space-y-2 animate-pulse">' +
        '<div class="h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800"></div>' +
        '<div class="h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800"></div>' +
        '<div class="h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800"></div>' +
        "</div>";

      axios
        .get("https://api.openweathermap.org/geo/1.0/direct", {
          params: {
            q: query,
            limit: 5,
            appid: OPENWEATHER_API_KEY,
          },
        })
        .then(function (response) {
          var data = Array.isArray(response.data) ? response.data : [];
          if (!data.length) {
            resultsEl.innerHTML =
              '<p class="text-[11px] text-slate-500 dark:text-slate-400">Không tìm thấy vị trí phù hợp cho truy vấn này.</p>';
            return;
          }

          var html =
            '<ul class="space-y-2">' +
            data
              .map(function (item, index) {
                var name = item.name || "(Không rõ)";
                var state = item.state || "";
                var country = item.country || "";
                var lat =
                  typeof item.lat === "number" ? item.lat.toFixed(4) : item.lat;
                var lon =
                  typeof item.lon === "number" ? item.lon.toFixed(4) : item.lon;

                var line1 =
                  name +
                  (state ? ", " + state : "") +
                  (country ? " (" + country + ")" : "");

                return (
                  '<li class="js-location-item group cursor-pointer rounded-xl bg-white/80 p-2 text-[11px] text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-emerald-300/70 dark:bg-slate-950/50 dark:text-slate-100 dark:ring-slate-700 dark:hover:ring-emerald-400/70">' +
                  '<div class="flex items-center justify-between gap-2">' +
                  '<span class="font-semibold">' +
                  (index + 1) +
                  ". " +
                  line1 +
                  "</span>" +
                  '<span class="hidden text-[10px] text-emerald-500 group-hover:inline-flex">Xem thời tiết</span>' +
                  "</div>" +
                  '<p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">' +
                  "Lat: " +
                  lat +
                  ", Lon: " +
                  lon +
                  "</p>" +
                  "</li>"
                );
              })
              .join("") +
            "</ul>";

          resultsEl.innerHTML = html;

          var items = resultsEl.querySelectorAll(".js-location-item");
          items.forEach(function (el, idx) {
            var itemData = data[idx];
            if (!itemData) return;
            el.addEventListener("click", function () {
              var latVal = itemData.lat;
              var lonVal = itemData.lon;
              var label =
                (itemData.name || "") +
                (itemData.state ? ", " + itemData.state : "") +
                (itemData.country ? " (" + itemData.country + ")" : "");

              if (
                typeof latVal !== "number" ||
                typeof lonVal !== "number" ||
                !isFinite(latVal) ||
                !isFinite(lonVal)
              ) {
                return;
              }

              fetchCurrentWeather(latVal, lonVal, label);
            });
          });
        })
        .catch(function (error) {
          console.error("Geocode request failed", error);
          errorEl.textContent =
            "Không thể gọi API geocoding OpenWeather. Vui lòng thử lại sau.";
          errorEl.classList.remove("hidden");
          resultsEl.innerHTML =
            '<p class="text-[11px] text-rose-500">Lỗi khi gọi trực tiếp API OpenWeather.</p>';
        });
    });
  }
})();
