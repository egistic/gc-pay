// CSS Scope Rule Polyfill
// This polyfill ensures compatibility with environments that don't support CSSScopeRule

if (typeof window !== 'undefined' && !window.CSSScopeRule) {
  // Create a basic polyfill for CSSScopeRule
  (window as any).CSSScopeRule = class CSSScopeRule {
    constructor(public start?: string, public end?: string) {}
    
    static create(start?: string, end?: string) {
      return new (window as any).CSSScopeRule(start, end);
    }
  };
}

// Export for use in components if needed
export const ensureCSScopeRule = () => {
  if (typeof window !== 'undefined' && !window.CSSScopeRule) {
    (window as any).CSSScopeRule = class CSSScopeRule {
      constructor(public start?: string, public end?: string) {}
      
      static create(start?: string, end?: string) {
        return new (window as any).CSSScopeRule(start, end);
      }
    };
  }
};