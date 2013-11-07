/*global Raphael, define, _ */
/*!
 * Cross图的兼容性定义
 */
!(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('Cross', function (require) {
  var DataV = require('DataV');

  /**
   * Cross构造函数
   * Creates Cross in a DOM node with id "chart"
   * Options:
   *
   * - `width` 宽度，默认为522，单位像素
   * - `height` 高度，默认为522，单位像素
   * - `showLegend` 是否显示图例
   * - `legendWidth` 图例的宽度
   * - `margin` 图表的间距，依次为上右下左
   * - `formatValue` 值格式化函数
   *
   * Examples:
   * ```
   * var cross = new Cross("chart", {"width": 500, "height": 600, "typeNames": ["Y", "Z"]});
   * ```
   * @param {Mix} node The dom node or dom node Id
   * @param {Object} options options json object for determin column style.
   */
  var Cross = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Cross";

      /**
       * 横向
       */
      this.dimension.x = {
        type: "string",
        required: true,
        index: 0
      };
      /**
       * 纵向
       */
      this.dimension.y = {
        type: "string",
        required: true,
        index: 1
      };
      /**
       * 第三维度
       */
      this.dimension.z = {
        type: "string",
        required: true,
        index: 2
      };

      /**
       * 值维度
       */
      this.dimension.value = {
        type: "string",
        required: true,
        index: undefined
      };

      // canvas parameters
      this.defaults.width = 522;
      this.defaults.height = 522;

      this.defaults.margin = [50, 50, 50, 50];

      this.defaults.gridWidth = 40;
      this.defaults.gridHeight = 40;
      this.defaults.showSummary = false;
    }
  });

  /**
   * 创建画布
   */
  Cross.prototype.createCanvas = function () {
    var conf = this.defaults;
    this.node.style.position = "relative";
    this.canvas = new Raphael(this.node, conf.width, conf.height);
  };

  /**
   * 设置数据源
   * Examples：
   * ```
   * column.setSource(source);
   * ```
   * @param {Array} source 数据源 第一列为排布在x轴的数据，后n列为排布在y轴的数据
   */
  Cross.prototype.setSource = function (source, map) {
    var conf = this.defaults;
    map = this.map(map);
    // x的值范畴
    this.xValues = _.chain(source).map(function (item) {
      return item[map.x];
    }).uniq().sortBy(function (item) {
      return item;
    }).value();
    // y的值范畴
    this.yValues = _.chain(source).map(function (item) {
      return item[map.y];
    }).uniq().sortBy(function (item) {
      return item;
    }).value();
    // z的值范畴
    this.zValues = _.chain(source).map(function (item) {
      return item[map.z];
    }).uniq().sortBy(function (item) {
      return item;
    }).value();

    this.sum = DataV.sum(source, map.value);
    this.source = source;
    this.maxXRate = this.getXMaxRate();
    this.maxRate = this.getMaxRate();
  };

  Cross.prototype.getXMaxRate = function () {
    var that = this;
    var array = [];
    _.forEach(that.yValues, function (yValue, j) {
      _.forEach(that.zValues, function (zValue, k, list) {
        var filtered = _.filter(that.source, function (item) {
          return item[that.dimension.y.index] === yValue &&
            item[that.dimension.z.index] === zValue;
        });
        var count = DataV.sum(filtered, that.dimension.value.index);
        array.push(count);
      });
    });
    return Math.max.apply(Math, array) / this.sum;
  };

  Cross.prototype.getMaxRate = function () {
    var that = this;
    var array = [];
    _.forEach(that.xValues, function (xValue, i) {
      _.forEach(that.yValues, function (yValue, j) {
        _.forEach(that.zValues, function (zValue, k, list) {
          var filtered = _.filter(that.source, function (item) {
            var dimension = that.dimension;
            return item[dimension.x.index] === xValue &&
              item[dimension.y.index] === yValue && item[dimension.z.index] === zValue;
          });
          var count = DataV.sum(filtered, that.dimension.value.index);
          array.push(count);
        });
      });
    });
    return Math.max.apply(Math, array) / this.sum;
  };

  Cross.prototype.drawAxis = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    // 横向
    _.forEach(this.xValues, function (value, i) {
      paper.text((i + 1.5) * conf.gridWidth, 0.5 * conf.gridHeight, value);
    });
    var M = {x: 0, y: 0};
    var L = {x: (that.xValues.length + (conf.showSummary ? 2 : 1)) * conf.gridWidth, y: 0};
    paper.path('M' + M.x + ',' + M.y + 'L' + L.x + ',' + L.y).attr('stroke-width', 0.5);
    var M2 = {x: 0, y: (that.yValues.length + 1) * conf.gridHeight};
    var L2 = {
      x: (that.xValues.length + (conf.showSummary ? 2 : 1)) * conf.gridWidth,
      y: (that.yValues.length + 1) * conf.gridHeight
    };
    paper.path('M' + M2.x + ',' + M2.y + 'L' + L2.x + ',' + L2.y).attr('stroke-width', 0.5);
    var M3 = {
      x: 0,
      y: conf.gridHeight
    };
    var L3 = {
      x: (that.xValues.length + (conf.showSummary ? 2 : 1)) * conf.gridWidth,
      y: conf.gridHeight
    };
    paper.path('M' + M3.x + ',' + M3.y + 'L' + L3.x + ',' + L3.y).attr('stroke-width', 0.5);
    if (conf.showSummary) {
      var M4 = {
        x: 0,
        y: (that.yValues.length + 2) * conf.gridHeight
      };
      var L4 = {
        x: (that.xValues.length + 2) * conf.gridWidth,
        y: (that.yValues.length + 2) * conf.gridHeight
      };
      paper.path('M' + M4.x + ',' + M4.y + 'L' + L4.x + ',' + L4.y).attr('stroke-width', 0.5);
      paper.text((that.xValues.length + 1.5) * conf.gridWidth, 0.5 * conf.gridHeight, '汇总');
      paper.text(0.5 * conf.gridWidth, (that.yValues.length + 1.5) * conf.gridHeight, '汇总');
    }
    _.forEach(this.yValues, function (value, i) {
      paper.text(0.25 * conf.gridWidth, (i + 1.5) * conf.gridHeight, value);
      var M = {x: 0, y: (i + 1) * conf.gridHeight};
      var L = {x: conf.gridWidth, y: (i + 1) * conf.gridHeight};
      var M2 = {x: conf.gridWidth, y: (i + 1) * conf.gridHeight};
      var L2 = {x: conf.gridWidth, y: (i + 2) * conf.gridHeight};
      var M3 = {x: 0.5 * conf.gridWidth, y: (i + 1) * conf.gridHeight};
      var L3 = {x: 0.5 * conf.gridWidth, y: (i + 2) * conf.gridHeight};
      if (i !== 0) {
        // 纵向的分割线
        paper.path('M' + M.x + ',' + M.y + 'L' + L.x + ',' + L.y).attr('stroke-width', 0.5);
      }
      paper.path('M' + M2.x + ',' + M2.y + 'L' + L2.x + ',' + L2.y).attr('stroke-width', 0.5);
      paper.path('M' + M3.x + ',' + M3.y + 'L' + L3.x + ',' + L3.y).attr('stroke-width', 0.5);
      _.forEach(that.zValues, function (zValue, k, list) {
        var x = 0.75 * conf.gridWidth;
        var y = (k + 0.5) * conf.gridHeight / list.length + (i + 1) * conf.gridHeight;
        paper.text(x, y, zValue);
        var M = {x: 0.5 * conf.gridWidth, y: k * conf.gridHeight / list.length + (i + 1) * conf.gridHeight};
        var L = {x: conf.gridWidth, y: k * conf.gridHeight / list.length + (i + 1) * conf.gridHeight};
        if (k !== 0) {
          paper.path('M' + M.x + ',' + M.y + 'L' + L.x + ',' + L.y).attr('stroke-width', 0.5);
        }
      });
    });
  };

  Cross.prototype.drawSummary = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    _.forEach(that.xValues, function (xValue, i, values) {
      var filtered = _.filter(that.source, function (item) {
        return item[that.dimension.x.index] === xValue;
      });
      var count = DataV.sum(filtered, that.dimension.value.index);
      var rate = count / that.sum;
      var x = (i + 1.5) * conf.gridWidth;
      var y = (values.length + 2.5) * conf.gridHeight;
      paper.text(x, y, (rate * 100).toFixed(1) + '%');
    });
    _.forEach(that.yValues, function (yValue, j, values) {
      _.forEach(that.zValues, function (zValue, k, list) {
        var filtered = _.filter(that.source, function (item) {
          return item[that.dimension.y.index] === yValue &&
          item[that.dimension.z.index] === zValue;
        });
        var count = DataV.sum(filtered, that.dimension.value.index);
        var rate = count / that.sum;
        var x = (values.length + 0.5) * conf.gridWidth;
        var y = (k + 0.5) * conf.gridHeight / list.length + (j + 1) * conf.gridHeight;
        paper.text(x, y, (rate * 100).toFixed(1) + '%');
      });
    });
    var x = (that.xValues.length + 1.5) * conf.gridWidth;
    var y = (that.yValues.length + 1.5) * conf.gridHeight;
    paper.text(x, y, '100%');
  };

  /**
   * 绘制柱状图
   * Options:
   *
   *   - `width` 宽度，默认为节点宽度
   *   - `typeNames` 指定y轴上数据类目
   *
   * Examples:
   * ```
   * column.render({"width": 1024})
   * ```
   * @param {Object} options options json object for determin column style.
   */
  Cross.prototype.render = function (options) {
    this.setOptions(options);
    this.canvas.clear();
    this.drawAxis();
    this.draw();
  };

  /*!
   * 导出
   */
  return Cross;
});
/*global define, _ */
/*!
 * Cross Bar图的兼容性定义
 */
