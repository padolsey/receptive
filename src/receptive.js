(function() {

  var R = window.receptive = {
    ReceptiveDOM: ReceptiveDOM,
    fromTemplate: function(template, data, bindings, options) {
      return new ReceptiveDOM(template, data, bindings, options);
    }
  };

  R.$ = window.jQuery;

  R.LOGIC_TOKEN = '_%Logic%_';
  R.HTML_TOKEN = '_%Html%_';

  R.MARKER_REGEX = /(_%Marker\d+%_)/;
  R.MARKER_REGEX_G = /(_%Marker\d+%_)/g;

  R.generateMarker = (function() {
    var n = 0;
    return function() {
      return '_%Marker' + n++ + '%_';
    };
  }());

  R.LOGIC_TOKEN_REGEX = RegExp(R.LOGIC_TOKEN, 'g');
  R.HTML_TOKEN_REGEX = RegExp(R.HTML_TOKEN, 'g');

  R.TEMPLATE_GENERATOR = typeof _ != 'undefined' && _.template ? _.template : null;

  function ReceptiveDOM(template, data, bindings, options) {

    var options = options || {};
    this.templateLogicOpen = options.logicOpen || '<%';
    this.templateLogicClose = options.logicClose || '%>';
    this.templateLogicRegex = RegExp(
      this.templateLogicOpen + '[\\s\\S]+?' + this.templateLogicClose, 'g'
    );

    this.elements = {};
    this.templates = {};
    this.dom = null;
    this.data = data || {};
    this.bindings = bindings || {};
    this.defaultBinding = typeof bindings == 'string' ? bindings : '*';
    this.template = template;
    this.templateFnGenerator = R.TEMPLATE_GENERATOR;

    if (!this.templateFnGenerator) {
      throw Error('Template generator is not defined.');
    }

    this.templateFn = this.templateFnGenerator(template);
    if (data) {
      this.render(data);
    }
  }

  ReceptiveDOM.prototype = {

    /**
     * Creates a template function for the specific selector that's passed.
     * 
     */
    _makeSubTemplate: function(selector, data) {

      var self = this;

      var logicPieces = [];
      var htmlPieces = [];

      // 1) Remove all template logic
      // 2) Mark the start and end of all HTML tags (opening and closing)
      // 3) Add template logic back
      var markedTemplate = this.template.replace(this.templateLogicRegex, function($0) {
        logicPieces.push($0);
        return R.LOGIC_TOKEN;
      }).replace(/>/g, function($0) {
        return '>' + R.generateMarker();
      }).replace(/</g, function() {
        return R.generateMarker() + '<';
      }).replace(R.LOGIC_TOKEN_REGEX, function() {
        return logicPieces.shift();
      });

      var markedDOM = R.$(
        '<div>' + this.templateFnGenerator(markedTemplate)(data) + '</div>'
      );
      var targetedElements = markedDOM.find(selector);

      // For each element we want to identify its place in the template string 
      // and then replace that corresponding space in the template string with a
      // token. This'll enable us to add the HtmlPiece back later, after removing
      // redundant HTML:
      targetedElements.each(function() {

        var prevMark = this.previousSibling.data.match(R.MARKER_REGEX_G).pop();
        var nextMark = this.nextSibling.data.match(R.MARKER_REGEX)[0];

        var prevMarkIndex = markedTemplate.indexOf(prevMark);
        var nextMarkIndex = markedTemplate.indexOf(nextMark);

        if (prevMarkIndex < 0 || nextMarkIndex < 0) {
          // Tag no longer exists in markedTemplate which probably means
          // it's been replaced by a parent tag token
          return;
        }

        var string = markedTemplate.substring(
          prevMarkIndex + prevMark.length,
          nextMarkIndex
        ).replace(R.MARKER_REGEX_G, '');

        markedTemplate =
          markedTemplate.substring(0, prevMarkIndex) + 
          R.HTML_TOKEN +
          markedTemplate.substring(nextMarkIndex + nextMark.length);

        htmlPieces.push(string);

      });

      // We need to remove all redundant HTML.
      // To do this we save all logic pieces as tokens, then produce an ordered array
      // of those tokens and the htmlpiece tokens. This arrays forms the resultting
      // targetted subTemplate.
      markedTemplate = markedTemplate.replace(this.templateLogicRegex, function($0) {
        logicPieces.push($0);
        return R.LOGIC_TOKEN;
      }).match(
        RegExp(R.LOGIC_TOKEN + '|' + R.HTML_TOKEN, 'g')
      ).join('').replace(R.HTML_TOKEN_REGEX, function() {
        return htmlPieces.shift();
      }).replace(R.LOGIC_TOKEN_REGEX, function() {
        return logicPieces.shift();
      });

      this.templates[selector] = this.templateFnGenerator(markedTemplate);

    },

    render: function(data) {
      if (!this.$el) {
        this.$el = $('<div>');
      }
      this.data = data;
      this.$el.html(this.templateFn(data));
      return this;
    },

    set: function(field, value) {
      if (toString.call(field) === '[object Object]') {
        for (var f in field) {
          this.set(f, field[f]);
        }
        return;
      }
      var binding = this.bindings[field] || field.replace(/^(.+)$/, this.defaultBinding);
      this.data[field] = value;
      this.update(binding);
      return this;
    },

    get: function(field) {
      return this.data[field];
    },

    update: function(selector) {

      var data = this.data;

      if (!this.$el) {
        throw Error('There is nothing to update. Please call render() before update()');
      }

      if (!(selector in this.elements)) {
        this.elements[selector] = this.$el.find(selector);
        this._makeSubTemplate(selector, data);
      }

      var elements = this.elements[selector];
      var subTemplate = this.templates[selector];
      var newElements = R.$('<div>' + subTemplate(data) + '</div>').find(selector);

      for (var i = 0, l = elements.length; i < l; ++i) {
        R.$(elements[i])
          // Cloning the node ensures that we don't get problems with nested
          // elements. They would be lost if their parent is already replaced.
          // By cloning we ensure that the element is not stolen from its previous
          // location (in the case of nested elements: the newParent.)
          .replaceWith( elements[i] = newElements[i].cloneNode(true) );
      }

      return this;
    }
  }
}());
