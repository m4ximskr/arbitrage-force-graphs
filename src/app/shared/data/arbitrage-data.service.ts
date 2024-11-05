import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {interval, map, Observable, of, switchMap, take, tap} from "rxjs";
import { ArbitrageGraphData, ArbitrageGraphLocationType} from "../components/arbitrage-graph/arbitrage-graph.model";
import { ArbitrageEvent } from "../services/arbitrage-events/arbitrage-events.model";
import { ArbitrageEventsService } from "../services/arbitrage-events/arbitrage-events.service";

@Injectable({
  providedIn: 'root',
})
export class ArbitrageDataService {
  private historicalArbitrageEvents: ArbitrageGraphData[];
  constructor(
    private http: HttpClient,
    private arbitrageEventsService: ArbitrageEventsService,
  ) {}

  listenForMockArbitrageDataEvents(intervalTime = 1000): Observable<ArbitrageGraphData> {
    return this.getArbitrageEvents('dex-cex-data.json').pipe(
      map(data => this.shuffleArray([...data])),
      switchMap((shuffledData: ArbitrageGraphData[]) => interval(intervalTime).pipe(
        take(shuffledData.length),
        map(index => {
          const data = shuffledData[index]

          return {
            ...data,
            from: {
              ...data.from,
              type: this.parseArbitrageLocationType(data.from.type)
            },
            to: {
              ...data.to,
              type: this.parseArbitrageLocationType(data.to.type)
            },
            createdAt: Date.now(),
          } as ArbitrageGraphData
        })
      ))
    );
  }

  getMockHistoricalArbitrageDataEvents(): Observable<ArbitrageGraphData[]> {
    if (!this.historicalArbitrageEvents) {
      return this.getArbitrageEvents('dex-cex-data.json').pipe(
        map(events => {
          return events.map(event => ({
            ...event,
            from: {
              ...event.from,
              type: this.parseArbitrageLocationType(event.from.type)
            },
            to: {
              ...event.to,
              type: this.parseArbitrageLocationType(event.to.type)
            },
            createdAt: this.getRandomTimestampWithin24Hours(),
            lifetime: this.getRandomLifetime()
          }))
        }),
        tap(events => this.historicalArbitrageEvents = events)
      )
    } else {
      return of(this.historicalArbitrageEvents)
    }
  }

  listenForArbitrageDataEventsFromAllTime(predefined: boolean, intervalTime = 200): Observable<ArbitrageGraphData> {
    const data$ = predefined ? of(this.getPredefinedEvents()) : this.getArbitrageEvents('all-time-data.json')
    return data$.pipe(
      map(data => this.shuffleArray([...data])),
      switchMap((shuffledData: ArbitrageEvent[]) => interval(intervalTime).pipe(
        take(shuffledData.length),
        map(index => {
          const data = shuffledData[index]
          return this.arbitrageEventsService.prepareAbitrageGraphData(data, true)
        })
      ))
    );
  }

  getArbitrageDataEventsFromAllTime(predefined: boolean): Observable<ArbitrageGraphData[]> {
    if (!this.historicalArbitrageEvents) {
      const data$ = predefined ? of(this.getPredefinedEvents()) : this.getArbitrageEvents('all-time-data.json')

      return data$.pipe(
        map(events => {
          return events.map(event => ({
            ...this.arbitrageEventsService.prepareAbitrageGraphData(event),
            ...(!predefined && {
              createdAt: this.getRandomTimestampWithin24Hours(),
            }),
            profit: Math.floor(500 + Math.random() * (2000 - 500))
          }))
        }),
        tap(events => this.historicalArbitrageEvents = events)
      )
    } else {
      return of(this.historicalArbitrageEvents)
    }
  }

  private getArbitrageEvents(url: string) {
    return this.http.get<ArbitrageGraphData[] | ArbitrageEvent[]>(url)
  }

  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private parseArbitrageLocationType(input: string): ArbitrageGraphLocationType {
    const parts = input.split('.');
    const value = parts[1] as keyof typeof ArbitrageGraphLocationType;
    return ArbitrageGraphLocationType[value];
  }

  private getRandomTimestampWithin24Hours(): number {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    return Math.floor((last24Hours + Math.random() * (now - last24Hours)));
  }

  private getRandomLifetime(): number {
    const minLifetime = 300; // 5 min
    const maxLifetime = 6000; // 10 min
    return Math.floor(minLifetime + Math.random() * (maxLifetime - minLifetime));
  }

  private getPredefinedEvents(): ArbitrageEvent[] {
    return [
      {
        direction: `CEX->CEX`,
        from: 'Coinbase',
        to: 'Coinbase',
        symbol: 'USDT',
        amountIn: 10,
        profit: 2000,
        ts: 1729272670000,
      },
      {
        direction: `CEX->CEX`,
        from: 'Coinbase',
        to: 'Coinbase',
        symbol: 'USDT',
        amountIn: 10,
        profit: 1000,
        ts: 1729272730000,
      },
      {
        direction: `CEX->CEX`,
        from: 'Coinbase',
        to: 'Kraken',
        symbol: 'TRX',
        amountIn: 10,
        profit: 1000,
        ts: 1729262010000,
      },
      {
        direction: `CEX->DEX`,
        from: 'Coinbase',
        to: 'Ethereum',
        symbol: 'TRX',
        amountIn: 10,
        profit: 1300,
        ts: 1729262110000
      },
      {
        direction: `DEX->CEX`,
        from: 'Solana',
        to: 'Kraken',
        symbol: 'TRX',
        amountIn: 10,
        profit: -1000,
        ts: 1729261975000
      },
      {
        direction: `DEX->CEX`,
        from: 'Solana',
        to: 'Kraken',
        symbol: 'TRX',
        amountIn: 10,
        profit: -10,
        ts: 1729262050000
      },
    ]
  }
}
