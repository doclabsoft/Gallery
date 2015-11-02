/**
 * @overview Flickslider class.
 * @project UI flicksliders.
 * @author Anton Parkhomenko
 * @version 1.0
 */
goog.provide('DD.ui.flickSliders.Gallery');

goog.require('DD.ui.flickSliders.FlickSlider');
goog.require('DD.ui.flickSliders.renderer.Gallery');
goog.require('goog.ui.registry');

/**
 * @constructor
 * @param {Object=} [params] Список входящих параметров
 * @this DD.ui.flickSliders.Gallery
 * @extends DD.ui.flickSliders.FlickSlider
 * @author Антон Пархоменко
 */
DD.ui.flickSliders.Gallery = function(params)
{
    DD.ui.flickSliders.FlickSlider.call(this, params);
    var defaults =
    {
        changeIndexRange    : 30,
        freeScroll          : false
    };
    params = params || {};
    this.params_ = this.assignParams(params, defaults);
};
goog.inherits(DD.ui.flickSliders.Gallery, DD.ui.flickSliders.FlickSlider);
goog.ui.registry.setDefaultRenderer(DD.ui.flickSliders.Gallery, DD.ui.flickSliders.renderer.Gallery);

goog.scope(function()
{
    /** @alias DD.ui.flickSliders.Gallery.prototype */
    var prototype = DD.ui.flickSliders.Gallery.prototype;
    var superClass_ = DD.ui.flickSliders.Gallery.superClass_;

    /** @inheritdoc */
    prototype.append = function(options)
    {
        var slide = superClass_.append.call(this, null, options);
        this.isInDocument() && this.renderer_.append(this, slide);
        return slide;
    };

    prototype.select = function(index, animate)
    {
        if (index > this.getCount() - 1)
            return;

        superClass_.select.call(this, index);
        this.renderer_.select(this, index, animate);
    };

    prototype.resize = function()
    {
        this.renderer_.resize(this);
    };

}); // goog.scoope