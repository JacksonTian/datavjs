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
