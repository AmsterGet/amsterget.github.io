import React from 'react';
import ReactDOM from 'react-dom';
import Epoxy from 'backbone.epoxy';

export default (Component) => Epoxy.View.extend({
  render() {
    ReactDOM.render(
      <React.StrictMode>
        <Component/>
      </React.StrictMode>, this.el,
    );
    return this;
  },
  remove() {
    ReactDOM.unmountComponentAtNode(this.el);
    Epoxy.View.prototype.remove.call(this);
  },
});
