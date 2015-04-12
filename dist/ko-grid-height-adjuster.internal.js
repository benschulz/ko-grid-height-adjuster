/*
 * Copyright (c) 2015, Ben Schulz
 * License: BSD 3-clause (http://opensource.org/licenses/BSD-3-Clause)
 */
define(['onefold-dom', 'indexed-list', 'stringifyable', 'onefold-lists', 'onefold-js', 'ko-grid-paging', 'ko-grid-view-state-storage', 'ko-data-source', 'ko-indexed-repeat', 'ko-grid-view-modes', 'knockout', 'ko-grid'],    function(onefold_dom, indexed_list, stringifyable, onefold_lists, onefold_js, ko_grid_paging, ko_grid_view_state_storage, ko_data_source, ko_indexed_repeat, ko_grid_view_modes, knockout, ko_grid) {
var text, text_ko_grid_height_adjuster_height_adjusterhtmltemplate, ko_grid_height_adjuster_height_adjuster, ko_grid_height_adjuster;
text = {
  load: function (id) {
    throw new Error('Dynamic load not allowed: ' + id);
  }
};
text_ko_grid_height_adjuster_height_adjusterhtmltemplate = '<div class="ko-grid-height-adjuster" data-bind="__gridHeightAdjuster: grid.extensions.heightAdjuster">\n    <div class="ko-grid-height-adjuster-buttons">\n        <button class="ko-grid-height-adjuster-button ko-grid-height-resetter" tabIndex="-1" data-bind="__gridHeightResetter: grid.extensions.heightAdjuster">Clear height</button>\n        <button class="ko-grid-height-adjuster-button ko-grid-height-clearer" tabIndex="-1" data-bind="__gridHeightClearer: grid.extensions.heightAdjuster">Reset height</button>\n    </div>\n</div>';

var paging = 'ko-grid-paging';
var viewStateStorage = 'ko-grid-view-state-storage';
ko_grid_height_adjuster_height_adjuster = function (module, ko, koGrid, heightAdjusterTemplate) {
  var extensionId = 'ko-grid-height-adjuster'.indexOf('/') < 0 ? 'ko-grid-height-adjuster' : 'ko-grid-height-adjuster'.substring(0, 'ko-grid-height-adjuster'.indexOf('/'));
  var document = window.document, requestAnimationFrame = window.requestAnimationFrame.bind(window), cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  koGrid.defineExtension(extensionId, {
    dependencies: [viewStateStorage],
    initializer: function (template) {
      return template.after('grid').insert('height-adjuster', heightAdjusterTemplate);
    },
    Constructor: function HeightAdjusterExtension(bindingValue, config, grid) {
      this.__initialHeight = grid.rootElement.classList.contains('fixed-height') ? grid.rootElement.style.height : 'auto';
      this.__clearedPageSize = undefined;
      this.__height = ko.observable(this.__initialHeight);
      var heightSubscription = this.__height.subscribe(function (newHeight) {
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
      }.bind(this));
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
      element.addEventListener('click', function (e) {
        return e.preventDefault();
      });
      element.addEventListener('mousedown', function (e) {
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
    'update': function () {
    }
  };
  ko.bindingHandlers['__gridHeightResetter'] = {
    'init': function (element, valueAccessor) {
      var heightAdjuster = valueAccessor();
      var noInitialHeight = heightAdjuster.__initialHeight === 'auto';
      if (noInitialHeight)
        return;
      element.addEventListener('click', function (e) {
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
      element.addEventListener('click', function (e) {
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
}({}, knockout, ko_grid, text_ko_grid_height_adjuster_height_adjusterhtmltemplate);
ko_grid_height_adjuster = function (main) {
  return main;
}(ko_grid_height_adjuster_height_adjuster);return ko_grid_height_adjuster;
});