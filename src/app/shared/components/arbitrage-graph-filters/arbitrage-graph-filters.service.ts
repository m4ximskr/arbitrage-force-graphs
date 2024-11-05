import { Injectable } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { Observable, distinctUntilChanged, map } from "rxjs";
import { defaultLifetimeSeconds } from "../../constants";

@Injectable({
  providedIn: 'root'
})
export class ArbitrageGraphFiltersService {

  constructor(
    private activatedRoute: ActivatedRoute
  ) { }

  listenForLifetimeFilterChanges(): Observable<number> {
    return this.activatedRoute.queryParams.pipe(
      distinctUntilChanged((prev: Params, curr: Params) => {
        const prevLifetime = prev['lifetime']
        const currLifetime = curr['lifetime']
  
        return prevLifetime === currLifetime
      }),
      map((params: Params) => {
        const seconds = parseInt(params['lifetime'], 10) || defaultLifetimeSeconds
        return seconds * 1000
      })
    )
  }
}