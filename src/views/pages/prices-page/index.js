import { $ } from 'backbone';
import Epoxy from 'backbone.epoxy';
import Footer from 'components/footer';
import ReactComponent from './react-component.jsx';
import template from './prices-page.jade';

export default Epoxy.View.extend({
  template,
  className: 'prices-page',
  initialize() {
    this.renderTemplate();
    this.view = new ReactComponent({ model: null, el: $('[data-js-sections-container]', this.$el) });
    $('[data-js-sections-container]', this.$el).append(this.view.render());
    this.footer = new Footer();
    $('[data-js-footer-container]', this.$el).html(this.footer.$el);
  },
  onDestroy() {
    this.view.destroy();
    this.footer.destroy();
  },
});
