'use strict';

var paging = 'ko-grid-paging';
var viewStateStorage = 'ko-grid-view-state-storage';

define(['module', 'knockout', 'ko-grid', 'text!ko-grid-height-adjuster/height-adjuster.html.template', viewStateStorage], function (module, ko, koGrid, heightAdjusterTemplate) {
    var extensionId = module.id.indexOf('/') < 0 ? module.id : module.id.substring(0, module.id.indexOf('/'));

    var document = window.document,
        requestAnimationFrame = window.requestAnimationFrame.bind(window),
        cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

    koGrid.defineExtension(extensionId, {
        dependencies: [viewStateStorage],
        initializer: template => template.after('grid').insert('height-adjuster', heightAdjusterTemplate),
        Constructor: function HeightAdjusterExtension(bindingValue, config, grid) {
            this.__initialHeight = grid.rootElement.classList.contains('fixed-height') ? grid.rootElement.style.height : 'auto';
            this.__clearedPageSize = undefined;
            this.__height = ko.observable(this.__initialHeight);

            var heightSubscription = this.__height.subscribe(newHeight => {
                var p = grid.extensions[paging];

                if (newHeight === 'auto') {
                    grid.rootElement.classList.remove('fixed-height');
                    if (p && p.pageSize.desired() === 'fit') {
                        this.__clearedPageSize = p.pageSize.desired();
                        p.pageSize.desired(Number.POSITIVE_INFINITY);
                    }
                } else if (this.__clearedPageSize) {
                    grid.rootElement.classList.add('fixed-height');
                    p.pageSize.desired(this.__clearedPageSize);
                    this.__clearedPageSize = undefined;
                }

                grid.rootElement.style.height = newHeight;
                grid.layout.recalculate();
            });

            grid.extensions[viewStateStorage].modeIndependent.bind('height', this.__height);

            this.dispose = function () {
                heightSubscription.dispose();
            };
        }
    });

    ko.bindingHandlers['__gridHeightAdjuster'] = {
        'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var grid = bindingContext['grid'];
            var heightAdjuster = valueAccessor();
            valueAccessor();

            element.addEventListener('click', e => e.preventDefault());
            element.addEventListener('mousedown', e => {
                if (e.target.tagName === 'BUTTON')
                    return;

                e.preventDefault();

                var initialHeight = grid.element.offsetHeight;
                var minimumHeight = grid.element.offsetHeight - grid.element.querySelector('.ko-grid-table-scroller').offsetHeight + 50;

                var initialMousePosition = e.pageY;
                var newMousePosition = initialMousePosition;
                var animationFrameRequest = 0;

                function adjustHeight() {
                    var newHeight = initialHeight + newMousePosition - initialMousePosition;
                    heightAdjuster.__height(Math.max(minimumHeight, newHeight) + 'px');
                }

                function onMouseMove(evt) {
                    newMousePosition = evt.pageY;
                    if (animationFrameRequest)
                        cancelAnimationFrame(animationFrameRequest);
                    animationFrameRequest = requestAnimationFrame(adjustHeight);
                    e.preventDefault();
                }

                function onMouseUp() {
                    if (animationFrameRequest)
                        cancelAnimationFrame(animationFrameRequest);
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        },
        'update': () => {}
    };

    ko.bindingHandlers['__gridHeightResetter'] = {
        'init': function (element, valueAccessor) {
            var heightAdjuster = valueAccessor();
            var noInitialHeight = heightAdjuster.__initialHeight === 'auto';

            if (noInitialHeight) return;

            element.addEventListener('click', e => {
                e.preventDefault();
                heightAdjuster.__height(heightAdjuster.__initialHeight);
            });
        },
        'update': function (element, valueAccessor) {
            var heightAdjuster = valueAccessor();
            var initialHeight = heightAdjuster.__initialHeight;
            var noInitialHeight = initialHeight === 'auto';

            // Es ist wichtig, dass der `__height()`-Aufruf hinter dem `||` passiert. Passiert er vorher
            // wird `update` bei jeder Änderung aufgerufen, selbst wenn keine initiale Höhe gesetzt ist.
            element.disabled = noInitialHeight || heightAdjuster.__height() === initialHeight;
        }
    };

    ko.bindingHandlers['__gridHeightClearer'] = {
        'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var heightAdjuster = valueAccessor();

            element.addEventListener('click', e => {
                e.preventDefault();
                heightAdjuster.__height('auto');
            });
        },
        'update': function (element, valueAccessor) {
            var heightAdjuster = valueAccessor();
            var height = heightAdjuster.__height();
            element.disabled = height === 'auto';
        }
    };

    return koGrid.declareExtensionAlias('heightAdjuster', extensionId);
});
