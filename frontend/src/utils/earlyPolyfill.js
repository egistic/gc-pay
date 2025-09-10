// Early polyfill script to run before React components load
(function() {
  'use strict';
  
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // CSSScopeRule polyfill
  if (!('CSSScopeRule' in window)) {
    function CSSScopeRule(start, end) {
      this.start = start;
      this.end = end;
    }
    
    CSSScopeRule.create = function(start, end) {
      return new CSSScopeRule(start, end);
    };
    
    window.CSSScopeRule = CSSScopeRule;
  }
  
  // Prevent CSS-related errors
  if (!window.CSS) {
    window.CSS = {
      supports: function(property, value) {
        if (value) {
          try {
            var element = document.createElement('div');
            element.style.setProperty(property, value);
            return element.style.getPropertyValue(property) === value;
          } catch (e) {
            return false;
          }
        }
        return false;
      }
    };
  }
})();