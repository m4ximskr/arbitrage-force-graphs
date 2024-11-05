import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'real-time',
    loadChildren: () =>
      import('./pages/real-time-arbitrage/real-time-arbitrage.module').then(m => m.RealTimeArbitrageModule)
  },
  {
    path: 'all-time',
    loadChildren: () =>
      import('./pages/all-time-arbitrage/all-time-arbitrage.module').then(m => m.AllTimeArbitrageModule)
  },
  {
    path: '**',
    redirectTo: 'real-time',
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
