/**
* Flickslider renderer.
* @project UI flicksliders.
* @author Anton Parkhomenko
* @version 1.0
*/
goog.provide('DD.ui.flickSliders.renderer.Gallery');

goog.require('DD.ui.flickSliders.renderer');
goog.require('DD.ui.renderer.Component');
goog.require('goog.dom.classes');
goog.require('goog.style.transform');

/**
 * Стандартный рендерер для компонента DD.ui.flickSliders.Gallery
 * @constructor
 * @extends DD.ui.renderer.Component
 */
DD.ui.flickSliders.renderer.Gallery = function()
{
    DD.ui.renderer.Component.call(this);
};
goog.inherits(DD.ui.flickSliders.renderer.Gallery, DD.ui.renderer.Component);
goog.addSingletonGetter(DD.ui.flickSliders.renderer.Gallery);

/**
 * @inheritdoc
 */
DD.ui.flickSliders.renderer.Gallery.CSS_CLASS = 'DD--gallery';

goog.scope(function()
{

    /** @alias DD.ui.flickSliders.renderer.Gallery.prototype */
    var prototype = DD.ui.flickSliders.renderer.Gallery.prototype;
    var superClass_ = DD.ui.flickSliders.renderer.Gallery.superClass_;

    /** @inheritdoc */
    prototype.getCssClass = function()
    {
        return DD.ui.flickSliders.renderer.Gallery.CSS_CLASS;
    };

    /** @inheritdoc */
    prototype.createDom = function(component)
    {
        var element = superClass_.createDom.call(this, component);
        var cache = component.$cache();

        cache.canvas = goog.dom.createDom(goog.dom.TagName.DIV, {class: this.getCssClass() + '--canvas'})
        cache.wrapper = goog.dom.createDom(goog.dom.TagName.DIV, {class: this.getCssClass() + '--viewport'}, [cache.canvas]);

        goog.dom.classes.add(element, this.getCssClass());
        element.appendChild(cache.wrapper);

        component.setContentElement(cache.canvas);
        component.$cache(cache);

        return element;
    };

    /** @inheritdoc */
    prototype.clearDomLinks = function (component){};

    /** @inheritdoc */
    prototype.initializeDom = function(component)
    {
        superClass_.initializeDom.call(this, component);

        var params = component.getParams();
        var cache = component.$cache();
        var actionTarget = params.actionTarget || cache.root.parentNode;

        goog.events.listen(window, goog.events.EventType.RESIZE, this.resizeEvent_, false, component);

        // Инициализация стороннего компонента Hammer
        cache.mc = new Hammer.Manager(actionTarget, {enable: true, touchAction: 'pan-y', domEvents: true});
        cache.mc.add(new Hammer.Pan({threshold: component.threshold}));
        cache.mc.on("panleft panright", this.handlePan_.bind(this, component));
        cache.mc.on("panend", this.handlePanEnd_.bind(this, component));

        cache.actionTarget   = actionTarget;
        cache.startPoint     = null;
        cache.deltaX         = 0;
        cache.x              = 0;
        cache.index          = params.initialSlideIndex;
        cache.slidePositions = [];

        this.resize(component);
        component.$cache(cache);
    };

    /** @inheritdoc */
    prototype.uninitializeDom = function(component)
    {
        superClass_.uninitializeDom.call(this, component);
        var cache = component.$cache();
        cache.isUpdated = false;
        cache.mc.destroy();
        goog.events.unlisten(window, goog.events.EventType.RESIZE, this.resizeEvent_, false, component);
    };

    /**
     * Метод, вызывающийся событие RESIZE у окна браузера
     * @param  {goog.Events} event
     * @private
     */
    prototype.resizeEvent_ = function(event)
    {
        var component = this;
        component.getRenderer().resize(component)
    };

    /**
     * Метод, срабатывающий один раз при начали манипцляции с компонентом
     * @param  {DD.ui.flickSliders.Gallery} component DD.ui.flickSliders.Gallery
     * @private
     */
    prototype.firstUpdate_ = function(component)
    {
        var cache = component.$cache();
        var params = component.getParams();
        // Размер полотна
        cache.canvasWidth = goog.style.getBounds(cache.canvas).width;
        // Ширина полотна с учетом отступов у слайда
        // Это свойство будет работа в случае одинаковых ширин у всех слайдов
        cache.canvasSummary = cache.canvasWidth + cache.marginBox.right + cache.marginBox.left;
        // Процентовый порог переключения на следующий слайд
        cache.changeIndexRange = params.changeIndexRange / 100;
        cache.isUpdated = true;
        component.$cache(cache);
    };

    /**
     * Обновдение параметров компонента при изменении размера окна браузера
     * @param  {DD.ui.flickSliders.Gallery} component DD.ui.flickSliders.Gallery
     */
    prototype.resize = function(component)
    {
        var cache = component.$cache();
        var params = component.getParams();
        var renderer = this;
        cache.length = component.getChildCount() - 1;
        // Размер полотна
        cache.canvasWidth = goog.style.getBounds(cache.canvas).width;
        clearTimeout(cache.resizeTimer)
        cache.resizeTimer = setTimeout(function()
        {
            cache.slidePositions = [];
            for (var i = 0; i <= cache.length; i++)
            {
                var slideElement = component.getByIndex(i).getElement();
                cache.marginBox = goog.style.getMarginBox(slideElement);
                var left = i * (cache.canvasWidth + cache.marginBox.right);
                goog.style.setStyle(slideElement,
                {
                    'position' : 'absolute',
                    'left'     : left + 'px'
                });                
                cache.slidePositions.push(-left);
            };
            // Ширина полотна с учетом отступов у слайда
            // Это свойство будет работа в случае одинаковых ширин у всех слайдов
            cache.canvasSummary = cache.canvasWidth + cache.marginBox.right + cache.marginBox.left;
            // Текущее положение полотна
            cache.x = cache.slidePositions[cache.index];
            renderer.move_(cache.canvas, cache.x, 0);
        }, 50);
        component.$cache(cache);
    };

    /** @inheritdoc */
    prototype.append = function(component, slide)
    {
        var cache = component.$cache();
        var params = component.getParams();
        var index = component.getIndexOf(slide);
        var slideElement = slide.getElement();
        cache.marginBox = goog.style.getMarginBox(slideElement);
        cache.canvasWidth = goog.style.getBounds(cache.canvas).width;
        var left = index * (cache.canvasWidth + cache.marginBox.right);
        goog.style.setStyle(slideElement,
        {
            'position' : 'absolute',
            'left'     : left + 'px'
        });
        cache.slidePositions.push(-left);
        component.$cache(cache);
    };

    /**
     * Определяет слайд выбранным по индексу
     * @param  {DD.ui.flickSliders.FlickSlider} component DD.ui.flickSliders.Fader
     * @param  {Number}                         index     Индекс слайда
     */
    prototype.select = function(component, index, animate)
    {
        var cache = component.$cache();
        cache.lastIndex = cache.index;
        cache.length = component.getCount() - 1;
        cache.index = index;
        this.moveByIndex_(component, index, animate);
        component.$cache(cache);
    };

    prototype.panActionEvent_ = function(component, event)
    {
        if (component.isDisabled())
            return;
    };

    /**
     * Запускается в случае, если было вызвано событие pan от Hammer
     * @param  {DD.ui.Component} component DD.ui.flickSliders.Gallery
     * @param  {goog.events.EventType} event
     * @private
     */
    prototype.handlePan_ = function(component, event)
    {
        if (component.isDisabled())
            return;
        var cache = component.$cache();
        cache.length = component.getCount()-1;
        var params = component.getParams();

        dynamics.stop(cache.canvas);

        // Первый физический слайд в гелерее
        cache.firstSlide = component.getByIndex(0).getElement();
        // Последний физический слайд в гелерее
        cache.lastSlide = component.getByIndex(cache.length).getElement();

        if (!cache.isUpdated)
            this.firstUpdate_(component);

        // Стартовая точка касания/нажатия
        !cache.startPoint && (cache.startPoint = event.pointers[0].clientX);

        // Пройденное расстояние указателя по оси Х
        var deltaX = event.pointers[0].clientX - cache.startPoint;
        x = deltaX + cache.x;
        
        // Вычисление процента смещения относительно текущего слайда
        var percent = x / cache.canvasSummary;
        var index = Math.abs(parseInt(percent));

        // Дробное значение пройденного пути относительного процента смещения всего полотна слайдера
        var path = Math.abs(percent) - index;

        if (percent > 0)
        {
            cache.lastSlide.style.left = -cache.canvasSummary + 'px';
        }
        else if (percent < 0)
        {
            cache.lastSlide.style.left = -cache.slidePositions[cache.length] + 'px';
            if (percent < -cache.length)
            {
                cache.firstSlide.style.left = ((cache.length + 1) * cache.canvasSummary) + 'px';
            }
        }

        if (event.direction == 4)
        {
            if (percent > 0)
            {
                if (path > cache.changeIndexRange)
                {
                    cache.firstSlide.style.left = ((cache.length + 1) * cache.canvasSummary) + 'px';
                    cache.lastSlide.style.left = -cache.slidePositions[cache.length] + 'px';
                    var CW = cache.canvasWidth/2;
                    var deltaW = CW - (cache.canvasWidth * cache.changeIndexRange);
                    x = cache.slidePositions[cache.length] - (cache.canvasWidth * (1 - path));
                    cache.x = x;
                    cache.startPoint = null;
                }
            }
        }
        else if (event.direction == 2)
        {
            if (percent < -cache.length)
            {
                if (path > cache.changeIndexRange)
                {
                    cache.firstSlide.style.left = 0;
                    cache.lastSlide.style.left = cache.slidePositions[1] + 'px';
                    var CW = cache.canvasWidth/2;
                    var deltaW = CW - (cache.canvasWidth * cache.changeIndexRange);
                    x = CW + deltaW;
                    cache.x = x;
                    cache.startPoint = null;
                }
            };
        };

        if (index == cache.length - 1)
            cache.firstSlide.style.left = 0;

        this.move_(cache.canvas, x, 0);

        // Определение текущего индекса галереи на момент движения
        if (event.direction == 2) // Перемещение влево
        {
            if (path > cache.changeIndexRange)
            {
                component.getByIndex(cache.index).setSelected(false);
                if (percent < -cache.length || percent > cache.changeIndexRange)
                    cache.index = 0    
                else
                    cache.index = index + 1;
                component.getByIndex(cache.index).setSelected(true);
                if (cache.lastIndex != cache.index)
                {
                    cache.lastIndex = cache.index;
                    component.dispatchEvent({type: DD.ui.flickSliders.EventType.SELECTED, index: cache.index});
                };
            };
        }
        else if (event.direction == 4) // Перемещение вправо
        {
            if (path < 1 - cache.changeIndexRange)
            {
                component.getByIndex(cache.index).setSelected(false);
                cache.index = index;
                component.getByIndex(cache.index).setSelected(true);
                if (cache.lastIndex != cache.index)
                {
                    cache.lastIndex = cache.index;
                    component.dispatchEvent({type: DD.ui.flickSliders.EventType.SELECTED, index: cache.index});
                };
            };
        };
        component.$cache(cache);
        component.dispatchEvent({type: DD.ui.flickSliders.EventType.DRAGMOVE});
    };
    
    /**
     * Выбор слайда по индексу с учетом анимации
     * @param  {DD.ui.Component}    component   DD.ui.flickSliders.Gallery
     * @param  {Number}             index       Индекс слайда, к которому необходимо переместить полотно галереи
     * @param  {Boolean}            animate     Флаг, отвечает за анимационную смену слайда
     * @private
     */
    prototype.moveByIndex_ = function(component, index, animate)
    {
        var cache = component.$cache();
        var x = cache.slidePositions[index]
        cache.x = x;
        if (animate)
        {
            dynamics.animate(cache.canvas,
            {
                translateX: x
            },
            {
                type: dynamics.bezier,
                points: [{"x":0,"y":0,"cp":[{"x":0.1,"y":0}]},{"x":1,"y":1,"cp":[{"x":0.087,"y":0.944}]}],
                duration: 500,
                complete: function()
                {
                    component.dispatchEvent({type: DD.ui.flickSliders.EventType.SETTLE, index: cache.index});
                    component.dispatchEvent({type: DD.ui.flickSliders.EventType.SELECTED, index: cache.index});
                }
            });
        }
        else
        {
            goog.style.transform.setTranslation(cache.canvas, x, 0);
            component.dispatchEvent({type: DD.ui.flickSliders.EventType.SETTLE, index: cache.index});
            component.dispatchEvent({type: DD.ui.flickSliders.EventType.SELECTED, index: cache.index});
        };

        component.$cache(cache);
    };

    prototype.handlePanEnd_ = function(component, event)
    {
        var cache = component.$cache();
        cache.startPoint = null;
        this.moveByIndex_(component, cache.index, true);
        component.$cache(cache);
        component.dispatchEvent({type: DD.ui.flickSliders.EventType.DRAGEND});
    };

    /**
     * Смена слайда по элементу слайда
     * @param  {DD.ui.Component}    component   DD.ui.flickSliders.Gallery
     * @param  {Number}             x           Координата по оси-X
     * @param  {Numver}             y           Координата по оси-Y, обычно она всегда равна 0
     * @private
     */
    prototype.move_ = function(element, x, y)
    {
        goog.style.transform.setTranslation(element, x, y);
    };

}); // goog.scope
