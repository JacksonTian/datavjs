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
  return CrossTable;
});