!(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('CrossBar', function (require) {
  var DataV = require('DataV');
  var Cross = require('Cross');

  /**
   * CrossBar构造函数
   * Creates CrossBar in a DOM node with id "chart"
   * Options:
   *
   * - `width` 宽度，默认为522，单位像素
   * - `height` 高度，默认为522，单位像素
   * - `showLegend` 是否显示图例
   * - `legendWidth` 图例的宽度
   * - `margin` 图表的间距，依次为上右下左
   * - `formatValue` 值格式化函数
   *
   * Examples:
   * ```
   * var crossTable = new CrossBar("chart", {"width": 500, "height": 600, "typeNames": ["Y", "Z"]});
   * ```
   * @param {Mix} node The dom node or dom node Id
   * @param {Object} options options json object for determin column style.
   */
  var CrossBar = DataV.extend(Cross, {
    initialize: function (node, options) {
      this.type = "CrossBar";
      this.node = this.checkContainer(node);
      this.setOptions(options);
      this.createCanvas();
    }
  });

  CrossBar.prototype.draw = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    var colors = conf.colors;
    var offsets = {};
    _.forEach(that.yValues, function (yValue, j) {
      offsets[j] = {};
      _.forEach(that.zValues, function (zValue, k, list) {
        offsets[j][k] = offsets[j][k] || 0;
        var group = _.filter(that.source, function (item) {
          return item[that.dimension.y.index] === yValue && item[that.dimension.z.index] === zValue;
        });
        var groupCount = DataV.sum(group, that.dimension.value.index);
        _.forEach(that.xValues, function (xValue, i) {
          var color = colors[i];
          var filtered = _.filter(group, function (item) {
            return item[that.dimension.x.index] === xValue;
          });
          var count = DataV.sum(filtered, that.dimension.value.index);
          var x = 1.25 * conf.gridWidth;
          var y = (k + 0.25) * conf.gridHeight / list.length + (j + 1) * conf.gridHeight;
          var rate = count / that.sum;
          var width = that.xValues.length * conf.gridWidth * (rate / (conf.stretched ? groupCount / that.sum : that.maxXRate));
          paper.rect(x + offsets[j][k], y, width, conf.gridHeight / list.length / 2)
          .attr({
            fill: color,
            'stroke-width': 0
          });
          offsets[j][k] += width;
        });
      });
    });
    if (conf.showSummary) {
      this.drawSummary();
    }
  };

  /*!
   * 导出
   */
  return CrossBar;
});
/*global define, _ */
/*!
 * Cross图的兼容性定义
 */
