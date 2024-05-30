const handlebars = require('handlebars'),
groupBy = require('handlebars-group-by');

groupBy(handlebars);

handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

handlebars.registerHelper("incitement", function (inindex) {
    return inindex + 1;
});

handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

// Define el helper de Handlebars para la comparación condicional
handlebars.registerHelper('ifCond', function(v1, v2, options) {
    if(v1 === v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

handlebars.registerHelper('ifAny', function () {
    var args = Array.prototype.slice.call(arguments, 0, -1);
    var options = arguments[arguments.length - 1];
    var value = String(args.shift());
    if (args.map(String).indexOf(value) >= 0) {
        return options.fn(this);
    }
    return options.inverse(this);
});

handlebars.registerHelper('trimString', function(str) {
    if (typeof str === 'string' || str instanceof String) {
      return str.trim();
    } else {
      return str;
    }
  });

