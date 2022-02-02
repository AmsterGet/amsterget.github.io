import Epoxy from 'backbone.epoxy';
import { $ } from 'backbone';
import template from './Context.jade';
import './Context.scss';

import IndexPage from 'pages/index-page';
import CommunityPage from 'pages/community-page';
import DocumentationPage from 'pages/documentation-page';
import InstallationPage from 'pages/installation-page';
import FeaturesPage from 'pages/features-page';
import ReleasesPage from 'pages/releases-page';
import PricesPage from 'pages/prices-page';

export default Epoxy.View.extend({
  template,
  className: 'main-context',
  initialize(options) {
    this.mainScrollEl = options.mainScrollEl;
    this.renderTemplate();
    this.currentPage = null;
    this.header = options.header;
  },
  onShow() {

  },
  renderIndex() {
    this.header.activatePage('');
    this.renderPage(IndexPage);
  },
  renderPrices() {
    this.header.activatePage('prices');
    this.renderPage(PricesPage);
  },
  renderCommunity() {
    this.header.activatePage('community');
    this.renderPage(CommunityPage);
  },
  renderInstallation() {
    this.header.activatePage('installation');
    this.renderPage(InstallationPage);
  },
  renderInstallationAndScroll() {
    this.header.activatePage('installation');
    this.renderPage(InstallationPage, true);
  },
  renderFeatures() {
    this.header.activatePage('features');
    this.renderPage(FeaturesPage);
  },
  renderDocumentation(id) {
    this.header.activatePage('docs');
    this.renderPageWithSections(id, 'documentation-page', DocumentationPage);
  },
  renderReleases(id) {
    this.header.activatePage('releases');
    this.renderPageWithSections(id, 'releases-page', ReleasesPage);
  },
  renderPageWithSections(id, pageClass, pageView) {
    if (this.currentPage && this.currentPage.$el.hasClass(pageClass)) {
      this.currentPage.changeAnchor(id);
      return;
    }
    this.currentPage && this.currentPage.destroy();
    this.currentPage = new pageView({ id, mainScrollEl: this.mainScrollEl });
    $('[data-js-content-container]', this.$el).html(this.currentPage.$el);
    this.currentPage.onShow && this.currentPage.onShow();
  },
  renderPage(pageView, isScroll) {
    this.currentPage && this.currentPage.destroy();
    this.mainScrollEl.scrollTop(0);
    if (isScroll) {
      this.currentPage = new pageView({ mainScrollEl: this.mainScrollEl, isScroll });
    } else {
      this.currentPage = new pageView({ mainScrollEl: this.mainScrollEl });
    }
    $('[data-js-content-container]', this.$el).html(this.currentPage.$el);
    this.currentPage.onShow && this.currentPage.onShow();
  },
  onDestroy() {
    this.header && this.header.destroy();
    this.currentPage && this.currentPage.destroy();
  },
});