!(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('CrossBubble', function (require) {
  var DataV = require('DataV');
  var Cross = require('Cross');

  /**
   * CrossBubble构造函数
   * Creates CrossBubble in a DOM node with id "chart"
   * Options:
   *
   * - `width` 宽度，默认为522，单位像素
   * - `height` 高度，默认为522，单位像素
   * - `showLegend` 是否显示图例
   * - `legendWidth` 图例的宽度
   * - `margin` 图表的间距，依次为上右下左
   * - `formatValue` 值格式化函数
   *
   * Examples:
   * ```
   * var crossBubble = new CrossBubble("chart", {"width": 500, "height": 600, "typeNames": ["Y", "Z"]});
   * ```
   * @param {Mix} node The dom node or dom node Id
   * @param {Object} options options json object for determin column style.
   */
  var CrossBubble = DataV.extend(Cross, {
    initialize: function (node, options) {
      this.type = "CrossBubble";
      this.node = this.checkContainer(node);
      this.setOptions(options);
      this.createCanvas();
    }
  });

  CrossBubble.prototype.draw = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    _.forEach(that.xValues, function (xValue, i) {
      _.forEach(that.yValues, function (yValue, j) {
        _.forEach(that.zValues, function (zValue, k, list) {
          var filtered = _.filter(that.source, function (item) {
            return item[that.dimension.x.index] === xValue &&
              item[that.dimension.y.index] === yValue && item[that.dimension.z.index] === zValue;
          });
          var count = DataV.sum(filtered, that.dimension.value.index);
          var rate = count / that.sum;
          var x = (i + 1.5) * conf.gridWidth;
          var y = (k + 0.5) * conf.gridHeight / list.length + (j + 1) * conf.gridHeight;
          paper.circle(x, y, Math.sqrt(Math.round(rate * 10000)));
          paper.text(x, y, zValue);
        });
      });
    });
    if (conf.showSummary) {
      this.drawSummary();
    }
  };

  /*!
   * 导出
   */
  return CrossBubble;
});
/*global define, _ */
/*!
 * Cross图的兼容性定义
 */
