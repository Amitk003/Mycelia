export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  cloudCover: number;
  condition: string;
}

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

const CACHE_KEY = "mycelia_weather_cache";
const CACHE_TTL = 600000;

const FALLBACK_WEATHER: WeatherData = {
  temperature: 20,
  humidity: 0.6,
  precipitation: 0,
  cloudCover: 0.3,
  condition: "unknown",
};

export class EnvironmentalAPI {
  private current: WeatherData = { ...FALLBACK_WEATHER };
  private cache: CachedWeather | null = null;
  private refreshing = false;

  constructor() {
    this.loadCache();
  }

  async init(): Promise<void> {
    this.current = await this.fetchWeather();
  }

  private loadCache(): void {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed: CachedWeather = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          this.cache = parsed;
          this.current = parsed.data;
        }
      }
    } catch {
      // cache corrupted, ignore
    }
  }

  private saveCache(data: WeatherData): void {
    const entry: CachedWeather = { data, timestamp: Date.now() };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
      // storage full, ignore
    }
    this.cache = entry;
  }

  private async fetchWeather(): Promise<WeatherData> {
    if (this.refreshing) return this.current;
    this.refreshing = true;

    try {
      const lat = "51.5";
      const lon = "-0.12";
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,weather_code`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const cur = json.current;

      const data: WeatherData = {
        temperature: cur.temperature_2m ?? 20,
        humidity: (cur.relative_humidity_2m ?? 50) / 100,
        precipitation: cur.precipitation ?? 0,
        cloudCover: (cur.cloud_cover ?? 30) / 100,
        condition: this.codeToCondition(cur.weather_code ?? 0),
      };

      this.saveCache(data);
      return data;
    } catch {
      if (this.cache) return this.cache.data;
      return { ...FALLBACK_WEATHER };
    } finally {
      this.refreshing = false;
    }
  }

  private codeToCondition(code: number): string {
    if (code === 0) return "clear";
    if (code <= 3) return "cloudy";
    if (code <= 48) return "foggy";
    if (code <= 57) return "drizzle";
    if (code <= 67) return "rain";
    if (code <= 77) return "snow";
    if (code <= 82) return "showers";
    if (code <= 86) return "snow showers";
    return "thunderstorm";
  }

  applySelectivePressure(fitness: number): number {
    let pressure = 0;

    if (this.current.temperature > 35) {
      pressure -= 0.02;
    } else if (this.current.temperature < 0) {
      pressure -= 0.02;
    }

    if (this.current.humidity < 0.2) {
      pressure -= 0.015;
    }

    if (this.current.precipitation > 5) {
      pressure -= 0.01;
    }

    if (this.current.cloudCover > 0.8) {
      pressure += 0.005;
    }

    return Math.max(0, Math.min(1, fitness + pressure));
  }

  getWeather(): WeatherData {
    return { ...this.current };
  }

  async refresh(): Promise<void> {
    this.current = await this.fetchWeather();
  }
}
