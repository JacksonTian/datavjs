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
    var xValues = this.xValues;
    var yValues = this.yValues;
    var zValues = this.zValues;
    _.forEach(xValues, function (xValue, i) {
      _.forEach(yValues, function (yValue, j) {
        paper.rect((i + 1) * conf.gridWidth, (j + 1) * conf.gridHeight, conf.gridWidth, conf.gridHeight)
        .attr('stroke-width', 0.1);
        _.forEach(zValues, function (zValue, k, list) {
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
