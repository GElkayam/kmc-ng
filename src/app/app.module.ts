import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { Ng2Webstorage } from 'ng2-webstorage';

import { GetBootstrapProvider, AppBootstrap, AppBootstrapConfig  as AppBootstrapConfigType, KalturaCommonModule, AppStorage } from '@kaltura-ng2/kaltura-common';
import {  KalturaApiModule, KalturaHttpConfiguration, KalturaHttpPostClient,  KalturaServerClient } from '@kaltura-ng2/kaltura-api';
import { PopupWidgetModule } from '@kaltura-ng2/kaltura-ui/popup-widget';

import { BrowserService, KMCShellModule } from 'kmc-shell';

import { AppComponent } from './app.component';
import { routing } from './app.routes';

import { KalturaAPIConfigAdapter } from './services/kaltura-api-config-adapter.service';
import { KalturaAuthConfigAdapter } from './services/kaltura-auth-config-adapter.service';
import { KalturaLocalizationAdapter } from './services/kaltura-localization-adapter.service';
import { AppDefaultConfig } from "./services/app-default-config.service";

import { AppMenuService } from './services/app-menu.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AppMenuComponent } from './components/app-menu/app-menu.component';
import { LanguageMenuComponent } from './components/language-menu/language-menu.component';
import { LoginComponent } from './components/login/login.component';
import { ErrorComponent } from './components/error/error.component';
import { UserSettingsComponent } from './components/user-settings/user-settings.component';
import { KalturaHttpConfigurationAdapter } from "./services/kaltura-http-configuration-adapter.service";

import { ButtonModule, InputTextModule, TieredMenuModule } from 'primeng/primeng';

import { KMCContentUIModule } from 'kmc-content-ui/kmc-content-ui.module';

@NgModule({
  imports: <any>[
    routing,
    CommonModule,
    KMCShellModule.forRoot(),
    BrowserModule,
    TieredMenuModule,
    HttpModule,
    KMCContentUIModule.forRoot(),
    KalturaCommonModule.forRoot(),
    KalturaApiModule,
    Ng2Webstorage,
    ButtonModule,
    PopupWidgetModule,
    InputTextModule
  ],
  declarations: <any>[
      AppComponent,
    DashboardComponent,
    AppMenuComponent,
    LanguageMenuComponent,
    LoginComponent,
    ErrorComponent,
    UserSettingsComponent
  ],
  bootstrap: <any>[
      AppComponent
  ],
  exports: [ ],
  providers: <any>[
    AppMenuService,
    GetBootstrapProvider(KalturaAPIConfigAdapter),
    GetBootstrapProvider(KalturaLocalizationAdapter),
    GetBootstrapProvider(KalturaAuthConfigAdapter),
    GetBootstrapProvider(KalturaHttpConfigurationAdapter  ),
    AppDefaultConfig,
    { provide :KalturaServerClient, useClass : KalturaHttpPostClient},
      KalturaHttpConfiguration,
    { provide : AppStorage,  useExisting : BrowserService }
  ]
})
export class AppModule {
  constructor(appBootstrap: AppBootstrap, config: AppDefaultConfig){
    appBootstrap.initApp(<AppBootstrapConfigType>config);
  }
}
