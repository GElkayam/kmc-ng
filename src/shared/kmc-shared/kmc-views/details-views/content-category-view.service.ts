import { Injectable } from '@angular/core';
import { KMCPermissions, KMCPermissionsService } from '../../kmc-permissions';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import { ActivatedRoute, Router } from '@angular/router';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { KmcDetailsViewBaseService } from 'app-shared/kmc-shared/kmc-views/kmc-details-view-base.service';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { KalturaCategory } from 'kaltura-ngx-client/api/types/KalturaCategory';
import { modulesConfig } from 'config/modules';
import { KalturaClient } from 'kaltura-ngx-client';
import { CategoryGetAction } from 'kaltura-ngx-client/api/types/CategoryGetAction';
import { KalturaResponseProfileType } from 'kaltura-ngx-client/api/types/KalturaResponseProfileType';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client/api/types/KalturaDetachedResponseProfile';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

export enum ContentCategoryViewSections {
    Metadata = 'Metadata',
    Entitlements = 'Entitlements',
    SubCategories = 'SubCategories'
}

export interface ContentCategoryViewArgs {
    category: KalturaCategory;
    section?: ContentCategoryViewSections;
    activatedRoute?: ActivatedRoute;
    ignoreWarningTag?: boolean;
}


@Injectable()
export class ContentCategoryViewService extends KmcDetailsViewBaseService<ContentCategoryViewArgs> {

    constructor(private _appPermissions: KMCPermissionsService,
                private _appLocalization: AppLocalization,
                private _kalturaClient: KalturaClient,
                private _router: Router,
                _browserService: BrowserService,
                _logger: KalturaLogger) {
        super(_logger.subLogger('ContentCategoryViewService'), _browserService);
    }

    isAvailable(args: ContentCategoryViewArgs): boolean {
        const section = args.section ? args.section : this._getSectionFromActivatedRoute(args.activatedRoute);
        this._logger.info(`handle isAvailable action by user`, { categoryId: args.category.id, section });
        return this._isSectionEnabled(section, args.category);
    }

    private _getSectionFromActivatedRoute(activatedRoute: ActivatedRoute): ContentCategoryViewSections {
        const sectionToken = activatedRoute.snapshot.firstChild.url[0].path;
        let result = null;
        switch (sectionToken) {
            case 'subcategories':
                result = ContentCategoryViewSections.SubCategories;
                break;
            case 'entitlements':
                result = ContentCategoryViewSections.Entitlements;
                break;
            case 'metadata':
                result = ContentCategoryViewSections.Metadata;
                break;
            default:
                break;
        }

        this._logger.debug(`sectionToken mapped to section`, { section: result, sectionToken });

        return result;
    }

    private _getSectionRouteToken(section?: ContentCategoryViewSections): string {
        let result;

        switch (section) {
            case ContentCategoryViewSections.SubCategories:
                result = 'subcategories';
                break;
            case ContentCategoryViewSections.Entitlements:
                result = 'entitlements';
                break;
            case ContentCategoryViewSections.Metadata:
            default:
                result = 'metadata';
                break;
        }

        this._logger.debug(`section mapped to token`, { section, token: result });

        return result;
    }

    private _isSectionEnabled(section: ContentCategoryViewSections, category: KalturaCategory): boolean {
        this._logger.debug(`check section availability for category`, { categoryId: category.id, section });
        let result = false;
        switch (section) {
            case ContentCategoryViewSections.Metadata:
                result = true;
                break;
            case ContentCategoryViewSections.Entitlements:
                const hasPrivacyContexts = category.privacyContexts && typeof(category.privacyContexts) !== 'undefined';
                const hasFeatureEntitlementPermission = this._appPermissions.hasPermission(KMCPermissions.FEATURE_ENTITLEMENT);
                result = hasPrivacyContexts && hasFeatureEntitlementPermission;
                break;
            case ContentCategoryViewSections.SubCategories:
                result = category.directSubCategoriesCount > 0 &&
                    category.directSubCategoriesCount <= modulesConfig.contentShared.categories.subCategoriesLimit;
                break;
            default:
                break;
        }

        this._logger.debug(`availability result`, { result });

        return result;
    }

    protected _open(args: ContentCategoryViewArgs): Observable<boolean> {
        this._logger.info('handle open category view request by the user', { categoryId: args.category.id });
        const navigate = (): Observable<boolean> => {
            const sectionToken = this._getSectionRouteToken(args.section);
            return Observable.fromPromise(this._router.navigateByUrl(`/content/categories/category/${args.category.id}/${sectionToken}`));
    };
        // show category edit warning if needed
        if (!args.ignoreWarningTag && args.category.tags && args.category.tags.indexOf('__EditWarning') > -1) {
            this._logger.info(`category has '__EditWarning' tag, show confirmation`);
            return Observable.create(observer => {
                this._browserService.confirm(
                    {
                        header: this._appLocalization.get('applications.content.categories.editCategory'),
                        message: this._appLocalization.get('applications.content.categories.editWithEditWarningTags'),
                        accept: () => {
                            this._logger.info(`user confirmed, proceed navigation`);
                            navigate().subscribe(observer);
                        },
                        reject: () => {
                            this._logger.info(`user didn't confirm, abort navigation`);
                            observer.next(false);
                            observer.complete();
                        }
                    }
                );
            });
        } else {
            return navigate();
        }
    }

    public openById(categoryId: number): Observable<boolean> {
        this._logger.info('handle open category view by id request by the user, load category data', { categoryId });
        const categoryGetAction = new CategoryGetAction({ id: categoryId })
            .setRequestOptions({
                responseProfile: new KalturaDetachedResponseProfile({
                    type: KalturaResponseProfileType.includeFields,
                    fields: 'id,tags,privacyContexts,directSubCategoriesCount'
                })
            });
        return this._kalturaClient
            .request(categoryGetAction)
            .switchMap(category => {
                this._logger.info(`handle successful request, proceed navigation`);
                return this._open({ category });
            })
            .catch(err => {
                this._logger.info(`handle failed request, show alert, abort navigation`);
                this._browserService.alert({
                    header: this._appLocalization.get('app.common.error'),
                    message: err.message
                });
                return Observable.of(false);
            });
    }
}