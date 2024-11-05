import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { CSP_NONCE } from '@angular/core';

const nonce = (
  document.querySelector('meta[name="CSP_NONCE"]') as HTMLMetaElement
)?.content;

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
  providers: [
    {
      provide: CSP_NONCE,
      useValue: nonce,
    },
  ]
})
  .catch(err => console.error(err));