!(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('CrossHeatmap', function (require) {
  var DataV = require('DataV');
  var Cross = require('Cross');

  /**
   * CrossHeatmap构造函数
   * Creates CrossHeatmap in a DOM node with id "chart"
   * Options:
   *
   * - `width` 宽度，默认为522，单位像素
   * - `height` 高度，默认为522，单位像素
   * - `showLegend` 是否显示图例
   * - `legendWidth` 图例的宽度
   * - `margin` 图表的间距，依次为上右下左
   * - `formatValue` 值格式化函数
   *
   * Examples:
   * ```
   * var crossTable = new CrossHeatmap("chart", {"width": 500, "height": 600, "typeNames": ["Y", "Z"]});
   * ```
   * @param {Mix} node The dom node or dom node Id
   * @param {Object} options options json object for determin column style.
   */
  var CrossHeatmap = DataV.extend(Cross, {
    initialize: function (node, options) {
      this.type = "CrossTable";
      this.node = this.checkContainer(node);
      this.setOptions(options);
      this.createCanvas();
    }
  });

  CrossHeatmap.prototype.draw = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    _.forEach(that.xValues, function (xValue, i) {
      _.forEach(that.yValues, function (yValue, j) {
        _.forEach(that.zValues, function (zValue, k, list) {
          var filtered = _.filter(that.source, function (item) {
            return item[that.dimension.x.index] === xValue &&
              item[that.dimension.y.index] === yValue && item[that.dimension.z.index] === zValue;
          });
          var count = DataV.sum(filtered, that.dimension.value.index);
          var rate = count / that.sum;
          var x = (i + 1) * conf.gridWidth;
          var y = (k) * conf.gridHeight / list.length + (j + 1) * conf.gridHeight;
          paper.rect(x, y, conf.gridWidth, conf.gridHeight / list.length)
          .attr({
            fill: '#0000ff',
            'stroke-width': 0.1,
            stroke: '#ffffff',
            opacity: rate / that.maxRate
          });
        });
      });
    });
    if (conf.showSummary) {
      this.drawSummary();
    }
  };

  /*!
   * 导出
   */
  return CrossHeatmap;
});
/*global define, _ */
/*!
 * Cross图的兼容性定义
 */
