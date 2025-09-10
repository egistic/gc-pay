// Browser polyfills for missing CSS and Web APIs

// CSS Scope Rule Polyfill
export const initCSSPolyfills = () => {
  if (typeof window === 'undefined') return;

  try {
    // CSSScopeRule polyfill
    if (!('CSSScopeRule' in window)) {
      class CSSScopeRule {
        public start?: string;
        public end?: string;

        constructor(start?: string, end?: string) {
          this.start = start;
          this.end = end;
        }

        static create(start?: string, end?: string) {
          return new CSSScopeRule(start, end);
        }
      }

      Object.defineProperty(window, 'CSSScopeRule', {
        value: CSSScopeRule,
        writable: false,
        configurable: false
      });
    }

    // CSSSupports polyfill if needed
    if (!('CSS' in window) || !window.CSS.supports) {
      const CSSPolyfill = {
        supports: (property: string, value?: string) => {
          if (value) {
            try {
              const element = document.createElement('div');
              element.style.setProperty(property, value);
              return element.style.getPropertyValue(property) === value;
            } catch {
              return false;
            }
          }
          return false;
        }
      };

      if (!('CSS' in window)) {
        Object.defineProperty(window, 'CSS', {
          value: CSSPolyfill,
          writable: false,
          configurable: false
        });
      }
    }
  } catch (error) {
    console.warn('CSS polyfills initialization failed:', error);
  }
};

// Initialize polyfills immediately if in browser
if (typeof window !== 'undefined') {
  initCSSPolyfills();
}

export default initCSSPolyfills;