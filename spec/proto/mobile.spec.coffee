describe "Mobile support", ->
  describe "browser_is_supported", ->
    originalUserAgent = null
    
    beforeEach ->
      originalUserAgent = window.navigator.userAgent
    
    afterEach ->
      # Restore original userAgent
      Object.defineProperty window.navigator, 'userAgent',
        value: originalUserAgent
        writable: true
        configurable: true
    
    it "should support iPhone", ->
      # Mock iPhone user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        writable: true
        configurable: true
      
      expect(AbstractChosen.browser_is_supported()).toBe true
    
    it "should support iPad", ->
      # Mock iPad user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        writable: true
        configurable: true
      
      expect(AbstractChosen.browser_is_supported()).toBe true
    
    it "should support Android mobile", ->
      # Mock Android mobile user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36'
        writable: true
        configurable: true
      
      expect(AbstractChosen.browser_is_supported()).toBe true
    
    it "should support Windows Phone", ->
      # Mock Windows Phone user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950)'
        writable: true
        configurable: true
      
      expect(AbstractChosen.browser_is_supported()).toBe true
    
    it "should support BlackBerry", ->
      # Mock BlackBerry user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en-US)'
        writable: true
        configurable: true
      
      expect(AbstractChosen.browser_is_supported()).toBe true