!(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('CrossPie', function (require) {
  var DataV = require('DataV');
  var Cross = require('Cross');

  /**
   * CrossPie构造函数
   * Creates CrossPie in a DOM node with id "chart"
   * Options:
   *
   * - `width` 宽度，默认为522，单位像素
   * - `height` 高度，默认为522，单位像素
   * - `showLegend` 是否显示图例
   * - `legendWidth` 图例的宽度
   * - `margin` 图表的间距，依次为上右下左
   * - `formatValue` 值格式化函数
   *
   * Examples:
   * ```
   * var crossPie = new CrossPie("chart", {"width": 500, "height": 600, "typeNames": ["Y", "Z"]});
   * ```
   * @param {Mix} node The dom node or dom node Id
   * @param {Object} options options json object for determin column style.
   */
  var CrossPie = DataV.extend(Cross, {
    initialize: function (node, options) {
      this.type = "CrossPie";
      this.node = this.checkContainer(node);
      this.setOptions(options);
      this.createCanvas();
    }
  });

  var sector = function (cx, cy, r, startAngle, endAngle) {
    var rad = Math.PI / 180;
    var x1 = cx + r * Math.cos(startAngle * rad),
      x2 = cx + r * Math.cos(endAngle * rad),
      y1 = cy + r * Math.sin(startAngle * rad),
      y2 = cy + r * Math.sin(endAngle * rad);
    // 通过一个中间点使得能实现全圆的绘制
    var x3 = cx + r * Math.cos((startAngle + endAngle) / 2 * rad);
    var y3 = cy + r * Math.sin((startAngle + endAngle) / 2 * rad);
    return ["M", cx, cy, "L", x1, y1, "A", r, r, 0, 0, 1, x3, y3, "A", r, r, 0, 0, 1, x2, y2, "z"];
  };

  CrossPie.prototype.draw = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    _.forEach(that.xValues, function (xValue, i) {
      _.forEach(that.yValues, function (yValue, j) {
        var filtered = _.filter(that.source, function (item) {
          return item[that.dimension.x.index] === xValue &&
            item[that.dimension.y.index] === yValue;
        });
        var groupCount = DataV.sum(filtered, that.dimension.value.index);
        var x = (i + 1.5) * conf.gridWidth;
        var y = (j + 1.5) * conf.gridHeight;
        var r = Math.sqrt(Math.round(groupCount / that.sum * 10000));
        // paper.circle(x, y, r);
        var offset = 0;
        _.forEach(that.zValues, function (zValue, k, list) {
          var filtered = _.filter(that.source, function (item) {
            return item[that.dimension.x.index] === xValue &&
              item[that.dimension.y.index] === yValue && item[that.dimension.z.index] === zValue;
          });
          var count = DataV.sum(filtered, that.dimension.value.index);
          var start = groupCount > 0 ? offset / groupCount * 360 : 0;
          var end = groupCount > 0 ? (offset + count) * 360 / groupCount : 0;
          paper.path(sector(x, y, r, start, end))
            .attr({
              fill: conf.colors[k],
              'stroke-width': 0
            });

          offset += count;
        });
      });
    });
    if (conf.showSummary) {
      this.drawSummary();
    }
  };

  /*!
   * 导出
   */
  return CrossPie;
});
/*global define, _ */
/*!
 * Cross图的兼容性定义
 */
!(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('CrossTable', function (require) {
  var DataV = require('DataV');
  var Cross = require('Cross');

  /**
   * CrossTable构造函数
   * Creates CrossTable in a DOM node with id "chart"
   * Options:
   *
   * - `width` 宽度，默认为522，单位像素
   * - `height` 高度，默认为522，单位像素
   * - `showLegend` 是否显示图例
   * - `legendWidth` 图例的宽度
   * - `margin` 图表的间距，依次为上右下左
   * - `formatValue` 值格式化函数
   *
   * Examples:
   * ```
   * var crossTable = new CrossTable("chart", {"width": 500, "height": 600, "typeNames": ["Y", "Z"]});
   * ```
   * @param {Mix} node The dom node or dom node Id
   * @param {Object} options options json object for determin column style.
   */
  var CrossTable = DataV.extend(Cross, {
    initialize: function (node, options) {
      this.type = "CrossTable";
      this.node = this.checkContainer(node);
      this.setOptions(options);
      this.createCanvas();
    }
  });

  CrossTable.prototype.draw = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    var xValues = this.xValues;
    var yValues = this.yValues;
    var zValues = this.zValues;
    _.forEach(xValues, function (xValue, i) {
      _.forEach(yValues, function (yValue, j) {
        _.forEach(zValues, function (zValue, k, list) {
          var filtered = _.filter(that.source, function (item) {
            return item[that.dimension.x.index] === xValue &&
              item[that.dimension.y.index] === yValue && item[that.dimension.z.index] === zValue;
          });
          var count = DataV.sum(filtered, that.dimension.value.index);
          var rate = count / that.sum;
          var x = (i + 1.5) * conf.gridWidth;
          var y = (k + 0.5) * conf.gridHeight / list.length + (j + 1) * conf.gridHeight;
          paper.text(x, y, (rate * 100).toFixed(1) + '%');
        });
      });
    });
    if (conf.showSummary) {
      this.drawSummary();
    }
  };

  /*!
   * 导出
   */
  return CrossTable;
});
