import { $ } from 'backbone';
import axios from 'axios';
import YAML from 'js-yaml';
import Epoxy from 'backbone.epoxy';
import 'selectize';
import './selectize.css';
import FileSaver from 'file-saver';
import BaronScroll from 'utils/baronScroll';
import template from './GenerateComposeModal.jade';
import './GenerateComposeModal.scss';

export default Epoxy.View.extend({
  template,
  className: 'generate-modal',
  events: {
    'click .baron_scroller': 'onClickBackdrop',
    'click [data-js-cancel]': 'onCancel',
    'click [data-js-content]': 'onClickContent',
    'click [data-js-slider]': 'onClickSlider',
    'click [data-js-generate]': 'generateComposeFile',
  },
  initialize() {
    this.renderTemplate();
    $.ajax({
      type: 'GET',
      url: '//status.reportportal.io',
      success: (data) => {
        $('[data-js-version]', this.$el).html(`Latest (${data.latest_versions['reportportal/reportportal']})`);
      },
    });
    $(window).on('resize.generateModal', () => {
      this.resize();
    });
  },
  onShow() {
    this.$el.width();
    this.$el.addClass('show');
    this.resize();
    BaronScroll($('[data-js-content]', this.$el));
    const $select = $('#custom-select').selectize({
      openOnFocus: false,
      onInitialize() {
        const that = this;
        this.$control.on('click', () => {
          that.ignoreFocusOpen = true;
          setTimeout(() => {
            that.ignoreFocusOpen = false;
          }, 50);
        });
      },
      onFocus() {
        if (!this.ignoreFocusOpen) {
          this.open();
        }
      },
    });
    const selectizeEl = $select[0].selectize;
    selectizeEl.on('change', () => {
      if (selectizeEl !== 'local') {
        $('.db-settings', this.$el).toggleClass('hide');
      }
    });
  },
  generateComposeFile() {
    axios.get('https://raw.githubusercontent.com/reportportal/reportportal/master/docker-compose.yml')
      .then((response) => {
        let compose = YAML.load(response.data);
        let os;
        if (window.navigator.platform.indexOf('Win') > -1) {
          os = 'win';
        } else {
          os = 'mac';
        }
        compose = this.mongo(compose, os);
        compose = this.folderLocation(compose, os);
        compose = this.sessionLive(compose);
        compose = this.bts(compose);
        compose = this.gateway(compose);
        compose = this.analayzer(compose);
        const blob = new Blob([YAML.dump(compose)], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(blob, 'docker-compose.yml', true);
        this.hide();
      });
  },
  createMongoURI() {
    let dbhost = $('[data-js-db-host]', this.$el).val() || 'localhost';
    dbhost = dbhost.replace(/(http:\/\/)|(https:\/\/)/, '');
    const dbName = $('[data-js-db-name]', this.$el).val();
    const dbPort = $('[data-js-db-port]', this.$el).val() || 27017;
    const dbAuth = $('[data-js-db-auth-name]', this.$el).val() || 'reportportal';
    const dbPassword = $('[data-js-db-password]', this.$el).val();
    const dbUser = $('[data-js-db-user]', this.$el).val();
    let auth = '';
    if (dbPassword && dbUser) {
      auth = `${dbUser}:${dbPassword}@`;
    }
    return `mongodb://${auth}${dbhost}:${dbPort}/${dbName}?authSource=${dbAuth}`;
  },
  mongo(compose, os) {
    const tempCompose = Object.assign({}, compose);
    const isLocal = $('.db-settings', this.$el).hasClass('hide');
    if (isLocal) {
      if (os === 'win') {
        delete compose.services.mongodb.volumes;
      }
    } else {
      delete tempCompose.services.mongodb;
      delete tempCompose.services.uat.depends_on;
      delete tempCompose.services.api.depends_on;
      const mongoURI = `RP_MONGO_URI=${this.createMongoURI()}`;
      tempCompose.services.uat.environment.push(mongoURI);
      tempCompose.services.api.environment.push(mongoURI);
      tempCompose.services.jira.environment.push(mongoURI);
      tempCompose.services.rally.environment.push(mongoURI);
    }
    return tempCompose;
  },
  folderLocation(compose) {
    const tempCompose = Object.assign({}, compose);
    const mongodb = tempCompose.services.mongodb;
    const loc = $('[data-js-folder-location]', this.$el).val() || './';
    if (mongodb && mongodb.volumes) {
      tempCompose.services.mongodb.volumes[0] = mongodb.volumes[0].replace('.', loc);
    }
    tempCompose.services.registry.volumes[0] = tempCompose.services.registry.volumes[0].replace('.', loc);
    tempCompose.services.elasticsearch.volumes[0] = tempCompose.services.elasticsearch.volumes[0].replace('.', loc);
    return tempCompose;
  },
  sessionLive(compose) {
    const tempCompose = Object.assign({}, compose);
    const time = $('[data-js-session]', this.$el).val() || 86400;
    tempCompose.services.uat.environment[1] = `RP_SESSION_LIVE=${time}`;
    return tempCompose;
  },
  bts(compose) {
    const tempCompose = Object.assign({}, compose);
    const rally = $('[data-js-rally]', this.$el).is(':checked');
    const jira = $('[data-js-jira]', this.$el).is(':checked');
    if (!rally) {
      delete tempCompose.services.rally;
    }
    if (!jira) {
      delete tempCompose.services.jira;
    }
    return tempCompose;
  },
  gateway(compose) {
    const tempCompose = Object.assign({}, compose);
    const isFabio = $('[data-js-fabio]', this.$el).is(':checked');
    const traefic = {
      image: 'traefik:1.6.3',
      ports: [
        '8080:8080',
        '8081:8081',
      ],
      command: [
        '--consulcatalog.endpoint=registry:8500',
        '--defaultEntryPoints=http',
        '--entryPoints=Name:http Address::8080',
        '--logLevel=DEBUG',
        '--web',
        '--web.address=:8081',
      ],
      restart: 'always',
    };
    const fabio = {
      image: 'fabiolb/fabio:1.5.8-go1.10',
      ports: ['9998:9998', '8080:9999'],
      environment: [
        'FABIO_REGISTRY_CONSUL_ADDR=registry:8500',
        'FABIO_REGISTRY_CONSUL_REGISTER_NAME=gateway',
        'FABIO_PROXY_ADDR=:9999;rt=300s;wt=300s',
      ],
      restart: 'always',
    };
    if (!isFabio) {
      tempCompose.services.gateway = traefic;
    } else {
      tempCompose.services.gateway = fabio;
    }
    return tempCompose;
  },
  analayzer(compose) {
    const tempCompose = Object.assign({}, compose);
    const analyzer = $('[data-js-is-auto-analize]', this.$el).is(':checked');
    if (!analyzer) {
      delete tempCompose.services.analyzer;
      delete tempCompose.services.elasticsearch;
    }
    return tempCompose;
  },
  onClickSlider(e) {
    const el = $('#analayzer');
    if (el.is(':checked')) {
      el.removeAttr('checked');
      $(e.target).text('OFF');
    } else {
      el.attr('checked', true);
      $(e.target).text('ON');
    }
  },
  resize() {
    if ($(document).width() <= 991) {
      this.destroy();
    }
  },
  hide() {
    this.$el.removeClass('show');
    setTimeout(() => {
      this.destroy();
    }, 320);
  },
  onClickContent(e) {
    e.stopPropagation();
  },
  onClickBackdrop() {
    this.hide();
  },
  onCancel() {
    this.hide();
  },
  onDestroy() {
    $(window).off('resize.generateModal');
  },
});
