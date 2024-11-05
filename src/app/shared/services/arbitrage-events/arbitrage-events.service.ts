import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import {BehaviorSubject, Observable, map, merge, switchMap, tap, throwError} from 'rxjs'
import { ArbitrageEvent, ArbitrageEventSource } from './arbitrage-events.model';
import { ArbitrageGraphData, ArbitrageGraphLocation, ArbitrageGraphLocationType } from '../../components/arbitrage-graph/arbitrage-graph.model';


@Injectable({
  providedIn: 'root'
})
export class ArbitrageEventsService {

  private socket: Socket;
  private _apiKey: string;

  set apiKey(key: string) {
    this._apiKey = key;
  }

  private _allTimeData$ = new BehaviorSubject<ArbitrageGraphData[]>([])
  readonly allTimeData$ = this._allTimeData$.asObservable();

  constructor(
    private http: HttpClient,
  ) {
    const config: SocketIoConfig = { 
      url: '/', 
      options: {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 1,
        transports: ['websocket'],
        autoConnect: false,
        auth: {
            apiKey: '',
        }
      } 
    }
    this.socket = new Socket(config);
  }

  connectToRealTimeEvents(): Observable<ArbitrageGraphData> {
    this.socket.ioSocket.auth.apiKey = this._apiKey

    this.socket.connect();

    return merge(
      this.socket.fromEvent<ArbitrageEvent | []>('message').pipe(map((event) => this.prepareAbitrageGraphData(event, true))),
      this.socket.fromEvent('connect_error').pipe(switchMap((error: Error) => throwError(() => error?.message || 'Failed to connect'))),
      this.socket.fromEvent('error').pipe(switchMap((error: Error) => throwError(() => error?.message || 'Failed to fetch data'))),
    )
  }

  disconnectFromRealTimeEvents() {
    this.socket.disconnect();
  }

  triggerMockRealTimeEvents() {
    this.socket.emit('message', 'DEBUG_MODE');
  }

  getAllTimeData(): Observable<ArbitrageGraphData[]> {
    return this.http.get<[[]]>('api/arbs', {
      params: {
        apiKey: this._apiKey,
      }
    }).pipe(
      map((events) => events.map(event => this.prepareAbitrageGraphData(event))),
      tap((data) => this._allTimeData$.next(data)),
    )
  }

  prepareAbitrageGraphData(event: ArbitrageEvent | [], updateCreatedAt = false): ArbitrageGraphData {
    let direction, from, to, symbol, amountIn, profit, ts;

    if (Array.isArray(event)) {
      [direction, from, to, symbol, amountIn, profit, ts] = event as unknown as [string, string, string, string, number, number, number]
    } else {
      ({direction, from, to, symbol, amountIn, profit, ts} = event as ArbitrageEvent);
    }
 
    const [sourceFrom, sourceTo] = direction.split('->')

    const locationFrom: ArbitrageGraphLocation = {
      name: from,
      type: sourceFrom === ArbitrageEventSource.DEX 
        ? ArbitrageGraphLocationType.CHAIN 
        : ArbitrageGraphLocationType.EXCHANGE
    }

    const locationTo: ArbitrageGraphLocation = {
      name: to,
      type: sourceTo === ArbitrageEventSource.DEX 
        ? ArbitrageGraphLocationType.CHAIN 
        : ArbitrageGraphLocationType.EXCHANGE
    }

    return {
      direction,
      symbol,
      amountIn,
      profit,
      createdAt: updateCreatedAt ? Date.now() : ts,
      from: locationFrom,
      to: locationTo,
    }
  }
}
