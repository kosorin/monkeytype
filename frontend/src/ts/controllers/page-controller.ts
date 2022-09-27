import * as Misc from "../utils/misc";
import * as ActivePage from "../states/active-page";
import * as Settings from "../pages/settings";
import * as Account from "../pages/account";
import * as PageTest from "../pages/test";
import * as PageAbout from "../pages/about";
import * as PageLogin from "../pages/login";
import * as PageLoading from "../pages/loading";
import * as PageTribe from "../pages/tribe";
import * as PageProfile from "../pages/profile";
import * as PageProfileSearch from "../pages/profile-search";
import * as Page404 from "../pages/404";
import * as PageTransition from "../states/page-transition";
import type Page from "../pages/page";
import * as AdController from "../controllers/ad-controller";
import * as Focus from "../test/focus";

interface ChangeOptions {
  force?: boolean;
  params?: { [key: string]: string };
  data?: any;
  tribeOverride?: boolean;
}

export async function change(
  page: Page,
  options = {} as ChangeOptions
): Promise<boolean> {
  const defaultOptions = {
    force: false,
    tribeOverride: false,
  };

  options = { ...defaultOptions, ...options };

  return new Promise((resolve) => {
    if (PageTransition.get()) {
      console.log(`change page ${page.name} stopped`);
      return resolve(false);
    }
    console.log(`change page ${page.name}`);

    if (!options.force && ActivePage.get() === page.name) {
      console.log(`page ${page.name} already active`);
      return resolve(false);
    }

    const pages: Record<string, Page> = {
      loading: PageLoading.page,
      test: PageTest.page,
      settings: Settings.page,
      about: PageAbout.page,
      account: Account.page,
      login: PageLogin.page,
      tribe: PageTribe.page,
      profile: PageProfile.page,
      profileSearch: PageProfileSearch.page,
      404: Page404.page,
    };

    const previousPage = pages[ActivePage.get()];
    const nextPage = page;

    previousPage?.beforeHide({
      tribeOverride: options.tribeOverride ?? false,
    });
    PageTransition.set(true);
    $(".page").removeClass("active");
    Misc.swapElements(
      previousPage.element,
      nextPage.element,
      250,
      async () => {
        PageTransition.set(false);
        nextPage.element.addClass("active");
        resolve(true);
        nextPage?.afterShow();
        AdController.reinstate();
      },
      async () => {
        Focus.set(false);
        ActivePage.set(nextPage.name);
        previousPage?.afterHide();
        await nextPage?.beforeShow({
          params: options.params,
          data: options.data,
          tribeOverride: options.tribeOverride ?? false,
        });
      }
    );
  });
}
